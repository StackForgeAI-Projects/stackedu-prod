import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { and, eq } from 'drizzle-orm'
import { getInstitutionDb } from '../src/db/connection'
import { deprovisionInstitution, provisionInstitution } from '../src/db/provision'
import {
  academicYears,
  courses,
  departments,
  faculties,
  programmes,
  semesters,
} from '../src/db/institution/schema/academic'
import { resultBatches } from '../src/db/institution/schema/assessment'
import { notifications } from '../src/db/institution/schema/communication'
import { students } from '../src/db/institution/schema/students'
import {
  courseOfferings,
  courseRegistrations,
  lecturerAssignments,
} from '../src/db/institution/schema/teaching'
import {
  approveAcademicResultBatch,
  rejectAcademicResultBatch,
} from '../src/services/academic'
import {
  createLecturerAssessment,
  createLecturerMaterial,
  createLecturerModule,
  saveLecturerResults,
  submitLecturerResults,
} from '../src/services/lecturer'
import { createUser } from '../src/services/users'
import { createTestPlatform, uniqueSlug, type TestPlatform } from './helpers/test-database'

describe('role notifications', () => {
  let platform: TestPlatform

  beforeAll(async () => {
    platform = await createTestPlatform()
  })

  afterAll(async () => {
    await platform.cleanup()
  })

  async function seedCourseWithEnrollment() {
    const result = await provisionInstitution({
      name: 'Notify Flow University',
      slug: uniqueSlug('notifyflow'),
      shortName: 'NFU',
      contactEmail: 'admin@nfu.test',
    })
    const db = await getInstitutionDb(result.institutionId)

    const lecturer = await createUser({
      institutionId: result.institutionId,
      email: `lecturer-${result.slug}@nfu.test`,
      fullName: 'Notify Lecturer',
      role: 'Lecturer',
      password: 'Lecturer#2026',
    })
    const enrolledStudent = await createUser({
      institutionId: result.institutionId,
      email: `enrolled-${result.slug}@nfu.test`,
      fullName: 'Enrolled Student',
      role: 'Student',
      password: 'Student#2026',
    })
    const otherStudent = await createUser({
      institutionId: result.institutionId,
      email: `other-${result.slug}@nfu.test`,
      fullName: 'Other Student',
      role: 'Student',
      password: 'Student#2026',
    })
    const academicAdmin = await createUser({
      institutionId: result.institutionId,
      email: `academic-${result.slug}@nfu.test`,
      fullName: 'Academic Admin',
      role: 'AcademicAdmin',
      password: 'Academic#2026',
    })

    const [faculty] = await db.insert(faculties).values({ code: 'NUR', name: 'Nursing' }).returning()
    const [department] = await db
      .insert(departments)
      .values({ facultyId: faculty!.id, code: 'NUR', name: 'Nursing Science' })
      .returning()
    const [programme] = await db
      .insert(programmes)
      .values({
        departmentId: department!.id,
        code: 'BSC-NUR',
        name: 'BSc Nursing',
        level: 'Bachelor',
        durationYears: 4,
        totalCreditsRequired: 480,
      })
      .returning()
    const [year] = await db
      .insert(academicYears)
      .values({ name: '2026/2027', startDate: '2026-09-01', endDate: '2027-08-31', isCurrent: true })
      .returning()
    const [semester] = await db
      .insert(semesters)
      .values({
        academicYearId: year!.id,
        name: 'Semester 1',
        sequence: 1,
        startDate: '2026-09-01',
        endDate: '2027-01-31',
        isCurrent: true,
      })
      .returning()
    const [course] = await db
      .insert(courses)
      .values({ departmentId: department!.id, code: 'NURS101', name: 'Intro to Nursing Science', credits: 6 })
      .returning()
    const [offering] = await db
      .insert(courseOfferings)
      .values({ courseId: course!.id, semesterId: semester!.id, section: 'A' })
      .returning()
    await db.insert(lecturerAssignments).values({
      courseOfferingId: offering!.id,
      lecturerId: lecturer.id,
      isLead: true,
    })

    const [enrolledStudentRow] = await db
      .insert(students)
      .values({
        userId: enrolledStudent.id,
        studentNumber: `NFU-${result.slug.slice(-4)}-1`,
        programmeId: programme!.id,
        yearOfStudy: 1,
      })
      .returning()
    await db.insert(students).values({
      userId: otherStudent.id,
      studentNumber: `NFU-${result.slug.slice(-4)}-2`,
      programmeId: programme!.id,
      yearOfStudy: 1,
    })

    await db.insert(courseRegistrations).values({
      studentId: enrolledStudentRow!.id,
      courseOfferingId: offering!.id,
      status: 'Approved',
      registeredAt: new Date().toISOString(),
    })

    return {
      institutionId: result.institutionId,
      db,
      offeringId: offering!.id,
      lecturer,
      enrolledStudent,
      otherStudent,
      academicAdmin,
      enrolledStudentRow: enrolledStudentRow!,
      actor: { id: lecturer.id, email: lecturer.email, role: lecturer.role as 'Lecturer' },
      adminActor: {
        id: academicAdmin.id,
        email: academicAdmin.email,
        role: academicAdmin.role as 'AcademicAdmin',
      },
    }
  }

  it('notifies enrolled students when a lecturer publishes course material or assignment', async () => {
    const ctx = await seedCourseWithEnrollment()

    const module = await createLecturerModule(ctx.institutionId, ctx.actor, {
      offeringId: ctx.offeringId,
      title: 'Week 1',
      publish: true,
    })
    await createLecturerMaterial(ctx.institutionId, ctx.actor, {
      offeringId: ctx.offeringId,
      moduleId: module.id,
      title: 'Week 1 notes',
      publish: true,
    })

    await createLecturerAssessment(ctx.institutionId, ctx.actor, {
      offeringId: ctx.offeringId,
      title: 'Essay 1',
      type: 'Coursework',
      weight: 20,
      totalMarks: 100,
      publish: true,
    })

    const enrolledRows = await ctx.db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, ctx.enrolledStudent.id))
    const otherRows = await ctx.db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, ctx.otherStudent.id))
    const lecturerRows = await ctx.db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, ctx.lecturer.id))

    expect(enrolledRows.some((row) => row.category === 'Course Content')).toBe(true)
    expect(enrolledRows.some((row) => row.category === 'Assignments')).toBe(true)
    expect(enrolledRows.every((row) => row.actionUrl?.includes(ctx.offeringId))).toBe(true)
    expect(otherRows).toHaveLength(0)
    expect(lecturerRows).toHaveLength(0)

    await deprovisionInstitution(ctx.institutionId)
  })

  it('notifies academic admins when a lecturer submits results', async () => {
    const ctx = await seedCourseWithEnrollment()

    await saveLecturerResults(ctx.institutionId, ctx.actor, ctx.offeringId, {
      entries: [{ studentId: ctx.enrolledStudentRow.id, totalScore: 72 }],
    })
    await submitLecturerResults(ctx.institutionId, ctx.actor, ctx.offeringId)

    const adminRows = await ctx.db
      .select()
      .from(notifications)
      .where(
        and(eq(notifications.userId, ctx.academicAdmin.id), eq(notifications.category, 'Results')),
      )
    expect(adminRows.some((row) => row.title.includes('Results submitted'))).toBe(true)
    expect(adminRows.some((row) => row.actionUrl === '/academic/results')).toBe(true)

    await deprovisionInstitution(ctx.institutionId)
  })

  it('notifies the submitting lecturer when results are approved or rejected', async () => {
    const ctx = await seedCourseWithEnrollment()

    await saveLecturerResults(ctx.institutionId, ctx.actor, ctx.offeringId, {
      entries: [{ studentId: ctx.enrolledStudentRow.id, totalScore: 72 }],
    })
    await submitLecturerResults(ctx.institutionId, ctx.actor, ctx.offeringId)

    const [resultBatch] = await ctx.db
      .select({ id: resultBatches.id })
      .from(resultBatches)
      .where(eq(resultBatches.courseOfferingId, ctx.offeringId))
      .limit(1)

    await approveAcademicResultBatch(ctx.institutionId, ctx.adminActor, resultBatch!.id)

    const approvedRows = await ctx.db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, ctx.lecturer.id), eq(notifications.category, 'Results')))
    expect(approvedRows.some((row) => row.title.includes('Results approved'))).toBe(true)

    await deprovisionInstitution(ctx.institutionId)
  })

  it('notifies the submitting lecturer when results are rejected', async () => {
    const ctx = await seedCourseWithEnrollment()

    await saveLecturerResults(ctx.institutionId, ctx.actor, ctx.offeringId, {
      entries: [{ studentId: ctx.enrolledStudentRow.id, totalScore: 68 }],
    })
    await submitLecturerResults(ctx.institutionId, ctx.actor, ctx.offeringId)

    const [resultBatch] = await ctx.db
      .select({ id: resultBatches.id })
      .from(resultBatches)
      .where(eq(resultBatches.courseOfferingId, ctx.offeringId))
      .limit(1)

    await rejectAcademicResultBatch(ctx.institutionId, ctx.adminActor, resultBatch!.id, {
      reason: 'Please recheck the CA marks.',
    })

    const rejectedRows = await ctx.db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, ctx.lecturer.id), eq(notifications.category, 'Results')))
    expect(
      rejectedRows.some(
        (row) => row.title.includes('Results returned') && row.body.includes('recheck'),
      ),
    ).toBe(true)

    await deprovisionInstitution(ctx.institutionId)
  })
})
