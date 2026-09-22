import { randomBytes } from 'node:crypto'
import { and, desc, eq, gte, inArray, isNull, ne, sql } from 'drizzle-orm'
import type {
  AcademicAtRiskStudent,
  AcademicCalendarEvent,
  AcademicCourseRow,
  AcademicDashboard,
  AcademicDepartmentOption,
  AcademicLecturerRow,
  AcademicNotification,
  AcademicProfile,
  AcademicProgrammeDetail,
  AcademicProgrammeRow,
  AcademicReports,
  AcademicResultBatch,
  AcademicSemesterOption,
  AcademicStudentDetail,
  AcademicStudentRow,
  AcademicTimetableSlot,
  CreateAcademicCalendarEventRequest,
  CreateAcademicCourseRequest,
  CreateAcademicProgrammeRequest,
  ChangeAcademicStudentStatusRequest,
  BulkCreateAcademicCoursesRequest,
  RejectResultBatchRequest,
  UpdateAcademicCalendarEventRequest,
  UpdateAcademicCourseRequest,
  UpdateAcademicProgrammeRequest,
  UserRole,
} from '@stackedu/shared'
import { DEFAULT_SEMESTER_MAX_CREDITS, formatAppDateDdMmYyyy, COURSE_DELETE_HAS_ENROLLMENTS, isSemesterCalendarCategory, LECTURER_ASSIGNMENT_REQUIRES_SEMESTER, RELEASED_RESULT_BATCH_STATUSES, timetableWeekdayLabel } from '@stackedu/shared'
import { getInstitutionDb, getPlatformDb } from '../db/connection'
import { institutions } from '../db/platform/schema'
import { applications } from '../db/institution/schema/admissions'
import {
  academicCalendarEvents,
  academicYears,
  coursePrerequisites,
  courses,
  departments,
  faculties,
  programmes,
  programmeRequirements,
  semesters,
} from '../db/institution/schema/academic'
import { resultBatches, results } from '../db/institution/schema/assessment'
import { notifications } from '../db/institution/schema/communication'
import { studentFeeAccounts } from '../db/institution/schema/finance'
import { riskFactors, riskInterventions, riskScores } from '../db/institution/schema/ai'
import { users } from '../db/institution/schema/people'
import {
  attendanceRecords,
  attendanceSessions,
  courseOfferings,
  courseRegistrations,
  lecturerAssignments,
  rooms,
  timetableSlots,
} from '../db/institution/schema/teaching'
import {
  enrolmentHistory,
  enrolments,
  studentProfiles,
  students,
} from '../db/institution/schema/students'
import {
  notifyAcademicCalendarChange,
  notifyCourseCatalogueChange,
  notifyLecturerOfResultReview,
  notifyUsers,
} from './role-notifications'
import { writeAudit } from '../lib/audit'
import { courseColor, formatClock } from '../lib/course-color'
import { badRequest, conflict, forbidden, notFound } from '../lib/errors'

import { titleAndFirstName } from '@stackedu/shared'

export function firstName(fullName: string): string {
  return titleAndFirstName(fullName)
}

export function initials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

/** CSC101 -> CSC 101 */
export function formatCourseCode(code: string): string {
  const match = code.match(/^([A-Za-z]+)(\d+.*)$/)
  if (!match) return code
  return `${match[1]!.toUpperCase()} ${match[2]}`
}

export function formatDisplayDate(value: string | null | undefined): string {
  if (!value) return ''
  return formatAppDateDdMmYyyy(value)
}

export function standingLabel(standing: string): string {
  switch (standing) {
    case 'Good':
      return 'Good Standing'
    case 'Probation':
      return 'Probation'
    case 'Suspension':
      return 'Suspended'
    default:
      return standing
  }
}

export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  return formatDisplayDate(iso)
}

function batchStatusLabel(status: string): AcademicResultBatch['status'] {
  if (status === 'PendingReview') return 'Pending'
  if (status === 'Approved' || status === 'Published') return status
  return 'Pending'
}

function dbBatchStatus(status: AcademicResultBatch['status'] | undefined): string | undefined {
  if (!status) return undefined
  if (status === 'Pending') return 'PendingReview'
  return status
}

function parseHour(startTime: string): number {
  return Number.parseInt(startTime.slice(0, 2), 10)
}

function deptPrefix(code: string): string {
  return code.replace(/\d.*/, '').toUpperCase()
}

export async function unreadCount(institutionId: string, userId: string): Promise<number> {
  const db = await getInstitutionDb(institutionId)
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
  return row?.count ?? 0
}

export async function currentSemester(institutionId: string) {
  const db = await getInstitutionDb(institutionId)
  const [row] = await db
    .select({
      id: semesters.id,
      name: semesters.name,
      yearName: academicYears.name,
    })
    .from(semesters)
    .innerJoin(academicYears, eq(academicYears.id, semesters.academicYearId))
    .where(eq(semesters.isCurrent, true))
    .limit(1)
  return row ?? null
}

export async function getAcademicProfile(
  institutionId: string,
  userId: string,
): Promise<AcademicProfile> {
  const db = await getInstitutionDb(institutionId)
  const platform = getPlatformDb()
  const [user] = await db
    .select({
      userId: users.id,
      fullName: users.fullName,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  if (!user || user.role !== 'AcademicAdmin') {
    throw forbidden('This account is not an academic administrator.')
  }

  const [institution] = await platform
    .select({ name: institutions.name, shortName: institutions.shortName })
    .from(institutions)
    .where(eq(institutions.id, institutionId))
    .limit(1)

  return {
    userId: user.userId,
    fullName: user.fullName,
    firstName: firstName(user.fullName),
    email: user.email,
    role: user.role,
    institutionName: institution?.name ?? 'Institution',
    institutionShortName: institution?.shortName ?? 'INS',
    unreadCount: await unreadCount(institutionId, userId),
  }
}

export async function getAcademicDashboard(
  institutionId: string,
  userId: string,
): Promise<AcademicDashboard> {
  const profile = await getAcademicProfile(institutionId, userId)
  const db = await getInstitutionDb(institutionId)
  const semester = await currentSemester(institutionId)
  const today = new Date().toISOString().slice(0, 10)

  const [enrolledRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(students)
    .where(eq(students.enrolmentStatus, 'Active'))

  const [pendingAppsRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(applications)
    .where(inArray(applications.status, ['Submitted', 'UnderReview', 'DocumentsRequested']))

  const [pendingResultsRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(resultBatches)
    .where(eq(resultBatches.status, 'PendingReview'))

  const [atRiskRow] = await db
    .select({ count: sql<number>`count(distinct ${riskScores.studentId})::int` })
    .from(riskScores)
    .where(inArray(riskScores.level, ['High', 'Medium']))

  const recentApplicationRows = await db
    .select({
      id: applications.id,
      reference: applications.reference,
      fullName: sql<string>`${applications.firstName} || ' ' || ${applications.lastName}`,
      programmeName: programmes.name,
      status: applications.status,
      submittedAt: applications.submittedAt,
    })
    .from(applications)
    .innerJoin(programmes, eq(programmes.id, applications.programmeId))
    .orderBy(desc(applications.submittedAt))
    .limit(5)

  const pendingResultRows = await db
    .select({
      id: resultBatches.id,
      courseCode: courses.code,
      courseName: courses.name,
      lecturerName: users.fullName,
      submittedAt: resultBatches.submittedAt,
      studentCount: sql<number>`count(${results.id})::int`,
    })
    .from(resultBatches)
    .innerJoin(courseOfferings, eq(courseOfferings.id, resultBatches.courseOfferingId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .leftJoin(results, eq(results.resultBatchId, resultBatches.id))
    .leftJoin(
      lecturerAssignments,
      and(
        eq(lecturerAssignments.courseOfferingId, courseOfferings.id),
        eq(lecturerAssignments.isLead, true),
      ),
    )
    .leftJoin(users, eq(users.id, lecturerAssignments.lecturerId))
    .where(eq(resultBatches.status, 'PendingReview'))
    .groupBy(
      resultBatches.id,
      courses.code,
      courses.name,
      users.fullName,
      resultBatches.submittedAt,
    )
    .orderBy(desc(resultBatches.submittedAt))
    .limit(4)

  const upcomingEventRows = await db
    .select({
      id: academicCalendarEvents.id,
      title: academicCalendarEvents.title,
      category: academicCalendarEvents.category,
      startDate: academicCalendarEvents.startDate,
      endDate: academicCalendarEvents.endDate,
    })
    .from(academicCalendarEvents)
    .where(gte(academicCalendarEvents.startDate, today))
    .orderBy(academicCalendarEvents.startDate)
    .limit(3)

  return {
    profile,
    stats: {
      totalEnrolled: enrolledRow?.count ?? 0,
      pendingApplications: pendingAppsRow?.count ?? 0,
      resultsPendingApproval: pendingResultsRow?.count ?? 0,
      atRiskStudents: atRiskRow?.count ?? 0,
    },
    recentApplications: recentApplicationRows.map((row) => ({
      id: row.id,
      reference: row.reference,
      fullName: row.fullName,
      programmeName: row.programmeName,
      status: row.status,
      submittedAt: row.submittedAt,
    })),
    pendingResults: pendingResultRows.map((row) => ({
      id: row.id,
      courseCode: formatCourseCode(row.courseCode),
      courseName: row.courseName,
      lecturerName: row.lecturerName,
      submittedAt: row.submittedAt,
      studentCount: row.studentCount,
    })),
    upcomingEvents: upcomingEventRows.map((row) => ({
      id: row.id,
      title: row.title,
      category: row.category,
      startDate: row.startDate,
      endDate: row.endDate,
    })),
  }
}

export async function listAcademicStudents(institutionId: string): Promise<AcademicStudentRow[]> {
  const db = await getInstitutionDb(institutionId)
  const rows = await db
    .select({
      id: students.id,
      studentNumber: students.studentNumber,
      fullName: users.fullName,
      programmeName: programmes.name,
      yearOfStudy: students.yearOfStudy,
      admittedAt: students.admittedAt,
      status: students.enrolmentStatus,
      firstName: studentProfiles.firstName,
      lastName: studentProfiles.lastName,
    })
    .from(students)
    .innerJoin(users, eq(users.id, students.userId))
    .innerJoin(programmes, eq(programmes.id, students.programmeId))
    .leftJoin(studentProfiles, eq(studentProfiles.studentId, students.id))
    .orderBy(users.fullName)

  return rows.map((row) => {
    const given = row.firstName ?? firstName(row.fullName)
    return {
      id: row.id,
      studentNumber: row.studentNumber,
      fullName: row.fullName,
      firstName: given,
      initials: initials(row.fullName),
      programmeName: row.programmeName,
      yearOfStudy: row.yearOfStudy,
      enrollmentDate: row.admittedAt,
      status: row.status,
    }
  })
}

export async function getAcademicStudent(
  institutionId: string,
  idOrNumber: string,
): Promise<AcademicStudentDetail> {
  const db = await getInstitutionDb(institutionId)
  const isUuid = /^[0-9a-f-]{36}$/i.test(idOrNumber)
  const [row] = await db
    .select({
      id: students.id,
      studentNumber: students.studentNumber,
      fullName: users.fullName,
      email: users.email,
      programmeName: programmes.name,
      yearOfStudy: students.yearOfStudy,
      admittedAt: students.admittedAt,
      expectedGraduationAt: students.expectedGraduationAt,
      status: students.enrolmentStatus,
      firstName: studentProfiles.firstName,
      lastName: studentProfiles.lastName,
      dateOfBirth: studentProfiles.dateOfBirth,
      gender: studentProfiles.gender,
      nationality: studentProfiles.nationality,
      phone: studentProfiles.contactPhone,
      address: studentProfiles.address,
    })
    .from(students)
    .innerJoin(users, eq(users.id, students.userId))
    .innerJoin(programmes, eq(programmes.id, students.programmeId))
    .leftJoin(studentProfiles, eq(studentProfiles.studentId, students.id))
    .where(isUuid ? eq(students.id, idOrNumber) : eq(students.studentNumber, idOrNumber))
    .limit(1)

  if (!row) throw notFound('That student')

  const [account] = await db
    .select({ balance: studentFeeAccounts.balance })
    .from(studentFeeAccounts)
    .where(eq(studentFeeAccounts.studentId, row.id))
    .limit(1)

  const [latestEnrolment] = await db
    .select({
      cgpa: enrolments.cgpa,
      academicStanding: enrolments.academicStanding,
    })
    .from(enrolments)
    .where(eq(enrolments.studentId, row.id))
    .orderBy(desc(enrolments.createdAt))
    .limit(1)

  const semesterRows = await db
    .select({
      semesterId: enrolments.semesterId,
      semesterName: semesters.name,
      yearName: academicYears.name,
      semesterGpa: enrolments.semesterGpa,
    })
    .from(enrolments)
    .innerJoin(semesters, eq(semesters.id, enrolments.semesterId))
    .innerJoin(academicYears, eq(academicYears.id, semesters.academicYearId))
    .where(eq(enrolments.studentId, row.id))
    .orderBy(desc(academicYears.startDate), desc(semesters.sequence))

  const resultRows = await db
    .select({
      code: courses.code,
      name: courses.name,
      grade: results.grade,
      credits: results.creditsEarned,
      semesterId: resultBatches.semesterId,
    })
    .from(results)
    .innerJoin(resultBatches, eq(resultBatches.id, results.resultBatchId))
    .innerJoin(courseOfferings, eq(courseOfferings.id, results.courseOfferingId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .where(and(eq(results.studentId, row.id), inArray(resultBatches.status, [...RELEASED_RESULT_BATCH_STATUSES])))

  const historyRows = await db
    .select({
      effectiveDate: enrolmentHistory.effectiveDate,
      toStatus: enrolmentHistory.toStatus,
      reason: enrolmentHistory.reason,
    })
    .from(enrolmentHistory)
    .where(eq(enrolmentHistory.studentId, row.id))
    .orderBy(desc(enrolmentHistory.createdAt))

  const semestersWithResults = semesterRows.map((semester) => ({
    name: `${semester.semesterName} · ${semester.yearName}`,
    gpa: semester.semesterGpa ? Number(semester.semesterGpa) : null,
    results: resultRows
      .filter((result) => result.semesterId === semester.semesterId)
      .map((result) => ({
        code: formatCourseCode(result.code),
        name: result.name,
        grade: result.grade ?? '—',
        credits: result.credits,
      })),
  }))

  const timeline = [
    ...(row.admittedAt
      ? [{ date: formatDisplayDate(row.admittedAt), event: 'Admitted', type: 'admission' }]
      : []),
    ...historyRows.map((entry) => ({
      date: formatDisplayDate(entry.effectiveDate),
      event: entry.toStatus,
      type: 'status',
      notes: entry.reason ?? undefined,
    })),
  ]

  const given = row.firstName ?? firstName(row.fullName)

  return {
    id: row.id,
    studentNumber: row.studentNumber,
    fullName: row.fullName,
    firstName: given,
    initials: initials(row.fullName),
    programmeName: row.programmeName,
    yearOfStudy: row.yearOfStudy,
    enrollmentDate: row.admittedAt,
    status: row.status,
    email: row.email,
    phone: row.phone,
    dateOfBirth: row.dateOfBirth,
    gender: row.gender,
    nationality: row.nationality,
    address: row.address,
    expectedGraduation: row.expectedGraduationAt,
    cgpa: latestEnrolment?.cgpa ? Number(latestEnrolment.cgpa) : null,
    standing: standingLabel(latestEnrolment?.academicStanding ?? 'Good'),
    feeBalance: account?.balance ?? 0,
    semesters: semestersWithResults,
    timeline,
  }
}

export async function listAcademicCourses(institutionId: string): Promise<AcademicCourseRow[]> {
  const db = await getInstitutionDb(institutionId)
  const semester = await currentSemester(institutionId)

  const rows = await db
    .select({
      id: courses.id,
      code: courses.code,
      name: courses.name,
      department: departments.name,
      credits: courses.credits,
      yearOfStudy: courses.yearOfStudy,
      isActive: courses.isActive,
      description: courses.description,
      lecturerId: lecturerAssignments.lecturerId,
      lecturerName: users.fullName,
      enrolled: courseOfferings.enrolledCount,
      semesterName: semesters.name,
      semesterId: courseOfferings.semesterId,
      openForRegistration: courseOfferings.isOpenForRegistration,
    })
    .from(courses)
    .innerJoin(departments, eq(departments.id, courses.departmentId))
    .leftJoin(
      courseOfferings,
      semester
        ? and(eq(courseOfferings.courseId, courses.id), eq(courseOfferings.semesterId, semester.id))
        : eq(courseOfferings.courseId, courses.id),
    )
    .leftJoin(semesters, eq(semesters.id, courseOfferings.semesterId))
    .leftJoin(
      lecturerAssignments,
      and(
        eq(lecturerAssignments.courseOfferingId, courseOfferings.id),
        eq(lecturerAssignments.isLead, true),
      ),
    )
    .leftJoin(users, eq(users.id, lecturerAssignments.lecturerId))
    .orderBy(courses.code)

  const prereqRows = await db
    .select({
      courseId: coursePrerequisites.courseId,
      prerequisiteCode: courses.code,
    })
    .from(coursePrerequisites)
    .innerJoin(courses, eq(courses.id, coursePrerequisites.prerequisiteCourseId))

  const prereqsByCourse = new Map<string, string[]>()
  for (const prereq of prereqRows) {
    const current = prereqsByCourse.get(prereq.courseId) ?? []
    current.push(formatCourseCode(prereq.prerequisiteCode))
    prereqsByCourse.set(prereq.courseId, current)
  }

  return rows.map((row) => ({
    id: row.id,
    code: formatCourseCode(row.code),
    name: row.name,
    department: row.department,
    credits: row.credits,
    type: row.yearOfStudy === 1 ? 'Compulsory' : 'Elective',
    lecturerId: row.lecturerId,
    lecturerName: row.lecturerName,
    enrolled: row.enrolled ?? 0,
    status: row.isActive ? 'Active' : 'Archived',
    description: row.description,
    prerequisites: prereqsByCourse.get(row.id) ?? [],
    semester: row.semesterName,
    semesterId: row.semesterId ?? null,
    openForRegistration: row.openForRegistration ?? true,
  }))
}

export async function listAcademicDepartments(
  institutionId: string,
): Promise<AcademicDepartmentOption[]> {
  const db = await getInstitutionDb(institutionId)
  return db
    .select({
      id: departments.id,
      name: departments.name,
      code: departments.code,
    })
    .from(departments)
    .where(eq(departments.isActive, true))
    .orderBy(departments.name)
}

export async function listAcademicProgrammes(institutionId: string): Promise<AcademicProgrammeRow[]> {
  const db = await getInstitutionDb(institutionId)
  const rows = await db
    .select({
      id: programmes.id,
      code: programmes.code,
      name: programmes.name,
      department: departments.name,
      faculty: faculties.name,
      durationYears: programmes.durationYears,
      totalCredits: programmes.totalCreditsRequired,
      isActive: programmes.isActive,
      description: sql<string | null>`null`,
    })
    .from(programmes)
    .innerJoin(departments, eq(departments.id, programmes.departmentId))
    .innerJoin(faculties, eq(faculties.id, departments.facultyId))
    .orderBy(programmes.code)

  const enrolledCounts = await db
    .select({
      programmeId: students.programmeId,
      count: sql<number>`count(*)::int`,
    })
    .from(students)
    .where(eq(students.enrolmentStatus, 'Active'))
    .groupBy(students.programmeId)

  const enrolledByProgramme = new Map(enrolledCounts.map((row) => [row.programmeId, row.count]))

  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    department: row.department,
    faculty: row.faculty,
    duration: `${row.durationYears} year${row.durationYears === 1 ? '' : 's'}`,
    totalCredits: row.totalCredits,
    enrolled: enrolledByProgramme.get(row.id) ?? 0,
    status: row.isActive ? 'Active' : 'Inactive',
    description: row.description,
  }))
}

export async function getAcademicProgramme(
  institutionId: string,
  programmeId: string,
): Promise<AcademicProgrammeDetail> {
  const listed = await listAcademicProgrammes(institutionId)
  const summary = listed.find((row) => row.id === programmeId)
  if (!summary) throw notFound('That programme')

  const db = await getInstitutionDb(institutionId)
  const [programme] = await db
    .select({ departmentId: programmes.departmentId, durationYears: programmes.durationYears })
    .from(programmes)
    .where(eq(programmes.id, programmeId))
    .limit(1)
  if (!programme) throw notFound('That programme')

  const courseRows = await db
    .select({
      code: courses.code,
      name: courses.name,
      credits: courses.credits,
      yearOfStudy: courses.yearOfStudy,
    })
    .from(courses)
    .where(eq(courses.departmentId, programme.departmentId))
    .orderBy(courses.yearOfStudy, courses.code)

  const requirements = await db
    .select({ yearOfStudy: programmeRequirements.yearOfStudy })
    .from(programmeRequirements)
    .where(eq(programmeRequirements.programmeId, programmeId))
    .orderBy(programmeRequirements.yearOfStudy)

  const years = requirements.length
    ? requirements.map((req) => req.yearOfStudy)
    : Array.from({ length: programme.durationYears }, (_, index) => index + 1)

  const yearsOut = years.map((year) => ({
    year,
    semesters: [
      {
        name: 'Semester 1',
        courses: courseRows
          .filter((course) => (course.yearOfStudy ?? year) === year)
          .map((course) => ({
            code: formatCourseCode(course.code),
            name: course.name,
            type: 'Compulsory' as const,
            credits: course.credits,
          })),
      },
    ],
  }))

  return { ...summary, years: yearsOut }
}

export async function listAcademicCalendarEvents(
  institutionId: string,
): Promise<AcademicCalendarEvent[]> {
  const db = await getInstitutionDb(institutionId)
  const semester = await currentSemester(institutionId)
  const rows = await db
    .select({
      id: academicCalendarEvents.id,
      title: academicCalendarEvents.title,
      category: academicCalendarEvents.category,
      startDate: academicCalendarEvents.startDate,
      endDate: academicCalendarEvents.endDate,
      description: academicCalendarEvents.description,
      semesterId: academicCalendarEvents.semesterId,
    })
    .from(academicCalendarEvents)
    .orderBy(academicCalendarEvents.startDate)

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    type: row.category,
    startDate: row.startDate,
    endDate: row.endDate,
    description: row.description,
    affectsAll: row.semesterId === null || row.semesterId === semester?.id,
  }))
}

export async function listAcademicTimetableSlots(
  institutionId: string,
): Promise<AcademicTimetableSlot[]> {
  const db = await getInstitutionDb(institutionId)
  const semester = await currentSemester(institutionId)
  if (!semester) return []

  const rows = await db
    .select({
      id: timetableSlots.id,
      day: timetableSlots.dayOfWeek,
      startTime: timetableSlots.startTime,
      endTime: timetableSlots.endTime,
      courseCode: courses.code,
      courseName: courses.name,
      lecturer: users.fullName,
      lecturerId: lecturerAssignments.lecturerId,
      room: rooms.name,
      type: timetableSlots.sessionType,
      dept: departments.code,
    })
    .from(timetableSlots)
    .innerJoin(courseOfferings, eq(courseOfferings.id, timetableSlots.courseOfferingId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .innerJoin(departments, eq(departments.id, courses.departmentId))
    .leftJoin(rooms, eq(rooms.id, timetableSlots.roomId))
    .leftJoin(
      lecturerAssignments,
      and(
        eq(lecturerAssignments.courseOfferingId, courseOfferings.id),
        eq(lecturerAssignments.isLead, true),
      ),
    )
    .leftJoin(users, eq(users.id, lecturerAssignments.lecturerId))
    .where(eq(courseOfferings.semesterId, semester.id))
    .orderBy(timetableSlots.dayOfWeek, timetableSlots.startTime)

  return rows.map((row) => ({
    id: row.id,
    day: row.day,
    hour: parseHour(row.startTime),
    startTime: formatClock(row.startTime),
    endTime: formatClock(row.endTime),
    courseCode: formatCourseCode(row.courseCode),
    courseName: row.courseName,
    lecturer: row.lecturer,
    lecturerId: row.lecturerId,
    room: row.room,
    type: row.type,
    dept: deptPrefix(row.courseCode),
    color: courseColor(row.courseCode),
  }))
}

export async function askLecturerToFreeTimetableSlot(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  slotId: string,
  message: string,
): Promise<{ lecturerName: string }> {
  const db = await getInstitutionDb(institutionId)
  const [slot] = await db
    .select({
      id: timetableSlots.id,
      dayOfWeek: timetableSlots.dayOfWeek,
      startTime: timetableSlots.startTime,
      endTime: timetableSlots.endTime,
      room: rooms.name,
      courseCode: courses.code,
      lecturerId: lecturerAssignments.lecturerId,
      lecturerName: users.fullName,
    })
    .from(timetableSlots)
    .innerJoin(courseOfferings, eq(courseOfferings.id, timetableSlots.courseOfferingId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .leftJoin(rooms, eq(rooms.id, timetableSlots.roomId))
    .leftJoin(
      lecturerAssignments,
      and(
        eq(lecturerAssignments.courseOfferingId, courseOfferings.id),
        eq(lecturerAssignments.isLead, true),
      ),
    )
    .leftJoin(users, eq(users.id, lecturerAssignments.lecturerId))
    .where(eq(timetableSlots.id, slotId))
    .limit(1)

  if (!slot) throw notFound('That class')
  if (!slot.lecturerId) throw badRequest('This class has no lecturer to message.')

  const when = `${timetableWeekdayLabel(slot.dayOfWeek)} ${formatClock(slot.startTime)}–${formatClock(slot.endTime)}`
  const room = slot.room ?? 'This room'
  const course = formatCourseCode(slot.courseCode)
  const note = message.trim()

  await notifyUsers(db, [{
    userId: slot.lecturerId,
    title: `${room} is needed`,
    body: `Academic Admin asked you to free ${room} on ${when} (${course}). ${note}`,
    category: 'Timetable',
    actionUrl: '/lecturer/timetable',
  }])

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'timetable.room.request',
    targetType: 'timetable_slot',
    targetId: slotId,
    metadata: { lecturerId: slot.lecturerId, room, when },
  })

  return { lecturerName: slot.lecturerName ?? 'the lecturer' }
}

export async function listAcademicLecturers(institutionId: string): Promise<AcademicLecturerRow[]> {
  const db = await getInstitutionDb(institutionId)
  const semester = await currentSemester(institutionId)

  const lecturerRows = await db
    .select({
      id: users.id,
      name: users.fullName,
      email: users.email,
      phone: users.phone,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.role, 'Lecturer'))
    .orderBy(users.fullName)

  if (lecturerRows.length === 0) return []

  const assignmentRows = await db
    .select({
      lecturerId: lecturerAssignments.lecturerId,
      department: departments.name,
      courseCode: courses.code,
      courseName: courses.name,
      enrolled: courseOfferings.enrolledCount,
      semesterName: semesters.name,
    })
    .from(lecturerAssignments)
    .innerJoin(courseOfferings, eq(courseOfferings.id, lecturerAssignments.courseOfferingId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .innerJoin(departments, eq(departments.id, courses.departmentId))
    .leftJoin(semesters, eq(semesters.id, courseOfferings.semesterId))
    .where(semester ? eq(courseOfferings.semesterId, semester.id) : sql`true`)

  const extraByLecturer = new Map<
    string,
    { department: string; assignedCourses: AcademicLecturerRow['assignedCourses'] }
  >()
  for (const row of assignmentRows) {
    const existing = extraByLecturer.get(row.lecturerId) ?? {
      department: row.department,
      assignedCourses: [],
    }
    existing.assignedCourses.push({
      code: formatCourseCode(row.courseCode),
      name: row.courseName,
      enrolled: row.enrolled,
      semester: row.semesterName ?? 'Current',
    })
    extraByLecturer.set(row.lecturerId, existing)
  }

  return lecturerRows.map((row) => {
    const extra = extraByLecturer.get(row.id)
    return {
      id: row.id,
      name: row.name,
      initials: initials(row.name),
      department: extra?.department ?? '—',
      email: row.email,
      phone: row.phone,
      status: row.isActive ? ('Active' as const) : ('Inactive' as const),
      assignedCourses: extra?.assignedCourses ?? [],
    }
  })
}

async function buildResultBatch(
  institutionId: string,
  batchId: string,
): Promise<AcademicResultBatch> {
  const db = await getInstitutionDb(institutionId)
  const [batch] = await db
    .select({
      id: resultBatches.id,
      status: resultBatches.status,
      submittedAt: resultBatches.submittedAt,
      courseCode: courses.code,
      courseName: courses.name,
      lecturer: users.fullName,
    })
    .from(resultBatches)
    .innerJoin(courseOfferings, eq(courseOfferings.id, resultBatches.courseOfferingId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .leftJoin(
      lecturerAssignments,
      and(
        eq(lecturerAssignments.courseOfferingId, courseOfferings.id),
        eq(lecturerAssignments.isLead, true),
      ),
    )
    .leftJoin(users, eq(users.id, lecturerAssignments.lecturerId))
    .where(eq(resultBatches.id, batchId))
    .limit(1)

  if (!batch) throw notFound('That result batch')

  const resultRows = await db
    .select({
      studentId: students.studentNumber,
      name: users.fullName,
      marks: results.totalScore,
      grade: results.grade,
    })
    .from(results)
    .innerJoin(students, eq(students.id, results.studentId))
    .innerJoin(users, eq(users.id, students.userId))
    .where(eq(results.resultBatchId, batchId))

  const marks = resultRows
    .map((row) => (row.marks ? Number(row.marks) : null))
    .filter((value): value is number => value !== null)

  const passed = resultRows.filter((row) => row.grade && !['D', 'E', 'F'].includes(row.grade)).length
  const studentCount = resultRows.length

  return {
    id: batch.id,
    courseCode: formatCourseCode(batch.courseCode),
    courseName: batch.courseName,
    lecturer: batch.lecturer,
    assessment: 'Semester Final Results',
    submittedDate: formatDisplayDate(batch.submittedAt ?? new Date().toISOString()),
    studentCount,
    status: batchStatusLabel(batch.status),
    avg: marks.length ? Math.round(marks.reduce((sum, value) => sum + value, 0) / marks.length) : null,
    highest: marks.length ? Math.max(...marks) : null,
    lowest: marks.length ? Math.min(...marks) : null,
    passRate: studentCount ? Math.round((passed / studentCount) * 100) : null,
    results: resultRows.map((row) => ({
      studentId: row.studentId,
      name: row.name,
      marks: row.marks ? Number(row.marks) : null,
      grade: row.grade,
    })),
  }
}

export async function listAcademicResultBatches(
  institutionId: string,
  filters: { semesterId?: string; status?: AcademicResultBatch['status'] } = {},
): Promise<AcademicResultBatch[]> {
  const db = await getInstitutionDb(institutionId)
  const dbStatus = dbBatchStatus(filters.status)
  const conditions = [
    ...(filters.semesterId ? [eq(resultBatches.semesterId, filters.semesterId)] : []),
    ...(filters.status === 'Published'
      ? [inArray(resultBatches.status, [...RELEASED_RESULT_BATCH_STATUSES])]
      : dbStatus
        ? [eq(resultBatches.status, dbStatus as 'Draft' | 'PendingReview' | 'Approved' | 'Published' | 'Rejected')]
        : []),
  ]

  const rows = await db
    .select({ id: resultBatches.id })
    .from(resultBatches)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(resultBatches.submittedAt))

  return Promise.all(rows.map((row) => buildResultBatch(institutionId, row.id)))
}

export async function listAcademicSemesters(
  institutionId: string,
): Promise<AcademicSemesterOption[]> {
  const db = await getInstitutionDb(institutionId)
  await syncOrphanCalendarSemesters(db)
  const rows = await db
    .select({
      id: semesters.id,
      name: semesters.name,
      yearName: academicYears.name,
      isCurrent: semesters.isCurrent,
      maxCredits: semesters.maxCredits,
    })
    .from(academicCalendarEvents)
    .innerJoin(
      semesters,
      and(
        eq(academicCalendarEvents.semesterId, semesters.id),
        sql`lower(${academicCalendarEvents.category}) = 'semester'`,
      ),
    )
    .innerJoin(academicYears, eq(academicYears.id, semesters.academicYearId))
    .groupBy(
      semesters.id,
      semesters.name,
      academicYears.name,
      semesters.isCurrent,
      semesters.maxCredits,
      academicYears.startDate,
      semesters.sequence,
    )
    .orderBy(desc(academicYears.startDate), desc(semesters.sequence))

  return rows.map((row) => ({
    id: row.id,
    label: `${row.name} · ${row.yearName}`,
    isCurrent: row.isCurrent,
    maxCredits: row.maxCredits ?? DEFAULT_SEMESTER_MAX_CREDITS,
  }))
}

export async function listAcademicYears(
  institutionId: string,
): Promise<Array<{ id: string; name: string; isCurrent: boolean }>> {
  const db = await getInstitutionDb(institutionId)
  return db
    .select({
      id: academicYears.id,
      name: academicYears.name,
      isCurrent: academicYears.isCurrent,
    })
    .from(academicYears)
    .orderBy(desc(academicYears.startDate))
}

export async function listSemestersForAcademicYear(
  institutionId: string,
  academicYearId: string,
): Promise<Array<{ id: string; name: string; isCurrent: boolean }>> {
  const db = await getInstitutionDb(institutionId)
  return db
    .select({
      id: semesters.id,
      name: semesters.name,
      isCurrent: semesters.isCurrent,
    })
    .from(semesters)
    .where(eq(semesters.academicYearId, academicYearId))
    .orderBy(semesters.sequence)
}

export async function approveAcademicResultBatch(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  batchId: string,
): Promise<AcademicResultBatch> {
  const db = await getInstitutionDb(institutionId)
  const [existing] = await db
    .select({
      id: resultBatches.id,
      status: resultBatches.status,
      submittedBy: resultBatches.submittedBy,
    })
    .from(resultBatches)
    .where(eq(resultBatches.id, batchId))
    .limit(1)
  if (!existing) throw notFound('That result batch')
  if (existing.status !== 'PendingReview') {
    throw badRequest('Only batches awaiting review can be approved.')
  }

  const now = new Date().toISOString()
  await db
    .update(resultBatches)
    .set({
      status: 'Published',
      reviewedBy: actor.id,
      reviewedAt: now,
      rejectionReason: null,
    })
    .where(eq(resultBatches.id, batchId))

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'results.approve',
    targetType: 'resultBatch',
    targetId: batchId,
  })

  const batch = await buildResultBatch(institutionId, batchId)
  if (existing.submittedBy) {
    await notifyLecturerOfResultReview(
      db,
      existing.submittedBy,
      batch.courseCode,
      batch.courseName,
      'approved',
    )
  }
  return batch
}

export async function rejectAcademicResultBatch(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  batchId: string,
  input: RejectResultBatchRequest,
): Promise<AcademicResultBatch> {
  const db = await getInstitutionDb(institutionId)
  const [existing] = await db
    .select({
      id: resultBatches.id,
      status: resultBatches.status,
      submittedBy: resultBatches.submittedBy,
    })
    .from(resultBatches)
    .where(eq(resultBatches.id, batchId))
    .limit(1)
  if (!existing) throw notFound('That result batch')
  if (existing.status !== 'PendingReview') {
    throw badRequest('Only batches awaiting review can be rejected.')
  }

  const now = new Date().toISOString()
  await db
    .update(resultBatches)
    .set({
      status: 'Rejected',
      reviewedBy: actor.id,
      reviewedAt: now,
      rejectionReason: input.reason,
    })
    .where(eq(resultBatches.id, batchId))

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'results.reject',
    targetType: 'resultBatch',
    targetId: batchId,
    metadata: { reason: input.reason },
  })

  const batch = await buildResultBatch(institutionId, batchId)
  if (existing.submittedBy) {
    await notifyLecturerOfResultReview(
      db,
      existing.submittedBy,
      batch.courseCode,
      batch.courseName,
      'rejected',
      input.reason,
    )
  }
  return batch
}

export async function listAcademicAtRiskStudents(
  institutionId: string,
): Promise<AcademicAtRiskStudent[]> {
  const db = await getInstitutionDb(institutionId)
  const semester = await currentSemester(institutionId)
  if (!semester) return []

  const latestScores = await db
    .select({
      studentId: riskScores.studentId,
      riskLevel: riskScores.level,
      scoreId: riskScores.id,
      computedAt: riskScores.computedAt,
    })
    .from(riskScores)
    .where(eq(riskScores.semesterId, semester.id))
    .orderBy(desc(riskScores.computedAt))

  const seen = new Set<string>()
  const latestByStudent = latestScores.filter((row) => {
    if (seen.has(row.studentId)) return false
    seen.add(row.studentId)
    return true
  })

  const output: AcademicAtRiskStudent[] = []

  for (const risk of latestByStudent) {
    const [student] = await db
      .select({
        id: students.id,
        studentNumber: students.studentNumber,
        name: users.fullName,
        programme: programmes.name,
        year: students.yearOfStudy,
      })
      .from(students)
      .innerJoin(users, eq(users.id, students.userId))
      .innerJoin(programmes, eq(programmes.id, students.programmeId))
      .where(eq(students.id, risk.studentId))
      .limit(1)
    if (!student) continue

    const [enrolment] = await db
      .select({ gpa: enrolments.cgpa })
      .from(enrolments)
      .where(and(eq(enrolments.studentId, student.id), eq(enrolments.semesterId, semester.id)))
      .limit(1)

    const factorRows = await db
      .select({ explanation: riskFactors.explanation, factor: riskFactors.factor })
      .from(riskFactors)
      .where(eq(riskFactors.riskScoreId, risk.scoreId))

    const [intervention] = await db
      .select({
        performedAt: riskInterventions.performedAt,
        notes: riskInterventions.notes,
        performerName: users.fullName,
      })
      .from(riskInterventions)
      .leftJoin(users, eq(users.id, riskInterventions.performedBy))
      .where(eq(riskInterventions.riskScoreId, risk.scoreId))
      .orderBy(desc(riskInterventions.createdAt))
      .limit(1)

    const attendanceRows = await db
      .select({ status: attendanceRecords.status })
      .from(attendanceRecords)
      .where(eq(attendanceRecords.studentId, student.id))

    let attendance: number | null = null
    if (attendanceRows.length) {
      const present = attendanceRows.filter(
        (entry) => entry.status === 'Present' || entry.status === 'Late',
      ).length
      attendance = Math.round((present / attendanceRows.length) * 100)
    }

    output.push({
      id: student.id,
      studentNumber: student.studentNumber,
      name: student.name,
      initials: initials(student.name),
      programme: student.programme,
      year: student.year,
      riskLevel: risk.riskLevel,
      riskFactors: factorRows.map((factor) => ({
        label: factor.explanation,
        severity: factor.factor.includes('GPA') || factor.factor.includes('Attendance') ? 'error' : 'warning',
      })),
      gpa: enrolment?.gpa ? Number(enrolment.gpa) : null,
      attendance,
      advisor: intervention?.performerName ?? null,
      resolved: Boolean(intervention?.performedAt),
      resolvedDate: intervention?.performedAt ? formatDisplayDate(intervention.performedAt) : null,
      resolution: intervention?.notes ?? null,
    })
  }

  return output.sort((a, b) => {
    const order: Record<string, number> = { Critical: -1, High: 0, Medium: 1, Low: 2 }
    return (order[a.riskLevel] ?? 3) - (order[b.riskLevel] ?? 3)
  })
}

export async function listAcademicNotifications(
  institutionId: string,
  userId: string,
): Promise<AcademicNotification[]> {
  const db = await getInstitutionDb(institutionId)
  const rows = await db
    .select({
      id: notifications.id,
      category: notifications.category,
      title: notifications.title,
      body: notifications.body,
      createdAt: notifications.createdAt,
      readAt: notifications.readAt,
    })
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))

  return rows.map((row) => ({
    id: row.id,
    type: row.category,
    title: row.title,
    body: row.body,
    time: relativeTime(row.createdAt),
    read: Boolean(row.readAt),
    urgent: ['Results', 'At-Risk'].includes(row.category),
  }))
}

export async function markAcademicNotificationRead(
  institutionId: string,
  userId: string,
  id: string,
): Promise<AcademicNotification[]> {
  const db = await getInstitutionDb(institutionId)
  const [updated] = await db
    .update(notifications)
    .set({ readAt: new Date().toISOString() })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
    .returning({ id: notifications.id })
  if (!updated) throw notFound('That notification')
  return listAcademicNotifications(institutionId, userId)
}

export async function getAcademicReports(
  institutionId: string,
  type: AcademicReports['type'],
): Promise<AcademicReports> {
  const db = await getInstitutionDb(institutionId)

  if (type === 'enrollment') {
    const rows = await db
      .select({
        programme: programmes.name,
        yearOfStudy: students.yearOfStudy,
        count: sql<number>`count(*)::int`,
      })
      .from(students)
      .innerJoin(programmes, eq(programmes.id, students.programmeId))
      .where(eq(students.enrolmentStatus, 'Active'))
      .groupBy(programmes.name, students.yearOfStudy)

    const chartMap = new Map<string, { Year1: number; Year2: number; Year3: number; Year4: number }>()
    for (const row of rows) {
      const current = chartMap.get(row.programme) ?? { Year1: 0, Year2: 0, Year3: 0, Year4: 0 }
      if (row.yearOfStudy === 1) current.Year1 = row.count
      if (row.yearOfStudy === 2) current.Year2 = row.count
      if (row.yearOfStudy === 3) current.Year3 = row.count
      if (row.yearOfStudy === 4) current.Year4 = row.count
      chartMap.set(row.programme, current)
    }

    const total = rows.reduce((sum, row) => sum + row.count, 0)
    return {
      type,
      stats: [
        { label: 'Total enrolled', value: String(total), color: '#0D9488' },
        { label: 'Programmes', value: String(chartMap.size), color: '#2563EB' },
        { label: 'First-year students', value: String(rows.filter((row) => row.yearOfStudy === 1).reduce((sum, row) => sum + row.count, 0)), color: '#D97706' },
      ],
      enrollmentChart: [...chartMap.entries()].map(([name, values]) => ({ name, ...values })),
    }
  }

  if (type === 'results') {
    const gradeRows = await db
      .select({
        grade: results.grade,
        count: sql<number>`count(*)::int`,
      })
      .from(results)
      .innerJoin(resultBatches, eq(resultBatches.id, results.resultBatchId))
      .where(inArray(resultBatches.status, [...RELEASED_RESULT_BATCH_STATUSES]))
      .groupBy(results.grade)

    const total = gradeRows.reduce((sum, row) => sum + row.count, 0)
    const passCount = gradeRows
      .filter((row) => row.grade && !['D', 'E', 'F'].includes(row.grade))
      .reduce((sum, row) => sum + row.count, 0)

    return {
      type,
      stats: [
        { label: 'Published results', value: String(total), color: '#0D9488' },
        { label: 'Pass rate', value: total ? `${Math.round((passCount / total) * 100)}%` : '0%', color: '#2563EB' },
        { label: 'Grade bands', value: String(gradeRows.length), color: '#7C3AED' },
      ],
      resultsChart: gradeRows
        .filter((row) => row.grade)
        .map((row) => ({ grade: row.grade!, count: row.count })),
    }
  }

  if (type === 'attendance') {
    const rows = await db
      .select({
        week: sql<string>`to_char(${attendanceSessions.sessionDate}::date, 'IYYY-"W"IW')`,
        avg: sql<number>`round(100.0 * count(*) filter (where ${attendanceRecords.status} in ('Present', 'Late')) / nullif(count(*), 0))`,
      })
      .from(attendanceRecords)
      .innerJoin(attendanceSessions, eq(attendanceSessions.id, attendanceRecords.attendanceSessionId))
      .groupBy(sql`1`)
      .orderBy(sql`1`)
      .limit(8)

    const average =
      rows.length === 0
        ? 0
        : Math.round(rows.reduce((sum, row) => sum + (row.avg ?? 0), 0) / rows.length)

    return {
      type,
      stats: [
        { label: 'Average attendance', value: `${average}%`, color: '#0D9488' },
        { label: 'Weeks tracked', value: String(rows.length), color: '#2563EB' },
      ],
      attendanceChart: rows.map((row) => ({ week: row.week, avg: row.avg ?? 0 })),
    }
  }

  const programmeRows = await db
    .select({
      name: programmes.name,
      avgGpa: sql<number>`round(avg(${enrolments.cgpa})::numeric, 2)`,
    })
    .from(enrolments)
    .innerJoin(students, eq(students.id, enrolments.studentId))
    .innerJoin(programmes, eq(programmes.id, students.programmeId))
    .where(eq(students.enrolmentStatus, 'Active'))
    .groupBy(programmes.name)

  return {
    type,
    stats: [
      { label: 'Programmes tracked', value: String(programmeRows.length), color: '#0D9488' },
      {
        label: 'Highest average GPA',
        value: programmeRows.length
          ? String(Math.max(...programmeRows.map((row) => Number(row.avgGpa ?? 0))))
          : '0',
        color: '#2563EB',
      },
    ],
    programmeChart: programmeRows.map((row) => ({
      name: row.name,
      avgGPA: Number(row.avgGpa ?? 0),
    })),
  }
}

function normalizeCourseCode(code: string): string {
  return code.replace(/\s+/g, '').toUpperCase()
}

function programmeCodeFromName(name: string): string {
  const slug =
    name
      .split(/\s+/)
      .map((part) => part.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase())
      .join('')
      .slice(0, 8) || 'PRG'
  return `${slug}-${randomBytes(2).toString('hex').toUpperCase()}`
}

function normalizeDepartmentLabel(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\bdepartment of\b/g, ' ')
    .replace(/\b(dept\.?|department)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function departmentMatchScore(term: string, name: string, code: string): number {
  const needle = normalizeDepartmentLabel(term)
  const haystack = normalizeDepartmentLabel(name)
  const codeNorm = code.trim().toLowerCase()
  if (!needle) return 0
  if (haystack === needle || codeNorm === needle) return 4
  if (haystack.includes(needle) || needle.includes(haystack)) return 3
  const needleWord = needle.split(' ')[0] ?? ''
  const haystackWord = haystack.split(' ')[0] ?? ''
  if (needleWord.length >= 4 && (haystackWord.startsWith(needleWord) || needleWord.startsWith(haystackWord))) {
    return 2
  }
  return 0
}

function titleCaseWords(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function canonicalDepartmentName(term: string): string {
  const stripped = term
    .trim()
    .replace(/^(the\s+)?(department|dept)\s+(of\s+)?/i, '')
    .trim()
  return `Department of ${titleCaseWords(stripped || term)}`
}

function canonicalFacultyName(departmentName: string): string {
  const core = departmentName.replace(/^(department|dept)\s+(of\s+)?/i, '').trim()
  return `Faculty of ${titleCaseWords(core)}`
}

function codeStub(name: string, fallback: string): string {
  const core = name.replace(/^(department|faculty)\s+of\s+/i, '')
  return core.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || fallback
}

async function uniqueCode(
  exists: (code: string) => Promise<boolean>,
  base: string,
): Promise<string> {
  const stub = base.slice(0, 8).toUpperCase() || 'CODE'
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = attempt === 0 ? stub : `${stub.slice(0, 4)}${randomBytes(1).toString('hex').toUpperCase()}`
    if (!(await exists(code))) return code
  }
  return `${stub.slice(0, 3)}${randomBytes(2).toString('hex').toUpperCase()}`
}

export async function resolveDepartmentId(
  db: Awaited<ReturnType<typeof getInstitutionDb>>,
  departmentName: string,
): Promise<string> {
  const term = departmentName.trim()
  if (term.length < 2) throw badRequest('Department is required.')

  const all = await db
    .select({ id: departments.id, name: departments.name, code: departments.code })
    .from(departments)

  let best: { id: string; score: number } | null = null
  for (const dept of all) {
    const score = departmentMatchScore(term, dept.name, dept.code)
    if (!best || score > best.score) best = { id: dept.id, score }
  }
  if (best && best.score >= 3) return best.id

  const name = canonicalDepartmentName(term)
  const facultyName = canonicalFacultyName(name)

  const facultyRows = await db
    .select({ id: faculties.id, name: faculties.name, code: faculties.code })
    .from(faculties)

  let facultyId: string | undefined
  let facultyBest: { id: string; score: number } | null = null
  for (const faculty of facultyRows) {
    const score = departmentMatchScore(facultyName, faculty.name, faculty.code)
    if (!facultyBest || score > facultyBest.score) facultyBest = { id: faculty.id, score }
  }
  if (facultyBest && facultyBest.score >= 3) {
    facultyId = facultyBest.id
  } else {
    const [createdFaculty] = await db
      .insert(faculties)
      .values({
        code: await uniqueCode(async (code) => {
          const [hit] = await db.select({ id: faculties.id }).from(faculties).where(eq(faculties.code, code)).limit(1)
          return Boolean(hit)
        }, codeStub(facultyName, 'FAC')),
        name: facultyName,
      })
      .returning({ id: faculties.id })
    facultyId = createdFaculty!.id
  }

  const [created] = await db
    .insert(departments)
    .values({
      facultyId,
      code: await uniqueCode(async (code) => {
        const [hit] = await db.select({ id: departments.id }).from(departments).where(eq(departments.code, code)).limit(1)
        return Boolean(hit)
      }, codeStub(name, 'DEPT')),
      name,
    })
    .returning({ id: departments.id })

  return created!.id
}

async function assertSemesterExists(
  db: Awaited<ReturnType<typeof getInstitutionDb>>,
  semesterId: string,
): Promise<void> {
  const [row] = await db
    .select({ id: semesters.id })
    .from(semesters)
    .where(eq(semesters.id, semesterId))
    .limit(1)
  if (!row) throw badRequest('Choose a valid semester.')
}

async function ensureOffering(
  db: Awaited<ReturnType<typeof getInstitutionDb>>,
  courseId: string,
  semesterId: string,
): Promise<string> {
  const [existing] = await db
    .select({ id: courseOfferings.id })
    .from(courseOfferings)
    .where(and(eq(courseOfferings.courseId, courseId), eq(courseOfferings.semesterId, semesterId)))
    .limit(1)
  if (existing) return existing.id

  const [created] = await db
    .insert(courseOfferings)
    .values({ courseId, semesterId, section: 'A' })
    .returning({ id: courseOfferings.id })
  return created!.id
}

async function offeringRegistrationState(
  db: Awaited<ReturnType<typeof getInstitutionDb>>,
  courseId: string,
  semesterId: string,
): Promise<boolean | null> {
  const [row] = await db
    .select({ isOpen: courseOfferings.isOpenForRegistration })
    .from(courseOfferings)
    .where(and(eq(courseOfferings.courseId, courseId), eq(courseOfferings.semesterId, semesterId)))
    .limit(1)
  return row?.isOpen ?? null
}

async function setOfferingRegistration(
  db: Awaited<ReturnType<typeof getInstitutionDb>>,
  courseId: string,
  semesterId: string,
  open: boolean,
): Promise<void> {
  await assertSemesterExists(db, semesterId)
  const offeringId = await ensureOffering(db, courseId, semesterId)
  await db
    .update(courseOfferings)
    .set({ isOpenForRegistration: open })
    .where(eq(courseOfferings.id, offeringId))
}

async function assignLeadLecturer(
  db: Awaited<ReturnType<typeof getInstitutionDb>>,
  courseId: string,
  lecturerId: string | null,
  assignedBy: string,
  semesterId?: string,
): Promise<void> {
  if (lecturerId && !semesterId) {
    throw badRequest(LECTURER_ASSIGNMENT_REQUIRES_SEMESTER)
  }
  if (!semesterId) return

  await assertSemesterExists(db, semesterId)
  const offeringId = await ensureOffering(db, courseId, semesterId)

  await db
    .delete(lecturerAssignments)
    .where(and(eq(lecturerAssignments.courseOfferingId, offeringId), eq(lecturerAssignments.isLead, true)))

  if (!lecturerId) return

  const [lecturer] = await db
    .select({ id: users.id, role: users.role, isActive: users.isActive })
    .from(users)
    .where(eq(users.id, lecturerId))
    .limit(1)
  if (!lecturer || lecturer.role !== 'Lecturer' || !lecturer.isActive) {
    throw badRequest('Choose an active lecturer.')
  }

  await db.insert(lecturerAssignments).values({
    courseOfferingId: offeringId,
    lecturerId,
    isLead: true,
    assignedBy,
  })
}

function mapCalendarEvent(row: {
  id: string
  title: string
  category: string
  startDate: string
  endDate: string | null
  description: string | null
}): AcademicCalendarEvent {
  return {
    id: row.id,
    title: row.title,
    type: row.category,
    startDate: row.startDate,
    endDate: row.endDate,
    description: row.description,
    affectsAll: true,
  }
}

export async function createAcademicProgramme(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  input: CreateAcademicProgrammeRequest,
): Promise<AcademicProgrammeRow> {
  const db = await getInstitutionDb(institutionId)
  const departmentId = await resolveDepartmentId(db, input.departmentName)
  const code = programmeCodeFromName(input.name)

  const [created] = await db
    .insert(programmes)
    .values({
      departmentId,
      code,
      name: input.name.trim(),
      level: input.level ?? 'Bachelor',
      durationYears: input.durationYears,
      totalCreditsRequired: input.totalCredits,
      isActive: true,
    })
    .returning({ id: programmes.id })

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'programme.create',
    targetType: 'programme',
    targetId: created!.id,
    metadata: { name: input.name, code },
  })

  const rows = await listAcademicProgrammes(institutionId)
  return rows.find((row) => row.id === created!.id)!
}

export async function updateAcademicProgramme(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  programmeId: string,
  input: UpdateAcademicProgrammeRequest,
): Promise<AcademicProgrammeRow> {
  const db = await getInstitutionDb(institutionId)
  const [existing] = await db
    .select({ id: programmes.id, name: programmes.name })
    .from(programmes)
    .where(eq(programmes.id, programmeId))
    .limit(1)
  if (!existing) throw notFound('That programme')

  const departmentId = input.departmentName
    ? await resolveDepartmentId(db, input.departmentName)
    : undefined

  await db
    .update(programmes)
    .set({
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(departmentId ? { departmentId } : {}),
      ...(input.durationYears !== undefined ? { durationYears: input.durationYears } : {}),
      ...(input.totalCredits !== undefined ? { totalCreditsRequired: input.totalCredits } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    })
    .where(eq(programmes.id, programmeId))

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'programme.update',
    targetType: 'programme',
    targetId: programmeId,
    metadata: { name: input.name ?? existing.name },
  })

  const rows = await listAcademicProgrammes(institutionId)
  return rows.find((row) => row.id === programmeId)!
}

export async function createAcademicCourse(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  input: CreateAcademicCourseRequest,
  options?: { notify?: boolean },
): Promise<AcademicCourseRow> {
  const db = await getInstitutionDb(institutionId)
  const departmentId = await resolveDepartmentId(db, input.departmentName)
  const code = normalizeCourseCode(input.code)

  if (input.openForRegistration === false && !input.semesterId) {
    throw badRequest('Choose a semester to close a course for registration.')
  }

  const [duplicate] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.code, code))
    .limit(1)
  if (duplicate) throw conflict(`A course with code ${code} already exists.`)

  const created = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(courses)
      .values({
        departmentId,
        code,
        name: input.name.trim(),
        description: input.description ?? null,
        credits: input.credits,
        yearOfStudy: input.yearOfStudy ?? 1,
        isActive: true,
      })
      .returning({ id: courses.id })

    if (input.prerequisiteCodes?.length) {
      const prereqCodes = input.prerequisiteCodes.map(normalizeCourseCode)
      const prereqRows = await tx
        .select({ id: courses.id })
        .from(courses)
        .where(inArray(courses.code, prereqCodes))
      for (const prereq of prereqRows) {
        await tx.insert(coursePrerequisites).values({
          courseId: row!.id,
          prerequisiteCourseId: prereq.id,
          isMandatory: true,
        }).onConflictDoNothing()
      }
    }

    if (input.lecturerId) {
      await assignLeadLecturer(tx, row!.id, input.lecturerId, actor.id, input.semesterId)
    }
    if (input.semesterId && input.openForRegistration !== undefined) {
      await setOfferingRegistration(tx, row!.id, input.semesterId, input.openForRegistration)
    }

    return row!
  })

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'course.create',
    targetType: 'course',
    targetId: created.id,
    metadata: { code, name: input.name, openForRegistration: input.openForRegistration },
  })

  if (options?.notify !== false) {
    await notifyCourseCatalogueChange(db, {
      code,
      name: input.name.trim(),
      kind: input.openForRegistration === false ? 'closed' : 'created',
    })
  }

  const rows = await listAcademicCourses(institutionId)
  return rows.find((row) => row.id === created.id)!
}

export async function updateAcademicCourse(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  courseId: string,
  input: UpdateAcademicCourseRequest,
): Promise<AcademicCourseRow> {
  const db = await getInstitutionDb(institutionId)
  const [existing] = await db
    .select({ id: courses.id, code: courses.code, name: courses.name })
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1)
  if (!existing) throw notFound('That course')

  if (input.openForRegistration === false && !input.semesterId) {
    throw badRequest('Choose a semester to close a course for registration.')
  }

  const previousOpen = input.semesterId
    ? await offeringRegistrationState(db, courseId, input.semesterId)
    : null

  let nextCode = existing.code
  if (input.code !== undefined) {
    nextCode = normalizeCourseCode(input.code)
    if (nextCode !== existing.code) {
      const [duplicate] = await db
        .select({ id: courses.id })
        .from(courses)
        .where(and(eq(courses.code, nextCode), ne(courses.id, courseId)))
        .limit(1)
      if (duplicate) throw badRequest('Another course already uses that code.')
    }
  }

  const departmentId = input.departmentName
    ? await resolveDepartmentId(db, input.departmentName)
    : undefined

  const coursePatch = {
    ...(input.code !== undefined ? { code: nextCode } : {}),
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
    ...(departmentId ? { departmentId } : {}),
    ...(input.credits !== undefined ? { credits: input.credits } : {}),
    ...(input.yearOfStudy !== undefined ? { yearOfStudy: input.yearOfStudy } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
  }
  if (Object.keys(coursePatch).length > 0) {
    await db.update(courses).set(coursePatch).where(eq(courses.id, courseId))
  }

  if (input.prerequisiteCodes) {
    await db.delete(coursePrerequisites).where(eq(coursePrerequisites.courseId, courseId))
    const prereqCodes = input.prerequisiteCodes.map(normalizeCourseCode)
    if (prereqCodes.length) {
      const prereqRows = await db
        .select({ id: courses.id })
        .from(courses)
        .where(inArray(courses.code, prereqCodes))
      for (const prereq of prereqRows) {
        await db.insert(coursePrerequisites).values({
          courseId,
          prerequisiteCourseId: prereq.id,
          isMandatory: true,
        }).onConflictDoNothing()
      }
    }
  }

  if (input.lecturerId !== undefined) {
    await assignLeadLecturer(db, courseId, input.lecturerId, actor.id, input.semesterId)
  }
  if (input.semesterId && input.openForRegistration !== undefined) {
    await setOfferingRegistration(db, courseId, input.semesterId, input.openForRegistration)
  }

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'course.update',
    targetType: 'course',
    targetId: courseId,
    ...(nextCode !== existing.code
      ? { changes: { code: { from: existing.code, to: nextCode } } }
      : {}),
    metadata: {
      code: nextCode,
      name: input.name ?? existing.name,
      openForRegistration: input.openForRegistration,
    },
  })

  const nextName = input.name?.trim() ?? existing.name
  const registrationChanged =
    input.openForRegistration !== undefined && previousOpen !== input.openForRegistration
  await notifyCourseCatalogueChange(db, {
    code: nextCode,
    name: nextName,
    kind: registrationChanged
      ? input.openForRegistration
        ? 'opened'
        : 'closed'
      : 'updated',
  })

  const rows = await listAcademicCourses(institutionId)
  return rows.find((row) => row.id === courseId)!
}

export async function deleteAcademicCourse(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  courseId: string,
): Promise<void> {
  const db = await getInstitutionDb(institutionId)
  const [existing] = await db
    .select({ id: courses.id, code: courses.code, name: courses.name })
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1)
  if (!existing) throw notFound('That course')

  const [enrolled] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(courseRegistrations)
    .innerJoin(courseOfferings, eq(courseOfferings.id, courseRegistrations.courseOfferingId))
    .where(eq(courseOfferings.courseId, courseId))

  if ((enrolled?.count ?? 0) > 0) {
    throw badRequest(COURSE_DELETE_HAS_ENROLLMENTS)
  }

  await db.delete(courseOfferings).where(eq(courseOfferings.courseId, courseId))
  await db.delete(courses).where(eq(courses.id, courseId))

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'course.delete',
    targetType: 'course',
    targetId: courseId,
    metadata: { code: existing.code, name: existing.name },
  })
}

/** e.g. 2026-09-07 -> 2026/2027 when the intake starts in the second half of the year. */
function academicYearNameFromDate(startDate: string): string {
  const year = Number(startDate.slice(0, 4))
  const month = Number(startDate.slice(5, 7))
  if (month >= 7) return `${year}/${year + 1}`
  return `${year - 1}/${year}`
}

async function upsertSemesterFromCalendarEvent(
  db: Awaited<ReturnType<typeof getInstitutionDb>>,
  input: { title: string; startDate: string; endDate: string; category: string; maxCredits?: number },
): Promise<string | null> {
  if (!isSemesterCalendarCategory(input.category)) return null

  const startDate = input.startDate
  const endDate = input.endDate ?? input.startDate
  const title = input.title.trim()
  const yearName = academicYearNameFromDate(startDate)
  const [yearStartYear, yearEndYear] = yearName.split('/').map(Number)

  let [year] = await db
    .select({ id: academicYears.id })
    .from(academicYears)
    .where(eq(academicYears.name, yearName))
    .limit(1)

  if (!year) {
    [year] = await db
      .insert(academicYears)
      .values({
        name: yearName,
        startDate: `${yearStartYear}-07-01`,
        endDate: `${yearEndYear}-06-30`,
        isCurrent: true,
      })
      .returning({ id: academicYears.id })
  }

  let [semester] = await db
    .select({ id: semesters.id })
    .from(semesters)
    .where(and(eq(semesters.academicYearId, year!.id), eq(semesters.name, title)))
    .limit(1)

  const today = new Date().toISOString().slice(0, 10)
  const isActiveNow = startDate <= today && endDate >= today

  if (!semester) {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(semesters)
      .where(eq(semesters.academicYearId, year!.id))

    const [{ totalSemesters }] = await db
      .select({ totalSemesters: sql<number>`count(*)::int` })
      .from(semesters)

    const makeCurrent = isActiveNow || (totalSemesters ?? 0) === 0

    if (makeCurrent) {
      await db.update(semesters).set({ isCurrent: false }).where(eq(semesters.isCurrent, true))
    }

    ;[semester] = await db
      .insert(semesters)
      .values({
        academicYearId: year!.id,
        name: title,
        sequence: (count ?? 0) + 1,
        startDate,
        endDate,
        maxCredits: input.maxCredits ?? DEFAULT_SEMESTER_MAX_CREDITS,
        status: isActiveNow ? 'Open' : 'Planned',
        isCurrent: makeCurrent,
      })
      .returning({ id: semesters.id })
  } else {
    if (isActiveNow) {
      await db.update(semesters).set({ isCurrent: false }).where(eq(semesters.isCurrent, true))
    }
    await db
      .update(semesters)
      .set({
        startDate,
        endDate,
        ...(input.maxCredits !== undefined ? { maxCredits: input.maxCredits } : {}),
        ...(isActiveNow ? { isCurrent: true, status: 'Open' as const } : {}),
      })
      .where(eq(semesters.id, semester.id))
  }

  return semester!.id
}

async function removeSemesterIfUnused(
  db: Awaited<ReturnType<typeof getInstitutionDb>>,
  semesterId: string | null | undefined,
): Promise<void> {
  if (!semesterId) return

  const [offering] = await db
    .select({ id: courseOfferings.id })
    .from(courseOfferings)
    .where(eq(courseOfferings.semesterId, semesterId))
    .limit(1)
  if (offering) return

  const [eventRef] = await db
    .select({ id: academicCalendarEvents.id })
    .from(academicCalendarEvents)
    .where(eq(academicCalendarEvents.semesterId, semesterId))
    .limit(1)
  if (eventRef) return

  await db.delete(semesters).where(eq(semesters.id, semesterId))
}

/** Back-fill semester records for calendar events created before sync existed. */
async function syncOrphanCalendarSemesters(db: Awaited<ReturnType<typeof getInstitutionDb>>): Promise<void> {
  const orphans = await db
    .select({
      id: academicCalendarEvents.id,
      title: academicCalendarEvents.title,
      category: academicCalendarEvents.category,
      startDate: academicCalendarEvents.startDate,
      endDate: academicCalendarEvents.endDate,
    })
    .from(academicCalendarEvents)
    .where(and(isNull(academicCalendarEvents.semesterId), sql`lower(${academicCalendarEvents.category}) = 'semester'`))

  for (const event of orphans) {
    const semesterId = await upsertSemesterFromCalendarEvent(db, {
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate ?? event.startDate,
      category: event.category,
    })
    if (semesterId) {
      await db
        .update(academicCalendarEvents)
        .set({ semesterId })
        .where(eq(academicCalendarEvents.id, event.id))
    }
  }
}

export async function createAcademicCalendarEvent(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  input: CreateAcademicCalendarEventRequest,
): Promise<AcademicCalendarEvent> {
  const db = await getInstitutionDb(institutionId)
  const semesterIdFromEvent = await upsertSemesterFromCalendarEvent(db, {
    title: input.title,
    startDate: input.startDate,
    endDate: input.endDate ?? input.startDate,
    category: input.category,
    maxCredits: input.maxCredits,
  })
  const current = await currentSemester(institutionId)
  const [created] = await db
    .insert(academicCalendarEvents)
    .values({
      semesterId: semesterIdFromEvent ?? current?.id ?? null,
      title: input.title.trim(),
      description: input.description ?? null,
      category: input.category.trim(),
      startDate: input.startDate,
      endDate: input.endDate ?? input.startDate,
      isPublished: true,
      createdBy: actor.id,
    })
    .returning({
      id: academicCalendarEvents.id,
      title: academicCalendarEvents.title,
      category: academicCalendarEvents.category,
      startDate: academicCalendarEvents.startDate,
      endDate: academicCalendarEvents.endDate,
      description: academicCalendarEvents.description,
    })

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'calendar.create',
    targetType: 'calendar_event',
    targetId: created!.id,
    metadata: { title: input.title },
  })

  await notifyAcademicCalendarChange(db, {
    title: created!.title,
    kind: 'created',
    startDate: created!.startDate,
    endDate: created!.endDate,
  })

  return mapCalendarEvent(created!)
}

export async function updateAcademicCalendarEvent(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  eventId: string,
  input: UpdateAcademicCalendarEventRequest,
): Promise<AcademicCalendarEvent> {
  const db = await getInstitutionDb(institutionId)
  const [existing] = await db
    .select({
      id: academicCalendarEvents.id,
      title: academicCalendarEvents.title,
      category: academicCalendarEvents.category,
      startDate: academicCalendarEvents.startDate,
      endDate: academicCalendarEvents.endDate,
      semesterId: academicCalendarEvents.semesterId,
    })
    .from(academicCalendarEvents)
    .where(eq(academicCalendarEvents.id, eventId))
    .limit(1)
  if (!existing) throw notFound('That calendar event')

  const nextTitle = input.title !== undefined ? input.title.trim() : existing.title
  const nextCategory = input.category !== undefined ? input.category.trim() : existing.category
  const nextStart = input.startDate ?? existing.startDate
  const nextEnd = input.endDate ?? existing.endDate ?? nextStart

  const semesterIdFromEvent = await upsertSemesterFromCalendarEvent(db, {
    title: nextTitle,
    startDate: nextStart,
    endDate: nextEnd,
    category: nextCategory,
    maxCredits: input.maxCredits,
  })

  const current = await currentSemester(institutionId)
  const nextSemesterId = isSemesterCalendarCategory(nextCategory)
    ? semesterIdFromEvent
    : current?.id ?? null

  const oldSemesterRecordId = isSemesterCalendarCategory(existing.category) ? existing.semesterId : null

  const [updated] = await db
    .update(academicCalendarEvents)
    .set({
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.category !== undefined ? { category: input.category.trim() } : {}),
      ...(input.startDate !== undefined ? { startDate: input.startDate } : {}),
      ...(input.endDate !== undefined ? { endDate: input.endDate } : {}),
      ...(input.description !== undefined ? { description: input.description ?? null } : {}),
      semesterId: nextSemesterId,
    })
    .where(eq(academicCalendarEvents.id, eventId))
    .returning({
      id: academicCalendarEvents.id,
      title: academicCalendarEvents.title,
      category: academicCalendarEvents.category,
      startDate: academicCalendarEvents.startDate,
      endDate: academicCalendarEvents.endDate,
      description: academicCalendarEvents.description,
    })

  if (oldSemesterRecordId && oldSemesterRecordId !== nextSemesterId) {
    await removeSemesterIfUnused(db, oldSemesterRecordId)
  }

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'calendar.update',
    targetType: 'calendar_event',
    targetId: eventId,
    metadata: { title: input.title ?? existing.title },
  })

  await notifyAcademicCalendarChange(db, {
    title: updated!.title,
    kind: 'updated',
    startDate: updated!.startDate,
    endDate: updated!.endDate,
  })

  return mapCalendarEvent(updated!)
}

export async function deleteAcademicCalendarEvent(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  eventId: string,
): Promise<void> {
  const db = await getInstitutionDb(institutionId)
  const [existing] = await db
    .select({
      id: academicCalendarEvents.id,
      title: academicCalendarEvents.title,
      category: academicCalendarEvents.category,
      semesterId: academicCalendarEvents.semesterId,
    })
    .from(academicCalendarEvents)
    .where(eq(academicCalendarEvents.id, eventId))
    .limit(1)
  if (!existing) throw notFound('That calendar event')

  const semesterRecordId = isSemesterCalendarCategory(existing.category) ? existing.semesterId : null

  await db.delete(academicCalendarEvents).where(eq(academicCalendarEvents.id, eventId))

  await removeSemesterIfUnused(db, semesterRecordId)

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'calendar.delete',
    targetType: 'calendar_event',
    targetId: eventId,
    metadata: { title: existing.title },
  })
}

export async function changeAcademicStudentStatus(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  idOrNumber: string,
  input: ChangeAcademicStudentStatusRequest,
): Promise<AcademicStudentDetail> {
  const db = await getInstitutionDb(institutionId)
  const isUuid = /^[0-9a-f-]{36}$/i.test(idOrNumber)
  const [row] = await db
    .select({
      id: students.id,
      studentNumber: students.studentNumber,
      programmeId: students.programmeId,
      enrolmentStatus: students.enrolmentStatus,
    })
    .from(students)
    .where(isUuid ? eq(students.id, idOrNumber) : eq(students.studentNumber, idOrNumber))
    .limit(1)

  if (!row) throw notFound('That student')

  const fromStatus = row.enrolmentStatus
  const today = new Date().toISOString().slice(0, 10)

  if (input.action === 'transfer') {
    if (!input.targetProgrammeId) throw badRequest('Choose a programme to transfer to.')
    if (input.targetProgrammeId === row.programmeId) {
      throw badRequest('The student is already on that programme.')
    }

    const [programme] = await db
      .select({ id: programmes.id, name: programmes.name })
      .from(programmes)
      .where(eq(programmes.id, input.targetProgrammeId))
      .limit(1)
    if (!programme) throw notFound('That programme')

    const [fromProgramme] = await db
      .select({ name: programmes.name })
      .from(programmes)
      .where(eq(programmes.id, row.programmeId))
      .limit(1)

    await db
      .update(students)
      .set({
        programmeId: input.targetProgrammeId,
        ...(input.yearOfStudy !== undefined ? { yearOfStudy: input.yearOfStudy } : {}),
      })
      .where(eq(students.id, row.id))

    await db.insert(enrolmentHistory).values({
      studentId: row.id,
      fromStatus,
      toStatus: 'Active',
      reason: `${input.reason.trim()} (Programme: ${fromProgramme?.name ?? '—'} → ${programme.name})`,
      effectiveDate: today,
      changedBy: actor.id,
    })

    await writeAudit({
      institutionId,
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'student.transfer',
      targetType: 'student',
      targetId: row.id,
      changes: {
        programmeId: { from: row.programmeId, to: input.targetProgrammeId },
        ...(input.yearOfStudy !== undefined
          ? { yearOfStudy: { from: null, to: input.yearOfStudy } }
          : {}),
      },
      metadata: { studentNumber: row.studentNumber, reason: input.reason.trim() },
    })
  } else {
    const toStatus = {
      suspend: 'Suspended',
      graduate: 'Graduated',
      withdraw: 'Withdrawn',
    }[input.action] as 'Suspended' | 'Graduated' | 'Withdrawn'

    if (fromStatus === toStatus) throw badRequest('The student is already in that status.')
    if (fromStatus === 'Graduated' || fromStatus === 'Withdrawn') {
      throw badRequest('This enrolment record can no longer be changed.')
    }

    await db
      .update(students)
      .set({
        enrolmentStatus: toStatus,
        ...(input.action === 'graduate' ? { graduatedAt: today } : {}),
      })
      .where(eq(students.id, row.id))

    await db.insert(enrolmentHistory).values({
      studentId: row.id,
      fromStatus,
      toStatus,
      reason: input.reason.trim(),
      effectiveDate: today,
      changedBy: actor.id,
    })

    await writeAudit({
      institutionId,
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: `student.${input.action}`,
      targetType: 'student',
      targetId: row.id,
      changes: { enrolmentStatus: { from: fromStatus, to: toStatus } },
      metadata: { studentNumber: row.studentNumber, reason: input.reason.trim() },
    })
  }

  return getAcademicStudent(institutionId, row.studentNumber)
}

export async function bulkCreateAcademicCourses(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  input: BulkCreateAcademicCoursesRequest,
): Promise<{ created: number; failed: Array<{ code: string; error: string }> }> {
  let created = 0
  const failed: Array<{ code: string; error: string }> = []

  for (const course of input.courses) {
    try {
      await createAcademicCourse(institutionId, actor, course, { notify: false })
      created += 1
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Could not create course.'
      failed.push({ code: course.code, error: message })
    }
  }

  if (created > 0) {
    await writeAudit({
      institutionId,
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'course.bulk_import',
      targetType: 'course',
      metadata: { created, failed: failed.length },
    })
  }

  return { created, failed }
}
