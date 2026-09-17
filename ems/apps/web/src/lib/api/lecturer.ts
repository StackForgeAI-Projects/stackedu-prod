import type {
  ClassroomJoin,
  ClassroomSessionDetail,
  ClassroomSessionSummary,
  CourseAnalytics,
  CreateClassroomSessionRequest,
  CreateLecturerDiscussionRequest,
  CreateDiscussionPostRequest,
  DiscussionThreadDetail,
  DiscussionThreadSummary,
  UpdateLecturerDiscussionRequest,
  CreateLecturerAnnouncementRequest,
  CreateLecturerAssessmentRequest,
  CreateLecturerMaterialRequest,
  CreateLecturerModuleRequest,
  CreateLecturerQuestionRequest,
  GenerateLecturerQuestionsRequest,
  LecturerAssessmentDetail,
  LecturerAssessmentItem,
  LecturerAssessmentRow,
  LecturerQuestion,
  LecturerAttendanceDetail,
  LecturerAttendanceSession,
  LecturerAtRiskStudent,
  LecturerCourseAnnouncement,
  LecturerCourseDetail,
  LecturerCourseMaterial,
  LecturerCourseModule,
  LecturerCourseRow,
  LecturerDashboard,
  LecturerNotification,
  LecturerProfile,
  LecturerResultBatch,
  LecturerRoomOption,
  LecturerTimetableSlot,
  ResolveLecturerAtRiskRequest,
  ReserveLecturerMaterialUploadRequest,
  ReserveLecturerQuestionImportRequest,
  SaveLecturerAttendanceRequest,
  SaveLecturerGradeRequest,
  SaveLecturerResultsRequest,
  SaveLecturerAssessmentItemsRequest,
  SaveLecturerTimetableSlotRequest,
  UpdateLecturerAnnouncementRequest,
  UpdateLecturerMaterialRequest,
  UpdateLecturerModuleRequest,
  UpdateLecturerQuestionRequest,
  UpdateLecturerTimetableSlotRequest,
} from '@stackedu/shared'
import { mimeTypeForImportFile, mimeTypeForMaterialFile } from '@stackedu/shared'
import { api, ApiClientError } from './client'

export const lecturerProfileQueryKey = ['lecturer', 'me'] as const
export const lecturerDashboardQueryKey = ['lecturer', 'dashboard'] as const
export const lecturerCoursesQueryKey = ['lecturer', 'courses'] as const
export const lecturerCourseQueryKey = (id: string) => ['lecturer', 'course', id] as const
export const lecturerAttendanceQueryKey = (offeringId?: string) =>
  ['lecturer', 'attendance', offeringId ?? 'all'] as const
export const lecturerAttendanceSessionQueryKey = (id: string) => ['lecturer', 'attendance-session', id] as const
export const lecturerResultsQueryKey = (offeringId: string) => ['lecturer', 'results', offeringId] as const
export const lecturerAssessmentsQueryKey = (offeringId?: string) =>
  ['lecturer', 'assessments', offeringId ?? 'all'] as const
export const lecturerAssessmentQueryKey = (id: string) => ['lecturer', 'assessment', id] as const
export const lecturerAtRiskQueryKey = ['lecturer', 'at-risk'] as const
export const lecturerNotificationsQueryKey = ['lecturer', 'notifications'] as const
export const lecturerTimetableQueryKey = ['lecturer', 'timetable'] as const
export const lecturerRoomsQueryKey = ['lecturer', 'rooms'] as const
export const lecturerQuestionsQueryKey = (filter?: { courseId?: string; topic?: string }) =>
  ['lecturer', 'questions', filter?.courseId ?? 'all', filter?.topic ?? 'all'] as const
export const lecturerAssessmentItemsQueryKey = (id: string) => ['lecturer', 'assessment-items', id] as const

export async function getLecturerProfile(): Promise<LecturerProfile> {
  const { profile } = await api.get<{ profile: LecturerProfile }>('/lecturer/me')
  return profile
}

export async function getLecturerDashboard(): Promise<LecturerDashboard> {
  const { dashboard } = await api.get<{ dashboard: LecturerDashboard }>('/lecturer/dashboard')
  return dashboard
}

export async function listLecturerCourses(): Promise<LecturerCourseRow[]> {
  const { courses } = await api.get<{ courses: LecturerCourseRow[] }>('/lecturer/courses')
  return courses
}

export async function getLecturerCourse(offeringId: string): Promise<LecturerCourseDetail> {
  const { course } = await api.get<{ course: LecturerCourseDetail }>(`/lecturer/courses/${offeringId}`)
  return course
}

export async function createLecturerMaterial(
  input: CreateLecturerMaterialRequest,
): Promise<LecturerCourseMaterial> {
  const { material } = await api.post<{ material: LecturerCourseMaterial }>(
    '/lecturer/materials',
    input,
  )
  return material
}

export async function updateLecturerMaterial(
  materialId: string,
  input: UpdateLecturerMaterialRequest,
): Promise<LecturerCourseMaterial> {
  const { material } = await api.patch<{ material: LecturerCourseMaterial }>(
    `/lecturer/materials/${materialId}`,
    input,
  )
  return material
}

export async function deleteLecturerMaterial(materialId: string): Promise<void> {
  await api.delete(`/lecturer/materials/${materialId}`)
}

export async function getLecturerMaterialDownloadUrl(materialId: string): Promise<{
  url: string
  expiresAt: string
  fileName: string | null
}> {
  const { download } = await api.get<{
    download: { url: string; expiresAt: string; fileName: string | null }
  }>(`/lecturer/materials/${materialId}/download`)
  return download
}

export async function uploadLecturerMaterialFile(input: {
  offeringId: string
  file: File
}): Promise<{ fileKey: string; mimeType: string; fileSizeBytes: number }> {
  const mimeType = mimeTypeForMaterialFile(input.file)
  const payload: ReserveLecturerMaterialUploadRequest = {
    offeringId: input.offeringId,
    fileName: input.file.name,
    mimeType,
    fileSizeBytes: input.file.size,
  }
  const { upload } = await api.post<{
    upload: ReserveLecturerMaterialUploadRequest & {
      fileKey: string
      uploadUrl: string
      uploadMethod: 'PUT'
      headers: Record<string, string>
    }
  }>('/lecturer/materials/upload-target', payload)

  const response = await fetch(upload.uploadUrl, {
    method: upload.uploadMethod,
    headers: upload.headers,
    body: input.file,
  })
  if (!response.ok) {
    throw new ApiClientError('INTERNAL_ERROR', response.status, 'We could not upload that file. Please try again.')
  }

  return { fileKey: upload.fileKey, mimeType, fileSizeBytes: input.file.size }
}

export async function describeLecturerMaterial(input: {
  title?: string
  externalUrl?: string
  fileKey?: string
  fileName?: string
  mimeType?: string
}): Promise<string> {
  const { description } = await api.post<{ description: string }>('/lecturer/materials/describe', input)
  return description
}

export async function createLecturerModule(
  input: CreateLecturerModuleRequest,
): Promise<LecturerCourseModule> {
  const { module } = await api.post<{ module: LecturerCourseModule }>('/lecturer/modules', input)
  return module
}

export async function updateLecturerModule(
  moduleId: string,
  input: UpdateLecturerModuleRequest,
): Promise<LecturerCourseModule> {
  const { module } = await api.patch<{ module: LecturerCourseModule }>(
    `/lecturer/modules/${moduleId}`,
    input,
  )
  return module
}

export async function deleteLecturerModule(moduleId: string): Promise<void> {
  await api.delete(`/lecturer/modules/${moduleId}`)
}

export async function createLecturerAnnouncement(
  input: CreateLecturerAnnouncementRequest,
): Promise<LecturerCourseAnnouncement> {
  const { announcement } = await api.post<{ announcement: LecturerCourseAnnouncement }>(
    '/lecturer/announcements',
    input,
  )
  return announcement
}

export async function updateLecturerAnnouncement(
  announcementId: string,
  input: UpdateLecturerAnnouncementRequest,
): Promise<LecturerCourseAnnouncement> {
  const { announcement } = await api.patch<{ announcement: LecturerCourseAnnouncement }>(
    `/lecturer/announcements/${announcementId}`,
    input,
  )
  return announcement
}

export async function deleteLecturerAnnouncement(announcementId: string): Promise<void> {
  await api.delete(`/lecturer/announcements/${announcementId}`)
}

export async function createLecturerDiscussion(
  input: CreateLecturerDiscussionRequest,
): Promise<DiscussionThreadSummary> {
  const { discussion } = await api.post<{ discussion: DiscussionThreadSummary }>('/lecturer/discussions', input)
  return discussion
}

export async function getLecturerDiscussion(threadId: string): Promise<DiscussionThreadDetail> {
  const { discussion } = await api.get<{ discussion: DiscussionThreadDetail }>(`/lecturer/discussions/${threadId}`)
  return discussion
}

export async function updateLecturerDiscussion(
  threadId: string,
  input: UpdateLecturerDiscussionRequest,
): Promise<DiscussionThreadSummary> {
  const { discussion } = await api.patch<{ discussion: DiscussionThreadSummary }>(
    `/lecturer/discussions/${threadId}`,
    input,
  )
  return discussion
}

export async function deleteLecturerDiscussion(threadId: string): Promise<void> {
  await api.delete(`/lecturer/discussions/${threadId}`)
}

export async function createLecturerDiscussionPost(
  threadId: string,
  input: CreateDiscussionPostRequest,
): Promise<DiscussionThreadDetail> {
  const { discussion } = await api.post<{ discussion: DiscussionThreadDetail }>(
    `/lecturer/discussions/${threadId}/posts`,
    input,
  )
  return discussion
}

export async function listLecturerAttendance(offeringId?: string): Promise<LecturerAttendanceSession[]> {
  const query = offeringId ? `?offeringId=${encodeURIComponent(offeringId)}` : ''
  const { sessions } = await api.get<{ sessions: LecturerAttendanceSession[] }>(`/lecturer/attendance${query}`)
  return sessions
}

export async function getLecturerAttendanceSession(sessionId: string): Promise<LecturerAttendanceDetail> {
  const { session } = await api.get<{ session: LecturerAttendanceDetail }>(`/lecturer/attendance/${sessionId}`)
  return session
}

export async function saveLecturerAttendance(
  input: SaveLecturerAttendanceRequest,
): Promise<LecturerAttendanceDetail> {
  const { session } = await api.post<{ session: LecturerAttendanceDetail }>('/lecturer/attendance', input)
  return session
}

export async function deleteLecturerAttendanceSession(sessionId: string): Promise<LecturerAttendanceSession[]> {
  const { sessions } = await api.delete<{ sessions: LecturerAttendanceSession[] }>(
    `/lecturer/attendance/${sessionId}`,
  )
  return sessions
}

export async function getLecturerResults(offeringId: string): Promise<LecturerResultBatch> {
  const { results } = await api.get<{ results: LecturerResultBatch }>(`/lecturer/results/${offeringId}`)
  return results
}

export async function saveLecturerResults(
  offeringId: string,
  input: SaveLecturerResultsRequest,
): Promise<LecturerResultBatch> {
  const { results } = await api.patch<{ results: LecturerResultBatch }>(`/lecturer/results/${offeringId}`, input)
  return results
}

export async function submitLecturerResults(offeringId: string): Promise<LecturerResultBatch> {
  const { results } = await api.post<{ results: LecturerResultBatch }>(
    `/lecturer/results/${offeringId}/submit`,
    {},
  )
  return results
}

export async function listLecturerAssessments(offeringId?: string): Promise<LecturerAssessmentRow[]> {
  const query = offeringId ? `?offeringId=${encodeURIComponent(offeringId)}` : ''
  const { assessments } = await api.get<{ assessments: LecturerAssessmentRow[] }>(
    `/lecturer/assessments${query}`,
  )
  return assessments
}

export async function createLecturerAssessment(
  input: CreateLecturerAssessmentRequest,
): Promise<LecturerAssessmentRow> {
  const { assessment } = await api.post<{ assessment: LecturerAssessmentRow }>('/lecturer/assessments', input)
  return assessment
}

export async function deleteLecturerAssessment(assessmentId: string): Promise<void> {
  await api.delete(`/lecturer/assessments/${assessmentId}`)
}

export async function getLecturerAssessment(id: string): Promise<LecturerAssessmentDetail> {
  const { assessment } = await api.get<{ assessment: LecturerAssessmentDetail }>(`/lecturer/assessments/${id}`)
  return assessment
}

export async function listLecturerQuestions(filter?: {
  courseId?: string
  topic?: string
}): Promise<LecturerQuestion[]> {
  const params = new URLSearchParams()
  if (filter?.courseId) params.set('courseId', filter.courseId)
  if (filter?.topic) params.set('topic', filter.topic)
  const query = params.toString() ? `?${params.toString()}` : ''
  const { questions } = await api.get<{ questions: LecturerQuestion[] }>(`/lecturer/questions${query}`)
  return questions
}

export async function createLecturerQuestion(
  input: CreateLecturerQuestionRequest,
): Promise<LecturerQuestion> {
  const { question } = await api.post<{ question: LecturerQuestion }>('/lecturer/questions', input)
  return question
}

export async function updateLecturerQuestion(
  questionId: string,
  input: UpdateLecturerQuestionRequest,
): Promise<LecturerQuestion> {
  const { question } = await api.patch<{ question: LecturerQuestion }>(
    `/lecturer/questions/${questionId}`,
    input,
  )
  return question
}

export async function deleteLecturerQuestion(questionId: string): Promise<void> {
  await api.delete(`/lecturer/questions/${questionId}`)
}

export async function uploadLecturerQuestionImport(file: File): Promise<{
  fileKey: string
  mimeType: string
  fileSizeBytes: number
  fileName: string
}> {
  const mimeType = mimeTypeForImportFile(file)
  const payload: ReserveLecturerQuestionImportRequest = {
    fileName: file.name,
    mimeType,
    fileSizeBytes: file.size,
  }
  const { upload } = await api.post<{
    upload: ReserveLecturerQuestionImportRequest & {
      fileKey: string
      uploadUrl: string
      uploadMethod: 'PUT'
      headers: Record<string, string>
    }
  }>('/lecturer/questions/upload-target', payload)

  const response = await fetch(upload.uploadUrl, {
    method: upload.uploadMethod,
    headers: upload.headers,
    body: file,
  })
  if (!response.ok) {
    throw new ApiClientError('INTERNAL_ERROR', response.status, 'We could not upload that file. Please try again.')
  }
  return { fileKey: upload.fileKey, mimeType, fileSizeBytes: file.size, fileName: file.name }
}

export async function generateLecturerQuestions(input: GenerateLecturerQuestionsRequest): Promise<{
  questions: LecturerQuestion[]
  assessment: LecturerAssessmentRow | null
}> {
  return api.post<{ questions: LecturerQuestion[]; assessment: LecturerAssessmentRow | null }>(
    '/lecturer/questions/generate',
    input,
  )
}

export async function listLecturerAssessmentItems(assessmentId: string): Promise<LecturerAssessmentItem[]> {
  const { items } = await api.get<{ items: LecturerAssessmentItem[] }>(
    `/lecturer/assessments/${assessmentId}/items`,
  )
  return items
}

export async function saveLecturerAssessmentItems(
  assessmentId: string,
  input: SaveLecturerAssessmentItemsRequest,
): Promise<LecturerAssessmentItem[]> {
  const { items } = await api.put<{ items: LecturerAssessmentItem[] }>(
    `/lecturer/assessments/${assessmentId}/items`,
    input,
  )
  return items
}

export async function saveLecturerGrade(
  assessmentId: string,
  input: SaveLecturerGradeRequest,
): Promise<LecturerAssessmentDetail> {
  const { assessment } = await api.post<{ assessment: LecturerAssessmentDetail }>(
    `/lecturer/assessments/${assessmentId}/grades`,
    input,
  )
  return assessment
}

export async function listLecturerAtRiskStudents(): Promise<LecturerAtRiskStudent[]> {
  const { students } = await api.get<{ students: LecturerAtRiskStudent[] }>('/lecturer/at-risk')
  return students
}

export async function resolveLecturerAtRisk(
  id: string,
  input: ResolveLecturerAtRiskRequest,
): Promise<LecturerAtRiskStudent[]> {
  const { students } = await api.post<{ students: LecturerAtRiskStudent[] }>(
    `/lecturer/at-risk/${id}/resolve`,
    input,
  )
  return students
}

export async function listLecturerNotifications(): Promise<LecturerNotification[]> {
  const { notifications } = await api.get<{ notifications: LecturerNotification[] }>('/lecturer/notifications')
  return notifications
}

export async function markLecturerNotificationRead(id: string): Promise<LecturerNotification[]> {
  const { notifications } = await api.post<{ notifications: LecturerNotification[] }>(
    `/lecturer/notifications/${id}/read`,
    {},
  )
  return notifications
}

export async function markAllLecturerNotificationsRead(): Promise<LecturerNotification[]> {
  const { notifications } = await api.post<{ notifications: LecturerNotification[] }>(
    '/lecturer/notifications/read-all',
    {},
  )
  return notifications
}

export async function listLecturerTimetableSlots(): Promise<LecturerTimetableSlot[]> {
  const { slots } = await api.get<{ slots: LecturerTimetableSlot[] }>('/lecturer/timetable')
  return slots
}

export async function listLecturerRooms(): Promise<LecturerRoomOption[]> {
  const { rooms } = await api.get<{ rooms: LecturerRoomOption[] }>('/lecturer/rooms')
  return rooms
}

export async function createLecturerTimetableSlot(
  input: SaveLecturerTimetableSlotRequest,
): Promise<LecturerTimetableSlot> {
  const { slot } = await api.post<{ slot: LecturerTimetableSlot }>('/lecturer/timetable', input)
  return slot
}

export async function updateLecturerTimetableSlot(
  slotId: string,
  input: UpdateLecturerTimetableSlotRequest,
): Promise<LecturerTimetableSlot> {
  const { slot } = await api.patch<{ slot: LecturerTimetableSlot }>(`/lecturer/timetable/${slotId}`, input)
  return slot
}

export async function deleteLecturerTimetableSlot(slotId: string): Promise<LecturerTimetableSlot[]> {
  const { slots } = await api.delete<{ slots: LecturerTimetableSlot[] }>(`/lecturer/timetable/${slotId}`)
  return slots
}

export const lecturerClassroomQueryKey = (offeringId?: string) =>
  ['lecturer', 'classroom', offeringId ?? 'all'] as const
export const lecturerClassroomSessionQueryKey = (id: string) => ['lecturer', 'classroom-session', id] as const
export const lecturerCourseAnalyticsQueryKey = (offeringId: string) =>
  ['lecturer', 'course-analytics', offeringId] as const

export async function listLecturerClassroomSessions(offeringId?: string): Promise<ClassroomSessionSummary[]> {
  const query = offeringId ? `?offeringId=${encodeURIComponent(offeringId)}` : ''
  const { sessions } = await api.get<{ sessions: ClassroomSessionSummary[] }>(`/lecturer/classroom${query}`)
  return sessions
}

export async function createLecturerClassroomSession(
  input: CreateClassroomSessionRequest,
): Promise<ClassroomSessionDetail> {
  const { session } = await api.post<{ session: ClassroomSessionDetail }>('/lecturer/classroom', input)
  return session
}

export async function getLecturerClassroomSession(id: string): Promise<ClassroomSessionDetail> {
  const { session } = await api.get<{ session: ClassroomSessionDetail }>(`/lecturer/classroom/${id}`)
  return session
}

export async function startLecturerClassroomSession(id: string): Promise<ClassroomSessionDetail> {
  const { session } = await api.post<{ session: ClassroomSessionDetail }>(`/lecturer/classroom/${id}/start`)
  return session
}

export async function endLecturerClassroomSession(id: string): Promise<ClassroomSessionDetail> {
  const { session } = await api.post<{ session: ClassroomSessionDetail }>(`/lecturer/classroom/${id}/end`)
  return session
}

export async function cancelLecturerClassroomSession(id: string): Promise<void> {
  await api.post(`/lecturer/classroom/${id}/cancel`)
}

export async function joinLecturerClassroomSession(id: string): Promise<ClassroomJoin> {
  const { join } = await api.post<{ join: ClassroomJoin }>(`/lecturer/classroom/${id}/join`)
  return join
}

export async function startLecturerRecording(id: string): Promise<ClassroomSessionDetail> {
  const { session } = await api.post<{ session: ClassroomSessionDetail }>(`/lecturer/classroom/${id}/record/start`)
  return session
}

export async function stopLecturerRecording(id: string): Promise<ClassroomSessionDetail> {
  const { session } = await api.post<{ session: ClassroomSessionDetail }>(`/lecturer/classroom/${id}/record/stop`)
  return session
}

export async function draftLecturerClassroomSummary(id: string): Promise<ClassroomSessionDetail> {
  const { session } = await api.post<{ session: ClassroomSessionDetail }>(`/lecturer/classroom/${id}/summary`)
  return session
}

export async function publishLecturerClassroomSummary(id: string): Promise<ClassroomSessionDetail> {
  const { session } = await api.post<{ session: ClassroomSessionDetail }>(
    `/lecturer/classroom/${id}/summary/publish`,
  )
  return session
}

export async function getLecturerClassroomWhiteboard(id: string): Promise<unknown> {
  const { scene } = await api.get<{ scene: unknown }>(`/lecturer/classroom/${id}/whiteboard`)
  return scene
}

export async function saveLecturerClassroomWhiteboard(id: string, scene: unknown): Promise<void> {
  await api.put(`/lecturer/classroom/${id}/whiteboard`, { scene })
}

export async function getLecturerRecordingDownloadUrl(id: string): Promise<{
  url: string
  expiresAt: string
  fileName: string
}> {
  const { download } = await api.get<{ download: { url: string; expiresAt: string; fileName: string } }>(
    `/lecturer/recordings/${id}/download`,
  )
  return download
}

export async function getLecturerCourseAnalytics(offeringId: string): Promise<CourseAnalytics> {
  const { analytics } = await api.get<{ analytics: CourseAnalytics }>(`/lecturer/analytics/${offeringId}`)
  return analytics
}
