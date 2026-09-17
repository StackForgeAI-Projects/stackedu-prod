import { z } from 'zod'

/**
 * Every enumerated value in StackEDU is declared exactly once, here.
 *
 * The Zod enum is the source. TypeScript unions are inferred from it, and the
 * API builds its PostgreSQL enum types from the same `.options` array. Adding a
 * value in this file is therefore the only edit needed to teach the whole
 * system about it.
 */

export const userRoleSchema = z.enum([
  'Applicant',
  'Student',
  'Lecturer',
  'Bursar',
  'AcademicAdmin',
  'Librarian',
  'ICTManager',
])

export const genderSchema = z.enum(['Male', 'Female', 'Other'])

export const enrolmentStatusSchema = z.enum([
  'Active',
  'Suspended',
  'Transferred',
  'Graduated',
  'Withdrawn',
])

export const academicStandingSchema = z.enum(['Good', 'Probation', 'Suspension'])

export const gradeSchema = z.enum(['A', 'B', 'C', 'D', 'E', 'F'])

export const applicationStatusSchema = z.enum([
  'Draft',
  'Submitted',
  'UnderReview',
  'DocumentsRequested',
  'Accepted',
  'Rejected',
])

export const paymentMethodSchema = z.enum(['MoMo', 'Airtel', 'Card', 'BankTransfer'])

export const paymentStatusSchema = z.enum(['Pending', 'Completed', 'Failed', 'Voided'])

export const resourceTypeSchema = z.enum([
  'Ebook',
  'Journal',
  'ResearchPaper',
  'CoursePack',
  'Video',
])

export const institutionStatusSchema = z.enum([
  'Provisioning',
  'Active',
  'Suspended',
  'Archived',
])

export const semesterStatusSchema = z.enum(['Planned', 'Open', 'InProgress', 'Closed'])

export const registrationStatusSchema = z.enum([
  'Pending',
  'Approved',
  'Rejected',
  'Dropped',
])

export const attendanceStatusSchema = z.enum(['Present', 'Absent', 'Late', 'Excused'])

export const assessmentTypeSchema = z.enum([
  'Coursework',
  'Quiz',
  'MidtermExam',
  'FinalExam',
  'Practical',
  'Project',
])

/** Objective items the assessment builder can auto-mark. */
export const questionTypeSchema = z.enum(['MultipleChoice', 'TrueFalse', 'ShortAnswer'])

export const ASSESSMENT_TYPE_LABELS: Record<AssessmentType, string> = {
  Coursework: 'Coursework',
  Quiz: 'Quiz',
  MidtermExam: 'Mid-term exam',
  FinalExam: 'Final exam',
  Practical: 'Practical',
  Project: 'Project',
}

export const QUIZ_ASSESSMENT_TYPES = ['Quiz', 'MidtermExam', 'FinalExam'] as const

export function isQuizAssessmentType(type: AssessmentType): boolean {
  return (QUIZ_ASSESSMENT_TYPES as readonly string[]).includes(type)
}

/** Fresh option rows for the add-question form. True/false never reuses this list. */
export function blankOptionsForQuestionType(type: QuestionType): string[] {
  if (type === 'TrueFalse') return ['True', 'False']
  if (type === 'ShortAnswer') return []
  return ['', '', '', '']
}

export const submissionStatusSchema = z.enum([
  'Draft',
  'Submitted',
  'Late',
  'Graded',
  'Returned',
])

/** Results move through review before students can see them. */
export const resultBatchStatusSchema = z.enum([
  'Draft',
  'PendingReview',
  'Approved',
  'Published',
  'Rejected',
])

export const invoiceStatusSchema = z.enum([
  'Draft',
  'Issued',
  'PartiallyPaid',
  'Paid',
  'Overdue',
  'Cancelled',
])

export const reconciliationStatusSchema = z.enum(['Pending', 'Matched', 'Disputed', 'Written Off'])

export const notificationChannelSchema = z.enum(['InApp', 'Email', 'SMS'])

export const deliveryStatusSchema = z.enum(['Queued', 'Sent', 'Delivered', 'Failed', 'Bounced'])

export const riskLevelSchema = z.enum(['Low', 'Medium', 'High', 'Critical'])

export const aiJobStatusSchema = z.enum(['Queued', 'Running', 'Succeeded', 'Failed'])

export const liveSessionStatusSchema = z.enum(['Scheduled', 'Live', 'Ended', 'Cancelled'])

export const recordingStatusSchema = z.enum(['Pending', 'Ready', 'Failed'])

export type UserRole = z.infer<typeof userRoleSchema>
export type Gender = z.infer<typeof genderSchema>
export type EnrolmentStatus = z.infer<typeof enrolmentStatusSchema>
export type AcademicStanding = z.infer<typeof academicStandingSchema>
export type Grade = z.infer<typeof gradeSchema>
export type ApplicationStatus = z.infer<typeof applicationStatusSchema>
export type PaymentMethod = z.infer<typeof paymentMethodSchema>
export type PaymentStatus = z.infer<typeof paymentStatusSchema>
export type ResourceType = z.infer<typeof resourceTypeSchema>
export type InstitutionStatus = z.infer<typeof institutionStatusSchema>
export type SemesterStatus = z.infer<typeof semesterStatusSchema>
export type RegistrationStatus = z.infer<typeof registrationStatusSchema>
export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>
export type AssessmentType = z.infer<typeof assessmentTypeSchema>
export type QuestionType = z.infer<typeof questionTypeSchema>
export type SubmissionStatus = z.infer<typeof submissionStatusSchema>
export type ResultBatchStatus = z.infer<typeof resultBatchStatusSchema>
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>
export type ReconciliationStatus = z.infer<typeof reconciliationStatusSchema>
export type NotificationChannel = z.infer<typeof notificationChannelSchema>
export type DeliveryStatus = z.infer<typeof deliveryStatusSchema>
export type RiskLevel = z.infer<typeof riskLevelSchema>
export type AiJobStatus = z.infer<typeof aiJobStatusSchema>
export type LiveSessionStatus = z.infer<typeof liveSessionStatusSchema>
export type RecordingStatus = z.infer<typeof recordingStatusSchema>
