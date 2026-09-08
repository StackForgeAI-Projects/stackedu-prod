import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import { randomInt } from 'node:crypto'
import type {
  PaymentMethod,
  RegisterCoursesRequest,
  SaveOnboardingRequest,
  StudentAssessment,
  StudentCourseDetail,
  StudentDashboard,
  StudentFees,
  StudentLibraryResource,
  StudentNotification,
  StudentOnboarding,
  StudentProfile,
  StudentReceipt,
  StudentRegistrationState,
  StudentResults,
  StudentTranscript,
  SubmitAssessmentRequest,
} from '@stackedu/shared'
import { splitFullName, titleAndFirstName, displayFullName, formatDisplayName } from '@stackedu/shared'
import { env } from '../config/env'
import { getInstitutionDb, getPlatformDb } from '../db/connection'
import { institutions } from '../db/platform/schema'
import {
  academicYears,
  courses,
  departments,
  faculties,
  programmes,
  semesters,
} from '../db/institution/schema/academic'
import { assessments, resultBatches, results, submissions } from '../db/institution/schema/assessment'
import { notifications } from '../db/institution/schema/communication'
import {
  invoices,
  payments,
  receipts,
  studentFeeAccounts,
} from '../db/institution/schema/finance'
import { libraryResources } from '../db/institution/schema/library'
import { users } from '../db/institution/schema/people'
import { enrolments, onboardingProgress, studentProfiles, students } from '../db/institution/schema/students'
import {
  announcements,
  attendanceRecords,
  attendanceSessions,
  courseMaterials,
  courseOfferings,
  courseRegistrations,
  lecturerAssignments,
  rooms,
  timetableSlots,
} from '../db/institution/schema/teaching'
import { courseColor, formatClock } from '../lib/course-color'
import { badRequest, conflict, forbidden, notFound } from '../lib/errors'
import { createDownloadUrl, fileNameFromStorageKey } from '../lib/storage'
import { feeDescriptionForPayment, feeDescriptionFromLineItems } from '../lib/fee-description'
import { readPaymentPolicy } from '../lib/payment-policy-store'
import { initiatePaymentGateway } from './payment-gateway'
import {
  classifyFeeKindFromLineItems,
  allowsPartialPayment,
  validatePaymentAmount,
} from '@stackedu/shared'

const MAX_CREDITS = 21

function gradePointNumber(value: string | number | null): number | null {
  if (value === null || value === undefined) return null
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function courseType(yearOfStudy: number | null, studentYear: number): 'Compulsory' | 'Elective' {
  return yearOfStudy === studentYear ? 'Compulsory' : 'Elective'
}

export async function requireStudent(institutionId: string, userId: string) {
  const db = await getInstitutionDb(institutionId)
  const [row] = await db
    .select({
      studentId: students.id,
      userId: students.userId,
      studentNumber: students.studentNumber,
      yearOfStudy: students.yearOfStudy,
      enrolmentStatus: students.enrolmentStatus,
      feeHold: students.feeHold,
      admittedAt: students.admittedAt,
      programmeName: programmes.name,
      programmeCode: programmes.code,
      departmentId: departments.id,
      facultyName: faculties.name,
      firstName: studentProfiles.firstName,
      lastName: studentProfiles.lastName,
      dateOfBirth: studentProfiles.dateOfBirth,
      gender: studentProfiles.gender,
      phone: studentProfiles.contactPhone,
      nationality: studentProfiles.nationality,
      email: users.email,
      fullName: users.fullName,
    })
    .from(students)
    .innerJoin(users, eq(users.id, students.userId))
    .innerJoin(programmes, eq(programmes.id, students.programmeId))
    .leftJoin(departments, eq(departments.id, programmes.departmentId))
    .leftJoin(faculties, eq(faculties.id, departments.facultyId))
    .leftJoin(studentProfiles, eq(studentProfiles.studentId, students.id))
    .where(eq(students.userId, userId))
    .limit(1)

  if (!row) throw forbidden('This account is not linked to a student record.')
  return { db, ...row }
}

async function unreadCount(institutionId: string, userId: string): Promise<number> {
  const db = await getInstitutionDb(institutionId)
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
  return row?.count ?? 0
}

export async function getStudentProfile(
  institutionId: string,
  userId: string,
): Promise<StudentProfile> {
  const row = await requireStudent(institutionId, userId)
  const formattedName = displayFullName({
    fullName: row.fullName,
    firstName: row.firstName,
    lastName: row.lastName,
  })
  const firstName = formatDisplayName(row.firstName ?? titleAndFirstName(row.fullName))
  const lastName = formatDisplayName(row.lastName ?? splitFullName(row.fullName).lastName)
  return {
    studentId: row.studentId,
    userId: row.userId,
    studentNumber: row.studentNumber,
    fullName: formattedName,
    firstName,
    lastName,
    email: row.email,
    yearOfStudy: row.yearOfStudy,
    enrolmentStatus: row.enrolmentStatus,
    feeHold: row.feeHold,
    programmeName: row.programmeName,
    programmeCode: row.programmeCode,
    facultyName: row.facultyName,
    dateOfBirth: row.dateOfBirth,
    gender: row.gender,
    phone: row.phone,
    nationality: row.nationality,
    admittedAt: row.admittedAt,
    unreadCount: await unreadCount(institutionId, userId),
  }
}

async function currentSemester(institutionId: string) {
  const db = await getInstitutionDb(institutionId)
  const [row] = await db
    .select({
      id: semesters.id,
      name: semesters.name,
      registrationClosesAt: semesters.registrationClosesAt,
      status: semesters.status,
      yearName: academicYears.name,
    })
    .from(semesters)
    .innerJoin(academicYears, eq(academicYears.id, semesters.academicYearId))
    .where(eq(semesters.isCurrent, true))
    .limit(1)
  return row ?? null
}

export async function getStudentDashboard(
  institutionId: string,
  userId: string,
): Promise<StudentDashboard> {
  const profile = await getStudentProfile(institutionId, userId)
  const db = await getInstitutionDb(institutionId)
  const semester = await currentSemester(institutionId)

  const [account] = await db
    .select({
      balance: studentFeeAccounts.balance,
    })
    .from(studentFeeAccounts)
    .where(eq(studentFeeAccounts.studentId, profile.studentId))
    .limit(1)

  const [enrolment] = semester
    ? await db
        .select({
          cgpa: enrolments.cgpa,
          semesterGpa: enrolments.semesterGpa,
        })
        .from(enrolments)
        .where(
          and(eq(enrolments.studentId, profile.studentId), eq(enrolments.semesterId, semester.id)),
        )
        .limit(1)
    : []

  const attendance = await db
    .select({
      status: attendanceRecords.status,
    })
    .from(attendanceRecords)
    .where(eq(attendanceRecords.studentId, profile.studentId))

  const present = attendance.filter((row) => row.status === 'Present' || row.status === 'Late').length
  const attendanceRate = attendance.length === 0 ? null : Math.round((present / attendance.length) * 100)

  const registeredCourses = semester
    ? await listRegisteredCourses(institutionId, profile.studentId, profile.yearOfStudy, semester.id)
    : []

  const publishedResults = await db
    .select({
      offeringId: results.courseOfferingId,
      courseCode: courses.code,
      courseName: courses.name,
      credits: courses.credits,
      yearOfStudy: courses.yearOfStudy,
      grade: results.grade,
      gradePoint: results.gradePoint,
      totalScore: results.totalScore,
    })
    .from(results)
    .innerJoin(resultBatches, eq(resultBatches.id, results.resultBatchId))
    .innerJoin(courseOfferings, eq(courseOfferings.id, results.courseOfferingId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .where(and(eq(results.studentId, profile.studentId), eq(resultBatches.status, 'Published')))
    .orderBy(desc(results.createdAt))
    .limit(5)

  const schedule = semester
    ? await db
        .select({
          id: timetableSlots.id,
          offeringId: courseOfferings.id,
          courseCode: courses.code,
          courseName: courses.name,
          sessionType: timetableSlots.sessionType,
          startTime: timetableSlots.startTime,
          endTime: timetableSlots.endTime,
          room: rooms.name,
          dayOfWeek: timetableSlots.dayOfWeek,
        })
        .from(courseRegistrations)
        .innerJoin(courseOfferings, eq(courseOfferings.id, courseRegistrations.courseOfferingId))
        .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
        .innerJoin(timetableSlots, eq(timetableSlots.courseOfferingId, courseOfferings.id))
        .leftJoin(rooms, eq(rooms.id, timetableSlots.roomId))
        .where(
          and(
            eq(courseRegistrations.studentId, profile.studentId),
            eq(courseRegistrations.status, 'Approved'),
            eq(courseOfferings.semesterId, semester.id),
          ),
        )
    : []

  const [openInvoice] = await db
    .select({
      id: invoices.id,
      dueDate: invoices.dueDate,
      amountDue: invoices.amountDue,
      amountPaid: invoices.amountPaid,
    })
    .from(invoices)
    .where(eq(invoices.studentId, profile.studentId))
    .orderBy(desc(invoices.createdAt))
    .limit(1)

  const openAssessments = await db
    .select({
      id: assessments.id,
      title: assessments.title,
      dueAt: assessments.dueAt,
      courseCode: courses.code,
    })
    .from(assessments)
    .innerJoin(courseOfferings, eq(courseOfferings.id, assessments.courseOfferingId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .innerJoin(
      courseRegistrations,
      and(
        eq(courseRegistrations.courseOfferingId, courseOfferings.id),
        eq(courseRegistrations.studentId, profile.studentId),
        eq(courseRegistrations.status, 'Approved'),
      ),
    )
    .where(eq(assessments.isPublished, true))
    .orderBy(assessments.dueAt)
    .limit(5)

  const deadlines = [
    ...(openInvoice && openInvoice.amountDue - openInvoice.amountPaid > 0
      ? [
          {
            id: `fee-${openInvoice.id}`,
            title: 'Outstanding fees due',
            date: openInvoice.dueDate,
            type: 'fee' as const,
          },
        ]
      : []),
    ...(semester?.registrationClosesAt
      ? [
          {
            id: `reg-${semester.id}`,
            title: 'Course registration closes',
            date: semester.registrationClosesAt,
            type: 'registration' as const,
          },
        ]
      : []),
    ...openAssessments
      .filter((row) => row.dueAt)
      .map((row) => ({
        id: `asmt-${row.id}`,
        title: `${row.courseCode} — ${row.title}`,
        date: row.dueAt!.slice(0, 10),
        type: 'assignment' as const,
      })),
  ]

  return {
    profile,
    gpa: gradePointNumber(enrolment?.cgpa ?? enrolment?.semesterGpa ?? null),
    outstandingFees: Math.max(0, account?.balance ?? 0),
    attendanceRate,
    courses: registeredCourses,
    recentResults: publishedResults.map((row) => ({
      offeringId: row.offeringId,
      courseCode: row.courseCode,
      courseName: row.courseName,
      credits: row.credits,
      grade: row.grade,
      gradePoint: gradePointNumber(row.gradePoint),
      totalScore: gradePointNumber(row.totalScore),
      type: courseType(row.yearOfStudy, profile.yearOfStudy),
    })),
    schedule: schedule.map((row) => ({
      id: row.id,
      offeringId: row.offeringId,
      courseCode: row.courseCode,
      courseName: row.courseName,
      sessionType: row.sessionType,
      startTime: formatClock(row.startTime),
      endTime: formatClock(row.endTime),
      room: row.room,
      dayOfWeek: row.dayOfWeek,
      color: courseColor(row.courseCode),
    })),
    deadlines,
  }
}

async function listRegisteredCourses(
  institutionId: string,
  studentId: string,
  studentYear: number,
  semesterId: string,
) {
  const db = await getInstitutionDb(institutionId)
  const rows = await db
    .select({
      offeringId: courseOfferings.id,
      courseId: courses.id,
      code: courses.code,
      name: courses.name,
      credits: courses.credits,
      yearOfStudy: courses.yearOfStudy,
      status: courseRegistrations.status,
      lecturerName: users.fullName,
    })
    .from(courseRegistrations)
    .innerJoin(courseOfferings, eq(courseOfferings.id, courseRegistrations.courseOfferingId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .leftJoin(
      lecturerAssignments,
      and(eq(lecturerAssignments.courseOfferingId, courseOfferings.id), eq(lecturerAssignments.isLead, true)),
    )
    .leftJoin(users, eq(users.id, lecturerAssignments.lecturerId))
    .where(
      and(
        eq(courseRegistrations.studentId, studentId),
        eq(courseOfferings.semesterId, semesterId),
        eq(courseRegistrations.status, 'Approved'),
      ),
    )
    .orderBy(courses.code)

  return rows.map((row) => ({
    offeringId: row.offeringId,
    courseId: row.courseId,
    code: row.code,
    name: row.name,
    credits: row.credits,
    lecturerName: row.lecturerName,
    type: courseType(row.yearOfStudy, studentYear),
    color: courseColor(row.code),
    status: row.status,
  }))
}

export async function listStudentCourses(institutionId: string, userId: string) {
  const profile = await getStudentProfile(institutionId, userId)
  const semester = await currentSemester(institutionId)
  if (!semester) return { semester: null, courses: [] }
  return {
    semester: { id: semester.id, label: `${semester.name} ${semester.yearName}` },
    courses: await listRegisteredCourses(
      institutionId,
      profile.studentId,
      profile.yearOfStudy,
      semester.id,
    ),
  }
}

export async function getStudentCourse(
  institutionId: string,
  userId: string,
  offeringId: string,
): Promise<StudentCourseDetail> {
  const profile = await getStudentProfile(institutionId, userId)
  const db = await getInstitutionDb(institutionId)

  const [row] = await db
    .select({
      offeringId: courseOfferings.id,
      courseId: courses.id,
      code: courses.code,
      name: courses.name,
      description: courses.description,
      credits: courses.credits,
      yearOfStudy: courses.yearOfStudy,
      status: courseRegistrations.status,
      lecturerName: users.fullName,
      semesterName: semesters.name,
    })
    .from(courseRegistrations)
    .innerJoin(courseOfferings, eq(courseOfferings.id, courseRegistrations.courseOfferingId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .innerJoin(semesters, eq(semesters.id, courseOfferings.semesterId))
    .leftJoin(
      lecturerAssignments,
      and(eq(lecturerAssignments.courseOfferingId, courseOfferings.id), eq(lecturerAssignments.isLead, true)),
    )
    .leftJoin(users, eq(users.id, lecturerAssignments.lecturerId))
    .where(
      and(
        eq(courseRegistrations.studentId, profile.studentId),
        eq(courseOfferings.id, offeringId),
      ),
    )
    .limit(1)

  if (!row) throw notFound('That course')

  const [materials, openAssessments, attendance] = await Promise.all([
    db
      .select({
        id: courseMaterials.id,
        title: courseMaterials.title,
        description: courseMaterials.description,
        moduleName: courseMaterials.moduleName,
        externalUrl: courseMaterials.externalUrl,
        fileKey: courseMaterials.fileKey,
      })
      .from(courseMaterials)
      .where(and(eq(courseMaterials.courseOfferingId, offeringId), eq(courseMaterials.isPublished, true))),
    db
      .select({
        id: assessments.id,
        title: assessments.title,
        type: assessments.type,
        dueAt: assessments.dueAt,
        acceptsSubmissions: assessments.acceptsSubmissions,
      })
      .from(assessments)
      .where(and(eq(assessments.courseOfferingId, offeringId), eq(assessments.isPublished, true))),
    db
      .select({
        id: attendanceSessions.id,
        date: attendanceSessions.sessionDate,
        topic: attendanceSessions.topic,
        status: attendanceRecords.status,
      })
      .from(attendanceRecords)
      .innerJoin(attendanceSessions, eq(attendanceSessions.id, attendanceRecords.attendanceSessionId))
      .where(
        and(
          eq(attendanceRecords.studentId, profile.studentId),
          eq(attendanceSessions.courseOfferingId, offeringId),
        ),
      )
      .orderBy(desc(attendanceSessions.sessionDate)),
  ])

  const present = attendance.filter((item) => item.status === 'Present' || item.status === 'Late').length

  return {
    offeringId: row.offeringId,
    courseId: row.courseId,
    code: row.code,
    name: row.name,
    credits: row.credits,
    lecturerName: row.lecturerName,
    type: courseType(row.yearOfStudy, profile.yearOfStudy),
    color: courseColor(row.code),
    status: row.status,
    description: row.description,
    semesterName: row.semesterName,
    materials: materials.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      moduleName: item.moduleName,
      externalUrl: item.externalUrl ?? null,
      fileName: item.fileKey ? fileNameFromStorageKey(item.fileKey) : null,
      hasFile: Boolean(item.fileKey),
    })),
    assessments: openAssessments,
    attendance,
    attendanceRate: attendance.length === 0 ? null : Math.round((present / attendance.length) * 100),
  }
}

export async function getStudentMaterialDownloadUrl(
  institutionId: string,
  userId: string,
  materialId: string,
): Promise<{ url: string; expiresAt: string; fileName: string | null }> {
  const profile = await getStudentProfile(institutionId, userId)
  const db = await getInstitutionDb(institutionId)
  const [row] = await db
    .select({
      id: courseMaterials.id,
      offeringId: courseMaterials.courseOfferingId,
      fileKey: courseMaterials.fileKey,
      isPublished: courseMaterials.isPublished,
    })
    .from(courseMaterials)
    .where(eq(courseMaterials.id, materialId))
    .limit(1)
  if (!row?.fileKey || !row.isPublished) throw notFound('That file')

  const [registration] = await db
    .select({ id: courseRegistrations.id })
    .from(courseRegistrations)
    .where(
      and(
        eq(courseRegistrations.studentId, profile.studentId),
        eq(courseRegistrations.courseOfferingId, row.offeringId),
        eq(courseRegistrations.status, 'Approved'),
      ),
    )
    .limit(1)
  if (!registration) throw forbidden('You are not enrolled in that course.')

  const download = await createDownloadUrl(row.fileKey)
  return { ...download, fileName: fileNameFromStorageKey(row.fileKey) }
}

export async function getRegistrationState(
  institutionId: string,
  userId: string,
): Promise<StudentRegistrationState> {
  const profile = await getStudentProfile(institutionId, userId)
  const semester = await currentSemester(institutionId)
  if (!semester) {
    return {
      feeHold: profile.feeHold,
      maxCredits: MAX_CREDITS,
      registeredCredits: 0,
      registrationOpen: false,
      registrationClosesAt: null,
      offerings: [],
    }
  }

  const db = await getInstitutionDb(institutionId)
  const rows = await db
    .select({
      offeringId: courseOfferings.id,
      code: courses.code,
      name: courses.name,
      credits: courses.credits,
      yearOfStudy: courses.yearOfStudy,
      lecturerName: users.fullName,
      isOpen: courseOfferings.isOpenForRegistration,
      registrationId: courseRegistrations.id,
      status: courseRegistrations.status,
    })
    .from(courseOfferings)
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .leftJoin(
      lecturerAssignments,
      and(eq(lecturerAssignments.courseOfferingId, courseOfferings.id), eq(lecturerAssignments.isLead, true)),
    )
    .leftJoin(users, eq(users.id, lecturerAssignments.lecturerId))
    .leftJoin(
      courseRegistrations,
      and(
        eq(courseRegistrations.courseOfferingId, courseOfferings.id),
        eq(courseRegistrations.studentId, profile.studentId),
      ),
    )
    .where(eq(courseOfferings.semesterId, semester.id))
    .orderBy(courses.code)

  const registeredCredits = rows
    .filter((row) => row.status === 'Approved' || row.status === 'Pending')
    .reduce((sum, row) => sum + row.credits, 0)

  return {
    feeHold: profile.feeHold,
    maxCredits: MAX_CREDITS,
    registeredCredits,
    registrationOpen: semester.status === 'Open' || semester.status === 'InProgress',
    registrationClosesAt: semester.registrationClosesAt,
    offerings: rows.map((row) => ({
      offeringId: row.offeringId,
      code: row.code,
      name: row.name,
      credits: row.credits,
      lecturerName: row.lecturerName,
      type: courseType(row.yearOfStudy, profile.yearOfStudy),
      registered: row.status === 'Approved' || row.status === 'Pending',
      status: row.status,
    })),
  }
}

export async function registerForCourses(
  institutionId: string,
  userId: string,
  input: RegisterCoursesRequest,
) {
  const profile = await getStudentProfile(institutionId, userId)
  if (profile.feeHold) throw badRequest('Settle outstanding fees before registering for courses.')

  const state = await getRegistrationState(institutionId, userId)
  if (!state.registrationOpen) throw badRequest('Course registration is closed.')

  const selected = state.offerings.filter((offering) => input.offeringIds.includes(offering.offeringId))
  if (selected.length !== input.offeringIds.length) {
    throw badRequest('One or more selected courses are not available this semester.')
  }

  const extraCredits = selected
    .filter((offering) => !offering.registered)
    .reduce((sum, offering) => sum + offering.credits, 0)
  if (state.registeredCredits + extraCredits > state.maxCredits) {
    throw badRequest(`You cannot register more than ${state.maxCredits} credits.`)
  }

  const db = await getInstitutionDb(institutionId)
  const now = new Date().toISOString()

  for (const offering of selected) {
    if (offering.registered) continue
    await db
      .insert(courseRegistrations)
      .values({
        studentId: profile.studentId,
        courseOfferingId: offering.offeringId,
        status: 'Approved',
        registeredAt: now,
      })
      .onConflictDoNothing()
    await db
      .update(courseOfferings)
      .set({ enrolledCount: sql`${courseOfferings.enrolledCount} + 1` })
      .where(eq(courseOfferings.id, offering.offeringId))
  }

  return getRegistrationState(institutionId, userId)
}

export async function getStudentResults(
  institutionId: string,
  userId: string,
): Promise<StudentResults> {
  const profile = await getStudentProfile(institutionId, userId)
  const db = await getInstitutionDb(institutionId)

  const rows = await db
    .select({
      semesterId: semesters.id,
      semesterName: semesters.name,
      yearName: academicYears.name,
      offeringId: results.courseOfferingId,
      courseCode: courses.code,
      courseName: courses.name,
      credits: courses.credits,
      yearOfStudy: courses.yearOfStudy,
      grade: results.grade,
      gradePoint: results.gradePoint,
      totalScore: results.totalScore,
    })
    .from(results)
    .innerJoin(resultBatches, eq(resultBatches.id, results.resultBatchId))
    .innerJoin(courseOfferings, eq(courseOfferings.id, results.courseOfferingId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .innerJoin(semesters, eq(semesters.id, courseOfferings.semesterId))
    .innerJoin(academicYears, eq(academicYears.id, semesters.academicYearId))
    .where(and(eq(results.studentId, profile.studentId), eq(resultBatches.status, 'Published')))
    .orderBy(desc(semesters.startDate), courses.code)

  const grouped = new Map<string, StudentResults['semesters'][number]>()
  for (const row of rows) {
    const key = row.semesterId
    const existing = grouped.get(key) ?? {
      semesterId: row.semesterId,
      label: `${row.semesterName} ${row.yearName}`,
      gpa: null,
      courses: [],
    }
    existing.courses.push({
      offeringId: row.offeringId,
      courseCode: row.courseCode,
      courseName: row.courseName,
      credits: row.credits,
      grade: row.grade,
      gradePoint: gradePointNumber(row.gradePoint),
      totalScore: gradePointNumber(row.totalScore),
      type: courseType(row.yearOfStudy, profile.yearOfStudy),
    })
    grouped.set(key, existing)
  }

  const semestersOut = [...grouped.values()].map((semester) => {
    const earned = semester.courses.filter((course) => course.gradePoint !== null)
    const credits = earned.reduce((sum, course) => sum + course.credits, 0)
    const points = earned.reduce((sum, course) => sum + (course.gradePoint ?? 0) * course.credits, 0)
    return {
      ...semester,
      gpa: credits === 0 ? null : Math.round((points / credits) * 100) / 100,
    }
  })

  const all = semestersOut.flatMap((semester) => semester.courses)
  const credits = all.filter((course) => course.gradePoint !== null).reduce((sum, course) => sum + course.credits, 0)
  const points = all
    .filter((course) => course.gradePoint !== null)
    .reduce((sum, course) => sum + (course.gradePoint ?? 0) * course.credits, 0)

  const [enrolment] = await db
    .select({ standing: enrolments.academicStanding })
    .from(enrolments)
    .where(eq(enrolments.studentId, profile.studentId))
    .orderBy(desc(enrolments.createdAt))
    .limit(1)

  return {
    cgpa: credits === 0 ? null : Math.round((points / credits) * 100) / 100,
    standing: enrolment?.standing ?? null,
    semesters: semestersOut,
  }
}

export async function getStudentTranscript(
  institutionId: string,
  userId: string,
): Promise<StudentTranscript> {
  const [profile, resultsView] = await Promise.all([
    getStudentProfile(institutionId, userId),
    getStudentResults(institutionId, userId),
  ])
  return { profile, ...resultsView }
}

export async function getStudentFees(institutionId: string, userId: string): Promise<StudentFees> {
  const studentRow = await requireStudent(institutionId, userId)
  const profile = await getStudentProfile(institutionId, userId)
  const db = await getInstitutionDb(institutionId)
  const policy = await readPaymentPolicy(db)

  const [account] = await db
    .select()
    .from(studentFeeAccounts)
    .where(eq(studentFeeAccounts.studentId, profile.studentId))
    .limit(1)

  const invoiceRows = await db
    .select()
    .from(invoices)
    .where(eq(invoices.studentId, profile.studentId))
    .orderBy(desc(invoices.createdAt))

  const paymentRows = await db
    .select({
      id: payments.id,
      reference: payments.reference,
      amount: payments.amount,
      method: payments.method,
      status: payments.status,
      paidAt: payments.paidAt,
      createdAt: payments.createdAt,
      receiptNumber: receipts.receiptNumber,
    })
    .from(payments)
    .leftJoin(receipts, eq(receipts.paymentId, payments.id))
    .where(eq(payments.studentId, profile.studentId))
    .orderBy(desc(payments.createdAt))

  const fallbackDescription = studentRow.programmeName
    ? `${studentRow.programmeName} fees`
    : 'Tuition and fees'

  return {
    totalCharged: account?.totalCharged ?? 0,
    totalPaid: account?.totalPaid ?? 0,
    balance: account?.balance ?? 0,
    invoices: invoiceRows.map((row) => {
      const feeKind = classifyFeeKindFromLineItems(row.lineItems)
      const outstanding = row.amountDue - row.amountPaid
      return {
        id: row.id,
        invoiceNumber: row.invoiceNumber,
        description: feeDescriptionFromLineItems(row.lineItems, fallbackDescription),
        amountDue: row.amountDue,
        amountPaid: row.amountPaid,
        outstanding,
        status: row.status,
        dueDate: row.dueDate,
        feeKind,
        allowPartial: allowsPartialPayment(policy, {
          feeKind,
          departmentId: studentRow.departmentId,
          yearOfStudy: studentRow.yearOfStudy,
        }),
        lineItems: row.lineItems ?? [],
      }
    }),
    payments: paymentRows,
  }
}

export async function payStudentFees(
  institutionId: string,
  userId: string,
  input: { invoiceId?: string; amount: number; method: PaymentMethod; payerPhone?: string },
) {
  const studentRow = await requireStudent(institutionId, userId)
  const profile = await getStudentProfile(institutionId, userId)
  const db = await getInstitutionDb(institutionId)
  const policy = await readPaymentPolicy(db)
  const fees = await getStudentFees(institutionId, userId)

  const invoice = input.invoiceId
    ? fees.invoices.find((row) => row.id === input.invoiceId)
    : fees.invoices.find((row) => row.outstanding > 0)

  if (!invoice) throw badRequest('There is no invoice to pay.')
  const outstanding = invoice.outstanding

  const validation = validatePaymentAmount({
    amount: input.amount,
    outstanding,
    policy,
    context: {
      feeKind: invoice.feeKind,
      departmentId: studentRow.departmentId,
      yearOfStudy: studentRow.yearOfStudy,
    },
  })
  if (!validation.ok) throw badRequest(validation.message)

  if ((input.method === 'MoMo' || input.method === 'Airtel') && !input.payerPhone) {
    throw badRequest('Enter the mobile money number that will pay.')
  }

  const reference = `PAY-${profile.studentNumber}-${randomInt(1000, 9999)}`
  const now = new Date().toISOString()
  const gateway = await initiatePaymentGateway(institutionId, input.method, reference)
  const completeNow = gateway.completeImmediately

  const [payment] = await db
    .insert(payments)
    .values({
      reference,
      studentId: profile.studentId,
      invoiceId: invoice.id,
      amount: input.amount,
      method: input.method,
      status: completeNow ? 'Completed' : 'Pending',
      gatewayReference: gateway.gatewayReference,
      paidAt: completeNow ? now : null,
    })
    .returning({ id: payments.id, reference: payments.reference })

  if (completeNow) {
    const [receipt] = await db
      .insert(receipts)
      .values({
        receiptNumber: `RCT-${randomInt(100000, 999999)}`,
        paymentId: payment!.id,
        studentId: profile.studentId,
        amount: input.amount,
        issuedAt: now,
        verificationCode: `VR-${randomInt(100000, 999999)}`,
      })
      .returning({ receiptNumber: receipts.receiptNumber })

    await db
      .update(invoices)
      .set({
        amountPaid: invoice.amountPaid + input.amount,
        status: invoice.amountPaid + input.amount >= invoice.amountDue ? 'Paid' : 'PartiallyPaid',
      })
      .where(eq(invoices.id, invoice.id))

    const [account] = await db
      .select()
      .from(studentFeeAccounts)
      .where(eq(studentFeeAccounts.studentId, profile.studentId))
      .limit(1)

    if (account) {
      const totalPaid = account.totalPaid + input.amount
      await db
        .update(studentFeeAccounts)
        .set({
          totalPaid,
          balance: account.totalCharged - totalPaid,
          lastPaymentAt: now,
        })
        .where(eq(studentFeeAccounts.id, account.id))
    }

    void receipt
  }

  return getStudentFees(institutionId, userId)
}

export async function getStudentReceipt(
  institutionId: string,
  userId: string,
  paymentId: string,
): Promise<StudentReceipt> {
  const profile = await getStudentProfile(institutionId, userId)
  const db = await getInstitutionDb(institutionId)
  const platform = getPlatformDb()

  const [row] = await db
    .select({
      receiptNumber: receipts.receiptNumber,
      reference: payments.reference,
      amount: payments.amount,
      method: payments.method,
      paidAt: payments.paidAt,
      verificationCode: receipts.verificationCode,
      lineItems: invoices.lineItems,
      programmeName: programmes.name,
      invoiceAmountPaid: invoices.amountPaid,
    })
    .from(payments)
    .leftJoin(receipts, eq(receipts.paymentId, payments.id))
    .leftJoin(invoices, eq(invoices.id, payments.invoiceId))
    .innerJoin(students, eq(students.id, payments.studentId))
    .innerJoin(programmes, eq(programmes.id, students.programmeId))
    .where(and(eq(payments.id, paymentId), eq(payments.studentId, profile.studentId)))
    .limit(1)

  if (!row) throw notFound('That receipt')

  const [institution] = await platform
    .select({ name: institutions.name })
    .from(institutions)
    .where(eq(institutions.id, institutionId))
    .limit(1)

  const fallback = row.programmeName ? `${row.programmeName} fees` : 'Tuition and fees'

  return {
    receiptNumber: row.receiptNumber ?? row.reference,
    reference: row.reference,
    amount: row.amount,
    method: row.method,
    paidAt: row.paidAt,
    studentNumber: profile.studentNumber,
    studentName: profile.fullName,
    institutionName: institution?.name ?? 'StackEDU',
    description: feeDescriptionForPayment(
      row.lineItems,
      row.amount,
      Math.max(0, (row.invoiceAmountPaid ?? row.amount) - row.amount),
      fallback,
    ),
    verificationCode: row.verificationCode,
  }
}

export async function listStudentNotifications(
  institutionId: string,
  userId: string,
): Promise<StudentNotification[]> {
  await requireStudent(institutionId, userId)
  const db = await getInstitutionDb(institutionId)
  return db
    .select({
      id: notifications.id,
      title: notifications.title,
      body: notifications.body,
      category: notifications.category,
      actionUrl: notifications.actionUrl,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
}

export async function markNotificationRead(
  institutionId: string,
  userId: string,
  notificationId: string,
) {
  await requireStudent(institutionId, userId)
  const db = await getInstitutionDb(institutionId)
  const [updated] = await db
    .update(notifications)
    .set({ readAt: new Date().toISOString() })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
    .returning({ id: notifications.id })
  if (!updated) throw notFound('That notification')
  return listStudentNotifications(institutionId, userId)
}

export async function listStudentLibrary(
  institutionId: string,
  userId: string,
): Promise<StudentLibraryResource[]> {
  await requireStudent(institutionId, userId)
  const db = await getInstitutionDb(institutionId)
  return db
    .select({
      id: libraryResources.id,
      title: libraryResources.title,
      author: libraryResources.author,
      type: libraryResources.type,
      description: libraryResources.description,
      subjectTags: libraryResources.subjectTags,
      publicationYear: libraryResources.publicationYear,
    })
    .from(libraryResources)
    .where(eq(libraryResources.isPublished, true))
    .orderBy(libraryResources.title)
}

export async function getStudentOnboarding(
  institutionId: string,
  userId: string,
): Promise<StudentOnboarding> {
  const profile = await getStudentProfile(institutionId, userId)
  const db = await getInstitutionDb(institutionId)
  const [row] = await db
    .select({
      completedSteps: onboardingProgress.completedSteps,
      currentStep: onboardingProgress.currentStep,
      completedAt: onboardingProgress.completedAt,
    })
    .from(onboardingProgress)
    .where(eq(onboardingProgress.studentId, profile.studentId))
    .limit(1)

  return {
    completedSteps: row?.completedSteps ?? [],
    currentStep: row?.currentStep ?? null,
    completedAt: row?.completedAt ?? null,
  }
}

export async function saveStudentOnboarding(
  institutionId: string,
  userId: string,
  input: SaveOnboardingRequest,
): Promise<StudentOnboarding> {
  const profile = await getStudentProfile(institutionId, userId)
  const db = await getInstitutionDb(institutionId)
  const completedAt = input.complete ? new Date().toISOString() : null

  const [existing] = await db
    .select({ id: onboardingProgress.id })
    .from(onboardingProgress)
    .where(eq(onboardingProgress.studentId, profile.studentId))
    .limit(1)

  if (existing) {
    await db
      .update(onboardingProgress)
      .set({
        completedSteps: input.completedSteps,
        currentStep: input.currentStep ?? null,
        completedAt,
      })
      .where(eq(onboardingProgress.id, existing.id))
  } else {
    await db.insert(onboardingProgress).values({
      studentId: profile.studentId,
      completedSteps: input.completedSteps,
      currentStep: input.currentStep ?? null,
      completedAt,
    })
  }

  return getStudentOnboarding(institutionId, userId)
}

export async function listStudentAssessments(
  institutionId: string,
  userId: string,
): Promise<StudentAssessment[]> {
  const profile = await getStudentProfile(institutionId, userId)
  const db = await getInstitutionDb(institutionId)

  const rows = await db
    .select({
      id: assessments.id,
      offeringId: assessments.courseOfferingId,
      title: assessments.title,
      description: assessments.description,
      courseCode: courses.code,
      courseName: courses.name,
      dueAt: assessments.dueAt,
      acceptsSubmissions: assessments.acceptsSubmissions,
      submissionId: submissions.id,
    })
    .from(assessments)
    .innerJoin(courseOfferings, eq(courseOfferings.id, assessments.courseOfferingId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .innerJoin(
      courseRegistrations,
      and(
        eq(courseRegistrations.courseOfferingId, courseOfferings.id),
        eq(courseRegistrations.studentId, profile.studentId),
        eq(courseRegistrations.status, 'Approved'),
      ),
    )
    .leftJoin(
      submissions,
      and(eq(submissions.assessmentId, assessments.id), eq(submissions.studentId, profile.studentId)),
    )
    .where(and(eq(assessments.isPublished, true), eq(assessments.acceptsSubmissions, true)))
    .orderBy(assessments.dueAt)

  return rows.map((row) => ({
    id: row.id,
    offeringId: row.offeringId,
    title: row.title,
    description: row.description,
    courseCode: row.courseCode,
    courseName: row.courseName,
    dueAt: row.dueAt,
    acceptsSubmissions: row.acceptsSubmissions,
    submitted: Boolean(row.submissionId),
  }))
}

export async function submitStudentAssessment(
  institutionId: string,
  userId: string,
  assessmentId: string,
  input: SubmitAssessmentRequest,
) {
  const profile = await getStudentProfile(institutionId, userId)
  const assessmentsList = await listStudentAssessments(institutionId, userId)
  const assessment = assessmentsList.find((row) => row.id === assessmentId)
  if (!assessment) throw notFound('That assignment')
  if (assessment.submitted) throw conflict('You have already submitted this assignment.')

  const db = await getInstitutionDb(institutionId)
  await db.insert(submissions).values({
    assessmentId,
    studentId: profile.studentId,
    status: 'Submitted',
    submittedAt: new Date().toISOString(),
    textResponse: input.textResponse,
  })

  return listStudentAssessments(institutionId, userId)
}

export async function listStudentAnnouncements(institutionId: string, userId: string) {
  await requireStudent(institutionId, userId)
  const db = await getInstitutionDb(institutionId)
  return db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      publishedAt: announcements.publishedAt,
    })
    .from(announcements)
    .where(eq(announcements.isPinned, true))
    .limit(10)
}
