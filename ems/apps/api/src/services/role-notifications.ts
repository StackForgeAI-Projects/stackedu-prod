import { and, eq } from 'drizzle-orm'
import type { UserRole } from '@stackedu/shared'
import type { InstitutionDb } from '../db/connection'
import { courses } from '../db/institution/schema/academic'
import { notifications } from '../db/institution/schema/communication'
import { users } from '../db/institution/schema/people'
import { students } from '../db/institution/schema/students'
import { courseOfferings, courseRegistrations } from '../db/institution/schema/teaching'

export type InAppNotificationInput = {
  userId: string
  title: string
  body: string
  category: string
  actionUrl?: string | null
  metadata?: Record<string, unknown>
}

function formatCourseCode(code: string): string {
  const match = code.match(/^([A-Za-z]+)(\d+.*)$/)
  if (!match) return code
  return `${match[1]!.toUpperCase()} ${match[2]}`
}

export async function notifyUsers(db: InstitutionDb, items: InAppNotificationInput[]): Promise<void> {
  if (items.length === 0) return
  await db.insert(notifications).values(
    items.map((item) => ({
      userId: item.userId,
      title: item.title,
      body: item.body,
      category: item.category,
      actionUrl: item.actionUrl ?? null,
      metadata: item.metadata ?? null,
    })),
  )
}

export async function notifyUserIds(
  db: InstitutionDb,
  userIds: string[],
  payload: Omit<InAppNotificationInput, 'userId'>,
): Promise<void> {
  const unique = [...new Set(userIds)]
  await notifyUsers(
    db,
    unique.map((userId) => ({ userId, ...payload })),
  )
}

export async function enrolledStudentUserIds(db: InstitutionDb, offeringId: string): Promise<string[]> {
  const rows = await db
    .select({ userId: users.id })
    .from(courseRegistrations)
    .innerJoin(students, eq(students.id, courseRegistrations.studentId))
    .innerJoin(users, eq(users.id, students.userId))
    .where(
      and(
        eq(courseRegistrations.courseOfferingId, offeringId),
        eq(courseRegistrations.status, 'Approved'),
        eq(users.isActive, true),
      ),
    )
  return rows.map((row) => row.userId)
}

export async function activeUserIdsByRole(db: InstitutionDb, role: UserRole): Promise<string[]> {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.role, role), eq(users.isActive, true)))
  return rows.map((row) => row.id)
}

async function offeringCourseSummary(
  db: InstitutionDb,
  offeringId: string,
): Promise<{ courseCode: string; courseName: string } | null> {
  const [row] = await db
    .select({ code: courses.code, name: courses.name })
    .from(courseOfferings)
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .where(eq(courseOfferings.id, offeringId))
    .limit(1)
  if (!row) return null
  return { courseCode: formatCourseCode(row.code), courseName: row.name }
}

export async function notifyEnrolledStudentsOfMaterial(
  db: InstitutionDb,
  offeringId: string,
  materialTitle: string,
  action: 'published' | 'updated',
): Promise<void> {
  const studentIds = await enrolledStudentUserIds(db, offeringId)
  if (studentIds.length === 0) return

  const course = await offeringCourseSummary(db, offeringId)
  const code = course?.courseCode ?? 'Course'
  const courseName = course?.courseName ?? 'your course'

  await notifyUserIds(db, studentIds, {
    title: action === 'published' ? `New material: ${code}` : `Material updated: ${code}`,
    body:
      action === 'published'
        ? `"${materialTitle}" was added to ${courseName}.`
        : `"${materialTitle}" in ${courseName} was updated.`,
    category: 'Course Content',
    actionUrl: `/student/course-detail?id=${offeringId}`,
  })
}

export async function notifyEnrolledStudentsOfAnnouncement(
  db: InstitutionDb,
  offeringId: string,
  announcement: { title: string; body: string },
): Promise<void> {
  const studentIds = await enrolledStudentUserIds(db, offeringId)
  if (studentIds.length === 0) return

  const course = await offeringCourseSummary(db, offeringId)
  const code = course?.courseCode ?? 'Course'

  await notifyUserIds(db, studentIds, {
    title: `${code}: ${announcement.title}`,
    body: announcement.body,
    category: 'Announcement',
    actionUrl: `/student/course-detail?id=${offeringId}`,
  })
}

export async function notifyEnrolledStudentsOfAssessment(
  db: InstitutionDb,
  offeringId: string,
  assessmentTitle: string,
): Promise<void> {
  const studentIds = await enrolledStudentUserIds(db, offeringId)
  if (studentIds.length === 0) return

  const course = await offeringCourseSummary(db, offeringId)
  const code = course?.courseCode ?? 'Course'
  const courseName = course?.courseName ?? 'your course'

  await notifyUserIds(db, studentIds, {
    title: `New assignment: ${code}`,
    body: `"${assessmentTitle}" was published for ${courseName}.`,
    category: 'Assignments',
    actionUrl: `/student/course-detail?id=${offeringId}`,
  })
}

export async function notifyAcademicAdminsOfResultSubmit(
  db: InstitutionDb,
  courseCode: string,
  courseName: string,
  submitterEmail: string,
): Promise<void> {
  await notifyUserIds(db, await activeUserIdsByRole(db, 'AcademicAdmin'), {
    title: `Results submitted: ${courseCode}`,
    body: `${submitterEmail} submitted ${courseName} results for review.`,
    category: 'Results',
    actionUrl: '/academic/results',
  })
}

export async function notifyLecturerOfResultReview(
  db: InstitutionDb,
  lecturerUserId: string,
  courseCode: string,
  courseName: string,
  action: 'approved' | 'rejected',
  reason?: string,
): Promise<void> {
  await notifyUserIds(db, [lecturerUserId], {
    title: action === 'approved' ? `Results approved: ${courseCode}` : `Results returned: ${courseCode}`,
    body:
      action === 'approved'
        ? `${courseName} results have been approved and can be published to students.`
        : reason ?? `${courseName} results were returned for revision.`,
    category: 'Results',
    actionUrl: '/lecturer/results',
  })
}
