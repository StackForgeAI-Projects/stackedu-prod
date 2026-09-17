import { and, count, eq, inArray, sql } from 'drizzle-orm'
import type { CourseAnalytics, StudentEngagementRow } from '@stackedu/shared'
import { getInstitutionDb } from '../db/connection'
import { courses } from '../db/institution/schema/academic'
import { assessments, grades } from '../db/institution/schema/assessment'
import { riskScores } from '../db/institution/schema/ai'
import { studentFeeAccounts } from '../db/institution/schema/finance'
import { users } from '../db/institution/schema/people'
import { students } from '../db/institution/schema/students'
import {
  attendanceRecords,
  attendanceSessions,
  courseMaterialViews,
  courseMaterials,
  courseOfferings,
  courseRegistrations,
} from '../db/institution/schema/teaching'
import { requireAssignedOffering, requireLecturer } from './lecturer'
import { notFound } from '../lib/errors'

const SCORE_BUCKETS = [
  { label: '0-39', min: 0, max: 39 },
  { label: '40-49', min: 40, max: 49 },
  { label: '50-59', min: 50, max: 59 },
  { label: '60-69', min: 60, max: 69 },
  { label: '70-79', min: 70, max: 79 },
  { label: '80-100', min: 80, max: 100 },
] as const

function asNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export async function getLecturerCourseAnalytics(
  institutionId: string,
  userId: string,
  offeringId: string,
): Promise<CourseAnalytics> {
  const { db } = await requireLecturer(institutionId, userId)
  await requireAssignedOffering(db, userId, offeringId)
  return loadCourseAnalytics(db, offeringId)
}

export async function getAcademicStudentEngagement(
  institutionId: string,
  studentId: string,
): Promise<StudentEngagementRow[]> {
  const db = await getInstitutionDb(institutionId)
  const [exists] = await db.select({ id: students.id }).from(students).where(eq(students.id, studentId)).limit(1)
  if (!exists) throw notFound('That student')
  const offerings = await db
    .select({
      offeringId: courseOfferings.id,
      courseCode: courses.code,
      courseName: courses.name,
    })
    .from(courseRegistrations)
    .innerJoin(courseOfferings, eq(courseOfferings.id, courseRegistrations.courseOfferingId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .where(and(eq(courseRegistrations.studentId, studentId), eq(courseRegistrations.status, 'Approved')))

  const rows: StudentEngagementRow[] = []
  for (const offering of offerings) {
    const analytics = await loadCourseAnalytics(db, offering.offeringId)
    const student = analytics.students.find((item) => item.studentId === studentId)
    rows.push({
      offeringId: offering.offeringId,
      courseCode: offering.courseCode,
      courseName: offering.courseName,
      attendanceRate: student?.attendanceRate ?? null,
      engagementRate: student?.engagementRate ?? null,
      averageScore: student?.averageScore ?? null,
      feeBalance: student?.feeBalance ?? 0,
      riskLevel: student?.riskLevel ?? null,
    })
  }
  return rows
}

async function loadCourseAnalytics(
  db: Awaited<ReturnType<typeof getInstitutionDb>>,
  offeringId: string,
): Promise<CourseAnalytics> {
  const [course] = await db
    .select({
      offeringId: courseOfferings.id,
      courseCode: courses.code,
      courseName: courses.name,
    })
    .from(courseOfferings)
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .where(eq(courseOfferings.id, offeringId))
    .limit(1)
  if (!course) throw notFound('That course')

  const roster = await db
    .select({
      studentId: students.id,
      studentNumber: students.studentNumber,
      name: users.fullName,
    })
    .from(courseRegistrations)
    .innerJoin(students, eq(students.id, courseRegistrations.studentId))
    .innerJoin(users, eq(users.id, students.userId))
    .where(and(eq(courseRegistrations.courseOfferingId, offeringId), eq(courseRegistrations.status, 'Approved')))

  const studentIds = roster.map((row) => row.studentId)
  const [materialTotal] = await db
    .select({ n: count() })
    .from(courseMaterials)
    .where(and(eq(courseMaterials.courseOfferingId, offeringId), eq(courseMaterials.isPublished, true)))
  const materialsTotal = Number(materialTotal?.n ?? 0)

  const views = studentIds.length
    ? await db
        .select({ studentId: courseMaterialViews.studentId, n: count() })
        .from(courseMaterialViews)
        .innerJoin(courseMaterials, eq(courseMaterials.id, courseMaterialViews.materialId))
        .where(and(eq(courseMaterials.courseOfferingId, offeringId), inArray(courseMaterialViews.studentId, studentIds)))
        .groupBy(courseMaterialViews.studentId)
    : []
  const viewsBy = new Map(views.map((row) => [row.studentId, Number(row.n)]))

  const attendance = studentIds.length
    ? await db
        .select({
          studentId: attendanceRecords.studentId,
          present: sql<number>`count(*) filter (where ${attendanceRecords.status} in ('Present', 'Late'))::int`,
          total: count(),
        })
        .from(attendanceRecords)
        .innerJoin(attendanceSessions, eq(attendanceSessions.id, attendanceRecords.attendanceSessionId))
        .where(and(eq(attendanceSessions.courseOfferingId, offeringId), inArray(attendanceRecords.studentId, studentIds)))
        .groupBy(attendanceRecords.studentId)
    : []
  const attendanceBy = new Map(
    attendance.map((row) => [
      row.studentId,
      Number(row.total) === 0 ? null : Math.round((Number(row.present) / Number(row.total)) * 100),
    ]),
  )

  const scoreRows = studentIds.length
    ? await db
        .select({
          studentId: grades.studentId,
          assessmentId: grades.assessmentId,
          score: grades.score,
        })
        .from(grades)
        .innerJoin(assessments, eq(assessments.id, grades.assessmentId))
        .where(and(eq(assessments.courseOfferingId, offeringId), inArray(grades.studentId, studentIds)))
    : []
  const scoresByStudent = new Map<string, number[]>()
  for (const row of scoreRows) {
    const score = asNumber(row.score)
    if (score === null) continue
    const list = scoresByStudent.get(row.studentId) ?? []
    list.push(score)
    scoresByStudent.set(row.studentId, list)
  }

  const fees = studentIds.length
    ? await db
        .select({ studentId: studentFeeAccounts.studentId, balance: studentFeeAccounts.balance })
        .from(studentFeeAccounts)
        .where(inArray(studentFeeAccounts.studentId, studentIds))
    : []
  const feeBy = new Map(fees.map((row) => [row.studentId, asNumber(row.balance) ?? 0]))

  const risks = studentIds.length
    ? await db
        .select({ studentId: riskScores.studentId, level: riskScores.level })
        .from(riskScores)
        .where(inArray(riskScores.studentId, studentIds))
    : []
  const riskBy = new Map(risks.map((row) => [row.studentId, row.level]))

  const studentsOut = roster.map((row) => {
    const opened = viewsBy.get(row.studentId) ?? 0
    const scores = scoresByStudent.get(row.studentId) ?? []
    const averageScore = scores.length ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length) : null
    return {
      studentId: row.studentId,
      studentNumber: row.studentNumber,
      name: row.name,
      attendanceRate: attendanceBy.get(row.studentId) ?? null,
      materialsOpened: opened,
      materialsTotal,
      engagementRate: materialsTotal === 0 ? null : Math.round((opened / materialsTotal) * 100),
      averageScore,
      feeBalance: feeBy.get(row.studentId) ?? 0,
      riskLevel: riskBy.get(row.studentId) ?? null,
    }
  })

  const paperRows = await db
    .select({
      id: assessments.id,
      title: assessments.title,
      type: assessments.type,
      dueAt: assessments.dueAt,
    })
    .from(assessments)
    .where(eq(assessments.courseOfferingId, offeringId))
    .orderBy(assessments.dueAt, assessments.createdAt)

  const assessmentsOut = paperRows.map((paper) => {
    const paperScores = scoreRows
      .filter((row) => row.assessmentId === paper.id)
      .map((row) => asNumber(row.score))
      .filter((value): value is number => value !== null)
    const distribution = SCORE_BUCKETS.map((bucket) => ({
      label: bucket.label,
      count: paperScores.filter((score) => score >= bucket.min && score <= bucket.max).length,
    }))
    return {
      id: paper.id,
      title: paper.title,
      type: paper.type,
      dueAt: paper.dueAt,
      averageScore: paperScores.length
        ? Math.round(paperScores.reduce((sum, value) => sum + value, 0) / paperScores.length)
        : null,
      highScore: paperScores.length ? Math.max(...paperScores) : null,
      lowScore: paperScores.length ? Math.min(...paperScores) : null,
      gradedCount: paperScores.length,
      distribution,
    }
  })

  const attendanceValues = studentsOut.map((row) => row.attendanceRate).filter((value): value is number => value !== null)
  const engagementValues = studentsOut.map((row) => row.engagementRate).filter((value): value is number => value !== null)
  const scoreValues = studentsOut.map((row) => row.averageScore).filter((value): value is number => value !== null)

  return {
    offeringId: course.offeringId,
    courseCode: course.courseCode,
    courseName: course.courseName,
    enrolled: studentsOut.length,
    averageAttendance: attendanceValues.length
      ? Math.round(attendanceValues.reduce((sum, value) => sum + value, 0) / attendanceValues.length)
      : null,
    averageEngagement: engagementValues.length
      ? Math.round(engagementValues.reduce((sum, value) => sum + value, 0) / engagementValues.length)
      : null,
    averageScore: scoreValues.length
      ? Math.round(scoreValues.reduce((sum, value) => sum + value, 0) / scoreValues.length)
      : null,
    atRiskCount: studentsOut.filter((row) => row.riskLevel === 'High' || row.riskLevel === 'Critical').length,
    students: studentsOut,
    assessments: assessmentsOut,
  }
}
