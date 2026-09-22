import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { getInstitutionDb } from '../src/db/connection'
import { provisionInstitution } from '../src/db/provision'
import {
  academicYears,
  courses,
  departments,
  faculties,
  programmes,
  semesters,
} from '../src/db/institution/schema/academic'
import { notifications } from '../src/db/institution/schema/communication'
import { auditLogs } from '../src/db/institution/schema/settings'
import { students } from '../src/db/institution/schema/students'
import {
  courseOfferings,
  courseRegistrations,
  lecturerAssignments,
} from '../src/db/institution/schema/teaching'
import {
  createLecturerAnnouncement,
  createLecturerMaterial,
  createLecturerModule,
  deleteLecturerAnnouncement,
  deleteLecturerModule,
  getLecturerCourse,
  updateLecturerAnnouncement,
  updateLecturerModule,
} from '../src/services/lecturer'
import {
  createLecturerDiscussion,
  deleteLecturerDiscussion,
  updateLecturerDiscussion,
} from '../src/services/discussions'
import {
  createStudentDiscussionPost,
  getStudentCourse,
  recordStudentMaterialView,
} from '../src/services/student'
import { createUser } from '../src/services/users'
import { createTestPlatform, uniqueSlug, type TestPlatform } from './helpers/test-database'

/**
 * One institution is provisioned for the whole file. Provisioning creates a
 * database and runs every migration, so doing it per test would dominate the
 * runtime of the suite.
 */
describe('course modules and announcements', () => {
  let platform: TestPlatform
  let institutionId: string
  let offeringId: string
  let db: Awaited<ReturnType<typeof getInstitutionDb>>

  let lecturerActor: { id: string; email: string; role: 'Lecturer' }
  let otherLecturerActor: { id: string; email: string; role: 'Lecturer' }
  let studentUserId: string
  let unenrolledStudentUserId: string

  beforeAll(async () => {
    platform = await createTestPlatform()

    const result = await provisionInstitution({
      name: 'Module Flow University',
      slug: uniqueSlug('moduleflow'),
      shortName: 'MFU',
      contactEmail: 'admin@mfu.test',
    })
    institutionId = result.institutionId
    db = await getInstitutionDb(institutionId)

    const lecturer = await createUser({
      institutionId,
      email: `lecturer-${result.slug}@mfu.test`,
      fullName: 'Module Lecturer',
      role: 'Lecturer',
      password: 'Lecturer#2026',
    })
    const otherLecturer = await createUser({
      institutionId,
      email: `other-lecturer-${result.slug}@mfu.test`,
      fullName: 'Unassigned Lecturer',
      role: 'Lecturer',
      password: 'Lecturer#2026',
    })
    const student = await createUser({
      institutionId,
      email: `student-${result.slug}@mfu.test`,
      fullName: 'Enrolled Student',
      role: 'Student',
      password: 'Student#2026',
    })
    const unenrolled = await createUser({
      institutionId,
      email: `unenrolled-${result.slug}@mfu.test`,
      fullName: 'Unenrolled Student',
      role: 'Student',
      password: 'Student#2026',
    })

    lecturerActor = { id: lecturer.id, email: lecturer.email, role: 'Lecturer' }
    otherLecturerActor = { id: otherLecturer.id, email: otherLecturer.email, role: 'Lecturer' }
    studentUserId = student.id
    unenrolledStudentUserId = unenrolled.id

    const [faculty] = await db.insert(faculties).values({ code: 'SCI', name: 'Science' }).returning()
    const [department] = await db
      .insert(departments)
      .values({ facultyId: faculty!.id, code: 'CS', name: 'Computer Science' })
      .returning()
    const [programme] = await db
      .insert(programmes)
      .values({
        departmentId: department!.id,
        code: 'BSC-CS',
        name: 'BSc Computer Science',
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
      .values({ departmentId: department!.id, code: 'CS101', name: 'Programming Basics', credits: 6 })
      .returning()
    const [offering] = await db
      .insert(courseOfferings)
      .values({ courseId: course!.id, semesterId: semester!.id, section: 'A' })
      .returning()
    offeringId = offering!.id

    await db
      .insert(lecturerAssignments)
      .values({ courseOfferingId: offeringId, lecturerId: lecturer.id, isLead: true })

    const [studentRow] = await db
      .insert(students)
      .values({
        userId: student.id,
        studentNumber: `MFU-${result.slug.slice(-4)}-1`,
        programmeId: programme!.id,
        yearOfStudy: 1,
      })
      .returning()
    await db.insert(students).values({
      userId: unenrolled.id,
      studentNumber: `MFU-${result.slug.slice(-4)}-2`,
      programmeId: programme!.id,
      yearOfStudy: 1,
    })

    await db.insert(courseRegistrations).values({
      studentId: studentRow!.id,
      courseOfferingId: offeringId,
      status: 'Approved',
      registeredAt: new Date().toISOString(),
    })
  })

  afterAll(async () => {
    await platform.cleanup()
  })

  describe('a lecturer organising a course', () => {
    it('creates modules that appear on the course in sequence order', async () => {
      const first = await createLecturerModule(institutionId, lecturerActor, {
        offeringId,
        title: 'Week 1: Getting started',
        summary: 'Set up your tools.',
        publish: true,
      })
      const second = await createLecturerModule(institutionId, lecturerActor, {
        offeringId,
        title: 'Week 2: Variables',
        publish: true,
      })

      expect(first.sequence).toBe(0)
      expect(second.sequence).toBe(1)

      const course = await getLecturerCourse(institutionId, lecturerActor.id, offeringId)
      expect(course.modules.map((row) => row.title)).toEqual([
        'Week 1: Getting started',
        'Week 2: Variables',
      ])
    })

    it('files a material under a module and counts it', async () => {
      const courseModule = await createLecturerModule(institutionId, lecturerActor, {
        offeringId,
        title: 'Week 3: Loops',
        publish: true,
      })

      await createLecturerMaterial(institutionId, lecturerActor, {
        offeringId,
        moduleId: courseModule.id,
        title: 'Loops explained',
        bodyText: 'A loop repeats a block of code.',
        publish: true,
      })

      const course = await getLecturerCourse(institutionId, lecturerActor.id, offeringId)
      const saved = course.modules.find((row) => row.id === courseModule.id)
      expect(saved?.materialCount).toBe(1)

      const material = course.materials.find((row) => row.title === 'Loops explained')
      expect(material?.moduleId).toBe(courseModule.id)
      expect(material?.bodyText).toBe('A loop repeats a block of code.')
    })

    it('keeps the materials when a module is deleted', async () => {
      const courseModule = await createLecturerModule(institutionId, lecturerActor, {
        offeringId,
        title: 'Week 4: Temporary',
        publish: true,
      })
      const material = await createLecturerMaterial(institutionId, lecturerActor, {
        offeringId,
        moduleId: courseModule.id,
        title: 'Survives its module',
        bodyText: 'Still here.',
        publish: true,
      })

      await deleteLecturerModule(institutionId, lecturerActor, courseModule.id)

      const course = await getLecturerCourse(institutionId, lecturerActor.id, offeringId)
      expect(course.modules.some((row) => row.id === courseModule.id)).toBe(false)

      const kept = course.materials.find((row) => row.id === material.id)
      expect(kept).toBeDefined()
      expect(kept?.moduleId).toBeNull()
    })

    it('refuses a prerequisite that would loop back on itself', async () => {
      const a = await createLecturerModule(institutionId, lecturerActor, {
        offeringId,
        title: 'Loop check A',
      })
      const b = await createLecturerModule(institutionId, lecturerActor, {
        offeringId,
        title: 'Loop check B',
        prerequisiteModuleId: a.id,
      })

      await expect(
        updateLecturerModule(institutionId, lecturerActor, a.id, { prerequisiteModuleId: b.id }),
      ).rejects.toThrow(/loop/i)

      await expect(
        updateLecturerModule(institutionId, lecturerActor, a.id, { prerequisiteModuleId: a.id }),
      ).rejects.toThrow(/own prerequisite/i)
    })

    it('refuses a prerequisite belonging to another course', async () => {
      const [otherOffering] = await db
        .select({ id: courseOfferings.id })
        .from(courseOfferings)
        .where(eq(courseOfferings.id, offeringId))
      expect(otherOffering).toBeDefined()

      await expect(
        createLecturerModule(institutionId, lecturerActor, {
          offeringId,
          title: 'Bad prerequisite',
          prerequisiteModuleId: '00000000-0000-4000-8000-000000000000',
        }),
      ).rejects.toThrow(/prerequisite module from this course/i)
    })
  })

  describe('per-course announcements', () => {
    it('posts an announcement and notifies only enrolled students', async () => {
      const before = await db
        .select({ id: notifications.id })
        .from(notifications)
        .where(eq(notifications.userId, studentUserId))

      const announcement = await createLecturerAnnouncement(institutionId, lecturerActor, {
        offeringId,
        title: 'Lab moved to Thursday',
        body: 'This week only, the lab runs on Thursday at 10:00.',
        publish: true,
      })

      expect(announcement.publishedAt).not.toBeNull()

      const after = await db
        .select({ id: notifications.id })
        .from(notifications)
        .where(eq(notifications.userId, studentUserId))
      expect(after.length).toBe(before.length + 1)

      const unenrolledNotifications = await db
        .select({ id: notifications.id })
        .from(notifications)
        .where(eq(notifications.userId, unenrolledStudentUserId))
      expect(unenrolledNotifications).toHaveLength(0)
    })

    it('keeps a draft out of the student feed until it is published', async () => {
      const draft = await createLecturerAnnouncement(institutionId, lecturerActor, {
        offeringId,
        title: 'Not ready yet',
        body: 'Draft body.',
        publish: false,
      })
      expect(draft.publishedAt).toBeNull()

      let course = await getStudentCourse(institutionId, studentUserId, offeringId)
      expect(course.announcements.some((row) => row.id === draft.id)).toBe(false)

      await updateLecturerAnnouncement(institutionId, lecturerActor, draft.id, { publish: true })

      course = await getStudentCourse(institutionId, studentUserId, offeringId)
      expect(course.announcements.some((row) => row.id === draft.id)).toBe(true)

      await deleteLecturerAnnouncement(institutionId, lecturerActor, draft.id)
      course = await getStudentCourse(institutionId, studentUserId, offeringId)
      expect(course.announcements.some((row) => row.id === draft.id)).toBe(false)
    })

    it('writes a plain-English audit entry for a posted announcement', async () => {
      await createLecturerAnnouncement(institutionId, lecturerActor, {
        offeringId,
        title: 'Reading list published',
        body: 'The reading list is now on the course page.',
        publish: true,
      })

      const rows = await db
        .select({ action: auditLogs.action, metadata: auditLogs.metadata })
        .from(auditLogs)
        .where(eq(auditLogs.action, 'course.announcement.publish'))

      expect(rows.length).toBeGreaterThan(0)
      expect(
        rows.some((row) => (row.metadata as { title?: string })?.title === 'Reading list published'),
      ).toBe(true)
    })
  })

  describe('a student working through a locked module', () => {
    it('holds a module shut until its prerequisite is finished, then opens it', async () => {
      const intro = await createLecturerModule(institutionId, lecturerActor, {
        offeringId,
        title: 'Foundations',
        publish: true,
      })
      const advanced = await createLecturerModule(institutionId, lecturerActor, {
        offeringId,
        title: 'Advanced topics',
        prerequisiteModuleId: intro.id,
        publish: true,
      })

      const introMaterial = await createLecturerMaterial(institutionId, lecturerActor, {
        offeringId,
        moduleId: intro.id,
        title: 'Read this first',
        bodyText: 'Foundations reading.',
        publish: true,
      })
      await createLecturerMaterial(institutionId, lecturerActor, {
        offeringId,
        moduleId: advanced.id,
        title: 'Advanced reading',
        bodyText: 'Only after the foundations.',
        publish: true,
      })

      let course = await getStudentCourse(institutionId, studentUserId, offeringId)
      let locked = course.modules.find((row) => row.id === advanced.id)
      expect(locked?.isLocked).toBe(true)
      expect(locked?.lockedReason).toContain('Foundations')
      expect(locked?.viewedCount).toBe(0)

      await recordStudentMaterialView(institutionId, studentUserId, introMaterial.id)

      course = await getStudentCourse(institutionId, studentUserId, offeringId)
      locked = course.modules.find((row) => row.id === advanced.id)
      expect(locked?.isLocked).toBe(false)
      expect(locked?.lockedReason).toBeNull()

      const finished = course.modules.find((row) => row.id === intro.id)
      expect(finished?.viewedCount).toBe(finished?.materialCount)
    })

    it('refuses to open a material inside a locked module', async () => {
      const gate = await createLecturerModule(institutionId, lecturerActor, {
        offeringId,
        title: 'Gate module',
        publish: true,
      })
      const behind = await createLecturerModule(institutionId, lecturerActor, {
        offeringId,
        title: 'Behind the gate',
        prerequisiteModuleId: gate.id,
        publish: true,
      })

      await createLecturerMaterial(institutionId, lecturerActor, {
        offeringId,
        moduleId: gate.id,
        title: 'Gate reading',
        bodyText: 'Read to pass the gate.',
        publish: true,
      })
      const hidden = await createLecturerMaterial(institutionId, lecturerActor, {
        offeringId,
        moduleId: behind.id,
        title: 'Locked reading',
        bodyText: 'Should not be reachable yet.',
        publish: true,
      })

      await expect(
        recordStudentMaterialView(institutionId, studentUserId, hidden.id),
      ).rejects.toThrow(/Gate module/i)

      const course = await getStudentCourse(institutionId, studentUserId, offeringId)
      const hiddenRow = course.materials.find((row) => row.id === hidden.id)
      expect(hiddenRow?.title).toBe('Locked reading')
      expect(hiddenRow?.bodyText).toBeNull()
    })
  })

  describe('permission boundaries', () => {
    it('stops a lecturer who is not assigned to the course', async () => {
      await expect(
        createLecturerModule(institutionId, otherLecturerActor, {
          offeringId,
          title: 'Not my course',
        }),
      ).rejects.toThrow(/not assigned/i)

      await expect(
        createLecturerAnnouncement(institutionId, otherLecturerActor, {
          offeringId,
          title: 'Not my course',
          body: 'Should never post.',
        }),
      ).rejects.toThrow(/not assigned/i)
    })

    it('stops an unassigned lecturer editing another lecturer module', async () => {
      const courseModule = await createLecturerModule(institutionId, lecturerActor, {
        offeringId,
        title: 'Owned by the assigned lecturer',
      })

      await expect(
        updateLecturerModule(institutionId, otherLecturerActor, courseModule.id, { title: 'Hijacked' }),
      ).rejects.toThrow(/not assigned/i)

      await expect(
        deleteLecturerModule(institutionId, otherLecturerActor, courseModule.id),
      ).rejects.toThrow(/not assigned/i)
    })

    it('refuses material that is not attached to a module', async () => {
      await expect(
        createLecturerMaterial(institutionId, lecturerActor, {
          offeringId,
          title: 'No module',
          bodyText: 'Should not save.',
          publish: true,
        }),
      ).rejects.toThrow(/module/i)
    })

    it('stops a student who is not enrolled from recording a view', async () => {
      const courseModule = await createLecturerModule(institutionId, lecturerActor, {
        offeringId,
        title: 'Restricted reading',
        publish: true,
      })
      const material = await createLecturerMaterial(institutionId, lecturerActor, {
        offeringId,
        moduleId: courseModule.id,
        title: 'Enrolled students only',
        bodyText: 'Restricted.',
        publish: true,
      })

      await expect(
        recordStudentMaterialView(institutionId, unenrolledStudentUserId, material.id),
      ).rejects.toThrow(/not enrolled/i)
    })

    it('lets a lecturer start a discussion that enrolled students can reply to', async () => {
      const thread = await createLecturerDiscussion(institutionId, lecturerActor, {
        offeringId,
        title: 'Week 1 ideas',
        prompt: 'What is an algorithm, in your own words?',
        publish: true,
      })
      const course = await getStudentCourse(institutionId, studentUserId, offeringId)
      expect(course.discussions.some((row) => row.id === thread.id)).toBe(true)

      const replied = await createStudentDiscussionPost(institutionId, studentUserId, thread.id, {
        body: 'A set of steps a machine can follow.',
      })
      expect(replied.posts).toHaveLength(1)
      expect(replied.posts[0]?.body).toMatch(/steps/)

      await expect(deleteLecturerDiscussion(institutionId, lecturerActor, thread.id)).rejects.toThrow(/already posted/i)
      const closed = await updateLecturerDiscussion(institutionId, lecturerActor, thread.id, { close: true })
      expect(closed.closedAt).toBeTruthy()
      await expect(
        createStudentDiscussionPost(institutionId, studentUserId, thread.id, { body: 'Too late.' }),
      ).rejects.toThrow(/closed/i)
    })

    it('hides a draft discussion and creates a grade column when it is graded', async () => {
      const draft = await createLecturerDiscussion(institutionId, lecturerActor, {
        offeringId,
        title: 'Private prompt',
        prompt: 'Only staff should see this yet.',
        publish: false,
      })
      const before = await getStudentCourse(institutionId, studentUserId, offeringId)
      expect(before.discussions.some((row) => row.id === draft.id)).toBe(false)

      const graded = await createLecturerDiscussion(institutionId, lecturerActor, {
        offeringId,
        title: 'Graded forum',
        prompt: 'Argue for or against a loop.',
        publish: true,
        graded: true,
        weight: 5,
      })
      expect(graded.graded).toBe(true)
      expect(graded.assessmentId).toBeTruthy()
      const lecturerCourse = await getLecturerCourse(institutionId, lecturerActor.id, offeringId)
      expect(lecturerCourse.assessments.some((row) => row.id === graded.assessmentId)).toBe(true)

      await expect(
        createLecturerDiscussion(institutionId, otherLecturerActor, {
          offeringId,
          title: 'Not mine',
          prompt: 'Should fail.',
        }),
      ).rejects.toThrow(/not assigned/i)
    })
  })
})
