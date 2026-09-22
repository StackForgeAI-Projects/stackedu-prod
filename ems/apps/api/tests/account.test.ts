import { createHash } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { STUDENT_IDENTITY_CONTACT_MESSAGE } from '@stackedu/shared'
import { createApp } from '../src/app'
import { getInstitutionDb } from '../src/db/connection'
import { provisionInstitution } from '../src/db/provision'
import { notifications, verificationTokens } from '../src/db/institution/schema'
import { users } from '../src/db/institution/schema/people'
import { SESSION_COOKIE } from '../src/lib/cookies'
import { AppError } from '../src/lib/errors'
import { login } from '../src/services/auth'
import { unreadCount } from '../src/services/academic'
import {
  getAccountProfile,
  markAccountNotificationRead,
  requestStudentPhoneVerification,
  updateAccountProfile,
  verifyStudentPhoneUpdate,
} from '../src/services/account'
import { createUser } from '../src/services/users'
import { createTestPlatform, uniqueSlug, type TestPlatform } from './helpers/test-database'

function hashVerificationCode(code: string): string {
  return createHash('sha256').update(code).digest('base64url')
}

describe('account profile', () => {
  let platform: TestPlatform
  let institutionId: string
  let studentUserId: string

  const password = 'Correct#Horse2026'
  const studentEmail = 'profile.student@alpha.test'
  const lecturerEmail = 'profile.lecturer@alpha.test'
  const newPhone = '+250788999999'
  const verifyCode = '654321'

  beforeAll(async () => {
    platform = await createTestPlatform()

    const institution = await provisionInstitution({
      name: 'Profile Test University',
      slug: uniqueSlug('profile'),
      shortName: 'PTU',
      contactEmail: 'registrar@profile.test',
    })
    institutionId = institution.institutionId

    const student = await createUser({
      institutionId,
      email: studentEmail,
      fullName: 'Profile Student',
      role: 'Student',
      password,
    })
    studentUserId = student.id

    await createUser({
      institutionId,
      email: lecturerEmail,
      fullName: 'Profile Lecturer',
      role: 'Lecturer',
      password,
    })

    const db = await getInstitutionDb(institutionId)
    await db
      .update(users)
      .set({ phone: '+250788123456' })
      .where(eq(users.id, studentUserId))
  })

  afterAll(async () => {
    await platform.cleanup()
  })

  it('blocks students from updating name or email via the profile endpoint', async () => {
    const session = await login({ identifier: studentEmail, password })
    expect(session.status).toBe('session')
    if (session.status !== 'session') return

    const profile = await getAccountProfile(institutionId, studentUserId)
    const error = await updateAccountProfile(institutionId, session.user, {
      fullName: 'Changed Name',
      email: profile.email,
    }).catch((cause: AppError) => cause)

    expect(error).toBeInstanceOf(AppError)
    expect((error as AppError).message).toContain(STUDENT_IDENTITY_CONTACT_MESSAGE)
  })

  it('allows staff to update their profile', async () => {
    const session = await login({ identifier: lecturerEmail, password })
    expect(session.status).toBe('session')
    if (session.status !== 'session') return

    const updated = await updateAccountProfile(institutionId, session.user, {
      fullName: 'Updated Lecturer',
      email: lecturerEmail,
      phone: '+250788111111',
    })

    expect(updated.fullName).toBe('Updated Lecturer')
    expect(updated.phone).toBe('+250788111111')
  })

  it('verifies a student phone update with a one-time code', async () => {
    const db = await getInstitutionDb(institutionId)
    await db.insert(verificationTokens).values({
      identifier: `${studentUserId}#${newPhone}`,
      tokenHash: hashVerificationCode(verifyCode),
      purpose: 'phone.verify',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    })

    const updated = await verifyStudentPhoneUpdate(institutionId, studentUserId, {
      phone: newPhone,
      code: verifyCode,
    })

    expect(updated.phone).toBe(newPhone)
    expect(updated.phoneVerifiedAt).toBeTruthy()
  })

  it('issues a verification code when a student requests a phone change', async () => {
    const anotherPhone = '+250788888888'
    await requestStudentPhoneVerification(institutionId, studentUserId, anotherPhone)

    const db = await getInstitutionDb(institutionId)
    const [token] = await db
      .select({ purpose: verificationTokens.purpose })
      .from(verificationTokens)
      .where(eq(verificationTokens.identifier, `${studentUserId}#${anotherPhone}`))
      .limit(1)

    expect(token?.purpose).toBe('phone.verify')
  })

  it('rejects student profile updates over HTTP', async () => {
    const session = await login({ identifier: studentEmail, password })
    expect(session.status).toBe('session')
    if (session.status !== 'session') return

    const app = createApp().app
    const response = await app.request('/account/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${SESSION_COOKIE}=${session.cookieValue}`,
      },
      body: JSON.stringify({
        fullName: 'HTTP Changed',
        email: studentEmail,
      }),
    })

    expect(response.status).toBe(400)
    const body = (await response.json()) as { error: { message: string } }
    expect(body.error.message).toContain(STUDENT_IDENTITY_CONTACT_MESSAGE)
  })

  it('marks an account notification read and drops unread count', async () => {
    const db = await getInstitutionDb(institutionId)
    const [row] = await db
      .insert(notifications)
      .values({
        userId: studentUserId,
        title: 'Fee reminder',
        body: 'A dummy fee notice for the header bell.',
        category: 'Fees',
      })
      .returning({ id: notifications.id })

    expect(await unreadCount(institutionId, studentUserId)).toBe(1)

    const listed = await markAccountNotificationRead(institutionId, studentUserId, row!.id)
    expect(listed.find((item) => item.id === row!.id)?.readAt).toBeTruthy()
    expect(await unreadCount(institutionId, studentUserId)).toBe(0)
  })
})
