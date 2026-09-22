import { z } from 'zod'
import { liveSessionStatusSchema, recordingStatusSchema, userRoleSchema } from '../enums'
import { isoDateTimeSchema, uuidSchema } from '../primitives'

export const classroomSessionSummarySchema = z.object({
  id: uuidSchema,
  offeringId: uuidSchema,
  courseCode: z.string(),
  courseName: z.string(),
  title: z.string(),
  status: liveSessionStatusSchema,
  scheduledAt: isoDateTimeSchema.nullable(),
  startedAt: isoDateTimeSchema.nullable(),
  endedAt: isoDateTimeSchema.nullable(),
  participantCount: z.number().int().nonnegative(),
  hasRecording: z.boolean(),
  hasSummary: z.boolean(),
  summaryPublished: z.boolean(),
})

export const classroomRecordingSchema = z.object({
  id: uuidSchema,
  status: recordingStatusSchema,
  durationSeconds: z.number().int().nonnegative().nullable(),
  byteSize: z.number().int().nonnegative().nullable(),
  createdAt: isoDateTimeSchema,
  expiresAt: isoDateTimeSchema.nullable(),
})

export const classroomSessionDetailSchema = classroomSessionSummarySchema.extend({
  roomName: z.string(),
  summaryText: z.string().nullable(),
  recordings: z.array(classroomRecordingSchema),
  mediaConfigured: z.boolean(),
  collabConfigured: z.boolean(),
})

export const classroomJoinSchema = z.object({
  session: classroomSessionDetailSchema,
  media: z.object({
    url: z.string(),
    token: z.string(),
    roomName: z.string(),
  }).nullable(),
  collab: z.object({
    url: z.string(),
    token: z.string(),
    documentName: z.string(),
  }).nullable(),
  displayName: z.string(),
  role: z.enum(['host', 'participant']),
})

export const createClassroomSessionRequestSchema = z.object({
  offeringId: uuidSchema,
  title: z.string().trim().min(2).max(200),
  scheduledAt: isoDateTimeSchema.optional(),
})

export const saveClassroomWhiteboardRequestSchema = z.object({
  scene: z.unknown(),
})

export const studyAssistantRequestSchema = z.object({
  offeringId: uuidSchema,
  message: z.string().trim().min(2).max(2000),
})

export const studyAssistantCitationSchema = z.object({
  title: z.string(),
  kind: z.enum(['material', 'library']),
})

export const studyAssistantResponseSchema = z.object({
  reply: z.string(),
  citations: z.array(studyAssistantCitationSchema),
  refused: z.boolean(),
})

export const courseAnalyticsStudentSchema = z.object({
  studentId: uuidSchema,
  studentNumber: z.string(),
  name: z.string(),
  attendanceRate: z.number().nullable(),
  materialsOpened: z.number().int().nonnegative(),
  materialsTotal: z.number().int().nonnegative(),
  engagementRate: z.number().nullable(),
  averageScore: z.number().nullable(),
  feeBalance: z.number().int(),
  riskLevel: z.string().nullable(),
})

export const courseGradeBucketSchema = z.object({
  label: z.string(),
  count: z.number().int().nonnegative(),
})

export const courseAssessmentAnalyticsSchema = z.object({
  id: uuidSchema,
  title: z.string(),
  type: z.string(),
  dueAt: isoDateTimeSchema.nullable(),
  averageScore: z.number().nullable(),
  highScore: z.number().nullable(),
  lowScore: z.number().nullable(),
  gradedCount: z.number().int().nonnegative(),
  distribution: z.array(courseGradeBucketSchema),
})

export const courseAnalyticsSchema = z.object({
  offeringId: uuidSchema,
  courseCode: z.string(),
  courseName: z.string(),
  enrolled: z.number().int().nonnegative(),
  averageAttendance: z.number().nullable(),
  averageEngagement: z.number().nullable(),
  averageScore: z.number().nullable(),
  atRiskCount: z.number().int().nonnegative(),
  students: z.array(courseAnalyticsStudentSchema),
  assessments: z.array(courseAssessmentAnalyticsSchema),
})

export const studentEngagementRowSchema = z.object({
  offeringId: uuidSchema,
  courseCode: z.string(),
  courseName: z.string(),
  attendanceRate: z.number().nullable(),
  engagementRate: z.number().nullable(),
  averageScore: z.number().nullable(),
  feeBalance: z.number().int(),
  riskLevel: z.string().nullable(),
})

export type ClassroomSessionSummary = z.infer<typeof classroomSessionSummarySchema>
export type ClassroomSessionDetail = z.infer<typeof classroomSessionDetailSchema>
export type ClassroomJoin = z.infer<typeof classroomJoinSchema>
export type CreateClassroomSessionRequest = z.infer<typeof createClassroomSessionRequestSchema>
export type StudyAssistantRequest = z.infer<typeof studyAssistantRequestSchema>
export type StudyAssistantResponse = z.infer<typeof studyAssistantResponseSchema>
export type CourseAnalytics = z.infer<typeof courseAnalyticsSchema>
export type StudentEngagementRow = z.infer<typeof studentEngagementRowSchema>
export type ClassroomRecording = z.infer<typeof classroomRecordingSchema>
export type UserRoleForClassroom = z.infer<typeof userRoleSchema>
