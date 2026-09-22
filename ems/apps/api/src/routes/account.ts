import { Hono } from 'hono'
import {
  changePasswordRequestSchema,
  disableTwoFactorRequestSchema,
  enableTwoFactorRequestSchema,
  requestPhoneVerificationRequestSchema,
  updateAccountProfileRequestSchema,
  updateAccountSecurityRequestSchema,
  updateNotificationPreferencesRequestSchema,
  verifyPhoneUpdateRequestSchema,
  verifyTwoFactorRequestSchema,
} from '@stackedu/shared'
import { validationFailed } from '../lib/errors'
import { requireAuth, type AuthVariables } from '../middleware/auth'
import type { RequestVariables } from '../middleware/request-context'
import {
  changeAccountPassword,
  disableAccountTwoFactor,
  enableAccountTwoFactor,
  getAccountNotificationPreferences,
  getAccountProfile,
  getAccountLiveCursor,
  listAccountNotifications,
  markAccountNotificationRead,
  sessionUserFrom,
  setupAccountTwoFactor,
  updateAccountNotificationPreferences,
  updateAccountProfile,
  updateAccountSecurity,
  requestStudentPhoneVerification,
  resendStudentPhoneVerification,
  verifyStudentPhoneUpdate,
} from '../services/account'

type Variables = RequestVariables & Partial<AuthVariables>

export const accountRoutes = new Hono<{ Variables: Variables }>()

function fieldErrors(error: { flatten: () => { fieldErrors: unknown } }): Record<string, string[]> {
  return error.flatten().fieldErrors as Record<string, string[]>
}

accountRoutes.get('/account/profile', requireAuth, async (c) => {
  const user = c.get('user')!
  return c.json({ profile: await getAccountProfile(user.institution.id, user.id) })
})

accountRoutes.patch('/account/profile', requireAuth, async (c) => {
  const parsed = updateAccountProfileRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  const profile = await updateAccountProfile(user.institution.id, user, parsed.data)
  return c.json({ profile, user: sessionUserFrom(profile, user.institution) })
})

accountRoutes.post('/account/phone/verify-request', requireAuth, async (c) => {
  const parsed = requestPhoneVerificationRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  await requestStudentPhoneVerification(user.institution.id, user.id, parsed.data.phone)
  return c.json({ ok: true })
})

accountRoutes.post('/account/phone/verify', requireAuth, async (c) => {
  const parsed = verifyPhoneUpdateRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  const profile = await verifyStudentPhoneUpdate(user.institution.id, user.id, parsed.data)
  return c.json({ profile, user: sessionUserFrom(profile, user.institution) })
})

accountRoutes.post('/account/phone/resend', requireAuth, async (c) => {
  const parsed = requestPhoneVerificationRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  await resendStudentPhoneVerification(user.institution.id, user.id, parsed.data.phone)
  return c.json({ ok: true })
})

accountRoutes.post('/account/password', requireAuth, async (c) => {
  const parsed = changePasswordRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  await changeAccountPassword(user.institution.id, user.id, parsed.data)
  return c.json({ ok: true })
})

accountRoutes.patch('/account/security', requireAuth, async (c) => {
  const parsed = updateAccountSecurityRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  return c.json({ profile: await updateAccountSecurity(user.institution.id, user.id, parsed.data) })
})

accountRoutes.get('/account/notification-preferences', requireAuth, async (c) => {
  const user = c.get('user')!
  const stored = await getAccountNotificationPreferences(user.institution.id, user.id)
  return c.json({
    preferences: Object.entries(stored).map(([key, value]) => ({ key, ...value })),
  })
})

accountRoutes.patch('/account/notification-preferences', requireAuth, async (c) => {
  const parsed = updateNotificationPreferencesRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  const stored = await updateAccountNotificationPreferences(user.institution.id, user.id, parsed.data)
  return c.json({
    preferences: Object.entries(stored).map(([key, value]) => ({ key, ...value })),
  })
})

accountRoutes.get('/account/live', requireAuth, async (c) => {
  const user = c.get('user')!
  return c.json({ cursor: await getAccountLiveCursor(user.institution.id, user.id) })
})

accountRoutes.get('/account/notifications', requireAuth, async (c) => {
  const user = c.get('user')!
  const limit = Math.min(Number(c.req.query('limit') ?? 8), 20)
  return c.json({
    notifications: await listAccountNotifications(user.institution.id, user.id, limit),
  })
})

accountRoutes.post('/account/notifications/:id/read', requireAuth, async (c) => {
  const user = c.get('user')!
  return c.json({
    notifications: await markAccountNotificationRead(
      user.institution.id,
      user.id,
      c.req.param('id'),
    ),
  })
})

accountRoutes.post('/account/2fa/setup', requireAuth, async (c) => {
  const user = c.get('user')!
  return c.json({ setup: await setupAccountTwoFactor(user.institution.id, user.id) })
})

accountRoutes.post('/account/2fa/enable', requireAuth, async (c) => {
  const parsed = enableTwoFactorRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  return c.json({ profile: await enableAccountTwoFactor(user.institution.id, user.id, parsed.data) })
})

accountRoutes.post('/account/2fa/disable', requireAuth, async (c) => {
  const parsed = disableTwoFactorRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  return c.json({ profile: await disableAccountTwoFactor(user.institution.id, user.id, parsed.data) })
})
