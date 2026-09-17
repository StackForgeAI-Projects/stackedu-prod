import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { and, count, eq, gt, isNull, or } from 'drizzle-orm'
import type { LogoutReason, SessionUser, UserRole } from '@stackedu/shared'
import { getInstitutionDb, getPlatformDb } from '../db/connection'
import { institutions, loginAttempts, userDirectory } from '../db/platform/schema'
import { sessions, users } from '../db/institution/schema'
import { invalidCredentials, tooManyRequests, badRequest } from '../lib/errors'
import { fakeVerify, verifyPassword } from '../lib/password'
import { createPending2faToken, parsePending2faToken } from '../lib/pending-2fa'
import { verifyTotpCode } from '../lib/totp'
import { writeAudit } from '../lib/audit'

/**
 * Sessions.
 *
 * A session lives in its institution's own database, so the cookie has to say
 * which database to look in — otherwise resolving a session would mean querying
 * every institution in turn. The cookie is therefore "<institutionId>.<token>".
 * The institution id is not a secret; the token is, and only its hash is
 * stored, so a leaked database dump cannot be replayed as a live session.
 */

const SESSION_HOURS = 12
const REMEMBER_ME_DAYS = 30
/** Failed attempts allowed for one email address before it is locked out. */
const MAX_FAILURES = 5
const FAILURE_WINDOW_MINUTES = 15

export interface LoginInput {
  /** Email address, application reference or registration number. */
  identifier: string
  password: string
  rememberMe?: boolean
  ipAddress?: string | undefined
  userAgent?: string | undefined
}

export type LoginResult =
  | {
      status: 'session'
      cookieValue: string
      expiresAt: Date
      user: SessionUser
    }
  | {
      status: 'two-factor'
      pendingToken: string
    }

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('base64url')
}

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * References are issued in upper case and people type them either way, so both
 * the stored value and the typed value are compared in upper case.
 */
function normaliseIdentifier(identifier: string): string {
  return identifier.trim().toUpperCase()
}

function expiryFrom(rememberMe: boolean): Date {
  const ms = rememberMe
    ? REMEMBER_ME_DAYS * 24 * 60 * 60 * 1000
    : SESSION_HOURS * 60 * 60 * 1000
  return new Date(Date.now() + ms)
}

async function recordAttempt(input: {
  email: string
  institutionId?: string | null
  succeeded: boolean
  failureReason?: string
  ipAddress?: string | undefined
  userAgent?: string | undefined
}): Promise<void> {
  await getPlatformDb()
    .insert(loginAttempts)
    .values({
      email: input.email,
      institutionId: input.institutionId ?? null,
      succeeded: input.succeeded,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      failureReason: input.failureReason ?? null,
    })
}

/**
 * Sessions belong in the audit trail as much as any other significant action:
 * an institution has to be able to see who was signed in, from where, and how
 * the session ended.
 */
async function auditSession(input: {
  institutionId: string
  user: { id: string; email: string; role: UserRole }
  action: 'session.login' | 'session.logout' | 'session.logout.inactivity'
  metadata?: Record<string, unknown>
  ipAddress?: string | undefined
  userAgent?: string | undefined
}): Promise<void> {
  await writeAudit({
    institutionId: input.institutionId,
    actorId: input.user.id,
    actorEmail: input.user.email,
    actorRole: input.user.role,
    action: input.action,
    targetType: 'session',
    targetId: input.user.id,
    ...(input.metadata ? { metadata: input.metadata } : {}),
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  })
}

async function assertNotLockedOut(email: string): Promise<void> {
  const since = new Date(Date.now() - FAILURE_WINDOW_MINUTES * 60 * 1000).toISOString()

  const [row] = await getPlatformDb()
    .select({ failures: count() })
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.email, email),
        eq(loginAttempts.succeeded, false),
        gt(loginAttempts.createdAt, since),
      ),
    )

  if ((row?.failures ?? 0) >= MAX_FAILURES) {
    throw tooManyRequests(
      `Too many sign-in attempts. Please wait ${FAILURE_WINDOW_MINUTES} minutes and try again.`,
    )
  }
}

/**
 * Verifies credentials and starts a session.
 *
 * Every failure returns the same error, whether the address is unknown, the
 * password is wrong or the account is disabled. Saying which would tell an
 * attacker that an address is worth attacking.
 */
export async function login(input: LoginInput): Promise<LoginResult> {
  const email = normaliseEmail(input.identifier)
  const { ipAddress, userAgent } = input

  await assertNotLockedOut(email)

  const [directory] = await getPlatformDb()
    .select({
      institutionId: userDirectory.institutionId,
      institutionUserId: userDirectory.institutionUserId,
      isActive: userDirectory.isActive,
      name: institutions.name,
      shortName: institutions.shortName,
      slug: institutions.slug,
      status: institutions.status,
    })
    .from(userDirectory)
    .innerJoin(institutions, eq(institutions.id, userDirectory.institutionId))
    .where(
      or(
        eq(userDirectory.email, email),
        eq(userDirectory.alternateIdentifier, normaliseIdentifier(input.identifier)),
      ),
    )
    .limit(1)

  if (!directory || !directory.isActive) {
    // Spend the same time as a real check so timing cannot reveal the answer.
    await fakeVerify()
    await recordAttempt({
      email,
      institutionId: directory?.institutionId ?? null,
      succeeded: false,
      failureReason: directory ? 'directory_inactive' : 'unknown_email',
      ipAddress,
      userAgent,
    })
    throw invalidCredentials()
  }

  const db = await getInstitutionDb(directory.institutionId)

  const [account] = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      isActive: users.isActive,
      passwordHash: users.passwordHash,
      twoFactorEnabled: users.twoFactorEnabled,
      twoFactorSecret: users.twoFactorSecret,
      emailVerifiedAt: users.emailVerifiedAt,
    })
    .from(users)
    .where(eq(users.id, directory.institutionUserId))
    .limit(1)

  if (!account || !account.isActive || !account.passwordHash) {
    await fakeVerify()
    await recordAttempt({
      email,
      institutionId: directory.institutionId,
      succeeded: false,
      failureReason: account ? 'account_inactive' : 'user_missing',
      ipAddress,
      userAgent,
    })
    throw invalidCredentials()
  }

  if (!(await verifyPassword(input.password, account.passwordHash))) {
    await recordAttempt({
      email,
      institutionId: directory.institutionId,
      succeeded: false,
      failureReason: 'wrong_password',
      ipAddress,
      userAgent,
    })
    throw invalidCredentials()
  }

  if (account.role === 'Applicant' && !account.emailVerifiedAt) {
    throw badRequest('Verify your email before signing in. Check your inbox for the verification code.')
  }

  if (account.twoFactorEnabled && account.twoFactorSecret) {
    await recordAttempt({
      email,
      institutionId: directory.institutionId,
      succeeded: true,
      ipAddress,
      userAgent,
    })
    return {
      status: 'two-factor',
      pendingToken: createPending2faToken({
        institutionId: directory.institutionId,
        userId: account.id,
        rememberMe: input.rememberMe ?? false,
      }),
    }
  }

  const token = randomBytes(32).toString('base64url')
  const expiresAt = expiryFrom(input.rememberMe ?? false)

  await db.insert(sessions).values({
    userId: account.id,
    token: hashToken(token),
    expiresAt: expiresAt.toISOString(),
    ipAddress: ipAddress ?? null,
    userAgent: userAgent ?? null,
  })

  await db
    .update(users)
    .set({ lastLoginAt: new Date().toISOString() })
    .where(eq(users.id, account.id))

  await recordAttempt({
    email,
    institutionId: directory.institutionId,
    succeeded: true,
    ipAddress,
    userAgent,
  })

  await auditSession({
    institutionId: directory.institutionId,
    user: account,
    action: 'session.login',
    metadata: { method: 'password' },
    ipAddress,
    userAgent,
  })

  return {
    status: 'session',
    cookieValue: `${directory.institutionId}.${token}`,
    expiresAt,
    user: {
      id: account.id,
      email: account.email,
      fullName: account.fullName,
      role: account.role,
      emailVerifiedAt: account.emailVerifiedAt,
      institution: {
        id: directory.institutionId,
        name: directory.name,
        shortName: directory.shortName,
        slug: directory.slug,
      },
    },
  }
}

/** Completes sign-in after password + authenticator code. */
export async function verifyTwoFactorLogin(input: {
  pendingToken: string
  code: string
  ipAddress?: string | undefined
  userAgent?: string | undefined
}): Promise<Extract<LoginResult, { status: 'session' }>> {
  const pending = parsePending2faToken(input.pendingToken)
  if (!pending) throw badRequest('Your sign-in session expired. Please sign in again.')

  const [directory] = await getPlatformDb()
    .select({
      institutionId: userDirectory.institutionId,
      isActive: userDirectory.isActive,
      name: institutions.name,
      shortName: institutions.shortName,
      slug: institutions.slug,
    })
    .from(userDirectory)
    .innerJoin(institutions, eq(institutions.id, userDirectory.institutionId))
    .where(
      and(
        eq(userDirectory.institutionUserId, pending.userId),
        eq(userDirectory.institutionId, pending.institutionId),
      ),
    )
    .limit(1)

  if (!directory?.isActive) throw invalidCredentials()

  const db = await getInstitutionDb(pending.institutionId)
  const [account] = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      isActive: users.isActive,
      twoFactorEnabled: users.twoFactorEnabled,
      twoFactorSecret: users.twoFactorSecret,
      emailVerifiedAt: users.emailVerifiedAt,
    })
    .from(users)
    .where(eq(users.id, pending.userId))
    .limit(1)

  if (!account?.isActive || !account.twoFactorEnabled || !account.twoFactorSecret) {
    throw invalidCredentials()
  }

  if (!verifyTotpCode(account.twoFactorSecret, input.code)) {
    throw badRequest('That code is not correct. Check your authenticator app and try again.')
  }

  const token = randomBytes(32).toString('base64url')
  const expiresAt = expiryFrom(pending.rememberMe)

  await db.insert(sessions).values({
    userId: account.id,
    token: hashToken(token),
    expiresAt: expiresAt.toISOString(),
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
  })

  await db
    .update(users)
    .set({ lastLoginAt: new Date().toISOString() })
    .where(eq(users.id, account.id))

  await auditSession({
    institutionId: pending.institutionId,
    user: account,
    action: 'session.login',
    metadata: { method: 'two-factor' },
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  })

  return {
    status: 'session',
    cookieValue: `${pending.institutionId}.${token}`,
    expiresAt,
    user: {
      id: account.id,
      email: account.email,
      fullName: account.fullName,
      role: account.role,
      emailVerifiedAt: account.emailVerifiedAt,
      institution: {
        id: directory.institutionId,
        name: directory.name,
        shortName: directory.shortName,
        slug: directory.slug,
      },
    },
  }
}

function splitCookie(cookieValue: string): { institutionId: string; token: string } | null {
  const separator = cookieValue.indexOf('.')
  if (separator <= 0) return null

  const institutionId = cookieValue.slice(0, separator)
  const token = cookieValue.slice(separator + 1)
  if (!institutionId || !token) return null

  return { institutionId, token }
}

/** Returns the signed-in user, or null when the cookie is missing or stale. */
export async function resolveSession(cookieValue: string): Promise<SessionUser | null> {
  const parsed = splitCookie(cookieValue)
  if (!parsed) return null

  const [institution] = await getPlatformDb()
    .select({
      id: institutions.id,
      name: institutions.name,
      shortName: institutions.shortName,
      slug: institutions.slug,
    })
    .from(institutions)
    .where(eq(institutions.id, parsed.institutionId))
    .limit(1)

  if (!institution) return null

  const db = await getInstitutionDb(institution.id)

  const [row] = await db
    .select({
      sessionToken: sessions.token,
      expiresAt: sessions.expiresAt,
      userId: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      isActive: users.isActive,
      emailVerifiedAt: users.emailVerifiedAt,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.token, hashToken(parsed.token)), isNull(sessions.revokedAt)))
    .limit(1)

  if (!row || !row.isActive) return null

  // Compare again in constant time: the lookup above matched on a hash, and
  // this closes the door on any timing signal from the index probe.
  const presented = Buffer.from(hashToken(parsed.token))
  const persisted = Buffer.from(row.sessionToken)
  if (presented.length !== persisted.length || !timingSafeEqual(presented, persisted)) return null

  if (new Date(row.expiresAt).getTime() <= Date.now()) return null

  return {
    id: row.userId,
    email: row.email,
    fullName: row.fullName,
    role: row.role,
    emailVerifiedAt: row.emailVerifiedAt,
    institution,
  }
}

/** Ends a session. Safe to call with a cookie that is already invalid. */
export async function logout(
  cookieValue: string,
  context: { reason?: LogoutReason; ipAddress?: string | undefined; userAgent?: string | undefined } = {},
): Promise<void> {
  const parsed = splitCookie(cookieValue)
  if (!parsed) return

  const [institution] = await getPlatformDb()
    .select({ id: institutions.id })
    .from(institutions)
    .where(eq(institutions.id, parsed.institutionId))
    .limit(1)

  if (!institution) return

  const db = await getInstitutionDb(institution.id)
  const token = hashToken(parsed.token)

  /**
   * Only the call that actually ends a live session is audited. Several tabs
   * can sign out at the same moment, and the audit log should show the session
   * ending once, not once per tab.
   */
  const [revoked] = await db
    .update(sessions)
    .set({ revokedAt: new Date().toISOString() })
    .where(and(eq(sessions.token, token), isNull(sessions.revokedAt)))
    .returning({ userId: sessions.userId })

  if (!revoked) return

  const [owner] = await db
    .select({ id: users.id, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.id, revoked.userId))
    .limit(1)

  if (!owner) return

  await auditSession({
    institutionId: institution.id,
    user: owner,
    action: context.reason === 'inactivity' ? 'session.logout.inactivity' : 'session.logout',
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  })
}
