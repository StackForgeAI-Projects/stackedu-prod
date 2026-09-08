import { z } from 'zod'
import {
  academicStandingSchema,
  applicationStatusSchema,
  enrolmentStatusSchema,
  gradeSchema,
  riskLevelSchema,
  userRoleSchema,
} from '../enums'
import { isoDateSchema, isoDateTimeSchema, uuidSchema } from '../primitives'

export const academicProfileSchema = z.object({
  userId: uuidSchema,
  fullName: z.string(),
  firstName: z.string(),
  email: z.string(),
  role: userRoleSchema,
  institutionName: z.string(),
  institutionShortName: z.string(),
  unreadCount: z.number().int().nonnegative(),
})

export const academicDashboardStatSchema = z.object({
  totalEnrolled: z.number().int().nonnegative(),
  pendingApplications: z.number().int().nonnegative(),
  resultsPendingApproval: z.number().int().nonnegative(),
  atRiskStudents: z.number().int().nonnegative(),
})

export const academicDashboardApplicationSchema = z.object({
  id: uuidSchema,
  reference: z.string(),
  fullName: z.string(),
  programmeName: z.string(),
  status: applicationStatusSchema,
  submittedAt: isoDateTimeSchema.nullable(),
})

export const academicDashboardResultSchema = z.object({
  id: uuidSchema,
  courseCode: z.string(),
  courseName: z.string(),
  lecturerName: z.string().nullable(),
  submittedAt: isoDateTimeSchema.nullable(),
  studentCount: z.number().int().nonnegative(),
})

export const academicDashboardEventSchema = z.object({
  id: uuidSchema,
  title: z.string(),
  category: z.string(),
  startDate: isoDateSchema,
  endDate: isoDateSchema.nullable(),
})

export const academicDashboardSchema = z.object({
  profile: academicProfileSchema,
  stats: academicDashboardStatSchema,
  recentApplications: z.array(academicDashboardApplicationSchema),
  pendingResults: z.array(academicDashboardResultSchema),
  upcomingEvents: z.array(academicDashboardEventSchema),
})

export const academicStudentRowSchema = z.object({
  id: uuidSchema,
  studentNumber: z.string(),
  fullName: z.string(),
  firstName: z.string(),
  initials: z.string(),
  programmeName: z.string(),
  yearOfStudy: z.number().int(),
  enrollmentDate: isoDateSchema.nullable(),
  status: enrolmentStatusSchema,
})

export const academicStudentResultRowSchema = z.object({
  code: z.string(),
  name: z.string(),
  grade: z.string(),
  credits: z.number().int(),
})

export const academicStudentSemesterSchema = z.object({
  name: z.string(),
  gpa: z.number().nullable(),
  results: z.array(academicStudentResultRowSchema),
})

export const academicStudentTimelineSchema = z.object({
  date: z.string(),
  event: z.string(),
  type: z.string(),
  notes: z.string().optional(),
})

export const academicStudentDetailSchema = academicStudentRowSchema.extend({
  email: z.string(),
  phone: z.string().nullable(),
  dateOfBirth: isoDateSchema.nullable(),
  gender: z.string().nullable(),
  nationality: z.string().nullable(),
  address: z.string().nullable(),
  expectedGraduation: isoDateSchema.nullable(),
  cgpa: z.number().nullable(),
  standing: z.string(),
  feeBalance: z.number().int().nonnegative(),
  semesters: z.array(academicStudentSemesterSchema),
  timeline: z.array(academicStudentTimelineSchema),
})

export const academicCourseRowSchema = z.object({
  id: uuidSchema,
  code: z.string(),
  name: z.string(),
  department: z.string(),
  credits: z.number().int(),
  type: z.enum(['Compulsory', 'Elective']),
  lecturerId: uuidSchema.nullable(),
  lecturerName: z.string().nullable(),
  enrolled: z.number().int().nonnegative(),
  status: z.enum(['Active', 'Archived']),
  description: z.string().nullable(),
  prerequisites: z.array(z.string()),
  semester: z.string().nullable(),
})

export const academicProgrammeCourseSchema = z.object({
  code: z.string(),
  name: z.string(),
  type: z.enum(['Compulsory', 'Elective']),
  credits: z.number().int(),
})

export const academicProgrammeSemesterSchema = z.object({
  name: z.string(),
  courses: z.array(academicProgrammeCourseSchema),
})

export const academicProgrammeYearSchema = z.object({
  year: z.number().int(),
  semesters: z.array(academicProgrammeSemesterSchema),
})

export const academicProgrammeRowSchema = z.object({
  id: uuidSchema,
  code: z.string(),
  name: z.string(),
  department: z.string(),
  faculty: z.string(),
  duration: z.string(),
  totalCredits: z.number().int(),
  enrolled: z.number().int().nonnegative(),
  status: z.enum(['Active', 'Inactive']),
  description: z.string().nullable(),
})

export const academicProgrammeDetailSchema = academicProgrammeRowSchema.extend({
  years: z.array(academicProgrammeYearSchema),
})

export const academicCalendarEventSchema = z.object({
  id: uuidSchema,
  title: z.string(),
  type: z.string(),
  startDate: isoDateSchema,
  endDate: isoDateSchema.nullable(),
  description: z.string().nullable(),
  affectsAll: z.boolean(),
})

export const academicTimetableSlotSchema = z.object({
  id: uuidSchema,
  day: z.number().int().min(1).max(7),
  hour: z.number().int(),
  courseCode: z.string(),
  courseName: z.string(),
  lecturer: z.string().nullable(),
  room: z.string().nullable(),
  type: z.string(),
  dept: z.string(),
  color: z.string(),
})

export const academicLecturerCourseSchema = z.object({
  code: z.string(),
  name: z.string(),
  enrolled: z.number().int().nonnegative(),
  semester: z.string(),
})

export const academicLecturerRowSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  initials: z.string(),
  department: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  status: z.enum(['Active', 'On Leave', 'Inactive']),
  assignedCourses: z.array(academicLecturerCourseSchema),
})

export const academicResultStudentRowSchema = z.object({
  studentId: z.string(),
  name: z.string(),
  marks: z.number().nullable(),
  grade: z.string().nullable(),
})

export const academicResultBatchSchema = z.object({
  id: uuidSchema,
  courseCode: z.string(),
  courseName: z.string(),
  lecturer: z.string().nullable(),
  assessment: z.string(),
  submittedDate: z.string(),
  studentCount: z.number().int().nonnegative(),
  status: z.enum(['Pending', 'Approved', 'Published']),
  avg: z.number().nullable(),
  highest: z.number().nullable(),
  lowest: z.number().nullable(),
  passRate: z.number().nullable(),
  results: z.array(academicResultStudentRowSchema),
})

/** Assigning a lecturer requires choosing a semester in the course form. */
export const LECTURER_ASSIGNMENT_REQUIRES_SEMESTER =
  'Select a semester when assigning a lecturer.'

/** Hard delete is blocked once students are enrolled. */
export const COURSE_DELETE_HAS_ENROLLMENTS =
  'This course has enrolled students. Archive it instead of deleting it.'

export const academicSemesterOptionSchema = z.object({
  id: uuidSchema,
  label: z.string(),
  isCurrent: z.boolean(),
})

export const academicYearOptionSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  isCurrent: z.boolean(),
})

export const rejectResultBatchRequestSchema = z.object({
  reason: z.string().trim().min(4).max(500),
})

export const academicAtRiskFactorSchema = z.object({
  label: z.string(),
  severity: z.enum(['error', 'warning']),
})

export const academicAtRiskStudentSchema = z.object({
  id: uuidSchema,
  studentNumber: z.string(),
  name: z.string(),
  initials: z.string(),
  programme: z.string(),
  year: z.number().int(),
  riskLevel: riskLevelSchema,
  riskFactors: z.array(academicAtRiskFactorSchema),
  gpa: z.number().nullable(),
  attendance: z.number().nullable(),
  advisor: z.string().nullable(),
  resolved: z.boolean(),
  resolvedDate: z.string().nullable(),
  resolution: z.string().nullable(),
})

export const academicNotificationSchema = z.object({
  id: uuidSchema,
  type: z.string(),
  title: z.string(),
  body: z.string(),
  time: z.string(),
  read: z.boolean(),
  urgent: z.boolean(),
})

export const academicReportStatSchema = z.object({
  label: z.string(),
  value: z.string(),
  color: z.string(),
})

export const academicReportsSchema = z.object({
  type: z.enum(['enrollment', 'results', 'attendance', 'programme']),
  stats: z.array(academicReportStatSchema),
  enrollmentChart: z
    .array(
      z.object({
        name: z.string(),
        Year1: z.number(),
        Year2: z.number(),
        Year3: z.number(),
        Year4: z.number(),
      }),
    )
    .optional(),
  resultsChart: z.array(z.object({ grade: z.string(), count: z.number() })).optional(),
  attendanceChart: z.array(z.object({ week: z.string(), avg: z.number() })).optional(),
  programmeChart: z.array(z.object({ name: z.string(), avgGPA: z.number() })).optional(),
})

export const createAcademicProgrammeRequestSchema = z.object({
  name: z.string().trim().min(2).max(200),
  departmentName: z.string().trim().min(2).max(200),
  durationYears: z.number().int().min(1).max(8),
  totalCredits: z.number().int().min(1).max(999),
  level: z.string().trim().min(2).max(50).optional(),
})

export const updateAcademicProgrammeRequestSchema = z.object({
  name: z.string().trim().min(2).max(200).optional(),
  departmentName: z.string().trim().min(2).max(200).optional(),
  durationYears: z.number().int().min(1).max(8).optional(),
  totalCredits: z.number().int().min(1).max(999).optional(),
  isActive: z.boolean().optional(),
})

export const createAcademicCourseRequestSchema = z
  .object({
    code: z.string().trim().min(2).max(20),
    name: z.string().trim().min(2).max(200),
    departmentName: z.string().trim().min(2).max(200),
    credits: z.number().int().min(1).max(30),
    yearOfStudy: z.number().int().min(1).max(8).optional(),
    description: z.string().trim().max(2000).optional(),
    prerequisiteCodes: z.array(z.string().trim().min(2).max(20)).max(10).optional(),
    lecturerId: uuidSchema.optional(),
    semesterId: uuidSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.lecturerId && !data.semesterId) {
      ctx.addIssue({
        code: 'custom',
        message: LECTURER_ASSIGNMENT_REQUIRES_SEMESTER,
        path: ['semesterId'],
      })
    }
  })

export const updateAcademicCourseRequestSchema = z
  .object({
    code: z.string().trim().min(2).max(20).optional(),
    name: z.string().trim().min(2).max(200).optional(),
    departmentName: z.string().trim().min(2).max(200).optional(),
    credits: z.number().int().min(1).max(30).optional(),
    yearOfStudy: z.number().int().min(1).max(8).nullable().optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    isActive: z.boolean().optional(),
    prerequisiteCodes: z.array(z.string().trim().min(2).max(20)).max(10).optional(),
    lecturerId: uuidSchema.nullable().optional(),
    semesterId: uuidSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.lecturerId && !data.semesterId) {
      ctx.addIssue({
        code: 'custom',
        message: LECTURER_ASSIGNMENT_REQUIRES_SEMESTER,
        path: ['semesterId'],
      })
    }
  })

export const createAcademicCalendarEventRequestSchema = z.object({
  title: z.string().trim().min(2).max(200),
  category: z.string().trim().min(2).max(50),
  startDate: isoDateSchema,
  endDate: isoDateSchema.optional(),
  description: z.string().trim().max(2000).optional(),
})

export const updateAcademicCalendarEventRequestSchema = createAcademicCalendarEventRequestSchema.partial()

export const changeAcademicStudentStatusRequestSchema = z.object({
  action: z.enum(['suspend', 'transfer', 'graduate', 'withdraw']),
  reason: z.string().trim().min(4, 'Please enter a reason (at least 4 characters).').max(500),
  targetProgrammeId: uuidSchema.optional(),
  yearOfStudy: z.number().int().min(1).max(8).optional(),
})

export const bulkCreateAcademicCoursesRequestSchema = z.object({
  courses: z.array(createAcademicCourseRequestSchema).min(1).max(200),
})

export const academicDepartmentOptionSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  code: z.string(),
})

export type ChangeAcademicStudentStatusRequest = z.infer<typeof changeAcademicStudentStatusRequestSchema>
export type BulkCreateAcademicCoursesRequest = z.infer<typeof bulkCreateAcademicCoursesRequestSchema>

export type AcademicProfile = z.infer<typeof academicProfileSchema>
export type AcademicDashboard = z.infer<typeof academicDashboardSchema>
export type AcademicStudentRow = z.infer<typeof academicStudentRowSchema>
export type AcademicStudentDetail = z.infer<typeof academicStudentDetailSchema>
export type AcademicCourseRow = z.infer<typeof academicCourseRowSchema>
export type AcademicProgrammeRow = z.infer<typeof academicProgrammeRowSchema>
export type AcademicProgrammeDetail = z.infer<typeof academicProgrammeDetailSchema>
export type AcademicCalendarEvent = z.infer<typeof academicCalendarEventSchema>
export type AcademicTimetableSlot = z.infer<typeof academicTimetableSlotSchema>
/** Calendar events with this category create/selectable semesters for course offerings. */
export function isSemesterCalendarCategory(category: string): boolean {
  return category.trim().toLowerCase() === 'semester'
}

/** Semesters that can carry tuition and fee billing — excludes orientation/career day records. */
export function isBillingSemesterName(name: string): boolean {
  const normalized = name.trim().toLowerCase()
  if (!normalized) return false
  if (/(orientation|career)\s*day/.test(normalized)) return false
  if (/semester\s*[12]\b|first\s+semester|second\s+semester/.test(normalized)) return true
  return /semester/i.test(normalized) && !/\bday\b/.test(normalized)
}

export function isTuitionFeeCategory(category: string): boolean {
  return category.trim().toLowerCase() === 'tuition'
}

export type AcademicLecturerRow = z.infer<typeof academicLecturerRowSchema>
export type AcademicResultBatch = z.infer<typeof academicResultBatchSchema>
export type AcademicSemesterOption = z.infer<typeof academicSemesterOptionSchema>
export type AcademicYearOption = z.infer<typeof academicYearOptionSchema>
export type AcademicAtRiskStudent = z.infer<typeof academicAtRiskStudentSchema>
export type AcademicNotification = z.infer<typeof academicNotificationSchema>
export type AcademicReports = z.infer<typeof academicReportsSchema>
export type RejectResultBatchRequest = z.infer<typeof rejectResultBatchRequestSchema>
export type CreateAcademicProgrammeRequest = z.infer<typeof createAcademicProgrammeRequestSchema>
export type UpdateAcademicProgrammeRequest = z.infer<typeof updateAcademicProgrammeRequestSchema>
export type CreateAcademicCourseRequest = z.infer<typeof createAcademicCourseRequestSchema>
export type UpdateAcademicCourseRequest = z.infer<typeof updateAcademicCourseRequestSchema>
export type CreateAcademicCalendarEventRequest = z.infer<typeof createAcademicCalendarEventRequestSchema>
export type UpdateAcademicCalendarEventRequest = z.infer<typeof updateAcademicCalendarEventRequestSchema>
export type AcademicDepartmentOption = z.infer<typeof academicDepartmentOptionSchema>
