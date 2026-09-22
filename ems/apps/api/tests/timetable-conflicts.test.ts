import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { timetableTimesOverlap } from '@stackedu/shared'
import { getInstitutionDb } from '../src/db/connection'
import { provisionInstitution } from '../src/db/provision'
import { academicYears, departments, faculties, programmes, semesters } from '../src/db/institution/schema/academic'
import { students } from '../src/db/institution/schema/students'
import { courseOfferings, courseRegistrations, rooms } from '../src/db/institution/schema/teaching'
import { AppError } from '../src/lib/errors'
import {
  askLecturerToFreeTimetableSlot,
  createAcademicCourse,
  createAcademicTimetableSlot,
  listAcademicTimetableSlots,
  updateAcademicTimetableSlot,
} from '../src/services/academic'
import { notifications } from '../src/db/institution/schema/communication'
import { confirmLecturerTimetableSlot, requestLecturerTimetableChange } from '../src/services/lecturer'
import { getStudentDashboard } from '../src/services/student'
import { createUser } from '../src/services/users'
import { createTestPlatform, uniqueSlug, type TestPlatform } from './helpers/test-database'

describe('timetable slot clashes', () => {
  let platform: TestPlatform
  let institutionId: string
  let lecturerActor: { id: string; email: string; role: 'Lecturer' }
  let adminActor: { id: string; email: string; role: 'AcademicAdmin' }
  let lecturerTwoId: string
  let offeringA: string
  let offeringB: string
  let offeringC: string
  let hallA: string
  let lab3: string

  beforeAll(async () => {
    platform = await createTestPlatform()
    const institution = await provisionInstitution({
      name: 'Clash Test University',
      slug: uniqueSlug('clash'),
      shortName: 'CLU',
      contactEmail: 'registrar@clash.test',
    })
    institutionId = institution.institutionId

    const admin = await createUser({
      institutionId,
      email: 'admin@clash.test',
      fullName: 'Clash Admin',
      role: 'AcademicAdmin',
      password: 'Correct#Horse2026',
    })
    const adminActorLocal = { id: admin.id, email: admin.email, role: 'AcademicAdmin' as const }
    adminActor = adminActorLocal

    const lecturer = await createUser({
      institutionId,
      email: 'lecturer@clash.test',
      fullName: 'Clash Lecturer',
      role: 'Lecturer',
      password: 'Correct#Horse2026',
    })
    lecturerActor = { id: lecturer.id, email: lecturer.email, role: 'Lecturer' }

    const lecturerTwo = await createUser({
      institutionId,
      email: 'lecturer2@clash.test',
      fullName: 'Second Lecturer',
      role: 'Lecturer',
      password: 'Correct#Horse2026',
    })
    lecturerTwoId = lecturerTwo.id

    const db = await getInstitutionDb(institutionId)
    const [faculty] = await db.insert(faculties).values({ code: 'SCI', name: 'Science' }).returning({ id: faculties.id })
    const [department] = await db.insert(departments).values({
      facultyId: faculty!.id,
      code: 'CMP',
      name: 'Department of Computing',
    }).returning({ id: departments.id })
    await db.insert(programmes).values({
      departmentId: department!.id,
      code: 'BSC-CS',
      name: 'Computer Science',
      level: 'Bachelor',
      durationYears: 4,
      totalCreditsRequired: 480,
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

    const [hall] = await db.insert(rooms).values({ code: 'HALLA', name: 'Hall A' }).returning({ id: rooms.id })
    const [lab] = await db.insert(rooms).values({ code: 'LAB3', name: 'Lab 3' }).returning({ id: rooms.id })
    hallA = hall!.id
    lab3 = lab!.id

    async function offeringFor(code: string, name: string, lecturerId: string) {
      const created = await createAcademicCourse(institutionId, adminActor, {
        code,
        name,
        departmentName: 'Department of Computing',
        credits: 3,
        semesterId: semester!.id,
        lecturerId,
        openForRegistration: true,
      })
      const [offering] = await db
        .select({ id: courseOfferings.id })
        .from(courseOfferings)
        .where(eq(courseOfferings.courseId, created.id))
        .limit(1)
      return offering!.id
    }

    offeringA = await offeringFor('CLS101', 'Clash Course A', lecturer.id)
    offeringB = await offeringFor('CLS102', 'Clash Course B', lecturer.id)
    offeringC = await offeringFor('CLS103', 'Clash Course C', lecturerTwoId)
  })

  afterAll(async () => {
    await platform.cleanup()
  })

  it('treats overlapping times as a clash and allows back-to-back classes', () => {
    expect(timetableTimesOverlap('08:00', '10:00', '09:00', '11:00')).toBe(true)
    expect(timetableTimesOverlap('08:00', '10:00', '10:00', '12:00')).toBe(false)
  })

  it('refuses a room that is already booked in that time', async () => {
    await createAcademicTimetableSlot(institutionId, adminActor, {
      offeringId: offeringA,
      lecturerId: lecturerActor.id,
      dayOfWeek: 1,
      startTime: '08:00',
      endTime: '10:00',
      sessionType: 'Lecture',
      roomId: hallA,
    })

    const clash = await createAcademicTimetableSlot(institutionId, adminActor, {
      offeringId: offeringB,
      lecturerId: lecturerActor.id,
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '11:00',
      sessionType: 'Lecture',
      roomId: hallA,
    }).catch((cause: AppError) => cause)

    expect(clash).toBeInstanceOf(AppError)
    expect((clash as AppError).message).toContain('Hall A is not available')
    expect((clash as AppError).message).toContain('already booked')
  })

  it('refuses a lecturer teaching two overlapping classes even in different rooms', async () => {
    const clash = await createAcademicTimetableSlot(institutionId, adminActor, {
      offeringId: offeringB,
      lecturerId: lecturerActor.id,
      dayOfWeek: 1,
      startTime: '08:30',
      endTime: '09:30',
      sessionType: 'Tutorial',
      roomId: lab3,
    }).catch((cause: AppError) => cause)

    expect(clash).toBeInstanceOf(AppError)
    expect((clash as AppError).message).toContain('already teaching')
  })

  it('allows back-to-back use of the same room and lists the live week for Academic Admin', async () => {
    const slot = await createAcademicTimetableSlot(institutionId, adminActor, {
      offeringId: offeringB,
      lecturerId: lecturerActor.id,
      dayOfWeek: 1,
      startTime: '10:00',
      endTime: '12:00',
      sessionType: 'Lecture',
      roomId: hallA,
    })
    expect(slot.startTime).toBe('10:00')
    expect(slot.availabilityStatus).toBe('Pending')

    const other = await createAcademicTimetableSlot(institutionId, adminActor, {
      offeringId: offeringC,
      lecturerId: lecturerTwoId,
      dayOfWeek: 1,
      startTime: '08:00',
      endTime: '10:00',
      sessionType: 'Lab',
      roomId: lab3,
    })
    expect(other.courseCode).toContain('CLS')

    const week = await listAcademicTimetableSlots(institutionId)
    expect(week.some((row) => row.room === 'Hall A' && row.startTime === '08:00')).toBe(true)
    expect(week.some((row) => row.endTime === '12:00')).toBe(true)
  })

  it('refuses moving a class onto a booked room', async () => {
    const week = await listAcademicTimetableSlots(institutionId)
    const labSlot = week.find((row) => row.room === 'Lab 3' && row.startTime === '08:00')
    expect(labSlot).toBeTruthy()

    const moved = await updateAcademicTimetableSlot(
      institutionId,
      adminActor,
      labSlot!.id,
      { roomId: hallA },
    ).catch((cause: AppError) => cause)

    expect(moved).toBeInstanceOf(AppError)
    expect((moved as AppError).message).toContain('Hall A is not available')
    expect((moved as AppError).message).toContain('already booked')
  })

  it('lets Academic Admin message the lecturer who booked a room', async () => {
    const week = await listAcademicTimetableSlots(institutionId)
    const hallSlot = week.find((row) => row.room === 'Hall A' && row.startTime === '08:00')
    expect(hallSlot).toBeTruthy()

    const sent = await askLecturerToFreeTimetableSlot(
      institutionId,
      adminActor,
      hallSlot!.id,
      'Hall A is needed for an urgent assembly. Please move this class.',
    )
    expect(sent.lecturerName).toContain('Clash Lecturer')

    const db = await getInstitutionDb(institutionId)
    const notes = await db
      .select({ title: notifications.title, body: notifications.body, category: notifications.category })
      .from(notifications)
      .where(eq(notifications.userId, lecturerActor.id))
    expect(notes.some((note) => note.category === 'Timetable' && note.title.includes('Hall A'))).toBe(true)
    expect(notes.some((note) => note.body.includes('urgent assembly'))).toBe(true)
  })

  it('refuses a second overlapping slot on the same course', async () => {
    const clash = await createAcademicTimetableSlot(institutionId, adminActor, {
      offeringId: offeringA,
      lecturerId: lecturerActor.id,
      dayOfWeek: 1,
      startTime: '08:30',
      endTime: '09:00',
      sessionType: 'Tutorial',
      roomId: null,
    }).catch((cause: AppError) => cause)

    expect(clash).toBeInstanceOf(AppError)
    expect((clash as AppError).message).toContain('already has a class')
  })

  it('shows a class to students only after the lecturer confirms', async () => {
    const created = await createAcademicTimetableSlot(institutionId, adminActor, {
      offeringId: offeringB,
      lecturerId: lecturerActor.id,
      dayOfWeek: 3,
      startTime: '14:00',
      endTime: '16:00',
      sessionType: 'Lecture',
      roomId: lab3,
    })
    expect(created.availabilityStatus).toBe('Pending')

    const student = await createUser({
      institutionId,
      email: 'student@clash.test',
      fullName: 'Clash Student',
      role: 'Student',
      password: 'Correct#Horse2026',
    })
    const db = await getInstitutionDb(institutionId)
    const [programme] = await db.select({ id: programmes.id }).from(programmes).limit(1)
    const [studentRow] = await db.insert(students).values({
      userId: student.id,
      studentNumber: 'CLU-2026-0001',
      programmeId: programme!.id,
      yearOfStudy: 1,
    }).returning({ id: students.id })
    await db.insert(courseRegistrations).values({
      studentId: studentRow!.id,
      courseOfferingId: offeringB,
      status: 'Approved',
    })

    const hidden = await getStudentDashboard(institutionId, student.id)
    expect(hidden.schedule.some((row) => row.id === created.id)).toBe(false)

    const lecturerNotes = await db
      .select({ title: notifications.title })
      .from(notifications)
      .where(eq(notifications.userId, lecturerActor.id))
    expect(lecturerNotes.some((note) => note.title.startsWith('Confirm your class:'))).toBe(true)

    const confirmed = await confirmLecturerTimetableSlot(institutionId, lecturerActor, created.id)
    expect(confirmed.availabilityStatus).toBe('Confirmed')
    const visible = await getStudentDashboard(institutionId, student.id)
    expect(visible.schedule.some((row) => row.id === created.id)).toBe(true)

    const studentNotes = () => db
      .select({ title: notifications.title })
      .from(notifications)
      .where(eq(notifications.userId, student.id))
    expect((await studentNotes()).filter((note) => note.title.startsWith('Class on your timetable:'))).toHaveLength(1)

    await confirmLecturerTimetableSlot(institutionId, lecturerActor, created.id)
    expect((await studentNotes()).filter((note) => note.title.startsWith('Class on your timetable:'))).toHaveLength(1)

    const changed = await requestLecturerTimetableChange(institutionId, lecturerActor, created.id, {
      reason: 'I already teach at that time.',
    })
    expect(changed.availabilityStatus).toBe('ChangeRequested')
    const pulled = await getStudentDashboard(institutionId, student.id)
    expect(pulled.schedule.some((row) => row.id === created.id)).toBe(false)

    const adminNotes = await db
      .select({ body: notifications.body })
      .from(notifications)
      .where(eq(notifications.userId, adminActor.id))
    expect(adminNotes.some((note) => note.body.includes('I already teach at that time.'))).toBe(true)
  })
})
