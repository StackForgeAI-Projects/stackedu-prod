import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { getInstitutionDb } from '../src/db/connection'
import { provisionInstitution } from '../src/db/provision'
import { academicYears, departments, faculties, programmes, semesters } from '../src/db/institution/schema/academic'
import { notifications } from '../src/db/institution/schema/communication'
import { students } from '../src/db/institution/schema/students'
import { courseOfferings, timetableSlots } from '../src/db/institution/schema/teaching'
import { AppError } from '../src/lib/errors'
import { buildTimetableIcs, nextTimetableReminderAt } from '../src/lib/timetable-calendar'
import { createAcademicCourse } from '../src/services/academic'
import { getStudentDashboard, registerForCourses } from '../src/services/student'
import {
  cancelStudentTimetableReminder,
  processTimetableReminders,
  saveStudentTimetableReminder,
} from '../src/services/timetable-reminders'
import { createUser } from '../src/services/users'
import { createTestPlatform, uniqueSlug, type TestPlatform } from './helpers/test-database'

describe('student timetable reminders', () => {
  let platform: TestPlatform
  let institutionId: string
  let studentUserId: string
  let slotId: string

  beforeAll(async () => {
    platform = await createTestPlatform()
    const institution = await provisionInstitution({
      name: 'Timetable Test University',
      slug: uniqueSlug('ttbl'),
      shortName: 'TTU',
      contactEmail: 'registrar@ttbl.test',
    })
    institutionId = institution.institutionId

    const admin = await createUser({
      institutionId,
      email: 'admin@ttbl.test',
      fullName: 'Timetable Admin',
      role: 'AcademicAdmin',
      password: 'Correct#Horse2026',
    })
    const actor = { id: admin.id, email: admin.email, role: 'AcademicAdmin' as const }

    const student = await createUser({
      institutionId,
      email: 'student@ttbl.test',
      fullName: 'Timetable Student',
      role: 'Student',
      password: 'Correct#Horse2026',
    })
    studentUserId = student.id

    const db = await getInstitutionDb(institutionId)
    const [faculty] = await db.insert(faculties).values({ code: 'SCI', name: 'Science' }).returning({ id: faculties.id })
    const [department] = await db.insert(departments).values({
      facultyId: faculty!.id,
      code: 'CMP',
      name: 'Department of Computing',
    }).returning({ id: departments.id })
    const [programme] = await db.insert(programmes).values({
      departmentId: department!.id,
      code: 'BSC-CS',
      name: 'Computer Science',
      level: 'Bachelor',
      durationYears: 4,
      totalCreditsRequired: 480,
    }).returning({ id: programmes.id })
    await db.insert(students).values({
      userId: student.id,
      studentNumber: 'TTU-2026-0001',
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

    const created = await createAcademicCourse(institutionId, actor, {
      code: 'TMT101',
      name: 'Timetable Lab',
      departmentName: 'Department of Computing',
      credits: 3,
      semesterId: semester!.id,
      openForRegistration: true,
    })
    const [offering] = await db
      .select({ id: courseOfferings.id })
      .from(courseOfferings)
      .where(eq(courseOfferings.courseId, created.id))
      .limit(1)
    await registerForCourses(institutionId, studentUserId, { offeringIds: [offering!.id], dropOfferingIds: [] })
    const [slot] = await db
      .insert(timetableSlots)
      .values({
        courseOfferingId: offering!.id,
        dayOfWeek: 4,
        startTime: '14:00',
        endTime: '16:00',
        sessionType: 'Lecture',
      })
      .returning({ id: timetableSlots.id })
    slotId = slot!.id
  })

  afterAll(async () => {
    await platform.cleanup()
  })

  it('computes the next reminder before a Kigali class', () => {
    const from = new Date('2026-09-17T10:00:00.000Z')
    const fireAt = nextTimetableReminderAt({
      dayOfWeek: 4,
      startTime: '14:00',
      minutesBefore: 10,
      from,
    })
    expect(fireAt.toISOString()).toBe('2026-09-17T11:50:00.000Z')
  })

  it('builds a weekly calendar file for the class', () => {
    const start = new Date('2026-09-17T12:00:00.000Z')
    const ics = buildTimetableIcs({
      uid: 'timetable-demo@stackedu.rw',
      title: 'TMT101 · Timetable Lab',
      description: 'Lecture',
      location: 'Hall A',
      dayOfWeek: 4,
      start,
      end: new Date(start.getTime() + 2 * 60 * 60 * 1000),
      minutesBefore: 10,
      institutionName: 'Timetable Test University',
    })
    expect(ics).toContain('BEGIN:VEVENT')
    expect(ics).toContain('SUMMARY:TMT101 · Timetable Lab')
    expect(ics).toContain('LOCATION:Hall A')
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=TH')
    expect(ics).toContain('TRIGGER:-PT10M')
  })

  it('saves a reminder, notifies the student, and lists it on the timetable', async () => {
    const reminder = await saveStudentTimetableReminder(institutionId, studentUserId, {
      slotId,
      title: 'Bring calculator',
      minutesBefore: 10,
    })
    expect(reminder.title).toBe('Bring calculator')
    expect(reminder.minutesBefore).toBe(10)

    const dashboard = await getStudentDashboard(institutionId, studentUserId)
    expect(dashboard.schedule.find((row) => row.id === slotId)?.reminder?.title).toBe('Bring calculator')

    const db = await getInstitutionDb(institutionId)
    const notes = await db
      .select({ title: notifications.title, actionUrl: notifications.actionUrl })
      .from(notifications)
      .where(eq(notifications.userId, studentUserId))
    expect(notes.some((note) => note.title.startsWith('Reminder set:'))).toBe(true)
    expect(notes.every((note) => note.actionUrl === null || note.actionUrl.startsWith('/student'))).toBe(true)
  })

  it('fires a due reminder once and then waits until next week', async () => {
    const db = await getInstitutionDb(institutionId)
    const dashboard = await getStudentDashboard(institutionId, studentUserId)
    const nextFireAt = dashboard.schedule.find((row) => row.id === slotId)?.reminder?.nextFireAt
    expect(nextFireAt).toBeTruthy()

    const sent = await processTimetableReminders(institutionId, db, new Date(nextFireAt!))
    expect(sent).toBe(1)

    const again = await processTimetableReminders(institutionId, db, new Date(nextFireAt!))
    expect(again).toBe(0)

    const titles = await db
      .select({ title: notifications.title })
      .from(notifications)
      .where(eq(notifications.userId, studentUserId))
    expect(titles.some((note) => note.title.startsWith('Class reminder:'))).toBe(true)
  })

  it('lets the student remove a reminder and refuses a class they are not registered for', async () => {
    await cancelStudentTimetableReminder(institutionId, studentUserId, slotId)
    const dashboard = await getStudentDashboard(institutionId, studentUserId)
    expect(dashboard.schedule.find((row) => row.id === slotId)?.reminder).toBeNull()

    const missing = await saveStudentTimetableReminder(institutionId, studentUserId, {
      slotId: '00000000-0000-4000-8000-000000000001',
      title: 'Should fail',
      minutesBefore: 30,
    }).catch((cause: AppError) => cause)
    expect(missing).toBeInstanceOf(AppError)
    expect((missing as AppError).message).toContain('could not be found')
  })
})
