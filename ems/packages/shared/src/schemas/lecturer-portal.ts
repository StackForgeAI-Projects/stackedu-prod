import { z } from 'zod'
import { attendancePolicySchema } from '../attendance-policy'
import {
  assessmentTypeSchema,
  attendanceStatusSchema,
  gradeSchema,
  questionTypeSchema,
  resultBatchStatusSchema,
  riskLevelSchema,
  userRoleSchema,
} from '../enums'
import { isoDateSchema, isoDateTimeSchema, uuidSchema } from '../primitives'
import { COURSE_MATERIAL_MAX_BYTES, COURSE_MATERIAL_MIME_TYPES } from '../course-material'
import { DOCUMENT_IMPORT_MAX_BYTES, DOCUMENT_IMPORT_MIME_TYPES } from '../document-import'
import { academicAtRiskStudentSchema, academicNotificationSchema } from './academic-portal'
import { classroomSessionSummarySchema } from './classroom'

export const lecturerProfileSchema = z.object({
  userId: uuidSchema,
  fullName: z.string(),
  firstName: z.string(),
  email: z.string(),
  role: userRoleSchema,
  staffId: z.string(),
  department: z.string(),
  institutionName: z.string(),
  institutionShortName: z.string(),
  unreadCount: z.number().int().nonnegative(),
})

export const lecturerScheduleItemSchema = z.object({
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

export const lecturerCourseRowSchema = z.object({
  offeringId: uuidSchema,
  courseId: uuidSchema,
  code: z.string(),
  name: z.string(),
  credits: z.number().int(),
  enrolledCount: z.number().int().nonnegative(),
  color: z.string(),
  semesterName: z.string(),
  isLead: z.boolean(),
  nextClass: z.string(),
  nextClassShort: z.string(),
  schedule: z.array(
    z.object({
      day: z.string(),
      time: z.string(),
      room: z.string(),
      type: z.string(),
    }),
  ),
})

export const lecturerCourseStudentSchema = z.object({
  studentId: uuidSchema,
  studentNumber: z.string(),
  name: z.string(),
  attendanceRate: z.number().nullable(),
  lastGrade: z.string().nullable(),
  riskLevel: riskLevelSchema.nullable(),
})

export const lecturerAttendanceSessionSchema = z.object({
  id: uuidSchema,
  offeringId: uuidSchema,
  courseCode: z.string(),
  sessionDate: isoDateSchema,
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  topic: z.string().nullable(),
  present: z.number().int().nonnegative(),
  late: z.number().int().nonnegative(),
  absent: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  closed: z.boolean(),
  status: z.enum(['Draft', 'Submitted']),
  closedAt: isoDateTimeSchema.nullable(),
  editable: z.boolean(),
  sessionNumber: z.number().int().positive(),
})

export const lecturerPendingActionSchema = z.object({
  id: z.string(),
  task: z.string(),
  due: z.string(),
  href: z.string(),
})

export const lecturerDashboardSchema = z.object({
  profile: lecturerProfileSchema,
  stats: z.object({
    assignedCourses: z.number().int().nonnegative(),
    pendingResultEntries: z.number().int().nonnegative(),
    atRiskStudents: z.number().int().nonnegative(),
    semesterLabel: z.string(),
  }),
  courses: z.array(lecturerCourseRowSchema),
  todaySchedule: z.array(lecturerScheduleItemSchema),
  recentAttendance: z.array(lecturerAttendanceSessionSchema),
  atRisk: z.array(
    z.object({
      id: uuidSchema,
      name: z.string(),
      courseCode: z.string(),
      reason: z.string(),
      riskLevel: riskLevelSchema,
    }),
  ),
  pendingActions: z.array(lecturerPendingActionSchema),
})

export const lecturerCourseMaterialSchema = z.object({
  id: uuidSchema,
  moduleId: uuidSchema.nullable(),
  title: z.string(),
  description: z.string().nullable(),
  moduleName: z.string().nullable(),
  bodyText: z.string().nullable(),
  sequence: z.number().int().nonnegative(),
  externalUrl: z.string().nullable(),
  fileKey: z.string().nullable(),
  fileName: z.string().nullable(),
  mimeType: z.string().nullable(),
  fileSizeBytes: z.number().int().nonnegative().nullable(),
  isPublished: z.boolean(),
  publishedAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
})

export const lecturerCourseModuleSchema = z.object({
  id: uuidSchema,
  title: z.string(),
  summary: z.string().nullable(),
  sequence: z.number().int().nonnegative(),
  prerequisiteModuleId: uuidSchema.nullable(),
  isPublished: z.boolean(),
  publishedAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
  /** How many published materials sit in this module, for the list view. */
  materialCount: z.number().int().nonnegative(),
})

export const lecturerCourseAnnouncementSchema = z.object({
  id: uuidSchema,
  title: z.string(),
  body: z.string(),
  isPinned: z.boolean(),
  publishedAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
})

export const discussionThreadSummarySchema = z.object({
  id: uuidSchema,
  offeringId: uuidSchema,
  title: z.string(),
  prompt: z.string(),
  isPublished: z.boolean(),
  publishedAt: isoDateTimeSchema.nullable(),
  closedAt: isoDateTimeSchema.nullable(),
  assessmentId: uuidSchema.nullable(),
  graded: z.boolean(),
  postCount: z.number().int().nonnegative(),
  createdAt: isoDateTimeSchema,
})

export const lecturerCourseDetailSchema = lecturerCourseRowSchema.extend({
  description: z.string().nullable(),
  students: z.array(lecturerCourseStudentSchema),
  modules: z.array(lecturerCourseModuleSchema),
  materials: z.array(lecturerCourseMaterialSchema),
  announcements: z.array(lecturerCourseAnnouncementSchema),
  discussions: z.array(discussionThreadSummarySchema),
  liveSessions: z.array(classroomSessionSummarySchema),
  assessments: z.array(
    z.object({
      id: uuidSchema,
      title: z.string(),
      type: z.string(),
      weight: z.number(),
      totalMarks: z.number(),
      dueAt: isoDateTimeSchema.nullable(),
      isPublished: z.boolean(),
    }),
  ),
})

export const lecturerAttendanceRecordSchema = z.object({
  studentId: uuidSchema,
  studentNumber: z.string(),
  name: z.string(),
  status: attendanceStatusSchema,
  note: z.string().nullable(),
})

export const lecturerAttendanceDetailSchema = lecturerAttendanceSessionSchema.extend({
  records: z.array(lecturerAttendanceRecordSchema),
})

export const saveLecturerAttendanceRequestSchema = z.object({
  sessionId: uuidSchema.optional(),
  offeringId: uuidSchema,
  sessionDate: isoDateSchema,
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  topic: z.string().trim().max(200).optional(),
  close: z.boolean().optional(),
  records: z
    .array(
      z.object({
        studentId: uuidSchema,
        status: attendanceStatusSchema,
        note: z.string().trim().max(300).optional(),
      }),
    )
    .min(1)
    .max(400),
})

export const lecturerResultStudentSchema = z.object({
  studentId: uuidSchema,
  studentNumber: z.string(),
  name: z.string(),
  totalScore: z.number().nullable(),
  grade: gradeSchema.nullable(),
})

export const lecturerResultBatchSchema = z.object({
  offeringId: uuidSchema,
  courseCode: z.string(),
  courseName: z.string(),
  credits: z.number().int(),
  status: resultBatchStatusSchema.nullable(),
  batchId: uuidSchema.nullable(),
  rejectionReason: z.string().nullable(),
  submittedAt: isoDateTimeSchema.nullable(),
  students: z.array(lecturerResultStudentSchema),
  avg: z.number().nullable(),
  highest: z.number().nullable(),
  lowest: z.number().nullable(),
  passRate: z.number().nullable(),
})

export const saveLecturerResultsRequestSchema = z.object({
  entries: z
    .array(
      z.object({
        studentId: uuidSchema,
        totalScore: z.number().min(0).max(100),
      }),
    )
    .min(1)
    .max(400),
})

export const lecturerAssessmentRowSchema = z.object({
  id: uuidSchema,
  offeringId: uuidSchema,
  courseCode: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  type: assessmentTypeSchema,
  weight: z.number(),
  totalMarks: z.number(),
  dueAt: isoDateTimeSchema.nullable(),
  isPublished: z.boolean(),
  acceptsSubmissions: z.boolean(),
  submittedCount: z.number().int().nonnegative(),
  totalCount: z.number().int().nonnegative(),
  itemCount: z.number().int().nonnegative(),
  status: z.enum(['Draft', 'Active', 'Closed', 'Graded']),
})

export const createLecturerAssessmentRequestSchema = z.object({
  offeringId: uuidSchema,
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional(),
  type: assessmentTypeSchema.default('Coursework'),
  weight: z.number().min(0).max(100),
  totalMarks: z.number().positive().max(1000),
  dueAt: isoDateSchema.optional(),
  acceptsSubmissions: z.boolean().optional(),
  publish: z.boolean().optional(),
})

/** A page is written in the portal, so it carries body text instead of a file. */
const materialBodyTextSchema = z.string().trim().max(20_000)

export const createLecturerMaterialRequestSchema = z.object({
  offeringId: uuidSchema,
  moduleId: uuidSchema.nullable().optional(),
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional(),
  moduleName: z.string().trim().max(100).optional(),
  bodyText: materialBodyTextSchema.optional(),
  sequence: z.number().int().min(0).max(999).optional(),
  externalUrl: z.string().trim().max(500).optional(),
  fileKey: z.string().trim().max(500).optional(),
  fileName: z.string().trim().max(200).optional(),
  mimeType: z.string().trim().max(120).optional(),
  fileSizeBytes: z.number().int().positive().max(COURSE_MATERIAL_MAX_BYTES).optional(),
  publish: z.boolean().optional(),
})

export const updateLecturerMaterialRequestSchema = z.object({
  moduleId: uuidSchema.nullable().optional(),
  title: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  moduleName: z.string().trim().max(100).optional(),
  bodyText: materialBodyTextSchema.optional(),
  sequence: z.number().int().min(0).max(999).optional(),
  externalUrl: z.string().trim().max(500).optional(),
  fileKey: z.string().trim().max(500).optional(),
  fileName: z.string().trim().max(200).optional(),
  mimeType: z.string().trim().max(120).optional(),
  fileSizeBytes: z.number().int().positive().max(COURSE_MATERIAL_MAX_BYTES).optional(),
  clearFile: z.boolean().optional(),
  publish: z.boolean().optional(),
})

export const createLecturerModuleRequestSchema = z.object({
  offeringId: uuidSchema,
  title: z.string().trim().min(2).max(200),
  summary: z.string().trim().max(2000).optional(),
  sequence: z.number().int().min(0).max(999).optional(),
  prerequisiteModuleId: uuidSchema.nullable().optional(),
  publish: z.boolean().optional(),
})

export const updateLecturerModuleRequestSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  summary: z.string().trim().max(2000).optional(),
  sequence: z.number().int().min(0).max(999).optional(),
  prerequisiteModuleId: uuidSchema.nullable().optional(),
  publish: z.boolean().optional(),
})

export const createLecturerAnnouncementRequestSchema = z.object({
  offeringId: uuidSchema,
  title: z.string().trim().min(2).max(200),
  body: z.string().trim().min(2).max(5000),
  isPinned: z.boolean().optional(),
  publish: z.boolean().optional(),
})

export const updateLecturerAnnouncementRequestSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  body: z.string().trim().min(2).max(5000).optional(),
  isPinned: z.boolean().optional(),
  publish: z.boolean().optional(),
})

export const discussionPostSchema = z.object({
  id: uuidSchema,
  threadId: uuidSchema,
  parentPostId: uuidSchema.nullable(),
  authorId: uuidSchema,
  authorName: z.string(),
  authorRole: z.string(),
  body: z.string(),
  createdAt: isoDateTimeSchema,
})

export const discussionThreadDetailSchema = discussionThreadSummarySchema.extend({
  posts: z.array(discussionPostSchema),
})

export const createLecturerDiscussionRequestSchema = z.object({
  offeringId: uuidSchema,
  title: z.string().trim().min(2).max(200),
  prompt: z.string().trim().min(2).max(5000),
  publish: z.boolean().optional(),
  graded: z.boolean().optional(),
  weight: z.number().min(0).max(100).optional(),
})

export const updateLecturerDiscussionRequestSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  prompt: z.string().trim().min(2).max(5000).optional(),
  publish: z.boolean().optional(),
  close: z.boolean().optional(),
})

export const createDiscussionPostRequestSchema = z.object({
  body: z.string().trim().min(2).max(5000),
  parentPostId: uuidSchema.nullable().optional(),
})

export const describeLecturerMaterialRequestSchema = z.object({
  title: z.string().trim().max(200).optional(),
  externalUrl: z.string().trim().max(500).optional(),
  fileKey: z.string().trim().max(500).optional(),
  fileName: z.string().trim().max(200).optional(),
  mimeType: z.string().trim().max(120).optional(),
}).refine(
  (value) => Boolean(value.externalUrl?.trim() || value.fileKey?.trim() || value.fileName?.trim()),
  { message: 'Add a file or a link first.' },
)

export const lecturerQuestionSchema = z.object({
  id: uuidSchema,
  courseId: uuidSchema.nullable(),
  courseCode: z.string().nullable(),
  topic: z.string(),
  type: questionTypeSchema,
  version: z.number().int().positive(),
  stem: z.string(),
  options: z.array(z.string()).nullable(),
  correctAnswer: z.string(),
  marks: z.number(),
  answeredCount: z.number().int().nonnegative(),
  createdAt: isoDateTimeSchema,
})

export const createLecturerQuestionRequestSchema = z.object({
  courseId: uuidSchema.nullable().optional(),
  topic: z.string().trim().min(1).max(100),
  type: questionTypeSchema,
  stem: z.string().trim().min(4).max(2000),
  options: z.array(z.string().trim().min(1).max(400)).max(8).optional(),
  correctAnswer: z.string().trim().min(1).max(400),
  marks: z.number().positive().max(100),
})

export const updateLecturerQuestionRequestSchema = z.object({
  courseId: uuidSchema.nullable().optional(),
  topic: z.string().trim().min(1).max(100).optional(),
  stem: z.string().trim().min(4).max(2000).optional(),
  options: z.array(z.string().trim().min(1).max(400)).max(8).optional(),
  correctAnswer: z.string().trim().min(1).max(400).optional(),
  marks: z.number().positive().max(100).optional(),
})

export const lecturerAssessmentItemSchema = z.object({
  id: uuidSchema,
  sequence: z.number().int().nonnegative(),
  questionId: uuidSchema.nullable(),
  questionVersionId: uuidSchema.nullable(),
  stem: z.string().nullable(),
  type: questionTypeSchema.nullable(),
  marks: z.number().nullable(),
  drawTopic: z.string().nullable(),
  drawCourseId: uuidSchema.nullable(),
  drawCount: z.number().int().positive().nullable(),
})

export const saveLecturerAssessmentItemsRequestSchema = z.object({
  items: z.array(
    z.object({
      questionId: uuidSchema.optional(),
      drawTopic: z.string().trim().min(1).max(100).optional(),
      drawCourseId: uuidSchema.nullable().optional(),
      drawCount: z.number().int().positive().max(40).optional(),
    }).refine((item) => Boolean(item.questionId) || Boolean(item.drawTopic && item.drawCount), {
      message: 'Each item must be a question or a random draw from a topic.',
    }),
  ).max(60),
})

export const generateLecturerQuestionsRequestSchema = z.object({
  offeringId: uuidSchema,
  topic: z.string().trim().min(1).max(100),
  types: z.array(questionTypeSchema).min(1).max(3).optional(),
  count: z.number().int().min(1).max(8).optional(),
  useCourseMaterials: z.boolean().optional(),
  fileKey: z.string().trim().max(500).optional(),
  fileName: z.string().trim().max(200).optional(),
  mimeType: z.string().trim().max(120).optional(),
  externalUrl: z.string().trim().url().max(2000).optional(),
  createAssessment: z.object({
    title: z.string().trim().min(2).max(200),
    type: assessmentTypeSchema,
    dueAt: isoDateSchema.optional(),
    weight: z.number().min(0).max(100).optional(),
    totalMarks: z.number().positive().max(1000).optional(),
  }).optional(),
  assessmentId: uuidSchema.optional(),
})

export const reserveLecturerQuestionImportRequestSchema = z.object({
  fileName: z.string().trim().min(1).max(200),
  mimeType: z.string().trim().min(3).max(120).refine((value) => DOCUMENT_IMPORT_MIME_TYPES.has(value), {
    message: 'Upload a PDF, Word, Excel, CSV, or text file.',
  }),
  fileSizeBytes: z.number().int().positive().max(DOCUMENT_IMPORT_MAX_BYTES),
})

export const reserveLecturerMaterialUploadRequestSchema = z.object({
  offeringId: uuidSchema,
  fileName: z.string().trim().min(1).max(200),
  mimeType: z.string().trim().min(3).max(120).refine((value) => COURSE_MATERIAL_MIME_TYPES.has(value), {
    message: 'Upload a PDF, Word document, or image file.',
  }),
  fileSizeBytes: z.number().int().positive().max(COURSE_MATERIAL_MAX_BYTES),
})

export const lecturerAssessmentComponentSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  maxScore: z.number(),
  sequence: z.number().int().nonnegative(),
})

export const lecturerSubmissionRowSchema = z.object({
  studentId: uuidSchema,
  studentNumber: z.string(),
  studentName: z.string(),
  status: z.enum(['Submitted', 'Late', 'Not submitted', 'Graded']),
  submittedAt: isoDateTimeSchema.nullable(),
  isLate: z.boolean(),
  textResponse: z.string().nullable(),
  score: z.number().nullable(),
  componentScores: z.record(z.string(), z.number()).nullable(),
  feedback: z.string().nullable(),
})

export const lecturerAssessmentDetailSchema = lecturerAssessmentRowSchema.extend({
  components: z.array(lecturerAssessmentComponentSchema),
  submissions: z.array(lecturerSubmissionRowSchema),
})

export const saveLecturerGradeRequestSchema = z.object({
  studentId: uuidSchema,
  score: z.number().min(0).optional(),
  componentScores: z.record(z.string(), z.number().min(0)).optional(),
  feedback: z.string().trim().max(2000).optional(),
}).refine((value) => value.score != null || Boolean(value.componentScores), {
  message: 'Enter a mark or the component scores.',
})

export const resolveLecturerAtRiskRequestSchema = z.object({
  notes: z.string().trim().min(4).max(500),
})

export const lecturerAtRiskStudentSchema = academicAtRiskStudentSchema.extend({
  offeringId: uuidSchema.nullable(),
  courseCode: z.string().nullable(),
})

export const lecturerNotificationSchema = academicNotificationSchema

export const lecturerRoomOptionSchema = z.object({
  id: uuidSchema,
  code: z.string(),
  name: z.string(),
  building: z.string().nullable(),
})

export const lecturerTimetableSlotSchema = lecturerScheduleItemSchema.extend({
  availabilityStatus: z.enum(['Pending', 'Confirmed', 'ChangeRequested']),
  changeReason: z.string().nullable(),
})

export const requestTimetableChangeRequestSchema = z.object({
  reason: z.string().trim().min(4, 'Write a short reason (at least 4 characters).').max(1000),
})

export const saveLecturerTimetableSlotRequestSchema = z.object({
  offeringId: uuidSchema,
  dayOfWeek: z.number().int().min(1).max(7),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  sessionType: z.enum(['Lecture', 'Tutorial', 'Lab', 'Practical']).default('Lecture'),
  roomId: uuidSchema.nullable().optional(),
})

export const updateLecturerTimetableSlotRequestSchema = z.object({
  dayOfWeek: z.number().int().min(1).max(7).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  sessionType: z.enum(['Lecture', 'Tutorial', 'Lab', 'Practical']).optional(),
  roomId: uuidSchema.nullable().optional(),
})

export type LecturerProfile = z.infer<typeof lecturerProfileSchema>
export type LecturerCourseModule = z.infer<typeof lecturerCourseModuleSchema>
export type LecturerCourseAnnouncement = z.infer<typeof lecturerCourseAnnouncementSchema>
export type CreateLecturerModuleRequest = z.infer<typeof createLecturerModuleRequestSchema>
export type UpdateLecturerModuleRequest = z.infer<typeof updateLecturerModuleRequestSchema>
export type CreateLecturerAnnouncementRequest = z.infer<
  typeof createLecturerAnnouncementRequestSchema
>
export type UpdateLecturerAnnouncementRequest = z.infer<
  typeof updateLecturerAnnouncementRequestSchema
>
export type DiscussionPost = z.infer<typeof discussionPostSchema>
export type DiscussionThreadSummary = z.infer<typeof discussionThreadSummarySchema>
export type DiscussionThreadDetail = z.infer<typeof discussionThreadDetailSchema>
export type CreateLecturerDiscussionRequest = z.infer<typeof createLecturerDiscussionRequestSchema>
export type UpdateLecturerDiscussionRequest = z.infer<typeof updateLecturerDiscussionRequestSchema>
export type CreateDiscussionPostRequest = z.infer<typeof createDiscussionPostRequestSchema>
export type LecturerDashboard = z.infer<typeof lecturerDashboardSchema>
export type LecturerCourseRow = z.infer<typeof lecturerCourseRowSchema>
export type LecturerCourseDetail = z.infer<typeof lecturerCourseDetailSchema>
export type LecturerAttendanceSession = z.infer<typeof lecturerAttendanceSessionSchema>
export type LecturerAttendanceDetail = z.infer<typeof lecturerAttendanceDetailSchema>
export type SaveLecturerAttendanceRequest = z.infer<typeof saveLecturerAttendanceRequestSchema>
export type LecturerResultBatch = z.infer<typeof lecturerResultBatchSchema>
export type SaveLecturerResultsRequest = z.infer<typeof saveLecturerResultsRequestSchema>
export type LecturerAssessmentRow = z.infer<typeof lecturerAssessmentRowSchema>
export type LecturerAssessmentDetail = z.infer<typeof lecturerAssessmentDetailSchema>
export type CreateLecturerAssessmentRequest = z.infer<typeof createLecturerAssessmentRequestSchema>
export type LecturerCourseMaterial = z.infer<typeof lecturerCourseMaterialSchema>
export type CreateLecturerMaterialRequest = z.infer<typeof createLecturerMaterialRequestSchema>
export type UpdateLecturerMaterialRequest = z.infer<typeof updateLecturerMaterialRequestSchema>
export type ReserveLecturerMaterialUploadRequest = z.infer<typeof reserveLecturerMaterialUploadRequestSchema>
export type SaveLecturerGradeRequest = z.infer<typeof saveLecturerGradeRequestSchema>
export type LecturerAtRiskStudent = z.infer<typeof lecturerAtRiskStudentSchema>
export type LecturerNotification = z.infer<typeof lecturerNotificationSchema>
export type ResolveLecturerAtRiskRequest = z.infer<typeof resolveLecturerAtRiskRequestSchema>
export type LecturerRoomOption = z.infer<typeof lecturerRoomOptionSchema>
export type LecturerTimetableSlot = z.infer<typeof lecturerTimetableSlotSchema>
export type SaveLecturerTimetableSlotRequest = z.infer<typeof saveLecturerTimetableSlotRequestSchema>
export type UpdateLecturerTimetableSlotRequest = z.infer<typeof updateLecturerTimetableSlotRequestSchema>
export type RequestTimetableChangeRequest = z.infer<typeof requestTimetableChangeRequestSchema>
export type DescribeLecturerMaterialRequest = z.infer<typeof describeLecturerMaterialRequestSchema>
export type LecturerQuestion = z.infer<typeof lecturerQuestionSchema>
export type CreateLecturerQuestionRequest = z.infer<typeof createLecturerQuestionRequestSchema>
export type UpdateLecturerQuestionRequest = z.infer<typeof updateLecturerQuestionRequestSchema>
export type LecturerAssessmentItem = z.infer<typeof lecturerAssessmentItemSchema>
export type SaveLecturerAssessmentItemsRequest = z.infer<typeof saveLecturerAssessmentItemsRequestSchema>
export type GenerateLecturerQuestionsRequest = z.infer<typeof generateLecturerQuestionsRequestSchema>
export type ReserveLecturerQuestionImportRequest = z.infer<typeof reserveLecturerQuestionImportRequestSchema>
