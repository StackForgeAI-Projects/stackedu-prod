import { z } from 'zod'
import {
  paymentMethodSchema,
  paymentStatusSchema,
  reconciliationStatusSchema,
  userRoleSchema,
} from '../enums'
import { isoDateSchema, isoDateTimeSchema, uuidSchema } from '../primitives'

export const bursarProfileSchema = z.object({
  userId: uuidSchema,
  fullName: z.string(),
  firstName: z.string(),
  email: z.string(),
  role: userRoleSchema,
  staffId: z.string(),
  institutionName: z.string(),
  institutionShortName: z.string(),
  unreadCount: z.number().int().nonnegative(),
})

export const bursarPaymentRowSchema = z.object({
  id: uuidSchema,
  reference: z.string(),
  studentId: uuidSchema,
  studentNumber: z.string(),
  studentName: z.string(),
  amount: z.number().int(),
  method: paymentMethodSchema,
  status: paymentStatusSchema,
  description: z.string(),
  paidAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
  receiptNumber: z.string().nullable(),
  verificationCode: z.string().nullable(),
  gatewayReference: z.string().nullable(),
})

export const bursarDashboardSchema = z.object({
  profile: bursarProfileSchema,
  stats: z.object({
    collectedToday: z.number().int().nonnegative(),
    collectedYesterday: z.number().int().nonnegative(),
    outstandingBalances: z.number().int().nonnegative(),
    studentsWithBalance: z.number().int().nonnegative(),
    collectedThisMonth: z.number().int().nonnegative(),
    semesterLabel: z.string(),
    activeFeeHolds: z.number().int().nonnegative(),
  }),
  recentPayments: z.array(bursarPaymentRowSchema),
  paymentsByMethod: z.array(
    z.object({
      method: paymentMethodSchema,
      total: z.number().int().nonnegative(),
    }),
  ),
})

export const bursarFeeItemSchema = z.object({
  id: uuidSchema,
  feeStructureId: uuidSchema,
  name: z.string(),
  category: z.string(),
  amount: z.number().int().nonnegative(),
  programmeId: uuidSchema.nullable(),
  programmeName: z.string(),
  yearOfStudy: z.number().int().nullable(),
  isMandatory: z.boolean(),
  isActive: z.boolean(),
  createdAt: isoDateTimeSchema,
  dueDate: isoDateSchema.nullable(),
})

export const createBursarFeeItemRequestSchema = z.object({
  name: z.string().trim().min(1),
  category: z.string().trim().min(1),
  amount: z.number().int().positive(),
  dueDate: isoDateSchema,
  programmeId: uuidSchema.optional(),
  yearOfStudy: z.number().int().min(1).max(6).nullable().optional(),
  isMandatory: z.boolean().optional(),
})

export const updateBursarFeeItemRequestSchema = createBursarFeeItemRequestSchema.partial().extend({
  isActive: z.boolean().optional(),
})

export const bursarStudentAccountRowSchema = z.object({
  studentId: uuidSchema,
  studentNumber: z.string(),
  name: z.string(),
  programme: z.string(),
  yearOfStudy: z.number().int(),
  totalCharged: z.number().int(),
  totalPaid: z.number().int(),
  outstanding: z.number().int(),
  hasHold: z.boolean(),
  status: z.enum(['Paid', 'Outstanding', 'On Hold']),
  lastPaymentAt: isoDateTimeSchema.nullable(),
})

export const bursarStudentPaymentSchema = z.object({
  id: uuidSchema,
  reference: z.string(),
  amount: z.number().int(),
  method: paymentMethodSchema,
  status: paymentStatusSchema,
  paidAt: isoDateTimeSchema.nullable(),
  receiptNumber: z.string().nullable(),
  verificationCode: z.string().nullable(),
  description: z.string(),
})

export const bursarStudentAccountDetailSchema = bursarStudentAccountRowSchema.extend({
  email: z.string(),
  payments: z.array(bursarStudentPaymentSchema),
  invoices: z.array(
    z.object({
      id: uuidSchema,
      invoiceNumber: z.string(),
      amountDue: z.number().int(),
      amountPaid: z.number().int(),
      status: z.string(),
      dueDate: isoDateSchema.nullable(),
    }),
  ),
  holdReason: z.string().nullable(),
})

export const recordBursarManualPaymentRequestSchema = z.object({
  amount: z.number().int().positive(),
  method: paymentMethodSchema,
  description: z.string().trim().min(1),
  notes: z.string().trim().min(1),
  invoiceId: uuidSchema.optional(),
})

export const setBursarFeeHoldRequestSchema = z.object({
  reason: z.string().trim().min(1),
  blocks: z.array(z.string()).optional(),
})

export const bursarReceiptRowSchema = z.object({
  id: uuidSchema,
  receiptNumber: z.string(),
  paymentId: uuidSchema,
  studentId: uuidSchema,
  studentNumber: z.string(),
  studentName: z.string(),
  issueDate: isoDateTimeSchema.nullable(),
  description: z.string(),
  amount: z.number().int(),
  method: paymentMethodSchema,
  reference: z.string(),
  paidAt: isoDateTimeSchema.nullable(),
  verificationCode: z.string().nullable(),
  institutionName: z.string(),
  status: z.enum(['Valid', 'Voided']),
  voidedAt: isoDateTimeSchema.nullable(),
  voidReason: z.string().nullable(),
})

export const voidBursarReceiptRequestSchema = z.object({
  reason: z.string().trim().min(1),
})

export const bursarReconciliationRowSchema = z.object({
  id: uuidSchema,
  externalReference: z.string(),
  studentId: uuidSchema.nullable(),
  studentNumber: z.string().nullable(),
  studentName: z.string().nullable(),
  amount: z.number().int(),
  source: z.string(),
  status: reconciliationStatusSchema,
  transactionDate: isoDateTimeSchema,
  payerName: z.string().nullable(),
  payerPhone: z.string().nullable(),
  narration: z.string().nullable(),
  notes: z.string().nullable(),
})

export const resolveBursarReconciliationRequestSchema = z.object({
  resolution: z.enum(['Matched', 'Disputed', 'Written Off']),
  notes: z.string().trim().optional(),
  studentId: uuidSchema.optional(),
})

export const bursarReportsSchema = z.object({
  type: z.enum(['daily', 'monthly', 'semester', 'annual']),
  label: z.string(),
  totalCollected: z.number().int().nonnegative(),
  totalOutstanding: z.number().int().nonnegative(),
  paymentCount: z.number().int().nonnegative(),
  successRate: z.number().int().min(0).max(100),
  trend: z.array(
    z.object({
      label: z.string(),
      amount: z.number().int().nonnegative(),
    }),
  ),
  programmeBreakdown: z.array(
    z.object({
      programme: z.string(),
      collected: z.number().int().nonnegative(),
      outstanding: z.number().int().nonnegative(),
      students: z.number().int().nonnegative(),
    }),
  ),
})

export const bursarNotificationSchema = z.object({
  id: uuidSchema,
  type: z.string(),
  title: z.string(),
  body: z.string(),
  time: z.string(),
  read: z.boolean(),
  urgent: z.boolean(),
})

export const bursarAudienceOptionsSchema = z.object({
  enrolledStudentCount: z.number().int().nonnegative(),
  departments: z.array(z.object({ id: uuidSchema, name: z.string(), studentCount: z.number().int().nonnegative() })),
  years: z.array(z.object({ year: z.number().int(), studentCount: z.number().int().nonnegative() })),
  students: z.array(z.object({ id: uuidSchema, studentNumber: z.string(), name: z.string() })),
  courses: z.array(z.object({ offeringId: uuidSchema, label: z.string(), enrolledCount: z.number().int().nonnegative() })),
})

export const createBursarAnnouncementRequestSchema = z.object({
  title: z.string().trim().min(2).max(200),
  body: z.string().trim().min(2).max(8_000),
  audience: z.object({
    everyone: z.boolean().optional(),
    includeEnrolledStudents: z.boolean().optional(),
    departmentIds: z.array(uuidSchema).max(40).optional(),
    yearsOfStudy: z.array(z.number().int().min(1).max(8)).max(8).optional(),
    studentIds: z.array(uuidSchema).max(200).optional(),
    courseOfferingIds: z.array(uuidSchema).max(80).optional(),
  }),
})

export const createBursarAnnouncementResultSchema = z.object({
  id: uuidSchema,
  recipientCount: z.number().int().nonnegative(),
  audienceLabel: z.string(),
  sentAt: isoDateTimeSchema,
})

export const bursarFeeMessageSchema = z.object({
  id: uuidSchema,
  title: z.string(),
  body: z.string(),
  audienceLabel: z.string(),
  recipientCount: z.number().int().nonnegative(),
  sentAt: isoDateTimeSchema,
})

export const issueSemesterFeesResultSchema = z.object({
  issuedCount: z.number().int().nonnegative(),
  skippedCount: z.number().int().nonnegative(),
  semesterLabel: z.string(),
})

export type BursarProfile = z.infer<typeof bursarProfileSchema>
export type BursarPaymentRow = z.infer<typeof bursarPaymentRowSchema>
export type BursarDashboard = z.infer<typeof bursarDashboardSchema>
export type BursarFeeItem = z.infer<typeof bursarFeeItemSchema>
export type CreateBursarFeeItemRequest = z.infer<typeof createBursarFeeItemRequestSchema>
export type UpdateBursarFeeItemRequest = z.infer<typeof updateBursarFeeItemRequestSchema>
export type BursarStudentAccountRow = z.infer<typeof bursarStudentAccountRowSchema>
export type BursarStudentAccountDetail = z.infer<typeof bursarStudentAccountDetailSchema>
export type RecordBursarManualPaymentRequest = z.infer<typeof recordBursarManualPaymentRequestSchema>
export type SetBursarFeeHoldRequest = z.infer<typeof setBursarFeeHoldRequestSchema>
export type BursarReceiptRow = z.infer<typeof bursarReceiptRowSchema>
export type VoidBursarReceiptRequest = z.infer<typeof voidBursarReceiptRequestSchema>
export type BursarReconciliationRow = z.infer<typeof bursarReconciliationRowSchema>
export type ResolveBursarReconciliationRequest = z.infer<typeof resolveBursarReconciliationRequestSchema>
export type BursarReports = z.infer<typeof bursarReportsSchema>
export type BursarNotification = z.infer<typeof bursarNotificationSchema>
export type BursarAudienceOptions = z.infer<typeof bursarAudienceOptionsSchema>
export type CreateBursarAnnouncementRequest = z.infer<typeof createBursarAnnouncementRequestSchema>
export type CreateBursarAnnouncementResult = z.infer<typeof createBursarAnnouncementResultSchema>
export type BursarFeeMessage = z.infer<typeof bursarFeeMessageSchema>
export type IssueSemesterFeesResult = z.infer<typeof issueSemesterFeesResultSchema>
