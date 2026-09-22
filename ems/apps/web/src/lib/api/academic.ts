import type {
  AcademicAtRiskStudent,
  AcademicCalendarEvent,
  AcademicCourseRow,
  AcademicDashboard,
  AcademicLecturerRow,
  AcademicNotification,
  AcademicProfile,
  AcademicProgrammeDetail,
  AcademicProgrammeRow,
  AcademicReports,
  AcademicResultBatch,
  AcademicSemesterOption,
  AcademicStudentDetail,
  AcademicStudentRow,
  AcademicTimetableSlot,
  AskLecturerTimetableSlotRequest,
  CreateAcademicTimetableSlotRequest,
  LecturerRoomOption,
  UpdateAcademicTimetableSlotRequest,
  AcademicDepartmentOption,
  CreateAcademicCalendarEventRequest,
  CreateAcademicCourseRequest,
  CreateAcademicProgrammeRequest,
  ChangeAcademicStudentStatusRequest,
  BulkCreateAcademicCoursesRequest,
  RejectResultBatchRequest,
  StudentEngagementRow,
  UpdateAcademicCalendarEventRequest,
  UpdateAcademicCourseRequest,
  UpdateAcademicProgrammeRequest,
} from '@stackedu/shared'
import { api } from './client'

export const academicProfileQueryKey = ['academic', 'me'] as const
export const academicDashboardQueryKey = ['academic', 'dashboard'] as const
export const academicStudentsQueryKey = ['academic', 'students'] as const
export const academicStudentQueryKey = (id: string) => ['academic', 'student', id] as const
export const academicStudentEngagementQueryKey = (id: string) => ['academic', 'student-engagement', id] as const
export const academicCoursesQueryKey = ['academic', 'courses'] as const
export const academicProgrammesQueryKey = ['academic', 'programmes'] as const
export const academicProgrammeQueryKey = (id: string) => ['academic', 'programme', id] as const
export const academicCalendarQueryKey = ['academic', 'calendar'] as const
export const academicTimetableQueryKey = ['academic', 'timetable'] as const
export const academicRoomsQueryKey = ['academic', 'rooms'] as const
export const academicLecturersQueryKey = ['academic', 'lecturers'] as const
export const academicDepartmentsQueryKey = ['academic', 'departments'] as const
export const academicSemestersQueryKey = ['academic', 'semesters'] as const
export const academicResultsQueryKey = (semesterId?: string, status?: string) =>
  ['academic', 'results', semesterId ?? 'all', status ?? 'all'] as const
export const academicAtRiskQueryKey = ['academic', 'at-risk'] as const
export const academicNotificationsQueryKey = ['academic', 'notifications'] as const
export const academicReportsQueryKey = (type: string) => ['academic', 'reports', type] as const

export async function getAcademicProfile(): Promise<AcademicProfile> {
  const { profile } = await api.get<{ profile: AcademicProfile }>('/academic/me')
  return profile
}

export async function getAcademicDashboard(): Promise<AcademicDashboard> {
  const { dashboard } = await api.get<{ dashboard: AcademicDashboard }>('/academic/dashboard')
  return dashboard
}

export async function listAcademicStudents(): Promise<AcademicStudentRow[]> {
  const { students } = await api.get<{ students: AcademicStudentRow[] }>('/academic/students')
  return students
}

export async function getAcademicStudent(id: string): Promise<AcademicStudentDetail> {
  const { student } = await api.get<{ student: AcademicStudentDetail }>(`/academic/students/${id}`)
  return student
}

export async function getAcademicStudentEngagement(id: string): Promise<StudentEngagementRow[]> {
  const { engagement } = await api.get<{ engagement: StudentEngagementRow[] }>(
    `/academic/students/${id}/engagement`,
  )
  return engagement
}

export async function changeAcademicStudentStatus(
  id: string,
  input: ChangeAcademicStudentStatusRequest,
): Promise<AcademicStudentDetail> {
  const { student } = await api.post<{ student: AcademicStudentDetail }>(
    `/academic/students/${id}/status`,
    input,
  )
  return student
}

export async function listAcademicCourses(): Promise<AcademicCourseRow[]> {
  const { courses } = await api.get<{ courses: AcademicCourseRow[] }>('/academic/courses')
  return courses
}

export async function listAcademicProgrammes(): Promise<AcademicProgrammeRow[]> {
  const { programmes } = await api.get<{ programmes: AcademicProgrammeRow[] }>('/academic/programmes')
  return programmes
}

export async function getAcademicProgramme(id: string): Promise<AcademicProgrammeDetail> {
  const { programme } = await api.get<{ programme: AcademicProgrammeDetail }>(`/academic/programmes/${id}`)
  return programme
}

export async function listAcademicCalendarEvents(): Promise<AcademicCalendarEvent[]> {
  const { events } = await api.get<{ events: AcademicCalendarEvent[] }>('/academic/calendar')
  return events
}

export async function listAcademicTimetableSlots(): Promise<AcademicTimetableSlot[]> {
  const { slots } = await api.get<{ slots: AcademicTimetableSlot[] }>('/academic/timetable')
  return slots
}

export async function listAcademicRooms(): Promise<LecturerRoomOption[]> {
  const { rooms } = await api.get<{ rooms: LecturerRoomOption[] }>('/academic/rooms')
  return rooms
}

export async function createAcademicTimetableSlot(
  input: CreateAcademicTimetableSlotRequest,
): Promise<AcademicTimetableSlot> {
  const { slot } = await api.post<{ slot: AcademicTimetableSlot }>('/academic/timetable', input)
  return slot
}

export async function updateAcademicTimetableSlot(
  slotId: string,
  input: UpdateAcademicTimetableSlotRequest,
): Promise<AcademicTimetableSlot> {
  const { slot } = await api.patch<{ slot: AcademicTimetableSlot }>(`/academic/timetable/${slotId}`, input)
  return slot
}

export async function deleteAcademicTimetableSlot(slotId: string): Promise<void> {
  await api.delete(`/academic/timetable/${slotId}`)
}

export async function askLecturerToFreeTimetableSlot(
  slotId: string,
  input: AskLecturerTimetableSlotRequest,
): Promise<{ lecturerName: string }> {
  const { lecturerName } = await api.post<{ ok: true; lecturerName: string }>(
    `/academic/timetable/${slotId}/ask-lecturer`,
    input,
  )
  return { lecturerName }
}

export async function listAcademicLecturers(): Promise<AcademicLecturerRow[]> {
  const { lecturers } = await api.get<{ lecturers: AcademicLecturerRow[] }>('/academic/lecturers')
  return lecturers
}

export async function listAcademicDepartments(): Promise<AcademicDepartmentOption[]> {
  const { departments } = await api.get<{ departments: AcademicDepartmentOption[] }>('/academic/departments')
  return departments
}

export async function listAcademicSemesters(): Promise<AcademicSemesterOption[]> {
  const { semesters } = await api.get<{ semesters: AcademicSemesterOption[] }>('/academic/semesters')
  return semesters
}

export async function listAcademicResultBatches(params?: {
  semesterId?: string
  status?: string
}): Promise<AcademicResultBatch[]> {
  const search = new URLSearchParams()
  if (params?.semesterId) search.set('semesterId', params.semesterId)
  if (params?.status) search.set('status', params.status)
  const qs = search.toString()
  const { batches } = await api.get<{ batches: AcademicResultBatch[] }>(
    `/academic/results${qs ? `?${qs}` : ''}`,
  )
  return batches
}

export async function approveAcademicResultBatch(id: string): Promise<AcademicResultBatch> {
  const { batch } = await api.post<{ batch: AcademicResultBatch }>(`/academic/results/${id}/approve`)
  return batch
}

export async function rejectAcademicResultBatch(
  id: string,
  input: RejectResultBatchRequest,
): Promise<AcademicResultBatch> {
  const { batch } = await api.post<{ batch: AcademicResultBatch }>(
    `/academic/results/${id}/reject`,
    input,
  )
  return batch
}

export async function listAcademicAtRiskStudents(): Promise<AcademicAtRiskStudent[]> {
  const { students } = await api.get<{ students: AcademicAtRiskStudent[] }>('/academic/at-risk')
  return students
}

export async function listAcademicNotifications(): Promise<AcademicNotification[]> {
  const { notifications } = await api.get<{ notifications: AcademicNotification[] }>(
    '/academic/notifications',
  )
  return notifications
}

export async function markAcademicNotificationRead(id: string): Promise<void> {
  await api.post(`/academic/notifications/${id}/read`)
}

export async function getAcademicReports(type: AcademicReports['type']): Promise<AcademicReports> {
  const { reports } = await api.get<{ reports: AcademicReports }>(`/academic/reports?type=${type}`)
  return reports
}

export async function createAcademicProgramme(input: CreateAcademicProgrammeRequest): Promise<AcademicProgrammeRow> {
  const { programme } = await api.post<{ programme: AcademicProgrammeRow }>('/academic/programmes', input)
  return programme
}

export async function updateAcademicProgramme(id: string, input: UpdateAcademicProgrammeRequest): Promise<AcademicProgrammeRow> {
  const { programme } = await api.patch<{ programme: AcademicProgrammeRow }>(`/academic/programmes/${id}`, input)
  return programme
}

export async function createAcademicCourse(input: CreateAcademicCourseRequest): Promise<AcademicCourseRow> {
  const { course } = await api.post<{ course: AcademicCourseRow }>('/academic/courses', input)
  return course
}

export async function bulkCreateAcademicCourses(
  input: BulkCreateAcademicCoursesRequest,
): Promise<{ created: number; failed: Array<{ code: string; error: string }> }> {
  const { result } = await api.post<{ result: { created: number; failed: Array<{ code: string; error: string }> } }>(
    '/academic/courses/bulk',
    input,
  )
  return result
}

export async function updateAcademicCourse(id: string, input: UpdateAcademicCourseRequest): Promise<AcademicCourseRow> {
  const { course } = await api.patch<{ course: AcademicCourseRow }>(`/academic/courses/${id}`, input)
  return course
}

export async function deleteAcademicCourse(id: string): Promise<void> {
  await api.delete(`/academic/courses/${id}`)
}

export async function createAcademicCalendarEvent(input: CreateAcademicCalendarEventRequest): Promise<AcademicCalendarEvent> {
  const { event } = await api.post<{ event: AcademicCalendarEvent }>('/academic/calendar', input)
  return event
}

export async function updateAcademicCalendarEvent(id: string, input: UpdateAcademicCalendarEventRequest): Promise<AcademicCalendarEvent> {
  const { event } = await api.patch<{ event: AcademicCalendarEvent }>(`/academic/calendar/${id}`, input)
  return event
}

export async function deleteAcademicCalendarEvent(id: string): Promise<void> {
  await api.delete(`/academic/calendar/${id}`)
}
