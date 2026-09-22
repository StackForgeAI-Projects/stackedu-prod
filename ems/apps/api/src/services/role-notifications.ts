import { and, eq } from 'drizzle-orm'
import {
  formatAppDateDdMmYyyy,
  formatAppDateTimeDdMmYyyy,
  formatDurationUntil,
  formatRetentionWindow,
  type RecordingRetention,
  type UserRole,
} from '@stackedu/shared'
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

async function notifyStudentsAndLecturers(
  db: InstitutionDb,
  payload: Omit<InAppNotificationInput, 'userId' | 'actionUrl'>,
  actionUrls: { student: string; lecturer: string },
): Promise<void> {
  const [studentIds, lecturerIds] = await Promise.all([
    activeUserIdsByRole(db, 'Student'),
    activeUserIdsByRole(db, 'Lecturer'),
  ])
  await notifyUserIds(db, studentIds, { ...payload, actionUrl: actionUrls.student })
  await notifyUserIds(db, lecturerIds, { ...payload, actionUrl: actionUrls.lecturer })
}

export async function notifyCourseCatalogueChange(
  db: InstitutionDb,
  input: {
    code: string
    name: string
    kind: 'created' | 'updated' | 'opened' | 'closed'
  },
): Promise<void> {
  const code = formatCourseCode(input.code)
  const copy =
    input.kind === 'created'
      ? {
          title: `New course: ${code}`,
          body: `${input.name} was added to the course catalogue.`,
        }
      : input.kind === 'updated'
        ? {
            title: `Course updated: ${code}`,
            body: `${input.name} was updated in the course catalogue.`,
          }
        : input.kind === 'opened'
          ? {
              title: `Registration open: ${code}`,
              body: `${input.name} is now open for registration.`,
            }
          : {
              title: `Registration closed: ${code}`,
              body: `${input.name} is closed for registration.`,
            }

  await notifyStudentsAndLecturers(db, { ...copy, category: 'Registration' }, {
    student: '/student/course-registration',
    lecturer: '/lecturer/courses',
  })
}

export async function notifyAcademicCalendarChange(
  db: InstitutionDb,
  input: {
    title: string
    kind: 'created' | 'updated'
    startDate: string
    endDate: string | null
  },
): Promise<void> {
  const start = formatAppDateDdMmYyyy(input.startDate)
  const end = input.endDate ? formatAppDateDdMmYyyy(input.endDate) : start
  const range = end === start ? start : `${start} – ${end}`
  const copy =
    input.kind === 'created'
      ? {
          title: `Calendar: ${input.title}`,
          body: `${input.title} was added to the academic calendar (${range}).`,
        }
      : {
          title: `Calendar updated: ${input.title}`,
          body: `${input.title} was updated on the academic calendar (${range}).`,
        }

  await notifyStudentsAndLecturers(db, { ...copy, category: 'Calendar' }, {
    student: '/student/dashboard',
    lecturer: '/lecturer/dashboard',
  })
}

export async function notifyEnrolledStudentsOfRecording(
  db: InstitutionDb,
  input: {
    offeringId: string
    sessionId: string
    title: string
    courseCode: string
    kind: 'ready' | 'reminder'
    expiresAt: string
    policy: RecordingRetention
  },
): Promise<void> {
  const studentIds = await enrolledStudentUserIds(db, input.offeringId)
  if (studentIds.length === 0) return
  const code = formatCourseCode(input.courseCode)
  const until = formatAppDateTimeDdMmYyyy(input.expiresAt)
  const window = formatRetentionWindow(input.policy)
  const remaining = formatDurationUntil(Date.now(), new Date(input.expiresAt).getTime())
  await notifyUserIds(db, studentIds, {
    title: input.kind === 'ready' ? `Class recording: ${code}` : `Recording ends soon: ${code}`,
    body:
      input.kind === 'ready'
        ? `Download the recording for "${input.title}". It will not be available after ${until} (${window}).`
        : `The recording for "${input.title}" will be removed in ${remaining}. Download it before ${until}.`,
    category: 'Classroom',
    actionUrl: `/student/classroom-session?id=${input.sessionId}`,
    metadata: { sessionId: input.sessionId, kind: input.kind, expiresAt: input.expiresAt },
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
        ? `${courseName} results have been approved and published to students.`
        : reason ?? `${courseName} results were returned for revision.`,
    category: 'Results',
    actionUrl: '/lecturer/results',
  })
}

function timetablePlace(room: string | null): string {
  return room ? ` in ${room}` : ''
}

export async function notifyLecturerToConfirmTimetable(
  db: InstitutionDb,
  input: {
    lecturerId: string
    courseCode: string
    courseName: string
    when: string
    room: string | null
  },
): Promise<void> {
  const code = formatCourseCode(input.courseCode)
  await notifyUsers(db, [{
    userId: input.lecturerId,
    title: `Confirm your class: ${code}`,
    body: `${input.courseName} is set for ${input.when}${timetablePlace(input.room)}. Confirm you are free, or ask for a different time.`,
    category: 'Timetable',
    actionUrl: '/lecturer/timetable',
  }])
}

export async function notifyStudentsTimetableLive(
  db: InstitutionDb,
  offeringId: string,
  input: { courseCode: string; courseName: string; when: string; room: string | null },
): Promise<void> {
  const studentIds = await enrolledStudentUserIds(db, offeringId)
  if (studentIds.length === 0) return
  const code = formatCourseCode(input.courseCode)
  await notifyUserIds(db, studentIds, {
    title: `Class on your timetable: ${code}`,
    body: `${input.courseName} is on ${input.when}${timetablePlace(input.room)}.`,
    category: 'Timetable',
    actionUrl: '/student/timetable',
  })
}

export async function notifyAcademicAdminsOfTimetableChange(
  db: InstitutionDb,
  input: { courseCode: string; lecturerName: string; when: string; reason: string },
): Promise<void> {
  const code = formatCourseCode(input.courseCode)
  await notifyUserIds(db, await activeUserIdsByRole(db, 'AcademicAdmin'), {
    title: `Timetable change requested: ${code}`,
    body: `${input.lecturerName} asked to change ${input.when}. Reason: ${input.reason}`,
    category: 'Timetable',
    actionUrl: '/academic/timetable',
  })
}

export async function notifyAcademicAdminsOfApplicationDocument(
  db: InstitutionDb,
  input: {
    applicationId: string
    applicantName: string
    documentLabel: string
    fileName: string
  },
): Promise<void> {
  await notifyUserIds(db, await activeUserIdsByRole(db, 'AcademicAdmin'), {
    title: `Document uploaded: ${input.applicantName}`,
    body: `${input.applicantName} uploaded ${input.documentLabel} (${input.fileName}).`,
    category: 'Applications',
    actionUrl: `/academic/application?id=${input.applicationId}`,
  })
}
