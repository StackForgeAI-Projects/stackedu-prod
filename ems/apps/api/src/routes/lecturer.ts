import { Hono } from 'hono'
import {
  createLecturerAnnouncementRequestSchema,
  createLecturerAssessmentRequestSchema,
  createLecturerDiscussionRequestSchema,
  createDiscussionPostRequestSchema,
  updateLecturerDiscussionRequestSchema,
  createLecturerMaterialRequestSchema,
  createLecturerModuleRequestSchema,
  createLecturerQuestionRequestSchema,
  describeLecturerMaterialRequestSchema,
  reserveLecturerMaterialUploadRequestSchema,
  generateLecturerQuestionsRequestSchema,
  createClassroomSessionRequestSchema,
  saveClassroomWhiteboardRequestSchema,
  updateClassroomPreferencesRequestSchema,
  reserveLecturerQuestionImportRequestSchema,
  saveLecturerAssessmentItemsRequestSchema,
  updateLecturerAnnouncementRequestSchema,
  updateLecturerMaterialRequestSchema,
  updateLecturerModuleRequestSchema,
  updateLecturerQuestionRequestSchema,
  resolveLecturerAtRiskRequestSchema,
  saveLecturerAttendanceRequestSchema,
  saveLecturerGradeRequestSchema,
  saveLecturerResultsRequestSchema,
  requestTimetableChangeRequestSchema,
} from '@stackedu/shared'
import { validationFailed } from '../lib/errors'
import { requireAuth, requireRole, type AuthVariables } from '../middleware/auth'
import type { RequestVariables } from '../middleware/request-context'
import {
  createLecturerAnnouncement,
  createLecturerAssessment,
  createLecturerMaterial,
  createLecturerModule,
  deleteLecturerAnnouncement,
  deleteLecturerAssessment,
  deleteLecturerMaterial,
  deleteLecturerModule,
  updateLecturerAnnouncement,
  updateLecturerModule,
  getLecturerMaterialDownloadUrl,
  confirmLecturerTimetableSlot,
  requestLecturerTimetableChange,
  getLecturerAssessment,
  getLecturerAttendanceSession,
  getLecturerCourse,
  getLecturerDashboard,
  getLecturerProfile,
  getLecturerResults,
  listLecturerAssessments,
  listLecturerAtRiskStudents,
  listLecturerAttendance,
  listLecturerCourses,
  listLecturerNotifications,
  listLecturerRooms,
  listLecturerTimetableSlots,
  markAllLecturerNotificationsRead,
  markLecturerNotificationRead,
  resolveLecturerAtRisk,
  saveLecturerAttendance,
  saveLecturerGrade,
  saveLecturerResults,
  deleteLecturerAttendanceSession,
  submitLecturerResults,
  updateLecturerMaterial,
  reserveLecturerMaterialUpload,
} from '../services/lecturer'
import { describeLecturerMaterial } from '../services/material-describe'
import {
  createLecturerDiscussion,
  createLecturerDiscussionPost,
  deleteLecturerDiscussion,
  getLecturerDiscussion,
  updateLecturerDiscussion,
} from '../services/discussions'
import {
  createLecturerQuestion,
  deleteLecturerQuestion,
  generateLecturerQuestions,
  listLecturerAssessmentItems,
  listLecturerQuestions,
  reserveLecturerQuestionImport,
  saveLecturerAssessmentItems,
  updateLecturerQuestion,
} from '../services/question-bank'
import {
  cancelLecturerClassroomSession,
  createLecturerClassroomSession,
  draftClassroomSummary,
  endLecturerClassroomSession,
  getClassroomRecordingDownloadUrl,
  getLecturerClassroomPreferences,
  getLecturerClassroomSession,
  joinLecturerClassroomSession,
  listLecturerClassroomSessions,
  loadClassroomWhiteboard,
  muteAllClassroomStudents,
  publishClassroomSummary,
  saveClassroomWhiteboard,
  saveLecturerClassroomPreferences,
  startLecturerClassroomSession,
  startLecturerRecording,
  stopLecturerRecording,
  discardLecturerRecording,
} from '../services/live-sessions'
import { getLecturerCourseAnalytics } from '../services/course-analytics'
import { registerLibraryReaderRoutes } from './library-reader'

type Variables = RequestVariables & Partial<AuthVariables>

export const lecturerRoutes = new Hono<{ Variables: Variables }>()

const lecturerOnly = [requireAuth, requireRole('Lecturer')] as const

function fieldErrors(error: { flatten: () => { fieldErrors: unknown } }): Record<string, string[]> {
  return error.flatten().fieldErrors as Record<string, string[]>
}

function actor(c: { get: (key: 'user') => AuthVariables['user'] | undefined }) {
  const user = c.get('user')!
  return { id: user.id, email: user.email, role: user.role }
}

lecturerRoutes.get('/lecturer/me', ...lecturerOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ profile: await getLecturerProfile(user.institution.id, user.id) })
})

lecturerRoutes.get('/lecturer/dashboard', ...lecturerOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ dashboard: await getLecturerDashboard(user.institution.id, user.id) })
})

lecturerRoutes.get('/lecturer/courses', ...lecturerOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ courses: await listLecturerCourses(user.institution.id, user.id) })
})

lecturerRoutes.get('/lecturer/courses/:offeringId', ...lecturerOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    course: await getLecturerCourse(user.institution.id, user.id, c.req.param('offeringId')),
  })
})

lecturerRoutes.post('/lecturer/materials', ...lecturerOnly, async (c) => {
  const parsed = createLecturerMaterialRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  return c.json({
    material: await createLecturerMaterial(c.get('user')!.institution.id, actor(c), parsed.data),
  })
})

lecturerRoutes.post('/lecturer/materials/describe', ...lecturerOnly, async (c) => {
  const parsed = describeLecturerMaterialRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  return c.json(await describeLecturerMaterial(c.get('user')!.institution.id, actor(c), parsed.data))
})

lecturerRoutes.post('/lecturer/materials/upload-target', ...lecturerOnly, async (c) => {
  const parsed = reserveLecturerMaterialUploadRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  return c.json({
    upload: await reserveLecturerMaterialUpload(user.institution.id, user.id, parsed.data),
  })
})

lecturerRoutes.patch('/lecturer/materials/:id', ...lecturerOnly, async (c) => {
  const parsed = updateLecturerMaterialRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  return c.json({
    material: await updateLecturerMaterial(
      c.get('user')!.institution.id,
      actor(c),
      c.req.param('id'),
      parsed.data,
    ),
  })
})

lecturerRoutes.delete('/lecturer/materials/:id', ...lecturerOnly, async (c) => {
  await deleteLecturerMaterial(c.get('user')!.institution.id, actor(c), c.req.param('id'))
  return c.body(null, 204)
})

lecturerRoutes.get('/lecturer/materials/:id/download', ...lecturerOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    download: await getLecturerMaterialDownloadUrl(user.institution.id, user.id, c.req.param('id')),
  })
})

lecturerRoutes.post('/lecturer/modules', ...lecturerOnly, async (c) => {
  const parsed = createLecturerModuleRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  return c.json(
    { module: await createLecturerModule(c.get('user')!.institution.id, actor(c), parsed.data) },
    201,
  )
})

lecturerRoutes.patch('/lecturer/modules/:id', ...lecturerOnly, async (c) => {
  const parsed = updateLecturerModuleRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  return c.json({
    module: await updateLecturerModule(
      c.get('user')!.institution.id,
      actor(c),
      c.req.param('id'),
      parsed.data,
    ),
  })
})

lecturerRoutes.delete('/lecturer/modules/:id', ...lecturerOnly, async (c) => {
  await deleteLecturerModule(c.get('user')!.institution.id, actor(c), c.req.param('id'))
  return c.body(null, 204)
})

lecturerRoutes.post('/lecturer/announcements', ...lecturerOnly, async (c) => {
  const parsed = createLecturerAnnouncementRequestSchema.safeParse(
    await c.req.json().catch(() => ({})),
  )
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  return c.json(
    {
      announcement: await createLecturerAnnouncement(
        c.get('user')!.institution.id,
        actor(c),
        parsed.data,
      ),
    },
    201,
  )
})

lecturerRoutes.patch('/lecturer/announcements/:id', ...lecturerOnly, async (c) => {
  const parsed = updateLecturerAnnouncementRequestSchema.safeParse(
    await c.req.json().catch(() => ({})),
  )
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  return c.json({
    announcement: await updateLecturerAnnouncement(
      c.get('user')!.institution.id,
      actor(c),
      c.req.param('id'),
      parsed.data,
    ),
  })
})

lecturerRoutes.delete('/lecturer/announcements/:id', ...lecturerOnly, async (c) => {
  await deleteLecturerAnnouncement(c.get('user')!.institution.id, actor(c), c.req.param('id'))
  return c.body(null, 204)
})

lecturerRoutes.post('/lecturer/discussions', ...lecturerOnly, async (c) => {
  const parsed = createLecturerDiscussionRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  return c.json({
    discussion: await createLecturerDiscussion(c.get('user')!.institution.id, actor(c), parsed.data),
  }, 201)
})

lecturerRoutes.get('/lecturer/discussions/:id', ...lecturerOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    discussion: await getLecturerDiscussion(user.institution.id, user.id, c.req.param('id')),
  })
})

lecturerRoutes.patch('/lecturer/discussions/:id', ...lecturerOnly, async (c) => {
  const parsed = updateLecturerDiscussionRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  return c.json({
    discussion: await updateLecturerDiscussion(
      c.get('user')!.institution.id,
      actor(c),
      c.req.param('id'),
      parsed.data,
    ),
  })
})

lecturerRoutes.delete('/lecturer/discussions/:id', ...lecturerOnly, async (c) => {
  await deleteLecturerDiscussion(c.get('user')!.institution.id, actor(c), c.req.param('id'))
  return c.body(null, 204)
})

lecturerRoutes.post('/lecturer/discussions/:id/posts', ...lecturerOnly, async (c) => {
  const parsed = createDiscussionPostRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  return c.json({
    discussion: await createLecturerDiscussionPost(
      c.get('user')!.institution.id,
      actor(c),
      c.req.param('id'),
      parsed.data,
    ),
  })
})

lecturerRoutes.get('/lecturer/attendance', ...lecturerOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    sessions: await listLecturerAttendance(user.institution.id, user.id, c.req.query('offeringId')),
  })
})

lecturerRoutes.get('/lecturer/attendance/:sessionId', ...lecturerOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    session: await getLecturerAttendanceSession(user.institution.id, user.id, c.req.param('sessionId')),
  })
})

lecturerRoutes.post('/lecturer/attendance', ...lecturerOnly, async (c) => {
  const parsed = saveLecturerAttendanceRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  return c.json({
    session: await saveLecturerAttendance(c.get('user')!.institution.id, actor(c), parsed.data),
  })
})

lecturerRoutes.delete('/lecturer/attendance/:sessionId', ...lecturerOnly, async (c) => {
  return c.json({
    sessions: await deleteLecturerAttendanceSession(
      c.get('user')!.institution.id,
      actor(c),
      c.req.param('sessionId'),
    ),
  })
})

lecturerRoutes.get('/lecturer/results/:offeringId', ...lecturerOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    results: await getLecturerResults(user.institution.id, user.id, c.req.param('offeringId')),
  })
})

lecturerRoutes.patch('/lecturer/results/:offeringId', ...lecturerOnly, async (c) => {
  const parsed = saveLecturerResultsRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  return c.json({
    results: await saveLecturerResults(
      c.get('user')!.institution.id,
      actor(c),
      c.req.param('offeringId'),
      parsed.data,
    ),
  })
})

lecturerRoutes.post('/lecturer/results/:offeringId/submit', ...lecturerOnly, async (c) => {
  return c.json({
    results: await submitLecturerResults(
      c.get('user')!.institution.id,
      actor(c),
      c.req.param('offeringId'),
    ),
  })
})

lecturerRoutes.get('/lecturer/assessments', ...lecturerOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    assessments: await listLecturerAssessments(user.institution.id, user.id, c.req.query('offeringId')),
  })
})

lecturerRoutes.post('/lecturer/assessments', ...lecturerOnly, async (c) => {
  const parsed = createLecturerAssessmentRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  return c.json({
    assessment: await createLecturerAssessment(c.get('user')!.institution.id, actor(c), parsed.data),
  })
})

lecturerRoutes.delete('/lecturer/assessments/:id', ...lecturerOnly, async (c) => {
  await deleteLecturerAssessment(c.get('user')!.institution.id, actor(c), c.req.param('id'))
  return c.body(null, 204)
})

lecturerRoutes.get('/lecturer/assessments/:id', ...lecturerOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    assessment: await getLecturerAssessment(user.institution.id, user.id, c.req.param('id')),
  })
})

lecturerRoutes.get('/lecturer/assessments/:id/items', ...lecturerOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    items: await listLecturerAssessmentItems(user.institution.id, user.id, c.req.param('id')),
  })
})

lecturerRoutes.put('/lecturer/assessments/:id/items', ...lecturerOnly, async (c) => {
  const parsed = saveLecturerAssessmentItemsRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  return c.json({
    items: await saveLecturerAssessmentItems(
      c.get('user')!.institution.id,
      actor(c),
      c.req.param('id'),
      parsed.data,
    ),
  })
})

lecturerRoutes.get('/lecturer/questions', ...lecturerOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    questions: await listLecturerQuestions(user.institution.id, user.id, {
      courseId: c.req.query('courseId') || undefined,
      topic: c.req.query('topic') || undefined,
    }),
  })
})

lecturerRoutes.post('/lecturer/questions', ...lecturerOnly, async (c) => {
  const parsed = createLecturerQuestionRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  return c.json({
    question: await createLecturerQuestion(c.get('user')!.institution.id, actor(c), parsed.data),
  }, 201)
})

lecturerRoutes.post('/lecturer/questions/generate', ...lecturerOnly, async (c) => {
  const parsed = generateLecturerQuestionsRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  return c.json(await generateLecturerQuestions(c.get('user')!.institution.id, actor(c), parsed.data))
})

lecturerRoutes.post('/lecturer/questions/upload-target', ...lecturerOnly, async (c) => {
  const parsed = reserveLecturerQuestionImportRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  return c.json({
    upload: await reserveLecturerQuestionImport(user.institution.id, user.id, parsed.data),
  })
})

lecturerRoutes.patch('/lecturer/questions/:id', ...lecturerOnly, async (c) => {
  const parsed = updateLecturerQuestionRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  return c.json({
    question: await updateLecturerQuestion(
      c.get('user')!.institution.id,
      actor(c),
      c.req.param('id'),
      parsed.data,
    ),
  })
})

lecturerRoutes.delete('/lecturer/questions/:id', ...lecturerOnly, async (c) => {
  await deleteLecturerQuestion(c.get('user')!.institution.id, actor(c), c.req.param('id'))
  return c.body(null, 204)
})

lecturerRoutes.post('/lecturer/assessments/:id/grades', ...lecturerOnly, async (c) => {
  const parsed = saveLecturerGradeRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  return c.json({
    assessment: await saveLecturerGrade(
      c.get('user')!.institution.id,
      actor(c),
      c.req.param('id'),
      parsed.data,
    ),
  })
})

lecturerRoutes.get('/lecturer/at-risk', ...lecturerOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ students: await listLecturerAtRiskStudents(user.institution.id, user.id) })
})

lecturerRoutes.post('/lecturer/at-risk/:id/resolve', ...lecturerOnly, async (c) => {
  const parsed = resolveLecturerAtRiskRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  return c.json({
    students: await resolveLecturerAtRisk(
      c.get('user')!.institution.id,
      actor(c),
      c.req.param('id'),
      parsed.data,
    ),
  })
})

lecturerRoutes.get('/lecturer/notifications', ...lecturerOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ notifications: await listLecturerNotifications(user.institution.id, user.id) })
})

lecturerRoutes.post('/lecturer/notifications/read-all', ...lecturerOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    notifications: await markAllLecturerNotificationsRead(user.institution.id, user.id),
  })
})

lecturerRoutes.post('/lecturer/notifications/:id/read', ...lecturerOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    notifications: await markLecturerNotificationRead(user.institution.id, user.id, c.req.param('id')),
  })
})

lecturerRoutes.get('/lecturer/timetable', ...lecturerOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ slots: await listLecturerTimetableSlots(user.institution.id, user.id) })
})

lecturerRoutes.get('/lecturer/rooms', ...lecturerOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ rooms: await listLecturerRooms(user.institution.id, user.id) })
})

lecturerRoutes.post('/lecturer/timetable/:slotId/confirm', ...lecturerOnly, async (c) => {
  return c.json({
    slot: await confirmLecturerTimetableSlot(
      c.get('user')!.institution.id,
      actor(c),
      c.req.param('slotId'),
    ),
  })
})

lecturerRoutes.post('/lecturer/timetable/:slotId/request-change', ...lecturerOnly, async (c) => {
  const parsed = requestTimetableChangeRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  return c.json({
    slot: await requestLecturerTimetableChange(
      c.get('user')!.institution.id,
      actor(c),
      c.req.param('slotId'),
      parsed.data,
    ),
  })
})

lecturerRoutes.get('/lecturer/analytics/:offeringId', ...lecturerOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    analytics: await getLecturerCourseAnalytics(user.institution.id, user.id, c.req.param('offeringId')),
  })
})

lecturerRoutes.get('/lecturer/classroom/preferences', ...lecturerOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    preferences: await getLecturerClassroomPreferences(user.institution.id, user.id),
  })
})

lecturerRoutes.put('/lecturer/classroom/preferences', ...lecturerOnly, async (c) => {
  const parsed = updateClassroomPreferencesRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  return c.json({
    preferences: await saveLecturerClassroomPreferences(c.get('user')!.institution.id, actor(c), parsed.data),
  })
})

lecturerRoutes.get('/lecturer/classroom', ...lecturerOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    sessions: await listLecturerClassroomSessions(user.institution.id, user.id, c.req.query('offeringId')),
  })
})

lecturerRoutes.post('/lecturer/classroom', ...lecturerOnly, async (c) => {
  const parsed = createClassroomSessionRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  return c.json({
    session: await createLecturerClassroomSession(c.get('user')!.institution.id, actor(c), parsed.data),
  }, 201)
})

lecturerRoutes.get('/lecturer/classroom/:id', ...lecturerOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    session: await getLecturerClassroomSession(user.institution.id, user.id, c.req.param('id')),
  })
})

lecturerRoutes.post('/lecturer/classroom/:id/start', ...lecturerOnly, async (c) => {
  return c.json({
    session: await startLecturerClassroomSession(c.get('user')!.institution.id, actor(c), c.req.param('id')),
  })
})

lecturerRoutes.post('/lecturer/classroom/:id/end', ...lecturerOnly, async (c) => {
  return c.json({
    session: await endLecturerClassroomSession(c.get('user')!.institution.id, actor(c), c.req.param('id')),
  })
})

lecturerRoutes.post('/lecturer/classroom/:id/cancel', ...lecturerOnly, async (c) => {
  await cancelLecturerClassroomSession(c.get('user')!.institution.id, actor(c), c.req.param('id'))
  return c.body(null, 204)
})

lecturerRoutes.post('/lecturer/classroom/:id/join', ...lecturerOnly, async (c) => {
  return c.json({
    join: await joinLecturerClassroomSession(c.get('user')!.institution.id, actor(c), c.req.param('id')),
  })
})

lecturerRoutes.post('/lecturer/classroom/:id/record/start', ...lecturerOnly, async (c) => {
  return c.json({
    session: await startLecturerRecording(c.get('user')!.institution.id, actor(c), c.req.param('id')),
  })
})

lecturerRoutes.post('/lecturer/classroom/:id/mute-all', ...lecturerOnly, async (c) => {
  return c.json(await muteAllClassroomStudents(c.get('user')!.institution.id, actor(c), c.req.param('id')))
})

lecturerRoutes.post('/lecturer/classroom/:id/record/stop', ...lecturerOnly, async (c) => {
  return c.json({
    session: await stopLecturerRecording(c.get('user')!.institution.id, actor(c), c.req.param('id')),
  })
})

lecturerRoutes.post('/lecturer/classroom/:id/record/discard', ...lecturerOnly, async (c) => {
  return c.json({
    session: await discardLecturerRecording(c.get('user')!.institution.id, actor(c), c.req.param('id')),
  })
})

lecturerRoutes.post('/lecturer/classroom/:id/summary', ...lecturerOnly, async (c) => {
  return c.json({
    session: await draftClassroomSummary(c.get('user')!.institution.id, actor(c), c.req.param('id')),
  })
})

lecturerRoutes.post('/lecturer/classroom/:id/summary/publish', ...lecturerOnly, async (c) => {
  return c.json({
    session: await publishClassroomSummary(c.get('user')!.institution.id, actor(c), c.req.param('id')),
  })
})

lecturerRoutes.get('/lecturer/classroom/:id/whiteboard', ...lecturerOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    scene: await loadClassroomWhiteboard(user.institution.id, user.id, user.role, c.req.param('id')),
  })
})

lecturerRoutes.put('/lecturer/classroom/:id/whiteboard', ...lecturerOnly, async (c) => {
  const parsed = saveClassroomWhiteboardRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  await saveClassroomWhiteboard(user.institution.id, user.id, user.role, c.req.param('id'), parsed.data.scene)
  return c.body(null, 204)
})

lecturerRoutes.get('/lecturer/recordings/:id/download', ...lecturerOnly, async (c) => {
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

registerLibraryReaderRoutes(lecturerRoutes, '/lecturer', lecturerOnly)
