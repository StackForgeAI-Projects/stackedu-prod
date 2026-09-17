import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { desc, eq } from 'drizzle-orm'
import { getInstitutionDb } from '../src/db/connection'
import { provisionInstitution } from '../src/db/provision'
import { auditLogs } from '../src/db/institution/schema/settings'
import { users } from '../src/db/institution/schema/people'
import { AppError } from '../src/lib/errors'
import { hashPassword, verifyPassword } from '../src/lib/password'
import { login, logout, resolveSession } from '../src/services/auth'
import { createUser } from '../src/services/users'
import { createTestPlatform, uniqueSlug, type TestPlatform } from './helpers/test-database'

/**
 * Authentication.
 *
 * The role decides which portal a person can open, so the two things that must
 * hold are that credentials are verified properly and that the role comes from
 * the database rather than from anything the caller can influence.
 */
describe('authentication', () => {
  let platform: TestPlatform
  let alphaId: string
  let betaId: string

  const password = 'Correct#Horse2026'

  beforeAll(async () => {
    platform = await createTestPlatform()

    const alpha = await provisionInstitution({
      name: 'Alpha University',
      slug: uniqueSlug('alpha'),
      shortName: 'ALPHA',
      contactEmail: 'registrar@alpha.test',
    })
    const beta = await provisionInstitution({
      name: 'Beta College',
      slug: uniqueSlug('beta'),
      shortName: 'BETA',
      contactEmail: 'registrar@beta.test',
    })

    alphaId = alpha.institutionId
    betaId = beta.institutionId

    await createUser({
      institutionId: alphaId,
      email: 'Alpha.Student@alpha.test',
      fullName: 'Alpha Student',
      role: 'Student',
      password,
    })
    await createUser({
      institutionId: betaId,
      email: 'beta.bursar@beta.test',
      fullName: 'Beta Bursar',
      role: 'Bursar',
      password,
    })
  })

  afterAll(async () => {
    await platform.cleanup()
  })

  it('stores passwords as a verifiable hash, never as the password itself', async () => {
    const hash = await hashPassword(password)

    expect(hash).not.toContain(password)
    expect(await verifyPassword(password, hash)).toBe(true)
    expect(await verifyPassword('Wrong#Password2026', hash)).toBe(false)
  })

  it('identifies the role and institution from the credentials alone', async () => {
    const alpha = await login({ identifier: 'alpha.student@alpha.test', password })
    expect(alpha.status).toBe('session')
    if (alpha.status !== 'session') return
    expect(alpha.user.role).toBe('Student')
    expect(alpha.user.institution.id).toBe(alphaId)

    const beta = await login({ identifier: 'beta.bursar@beta.test', password })
    expect(beta.status).toBe('session')
    if (beta.status !== 'session') return
    expect(beta.user.role).toBe('Bursar')
    expect(beta.user.institution.id).toBe(betaId)
  })

  it('treats the email address as case-insensitive', async () => {
    const result = await login({ identifier: 'ALPHA.STUDENT@ALPHA.TEST', password })
    expect(result.status).toBe('session')
    if (result.status !== 'session') return
    expect(result.user.email).toBe('alpha.student@alpha.test')
  })

  it('rejects a wrong password and an unknown address the same way', async () => {
    const wrongPassword = await login({
      identifier: 'alpha.student@alpha.test',
      password: 'not-the-password',
    }).catch((error: AppError) => error)

    const unknownEmail = await login({
      identifier: 'nobody@alpha.test',
      password,
    }).catch((error: AppError) => error)

    expect(wrongPassword).toBeInstanceOf(AppError)
    expect(unknownEmail).toBeInstanceOf(AppError)
    expect((wrongPassword as AppError).status).toBe(401)
    expect((unknownEmail as AppError).message).toBe((wrongPassword as AppError).message)
  })

  it('refuses a deactivated account', async () => {
    const db = await getInstitutionDb(betaId)
    await db
      .update(users)
      .set({ isActive: false })
      .where(eq(users.email, 'beta.bursar@beta.test'))

    await expect(login({ identifier: 'beta.bursar@beta.test', password })).rejects.toBeInstanceOf(
      AppError,
    )

    await db.update(users).set({ isActive: true }).where(eq(users.email, 'beta.bursar@beta.test'))
  })

  it('resolves a session cookie back to the same user', async () => {
    const result = await login({ identifier: 'alpha.student@alpha.test', password })
    expect(result.status).toBe('session')
    if (result.status !== 'session') return

    const resolved = await resolveSession(result.cookieValue)
    expect(resolved?.id).toBe(result.user.id)
    expect(resolved?.role).toBe('Student')
  })

  it('will not resolve a tampered or unknown token', async () => {
    const result = await login({ identifier: 'alpha.student@alpha.test', password })
    expect(result.status).toBe('session')
    if (result.status !== 'session') return
    const cookieValue = result.cookieValue
    const [institutionId, token] = [
      cookieValue.slice(0, cookieValue.indexOf('.')),
      cookieValue.slice(cookieValue.indexOf('.') + 1),
    ]

    expect(await resolveSession(`${institutionId}.${token}tampered`)).toBeNull()
    expect(await resolveSession('not-a-cookie')).toBeNull()
  })

  /**
   * A session belongs to one institution's database. Presenting it with
   * another institution's id must not find anything, or a valid session
   * anywhere would be a valid session everywhere.
   */
  it('will not accept a session against a different institution', async () => {
    const result = await login({ identifier: 'alpha.student@alpha.test', password })
    expect(result.status).toBe('session')
    if (result.status !== 'session') return
    const token = result.cookieValue.slice(result.cookieValue.indexOf('.') + 1)

    expect(await resolveSession(`${betaId}.${token}`)).toBeNull()
  })

  it('ends the session on sign-out', async () => {
    const result = await login({ identifier: 'alpha.student@alpha.test', password })
    expect(result.status).toBe('session')
    if (result.status !== 'session') return
    expect(await resolveSession(result.cookieValue)).not.toBeNull()

    await logout(result.cookieValue)
    expect(await resolveSession(result.cookieValue)).toBeNull()
  })

  /**
   * Who was signed in, and when they stopped being signed in, is exactly the
   * kind of thing an institution asks the audit log after an incident.
   */
  describe('the audit trail', () => {
    async function actionsFor(userId: string): Promise<string[]> {
      const db = await getInstitutionDb(alphaId)
      const rows = await db
        .select({ action: auditLogs.action, createdAt: auditLogs.createdAt })
        .from(auditLogs)
        .where(eq(auditLogs.actorId, userId))
        .orderBy(desc(auditLogs.createdAt))
      return rows.map((row) => row.action)
    }

    it('records a sign-in, with how the password was proved', async () => {
      const result = await login({ identifier: 'alpha.student@alpha.test', password })
      if (result.status !== 'session') throw new Error('Expected a session.')

      const db = await getInstitutionDb(alphaId)
      const [entry] = await db
        .select({ action: auditLogs.action, metadata: auditLogs.metadata, role: auditLogs.actorRole })
        .from(auditLogs)
        .where(eq(auditLogs.actorId, result.user.id))
        .orderBy(desc(auditLogs.createdAt))
        .limit(1)

      expect(entry?.action).toBe('session.login')
      expect(entry?.metadata).toMatchObject({ method: 'password' })
      expect(entry?.role).toBe('Student')
    })

    it('records a deliberate sign-out separately from an idle one', async () => {
      const manual = await login({ identifier: 'alpha.student@alpha.test', password })
      if (manual.status !== 'session') throw new Error('Expected a session.')
      await logout(manual.cookieValue)
      expect(await actionsFor(manual.user.id)).toContain('session.logout')

      const idle = await login({ identifier: 'alpha.student@alpha.test', password })
      if (idle.status !== 'session') throw new Error('Expected a session.')
      await logout(idle.cookieValue, { reason: 'inactivity' })
      expect(await actionsFor(idle.user.id)).toContain('session.logout.inactivity')
    })

    /**
     * Several tabs sign out at the same moment when the idle timer fires, and
     * the log should say the session ended once.
     */
    it('records a session ending once, however many times sign-out is called', async () => {
      const db = await getInstitutionDb(alphaId)
      const result = await login({ identifier: 'alpha.student@alpha.test', password })
      if (result.status !== 'session') throw new Error('Expected a session.')

      const countLogouts = async () => {
        const rows = await db
          .select({ action: auditLogs.action })
          .from(auditLogs)
          .where(eq(auditLogs.actorId, result.user.id))
        return rows.filter((row) => row.action === 'session.logout').length
      }

      const before = await countLogouts()
      await Promise.all([
        logout(result.cookieValue),
        logout(result.cookieValue),
        logout(result.cookieValue),
      ])

      expect(await countLogouts()).toBe(before + 1)
    })

    it('records nothing for a cookie that was never a session', async () => {
      const db = await getInstitutionDb(alphaId)
      const before = await db.select({ action: auditLogs.action }).from(auditLogs)

      await logout(`${alphaId}.not-a-real-token`)

      const after = await db.select({ action: auditLogs.action }).from(auditLogs)
      expect(after).toHaveLength(before.length)
    })
  })

  it('will not register the same email address twice', async () => {
    await expect(
      createUser({
        institutionId: betaId,
        email: 'alpha.student@alpha.test',
        fullName: 'Impostor',
        role: 'Lecturer',
        password,
      }),
    ).rejects.toBeInstanceOf(AppError)
  })
})
