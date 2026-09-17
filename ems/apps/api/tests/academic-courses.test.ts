import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { LECTURER_ASSIGNMENT_REQUIRES_SEMESTER } from '@stackedu/shared'
import { getInstitutionDb } from '../src/db/connection'
import { provisionInstitution } from '../src/db/provision'
import { academicYears, courses, departments, faculties, programmes, semesters, academicCalendarEvents } from '../src/db/institution/schema/academic'
import { notifications } from '../src/db/institution/schema/communication'
import { students } from '../src/db/institution/schema/students'
import { AppError } from '../src/lib/errors'
import {
  createAcademicCourse,
  deleteAcademicCourse,
  createAcademicCalendarEvent,
  deleteAcademicCalendarEvent,
  listAcademicSemesters,
  updateAcademicCalendarEvent,
  updateAcademicCourse,
} from '../src/services/academic'
import { getRegistrationState, registerForCourses } from '../src/services/student'
import { createUser } from '../src/services/users'
import { createTestPlatform, uniqueSlug, type TestPlatform } from './helpers/test-database'

describe('academic courses', () => {
  let platform: TestPlatform
  let institutionId: string
  let actor: { id: string; email: string; role: 'AcademicAdmin' }
  let lecturerId: string
  let semesterId: string
  let studentUserId: string
  let departmentId: string

  beforeAll(async () => {
    platform = await createTestPlatform()

    const institution = await provisionInstitution({
      name: 'Course Test University',
      slug: uniqueSlug('courses'),
      shortName: 'CTU',
      contactEmail: 'registrar@courses.test',
    })
    institutionId = institution.institutionId

    const admin = await createUser({
      institutionId,
      email: 'admin@courses.test',
      fullName: 'Course Admin',
      role: 'AcademicAdmin',
      password: 'Correct#Horse2026',
    })
    actor = { id: admin.id, email: admin.email, role: 'AcademicAdmin' }

    const lecturer = await createUser({
      institutionId,
      email: 'lecturer@courses.test',
      fullName: 'Course Lecturer',
      role: 'Lecturer',
      password: 'Correct#Horse2026',
    })
    lecturerId = lecturer.id

    const db = await getInstitutionDb(institutionId)
    const [faculty] = await db.insert(faculties).values({ code: 'SCI', name: 'Science' }).returning({ id: faculties.id })
    const [department] = await db.insert(departments).values({
      facultyId: faculty!.id,
      code: 'CMP',
      name: 'Department of Computing',
    }).returning({ id: departments.id })
    departmentId = department!.id

    const [programme] = await db.insert(programmes).values({
      departmentId,
      code: 'BSC-CS',
      name: 'Computer Science',
      level: 'Bachelor',
      durationYears: 4,
      totalCreditsRequired: 480,
    }).returning({ id: programmes.id })

    const student = await createUser({
      institutionId,
      email: 'student@courses.test',
      fullName: 'Course Student',
      role: 'Student',
      password: 'Correct#Horse2026',
    })
    studentUserId = student.id
    await db.insert(students).values({
      userId: student.id,
      studentNumber: 'CTU-2026-0001',
      programmeId: programme!.id,
      yearOfStudy: 1,
    })

    const [year] = await db
      .insert(academicYears)
      .values({ name: '2026/2027', startDate: '2026-09-01', endDate: '2027-08-31', isCurrent: true })
      .returning({ id: academicYears.id })
    const [semester] = await db
      .insert(semesters)
      .values({
        academicYearId: year!.id,
        name: 'Semester 1',
        sequence: 1,
        startDate: '2026-09-01',
        endDate: '2027-01-31',
        isCurrent: true,
        status: 'Open',
      })
      .returning({ id: semesters.id })
    semesterId = semester!.id
  })

  afterAll(async () => {
    await platform.cleanup()
  })

  it('creates a catalogue course without a lecturer or semester', async () => {
    const created = await createAcademicCourse(institutionId, actor, {
      code: 'CMP101',
      name: 'Intro to Computing',
      departmentName: 'Department of Computing',
      credits: 3,
    })

    expect(created.code).toBe('CMP 101')

    const db = await getInstitutionDb(institutionId)
    const [row] = await db.select({ id: courses.id }).from(courses).where(eq(courses.code, 'CMP101'))
    expect(row?.id).toBe(created.id)
  })

  it('does not create a course when a lecturer is assigned without a semester', async () => {
    const error = await createAcademicCourse(institutionId, actor, {
      code: 'CMP102',
      name: 'Data Structures',
      departmentName: 'Department of Computing',
      credits: 4,
      lecturerId,
    }).catch((cause: AppError) => cause)

    expect(error).toBeInstanceOf(AppError)
    expect((error as AppError).message).toBe(LECTURER_ASSIGNMENT_REQUIRES_SEMESTER)

    const db = await getInstitutionDb(institutionId)
    const rows = await db.select({ id: courses.id }).from(courses).where(eq(courses.code, 'CMP102'))
    expect(rows).toHaveLength(0)
  })

  it('creates a course with a lecturer when a semester is selected', async () => {
    const created = await createAcademicCourse(institutionId, actor, {
      code: 'CMP103',
      name: 'Algorithms',
      departmentName: 'Department of Computing',
      credits: 4,
      lecturerId,
      semesterId,
    })

    expect(created.lecturerId).toBe(lecturerId)
  })

  it('lets an academic admin delete a course with no enrolments', async () => {
    const created = await createAcademicCourse(institutionId, actor, {
      code: 'CMP104',
      name: 'Temporary Course',
      departmentName: 'Department of Computing',
      credits: 2,
    })

    await deleteAcademicCourse(institutionId, actor, created.id)

    const db = await getInstitutionDb(institutionId)
    const rows = await db.select({ id: courses.id }).from(courses).where(eq(courses.id, created.id))
    expect(rows).toHaveLength(0)
  })

  it('creates a semester record when a Semester calendar event is added', async () => {
    await createAcademicCalendarEvent(institutionId, actor, {
      title: 'First Semester',
      category: 'Semester',
      startDate: '2026-09-07',
      endDate: '2026-11-27',
      description: 'First Semester of the new session begins',
    })

    const listed = await listAcademicSemesters(institutionId)
    expect(listed.some((semester) => semester.label.includes('First Semester'))).toBe(true)

    const db = await getInstitutionDb(institutionId)
    const [linked] = await db
      .select({ semesterId: academicCalendarEvents.semesterId })
      .from(academicCalendarEvents)
      .where(eq(academicCalendarEvents.title, 'First Semester'))
      .limit(1)
    expect(linked?.semesterId).toBeTruthy()
  })

  it('does not list non-semester calendar events in the semester dropdown', async () => {
    await createAcademicCalendarEvent(institutionId, actor, {
      title: 'Orientation day',
      category: 'Registration',
      startDate: '2026-09-01',
      endDate: '2026-09-01',
    })

    const listed = await listAcademicSemesters(institutionId)
    expect(listed.some((semester) => semester.label.includes('Orientation day'))).toBe(false)
  })

  it('removes a semester from the dropdown when its Semester calendar event is deleted', async () => {
    const event = await createAcademicCalendarEvent(institutionId, actor, {
      title: 'Second Semester',
      category: 'Semester',
      startDate: '2027-01-12',
      endDate: '2027-04-30',
    })

    expect((await listAcademicSemesters(institutionId)).some((s) => s.label.includes('Second Semester'))).toBe(true)

    await deleteAcademicCalendarEvent(institutionId, actor, event.id)

    expect((await listAcademicSemesters(institutionId)).some((s) => s.label.includes('Second Semester'))).toBe(false)
  })

  it('closes a course for registration, notifies students, and rejects a tick until it is opened', async () => {
    const current = (await listAcademicSemesters(institutionId)).find((row) => row.isCurrent)
    expect(current?.id).toBeTruthy()

    const created = await createAcademicCourse(institutionId, actor, {
      code: 'CMP201',
      name: 'Operating Systems',
      departmentName: 'Department of Computing',
      credits: 3,
      lecturerId,
      semesterId: current!.id,
      openForRegistration: true,
    })

    expect(created.openForRegistration).toBe(true)
    expect(created.semesterId).toBe(current!.id)

    const openState = await getRegistrationState(institutionId, studentUserId)
    const offering = openState.offerings.find((row) => row.offeringId && row.name === 'Operating Systems')
    expect(offering?.openForRegistration).toBe(true)
    expect(openState.registrationOpen).toBe(true)

    await updateAcademicCourse(institutionId, actor, created.id, {
      semesterId: current!.id,
      openForRegistration: false,
    })

    const closedState = await getRegistrationState(institutionId, studentUserId)
    expect(closedState.offerings.find((row) => row.name === 'Operating Systems')?.openForRegistration).toBe(false)

    const closedError = await registerForCourses(institutionId, studentUserId, {
      offeringIds: [offering!.offeringId],
    }).catch((cause: AppError) => cause)
    expect(closedError).toBeInstanceOf(AppError)
    expect((closedError as AppError).message).toBe('That course is closed for registration.')

    await updateAcademicCourse(institutionId, actor, created.id, {
      semesterId: current!.id,
      openForRegistration: true,
    })

    await registerForCourses(institutionId, studentUserId, {
      offeringIds: [offering!.offeringId],
    })

    const registered = await getRegistrationState(institutionId, studentUserId)
    expect(registered.offerings.find((row) => row.name === 'Operating Systems')?.registered).toBe(true)

    const db = await getInstitutionDb(institutionId)
    const notes = await db
      .select({ title: notifications.title, category: notifications.category })
      .from(notifications)
      .where(eq(notifications.userId, studentUserId))
    expect(notes.some((note) => note.title === 'New course: CMP 201')).toBe(true)
    expect(notes.some((note) => note.title === 'Registration closed: CMP 201')).toBe(true)
    expect(notes.some((note) => note.title === 'Registration open: CMP 201')).toBe(true)
  })

  it('lets an academic admin edit a calendar event and notifies students', async () => {
    const event = await createAcademicCalendarEvent(institutionId, actor, {
      title: 'Library induction',
      category: 'Holiday',
      startDate: '2026-09-20',
      endDate: '2026-09-20',
      description: 'Optional visit',
    })

    const updated = await updateAcademicCalendarEvent(institutionId, actor, event.id, {
      title: 'Library induction week',
      description: 'Hall A',
    })
    expect(updated.title).toBe('Library induction week')
    expect(updated.description).toBe('Hall A')

    const db = await getInstitutionDb(institutionId)
    const notes = await db
      .select({ title: notifications.title, category: notifications.category })
      .from(notifications)
      .where(eq(notifications.userId, studentUserId))
    expect(notes.some((note) => note.title === 'Calendar: Library induction')).toBe(true)
    expect(notes.some((note) => note.title === 'Calendar updated: Library induction week')).toBe(true)
  })
})
