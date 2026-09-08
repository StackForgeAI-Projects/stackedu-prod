import { z } from 'zod'
import {
  academicStandingSchema,
  attendanceStatusSchema,
  enrolmentStatusSchema,
  genderSchema,
  gradeSchema,
  paymentMethodSchema,
  paymentStatusSchema,
  registrationStatusSchema,
  resourceTypeSchema,
} from '../enums'
import { paymentFeeKindSchema } from '../payment-policy'
import { invoiceLineItemSchema } from '../invoice-line-items'
import { isoDateSchema, isoDateTimeSchema, uuidSchema } from '../primitives'

export const studentProfileSchema = z.object({
  studentId: uuidSchema,
  userId: uuidSchema,
  studentNumber: z.string(),
  fullName: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  yearOfStudy: z.number().int(),
  enrolmentStatus: enrolmentStatusSchema,
  feeHold: z.boolean(),
  programmeName: z.string(),
  programmeCode: z.string(),
  facultyName: z.string().nullable(),
  dateOfBirth: isoDateSchema.nullable(),
  gender: genderSchema.nullable(),
  phone: z.string().nullable(),
  nationality: z.string().nullable(),
  admittedAt: isoDateSchema.nullable(),
  unreadCount: z.number().int().nonnegative(),
})

export const studentDeadlineSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: isoDateSchema.nullable(),
  type: z.enum(['fee', 'registration', 'assignment']),
})

export const studentScheduleItemSchema = z.object({
  id: uuidSchema,
  offeringId: uuidSchema,
  courseCode: z.string(),
  courseName: z.string(),
  sessionType: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  room: z.string().nullable(),
  dayOfWeek: z.number().int().min(1).max(7),
  color: z.string(),
})

export const studentCourseSummarySchema = z.object({
  offeringId: uuidSchema,
  courseId: uuidSchema,
  code: z.string(),
  name: z.string(),
  credits: z.number().int(),
  lecturerName: z.string().nullable(),
  type: z.enum(['Compulsory', 'Elective']),
  color: z.string(),
  status: registrationStatusSchema,
})

export const studentResultRowSchema = z.object({
  offeringId: uuidSchema,
  courseCode: z.string(),
  courseName: z.string(),
  credits: z.number().int(),
  grade: gradeSchema.nullable(),
  gradePoint: z.number().nullable(),
  totalScore: z.number().nullable(),
  type: z.enum(['Compulsory', 'Elective']),
})

export const studentDashboardSchema = z.object({
  profile: studentProfileSchema,
  gpa: z.number().nullable(),
  outstandingFees: z.number().int(),
  attendanceRate: z.number().nullable(),
  courses: z.array(studentCourseSummarySchema),
  recentResults: z.array(studentResultRowSchema),
  schedule: z.array(studentScheduleItemSchema),
  deadlines: z.array(studentDeadlineSchema),
})

export const studentCourseDetailSchema = studentCourseSummarySchema.extend({
  description: z.string().nullable(),
  semesterName: z.string(),
  materials: z.array(
    z.object({
      id: uuidSchema,
      title: z.string(),
      description: z.string().nullable(),
      moduleName: z.string().nullable(),
      externalUrl: z.string().nullable(),
      fileName: z.string().nullable(),
      hasFile: z.boolean(),
    }),
  ),
  assessments: z.array(
    z.object({
      id: uuidSchema,
      title: z.string(),
      type: z.string(),
      dueAt: isoDateTimeSchema.nullable(),
      acceptsSubmissions: z.boolean(),
    }),
  ),
  attendance: z.array(
    z.object({
      id: uuidSchema,
      date: isoDateSchema,
      topic: z.string().nullable(),
      status: attendanceStatusSchema,
    }),
  ),
  attendanceRate: z.number().nullable(),
})

export const studentOfferingOptionSchema = z.object({
  offeringId: uuidSchema,
  code: z.string(),
  name: z.string(),
  credits: z.number().int(),
  lecturerName: z.string().nullable(),
  type: z.enum(['Compulsory', 'Elective']),
  registered: z.boolean(),
  status: registrationStatusSchema.nullable(),
})

export const studentRegistrationStateSchema = z.object({
  feeHold: z.boolean(),
  maxCredits: z.number().int(),
  registeredCredits: z.number().int(),
  registrationOpen: z.boolean(),
  registrationClosesAt: isoDateSchema.nullable(),
  offerings: z.array(studentOfferingOptionSchema),
})

export const registerCoursesRequestSchema = z.object({
  offeringIds: z.array(uuidSchema).min(1).max(20),
})

export const studentSemesterResultsSchema = z.object({
  semesterId: uuidSchema,
  label: z.string(),
  gpa: z.number().nullable(),
  courses: z.array(studentResultRowSchema),
})

export const studentResultsSchema = z.object({
  cgpa: z.number().nullable(),
  standing: academicStandingSchema.nullable(),
  semesters: z.array(studentSemesterResultsSchema),
})

export const studentTranscriptSchema = z.object({
  profile: studentProfileSchema,
  cgpa: z.number().nullable(),
  standing: academicStandingSchema.nullable(),
  semesters: z.array(studentSemesterResultsSchema),
})

export const studentInvoiceSchema = z.object({
  id: uuidSchema,
  invoiceNumber: z.string(),
  description: z.string(),
  amountDue: z.number().int(),
  amountPaid: z.number().int(),
  outstanding: z.number().int(),
  status: z.string(),
  dueDate: isoDateSchema.nullable(),
  feeKind: paymentFeeKindSchema,
  allowPartial: z.boolean(),
  lineItems: z.array(invoiceLineItemSchema),
})

export const studentPaymentRowSchema = z.object({
  id: uuidSchema,
  reference: z.string(),
  amount: z.number().int(),
  method: paymentMethodSchema,
  status: paymentStatusSchema,
  paidAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
  receiptNumber: z.string().nullable(),
})

export const studentFeesSchema = z.object({
  totalCharged: z.number().int(),
  totalPaid: z.number().int(),
  balance: z.number().int(),
  invoices: z.array(studentInvoiceSchema),
  payments: z.array(studentPaymentRowSchema),
})

export const studentPayRequestSchema = z.object({
  invoiceId: uuidSchema.optional(),
  amount: z.number().int().positive(),
  method: paymentMethodSchema,
  payerPhone: z.string().trim().max(32).optional(),
})

export const studentReceiptSchema = z.object({
  receiptNumber: z.string(),
  reference: z.string(),
  amount: z.number().int(),
  method: paymentMethodSchema,
  paidAt: isoDateTimeSchema.nullable(),
  studentNumber: z.string(),
  studentName: z.string(),
  institutionName: z.string(),
  description: z.string(),
  verificationCode: z.string().nullable(),
})

export const studentNotificationSchema = z.object({
  id: uuidSchema,
  title: z.string(),
  body: z.string(),
  category: z.string(),
  actionUrl: z.string().nullable(),
  readAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
})

export const studentLibraryResourceSchema = z.object({
  id: uuidSchema,
  title: z.string(),
  author: z.string().nullable(),
  type: resourceTypeSchema,
  description: z.string().nullable(),
  subjectTags: z.array(z.string()),
  publicationYear: z.number().int().nullable(),
})

export const studentOnboardingSchema = z.object({
  completedSteps: z.array(z.string()),
  currentStep: z.string().nullable(),
  completedAt: isoDateTimeSchema.nullable(),
})

export const saveOnboardingRequestSchema = z.object({
  completedSteps: z.array(z.string().trim().min(1).max(40)).max(20),
  currentStep: z.string().trim().max(40).nullable().optional(),
  complete: z.boolean().optional(),
})

export const studentAssessmentSchema = z.object({
  id: uuidSchema,
  offeringId: uuidSchema,
  title: z.string(),
  description: z.string().nullable(),
  courseCode: z.string(),
  courseName: z.string(),
  dueAt: isoDateTimeSchema.nullable(),
  acceptsSubmissions: z.boolean(),
  submitted: z.boolean(),
})

export const submitAssessmentRequestSchema = z.object({
  textResponse: z.string().trim().min(1).max(20_000),
})

export type StudentProfile = z.infer<typeof studentProfileSchema>
export type StudentDashboard = z.infer<typeof studentDashboardSchema>
export type StudentCourseSummary = z.infer<typeof studentCourseSummarySchema>
export type StudentCourseDetail = z.infer<typeof studentCourseDetailSchema>
export type StudentRegistrationState = z.infer<typeof studentRegistrationStateSchema>
export type RegisterCoursesRequest = z.infer<typeof registerCoursesRequestSchema>
export type StudentResults = z.infer<typeof studentResultsSchema>
export type StudentTranscript = z.infer<typeof studentTranscriptSchema>
export type StudentFees = z.infer<typeof studentFeesSchema>
export type StudentPayRequest = z.infer<typeof studentPayRequestSchema>
export type StudentReceipt = z.infer<typeof studentReceiptSchema>
export type StudentNotification = z.infer<typeof studentNotificationSchema>
export type StudentLibraryResource = z.infer<typeof studentLibraryResourceSchema>
export type StudentOnboarding = z.infer<typeof studentOnboardingSchema>
export type SaveOnboardingRequest = z.infer<typeof saveOnboardingRequestSchema>
export type StudentAssessment = z.infer<typeof studentAssessmentSchema>
export type SubmitAssessmentRequest = z.infer<typeof submitAssessmentRequestSchema>
