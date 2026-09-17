import type {
  ClassroomJoin,
  ClassroomSessionDetail,
  ClassroomSessionSummary,
  CreateDiscussionPostRequest,
  DiscussionThreadDetail,
  StudentAssessment,
  StudentAssessmentDetail,
  StudentCourseDetail,
  StudentDashboard,
  StudentFees,
  StudentLibraryResource,
  StudentNotification,
  StudentOnboarding,
  StudentProfile,
  StudentReceipt,
  RegisterCoursesRequest,
  StudentRegistrationState,
  StudentResults,
  StudentTranscript,
  StudyAssistantRequest,
  StudyAssistantResponse,
  PaymentMethod,
  SaveTimetableReminderRequest,
  StudentTimetableReminder,
} from '@stackedu/shared'
import { api } from './client'
import { getReaderLibrary } from './library'

export const studentProfileQueryKey = ['student', 'me'] as const
export const studentDashboardQueryKey = ['student', 'dashboard'] as const
export const studentCoursesQueryKey = ['student', 'courses'] as const
export const studentCourseQueryKey = (id: string) => ['student', 'course', id] as const
export const studentRegistrationQueryKey = ['student', 'registration'] as const
export const studentResultsQueryKey = ['student', 'results'] as const
export const studentTranscriptQueryKey = ['student', 'transcript'] as const
export const studentFeesQueryKey = ['student', 'fees'] as const
export const studentNotificationsQueryKey = ['student', 'notifications'] as const
export const studentLibraryQueryKey = ['student', 'library'] as const
export const studentOnboardingQueryKey = ['student', 'onboarding'] as const
export const studentAssessmentsQueryKey = ['student', 'assessments'] as const
export const studentAssessmentQueryKey = (id: string) => ['student', 'assessment', id] as const

export async function getStudentProfile(): Promise<StudentProfile> {
  const { profile } = await api.get<{ profile: StudentProfile }>('/student/me')
  return profile
}

export async function getStudentDashboard(): Promise<StudentDashboard> {
  const { dashboard } = await api.get<{ dashboard: StudentDashboard }>('/student/dashboard')
  return dashboard
}

export async function getStudentCourses() {
  return api.get<{
    semester: { id: string; label: string } | null
    courses: StudentDashboard['courses']
  }>('/student/courses')
}

export async function getStudentCourse(offeringId: string): Promise<StudentCourseDetail> {
  const { course } = await api.get<{ course: StudentCourseDetail }>(
    `/student/courses/${offeringId}`,
  )
  return course
}

export const studentDiscussionQueryKey = (id: string) => ['student', 'discussion', id] as const

export async function getStudentDiscussion(threadId: string): Promise<DiscussionThreadDetail> {
  const { discussion } = await api.get<{ discussion: DiscussionThreadDetail }>(
    `/student/discussions/${threadId}`,
  )
  return discussion
}

export async function createStudentDiscussionPost(
  threadId: string,
  input: CreateDiscussionPostRequest,
): Promise<DiscussionThreadDetail> {
  const { discussion } = await api.post<{ discussion: DiscussionThreadDetail }>(
    `/student/discussions/${threadId}/posts`,
    input,
  )
  return discussion
}

export async function getStudentMaterialDownloadUrl(materialId: string): Promise<{
  url: string
  expiresAt: string
  fileName: string | null
}> {
  const { download } = await api.get<{
    download: { url: string; expiresAt: string; fileName: string | null }
  }>(`/student/materials/${materialId}/download`)
  return download
}

export async function recordStudentMaterialView(materialId: string): Promise<void> {
  await api.post(`/student/materials/${materialId}/view`)
}

export async function getStudentRegistration(): Promise<StudentRegistrationState> {
  const { registration } = await api.get<{ registration: StudentRegistrationState }>(
    '/student/registration',
  )
  return registration
}

export async function registerStudentCourses(input: RegisterCoursesRequest) {
  const { registration } = await api.post<{ registration: StudentRegistrationState }>(
    '/student/registration',
    input,
  )
  return registration
}

export async function saveStudentTimetableReminder(
  input: SaveTimetableReminderRequest,
): Promise<StudentTimetableReminder> {
  const { reminder } = await api.post<{ reminder: StudentTimetableReminder }>(
    '/student/timetable/reminders',
    input,
  )
  return reminder
}

export async function cancelStudentTimetableReminder(slotId: string): Promise<void> {
  await api.delete(`/student/timetable/reminders/${slotId}`)
}

export async function getStudentResults(): Promise<StudentResults> {
  const { results } = await api.get<{ results: StudentResults }>('/student/results')
  return results
}

export async function getStudentTranscript(): Promise<StudentTranscript> {
  const { transcript } = await api.get<{ transcript: StudentTranscript }>('/student/transcript')
  return transcript
}

export async function getStudentFees(): Promise<StudentFees> {
  const { fees } = await api.get<{ fees: StudentFees }>('/student/fees')
  return fees
}

export async function payStudentFees(input: {
  invoiceId?: string
  amount: number
  method: PaymentMethod
  payerPhone?: string
}) {
  const { fees } = await api.post<{ fees: StudentFees }>('/student/fees/pay', input)
  return fees
}

export async function getStudentReceipt(paymentId: string): Promise<StudentReceipt> {
  const { receipt } = await api.get<{ receipt: StudentReceipt }>(
    `/student/payments/${paymentId}/receipt`,
  )
  return receipt
}

export async function getStudentNotifications(): Promise<StudentNotification[]> {
  const { notifications } = await api.get<{ notifications: StudentNotification[] }>(
    '/student/notifications',
  )
  return notifications
}

export async function markStudentNotificationRead(id: string) {
  const { notifications } = await api.post<{ notifications: StudentNotification[] }>(
    `/student/notifications/${id}/read`,
  )
  return notifications
}

export async function getStudentLibrary(query?: string): Promise<StudentLibraryResource[]> {
  return getReaderLibrary('student', query)
}

export async function getStudentOnboarding(): Promise<StudentOnboarding> {
  const { onboarding } = await api.get<{ onboarding: StudentOnboarding }>('/student/onboarding')
  return onboarding
}

export async function saveStudentOnboarding(input: {
  completedSteps: string[]
  currentStep?: string | null
  complete?: boolean
}) {
  const { onboarding } = await api.patch<{ onboarding: StudentOnboarding }>(
    '/student/onboarding',
    input,
  )
  return onboarding
}

export async function getStudentAssessments(): Promise<StudentAssessment[]> {
  const { assessments } = await api.get<{ assessments: StudentAssessment[] }>(
    '/student/assessments',
  )
  return assessments
}

export async function getStudentAssessment(id: string): Promise<StudentAssessmentDetail> {
  const { assessment } = await api.get<{ assessment: StudentAssessmentDetail }>(
    `/student/assessments/${id}`,
  )
  return assessment
}

export async function submitStudentAssessment(
  id: string,
  input: {
    textResponse?: string
    answers?: Array<{ questionVersionId: string; response: string }>
  },
) {
  const { assessments } = await api.post<{ assessments: StudentAssessment[] }>(
    `/student/assessments/${id}/submit`,
    input,
  )
  return assessments
}

export const studentClassroomQueryKey = ['student', 'classroom'] as const
export const studentClassroomSessionQueryKey = (id: string) => ['student', 'classroom-session', id] as const

export async function listStudentClassroomSessions(): Promise<ClassroomSessionSummary[]> {
  const { sessions } = await api.get<{ sessions: ClassroomSessionSummary[] }>('/student/classroom')
  return sessions
}

export async function getStudentClassroomSession(id: string): Promise<ClassroomSessionDetail> {
  const { session } = await api.get<{ session: ClassroomSessionDetail }>(`/student/classroom/${id}`)
  return session
}

export async function joinStudentClassroomSession(id: string): Promise<ClassroomJoin> {
  const { join } = await api.post<{ join: ClassroomJoin }>(`/student/classroom/${id}/join`)
  return join
}

export async function getStudentClassroomWhiteboard(id: string): Promise<unknown> {
  const { scene } = await api.get<{ scene: unknown }>(`/student/classroom/${id}/whiteboard`)
  return scene
}

export async function saveStudentClassroomWhiteboard(id: string, scene: unknown): Promise<void> {
  await api.put(`/student/classroom/${id}/whiteboard`, { scene })
}

export async function getStudentRecordingDownloadUrl(id: string): Promise<{
  url: string
  expiresAt: string
  fileName: string
}> {
  const { download } = await api.get<{ download: { url: string; expiresAt: string; fileName: string } }>(
    `/student/recordings/${id}/download`,
  )
  return download
}

export async function askStudentStudyAssistant(input: StudyAssistantRequest): Promise<StudyAssistantResponse> {
  const { answer } = await api.post<{ answer: StudyAssistantResponse }>('/student/study-assistant', input)
  return answer
}
