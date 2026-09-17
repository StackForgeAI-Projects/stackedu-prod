import { Hono } from 'hono'
import {
  createDiscussionPostRequestSchema,
  registerCoursesRequestSchema,
  saveOnboardingRequestSchema,
  studentPayRequestSchema,
  submitAssessmentRequestSchema,
  studyAssistantRequestSchema,
  saveClassroomWhiteboardRequestSchema,
  saveTimetableReminderRequestSchema,
} from '@stackedu/shared'
import { validationFailed } from '../lib/errors'
import { requireAuth, requireRole, type AuthVariables } from '../middleware/auth'
import type { RequestVariables } from '../middleware/request-context'
import {
  getRegistrationState,
  getStudentCourse,
  getStudentDiscussion,
  createStudentDiscussionPost,
  getStudentMaterialDownloadUrl,
  recordStudentMaterialView,
  getStudentAssessmentDetail,
  getStudentDashboard,
  getStudentFees,
  getStudentOnboarding,
  getStudentProfile,
  getStudentReceipt,
  getStudentResults,
  getStudentTranscript,
  listStudentAssessments,
  listStudentCourses,
  listStudentNotifications,
  markNotificationRead,
  payStudentFees,
  registerForCourses,
  saveStudentOnboarding,
  submitStudentAssessment,
} from '../services/student'
import {
  getClassroomRecordingDownloadUrl,
  getStudentClassroomSession,
  joinStudentClassroomSession,
  listStudentClassroomSessions,
  loadClassroomWhiteboard,
  saveClassroomWhiteboard,
} from '../services/live-sessions'
import { askStudyAssistant } from '../services/study-assistant'
import { cancelStudentTimetableReminder, saveStudentTimetableReminder } from '../services/timetable-reminders'
import { registerLibraryReaderRoutes } from './library-reader'

type Variables = RequestVariables & Partial<AuthVariables>

export const studentRoutes = new Hono<{ Variables: Variables }>()

const studentOnly = [requireAuth, requireRole('Student')] as const

function fieldErrors(error: { flatten: () => { fieldErrors: unknown } }): Record<string, string[]> {
  return error.flatten().fieldErrors as Record<string, string[]>
}

studentRoutes.get('/student/me', ...studentOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ profile: await getStudentProfile(user.institution.id, user.id) })
})

studentRoutes.get('/student/dashboard', ...studentOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ dashboard: await getStudentDashboard(user.institution.id, user.id) })
})

studentRoutes.post('/student/timetable/reminders', ...studentOnly, async (c) => {
  const parsed = saveTimetableReminderRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  return c.json({
    reminder: await saveStudentTimetableReminder(user.institution.id, user.id, parsed.data),
  })
})

studentRoutes.delete('/student/timetable/reminders/:slotId', ...studentOnly, async (c) => {
  const user = c.get('user')!
  await cancelStudentTimetableReminder(user.institution.id, user.id, c.req.param('slotId'))
  return c.body(null, 204)
})

studentRoutes.get('/student/courses', ...studentOnly, async (c) => {
  const user = c.get('user')!
  return c.json(await listStudentCourses(user.institution.id, user.id))
})

studentRoutes.get('/student/courses/:offeringId', ...studentOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    course: await getStudentCourse(user.institution.id, user.id, c.req.param('offeringId')),
  })
})

studentRoutes.get('/student/discussions/:id', ...studentOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    discussion: await getStudentDiscussion(user.institution.id, user.id, c.req.param('id')),
  })
})

studentRoutes.post('/student/discussions/:id/posts', ...studentOnly, async (c) => {
  const parsed = createDiscussionPostRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  return c.json({
    discussion: await createStudentDiscussionPost(
      user.institution.id,
      user.id,
      c.req.param('id'),
      parsed.data,
    ),
  })
})

studentRoutes.get('/student/materials/:id/download', ...studentOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    download: await getStudentMaterialDownloadUrl(user.institution.id, user.id, c.req.param('id')),
  })
})

studentRoutes.post('/student/materials/:id/view', ...studentOnly, async (c) => {
  const user = c.get('user')!
  await recordStudentMaterialView(user.institution.id, user.id, c.req.param('id'))
  return c.body(null, 204)
})

studentRoutes.get('/student/registration', ...studentOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ registration: await getRegistrationState(user.institution.id, user.id) })
})

studentRoutes.post('/student/registration', ...studentOnly, async (c) => {
  const parsed = registerCoursesRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  return c.json({
    registration: await registerForCourses(user.institution.id, user.id, parsed.data),
  })
})

studentRoutes.get('/student/results', ...studentOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ results: await getStudentResults(user.institution.id, user.id) })
})

studentRoutes.get('/student/transcript', ...studentOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ transcript: await getStudentTranscript(user.institution.id, user.id) })
})

studentRoutes.get('/student/fees', ...studentOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ fees: await getStudentFees(user.institution.id, user.id) })
})

studentRoutes.post('/student/fees/pay', ...studentOnly, async (c) => {
  const parsed = studentPayRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  return c.json({ fees: await payStudentFees(user.institution.id, user.id, parsed.data) })
})

studentRoutes.get('/student/payments/:paymentId/receipt', ...studentOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    receipt: await getStudentReceipt(user.institution.id, user.id, c.req.param('paymentId')),
  })
})

studentRoutes.get('/student/notifications', ...studentOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    notifications: await listStudentNotifications(user.institution.id, user.id),
  })
})

studentRoutes.post('/student/notifications/:id/read', ...studentOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    notifications: await markNotificationRead(user.institution.id, user.id, c.req.param('id')),
  })
})

registerLibraryReaderRoutes(studentRoutes, '/student', studentOnly)

studentRoutes.get('/student/onboarding', ...studentOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ onboarding: await getStudentOnboarding(user.institution.id, user.id) })
})

studentRoutes.patch('/student/onboarding', ...studentOnly, async (c) => {
  const parsed = saveOnboardingRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  return c.json({
    onboarding: await saveStudentOnboarding(user.institution.id, user.id, parsed.data),
  })
})

studentRoutes.get('/student/assessments', ...studentOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ assessments: await listStudentAssessments(user.institution.id, user.id) })
})

studentRoutes.get('/student/assessments/:id', ...studentOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    assessment: await getStudentAssessmentDetail(user.institution.id, user.id, c.req.param('id')),
  })
})

studentRoutes.post('/student/assessments/:id/submit', ...studentOnly, async (c) => {
  const parsed = submitAssessmentRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  return c.json({
    assessments: await submitStudentAssessment(
      user.institution.id,
      user.id,
      c.req.param('id'),
      parsed.data,
    ),
  })
})

studentRoutes.get('/student/classroom', ...studentOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ sessions: await listStudentClassroomSessions(user.institution.id, user.id) })
})

studentRoutes.get('/student/classroom/:id', ...studentOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    session: await getStudentClassroomSession(user.institution.id, user.id, c.req.param('id')),
  })
})

studentRoutes.post('/student/classroom/:id/join', ...studentOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    join: await joinStudentClassroomSession(user.institution.id, user.id, c.req.param('id')),
  })
})

studentRoutes.get('/student/classroom/:id/whiteboard', ...studentOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    scene: await loadClassroomWhiteboard(user.institution.id, user.id, user.role, c.req.param('id')),
  })
})

studentRoutes.put('/student/classroom/:id/whiteboard', ...studentOnly, async (c) => {
  const parsed = saveClassroomWhiteboardRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  await saveClassroomWhiteboard(user.institution.id, user.id, user.role, c.req.param('id'), parsed.data.scene)
  return c.body(null, 204)
})

studentRoutes.get('/student/recordings/:id/download', ...studentOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    download: await getClassroomRecordingDownloadUrl(
      user.institution.id,
      user.id,
      user.role,
      c.req.param('id'),
    ),
  })
})

studentRoutes.post('/student/study-assistant', ...studentOnly, async (c) => {
  const parsed = studyAssistantRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  return c.json({
    answer: await askStudyAssistant(user.institution.id, user.id, user.role, parsed.data),
  })
})
