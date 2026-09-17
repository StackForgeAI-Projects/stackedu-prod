import { and, eq } from 'drizzle-orm'
import { academicCalendarEvents, academicYears, courses, departments, programmes, semesters } from '../institution/schema/academic'
import { resultBatches, results, assessments } from '../institution/schema/assessment'
import { notifications } from '../institution/schema/communication'
import { riskFactors, riskScores } from '../institution/schema/ai'
import { users } from '../institution/schema/people'
import { enrolments, students } from '../institution/schema/students'
import {
  attendanceRecords,
  attendanceSessions,
  courseOfferings,
  courseRegistrations,
  lecturerAssignments,
  rooms,
  timetableSlots,
} from '../institution/schema/teaching'
import { getInstitutionDb } from '../connection'
import { env } from '../../config/env'
import { createUser } from '../../services/users'
import { resolveDepartmentId } from '../../services/academic'
import { DEFAULT_SEMESTER_MAX_CREDITS, timetableTimesOverlap } from '@stackedu/shared'

const DEMO_COURSES = [
  { code: 'CSC101', name: 'Introduction to Computer Science', credits: 3, year: 1 },
  { code: 'CSC102', name: 'Programming Fundamentals', credits: 3, year: 1 },
  { code: 'MTH101', name: 'Calculus I', credits: 3, year: 1 },
  { code: 'ENG101', name: 'English Communication Skills', credits: 3, year: 1 },
  { code: 'PHY101', name: 'Physics I', credits: 3, year: 1 },
] as const

const RESULT_CLASSMATES = [
  {
    email: 'student@sfu.ac.rw',
    fullName: 'Jean-Paul Mugisha',
    studentNumber: 'SFU-2026-0001',
    password: 'Student#2026',
    totalScore: '78.00',
    grade: 'B',
    gradePoint: '3.00',
    isPassed: true,
  },
  {
    email: 'student.clare@sfu.ac.rw',
    fullName: 'Clare Mukamana',
    studentNumber: 'SFU-DEMO-0002',
    password: 'Student#2026',
    totalScore: '91.00',
    grade: 'A',
    gradePoint: '4.00',
    isPassed: true,
  },
  {
    email: 'student.david@sfu.ac.rw',
    fullName: 'David Niyonzima',
    studentNumber: 'SFU-DEMO-0003',
    password: 'Student#2026',
    totalScore: '41.00',
    grade: 'F',
    gradePoint: '0.00',
    isPassed: false,
  },
] as const

type InstitutionDb = Awaited<ReturnType<typeof getInstitutionDb>>

async function capApprovedCredits(
  db: InstitutionDb,
  studentIds: string[],
  maxCredits: number,
): Promise<void> {
  const now = new Date().toISOString()
  for (const studentId of studentIds) {
    const rows = await db
      .select({
        id: courseRegistrations.id,
        credits: courses.credits,
      })
      .from(courseRegistrations)
      .innerJoin(courseOfferings, eq(courseOfferings.id, courseRegistrations.courseOfferingId))
      .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
      .where(and(eq(courseRegistrations.studentId, studentId), eq(courseRegistrations.status, 'Approved')))
      .orderBy(courses.code)

    let used = 0
    for (const row of rows) {
      if (used + row.credits > maxCredits) {
        await db
          .update(courseRegistrations)
          .set({ status: 'Dropped', droppedAt: now })
          .where(eq(courseRegistrations.id, row.id))
      } else {
        used += row.credits
      }
    }
  }
}

async function ensureEngineeringProgramme(db: InstitutionDb): Promise<void> {
  const departmentId = await resolveDepartmentId(db, 'Department of Engineering')
  const [existing] = await db
    .select({ id: programmes.id })
    .from(programmes)
    .where(eq(programmes.name, 'Mechanical Engineering'))
    .limit(1)

  if (existing) {
    await db.update(programmes).set({ departmentId }).where(eq(programmes.id, existing.id))
    return
  }

  await db
    .insert(programmes)
    .values({
      departmentId,
      code: 'BENG-ME',
      name: 'Mechanical Engineering',
      level: 'Bachelor',
      durationYears: 5,
      totalCreditsRequired: 180,
    })
    .onConflictDoNothing({ target: programmes.code })
}

async function ensureDemoStudentId(
  institutionId: string,
  db: InstitutionDb,
  spec: (typeof RESULT_CLASSMATES)[number],
  programmeId: string,
): Promise<string | null> {
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, spec.email))
    .limit(1)

  let userId = existingUser?.id
  if (!userId) {
    const created = await createUser({
      institutionId,
      email: spec.email,
      fullName: spec.fullName,
      role: 'Student',
      password: spec.password,
    })
    userId = created.id
  }

  const [existingStudent] = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.userId, userId))
    .limit(1)
  if (existingStudent) return existingStudent.id

  const [createdStudent] = await db
    .insert(students)
    .values({
      userId,
      studentNumber: spec.studentNumber,
      programmeId,
      yearOfStudy: 1,
      enrolmentStatus: 'Active',
    })
    .onConflictDoNothing({ target: students.studentNumber })
    .returning({ id: students.id })

  if (createdStudent) return createdStudent.id

  const [byNumber] = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.studentNumber, spec.studentNumber))
    .limit(1)
  return byNumber?.id ?? null
}

/**
 * Demo data for the academic admin portal: calendar, pending results, risk
 * flags, and notifications. Idempotent — safe to run after seedStudentPortal.
 */
export async function seedAcademicPortal(
  institutionId: string,
  academicAdminUserId: string,
  lecturerUserId: string,
): Promise<void> {
  if (env().NODE_ENV === 'production') {
    throw new Error('Demo seed data stays local. Refusing to run in production.')
  }
  const db = await getInstitutionDb(institutionId)
  await ensureEngineeringProgramme(db)

  const [department] = await db
    .select({ id: departments.id })
    .from(departments)
    .where(eq(departments.code, 'DCS'))
    .limit(1)

  if (department) {
    for (const course of DEMO_COURSES) {
      await db
        .insert(courses)
        .values({
          departmentId: department.id,
          code: course.code,
          name: course.name,
          credits: course.credits,
          yearOfStudy: course.year,
          description: `${course.name} for year ${course.year} students.`,
        })
        .onConflictDoNothing({ target: courses.code })
    }
  }

  const [year] = await db
    .select({ id: academicYears.id })
    .from(academicYears)
    .where(eq(academicYears.isCurrent, true))
    .limit(1)
  if (!year) return

  const [semester] = await db
    .select({ id: semesters.id, startDate: semesters.startDate, endDate: semesters.endDate })
    .from(semesters)
    .where(and(eq(semesters.academicYearId, year.id), eq(semesters.isCurrent, true)))
    .limit(1)
  if (!semester) return

  const calendarSpecs = [
    {
      title: 'Course Registration — Semester 1',
      category: 'Registration',
      startDate: '2026-09-15',
      endDate: '2026-09-30',
      description: 'Students may register for Semester 1 courses within this window.',
    },
    {
      title: 'Mid-Semester Break',
      category: 'Holiday',
      startDate: '2026-10-28',
      endDate: '2026-11-01',
      description: 'No classes during this period.',
    },
    {
      title: 'Examination Period — Semester 1',
      category: 'Exam',
      startDate: '2026-12-02',
      endDate: '2026-12-15',
      description: 'End-of-semester examinations.',
    },
    {
      title: 'Results Release — Semester 1',
      category: 'Results',
      startDate: '2026-12-22',
      endDate: '2026-12-22',
      description: 'Approved results published to the student portal.',
    },
  ]

  for (const event of calendarSpecs) {
    const [exists] = await db
      .select({ id: academicCalendarEvents.id })
      .from(academicCalendarEvents)
      .where(
        and(
          eq(academicCalendarEvents.semesterId, semester.id),
          eq(academicCalendarEvents.title, event.title),
        ),
      )
      .limit(1)
    if (exists) {
      await db
        .update(academicCalendarEvents)
        .set({
          startDate: event.startDate,
          endDate: event.endDate,
          description: event.description,
          category: event.category,
        })
        .where(eq(academicCalendarEvents.id, exists.id))
      continue
    }
    await db.insert(academicCalendarEvents).values({
      semesterId: semester.id,
      title: event.title,
      category: event.category,
      startDate: event.startDate,
      endDate: event.endDate,
      description: event.description,
      isPublished: true,
      createdBy: academicAdminUserId,
    })
  }

  const [secondOffering] = await db
    .select({
      offeringId: courseOfferings.id,
      courseCode: courses.code,
      courseName: courses.name,
    })
    .from(courseOfferings)
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .where(and(eq(courseOfferings.semesterId, semester.id), eq(courses.code, 'CSC102')))
    .limit(1)

  if (secondOffering) {
    await db
      .insert(lecturerAssignments)
      .values({
        courseOfferingId: secondOffering.offeringId,
        lecturerId: lecturerUserId,
        isLead: true,
      })
      .onConflictDoNothing({
        target: [lecturerAssignments.courseOfferingId, lecturerAssignments.lecturerId],
      })

    const [existingBatch] = await db
      .select({ id: resultBatches.id })
      .from(resultBatches)
      .where(
        and(
          eq(resultBatches.courseOfferingId, secondOffering.offeringId),
          eq(resultBatches.status, 'PendingReview'),
        ),
      )
      .limit(1)

    let batchId = existingBatch?.id
    if (!batchId) {
      const [created] = await db
        .insert(resultBatches)
        .values({
          courseOfferingId: secondOffering.offeringId,
          semesterId: semester.id,
          status: 'PendingReview',
          submittedBy: lecturerUserId,
          submittedAt: new Date().toISOString(),
        })
        .returning({ id: resultBatches.id })
      batchId = created!.id
    }

    const [csProgramme] = await db
      .select({ id: programmes.id })
      .from(programmes)
      .where(eq(programmes.code, 'BSC-CS'))
      .limit(1)

    if (csProgramme && batchId) {
      for (const classmate of RESULT_CLASSMATES) {
        const studentId = await ensureDemoStudentId(institutionId, db, classmate, csProgramme.id)
        if (!studentId) continue
        await db
          .insert(results)
          .values({
            resultBatchId: batchId,
            studentId,
            courseOfferingId: secondOffering.offeringId,
            totalScore: classmate.totalScore,
            grade: classmate.grade,
            gradePoint: classmate.gradePoint,
            creditsEarned: classmate.isPassed ? 3 : 0,
            isPassed: classmate.isPassed,
          })
          .onConflictDoNothing({ target: [results.studentId, results.courseOfferingId] })
      }
    }
  }

  const [demoStudent] = await db
    .select({ id: students.id, studentNumber: students.studentNumber })
    .from(students)
    .innerJoin(users, eq(users.id, students.userId))
    .where(eq(users.email, 'student@sfu.ac.rw'))
    .limit(1)

  if (demoStudent) {
    const [existingRisk] = await db
      .select({ id: riskScores.id })
      .from(riskScores)
      .where(and(eq(riskScores.studentId, demoStudent.id), eq(riskScores.semesterId, semester.id)))
      .limit(1)

    let riskScoreId = existingRisk?.id
    if (!riskScoreId) {
      const [created] = await db
        .insert(riskScores)
        .values({
          studentId: demoStudent.id,
          semesterId: semester.id,
          score: '62.50',
          level: 'Medium',
          confidence: '0.820',
          modelVersion: 'risk-v1-demo',
          computedAt: new Date().toISOString(),
        })
        .returning({ id: riskScores.id })
      riskScoreId = created!.id
    }

    if (riskScoreId) {
      const [hasFactors] = await db
        .select({ id: riskFactors.id })
        .from(riskFactors)
        .where(eq(riskFactors.riskScoreId, riskScoreId))
        .limit(1)

      if (!hasFactors) {
        await db.insert(riskFactors).values([
          {
            riskScoreId,
            factor: 'LowAttendance',
            contribution: '35.00',
            explanation: 'Attendance below 70% in registered courses',
          },
          {
            riskScoreId,
            factor: 'DecliningGrades',
            contribution: '27.50',
            explanation: 'GPA trend declining over the last assessment cycle',
          },
          {
            riskScoreId,
            factor: 'FeeArrears',
            contribution: '15.00',
            explanation: 'Outstanding fee balance on student account',
          },
        ])
      }
    }

    await db
      .insert(enrolments)
      .values({
        studentId: demoStudent.id,
        semesterId: semester.id,
        yearOfStudy: 1,
        status: 'Active',
        academicStanding: 'Good',
      })
      .onConflictDoNothing({ target: [enrolments.studentId, enrolments.semesterId] })
  }

  const [existingNotif] = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(eq(notifications.userId, academicAdminUserId))
    .limit(1)

  if (!existingNotif) {
    await db.insert(notifications).values([
      {
        userId: academicAdminUserId,
        title: 'Results submitted: CSC 102',
        body: 'Dr. Amina Uwase has submitted Programming Fundamentals results for review.',
        category: 'Results',
        actionUrl: '/academic/results',
      },
      {
        userId: academicAdminUserId,
        title: 'New application awaiting review',
        body: 'A new student application has been submitted and is ready for review.',
        category: 'Applications',
        actionUrl: '/academic/applications',
      },
      {
        userId: academicAdminUserId,
        title: 'At-risk student flagged',
        body: demoStudent
          ? `Student ${demoStudent.studentNumber} has been flagged as medium risk this semester.`
          : 'A student has been flagged as at-risk this semester.',
        category: 'At-Risk',
        actionUrl: '/academic/at-risk',
      },
      {
        userId: academicAdminUserId,
        title: 'Registration window reminder',
        body: 'Course registration for the current semester closes soon.',
        category: 'Registration',
        actionUrl: '/academic/calendar',
      },
    ])
  }

  const [offering] = await db
    .select({ id: courseOfferings.id })
    .from(courseOfferings)
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .where(and(eq(courseOfferings.semesterId, semester.id), eq(courses.code, 'MTH101')))
    .limit(1)

  if (offering) {
    const [room] = await db.select({ id: rooms.id }).from(rooms).where(eq(rooms.code, 'HALLA')).limit(1)
    const [slotExists] = await db
      .select({ id: timetableSlots.id })
      .from(timetableSlots)
      .where(
        and(
          eq(timetableSlots.courseOfferingId, offering.id),
          eq(timetableSlots.dayOfWeek, 4),
          eq(timetableSlots.startTime, '14:00'),
        ),
      )
      .limit(1)

    if (!slotExists && room) {
      await db.insert(timetableSlots).values({
        courseOfferingId: offering.id,
        roomId: room.id,
        dayOfWeek: 4,
        startTime: '14:00',
        endTime: '16:00',
        sessionType: 'Tutorial',
      })
    }
  }

  await seedLecturerDemo(db, lecturerUserId, semester.id)

  process.stdout.write('Academic portal demo data ready\n')
}

async function seedLecturerDemo(
  db: InstitutionDb,
  lecturerUserId: string,
  semesterId: string,
): Promise<void> {
  const assigned = await db
    .select({
      offeringId: courseOfferings.id,
      courseCode: courses.code,
    })
    .from(lecturerAssignments)
    .innerJoin(courseOfferings, eq(courseOfferings.id, lecturerAssignments.courseOfferingId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .where(
      and(eq(lecturerAssignments.lecturerId, lecturerUserId), eq(courseOfferings.semesterId, semesterId)),
    )

  const classmateIds: string[] = []
  for (const spec of RESULT_CLASSMATES) {
    const [row] = await db
      .select({ id: students.id })
      .from(students)
      .innerJoin(users, eq(users.id, students.userId))
      .where(eq(users.email, spec.email))
      .limit(1)
    if (row) classmateIds.push(row.id)
  }

  const demoRooms = [
    { code: 'LAB3', name: 'Lab 3' },
    { code: 'R101', name: 'Room 101' },
    { code: 'HALLA', name: 'Hall A' },
    { code: 'LAB2', name: 'Lab 2' },
  ]
  const roomIds: Record<string, string> = {}
  const roomNameByCode: Record<string, string> = {}
  for (const room of demoRooms) {
    const [inserted] = await db
      .insert(rooms)
      .values({ code: room.code, name: room.name, roomType: 'Lecture Hall' })
      .onConflictDoNothing({ target: rooms.code })
      .returning({ id: rooms.id })
    roomIds[room.code] =
      inserted?.id ??
      (await db.select({ id: rooms.id }).from(rooms).where(eq(rooms.code, room.code)).limit(1))[0]!.id
    roomNameByCode[room.code] = room.name
  }

  const defaultSlots = [
    { day: 1, start: '08:00', end: '10:00', type: 'Lecture', room: 'LAB3' },
    { day: 1, start: '14:00', end: '16:00', type: 'Tutorial', room: 'HALLA' },
    { day: 2, start: '10:00', end: '12:00', type: 'Lab', room: 'LAB2' },
    { day: 2, start: '14:00', end: '16:00', type: 'Lecture', room: 'R101' },
    { day: 3, start: '08:00', end: '10:00', type: 'Lecture', room: 'HALLA' },
    { day: 3, start: '10:00', end: '12:00', type: 'Tutorial', room: 'LAB3' },
    { day: 4, start: '08:00', end: '10:00', type: 'Lecture', room: 'LAB2' },
    { day: 4, start: '14:00', end: '16:00', type: 'Tutorial', room: 'HALLA' },
    { day: 5, start: '08:00', end: '10:00', type: 'Lecture', room: 'LAB3' },
    { day: 5, start: '10:00', end: '12:00', type: 'Tutorial', room: 'R101' },
    { day: 5, start: '14:00', end: '16:00', type: 'Lab', room: 'LAB2' },
  ]

  const existingSlotRows = await db
    .select({
      offeringId: timetableSlots.courseOfferingId,
      dayOfWeek: timetableSlots.dayOfWeek,
      startTime: timetableSlots.startTime,
      endTime: timetableSlots.endTime,
      room: rooms.name,
      lecturerId: lecturerAssignments.lecturerId,
    })
    .from(timetableSlots)
    .innerJoin(courseOfferings, eq(courseOfferings.id, timetableSlots.courseOfferingId))
    .leftJoin(rooms, eq(rooms.id, timetableSlots.roomId))
    .leftJoin(
      lecturerAssignments,
      and(eq(lecturerAssignments.courseOfferingId, courseOfferings.id), eq(lecturerAssignments.isLead, true)),
    )
    .where(eq(courseOfferings.semesterId, semesterId))

  const booked = existingSlotRows.map((row) => ({
    day: row.dayOfWeek,
    start: row.startTime.slice(0, 5),
    end: row.endTime.slice(0, 5),
    room: row.room,
    lecturerId: row.lecturerId,
  }))

  const slotTaken = (candidate: {
    day: number
    start: string
    end: string
    room: string
    lecturerId: string
  }) =>
    booked.some((row) => {
      if (row.day !== candidate.day) return false
      if (!timetableTimesOverlap(row.start, row.end, candidate.start, candidate.end)) return false
      if (row.room && row.room === candidate.room) return true
      if (row.lecturerId && row.lecturerId === candidate.lecturerId) return true
      return false
    })

  for (const offering of assigned) {
    const [hasSlot] = await db
      .select({ id: timetableSlots.id })
      .from(timetableSlots)
      .where(eq(timetableSlots.courseOfferingId, offering.offeringId))
      .limit(1)
    if (hasSlot) continue
    const slot = defaultSlots.find((row) =>
      !slotTaken({
        day: row.day,
        start: row.start,
        end: row.end,
        room: roomNameByCode[row.room] ?? row.room,
        lecturerId: lecturerUserId,
      }),
    )
    if (!slot) continue
    await db.insert(timetableSlots).values({
      courseOfferingId: offering.offeringId,
      roomId: roomIds[slot.room],
      dayOfWeek: slot.day,
      startTime: slot.start,
      endTime: slot.end,
      sessionType: slot.type,
    })
    booked.push({
      day: slot.day,
      start: slot.start,
      end: slot.end,
      room: roomNameByCode[slot.room] ?? slot.room,
      lecturerId: lecturerUserId,
    })
  }

  for (const offering of assigned) {
    for (const studentId of classmateIds) {
      await db
        .insert(courseRegistrations)
        .values({
          studentId,
          courseOfferingId: offering.offeringId,
          status: 'Approved',
          registeredAt: new Date().toISOString(),
        })
        .onConflictDoNothing({ target: [courseRegistrations.studentId, courseRegistrations.courseOfferingId] })
    }

    const registered = await db
      .select({ id: courseRegistrations.id })
      .from(courseRegistrations)
      .where(
        and(eq(courseRegistrations.courseOfferingId, offering.offeringId), eq(courseRegistrations.status, 'Approved')),
      )
    await db
      .update(courseOfferings)
      .set({ enrolledCount: registered.length })
      .where(eq(courseOfferings.id, offering.offeringId))
  }

  await capApprovedCredits(
    db,
    [...new Set([
      ...classmateIds,
      ...(await db.select({ studentId: courseRegistrations.studentId }).from(courseRegistrations)).map((row) => row.studentId),
    ])],
    DEFAULT_SEMESTER_MAX_CREDITS,
  )

  for (const offering of assigned) {
    const registered = await db
      .select({ id: courseRegistrations.id })
      .from(courseRegistrations)
      .where(
        and(eq(courseRegistrations.courseOfferingId, offering.offeringId), eq(courseRegistrations.status, 'Approved')),
      )
    await db
      .update(courseOfferings)
      .set({ enrolledCount: registered.length })
      .where(eq(courseOfferings.id, offering.offeringId))
  }

  const csc102 = assigned.find((row) => row.courseCode === 'CSC102')
  if (csc102 && classmateIds.length > 0) {
    const [existingSession] = await db
      .select({ id: attendanceSessions.id })
      .from(attendanceSessions)
      .where(
        and(eq(attendanceSessions.courseOfferingId, csc102.offeringId), eq(attendanceSessions.sessionDate, '2026-09-22')),
      )
      .limit(1)

    let sessionId = existingSession?.id
    if (!sessionId) {
      const [created] = await db
        .insert(attendanceSessions)
        .values({
          courseOfferingId: csc102.offeringId,
          sessionDate: '2026-09-22',
          startTime: '10:00',
          endTime: '12:00',
          topic: 'Control flow and functions',
          takenBy: lecturerUserId,
          closedAt: new Date().toISOString(),
        })
        .returning({ id: attendanceSessions.id })
      sessionId = created!.id
    }

    const statuses = ['Present', 'Late', 'Absent'] as const
    for (const [index, studentId] of classmateIds.entries()) {
      await db
        .insert(attendanceRecords)
        .values({
          attendanceSessionId: sessionId,
          studentId,
          status: statuses[index % statuses.length]!,
          recordedBy: lecturerUserId,
        })
        .onConflictDoNothing({
          target: [attendanceRecords.attendanceSessionId, attendanceRecords.studentId],
        })
    }

    const [existingAssessment] = await db
      .select({ id: assessments.id })
      .from(assessments)
      .where(and(eq(assessments.courseOfferingId, csc102.offeringId), eq(assessments.title, 'Lab Exercise 1')))
      .limit(1)
    if (!existingAssessment) {
      await db.insert(assessments).values({
        courseOfferingId: csc102.offeringId,
        title: 'Lab Exercise 1',
        description: 'Short programming exercise on loops and functions.',
        type: 'Practical',
        weight: '10.00',
        totalMarks: '20.00',
        dueAt: '2026-10-10T17:00:00.000Z',
        acceptsSubmissions: true,
        isPublished: true,
        createdBy: lecturerUserId,
      })
    }
  }

  const [existingNotif] = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(eq(notifications.userId, lecturerUserId))
    .limit(1)
  if (existingNotif) return

  await db.insert(notifications).values([
    {
      userId: lecturerUserId,
      title: 'Results submitted: CSC 102',
      body: 'Programming Fundamentals results are with the Academic Admin for review.',
      category: 'Results',
      actionUrl: '/lecturer/results',
    },
    {
      userId: lecturerUserId,
      title: 'At-risk alert: Jean-Paul Mugisha',
      body: 'A student in your assigned courses has been flagged this semester.',
      category: 'At-Risk',
      actionUrl: '/lecturer/at-risk',
    },
    {
      userId: lecturerUserId,
      title: 'Assignment due soon',
      body: 'CSC 101 Assignment 2 is due 20 February 2026.',
      category: 'Assignments',
      actionUrl: '/lecturer/assignments',
    },
    {
      userId: lecturerUserId,
      title: 'Welcome to StackEDU',
      body: 'Your lecturer account is active. Assigned courses are listed under My Courses.',
      category: 'System',
      actionUrl: '/lecturer/courses',
      readAt: new Date().toISOString(),
    },
  ])
}
