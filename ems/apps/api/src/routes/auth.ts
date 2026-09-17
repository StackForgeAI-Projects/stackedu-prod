import { Hono } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import {
  loginRequestSchema,
  logoutRequestSchema,
  verifyTwoFactorRequestSchema,
  type LoginResponse,
  type SessionResponse,
} from '@stackedu/shared'
import { env } from '../config/env'
import { SESSION_COOKIE, sessionCookieOptions } from '../lib/cookies'
import { PENDING_2FA_COOKIE } from '../lib/pending-2fa'
import { validationFailed } from '../lib/errors'
import { requireAuth, type AuthVariables } from '../middleware/auth'
import type { RequestVariables } from '../middleware/request-context'
import { login, logout, verifyTwoFactorLogin } from '../services/auth'

type Variables = RequestVariables & Partial<AuthVariables>

export const authRoutes = new Hono<{ Variables: Variables }>()

function clientIp(forwardedFor: string | undefined): string | undefined {
  return forwardedFor?.split(',')[0]?.trim() || undefined
}

authRoutes.post('/auth/login', async (c) => {
  const parsed = loginRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    throw validationFailed(parsed.error.flatten().fieldErrors as Record<string, string[]>)
  }

  const result = await login({
    identifier: parsed.data.identifier,
    password: parsed.data.password,
    rememberMe: parsed.data.rememberMe,
    ipAddress: clientIp(c.req.header('x-forwarded-for')),
    userAgent: c.req.header('user-agent'),
  })

  if (result.status === 'two-factor') {
    setCookie(
      c,
      PENDING_2FA_COOKIE,
      result.pendingToken,
      sessionCookieOptions(env(), new Date(Date.now() + 5 * 60 * 1000)),
    )
    return c.json<LoginResponse>({ requiresTwoFactor: true })
  }

  setCookie(c, SESSION_COOKIE, result.cookieValue, sessionCookieOptions(env(), result.expiresAt))

  c.get('logger').info('Sign-in succeeded', {
    userId: result.user.id,
    role: result.user.role,
    institution: result.user.institution.slug,
  })

  return c.json<LoginResponse>({ user: result.user })
})

authRoutes.post('/auth/2fa/verify', async (c) => {
  const parsed = verifyTwoFactorRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    throw validationFailed(parsed.error.flatten().fieldErrors as Record<string, string[]>)
  }

  const pendingToken = getCookie(c, PENDING_2FA_COOKIE)
  if (!pendingToken) {
    throw validationFailed({ code: ['Your sign-in session expired. Please sign in again.'] })
  }

  const result = await verifyTwoFactorLogin({
    pendingToken,
    code: parsed.data.code,
    ipAddress: clientIp(c.req.header('x-forwarded-for')),
    userAgent: c.req.header('user-agent'),
  })

  deleteCookie(c, PENDING_2FA_COOKIE, sessionCookieOptions(env()))
  setCookie(c, SESSION_COOKIE, result.cookieValue, sessionCookieOptions(env(), result.expiresAt))

  return c.json<SessionResponse>({ user: result.user })
})

authRoutes.get('/auth/session', requireAuth, (c) =>
  c.json<SessionResponse>({ user: c.get('user')! }),
)

authRoutes.post('/auth/logout', async (c) => {
  const cookie = getCookie(c, SESSION_COOKIE)
  const parsed = logoutRequestSchema.safeParse(await c.req.json().catch(() => ({})))

  if (cookie) {
    await logout(cookie, {
      reason: parsed.success ? parsed.data.reason : 'manual',
      ipAddress: clientIp(c.req.header('x-forwarded-for')),
      userAgent: c.req.header('user-agent'),
    })
  }

  deleteCookie(c, SESSION_COOKIE, sessionCookieOptions(env()))
  deleteCookie(c, PENDING_2FA_COOKIE, sessionCookieOptions(env()))

  return c.body(null, 204)
})
