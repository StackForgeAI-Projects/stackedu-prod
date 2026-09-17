import { and, eq } from 'drizzle-orm'
import { academicYears, courses, departments, programmes, semesters } from '../institution/schema/academic'
import { assessments, assessmentItems, questions, questionVersions, resultBatches, results } from '../institution/schema/assessment'
import { notifications } from '../institution/schema/communication'
import { invoices, payments, receipts, studentFeeAccounts, feeItems, feeStructures } from '../institution/schema/finance'
import { libraryResources } from '../institution/schema/library'
import { users } from '../institution/schema/people'
import { enrolments, studentProfiles, students } from '../institution/schema/students'
import {
  announcements,
  attendanceRecords,
  attendanceSessions,
  courseMaterials,
  courseModules,
  courseOfferings,
  courseRegistrations,
  lecturerAssignments,
  rooms,
  timetableSlots,
  liveSessions,
} from '../institution/schema/teaching'
import { getInstitutionDb } from '../connection'
import { env } from '../../config/env'
import { feeItemsApplyToStudent, invoicePayloadFromFeeItems } from '../../lib/fee-invoice'

const COURSE_CATALOGUE = [
  { code: 'CSC101', name: 'Introduction to Computer Science', credits: 3, year: 1 },
  { code: 'CSC102', name: 'Programming Fundamentals', credits: 3, year: 1 },
  { code: 'MTH101', name: 'Calculus I', credits: 3, year: 1 },
  { code: 'ENG101', name: 'English Communication Skills', credits: 3, year: 1 },
  { code: 'PHY101', name: 'Physics I', credits: 3, year: 1 },
] as const

/**
 * Fills the demo student with a current semester, courses, fees, results and
 * notifications so the student portal has real rows to read. Idempotent.
 */
export async function seedStudentPortal(institutionId: string, studentUserId: string): Promise<void> {
  if (env().NODE_ENV === 'production') {
    throw new Error('Demo seed data stays local. Refusing to run in production.')
  }
  const db = await getInstitutionDb(institutionId)

  const [student] = await db
    .select({ id: students.id, programmeId: students.programmeId, yearOfStudy: students.yearOfStudy })
    .from(students)
    .where(eq(students.userId, studentUserId))
    .limit(1)
  if (!student) return

  const [user] = await db
    .select({ fullName: users.fullName, email: users.email })
    .from(users)
    .where(eq(users.id, studentUserId))
    .limit(1)

  const [existingProfile] = await db
    .select({ id: studentProfiles.id })
    .from(studentProfiles)
    .where(eq(studentProfiles.studentId, student.id))
    .limit(1)

  if (!existingProfile && user) {
    const [firstName, ...rest] = user.fullName.split(' ')
    await db.insert(studentProfiles).values({
      studentId: student.id,
      firstName: firstName ?? user.fullName,
      lastName: rest.join(' ') || firstName || user.fullName,
      dateOfBirth: '2003-03-15',
      gender: 'Male',
      nationality: 'Rwandan',
      contactPhone: '+250788123456',
    })
  }

  const [year] = await db
    .insert(academicYears)
    .values({
      name: '2025/2026',
      startDate: '2025-09-01',
      endDate: '2026-07-31',
      isCurrent: true,
    })
    .onConflictDoNothing({ target: academicYears.name })
    .returning({ id: academicYears.id })

  const yearId =
    year?.id ??
    (
      await db
        .select({ id: academicYears.id })
        .from(academicYears)
        .where(eq(academicYears.name, '2025/2026'))
        .limit(1)
    )[0]!.id

  const [semester] = await db
    .insert(semesters)
    .values({
      academicYearId: yearId,
      name: 'Semester 1',
      sequence: 1,
      startDate: '2025-09-01',
      endDate: '2026-01-31',
      registrationOpensAt: '2025-08-15',
      registrationClosesAt: '2026-02-15',
      status: 'InProgress',
      isCurrent: true,
    })
    .onConflictDoNothing({ target: [semesters.academicYearId, semesters.sequence] })
    .returning({ id: semesters.id })

  const semesterId =
    semester?.id ??
    (
      await db
        .select({ id: semesters.id })
        .from(semesters)
        .where(and(eq(semesters.academicYearId, yearId), eq(semesters.sequence, 1)))
        .limit(1)
    )[0]!.id

  await db
    .insert(enrolments)
    .values({
      studentId: student.id,
      semesterId,
      yearOfStudy: student.yearOfStudy,
      status: 'Active',
      registeredAt: new Date().toISOString(),
      creditsRegistered: 15,
      creditsEarned: 12,
      semesterGpa: '3.60',
      cgpa: '3.60',
      academicStanding: 'Good',
    })
    .onConflictDoNothing({ target: [enrolments.studentId, enrolments.semesterId] })

  const [department] = await db
    .select({ id: departments.id })
    .from(departments)
    .where(eq(departments.code, 'DCS'))
    .limit(1)
  if (!department) return

  const [lecturer] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, 'lecturer@sfu.ac.rw'))
    .limit(1)

  const offeringIds: string[] = []

  for (const course of COURSE_CATALOGUE) {
    const [inserted] = await db
      .insert(courses)
      .values({
        departmentId: department.id,
        code: course.code,
        name: course.name,
        credits: course.credits,
        yearOfStudy: course.year,
        description: `${course.name} for year ${course.year} Computer Science students.`,
      })
      .onConflictDoNothing({ target: courses.code })
      .returning({ id: courses.id })

    const courseId =
      inserted?.id ??
      (
        await db
          .select({ id: courses.id })
          .from(courses)
          .where(eq(courses.code, course.code))
          .limit(1)
      )[0]!.id

    const [offering] = await db
      .insert(courseOfferings)
      .values({
        courseId,
        semesterId,
        section: 'A',
        capacity: 60,
        enrolledCount: 1,
        isOpenForRegistration: true,
      })
      .onConflictDoNothing({ target: [courseOfferings.courseId, courseOfferings.semesterId, courseOfferings.section] })
      .returning({ id: courseOfferings.id })

    const offeringId =
      offering?.id ??
      (
        await db
          .select({ id: courseOfferings.id })
          .from(courseOfferings)
          .where(
            and(
              eq(courseOfferings.courseId, courseId),
              eq(courseOfferings.semesterId, semesterId),
            ),
          )
          .limit(1)
      )[0]!.id

    offeringIds.push(offeringId)

    if (lecturer) {
      await db
        .insert(lecturerAssignments)
        .values({ courseOfferingId: offeringId, lecturerId: lecturer.id, isLead: true })
        .onConflictDoNothing({ target: [lecturerAssignments.courseOfferingId, lecturerAssignments.lecturerId] })
    }

    if (course.code !== 'PHY101') {
      await db
        .insert(courseRegistrations)
        .values({
          studentId: student.id,
          courseOfferingId: offeringId,
          status: 'Approved',
          registeredAt: new Date().toISOString(),
        })
        .onConflictDoNothing({ target: [courseRegistrations.studentId, courseRegistrations.courseOfferingId] })
    }
  }

  const roomSpecs = [
    { code: 'LAB3', name: 'Lab 3' },
    { code: 'HALLA', name: 'Hall A' },
    { code: 'LAB2', name: 'Lab 2' },
    { code: 'R101', name: 'Room 101' },
  ]
  const roomIds: Record<string, string> = {}
  for (const room of roomSpecs) {
    const [inserted] = await db
      .insert(rooms)
      .values({ code: room.code, name: room.name, roomType: 'Lecture Hall' })
      .onConflictDoNothing({ target: rooms.code })
      .returning({ id: rooms.id })
    roomIds[room.code] =
      inserted?.id ??
      (
        await db.select({ id: rooms.id }).from(rooms).where(eq(rooms.code, room.code)).limit(1)
      )[0]!.id
  }

  const slots = [
    { offering: 0, day: 1, start: '08:00', end: '10:00', type: 'Lecture', room: 'LAB3' },
    { offering: 2, day: 1, start: '14:00', end: '16:00', type: 'Tutorial', room: 'HALLA' },
    { offering: 1, day: 2, start: '10:00', end: '12:00', type: 'Lab', room: 'LAB2' },
    { offering: 3, day: 2, start: '14:00', end: '16:00', type: 'Lecture', room: 'R101' },
    { offering: 2, day: 3, start: '08:00', end: '10:00', type: 'Lecture', room: 'HALLA' },
    { offering: 0, day: 3, start: '10:00', end: '12:00', type: 'Tutorial', room: 'LAB3' },
    { offering: 1, day: 4, start: '08:00', end: '10:00', type: 'Lecture', room: 'LAB2' },
    { offering: 3, day: 5, start: '10:00', end: '12:00', type: 'Tutorial', room: 'R101' },
  ]

  for (const slot of slots) {
    const offeringId = offeringIds[slot.offering]
    if (!offeringId) continue
    const [exists] = await db
      .select({ id: timetableSlots.id })
      .from(timetableSlots)
      .where(
        and(
          eq(timetableSlots.courseOfferingId, offeringId),
          eq(timetableSlots.dayOfWeek, slot.day),
          eq(timetableSlots.startTime, slot.start),
        ),
      )
      .limit(1)
    if (exists) continue
    await db.insert(timetableSlots).values({
      courseOfferingId: offeringId,
      roomId: roomIds[slot.room],
      dayOfWeek: slot.day,
      startTime: slot.start,
      endTime: slot.end,
      sessionType: slot.type,
    })
  }

  const firstOffering = offeringIds[0]
  if (firstOffering) {
    await seedCourseModules(db, firstOffering)
    await seedCourseAnnouncements(db, firstOffering)
    const [existingLive] = await db
      .select({ id: liveSessions.id })
      .from(liveSessions)
      .where(eq(liveSessions.courseOfferingId, firstOffering))
      .limit(1)
    if (!existingLive) {
      const [created] = await db
        .insert(liveSessions)
        .values({
          courseOfferingId: firstOffering,
          title: 'Week 3 live class',
          status: 'Scheduled',
          roomName: `tmp-${crypto.randomUUID()}`,
          scheduledAt: new Date().toISOString(),
        })
        .returning({ id: liveSessions.id })
      if (created) {
        await db
          .update(liveSessions)
          .set({ roomName: `session-${created.id}` })
          .where(eq(liveSessions.id, created.id))
      }
    }
    const [offeringCourse] = await db
      .select({ courseId: courseOfferings.courseId })
      .from(courseOfferings)
      .where(eq(courseOfferings.id, firstOffering))
      .limit(1)
    if (offeringCourse) {
      await seedQuestionBank(db, {
        courseId: offeringCourse.courseId,
        offeringId: firstOffering,
        createdBy: lecturer?.id,
      })
    }

    const [material] = await db
      .select({ id: courseMaterials.id })
      .from(courseMaterials)
      .where(eq(courseMaterials.courseOfferingId, firstOffering))
      .limit(1)
    if (!material) {
      await db.insert(courseMaterials).values({
        courseOfferingId: firstOffering,
        title: 'Week 1 lecture notes',
        description: 'Introduction and course outline.',
        moduleName: 'Week 1',
        isPublished: true,
        publishedAt: new Date().toISOString(),
      })
    }

    const [assessment] = await db
      .select({ id: assessments.id })
      .from(assessments)
      .where(eq(assessments.courseOfferingId, firstOffering))
      .limit(1)
    if (!assessment) {
      await db.insert(assessments).values({
        courseOfferingId: firstOffering,
        title: 'Assignment 2',
        description: 'Short written exercise on the first two weeks of material.',
        type: 'Coursework',
        weight: '20.00',
        totalMarks: '20.00',
        dueAt: '2026-02-20T17:00:00.000Z',
        acceptsSubmissions: true,
        isPublished: true,
      })
    }

    const [session] = await db
      .select({ id: attendanceSessions.id })
      .from(attendanceSessions)
      .where(eq(attendanceSessions.courseOfferingId, firstOffering))
      .limit(1)
    let sessionId = session?.id
    if (!sessionId) {
      const [created] = await db
        .insert(attendanceSessions)
        .values({
          courseOfferingId: firstOffering,
          sessionDate: '2026-01-20',
          startTime: '08:00',
          endTime: '10:00',
          topic: 'Introduction',
        })
        .returning({ id: attendanceSessions.id })
      sessionId = created!.id
    }
    await db
      .insert(attendanceRecords)
      .values({
        attendanceSessionId: sessionId,
        studentId: student.id,
        status: 'Present',
      })
      .onConflictDoNothing({ target: [attendanceRecords.attendanceSessionId, attendanceRecords.studentId] })

    const [batch] = await db
      .insert(resultBatches)
      .values({
        courseOfferingId: firstOffering,
        semesterId,
        status: 'Published',
        publishedAt: new Date().toISOString(),
      })
      .onConflictDoNothing({ target: resultBatches.courseOfferingId })
      .returning({ id: resultBatches.id })

    const batchId =
      batch?.id ??
      (
        await db
          .select({ id: resultBatches.id })
          .from(resultBatches)
          .where(eq(resultBatches.courseOfferingId, firstOffering))
          .limit(1)
      )[0]?.id

    if (batchId) {
      await db
        .insert(results)
        .values({
          resultBatchId: batchId,
          studentId: student.id,
          courseOfferingId: firstOffering,
          totalScore: '85.00',
          grade: 'A',
          gradePoint: '4.00',
          creditsEarned: 3,
          isPassed: true,
        })
        .onConflictDoNothing({ target: [results.studentId, results.courseOfferingId] })
    }
  }

  const [account] = await db
    .select({ id: studentFeeAccounts.id })
    .from(studentFeeAccounts)
    .where(eq(studentFeeAccounts.studentId, student.id))
    .limit(1)

  // Reset demo payment history so Jean-Paul starts with a clean fee account.
  await db.delete(receipts).where(eq(receipts.studentId, student.id))
  await db.delete(payments).where(eq(payments.studentId, student.id))
  await db.delete(invoices).where(eq(invoices.studentId, student.id))
  if (account) {
    await db.delete(studentFeeAccounts).where(eq(studentFeeAccounts.studentId, student.id))
  }

  const feeRows = await db
    .select({
      itemId: feeItems.id,
      name: feeItems.name,
      amount: feeItems.amount,
      dueDate: feeItems.dueDate,
      programmeId: feeStructures.programmeId,
      yearOfStudy: feeStructures.yearOfStudy,
      semesterId: feeStructures.semesterId,
    })
    .from(feeItems)
    .innerJoin(feeStructures, eq(feeItems.feeStructureId, feeStructures.id))
    .where(eq(feeStructures.isActive, true))

  const applicableItems = feeRows
    .filter((row) => !row.semesterId || row.semesterId === semesterId)
    .map((row) => ({
      itemId: row.itemId,
      name: row.name,
      amount: row.amount,
      dueDate: row.dueDate,
      programmeId: row.programmeId,
      yearOfStudy: row.yearOfStudy,
    }))

  const studentItems = feeItemsApplyToStudent(applicableItems, {
    programmeId: student.programmeId,
    yearOfStudy: student.yearOfStudy,
  })

  if (studentItems.length && studentItems.every((item) => item.dueDate)) {
    const { lineItems, amountDue, dueDate } = invoicePayloadFromFeeItems(studentItems)
    await db.insert(studentFeeAccounts).values({
      studentId: student.id,
      totalCharged: amountDue,
      totalPaid: 0,
      balance: amountDue,
    })

    await db.insert(invoices).values({
      invoiceNumber: 'INV-SFU-2026-0001',
      studentId: student.id,
      semesterId,
      amountDue,
      amountPaid: 0,
      status: 'Issued',
      issuedAt: new Date().toISOString(),
      dueDate,
      lineItems,
    })
  }

  const [existingNotif] = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(eq(notifications.userId, studentUserId))
    .limit(1)
  if (!existingNotif) {
    await db.insert(notifications).values([
      {
        userId: studentUserId,
        title: 'Semester 1 results are available',
        body: 'Your Introduction to Computer Science result has been published.',
        category: 'Results',
        actionUrl: '/student/results',
      },
      {
        userId: studentUserId,
        title: 'Outstanding fee balance reminder',
        body: 'You have an outstanding fee balance. Pay before the due date to avoid a hold.',
        category: 'Fees',
        actionUrl: '/student/fees',
      },
      {
        userId: studentUserId,
        title: 'Course registration is open',
        body: 'You can still add elective courses for this semester.',
        category: 'Registration',
        actionUrl: '/student/course-registration',
      },
    ])
  }

  const [book] = await db
    .select({ id: libraryResources.id })
    .from(libraryResources)
    .limit(1)
  if (!book) {
    await db.insert(libraryResources).values([
      {
        title: 'Introduction to Algorithms',
        author: 'Cormen, Leiserson, Rivest, Stein',
        type: 'Ebook',
        description: 'Core algorithms text for first-year computing.',
        subjectTags: ['Computer Science', 'Algorithms'],
        publicationYear: 2009,
        isPublished: true,
      },
      {
        title: 'Calculus: Early Transcendentals',
        author: 'James Stewart',
        type: 'Ebook',
        description: 'Reference for Calculus I.',
        subjectTags: ['Mathematics'],
        publicationYear: 2015,
        isPublished: true,
      },
      {
        title: 'English for Academic Purposes',
        author: 'R. Jordan',
        type: 'CoursePack',
        description: 'Writing and communication pack.',
        subjectTags: ['English'],
        publicationYear: 2012,
        isPublished: true,
      },
    ])
  }

  process.stdout.write('Student portal demo data ready\n')
}

type InstitutionDb = Awaited<ReturnType<typeof getInstitutionDb>>

/**
 * Three modules in a chain, so the demo shows a student both an open module
 * and one still held shut by the module before it.
 */
async function seedCourseModules(db: InstitutionDb, offeringId: string): Promise<void> {
  const [existing] = await db
    .select({ id: courseModules.id })
    .from(courseModules)
    .where(eq(courseModules.courseOfferingId, offeringId))
    .limit(1)
  if (existing) return

  const now = new Date().toISOString()
  const [foundations] = await db
    .insert(courseModules)
    .values({
      courseOfferingId: offeringId,
      title: 'Module 1: Foundations',
      summary: 'What computing is, and how this course will run.',
      sequence: 0,
      isPublished: true,
      publishedAt: now,
    })
    .returning({ id: courseModules.id })

  const [algorithms] = await db
    .insert(courseModules)
    .values({
      courseOfferingId: offeringId,
      title: 'Module 2: Thinking in algorithms',
      summary: 'Breaking a problem into steps a machine can follow.',
      sequence: 1,
      prerequisiteModuleId: foundations!.id,
      isPublished: true,
      publishedAt: now,
    })
    .returning({ id: courseModules.id })

  await db.insert(courseModules).values({
    courseOfferingId: offeringId,
    title: 'Module 3: Writing your first program',
    summary: 'Putting the first two modules into practice.',
    sequence: 2,
    prerequisiteModuleId: algorithms!.id,
    isPublished: true,
    publishedAt: now,
  })

  await db.insert(courseMaterials).values([
    {
      courseOfferingId: offeringId,
      moduleId: foundations!.id,
      title: 'What is computer science?',
      description: 'A short read before the first lecture.',
      bodyText:
        'Computer science is the study of what problems can be solved by following a set of '
        + 'precise steps, and how quickly. This course starts with those steps, called '
        + 'algorithms, and only later worries about any particular programming language.',
      sequence: 0,
      isPublished: true,
      publishedAt: now,
    },
    {
      courseOfferingId: offeringId,
      moduleId: foundations!.id,
      title: 'How this course is assessed',
      description: 'Weighting of coursework, practicals and the final paper.',
      bodyText:
        'Coursework carries 20 percent, practical work 20 percent, and the final paper 60 '
        + 'percent. Attendance is recorded every session and is used to spot students who may '
        + 'need support, not as a mark in itself.',
      sequence: 1,
      isPublished: true,
      publishedAt: now,
    },
    {
      courseOfferingId: offeringId,
      moduleId: algorithms!.id,
      title: 'Flowcharts and pseudocode',
      description: 'Two ways of writing an algorithm down before you code it.',
      bodyText:
        'Before writing code, write the steps in plain language. If you cannot describe the '
        + 'steps to another person, the program will not describe them to a computer either.',
      sequence: 0,
      isPublished: true,
      publishedAt: now,
    },
  ])
}

async function seedCourseAnnouncements(db: InstitutionDb, offeringId: string): Promise<void> {
  const [existing] = await db
    .select({ id: announcements.id })
    .from(announcements)
    .where(eq(announcements.courseOfferingId, offeringId))
    .limit(1)
  if (existing) return

  const now = new Date()
  const daysAgo = (days: number) =>
    new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()

  await db.insert(announcements).values([
    {
      courseOfferingId: offeringId,
      title: 'Read Module 1 before the first lab',
      body:
        'Both readings in Module 1 must be opened before Tuesday. Module 2 stays closed until '
        + 'you have been through them.',
      audienceRoles: ['Student'],
      isPinned: true,
      publishedAt: daysAgo(6),
    },
    {
      courseOfferingId: offeringId,
      title: 'Lab session moved to Thursday this week',
      body: 'The Wednesday lab clashes with the faculty assembly, so this week it runs Thursday at 10:00 in Lab 2.',
      audienceRoles: ['Student'],
      isPinned: false,
      publishedAt: daysAgo(2),
    },
    {
      courseOfferingId: offeringId,
      title: 'Assignment 2 deadline reminder',
      body: 'Assignment 2 is due at the end of next week. Submit through the course page, not by email.',
      audienceRoles: ['Student'],
      isPinned: false,
      publishedAt: daysAgo(1),
    },
  ])
}

async function seedQuestionBank(
  db: InstitutionDb,
  input: { courseId: string; offeringId: string; createdBy?: string },
): Promise<void> {
  const [existing] = await db
    .select({ id: questions.id })
    .from(questions)
    .where(eq(questions.courseId, input.courseId))
    .limit(1)
  if (existing) return

  const bank = [
    {
      type: 'MultipleChoice' as const,
      stem: 'What is an algorithm?',
      options: [
        'A set of precise steps to solve a problem',
        'A brand of computer',
        'A type of computer virus',
        'The name of a programming language',
      ],
      correctAnswer: 'A set of precise steps to solve a problem',
      marks: '2.00',
    },
    {
      type: 'MultipleChoice' as const,
      stem: 'Which of these is a loop?',
      options: ['if', 'while', 'return', 'class'],
      correctAnswer: 'while',
      marks: '2.00',
    },
    {
      type: 'TrueFalse' as const,
      stem: 'A program is a sequence of steps a machine can follow.',
      options: ['True', 'False'],
      correctAnswer: 'True',
      marks: '1.00',
    },
    {
      type: 'ShortAnswer' as const,
      stem: 'Name one programming language used in this course.',
      options: null as string[] | null,
      correctAnswer: 'Python',
      marks: '2.00',
    },
    {
      type: 'MultipleChoice' as const,
      stem: 'What does a flowchart describe?',
      options: ['The colour of the screen', 'The order of steps in a process', 'A student timetable', 'A fee invoice'],
      correctAnswer: 'The order of steps in a process',
      marks: '2.00',
    },
  ]

  const created: Array<{ questionId: string; versionId: string }> = []
  for (const item of bank) {
    const [question] = await db
      .insert(questions)
      .values({
        courseId: input.courseId,
        topic: 'Foundations',
        type: item.type,
        currentVersion: 1,
        createdBy: input.createdBy ?? null,
      })
      .returning({ id: questions.id })
    const [version] = await db
      .insert(questionVersions)
      .values({
        questionId: question!.id,
        version: 1,
        stem: item.stem,
        options: item.options,
        correctAnswer: item.correctAnswer,
        marks: item.marks,
        createdBy: input.createdBy ?? null,
      })
      .returning({ id: questionVersions.id })
    created.push({ questionId: question!.id, versionId: version!.id })
  }

  const [quiz] = await db
    .select({ id: assessments.id })
    .from(assessments)
    .where(and(eq(assessments.courseOfferingId, input.offeringId), eq(assessments.title, 'Week 3 quiz')))
    .limit(1)
  const quizId =
    quiz?.id
    ?? (
      await db
        .insert(assessments)
        .values({
          courseOfferingId: input.offeringId,
          title: 'Week 3 quiz',
          description: 'Ten minutes on the first module. Objective items are marked as soon as you submit.',
          type: 'Quiz',
          weight: '10.00',
          totalMarks: '7.00',
          dueAt: '2026-02-28T17:00:00.000Z',
          acceptsSubmissions: true,
          isPublished: true,
          createdBy: input.createdBy ?? null,
        })
        .returning({ id: assessments.id })
    )[0]!.id

  const [item] = await db
    .select({ id: assessmentItems.id })
    .from(assessmentItems)
    .where(eq(assessmentItems.assessmentId, quizId))
    .limit(1)
  if (item) return

  await db.insert(assessmentItems).values([
    {
      assessmentId: quizId,
      sequence: 0,
      questionId: created[0]!.questionId,
      questionVersionId: created[0]!.versionId,
    },
    {
      assessmentId: quizId,
      sequence: 1,
      drawTopic: 'Foundations',
      drawCourseId: input.courseId,
      drawCount: 2,
    },
  ])
}
