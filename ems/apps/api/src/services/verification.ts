import { createHash, randomInt, timingSafeEqual } from 'node:crypto'
import { and, desc, eq, gt, isNull } from 'drizzle-orm'
import { getInstitutionDb } from '../db/connection'
import { users, verificationTokens } from '../db/institution/schema'
import { studentProfiles, students } from '../db/institution/schema/students'
import { badRequest, tooManyRequests } from '../lib/errors'
import { sendApplicantEmailVerification } from '../lib/admissions-email'
import { createLogger } from '../lib/logger'
import { sendSmsMessage } from '../lib/sms'
import { env } from '../config/env'

const log = createLogger('info', { service: 'stackedu-api', component: 'verification' })

const PURPOSE = 'email.verify'
const PHONE_PURPOSE = 'phone.verify'
const CODE_TTL_MINUTES = 15
const RESEND_COOLDOWN_SECONDS = 30

function phoneIdentifier(userId: string, phone: string): string {
  return `${userId}#${phone}`
}

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('base64url')
}

function generateCode(): string {
  return String(randomInt(100000, 999999))
}

/** Sends a fresh six-digit code and stores its hash for later verification. */
export async function issueApplicantEmailVerification(input: {
  institutionId: string
  userId: string
  email: string
  fullName: string
}): Promise<void> {
  const db = await getInstitutionDb(input.institutionId)
  const code = generateCode()
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString()

  await db.insert(verificationTokens).values({
    identifier: input.userId,
    tokenHash: hashCode(code),
    purpose: PURPOSE,
    expiresAt,
  })

  const sent = await sendApplicantEmailVerification({
    institutionId: input.institutionId,
    to: input.email,
    fullName: input.fullName,
    code,
  })

  if (!sent && env().NODE_ENV !== 'production') {
    log.info('Applicant email verification code (email not sent)', {
      email: input.email,
      code,
    })
  }
}

export async function verifyApplicantEmail(input: {
  institutionId: string
  userId: string
  code: string
}): Promise<string> {
  const db = await getInstitutionDb(input.institutionId)
  const now = new Date().toISOString()

  const [token] = await db
    .select({
      id: verificationTokens.id,
      tokenHash: verificationTokens.tokenHash,
      expiresAt: verificationTokens.expiresAt,
    })
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, input.userId),
        eq(verificationTokens.purpose, PURPOSE),
        isNull(verificationTokens.consumedAt),
        gt(verificationTokens.expiresAt, now),
      ),
    )
    .orderBy(desc(verificationTokens.createdAt))
    .limit(1)

  if (!token) throw badRequest('That code is invalid or has expired.')

  const presented = Buffer.from(hashCode(input.code))
  const stored = Buffer.from(token.tokenHash)
  if (presented.length !== stored.length || !timingSafeEqual(presented, stored)) {
    throw badRequest('That code is invalid or has expired.')
  }

  const verifiedAt = new Date().toISOString()

  await db
    .update(verificationTokens)
    .set({ consumedAt: verifiedAt })
    .where(eq(verificationTokens.id, token.id))

  await db.update(users).set({ emailVerifiedAt: verifiedAt }).where(eq(users.id, input.userId))

  return verifiedAt
}

async function findUnverifiedApplicant(
  institutionId: string,
  email: string,
): Promise<{ id: string; email: string; fullName: string }> {
  const normalised = email.trim().toLowerCase()
  const db = await getInstitutionDb(institutionId)

  const [account] = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      emailVerifiedAt: users.emailVerifiedAt,
      isActive: users.isActive,
    })
    .from(users)
    .where(and(eq(users.email, normalised), eq(users.role, 'Applicant')))
    .limit(1)

  if (!account?.isActive) throw badRequest('That account could not be found.')
  if (account.emailVerifiedAt) throw badRequest('That email address is already verified.')

  return { id: account.id, email: account.email, fullName: account.fullName }
}

export async function resendApplicantEmailVerificationByEmail(
  institutionId: string,
  email: string,
): Promise<void> {
  const account = await findUnverifiedApplicant(institutionId, email)
  await resendApplicantEmailVerification({
    institutionId,
    userId: account.id,
  })
}

export async function verifyApplicantEmailByEmail(input: {
  institutionId: string
  email: string
  code: string
}): Promise<string> {
  const account = await findUnverifiedApplicant(input.institutionId, input.email)
  return verifyApplicantEmail({
    institutionId: input.institutionId,
    userId: account.id,
    code: input.code,
  })
}

export async function resendApplicantEmailVerification(input: {
  institutionId: string
  userId: string
}): Promise<void> {
  const db = await getInstitutionDb(input.institutionId)

  const [latest] = await db
    .select({ createdAt: verificationTokens.createdAt })
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, input.userId),
        eq(verificationTokens.purpose, PURPOSE),
      ),
    )
    .orderBy(desc(verificationTokens.createdAt))
    .limit(1)

  if (latest?.createdAt) {
    const elapsed = Date.now() - new Date(latest.createdAt).getTime()
    if (elapsed < RESEND_COOLDOWN_SECONDS * 1000) {
      throw tooManyRequests('Please wait before requesting another code.')
    }
  }

  const [account] = await db
    .select({
      email: users.email,
      fullName: users.fullName,
      emailVerifiedAt: users.emailVerifiedAt,
    })
    .from(users)
    .where(eq(users.id, input.userId))
    .limit(1)

  if (!account) throw badRequest('That account could not be found.')
  if (account.emailVerifiedAt) return

  await issueApplicantEmailVerification({
    institutionId: input.institutionId,
    userId: input.userId,
    email: account.email,
    fullName: account.fullName,
  })
}

/** Sends a six-digit code for phone number verification via Twilio when configured. */
export async function issuePhoneVerification(input: {
  institutionId: string
  userId: string
  phone: string
}): Promise<void> {
  const db = await getInstitutionDb(input.institutionId)
  const code = generateCode()
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString()

  await db.insert(verificationTokens).values({
    identifier: phoneIdentifier(input.userId, input.phone),
    tokenHash: hashCode(code),
    purpose: PHONE_PURPOSE,
    expiresAt,
  })

  const sent = await sendSmsMessage(
    input.institutionId,
    input.phone,
    `Your StackEDU verification code is ${code}. It expires in ${CODE_TTL_MINUTES} minutes.`,
  )

  if (!sent && env().NODE_ENV !== 'production') {
    log.info('Phone verification code (SMS not sent)', {
      userId: input.userId,
      phone: input.phone,
      code,
    })
  }
}

export async function verifyPhoneUpdate(input: {
  institutionId: string
  userId: string
  phone: string
  code: string
}): Promise<string> {
  const db = await getInstitutionDb(input.institutionId)
  const now = new Date().toISOString()
  const identifier = phoneIdentifier(input.userId, input.phone)

  const [token] = await db
    .select({
      id: verificationTokens.id,
      tokenHash: verificationTokens.tokenHash,
    })
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, identifier),
        eq(verificationTokens.purpose, PHONE_PURPOSE),
        isNull(verificationTokens.consumedAt),
        gt(verificationTokens.expiresAt, now),
      ),
    )
    .orderBy(desc(verificationTokens.createdAt))
    .limit(1)

  if (!token) throw badRequest('That code is invalid or has expired.')

  const presented = Buffer.from(hashCode(input.code))
  const stored = Buffer.from(token.tokenHash)
  if (presented.length !== stored.length || !timingSafeEqual(presented, stored)) {
    throw badRequest('That code is invalid or has expired.')
  }

  const verifiedAt = new Date().toISOString()

  await db
    .update(verificationTokens)
    .set({ consumedAt: verifiedAt })
    .where(eq(verificationTokens.id, token.id))

  await db
    .update(users)
    .set({ phone: input.phone, phoneVerifiedAt: verifiedAt })
    .where(eq(users.id, input.userId))

  const [student] = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.userId, input.userId))
    .limit(1)

  if (student) {
    await db
      .update(studentProfiles)
      .set({ contactPhone: input.phone })
      .where(eq(studentProfiles.studentId, student.id))
  }

  return verifiedAt
}

export async function resendPhoneVerification(input: {
  institutionId: string
  userId: string
  phone: string
}): Promise<void> {
  const db = await getInstitutionDb(input.institutionId)
  const identifier = phoneIdentifier(input.userId, input.phone)

  const [latest] = await db
    .select({ createdAt: verificationTokens.createdAt })
    .from(verificationTokens)
    .where(and(eq(verificationTokens.identifier, identifier), eq(verificationTokens.purpose, PHONE_PURPOSE)))
    .orderBy(desc(verificationTokens.createdAt))
    .limit(1)

  if (latest?.createdAt) {
    const elapsed = Date.now() - new Date(latest.createdAt).getTime()
    if (elapsed < RESEND_COOLDOWN_SECONDS * 1000) {
      throw tooManyRequests('Please wait before requesting another code.')
    }
  }

  await issuePhoneVerification(input)
}
