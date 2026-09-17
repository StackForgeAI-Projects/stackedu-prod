import { and, asc, count, desc, eq, inArray, isNull, ne, sql } from 'drizzle-orm'
import type {
  AttendancePolicy,
  CreateLecturerAnnouncementRequest,
  CreateLecturerAssessmentRequest,
  CreateLecturerMaterialRequest,
  CreateLecturerModuleRequest,
  LecturerCourseAnnouncement,
  LecturerCourseModule,
  UpdateLecturerAnnouncementRequest,
  UpdateLecturerModuleRequest,
  Grade,
  LecturerAssessmentDetail,
  LecturerAssessmentRow,
  LecturerAttendanceDetail,
  LecturerAttendanceSession,
  LecturerAtRiskStudent,
  LecturerCourseDetail,
  LecturerCourseMaterial,
  LecturerCourseRow,
  LecturerDashboard,
  LecturerNotification,
  LecturerProfile,
  LecturerResultBatch,
  LecturerRoomOption,
  LecturerTimetableSlot,
  ResolveLecturerAtRiskRequest,
  ReserveLecturerMaterialUploadRequest,
  SaveLecturerAttendanceRequest,
  SaveLecturerGradeRequest,
  SaveLecturerResultsRequest,
  SaveLecturerTimetableSlotRequest,
  UpdateLecturerMaterialRequest,
  UpdateLecturerTimetableSlotRequest,
  UserRole,
} from '@stackedu/shared'
import {
  ATTENDANCE_POLICY_SETTING_KEY,
  attendancePolicySchema,
  attendanceSessionStatus,
  COURSE_MATERIAL_MAX_BYTES,
  COURSE_MATERIAL_MIME_TYPES,
  DEFAULT_ATTENDANCE_POLICY,
  isAttendanceSessionEditable,
} from '@stackedu/shared'
import { getInstitutionDb, getPlatformDb } from '../db/connection'
import { readInstitutionSetting, upsertInstitutionSetting } from '../lib/institution-settings'
import { institutions } from '../db/platform/schema'
import {
  academicYears,
  courses,
  departments,
  semesters,
} from '../db/institution/schema/academic'
import { assessmentComponents, assessmentItems, assessments, grades, resultBatches, results, submissions } from '../db/institution/schema/assessment'
import { notifications } from '../db/institution/schema/communication'
import { listOfferingDiscussionSummaries } from './discussions'
import { riskInterventions, riskScores } from '../db/institution/schema/ai'
import { users } from '../db/institution/schema/people'
import { students } from '../db/institution/schema/students'
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
} from '../db/institution/schema/teaching'
import {
  notifyAcademicAdminsOfResultSubmit,
  notifyEnrolledStudentsOfAnnouncement,
  notifyEnrolledStudentsOfAssessment,
  notifyEnrolledStudentsOfMaterial,
} from './role-notifications'
import { writeAudit } from '../lib/audit'
import { assertTimetableSlotFree } from '../lib/timetable-conflicts'
import { courseColor, formatClock } from '../lib/course-color'
import { badRequest, conflict, forbidden, notFound } from '../lib/errors'
import {
  buildCourseMaterialFileKey,
  createDownloadUrl,
  createUploadTarget,
  deleteStoredObject,
  fileNameFromStorageKey,
  type UploadTarget,
} from '../lib/storage'
import {
  currentSemester,
  firstName,
  formatCourseCode,
  formatDisplayDate,
  initials,
  listAcademicAtRiskStudents,
  listAcademicNotifications,
  relativeTime,
  unreadCount,
} from './academic'

const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
const DAY_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const

type InstitutionDb = Awaited<ReturnType<typeof getInstitutionDb>>

function isoDayOfWeek(date = new Date()): number {
  const day = date.getDay()
  return day === 0 ? 7 : day
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

function asNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function staffIdFrom(userId: string): string {
  return `LEC-${userId.replace(/-/g, '').slice(0, 8).toUpperCase()}`
}

export function gradeFromScore(score: number): { grade: Grade; gradePoint: string; isPassed: boolean } {
  if (score >= 80) return { grade: 'A', gradePoint: '4.00', isPassed: true }
  if (score >= 70) return { grade: 'B', gradePoint: '3.00', isPassed: true }
  if (score >= 60) return { grade: 'C', gradePoint: '2.00', isPassed: true }
  if (score >= 50) return { grade: 'D', gradePoint: '1.00', isPassed: false }
  if (score >= 40) return { grade: 'E', gradePoint: '0.00', isPassed: false }
  return { grade: 'F', gradePoint: '0.00', isPassed: false }
}

function nextClassFrom(
  slots: Array<{ dayOfWeek: number; startTime: string; endTime: string; room: string | null; sessionType: string }>,
): { nextClass: string; nextClassShort: string } {
  if (slots.length === 0) return { nextClass: 'No scheduled class', nextClassShort: '—' }
  const today = isoDayOfWeek()
  const now = formatClock(new Date().toISOString().slice(11, 16))
  const ranked = [...slots].sort((a, b) => {
    const aDelta = (a.dayOfWeek - today + 7) % 7
    const bDelta = (b.dayOfWeek - today + 7) % 7
    if (aDelta !== bDelta) return aDelta - bDelta
    if (aDelta === 0) {
      const aPast = a.startTime.slice(0, 5) < now
      const bPast = b.startTime.slice(0, 5) < now
      if (aPast !== bPast) return aPast ? 1 : -1
    }
    return a.startTime.localeCompare(b.startTime)
  })
  const next = ranked[0]!
  const start = formatClock(next.startTime)
  const room = next.room ?? 'TBA'
  return {
    nextClass: `${DAY_FULL[next.dayOfWeek - 1]} · ${start} · ${room}`,
    nextClassShort: `${DAY_SHORT[next.dayOfWeek - 1]} ${start}`,
  }
}

export async function requireLecturer(institutionId: string, userId: string) {
  const db = await getInstitutionDb(institutionId)
  const [user] = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  if (!user || user.role !== 'Lecturer' || !user.isActive) {
    throw forbidden('This account is not a lecturer.')
  }
  return { db, user }
}

async function assignedOfferingIds(
  db: InstitutionDb,
  lecturerId: string,
  semesterId?: string,
): Promise<string[]> {
  const rows = await db
    .select({ offeringId: lecturerAssignments.courseOfferingId })
    .from(lecturerAssignments)
    .innerJoin(courseOfferings, eq(courseOfferings.id, lecturerAssignments.courseOfferingId))
    .where(
      semesterId
        ? and(eq(lecturerAssignments.lecturerId, lecturerId), eq(courseOfferings.semesterId, semesterId))
        : eq(lecturerAssignments.lecturerId, lecturerId),
    )
  return rows.map((row) => row.offeringId)
}

export async function requireAssignedOffering(
  db: InstitutionDb,
  lecturerId: string,
  offeringId: string,
): Promise<{ isLead: boolean }> {
  const [row] = await db
    .select({ isLead: lecturerAssignments.isLead })
    .from(lecturerAssignments)
    .where(
      and(eq(lecturerAssignments.lecturerId, lecturerId), eq(lecturerAssignments.courseOfferingId, offeringId)),
    )
    .limit(1)
  if (!row) throw forbidden('You are not assigned to that course.')
  return row
}

async function departmentForLecturer(
  db: InstitutionDb,
  lecturerId: string,
  semesterId: string | undefined,
): Promise<string> {
  const [row] = await db
    .select({ department: departments.name })
    .from(lecturerAssignments)
    .innerJoin(courseOfferings, eq(courseOfferings.id, lecturerAssignments.courseOfferingId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .innerJoin(departments, eq(departments.id, courses.departmentId))
    .where(
      semesterId
        ? and(eq(lecturerAssignments.lecturerId, lecturerId), eq(courseOfferings.semesterId, semesterId))
        : eq(lecturerAssignments.lecturerId, lecturerId),
    )
    .limit(1)
  return row?.department ?? '—'
}

async function enrolledRoster(db: InstitutionDb, offeringId: string) {
  return db
    .select({
      studentId: students.id,
      studentNumber: students.studentNumber,
      name: users.fullName,
    })
    .from(courseRegistrations)
    .innerJoin(students, eq(students.id, courseRegistrations.studentId))
    .innerJoin(users, eq(users.id, students.userId))
    .where(
      and(eq(courseRegistrations.courseOfferingId, offeringId), eq(courseRegistrations.status, 'Approved')),
    )
    .orderBy(users.fullName)
}

function mapSession(
  row: {
    id: string
    offeringId: string
    courseCode: string
    sessionDate: string
    startTime: string | null
    endTime: string | null
    topic: string | null
    closedAt: string | null
  },
  counts: { present: number; late: number; absent: number; total: number },
  sessionNumber: number,
  policy: AttendancePolicy,
): LecturerAttendanceSession {
  return {
    id: row.id,
    offeringId: row.offeringId,
    courseCode: formatCourseCode(row.courseCode),
    sessionDate: row.sessionDate,
    startTime: row.startTime ? formatClock(row.startTime) : null,
    endTime: row.endTime ? formatClock(row.endTime) : null,
    topic: row.topic,
    present: counts.present,
    late: counts.late,
    absent: counts.absent,
    total: counts.total,
    closed: Boolean(row.closedAt),
    status: attendanceSessionStatus(row.closedAt),
    closedAt: row.closedAt,
    editable: isAttendanceSessionEditable(row.closedAt, policy),
    sessionNumber,
  }
}

async function getAttendancePolicy(db: InstitutionDb): Promise<AttendancePolicy> {
  return readInstitutionSetting(
    db,
    ATTENDANCE_POLICY_SETTING_KEY,
    attendancePolicySchema,
    DEFAULT_ATTENDANCE_POLICY,
  )
}

async function requireEditableSession(
  db: InstitutionDb,
  closedAt: string | null,
): Promise<AttendancePolicy> {
  const policy = await getAttendancePolicy(db)
  if (!isAttendanceSessionEditable(closedAt, policy)) {
    throw badRequest('That attendance session can no longer be edited.')
  }
  return policy
}

async function sessionCounts(db: InstitutionDb, sessionIds: string[]) {
  const map = new Map<string, { present: number; late: number; absent: number; total: number }>()
  if (sessionIds.length === 0) return map
  const rows = await db
    .select({
      sessionId: attendanceRecords.attendanceSessionId,
      status: attendanceRecords.status,
    })
    .from(attendanceRecords)
    .where(inArray(attendanceRecords.attendanceSessionId, sessionIds))
  for (const row of rows) {
    const current = map.get(row.sessionId) ?? { present: 0, late: 0, absent: 0, total: 0 }
    current.total += 1
    if (row.status === 'Present' || row.status === 'Excused') current.present += 1
    else if (row.status === 'Late') current.late += 1
    else current.absent += 1
    map.set(row.sessionId, current)
  }
  return map
}

async function loadCourseRows(
  db: InstitutionDb,
  lecturerId: string,
  semesterId: string | undefined,
): Promise<LecturerCourseRow[]> {
  const assignmentRows = await db
    .select({
      offeringId: courseOfferings.id,
      courseId: courses.id,
      code: courses.code,
      name: courses.name,
      credits: courses.credits,
      enrolledCount: courseOfferings.enrolledCount,
      semesterName: semesters.name,
      yearName: academicYears.name,
      isLead: lecturerAssignments.isLead,
    })
    .from(lecturerAssignments)
    .innerJoin(courseOfferings, eq(courseOfferings.id, lecturerAssignments.courseOfferingId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .innerJoin(semesters, eq(semesters.id, courseOfferings.semesterId))
    .innerJoin(academicYears, eq(academicYears.id, semesters.academicYearId))
    .where(
      semesterId
        ? and(eq(lecturerAssignments.lecturerId, lecturerId), eq(courseOfferings.semesterId, semesterId))
        : eq(lecturerAssignments.lecturerId, lecturerId),
    )
    .orderBy(courses.code)

  if (assignmentRows.length === 0) return []

  const offeringIds = assignmentRows.map((row) => row.offeringId)
  const slotRows = await db
    .select({
      offeringId: timetableSlots.courseOfferingId,
      dayOfWeek: timetableSlots.dayOfWeek,
      startTime: timetableSlots.startTime,
      endTime: timetableSlots.endTime,
      sessionType: timetableSlots.sessionType,
      room: rooms.name,
    })
    .from(timetableSlots)
    .leftJoin(rooms, eq(rooms.id, timetableSlots.roomId))
    .where(inArray(timetableSlots.courseOfferingId, offeringIds))

  const enrolledRows = await db
    .select({
      offeringId: courseRegistrations.courseOfferingId,
      count: sql<number>`count(*)::int`,
    })
    .from(courseRegistrations)
    .where(
      and(inArray(courseRegistrations.courseOfferingId, offeringIds), eq(courseRegistrations.status, 'Approved')),
    )
    .groupBy(courseRegistrations.courseOfferingId)
  const enrolledByOffering = new Map(enrolledRows.map((row) => [row.offeringId, row.count]))

  return assignmentRows.map((row) => {
    const slots = slotRows.filter((slot) => slot.offeringId === row.offeringId)
    const next = nextClassFrom(slots)
    return {
      offeringId: row.offeringId,
      courseId: row.courseId,
      code: formatCourseCode(row.code),
      name: row.name,
      credits: row.credits,
      enrolledCount: enrolledByOffering.get(row.offeringId) ?? row.enrolledCount,
      color: courseColor(row.code),
      semesterName: `${row.semesterName} · ${row.yearName}`,
      isLead: row.isLead,
      nextClass: next.nextClass,
      nextClassShort: next.nextClassShort,
      schedule: slots
        .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime))
        .map((slot) => ({
          day: DAY_FULL[slot.dayOfWeek - 1] ?? 'Day',
          time: `${formatClock(slot.startTime)} – ${formatClock(slot.endTime)}`,
          room: slot.room ?? 'TBA',
          type: slot.sessionType,
        })),
    }
  })
}

export async function getLecturerProfile(institutionId: string, userId: string): Promise<LecturerProfile> {
  const { db, user } = await requireLecturer(institutionId, userId)
  const semester = await currentSemester(institutionId)
  const platform = getPlatformDb()
  const [institution] = await platform
    .select({ name: institutions.name, shortName: institutions.shortName })
    .from(institutions)
    .where(eq(institutions.id, institutionId))
    .limit(1)

  return {
    userId: user.id,
    fullName: user.fullName,
    firstName: firstName(user.fullName),
    email: user.email,
    role: user.role,
    staffId: staffIdFrom(user.id),
    department: await departmentForLecturer(db, user.id, semester?.id),
    institutionName: institution?.name ?? 'Institution',
    institutionShortName: institution?.shortName ?? 'INS',
    unreadCount: await unreadCount(institutionId, userId),
  }
}

export async function getLecturerDashboard(institutionId: string, userId: string): Promise<LecturerDashboard> {
  const profile = await getLecturerProfile(institutionId, userId)
  const { db, user } = await requireLecturer(institutionId, userId)
  const semester = await currentSemester(institutionId)
  const coursesForLecturer = await loadCourseRows(db, user.id, semester?.id)
  const offeringIds = coursesForLecturer.map((course) => course.offeringId)

  const pendingBatches = offeringIds.length
    ? await db
        .select({ id: resultBatches.id, status: resultBatches.status, offeringId: resultBatches.courseOfferingId })
        .from(resultBatches)
        .where(inArray(resultBatches.courseOfferingId, offeringIds))
    : []

  const pendingResultEntries = pendingBatches.filter(
    (batch) => batch.status === 'Draft' || batch.status === 'Rejected',
  ).length

  const atRiskStudents = await listLecturerAtRiskStudents(institutionId, userId)
  const openAtRisk = atRiskStudents.filter((student) => !student.resolved)

  const today = isoDayOfWeek()
  const scheduleRows = offeringIds.length
    ? await db
        .select({
          id: timetableSlots.id,
          offeringId: timetableSlots.courseOfferingId,
          courseCode: courses.code,
          courseName: courses.name,
          sessionType: timetableSlots.sessionType,
          startTime: timetableSlots.startTime,
          endTime: timetableSlots.endTime,
          room: rooms.name,
          dayOfWeek: timetableSlots.dayOfWeek,
        })
        .from(timetableSlots)
        .innerJoin(courseOfferings, eq(courseOfferings.id, timetableSlots.courseOfferingId))
        .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
        .leftJoin(rooms, eq(rooms.id, timetableSlots.roomId))
        .where(and(inArray(timetableSlots.courseOfferingId, offeringIds), eq(timetableSlots.dayOfWeek, today)))
        .orderBy(timetableSlots.startTime)
    : []

  const sessionRows = offeringIds.length
    ? await db
        .select({
          id: attendanceSessions.id,
          offeringId: attendanceSessions.courseOfferingId,
          courseCode: courses.code,
          sessionDate: attendanceSessions.sessionDate,
          startTime: attendanceSessions.startTime,
          endTime: attendanceSessions.endTime,
          topic: attendanceSessions.topic,
          closedAt: attendanceSessions.closedAt,
        })
        .from(attendanceSessions)
        .innerJoin(courseOfferings, eq(courseOfferings.id, attendanceSessions.courseOfferingId))
        .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
        .where(inArray(attendanceSessions.courseOfferingId, offeringIds))
        .orderBy(desc(attendanceSessions.sessionDate))
        .limit(8)
    : []

  const counts = await sessionCounts(
    db,
    sessionRows.map((row) => row.id),
  )
  const attendancePolicy = await getAttendancePolicy(db)
  const recentAttendance = sessionRows.map((row, index) =>
    mapSession(
      row,
      counts.get(row.id) ?? { present: 0, late: 0, absent: 0, total: 0 },
      sessionRows.length - index,
      attendancePolicy,
    ),
  )

  const pendingActions: LecturerDashboard['pendingActions'] = []
  for (const batch of pendingBatches) {
    if (batch.status !== 'Draft' && batch.status !== 'Rejected') continue
    const course = coursesForLecturer.find((item) => item.offeringId === batch.offeringId)
    if (!course) continue
    pendingActions.push({
      id: `results-${batch.offeringId}`,
      task: `${batch.status === 'Rejected' ? 'Revise and resubmit' : 'Submit'} ${course.code} results`,
      due: batch.status === 'Rejected' ? 'Returned' : 'Awaiting submission',
      href: '/lecturer/results',
    })
  }
  const todayDate = todayIsoDate()
  for (const item of scheduleRows) {
    const alreadyTaken = sessionRows.some(
      (session) => session.offeringId === item.offeringId && session.sessionDate === todayDate,
    )
    if (alreadyTaken) continue
    pendingActions.push({
      id: `att-${item.offeringId}`,
      task: `Mark attendance — ${formatCourseCode(item.courseCode)}`,
      due: 'Today',
      href: '/lecturer/attendance',
    })
  }

  return {
    profile,
    stats: {
      assignedCourses: coursesForLecturer.length,
      pendingResultEntries,
      atRiskStudents: openAtRisk.length,
      semesterLabel: semester ? `${semester.name} · ${semester.yearName}` : 'No current semester',
    },
    courses: coursesForLecturer,
    todaySchedule: scheduleRows.map((row) => ({
      id: row.id,
      offeringId: row.offeringId,
      courseCode: formatCourseCode(row.courseCode),
      courseName: row.courseName,
      sessionType: row.sessionType,
      startTime: formatClock(row.startTime),
      endTime: formatClock(row.endTime),
      room: row.room,
      dayOfWeek: row.dayOfWeek,
      color: courseColor(row.courseCode),
    })),
    recentAttendance,
    atRisk: openAtRisk.slice(0, 4).map((student) => ({
      id: student.id,
      name: student.name,
      courseCode: student.courseCode ?? '—',
      reason: student.riskFactors[0]?.label ?? student.riskLevel,
      riskLevel: student.riskLevel,
    })),
    pendingActions: pendingActions.slice(0, 6),
  }
}

export async function listLecturerCourses(institutionId: string, userId: string): Promise<LecturerCourseRow[]> {
  const { db, user } = await requireLecturer(institutionId, userId)
  const semester = await currentSemester(institutionId)
  return loadCourseRows(db, user.id, semester?.id)
}

export async function getLecturerCourse(
  institutionId: string,
  userId: string,
  offeringId: string,
): Promise<LecturerCourseDetail> {
  const { db, user } = await requireLecturer(institutionId, userId)
  await requireAssignedOffering(db, user.id, offeringId)
  const semester = await currentSemester(institutionId)
  const coursesForLecturer = await loadCourseRows(db, user.id, semester?.id)
  const course = coursesForLecturer.find((item) => item.offeringId === offeringId)
  if (!course) throw notFound('That course')

  const [catalogue] = await db
    .select({ description: courses.description })
    .from(courses)
    .where(eq(courses.id, course.courseId))
    .limit(1)

  const roster = await enrolledRoster(db, offeringId)
  const attendanceByStudent = new Map<string, { present: number; total: number }>()
  if (roster.length > 0) {
    const rows = await db
      .select({
        studentId: attendanceRecords.studentId,
        status: attendanceRecords.status,
      })
      .from(attendanceRecords)
      .innerJoin(attendanceSessions, eq(attendanceSessions.id, attendanceRecords.attendanceSessionId))
      .where(eq(attendanceSessions.courseOfferingId, offeringId))
    for (const row of rows) {
      const current = attendanceByStudent.get(row.studentId) ?? { present: 0, total: 0 }
      current.total += 1
      if (row.status === 'Present' || row.status === 'Late' || row.status === 'Excused') current.present += 1
      attendanceByStudent.set(row.studentId, current)
    }
  }

  const resultRows = await db
    .select({ studentId: results.studentId, grade: results.grade })
    .from(results)
    .where(eq(results.courseOfferingId, offeringId))
  const gradeByStudent = new Map(resultRows.map((row) => [row.studentId, row.grade]))

  const atRisk = await listLecturerAtRiskStudents(institutionId, userId)
  const riskByStudent = new Map(atRisk.map((row) => [row.id, row.riskLevel]))

  const materialRows = await db
    .select({
      id: courseMaterials.id,
      moduleId: courseMaterials.moduleId,
      title: courseMaterials.title,
      description: courseMaterials.description,
      moduleName: courseMaterials.moduleName,
      bodyText: courseMaterials.bodyText,
      sequence: courseMaterials.sequence,
      externalUrl: courseMaterials.externalUrl,
      fileKey: courseMaterials.fileKey,
      mimeType: courseMaterials.mimeType,
      fileSizeBytes: courseMaterials.fileSizeBytes,
      isPublished: courseMaterials.isPublished,
      publishedAt: courseMaterials.publishedAt,
      createdAt: courseMaterials.createdAt,
    })
    .from(courseMaterials)
    .where(eq(courseMaterials.courseOfferingId, offeringId))
    .orderBy(desc(courseMaterials.createdAt))

  const moduleRows = await listModuleRows(db, offeringId)
  const announcementRows = await listOfferingAnnouncementRows(db, offeringId)

  const assessmentRows = await db
    .select({
      id: assessments.id,
      title: assessments.title,
      type: assessments.type,
      weight: assessments.weight,
      totalMarks: assessments.totalMarks,
      dueAt: assessments.dueAt,
      isPublished: assessments.isPublished,
    })
    .from(assessments)
    .where(eq(assessments.courseOfferingId, offeringId))
    .orderBy(assessments.createdAt)

  return {
    ...course,
    description: catalogue?.description ?? null,
    students: roster.map((student) => {
      const attendance = attendanceByStudent.get(student.studentId)
      return {
        studentId: student.studentId,
        studentNumber: student.studentNumber,
        name: student.name,
        attendanceRate: attendance ? Math.round((attendance.present / attendance.total) * 100) : null,
        lastGrade: gradeByStudent.get(student.studentId) ?? null,
        riskLevel: riskByStudent.get(student.studentId) ?? null,
      }
    }),
    modules: moduleRows,
    materials: materialRows.map((row) => {
      const moduleTitle = row.moduleId
        ? moduleRows.find((module) => module.id === row.moduleId)?.title
        : null
      return mapLecturerMaterial({
        ...row,
        moduleName: row.moduleName ?? moduleTitle ?? null,
      })
    }),
    announcements: announcementRows,
    discussions: await listOfferingDiscussionSummaries(db, offeringId),
    liveSessions: await (await import('./live-sessions')).listOfferingLiveSessionSummaries(db, offeringId),
    assessments: assessmentRows.map((row) => ({
      id: row.id,
      title: row.title,
      type: row.type,
      weight: asNumber(row.weight) ?? 0,
      totalMarks: asNumber(row.totalMarks) ?? 0,
      dueAt: row.dueAt,
      isPublished: row.isPublished,
    })),
  }
}

function courseMaterialKeyPrefix(institutionId: string, offeringId: string): string {
  return `institutions/${institutionId}/offerings/${offeringId}/materials/`
}

function mapLecturerMaterial(row: {
  id: string
  moduleId?: string | null
  title: string
  description: string | null
  moduleName: string | null
  bodyText?: string | null
  sequence?: number | null
  externalUrl?: string | null
  fileKey?: string | null
  mimeType?: string | null
  fileSizeBytes?: number | null
  isPublished: boolean
  publishedAt: string | null
  createdAt: string
}): LecturerCourseMaterial {
  return {
    id: row.id,
    moduleId: row.moduleId ?? null,
    title: row.title,
    description: row.description,
    moduleName: row.moduleName,
    bodyText: row.bodyText ?? null,
    sequence: row.sequence ?? 0,
    externalUrl: row.externalUrl ?? null,
    fileKey: row.fileKey ?? null,
    fileName: row.fileKey ? fileNameFromStorageKey(row.fileKey) : null,
    mimeType: row.mimeType ?? null,
    fileSizeBytes: row.fileSizeBytes ?? null,
    isPublished: row.isPublished,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
  }
}

/**
 * Course modules.
 *
 * A module is a unit of the course holding materials in a set order. It may
 * point at an earlier module as its prerequisite, which is what keeps it shut
 * for a student who has not worked through that earlier one yet.
 */

async function listModuleRows(
  db: InstitutionDb,
  offeringId: string,
): Promise<LecturerCourseModule[]> {
  const rows = await db
    .select({
      id: courseModules.id,
      title: courseModules.title,
      summary: courseModules.summary,
      sequence: courseModules.sequence,
      prerequisiteModuleId: courseModules.prerequisiteModuleId,
      isPublished: courseModules.isPublished,
      publishedAt: courseModules.publishedAt,
      createdAt: courseModules.createdAt,
      materialCount: count(courseMaterials.id),
    })
    .from(courseModules)
    .leftJoin(
      courseMaterials,
      and(eq(courseMaterials.moduleId, courseModules.id), eq(courseMaterials.isPublished, true)),
    )
    .where(eq(courseModules.courseOfferingId, offeringId))
    .groupBy(courseModules.id)
    .orderBy(asc(courseModules.sequence), asc(courseModules.createdAt))

  return rows.map((row) => ({ ...row, materialCount: Number(row.materialCount) }))
}

async function requireOwnModule(
  db: InstitutionDb,
  lecturerId: string,
  moduleId: string,
): Promise<{ offeringId: string; title: string }> {
  const [row] = await db
    .select({ offeringId: courseModules.courseOfferingId, title: courseModules.title })
    .from(courseModules)
    .where(eq(courseModules.id, moduleId))
    .limit(1)
  if (!row) throw notFound('That module')
  await requireAssignedOffering(db, lecturerId, row.offeringId)
  return row
}

/**
 * A prerequisite has to be another module on the same course, and the chain
 * has to stay acyclic. Without the cycle check two modules could each wait on
 * the other and neither would ever open for a student.
 */
async function assertUsablePrerequisite(
  db: InstitutionDb,
  input: { moduleId: string | null; offeringId: string; prerequisiteModuleId: string },
): Promise<void> {
  if (input.moduleId && input.prerequisiteModuleId === input.moduleId) {
    throw badRequest('A module cannot be its own prerequisite.')
  }

  const [prerequisite] = await db
    .select({
      offeringId: courseModules.courseOfferingId,
      prerequisiteModuleId: courseModules.prerequisiteModuleId,
    })
    .from(courseModules)
    .where(eq(courseModules.id, input.prerequisiteModuleId))
    .limit(1)

  if (!prerequisite || prerequisite.offeringId !== input.offeringId) {
    throw badRequest('Choose a prerequisite module from this course.')
  }

  if (!input.moduleId) return

  const seen = new Set<string>([input.moduleId])
  let cursor = prerequisite.prerequisiteModuleId
  while (cursor) {
    if (seen.has(cursor)) {
      throw badRequest('That prerequisite would create a loop between modules.')
    }
    seen.add(cursor)
    const [next] = await db
      .select({ prerequisiteModuleId: courseModules.prerequisiteModuleId })
      .from(courseModules)
      .where(eq(courseModules.id, cursor))
      .limit(1)
    cursor = next?.prerequisiteModuleId ?? null
  }
}

export async function createLecturerModule(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  input: CreateLecturerModuleRequest,
): Promise<LecturerCourseModule> {
  const db = await getInstitutionDb(institutionId)
  await requireAssignedOffering(db, actor.id, input.offeringId)

  if (input.prerequisiteModuleId) {
    await assertUsablePrerequisite(db, {
      moduleId: null,
      offeringId: input.offeringId,
      prerequisiteModuleId: input.prerequisiteModuleId,
    })
  }

  const [created] = await db
    .insert(courseModules)
    .values({
      courseOfferingId: input.offeringId,
      title: input.title,
      summary: input.summary ?? null,
      sequence: input.sequence ?? (await nextModuleSequence(db, input.offeringId)),
      prerequisiteModuleId: input.prerequisiteModuleId ?? null,
      isPublished: input.publish ?? false,
      publishedAt: input.publish ? new Date().toISOString() : null,
      createdBy: actor.id,
    })
    .returning({ id: courseModules.id })

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'modules.write',
    targetType: 'course_module',
    targetId: created!.id,
    metadata: { title: input.title, offeringId: input.offeringId },
  })

  const modules = await listModuleRows(db, input.offeringId)
  return modules.find((row) => row.id === created!.id)!
}

async function nextModuleSequence(db: InstitutionDb, offeringId: string): Promise<number> {
  const [row] = await db
    .select({ highest: sql<number>`coalesce(max(${courseModules.sequence}), -1)` })
    .from(courseModules)
    .where(eq(courseModules.courseOfferingId, offeringId))
  return Number(row?.highest ?? -1) + 1
}

export async function updateLecturerModule(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  moduleId: string,
  input: UpdateLecturerModuleRequest,
): Promise<LecturerCourseModule> {
  const db = await getInstitutionDb(institutionId)
  const existing = await requireOwnModule(db, actor.id, moduleId)

  if (input.prerequisiteModuleId) {
    await assertUsablePrerequisite(db, {
      moduleId,
      offeringId: existing.offeringId,
      prerequisiteModuleId: input.prerequisiteModuleId,
    })
  }

  await db
    .update(courseModules)
    .set({
      ...(input.title === undefined ? {} : { title: input.title }),
      ...(input.summary === undefined ? {} : { summary: input.summary }),
      ...(input.sequence === undefined ? {} : { sequence: input.sequence }),
      ...(input.prerequisiteModuleId === undefined
        ? {}
        : { prerequisiteModuleId: input.prerequisiteModuleId }),
      ...(input.publish === undefined
        ? {}
        : {
            isPublished: input.publish,
            publishedAt: input.publish ? new Date().toISOString() : null,
          }),
    })
    .where(eq(courseModules.id, moduleId))

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'modules.write',
    targetType: 'course_module',
    targetId: moduleId,
    metadata: { title: input.title ?? existing.title, offeringId: existing.offeringId },
  })

  const modules = await listModuleRows(db, existing.offeringId)
  return modules.find((row) => row.id === moduleId)!
}

/**
 * Materials in a deleted module are kept and fall back to being loose in the
 * course. Losing a module heading should never lose the teaching content.
 */
export async function deleteLecturerModule(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  moduleId: string,
): Promise<void> {
  const db = await getInstitutionDb(institutionId)
  const existing = await requireOwnModule(db, actor.id, moduleId)

  await db.delete(courseModules).where(eq(courseModules.id, moduleId))

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'modules.delete',
    targetType: 'course_module',
    targetId: moduleId,
    metadata: { title: existing.title, offeringId: existing.offeringId },
  })
}

/**
 * Per-course announcements.
 *
 * These reuse the existing announcements table. An institution-wide notice has
 * a null offering; setting the offering is what turns a row into a course feed
 * entry, which is why the ICT list filters those rows out.
 */

async function listOfferingAnnouncementRows(
  db: InstitutionDb,
  offeringId: string,
): Promise<LecturerCourseAnnouncement[]> {
  return db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      isPinned: announcements.isPinned,
      publishedAt: announcements.publishedAt,
      createdAt: announcements.createdAt,
    })
    .from(announcements)
    .where(eq(announcements.courseOfferingId, offeringId))
    .orderBy(desc(announcements.isPinned), desc(announcements.createdAt))
}

async function requireOwnAnnouncement(
  db: InstitutionDb,
  lecturerId: string,
  announcementId: string,
): Promise<{ offeringId: string; title: string; isPublished: boolean }> {
  const [row] = await db
    .select({
      offeringId: announcements.courseOfferingId,
      title: announcements.title,
      publishedAt: announcements.publishedAt,
    })
    .from(announcements)
    .where(eq(announcements.id, announcementId))
    .limit(1)
  if (!row?.offeringId) throw notFound('That announcement')
  await requireAssignedOffering(db, lecturerId, row.offeringId)
  return { offeringId: row.offeringId, title: row.title, isPublished: Boolean(row.publishedAt) }
}

export async function createLecturerAnnouncement(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  input: CreateLecturerAnnouncementRequest,
): Promise<LecturerCourseAnnouncement> {
  const db = await getInstitutionDb(institutionId)
  await requireAssignedOffering(db, actor.id, input.offeringId)

  const publish = input.publish ?? true
  const [created] = await db
    .insert(announcements)
    .values({
      courseOfferingId: input.offeringId,
      title: input.title,
      body: input.body,
      audienceRoles: ['Student'],
      isPinned: input.isPinned ?? false,
      publishedAt: publish ? new Date().toISOString() : null,
      createdBy: actor.id,
    })
    .returning({ id: announcements.id })

  if (publish) {
    await notifyEnrolledStudentsOfAnnouncement(db, input.offeringId, {
      title: input.title,
      body: input.body,
    })
  }

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: publish ? 'course.announcement.publish' : 'course.announcement.draft',
    targetType: 'announcement',
    targetId: created!.id,
    metadata: { title: input.title, offeringId: input.offeringId },
  })

  const rows = await listOfferingAnnouncementRows(db, input.offeringId)
  return rows.find((row) => row.id === created!.id)!
}

export async function updateLecturerAnnouncement(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  announcementId: string,
  input: UpdateLecturerAnnouncementRequest,
): Promise<LecturerCourseAnnouncement> {
  const db = await getInstitutionDb(institutionId)
  const existing = await requireOwnAnnouncement(db, actor.id, announcementId)

  await db
    .update(announcements)
    .set({
      ...(input.title === undefined ? {} : { title: input.title }),
      ...(input.body === undefined ? {} : { body: input.body }),
      ...(input.isPinned === undefined ? {} : { isPinned: input.isPinned }),
      ...(input.publish === undefined
        ? {}
        : { publishedAt: input.publish ? new Date().toISOString() : null }),
    })
    .where(eq(announcements.id, announcementId))

  // Students are told once, when it first goes live, never again on an edit.
  if (input.publish === true && !existing.isPublished) {
    await notifyEnrolledStudentsOfAnnouncement(db, existing.offeringId, {
      title: input.title ?? existing.title,
      body: input.body ?? '',
    })
  }

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action:
      input.publish === true && !existing.isPublished
        ? 'course.announcement.publish'
        : 'course.announcement.update',
    targetType: 'announcement',
    targetId: announcementId,
    metadata: { title: input.title ?? existing.title, offeringId: existing.offeringId },
  })

  const rows = await listOfferingAnnouncementRows(db, existing.offeringId)
  return rows.find((row) => row.id === announcementId)!
}

export async function deleteLecturerAnnouncement(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  announcementId: string,
): Promise<void> {
  const db = await getInstitutionDb(institutionId)
  const existing = await requireOwnAnnouncement(db, actor.id, announcementId)

  await db.delete(announcements).where(eq(announcements.id, announcementId))

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'course.announcement.delete',
    targetType: 'announcement',
    targetId: announcementId,
    metadata: { title: existing.title, offeringId: existing.offeringId },
  })
}

function parseExternalUrl(value: string | undefined): string | null {
  const externalUrl = value?.trim()
  if (!externalUrl) return null
  try {
    new URL(externalUrl)
  } catch {
    throw badRequest('Enter a valid link URL or leave it blank.')
  }
  return externalUrl
}

function assertMaterialFileInput(input: {
  fileKey?: string
  mimeType?: string
  fileSizeBytes?: number
  institutionId: string
  offeringId: string
}): { fileKey: string; mimeType: string; fileSizeBytes: number } | null {
  if (!input.fileKey) return null
  const prefix = courseMaterialKeyPrefix(input.institutionId, input.offeringId)
  if (!input.fileKey.startsWith(prefix)) throw badRequest('That upload is not valid for this course.')
  if (!input.mimeType || !COURSE_MATERIAL_MIME_TYPES.has(input.mimeType)) {
    throw badRequest('Upload a PDF, Word document, or image file.')
  }
  if (!input.fileSizeBytes || input.fileSizeBytes > COURSE_MATERIAL_MAX_BYTES) {
    throw badRequest('The file is too large. Maximum size is 10 MB.')
  }
  return { fileKey: input.fileKey, mimeType: input.mimeType, fileSizeBytes: input.fileSizeBytes }
}

async function getAssignedMaterial(
  db: InstitutionDb,
  userId: string,
  materialId: string,
): Promise<{
  id: string
  offeringId: string
  title: string
  fileKey: string | null
}> {
  const [row] = await db
    .select({
      id: courseMaterials.id,
      offeringId: courseMaterials.courseOfferingId,
      title: courseMaterials.title,
      fileKey: courseMaterials.fileKey,
    })
    .from(courseMaterials)
    .where(eq(courseMaterials.id, materialId))
    .limit(1)
  if (!row) throw notFound('That course material')
  await requireAssignedOffering(db, userId, row.offeringId)
  return row
}

export async function reserveLecturerMaterialUpload(
  institutionId: string,
  userId: string,
  input: ReserveLecturerMaterialUploadRequest,
): Promise<{ fileKey: string } & UploadTarget> {
  const { db } = await requireLecturer(institutionId, userId)
  await requireAssignedOffering(db, userId, input.offeringId)

  const fileKey = buildCourseMaterialFileKey({
    institutionId,
    offeringId: input.offeringId,
    fileName: input.fileName,
  })
  const target = await createUploadTarget({
    fileKey,
    mimeType: input.mimeType,
    fileSizeBytes: input.fileSizeBytes,
  })
  return { fileKey, ...target }
}

/** A material may only join a module that belongs to the same course offering. */
async function resolveMaterialModuleId(
  db: InstitutionDb,
  offeringId: string,
  moduleId: string | null | undefined,
): Promise<string | null> {
  if (!moduleId) return null
  const [row] = await db
    .select({ offeringId: courseModules.courseOfferingId })
    .from(courseModules)
    .where(eq(courseModules.id, moduleId))
    .limit(1)
  if (!row || row.offeringId !== offeringId) {
    throw badRequest('Choose a module from this course.')
  }
  return moduleId
}

export async function createLecturerMaterial(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  input: CreateLecturerMaterialRequest,
): Promise<LecturerCourseMaterial> {
  const { db } = await requireLecturer(institutionId, actor.id)
  await requireAssignedOffering(db, actor.id, input.offeringId)

  const externalUrl = parseExternalUrl(input.externalUrl)
  const file = assertMaterialFileInput({
    fileKey: input.fileKey,
    mimeType: input.mimeType,
    fileSizeBytes: input.fileSizeBytes,
    institutionId,
    offeringId: input.offeringId,
  })

  const moduleId = await resolveMaterialModuleId(db, input.offeringId, input.moduleId)

  const publish = input.publish ?? true
  const now = new Date().toISOString()
  const [created] = await db
    .insert(courseMaterials)
    .values({
      courseOfferingId: input.offeringId,
      moduleId,
      title: input.title,
      description: input.description ?? null,
      moduleName: input.moduleName ?? null,
      bodyText: input.bodyText ?? null,
      sequence: input.sequence ?? 0,
      externalUrl,
      fileKey: file?.fileKey ?? null,
      mimeType: file?.mimeType ?? null,
      fileSizeBytes: file?.fileSizeBytes ?? null,
      isPublished: publish,
      publishedAt: publish ? now : null,
      uploadedBy: actor.id,
    })
    .returning({
      id: courseMaterials.id,
      moduleId: courseMaterials.moduleId,
      title: courseMaterials.title,
      description: courseMaterials.description,
      moduleName: courseMaterials.moduleName,
      bodyText: courseMaterials.bodyText,
      sequence: courseMaterials.sequence,
      externalUrl: courseMaterials.externalUrl,
      fileKey: courseMaterials.fileKey,
      mimeType: courseMaterials.mimeType,
      fileSizeBytes: courseMaterials.fileSizeBytes,
      isPublished: courseMaterials.isPublished,
      publishedAt: courseMaterials.publishedAt,
      createdAt: courseMaterials.createdAt,
    })

  if (publish) {
    await notifyEnrolledStudentsOfMaterial(db, input.offeringId, created!.title, 'published')
  }

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'materials.write',
    targetType: 'course_material',
    targetId: created!.id,
    metadata: { title: input.title, offeringId: input.offeringId },
  })

  return mapLecturerMaterial(created!)
}

export async function updateLecturerMaterial(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  materialId: string,
  input: UpdateLecturerMaterialRequest,
): Promise<LecturerCourseMaterial> {
  const { db } = await requireLecturer(institutionId, actor.id)
  const [existing] = await db
    .select({
      id: courseMaterials.id,
      offeringId: courseMaterials.courseOfferingId,
      title: courseMaterials.title,
      fileKey: courseMaterials.fileKey,
      isPublished: courseMaterials.isPublished,
      publishedAt: courseMaterials.publishedAt,
    })
    .from(courseMaterials)
    .where(eq(courseMaterials.id, materialId))
    .limit(1)
  if (!existing) throw notFound('That course material')
  await requireAssignedOffering(db, actor.id, existing.offeringId)

  const externalUrl = input.externalUrl !== undefined ? parseExternalUrl(input.externalUrl) : undefined
  const nextFile = input.fileKey
    ? assertMaterialFileInput({
        fileKey: input.fileKey,
        mimeType: input.mimeType,
        fileSizeBytes: input.fileSizeBytes,
        institutionId,
        offeringId: existing.offeringId,
      })
    : null

  const publish = input.publish
  const now = new Date().toISOString()
  const nextPublished = publish ?? existing.isPublished
  const nextPublishedAt =
    publish === true
      ? existing.publishedAt ?? now
      : publish === false
        ? null
        : existing.publishedAt

  const nextModuleId =
    input.moduleId === undefined
      ? undefined
      : await resolveMaterialModuleId(db, existing.offeringId, input.moduleId)

  const [updated] = await db
    .update(courseMaterials)
    .set({
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description ?? null } : {}),
      ...(input.moduleName !== undefined ? { moduleName: input.moduleName ?? null } : {}),
      ...(nextModuleId !== undefined ? { moduleId: nextModuleId } : {}),
      ...(input.bodyText !== undefined ? { bodyText: input.bodyText ?? null } : {}),
      ...(input.sequence !== undefined ? { sequence: input.sequence } : {}),
      ...(externalUrl !== undefined ? { externalUrl } : {}),
      ...(input.clearFile ? { fileKey: null, mimeType: null, fileSizeBytes: null } : {}),
      ...(nextFile
        ? {
            fileKey: nextFile.fileKey,
            mimeType: nextFile.mimeType,
            fileSizeBytes: nextFile.fileSizeBytes,
          }
        : {}),
      ...(publish !== undefined ? { isPublished: nextPublished, publishedAt: nextPublishedAt } : {}),
    })
    .where(eq(courseMaterials.id, materialId))
    .returning({
      id: courseMaterials.id,
      moduleId: courseMaterials.moduleId,
      title: courseMaterials.title,
      description: courseMaterials.description,
      moduleName: courseMaterials.moduleName,
      bodyText: courseMaterials.bodyText,
      sequence: courseMaterials.sequence,
      externalUrl: courseMaterials.externalUrl,
      fileKey: courseMaterials.fileKey,
      mimeType: courseMaterials.mimeType,
      fileSizeBytes: courseMaterials.fileSizeBytes,
      isPublished: courseMaterials.isPublished,
      publishedAt: courseMaterials.publishedAt,
      createdAt: courseMaterials.createdAt,
    })

  if (existing.fileKey && (input.clearFile || (nextFile && nextFile.fileKey !== existing.fileKey))) {
    await deleteStoredObject(existing.fileKey).catch(() => undefined)
  }

  if (updated!.isPublished) {
    const becamePublished = publish === true && !existing.isPublished
    const updatedPublished =
      existing.isPublished
      && (input.title !== undefined
        || input.description !== undefined
        || input.moduleName !== undefined
        || input.externalUrl !== undefined
        || input.clearFile
        || Boolean(nextFile))
    if (becamePublished || updatedPublished) {
      await notifyEnrolledStudentsOfMaterial(
        db,
        existing.offeringId,
        updated!.title,
        becamePublished ? 'published' : 'updated',
      )
    }
  }

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'materials.write',
    targetType: 'course_material',
    targetId: materialId,
    metadata: { title: input.title ?? existing.title, offeringId: existing.offeringId },
  })

  return mapLecturerMaterial(updated!)
}

export async function deleteLecturerMaterial(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  materialId: string,
): Promise<void> {
  const { db } = await requireLecturer(institutionId, actor.id)
  const existing = await getAssignedMaterial(db, actor.id, materialId)

  await db.delete(courseMaterials).where(eq(courseMaterials.id, materialId))

  if (existing.fileKey) {
    await deleteStoredObject(existing.fileKey).catch(() => undefined)
  }

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'materials.write',
    targetType: 'course_material',
    targetId: materialId,
    metadata: { title: existing.title, offeringId: existing.offeringId },
  })
}

export async function getLecturerMaterialDownloadUrl(
  institutionId: string,
  userId: string,
  materialId: string,
): Promise<{ url: string; expiresAt: string; fileName: string | null }> {
  const { db } = await requireLecturer(institutionId, userId)
  const [row] = await db
    .select({
      id: courseMaterials.id,
      offeringId: courseMaterials.courseOfferingId,
      fileKey: courseMaterials.fileKey,
    })
    .from(courseMaterials)
    .where(eq(courseMaterials.id, materialId))
    .limit(1)
  if (!row?.fileKey) throw notFound('That file')
  await requireAssignedOffering(db, userId, row.offeringId)
  const download = await createDownloadUrl(row.fileKey)
  return { ...download, fileName: fileNameFromStorageKey(row.fileKey) }
}

async function loadAttendanceSessions(
  db: InstitutionDb,
  offeringIds: string[],
): Promise<LecturerAttendanceSession[]> {
  if (offeringIds.length === 0) return []
  const policy = await getAttendancePolicy(db)
  const rows = await db
    .select({
      id: attendanceSessions.id,
      offeringId: attendanceSessions.courseOfferingId,
      courseCode: courses.code,
      sessionDate: attendanceSessions.sessionDate,
      startTime: attendanceSessions.startTime,
      endTime: attendanceSessions.endTime,
      topic: attendanceSessions.topic,
      closedAt: attendanceSessions.closedAt,
    })
    .from(attendanceSessions)
    .innerJoin(courseOfferings, eq(courseOfferings.id, attendanceSessions.courseOfferingId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .where(inArray(attendanceSessions.courseOfferingId, offeringIds))
    .orderBy(desc(attendanceSessions.sessionDate), desc(attendanceSessions.startTime))

  const counts = await sessionCounts(
    db,
    rows.map((row) => row.id),
  )
  const numbered = new Map<string, number>()
  const chronological = [...rows].sort((a, b) => a.sessionDate.localeCompare(b.sessionDate))
  for (const row of chronological) {
    numbered.set(row.id, (numbered.get(row.offeringId) ?? 0) + 1)
    numbered.set(row.offeringId, numbered.get(row.id)!)
  }
  return rows.map((row) =>
    mapSession(
      row,
      counts.get(row.id) ?? { present: 0, late: 0, absent: 0, total: 0 },
      numbered.get(row.id) ?? 1,
      policy,
    ),
  )
}

export async function listLecturerAttendance(
  institutionId: string,
  userId: string,
  offeringId?: string,
): Promise<LecturerAttendanceSession[]> {
  const { db, user } = await requireLecturer(institutionId, userId)
  const semester = await currentSemester(institutionId)
  const assigned = await assignedOfferingIds(db, user.id, semester?.id)
  const ids = offeringId ? (assigned.includes(offeringId) ? [offeringId] : []) : assigned
  if (offeringId && !assigned.includes(offeringId)) throw forbidden('You are not assigned to that course.')
  return loadAttendanceSessions(db, ids)
}

export async function getLecturerAttendanceSession(
  institutionId: string,
  userId: string,
  sessionId: string,
): Promise<LecturerAttendanceDetail> {
  const { db, user } = await requireLecturer(institutionId, userId)
  const [row] = await db
    .select({
      id: attendanceSessions.id,
      offeringId: attendanceSessions.courseOfferingId,
      courseCode: courses.code,
      sessionDate: attendanceSessions.sessionDate,
      startTime: attendanceSessions.startTime,
      endTime: attendanceSessions.endTime,
      topic: attendanceSessions.topic,
      closedAt: attendanceSessions.closedAt,
    })
    .from(attendanceSessions)
    .innerJoin(courseOfferings, eq(courseOfferings.id, attendanceSessions.courseOfferingId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .where(eq(attendanceSessions.id, sessionId))
    .limit(1)
  if (!row) throw notFound('That attendance session')
  await requireAssignedOffering(db, user.id, row.offeringId)

  const recordRows = await db
    .select({
      studentId: attendanceRecords.studentId,
      studentNumber: students.studentNumber,
      name: users.fullName,
      status: attendanceRecords.status,
      note: attendanceRecords.note,
    })
    .from(attendanceRecords)
    .innerJoin(students, eq(students.id, attendanceRecords.studentId))
    .innerJoin(users, eq(users.id, students.userId))
    .where(eq(attendanceRecords.attendanceSessionId, sessionId))
    .orderBy(users.fullName)

  const sessions = await loadAttendanceSessions(db, [row.offeringId])
  const summary = sessions.find((session) => session.id === sessionId)
  const policy = await getAttendancePolicy(db)
  const counts = {
    present: recordRows.filter((item) => item.status === 'Present' || item.status === 'Excused').length,
    late: recordRows.filter((item) => item.status === 'Late').length,
    absent: recordRows.filter((item) => item.status === 'Absent').length,
    total: recordRows.length,
  }

  return {
    ...(summary ?? mapSession(row, counts, 1, policy)),
    records: recordRows,
  }
}

export async function saveLecturerAttendance(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  input: SaveLecturerAttendanceRequest,
): Promise<LecturerAttendanceDetail> {
  const { db } = await requireLecturer(institutionId, actor.id)
  await requireAssignedOffering(db, actor.id, input.offeringId)

  const roster = await enrolledRoster(db, input.offeringId)
  const rosterIds = new Set(roster.map((student) => student.studentId))
  for (const record of input.records) {
    if (!rosterIds.has(record.studentId)) {
      throw badRequest('One of those students is not enrolled in this course.')
    }
  }

  const startTime = input.startTime ?? '08:00'
  let sessionId = input.sessionId
  let existingClosedAt: string | null = null

  if (sessionId) {
    const [existingById] = await db
      .select({
        id: attendanceSessions.id,
        offeringId: attendanceSessions.courseOfferingId,
        closedAt: attendanceSessions.closedAt,
      })
      .from(attendanceSessions)
      .where(eq(attendanceSessions.id, sessionId))
      .limit(1)
    if (!existingById) throw notFound('That attendance session')
    if (existingById.offeringId !== input.offeringId) {
      throw badRequest('That session does not belong to this course.')
    }
    await requireEditableSession(db, existingById.closedAt)
    existingClosedAt = existingById.closedAt
  } else {
    const [existing] = await db
      .select({ id: attendanceSessions.id, closedAt: attendanceSessions.closedAt })
      .from(attendanceSessions)
      .where(
        and(
          eq(attendanceSessions.courseOfferingId, input.offeringId),
          eq(attendanceSessions.sessionDate, input.sessionDate),
          eq(attendanceSessions.startTime, startTime),
        ),
      )
      .limit(1)
    if (existing) {
      await requireEditableSession(db, existing.closedAt)
      sessionId = existing.id
      existingClosedAt = existing.closedAt
    }
  }

  const now = new Date().toISOString()
  const closingDraft = Boolean(input.close && !existingClosedAt)
  const closedAtPatch = closingDraft ? now : existingClosedAt

  if (!sessionId) {
    const [created] = await db
      .insert(attendanceSessions)
      .values({
        courseOfferingId: input.offeringId,
        sessionDate: input.sessionDate,
        startTime,
        endTime: input.endTime ?? null,
        topic: input.topic ?? 'Class session',
        takenBy: actor.id,
        closedAt: input.close ? now : null,
      })
      .returning({ id: attendanceSessions.id })
    sessionId = created!.id
  } else {
    await db
      .update(attendanceSessions)
      .set({
        topic: input.topic ?? undefined,
        endTime: input.endTime ?? undefined,
        takenBy: actor.id,
        ...(closingDraft ? { closedAt: now } : {}),
      })
      .where(eq(attendanceSessions.id, sessionId))
  }

  for (const record of input.records) {
    await db
      .insert(attendanceRecords)
      .values({
        attendanceSessionId: sessionId,
        studentId: record.studentId,
        status: record.status,
        note: record.note ?? null,
        recordedBy: actor.id,
      })
      .onConflictDoUpdate({
        target: [attendanceRecords.attendanceSessionId, attendanceRecords.studentId],
        set: {
          status: record.status,
          note: record.note ?? null,
          recordedBy: actor.id,
        },
      })
  }

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: closingDraft || closedAtPatch ? 'attendance.submit' : 'attendance.record',
    targetType: 'attendanceSession',
    targetId: sessionId,
  })

  return getLecturerAttendanceSession(institutionId, actor.id, sessionId)
}

export async function deleteLecturerAttendanceSession(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  sessionId: string,
): Promise<LecturerAttendanceSession[]> {
  const { db } = await requireLecturer(institutionId, actor.id)
  const [row] = await db
    .select({
      id: attendanceSessions.id,
      offeringId: attendanceSessions.courseOfferingId,
      closedAt: attendanceSessions.closedAt,
    })
    .from(attendanceSessions)
    .where(eq(attendanceSessions.id, sessionId))
    .limit(1)
  if (!row) throw notFound('That attendance session')
  await requireAssignedOffering(db, actor.id, row.offeringId)
  await requireEditableSession(db, row.closedAt)

  await db.delete(attendanceSessions).where(eq(attendanceSessions.id, sessionId))

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'attendance.delete',
    targetType: 'attendanceSession',
    targetId: sessionId,
  })

  return loadAttendanceSessions(db, [row.offeringId])
}

function resultStats(students: LecturerResultBatch['students']) {
  const marks = students
    .map((student) => student.totalScore)
    .filter((value): value is number => value !== null)
  const passed = students.filter((student) => student.grade && !['D', 'E', 'F'].includes(student.grade)).length
  return {
    avg: marks.length ? Math.round((marks.reduce((sum, value) => sum + value, 0) / marks.length) * 10) / 10 : null,
    highest: marks.length ? Math.max(...marks) : null,
    lowest: marks.length ? Math.min(...marks) : null,
    passRate: students.length ? Math.round((passed / students.length) * 100) : null,
  }
}

export async function getLecturerResults(
  institutionId: string,
  userId: string,
  offeringId: string,
): Promise<LecturerResultBatch> {
  const { db, user } = await requireLecturer(institutionId, userId)
  await requireAssignedOffering(db, user.id, offeringId)

  const [course] = await db
    .select({
      code: courses.code,
      name: courses.name,
      credits: courses.credits,
    })
    .from(courseOfferings)
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .where(eq(courseOfferings.id, offeringId))
    .limit(1)
  if (!course) throw notFound('That course')

  const roster = await enrolledRoster(db, offeringId)
  const [batch] = await db
    .select({
      id: resultBatches.id,
      status: resultBatches.status,
      rejectionReason: resultBatches.rejectionReason,
      submittedAt: resultBatches.submittedAt,
    })
    .from(resultBatches)
    .where(eq(resultBatches.courseOfferingId, offeringId))
    .limit(1)

  const resultRows = batch
    ? await db
        .select({
          studentId: results.studentId,
          totalScore: results.totalScore,
          grade: results.grade,
        })
        .from(results)
        .where(eq(results.resultBatchId, batch.id))
    : []
  const byStudent = new Map(resultRows.map((row) => [row.studentId, row]))

  const studentsForBatch = roster.map((student) => {
    const existing = byStudent.get(student.studentId)
    return {
      studentId: student.studentId,
      studentNumber: student.studentNumber,
      name: student.name,
      totalScore: asNumber(existing?.totalScore ?? null),
      grade: existing?.grade ?? null,
    }
  })

  return {
    offeringId,
    courseCode: formatCourseCode(course.code),
    courseName: course.name,
    credits: course.credits,
    status: batch?.status ?? null,
    batchId: batch?.id ?? null,
    rejectionReason: batch?.rejectionReason ?? null,
    submittedAt: batch?.submittedAt ?? null,
    students: studentsForBatch,
    ...resultStats(studentsForBatch),
  }
}

export async function saveLecturerResults(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  offeringId: string,
  input: SaveLecturerResultsRequest,
): Promise<LecturerResultBatch> {
  const { db } = await requireLecturer(institutionId, actor.id)
  await requireAssignedOffering(db, actor.id, offeringId)
  const semester = await currentSemester(institutionId)
  if (!semester) throw badRequest('There is no current semester to save results in.')

  const [course] = await db
    .select({ credits: courses.credits })
    .from(courseOfferings)
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .where(eq(courseOfferings.id, offeringId))
    .limit(1)
  if (!course) throw notFound('That course')

  const rosterIds = new Set((await enrolledRoster(db, offeringId)).map((student) => student.studentId))
  for (const entry of input.entries) {
    if (!rosterIds.has(entry.studentId)) {
      throw badRequest('One of those students is not enrolled in this course.')
    }
  }

  const [existing] = await db
    .select({
      id: resultBatches.id,
      status: resultBatches.status,
      semesterId: resultBatches.semesterId,
    })
    .from(resultBatches)
    .where(eq(resultBatches.courseOfferingId, offeringId))
    .limit(1)

  if (existing && !['Draft', 'Rejected'].includes(existing.status)) {
    throw badRequest('Results that are under review or published cannot be edited.')
  }

  let batchId = existing?.id
  if (!batchId) {
    const [created] = await db
      .insert(resultBatches)
      .values({
        courseOfferingId: offeringId,
        semesterId: semester.id,
        status: 'Draft',
      })
      .returning({ id: resultBatches.id })
    batchId = created!.id
  } else if (existing?.status === 'Rejected') {
    await db.update(resultBatches).set({ status: 'Draft', rejectionReason: null }).where(eq(resultBatches.id, batchId))
  }

  for (const entry of input.entries) {
    const scored = gradeFromScore(entry.totalScore)
    await db
      .insert(results)
      .values({
        resultBatchId: batchId,
        studentId: entry.studentId,
        courseOfferingId: offeringId,
        totalScore: entry.totalScore.toFixed(2),
        grade: scored.grade,
        gradePoint: scored.gradePoint,
        creditsEarned: scored.isPassed ? course.credits : 0,
        isPassed: scored.isPassed,
      })
      .onConflictDoUpdate({
        target: [results.studentId, results.courseOfferingId],
        set: {
          resultBatchId: batchId,
          totalScore: entry.totalScore.toFixed(2),
          grade: scored.grade,
          gradePoint: scored.gradePoint,
          creditsEarned: scored.isPassed ? course.credits : 0,
          isPassed: scored.isPassed,
        },
      })
  }

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'grades.write',
    targetType: 'resultBatch',
    targetId: batchId,
  })

  return getLecturerResults(institutionId, actor.id, offeringId)
}

export async function submitLecturerResults(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  offeringId: string,
): Promise<LecturerResultBatch> {
  const { db } = await requireLecturer(institutionId, actor.id)
  await requireAssignedOffering(db, actor.id, offeringId)

  const current = await getLecturerResults(institutionId, actor.id, offeringId)
  if (!current.batchId) throw badRequest('Save a draft before submitting results.')
  if (current.status && !['Draft', 'Rejected'].includes(current.status)) {
    throw badRequest('Those results have already been submitted.')
  }
  if (current.students.some((student) => student.totalScore === null)) {
    throw badRequest('Enter a mark for every enrolled student before submitting.')
  }

  const now = new Date().toISOString()
  await db
    .update(resultBatches)
    .set({
      status: 'PendingReview',
      submittedBy: actor.id,
      submittedAt: now,
      rejectionReason: null,
    })
    .where(eq(resultBatches.id, current.batchId))

  await notifyAcademicAdminsOfResultSubmit(db, current.courseCode, current.courseName, actor.email)

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'results.submit',
    targetType: 'resultBatch',
    targetId: current.batchId,
  })

  return getLecturerResults(institutionId, actor.id, offeringId)
}

function assessmentStatus(
  row: { isPublished: boolean; dueAt: string | null },
  submitted: number,
  total: number,
  graded: number,
): LecturerAssessmentRow['status'] {
  if (!row.isPublished) return 'Draft'
  if (total > 0 && graded >= total) return 'Graded'
  if (row.dueAt && new Date(row.dueAt).getTime() < Date.now()) return 'Closed'
  if (submitted > 0) return 'Active'
  return 'Active'
}

export async function listLecturerAssessments(
  institutionId: string,
  userId: string,
  offeringId?: string,
): Promise<LecturerAssessmentRow[]> {
  const { db, user } = await requireLecturer(institutionId, userId)
  const semester = await currentSemester(institutionId)
  const assigned = await assignedOfferingIds(db, user.id, semester?.id)
  if (offeringId && !assigned.includes(offeringId)) throw forbidden('You are not assigned to that course.')
  const ids = offeringId ? [offeringId] : assigned
  if (ids.length === 0) return []

  const rows = await db
    .select({
      id: assessments.id,
      offeringId: assessments.courseOfferingId,
      courseCode: courses.code,
      title: assessments.title,
      description: assessments.description,
      type: assessments.type,
      weight: assessments.weight,
      totalMarks: assessments.totalMarks,
      dueAt: assessments.dueAt,
      isPublished: assessments.isPublished,
      acceptsSubmissions: assessments.acceptsSubmissions,
    })
    .from(assessments)
    .innerJoin(courseOfferings, eq(courseOfferings.id, assessments.courseOfferingId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .where(inArray(assessments.courseOfferingId, ids))
    .orderBy(desc(assessments.createdAt))

  const itemCounts = new Map<string, number>()
  if (rows.length > 0) {
    const counts = await db
      .select({
        assessmentId: assessmentItems.assessmentId,
        total: sql<number>`coalesce(sum(coalesce(${assessmentItems.drawCount}, 1)), 0)`,
      })
      .from(assessmentItems)
      .where(inArray(assessmentItems.assessmentId, rows.map((row) => row.id)))
      .groupBy(assessmentItems.assessmentId)
    for (const row of counts) itemCounts.set(row.assessmentId, Number(row.total))
  }

  const output: LecturerAssessmentRow[] = []
  for (const row of rows) {
    const roster = await enrolledRoster(db, row.offeringId)
    const submissionRows = await db
      .select({ status: submissions.status, studentId: submissions.studentId })
      .from(submissions)
      .where(eq(submissions.assessmentId, row.id))
    const gradeRows = await db
      .select({ studentId: grades.studentId })
      .from(grades)
      .where(eq(grades.assessmentId, row.id))
    const submitted = new Set(
      submissionRows.filter((item) => item.status !== 'Draft').map((item) => item.studentId),
    ).size
    output.push({
      id: row.id,
      offeringId: row.offeringId,
      courseCode: formatCourseCode(row.courseCode),
      title: row.title,
      description: row.description,
      type: row.type,
      weight: asNumber(row.weight) ?? 0,
      totalMarks: asNumber(row.totalMarks) ?? 0,
      dueAt: row.dueAt,
      isPublished: row.isPublished,
      acceptsSubmissions: row.acceptsSubmissions,
      submittedCount: submitted,
      totalCount: roster.length,
      itemCount: itemCounts.get(row.id) ?? 0,
      status: assessmentStatus(row, submitted, roster.length, gradeRows.length),
    })
  }
  return output
}

export async function createLecturerAssessment(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  input: CreateLecturerAssessmentRequest,
): Promise<LecturerAssessmentRow> {
  const { db } = await requireLecturer(institutionId, actor.id)
  await requireAssignedOffering(db, actor.id, input.offeringId)

  const dueAt = input.dueAt ? `${input.dueAt}T17:00:00.000Z` : null
  const [created] = await db
    .insert(assessments)
    .values({
      courseOfferingId: input.offeringId,
      title: input.title,
      description: input.description ?? null,
      type: input.type,
      weight: input.weight.toFixed(2),
      totalMarks: input.totalMarks.toFixed(2),
      dueAt,
      acceptsSubmissions: input.acceptsSubmissions ?? true,
      isPublished: input.publish ?? true,
      createdBy: actor.id,
    })
    .returning({ id: assessments.id })

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'materials.write',
    targetType: 'assessment',
    targetId: created!.id,
  })

  if (input.publish ?? true) {
    await notifyEnrolledStudentsOfAssessment(db, input.offeringId, input.title)
  }

  const list = await listLecturerAssessments(institutionId, actor.id, input.offeringId)
  const row = list.find((item) => item.id === created!.id)
  if (!row) throw notFound('That assignment')
  return row
}

export async function deleteLecturerAssessment(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  assessmentId: string,
): Promise<void> {
  const { db } = await requireLecturer(institutionId, actor.id)
  const [row] = await db
    .select({ offeringId: assessments.courseOfferingId, title: assessments.title })
    .from(assessments)
    .where(eq(assessments.id, assessmentId))
    .limit(1)
  if (!row) throw notFound('That assessment')
  await requireAssignedOffering(db, actor.id, row.offeringId)

  const [sat] = await db
    .select({ id: submissions.id })
    .from(submissions)
    .where(and(eq(submissions.assessmentId, assessmentId), ne(submissions.status, 'Draft')))
    .limit(1)
  if (sat) {
    throw conflict('Students have already handed this in, so it cannot be deleted.')
  }

  const [marked] = await db
    .select({ id: grades.id })
    .from(grades)
    .where(eq(grades.assessmentId, assessmentId))
    .limit(1)
  if (marked) {
    throw conflict('This assessment already has marks, so it cannot be deleted.')
  }

  await db.delete(assessments).where(eq(assessments.id, assessmentId))
  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'assessments.delete',
    targetType: 'assessment',
    targetId: assessmentId,
    metadata: { title: row.title, offeringId: row.offeringId },
  })
}

export async function getLecturerAssessment(
  institutionId: string,
  userId: string,
  assessmentId: string,
): Promise<LecturerAssessmentDetail> {
  const { db, user } = await requireLecturer(institutionId, userId)
  const [row] = await db
    .select({ offeringId: assessments.courseOfferingId })
    .from(assessments)
    .where(eq(assessments.id, assessmentId))
    .limit(1)
  if (!row) throw notFound('That assignment')
  await requireAssignedOffering(db, user.id, row.offeringId)

  const list = await listLecturerAssessments(institutionId, userId, row.offeringId)
  const summary = list.find((item) => item.id === assessmentId)
  if (!summary) throw notFound('That assignment')

  const roster = await enrolledRoster(db, row.offeringId)
  const submissionRows = await db
    .select({
      studentId: submissions.studentId,
      status: submissions.status,
      submittedAt: submissions.submittedAt,
      isLate: submissions.isLate,
      textResponse: submissions.textResponse,
    })
    .from(submissions)
    .where(eq(submissions.assessmentId, assessmentId))
  const gradeRows = await db
    .select({
      studentId: grades.studentId,
      score: grades.score,
      feedback: grades.feedback,
      componentScores: grades.componentScores,
    })
    .from(grades)
    .where(eq(grades.assessmentId, assessmentId))
  const componentRows = await db
    .select({
      id: assessmentComponents.id,
      name: assessmentComponents.name,
      maxScore: assessmentComponents.maxScore,
      sequence: assessmentComponents.sequence,
    })
    .from(assessmentComponents)
    .where(eq(assessmentComponents.assessmentId, assessmentId))
    .orderBy(asc(assessmentComponents.sequence))

  const submissionByStudent = new Map(submissionRows.map((item) => [item.studentId, item]))
  const gradeByStudent = new Map(gradeRows.map((item) => [item.studentId, item]))

  return {
    ...summary,
    components: componentRows.map((item) => ({
      id: item.id,
      name: item.name,
      maxScore: asNumber(item.maxScore) ?? 0,
      sequence: item.sequence,
    })),
    submissions: roster.map((student) => {
      const submission = submissionByStudent.get(student.studentId)
      const grade = gradeByStudent.get(student.studentId)
      let status: LecturerAssessmentDetail['submissions'][number]['status'] = 'Not submitted'
      if (grade?.score != null) status = 'Graded'
      else if (submission?.isLate || submission?.status === 'Late') status = 'Late'
      else if (submission && submission.status !== 'Draft') status = 'Submitted'
      return {
        studentId: student.studentId,
        studentNumber: student.studentNumber,
        studentName: student.name,
        status,
        submittedAt: submission?.submittedAt ?? null,
        isLate: submission?.isLate ?? false,
        textResponse: submission?.textResponse ?? null,
        score: asNumber(grade?.score ?? null),
        componentScores: grade?.componentScores ?? null,
        feedback: grade?.feedback ?? null,
      }
    }),
  }
}

export async function saveLecturerGrade(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  assessmentId: string,
  input: SaveLecturerGradeRequest,
): Promise<LecturerAssessmentDetail> {
  const { db } = await requireLecturer(institutionId, actor.id)
  const [assessment] = await db
    .select({
      offeringId: assessments.courseOfferingId,
      totalMarks: assessments.totalMarks,
    })
    .from(assessments)
    .where(eq(assessments.id, assessmentId))
    .limit(1)
  if (!assessment) throw notFound('That assignment')
  await requireAssignedOffering(db, actor.id, assessment.offeringId)

  const max = asNumber(assessment.totalMarks) ?? 0
  const components = await db
    .select({
      id: assessmentComponents.id,
      name: assessmentComponents.name,
      maxScore: assessmentComponents.maxScore,
    })
    .from(assessmentComponents)
    .where(eq(assessmentComponents.assessmentId, assessmentId))
    .orderBy(asc(assessmentComponents.sequence))

  let score = input.score
  let componentScores = input.componentScores ?? null
  if (components.length > 0 && input.componentScores) {
    let total = 0
    for (const component of components) {
      const part = input.componentScores[component.id] ?? input.componentScores[component.name] ?? 0
      const cap = asNumber(component.maxScore) ?? 0
      if (part > cap) throw badRequest(`Marks for ${component.name} cannot exceed ${cap}.`)
      total += part
    }
    score = total
    componentScores = Object.fromEntries(
      components.map((component) => [
        component.id,
        input.componentScores?.[component.id] ?? input.componentScores?.[component.name] ?? 0,
      ]),
    )
  }
  if (score == null) throw badRequest('Enter a mark.')
  if (score > max) throw badRequest(`Marks cannot exceed ${max}.`)

  const roster = await enrolledRoster(db, assessment.offeringId)
  if (!roster.some((student) => student.studentId === input.studentId)) {
    throw badRequest('That student is not enrolled in this course.')
  }

  await db
    .insert(grades)
    .values({
      assessmentId,
      studentId: input.studentId,
      score: score.toFixed(2),
      componentScores,
      feedback: input.feedback ?? null,
      gradedBy: actor.id,
      gradedAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: [grades.assessmentId, grades.studentId],
      set: {
        score: score.toFixed(2),
        componentScores,
        feedback: input.feedback ?? null,
        gradedBy: actor.id,
        gradedAt: new Date().toISOString(),
      },
    })

  await syncDraftResultFromGrades(db, institutionId, assessment.offeringId, input.studentId)

  return getLecturerAssessment(institutionId, actor.id, assessmentId)
}

export async function syncDraftResultFromGrades(
  db: InstitutionDb,
  institutionId: string,
  offeringId: string,
  studentId: string,
): Promise<void> {
  const [batch] = await db
    .select({
      id: resultBatches.id,
      status: resultBatches.status,
    })
    .from(resultBatches)
    .where(eq(resultBatches.courseOfferingId, offeringId))
    .limit(1)
  if (batch && !['Draft', 'Rejected'].includes(batch.status)) return

  const semester = await currentSemester(institutionId)
  if (!semester) return

  const [course] = await db
    .select({ credits: courses.credits })
    .from(courseOfferings)
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .where(eq(courseOfferings.id, offeringId))
    .limit(1)
  if (!course) return

  const assessmentRows = await db
    .select({
      id: assessments.id,
      weight: assessments.weight,
      totalMarks: assessments.totalMarks,
    })
    .from(assessments)
    .where(eq(assessments.courseOfferingId, offeringId))
  if (assessmentRows.length === 0) return

  const gradeRows = await db
    .select({
      assessmentId: grades.assessmentId,
      score: grades.score,
    })
    .from(grades)
    .where(and(eq(grades.studentId, studentId), inArray(grades.assessmentId, assessmentRows.map((row) => row.id))))
  const scoreByAssessment = new Map(gradeRows.map((row) => [row.assessmentId, asNumber(row.score)]))

  let earned = 0
  let weightSum = 0
  for (const item of assessmentRows) {
    const score = scoreByAssessment.get(item.id)
    const total = asNumber(item.totalMarks) ?? 0
    const weight = asNumber(item.weight) ?? 0
    if (score == null || total <= 0 || weight <= 0) continue
    earned += (score / total) * weight
    weightSum += weight
  }
  if (weightSum <= 0) return

  const totalScore = (earned / weightSum) * 100
  const scored = gradeFromScore(totalScore)

  let batchId = batch?.id
  if (!batchId) {
    const [created] = await db
      .insert(resultBatches)
      .values({
        courseOfferingId: offeringId,
        semesterId: semester.id,
        status: 'Draft',
      })
      .returning({ id: resultBatches.id })
    batchId = created!.id
  } else if (batch?.status === 'Rejected') {
    await db.update(resultBatches).set({ status: 'Draft', rejectionReason: null }).where(eq(resultBatches.id, batchId))
  }

  await db
    .insert(results)
    .values({
      resultBatchId: batchId,
      studentId,
      courseOfferingId: offeringId,
      totalScore: totalScore.toFixed(2),
      grade: scored.grade,
      gradePoint: scored.gradePoint,
      creditsEarned: scored.isPassed ? course.credits : 0,
      isPassed: scored.isPassed,
    })
    .onConflictDoUpdate({
      target: [results.studentId, results.courseOfferingId],
      set: {
        resultBatchId: batchId,
        totalScore: totalScore.toFixed(2),
        grade: scored.grade,
        gradePoint: scored.gradePoint,
        creditsEarned: scored.isPassed ? course.credits : 0,
        isPassed: scored.isPassed,
      },
    })
}

export async function listLecturerAtRiskStudents(
  institutionId: string,
  userId: string,
): Promise<LecturerAtRiskStudent[]> {
  const { db, user } = await requireLecturer(institutionId, userId)
  const semester = await currentSemester(institutionId)
  const offeringIds = await assignedOfferingIds(db, user.id, semester?.id)
  if (offeringIds.length === 0) return []

  const registrations = await db
    .select({
      studentId: courseRegistrations.studentId,
      offeringId: courseRegistrations.courseOfferingId,
      courseCode: courses.code,
    })
    .from(courseRegistrations)
    .innerJoin(courseOfferings, eq(courseOfferings.id, courseRegistrations.courseOfferingId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .where(
      and(inArray(courseRegistrations.courseOfferingId, offeringIds), eq(courseRegistrations.status, 'Approved')),
    )

  const courseByStudent = new Map<string, { offeringId: string; courseCode: string }>()
  for (const row of registrations) {
    if (!courseByStudent.has(row.studentId)) {
      courseByStudent.set(row.studentId, {
        offeringId: row.offeringId,
        courseCode: formatCourseCode(row.courseCode),
      })
    }
  }

  const institutionRisk = await listAcademicAtRiskStudents(institutionId)
  return institutionRisk
    .filter((student) => courseByStudent.has(student.id))
    .map((student) => {
      const course = courseByStudent.get(student.id)
      return {
        ...student,
        offeringId: course?.offeringId ?? null,
        courseCode: course?.courseCode ?? null,
      }
    })
}

export async function resolveLecturerAtRisk(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  studentId: string,
  input: ResolveLecturerAtRiskRequest,
): Promise<LecturerAtRiskStudent[]> {
  const { db } = await requireLecturer(institutionId, actor.id)
  const flagged = await listLecturerAtRiskStudents(institutionId, actor.id)
  const match = flagged.find((student) => student.id === studentId)
  if (!match) throw forbidden('That student is not in your assigned courses.')

  const semester = await currentSemester(institutionId)
  const [score] = semester
    ? await db
        .select({ id: riskScores.id })
        .from(riskScores)
        .where(and(eq(riskScores.studentId, studentId), eq(riskScores.semesterId, semester.id)))
        .orderBy(desc(riskScores.computedAt))
        .limit(1)
    : []

  await db.insert(riskInterventions).values({
    studentId,
    riskScoreId: score?.id ?? null,
    interventionType: 'LecturerFollowUp',
    notes: input.notes,
    performedBy: actor.id,
    performedAt: new Date().toISOString(),
    outcome: 'Resolved',
  })

  return listLecturerAtRiskStudents(institutionId, actor.id)
}

export async function listLecturerNotifications(
  institutionId: string,
  userId: string,
): Promise<LecturerNotification[]> {
  await requireLecturer(institutionId, userId)
  return listAcademicNotifications(institutionId, userId)
}

export async function markLecturerNotificationRead(
  institutionId: string,
  userId: string,
  id: string,
): Promise<LecturerNotification[]> {
  await requireLecturer(institutionId, userId)
  const db = await getInstitutionDb(institutionId)
  const [updated] = await db
    .update(notifications)
    .set({ readAt: new Date().toISOString() })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
    .returning({ id: notifications.id })
  if (!updated) throw notFound('That notification')
  return listLecturerNotifications(institutionId, userId)
}

export async function markAllLecturerNotificationsRead(
  institutionId: string,
  userId: string,
): Promise<LecturerNotification[]> {
  await requireLecturer(institutionId, userId)
  const db = await getInstitutionDb(institutionId)
  await db
    .update(notifications)
    .set({ readAt: new Date().toISOString() })
    .where(eq(notifications.userId, userId))
  return listLecturerNotifications(institutionId, userId)
}

function assertValidSlotTimes(startTime: string, endTime: string): void {
  if (startTime >= endTime) throw badRequest('End time must be after start time.')
}

async function loadLecturerTimetableSlotRows(
  db: InstitutionDb,
  offeringIds: string[],
): Promise<Array<{
  id: string
  offeringId: string
  courseCode: string
  courseName: string
  sessionType: string
  startTime: string
  endTime: string
  room: string | null
  dayOfWeek: number
}>> {
  if (offeringIds.length === 0) return []
  return db
    .select({
      id: timetableSlots.id,
      offeringId: timetableSlots.courseOfferingId,
      courseCode: courses.code,
      courseName: courses.name,
      sessionType: timetableSlots.sessionType,
      startTime: timetableSlots.startTime,
      endTime: timetableSlots.endTime,
      room: rooms.name,
      dayOfWeek: timetableSlots.dayOfWeek,
    })
    .from(timetableSlots)
    .innerJoin(courseOfferings, eq(courseOfferings.id, timetableSlots.courseOfferingId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .leftJoin(rooms, eq(rooms.id, timetableSlots.roomId))
    .where(inArray(timetableSlots.courseOfferingId, offeringIds))
    .orderBy(timetableSlots.dayOfWeek, timetableSlots.startTime)
}

function mapLecturerTimetableSlot(row: {
  id: string
  offeringId: string
  courseCode: string
  courseName: string
  sessionType: string
  startTime: string
  endTime: string
  room: string | null
  dayOfWeek: number
}): LecturerTimetableSlot {
  return {
    id: row.id,
    offeringId: row.offeringId,
    courseCode: formatCourseCode(row.courseCode),
    courseName: row.courseName,
    sessionType: row.sessionType,
    startTime: formatClock(row.startTime),
    endTime: formatClock(row.endTime),
    room: row.room,
    dayOfWeek: row.dayOfWeek,
    color: courseColor(row.courseCode),
  }
}

async function requireOwnedTimetableSlot(
  db: InstitutionDb,
  lecturerId: string,
  slotId: string,
): Promise<{ slotId: string; offeringId: string }> {
  const [row] = await db
    .select({
      slotId: timetableSlots.id,
      offeringId: timetableSlots.courseOfferingId,
    })
    .from(timetableSlots)
    .innerJoin(lecturerAssignments, eq(lecturerAssignments.courseOfferingId, timetableSlots.courseOfferingId))
    .where(and(eq(timetableSlots.id, slotId), eq(lecturerAssignments.lecturerId, lecturerId)))
    .limit(1)
  if (!row) throw forbidden('You are not assigned to that timetable slot.')
  return row
}

export async function listLecturerTimetableSlots(
  institutionId: string,
  userId: string,
): Promise<LecturerTimetableSlot[]> {
  const { db } = await requireLecturer(institutionId, userId)
  const semester = await currentSemester(institutionId)
  const offeringIds = await assignedOfferingIds(db, userId, semester?.id)
  const rows = await loadLecturerTimetableSlotRows(db, offeringIds)
  return rows.map(mapLecturerTimetableSlot)
}

export async function listLecturerRooms(
  institutionId: string,
  userId: string,
): Promise<LecturerRoomOption[]> {
  const { db } = await requireLecturer(institutionId, userId)
  const rows = await db
    .select({
      id: rooms.id,
      code: rooms.code,
      name: rooms.name,
      building: rooms.building,
    })
    .from(rooms)
    .where(eq(rooms.isActive, true))
    .orderBy(rooms.name)
  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    building: row.building,
  }))
}

export async function createLecturerTimetableSlot(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  input: SaveLecturerTimetableSlotRequest,
): Promise<LecturerTimetableSlot> {
  const { db } = await requireLecturer(institutionId, actor.id)
  await requireAssignedOffering(db, actor.id, input.offeringId)
  assertValidSlotTimes(input.startTime, input.endTime)

  if (input.roomId) {
    const [room] = await db.select({ id: rooms.id }).from(rooms).where(eq(rooms.id, input.roomId)).limit(1)
    if (!room) throw badRequest('Room not found.')
  }

  await assertTimetableSlotFree(db, {
    offeringId: input.offeringId,
    dayOfWeek: input.dayOfWeek,
    startTime: input.startTime,
    endTime: input.endTime,
    roomId: input.roomId ?? null,
  })

  const [created] = await db
    .insert(timetableSlots)
    .values({
      courseOfferingId: input.offeringId,
      roomId: input.roomId ?? null,
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
      sessionType: input.sessionType,
    })
    .returning({ id: timetableSlots.id })

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'timetable.slot.create',
    targetType: 'timetable_slot',
    targetId: created!.id,
  })

  const rows = await loadLecturerTimetableSlotRows(db, [input.offeringId])
  const slot = rows.find((row) => row.id === created!.id)
  if (!slot) throw notFound('Timetable slot not found.')
  return mapLecturerTimetableSlot(slot)
}

export async function updateLecturerTimetableSlot(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  slotId: string,
  input: UpdateLecturerTimetableSlotRequest,
): Promise<LecturerTimetableSlot> {
  const { db } = await requireLecturer(institutionId, actor.id)
  const owned = await requireOwnedTimetableSlot(db, actor.id, slotId)

  const [existing] = await db
    .select({
      startTime: timetableSlots.startTime,
      endTime: timetableSlots.endTime,
      dayOfWeek: timetableSlots.dayOfWeek,
      roomId: timetableSlots.roomId,
    })
    .from(timetableSlots)
    .where(eq(timetableSlots.id, slotId))
    .limit(1)
  if (!existing) throw notFound('Timetable slot not found.')

  const startTime = input.startTime ?? existing.startTime.slice(0, 5)
  const endTime = input.endTime ?? existing.endTime.slice(0, 5)
  assertValidSlotTimes(startTime, endTime)

  if (input.roomId) {
    const [room] = await db.select({ id: rooms.id }).from(rooms).where(eq(rooms.id, input.roomId)).limit(1)
    if (!room) throw badRequest('Room not found.')
  }

  await assertTimetableSlotFree(db, {
    offeringId: owned.offeringId,
    dayOfWeek: input.dayOfWeek ?? existing.dayOfWeek,
    startTime,
    endTime,
    roomId: input.roomId !== undefined ? input.roomId : existing.roomId,
    exceptSlotId: slotId,
  })

  const patch: {
    dayOfWeek?: number
    startTime?: string
    endTime?: string
    sessionType?: string
    roomId?: string | null
    updatedAt: string
  } = { updatedAt: new Date().toISOString() }
  if (input.dayOfWeek !== undefined) patch.dayOfWeek = input.dayOfWeek
  if (input.startTime !== undefined) patch.startTime = input.startTime
  if (input.endTime !== undefined) patch.endTime = input.endTime
  if (input.sessionType !== undefined) patch.sessionType = input.sessionType
  if (input.roomId !== undefined) patch.roomId = input.roomId

  await db.update(timetableSlots).set(patch).where(eq(timetableSlots.id, slotId))

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'timetable.slot.update',
    targetType: 'timetable_slot',
    targetId: slotId,
  })

  const rows = await loadLecturerTimetableSlotRows(db, [owned.offeringId])
  const slot = rows.find((row) => row.id === slotId)
  if (!slot) throw notFound('Timetable slot not found.')
  return mapLecturerTimetableSlot(slot)
}

export async function deleteLecturerTimetableSlot(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  slotId: string,
): Promise<LecturerTimetableSlot[]> {
  const { db } = await requireLecturer(institutionId, actor.id)
  await requireOwnedTimetableSlot(db, actor.id, slotId)

  await db.delete(timetableSlots).where(eq(timetableSlots.id, slotId))

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'timetable.slot.delete',
    targetType: 'timetable_slot',
    targetId: slotId,
  })

  return listLecturerTimetableSlots(institutionId, actor.id)
}

export { formatDisplayDate, relativeTime, initials }
