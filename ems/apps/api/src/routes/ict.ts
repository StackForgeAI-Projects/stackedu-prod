import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import {
  createAnnouncementRequestSchema,
  createIctUserRequestSchema,
  previewAnnouncementRequestSchema,
  revokeAccessRequestSchema,
  updateIctSettingsRequestSchema,
  updateIctUserRequestSchema,
  updateIntegrationRequestSchema,
  updateRolePermissionsRequestSchema,
  userRoleSchema,
} from '@stackedu/shared'
import { INSTITUTION_LOGO_UPLOAD_PATH } from '../lib/branding'
import { validationFailed, badRequest } from '../lib/errors'
import { LOGO_MAX_BYTES } from '../lib/storage'
import { requireAuth, requireRole, type AuthVariables } from '../middleware/auth'
import type { RequestVariables } from '../middleware/request-context'
import {
  createIctAnnouncement,
  createIctUser,
  checkIctIntegration,
  getIctAudienceOptions,
  getIctAuditEntry,
  getIctAnalytics,
  getIctDashboard,
  getIctProfile,
  getIctRevocation,
  getIctSettings,
  getIctUser,
  listIctAnnouncements,
  listIctAudit,
  listIctIntegrations,
  listIctNotifications,
  listIctProgrammes,
  listIctRevocations,
  listIctRoles,
  listIctUsers,
  markIctNotificationRead,
  previewIctAnnouncement,
  resetIctUserPassword,
  restoreIctUser,
  revokeIctUser,
  updateIctIntegration,
  updateIctRolePermissions,
  updateIctSettings,
  updateIctUser,
  uploadInstitutionLogo,
} from '../services/ict'

type Variables = RequestVariables & Partial<AuthVariables>

export const ictRoutes = new Hono<{ Variables: Variables }>()

const ictOnly = [requireAuth, requireRole('ICTManager')] as const

function fieldErrors(error: { flatten: () => { fieldErrors: unknown } }): Record<string, string[]> {
  return error.flatten().fieldErrors as Record<string, string[]>
}

function actor(c: { get: (key: 'user') => AuthVariables['user'] | undefined }) {
  const user = c.get('user')!
  return { id: user.id, email: user.email, role: user.role }
}

ictRoutes.get('/ict/me', ...ictOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ profile: await getIctProfile(user.institution.id, user.id) })
})

ictRoutes.get('/ict/dashboard', ...ictOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ dashboard: await getIctDashboard(user.institution.id, user.id) })
})

ictRoutes.get('/ict/analytics', ...ictOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ analytics: await getIctAnalytics(user.institution.id) })
})

ictRoutes.get('/ict/users', ...ictOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ users: await listIctUsers(user.institution.id) })
})

ictRoutes.get('/ict/programmes', ...ictOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ programmes: await listIctProgrammes(user.institution.id) })
})

ictRoutes.get('/ict/users/:id', ...ictOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ user: await getIctUser(user.institution.id, c.req.param('id')) })
})

ictRoutes.post('/ict/users', ...ictOnly, async (c) => {
  const parsed = createIctUserRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  return c.json(await createIctUser(user.institution.id, actor(c), parsed.data), 201)
})

ictRoutes.patch('/ict/users/:id', ...ictOnly, async (c) => {
  const parsed = updateIctUserRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  return c.json({
    user: await updateIctUser(user.institution.id, actor(c), c.req.param('id'), parsed.data),
  })
})

ictRoutes.post('/ict/users/:id/reset-password', ...ictOnly, async (c) => {
  const user = c.get('user')!
  return c.json(await resetIctUserPassword(user.institution.id, actor(c), c.req.param('id')))
})

ictRoutes.post('/ict/users/:id/revoke', ...ictOnly, async (c) => {
  const parsed = revokeAccessRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  return c.json({
    revocation: await revokeIctUser(user.institution.id, actor(c), c.req.param('id'), parsed.data.reason),
  })
})

ictRoutes.get('/ict/revocations', ...ictOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ revocations: await listIctRevocations(user.institution.id) })
})

ictRoutes.get('/ict/revocations/:id', ...ictOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ revocation: await getIctRevocation(user.institution.id, c.req.param('id')) })
})

ictRoutes.post('/ict/revocations/:id/restore', ...ictOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    revocation: await restoreIctUser(user.institution.id, actor(c), c.req.param('id')),
  })
})

ictRoutes.get('/ict/roles', ...ictOnly, async (c) => {
  const user = c.get('user')!
  return c.json(await listIctRoles(user.institution.id))
})

ictRoutes.patch('/ict/roles/:key/permissions', ...ictOnly, async (c) => {
  const key = userRoleSchema.safeParse(c.req.param('key'))
  if (!key.success) throw validationFailed({ key: ['Unknown role.'] })
  const parsed = updateRolePermissionsRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  return c.json({
    role: await updateIctRolePermissions(
      user.institution.id,
      actor(c),
      key.data,
      parsed.data.permissionKeys,
    ),
  })
})

ictRoutes.get('/ict/audit', ...ictOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ entries: await listIctAudit(user.institution.id) })
})

ictRoutes.get('/ict/audit/:id', ...ictOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ entry: await getIctAuditEntry(user.institution.id, c.req.param('id')) })
})

ictRoutes.get('/ict/settings', ...ictOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ settings: await getIctSettings(user.institution.id) })
})

ictRoutes.patch('/ict/settings', ...ictOnly, async (c) => {
  const parsed = updateIctSettingsRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  return c.json({ settings: await updateIctSettings(user.institution.id, actor(c), parsed.data) })
})

ictRoutes.post(
  INSTITUTION_LOGO_UPLOAD_PATH,
  ...ictOnly,
  bodyLimit({ maxSize: LOGO_MAX_BYTES }),
  async (c) => {
    const mimeType = c.req.header('content-type')?.split(';')[0]?.trim() ?? ''
    const bytes = Buffer.from(await c.req.arrayBuffer())
    if (bytes.byteLength === 0) throw badRequest('Choose a logo image to upload.')

    const user = c.get('user')!
    return c.json({
      settings: await uploadInstitutionLogo(user.institution.id, actor(c), {
        body: bytes,
        mimeType,
      }),
    })
  },
)

ictRoutes.get('/ict/integrations', ...ictOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ integrations: await listIctIntegrations(user.institution.id) })
})

ictRoutes.patch('/ict/integrations/:id', ...ictOnly, async (c) => {
  const parsed = updateIntegrationRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  return c.json({
    integration: await updateIctIntegration(
      user.institution.id,
      actor(c),
      c.req.param('id'),
      parsed.data,
    ),
  })
})

ictRoutes.post('/ict/integrations/:id/check', ...ictOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    integration: await checkIctIntegration(user.institution.id, actor(c), c.req.param('id')),
  })
})

ictRoutes.get('/ict/announcements', ...ictOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ announcements: await listIctAnnouncements(user.institution.id) })
})

ictRoutes.get('/ict/audience-options', ...ictOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ options: await getIctAudienceOptions(user.institution.id) })
})

ictRoutes.post('/ict/announcements/preview', ...ictOnly, async (c) => {
  const parsed = previewAnnouncementRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  return c.json({ preview: await previewIctAnnouncement(user.institution.id, parsed.data) })
})

ictRoutes.post('/ict/announcements', ...ictOnly, async (c) => {
  const parsed = createAnnouncementRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  return c.json(
    { announcement: await createIctAnnouncement(user.institution.id, actor(c), parsed.data) },
    201,
  )
})

ictRoutes.get('/ict/notifications', ...ictOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ notifications: await listIctNotifications(user.institution.id, user.id) })
})

ictRoutes.post('/ict/notifications/:id/read', ...ictOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    notifications: await markIctNotificationRead(user.institution.id, user.id, c.req.param('id')),
  })
})
