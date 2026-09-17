import { Hono } from 'hono'
import {
  askLecturerTimetableSlotRequestSchema,
  createAcademicCalendarEventRequestSchema,
  createAcademicCourseRequestSchema,
  createAcademicProgrammeRequestSchema,
  changeAcademicStudentStatusRequestSchema,
  bulkCreateAcademicCoursesRequestSchema,
  rejectResultBatchRequestSchema,
  updateAcademicCalendarEventRequestSchema,
  updateAcademicCourseRequestSchema,
  updateAcademicProgrammeRequestSchema,
} from '@stackedu/shared'
import { validationFailed } from '../lib/errors'
import { requireAuth, requireRole, type AuthVariables } from '../middleware/auth'
import type { RequestVariables } from '../middleware/request-context'
import {
  approveAcademicResultBatch,
  bulkCreateAcademicCourses,
  changeAcademicStudentStatus,
  createAcademicCalendarEvent,
  createAcademicCourse,
  createAcademicProgramme,
  deleteAcademicCalendarEvent,
  deleteAcademicCourse,
  getAcademicDashboard,
  getAcademicProfile,
  getAcademicProgramme,
  getAcademicReports,
  getAcademicStudent,
  listAcademicAtRiskStudents,
  listAcademicCalendarEvents,
  listAcademicCourses,
  listAcademicDepartments,
  listAcademicLecturers,
  listAcademicNotifications,
  listAcademicProgrammes,
  listAcademicResultBatches,
  listAcademicSemesters,
  listAcademicStudents,
  listAcademicTimetableSlots,
  askLecturerToFreeTimetableSlot,
  markAcademicNotificationRead,
  rejectAcademicResultBatch,
  updateAcademicCalendarEvent,
  updateAcademicCourse,
  updateAcademicProgramme,
} from '../services/academic'
import { getAcademicStudentEngagement } from '../services/course-analytics'
import { registerLibraryReaderRoutes } from './library-reader'

type Variables = RequestVariables & Partial<AuthVariables>

export const academicRoutes = new Hono<{ Variables: Variables }>()

const academicOnly = [requireAuth, requireRole('AcademicAdmin')] as const

function fieldErrors(error: { flatten: () => { fieldErrors: unknown } }): Record<string, string[]> {
  return error.flatten().fieldErrors as Record<string, string[]>
}

function actor(c: { get: (key: 'user') => AuthVariables['user'] | undefined }) {
  const user = c.get('user')!
  return { id: user.id, email: user.email, role: user.role }
}

academicRoutes.get('/academic/me', ...academicOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ profile: await getAcademicProfile(user.institution.id, user.id) })
})

academicRoutes.get('/academic/dashboard', ...academicOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ dashboard: await getAcademicDashboard(user.institution.id, user.id) })
})

academicRoutes.get('/academic/students', ...academicOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ students: await listAcademicStudents(user.institution.id) })
})

academicRoutes.get('/academic/students/:id', ...academicOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ student: await getAcademicStudent(user.institution.id, c.req.param('id')) })
})

academicRoutes.get('/academic/students/:id/engagement', ...academicOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    engagement: await getAcademicStudentEngagement(user.institution.id, c.req.param('id')),
  })
})

academicRoutes.post('/academic/students/:id/status', ...academicOnly, async (c) => {
  const parsed = changeAcademicStudentStatusRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  return c.json({
    student: await changeAcademicStudentStatus(
      user.institution.id,
      actor(c),
      c.req.param('id'),
      parsed.data,
    ),
  })
})

academicRoutes.get('/academic/courses', ...academicOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ courses: await listAcademicCourses(user.institution.id) })
})

academicRoutes.post('/academic/courses', ...academicOnly, async (c) => {
  const parsed = createAcademicCourseRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  return c.json({ course: await createAcademicCourse(user.institution.id, actor(c), parsed.data) }, 201)
})

academicRoutes.post('/academic/courses/bulk', ...academicOnly, async (c) => {
  const parsed = bulkCreateAcademicCoursesRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  return c.json({ result: await bulkCreateAcademicCourses(user.institution.id, actor(c), parsed.data) })
})

academicRoutes.patch('/academic/courses/:id', ...academicOnly, async (c) => {
  const parsed = updateAcademicCourseRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  return c.json({
    course: await updateAcademicCourse(user.institution.id, actor(c), c.req.param('id'), parsed.data),
  })
})

academicRoutes.delete('/academic/courses/:id', ...academicOnly, async (c) => {
  const user = c.get('user')!
  await deleteAcademicCourse(user.institution.id, actor(c), c.req.param('id'))
  return c.json({ ok: true })
})

academicRoutes.get('/academic/departments', ...academicOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ departments: await listAcademicDepartments(user.institution.id) })
})

academicRoutes.get('/academic/programmes', ...academicOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ programmes: await listAcademicProgrammes(user.institution.id) })
})

academicRoutes.get('/academic/programmes/:id', ...academicOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ programme: await getAcademicProgramme(user.institution.id, c.req.param('id')) })
})

academicRoutes.post('/academic/programmes', ...academicOnly, async (c) => {
  const parsed = createAcademicProgrammeRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  return c.json({ programme: await createAcademicProgramme(user.institution.id, actor(c), parsed.data) }, 201)
})

academicRoutes.patch('/academic/programmes/:id', ...academicOnly, async (c) => {
  const parsed = updateAcademicProgrammeRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  return c.json({
    programme: await updateAcademicProgramme(user.institution.id, actor(c), c.req.param('id'), parsed.data),
  })
})

academicRoutes.get('/academic/calendar', ...academicOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ events: await listAcademicCalendarEvents(user.institution.id) })
})

academicRoutes.post('/academic/calendar', ...academicOnly, async (c) => {
  const parsed = createAcademicCalendarEventRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  return c.json({ event: await createAcademicCalendarEvent(user.institution.id, actor(c), parsed.data) }, 201)
})

academicRoutes.patch('/academic/calendar/:id', ...academicOnly, async (c) => {
  const parsed = updateAcademicCalendarEventRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  return c.json({
    event: await updateAcademicCalendarEvent(user.institution.id, actor(c), c.req.param('id'), parsed.data),
  })
})

academicRoutes.delete('/academic/calendar/:id', ...academicOnly, async (c) => {
  const user = c.get('user')!
  await deleteAcademicCalendarEvent(user.institution.id, actor(c), c.req.param('id'))
  return c.json({ ok: true })
})

academicRoutes.get('/academic/timetable', ...academicOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ slots: await listAcademicTimetableSlots(user.institution.id) })
})

academicRoutes.post('/academic/timetable/:slotId/ask-lecturer', ...academicOnly, async (c) => {
  const parsed = askLecturerTimetableSlotRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  return c.json({
    ok: true,
    ...(await askLecturerToFreeTimetableSlot(
      c.get('user')!.institution.id,
      actor(c),
      c.req.param('slotId'),
      parsed.data.message,
    )),
  })
})

academicRoutes.get('/academic/lecturers', ...academicOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ lecturers: await listAcademicLecturers(user.institution.id) })
})

academicRoutes.get('/academic/semesters', ...academicOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ semesters: await listAcademicSemesters(user.institution.id) })
})

academicRoutes.get('/academic/results', ...academicOnly, async (c) => {
  const user = c.get('user')!
  const semesterId = c.req.query('semesterId')
  const status = c.req.query('status') as 'Pending' | 'Approved' | 'Published' | undefined
  return c.json({
    batches: await listAcademicResultBatches(user.institution.id, {
      semesterId: semesterId || undefined,
      status,
    }),
  })
})

academicRoutes.post('/academic/results/:id/approve', ...academicOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    batch: await approveAcademicResultBatch(user.institution.id, actor(c), c.req.param('id')),
  })
})

academicRoutes.post('/academic/results/:id/reject', ...academicOnly, async (c) => {
  const parsed = rejectResultBatchRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  return c.json({
    batch: await rejectAcademicResultBatch(
      user.institution.id,
      actor(c),
      c.req.param('id'),
      parsed.data,
    ),
  })
})

academicRoutes.get('/academic/at-risk', ...academicOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ students: await listAcademicAtRiskStudents(user.institution.id) })
})

academicRoutes.get('/academic/notifications', ...academicOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ notifications: await listAcademicNotifications(user.institution.id, user.id) })
})

academicRoutes.post('/academic/notifications/:id/read', ...academicOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    notifications: await markAcademicNotificationRead(
      user.institution.id,
      user.id,
      c.req.param('id'),
    ),
  })
})

registerLibraryReaderRoutes(academicRoutes, '/academic', academicOnly)

academicRoutes.get('/academic/reports', ...academicOnly, async (c) => {
  const user = c.get('user')!
  const type = c.req.query('type') as 'enrollment' | 'results' | 'attendance' | 'programme' | undefined
  if (!type || !['enrollment', 'results', 'attendance', 'programme'].includes(type)) {
    throw validationFailed({ type: ['Choose a report type.'] })
  }
  return c.json({ reports: await getAcademicReports(user.institution.id, type) })
})
