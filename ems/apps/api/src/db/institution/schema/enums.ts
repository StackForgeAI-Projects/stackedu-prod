import { pgEnum } from 'drizzle-orm/pg-core'
import {
  academicStandingSchema,
  aiJobStatusSchema,
  liveSessionStatusSchema,
  recordingStatusSchema,  applicationStatusSchema,
  assessmentTypeSchema,
  questionTypeSchema,
  attendanceStatusSchema,
  deliveryStatusSchema,
  enrolmentStatusSchema,
  genderSchema,
  gradeSchema,
  invoiceStatusSchema,
  notificationChannelSchema,
  paymentMethodSchema,
  paymentStatusSchema,
  reconciliationStatusSchema,
  registrationStatusSchema,
  resourceTypeSchema,
  resultBatchStatusSchema,
  riskLevelSchema,
  semesterStatusSchema,
  submissionStatusSchema,
  userRoleSchema,
} from '@stackedu/shared/enums'

/**
 * PostgreSQL enum types are generated from the shared Zod enums, so the
 * database, the API and the web app can never disagree about which values are
 * legal. Adding a value means editing packages/shared/src/enums.ts only.
 */

export const userRoleEnum = pgEnum('user_role', userRoleSchema.options)
export const genderEnum = pgEnum('gender', genderSchema.options)
export const enrolmentStatusEnum = pgEnum('enrolment_status', enrolmentStatusSchema.options)
export const academicStandingEnum = pgEnum('academic_standing', academicStandingSchema.options)
export const gradeEnum = pgEnum('grade', gradeSchema.options)
export const applicationStatusEnum = pgEnum('application_status', applicationStatusSchema.options)
export const paymentMethodEnum = pgEnum('payment_method', paymentMethodSchema.options)
export const paymentStatusEnum = pgEnum('payment_status', paymentStatusSchema.options)
export const resourceTypeEnum = pgEnum('resource_type', resourceTypeSchema.options)
export const semesterStatusEnum = pgEnum('semester_status', semesterStatusSchema.options)
export const registrationStatusEnum = pgEnum('registration_status', registrationStatusSchema.options)
export const attendanceStatusEnum = pgEnum('attendance_status', attendanceStatusSchema.options)
export const assessmentTypeEnum = pgEnum('assessment_type', assessmentTypeSchema.options)
export const questionTypeEnum = pgEnum('question_type', questionTypeSchema.options)
export const submissionStatusEnum = pgEnum('submission_status', submissionStatusSchema.options)
export const resultBatchStatusEnum = pgEnum('result_batch_status', resultBatchStatusSchema.options)
export const invoiceStatusEnum = pgEnum('invoice_status', invoiceStatusSchema.options)
export const reconciliationStatusEnum = pgEnum(
  'reconciliation_status',
  reconciliationStatusSchema.options,
)
export const notificationChannelEnum = pgEnum(
  'notification_channel',
  notificationChannelSchema.options,
)
export const deliveryStatusEnum = pgEnum('delivery_status', deliveryStatusSchema.options)
export const riskLevelEnum = pgEnum('risk_level', riskLevelSchema.options)
export const aiJobStatusEnum = pgEnum('ai_job_status', aiJobStatusSchema.options)
export const liveSessionStatusEnum = pgEnum('live_session_status', liveSessionStatusSchema.options)
export const recordingStatusEnum = pgEnum('recording_status', recordingStatusSchema.options)
