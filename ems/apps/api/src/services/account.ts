import { and, desc, eq, isNull, ne, sql } from 'drizzle-orm'
import type {
  AccountLiveCursor,
  AccountProfile,
  ChangePasswordRequest,
  DisableTwoFactorRequest,
  EnableTwoFactorRequest,
  SessionUser,
  TwoFactorSetupResponse,
  UpdateAccountProfileRequest,
  UpdateAccountSecurityRequest,
} from '@stackedu/shared'
import { reachableNotificationActionUrl, splitFullName, titleAndFirstName, STUDENT_IDENTITY_CONTACT_MESSAGE } from '@stackedu/shared'
import { getInstitutionDb, getPlatformDb } from '../db/connection'
import { institutions, userDirectory } from '../db/platform/schema'
import { notifications } from '../db/institution/schema/communication'
import {
  applicationDocuments,
  applicationReviews,
  applications,
} from '../db/institution/schema/admissions'
import { timetableSlots } from '../db/institution/schema/teaching'
import { users, sessions } from '../db/institution/schema/people'
import { studentProfiles, students } from '../db/institution/schema/students'
import { faculties, departments, programmes } from '../db/institution/schema/academic'
import { badRequest, conflict, forbidden, notFound } from '../lib/errors'
import { hashPassword, verifyPassword } from '../lib/password'
import { createTotpSecret, totpQrDataUrl, totpUri, verifyTotpCode } from '../lib/totp'
import {
  issuePhoneVerification,
  resendPhoneVerification,
  verifyPhoneUpdate,
} from './verification'

function splitName(fullName: string): { firstName: string; lastName: string } {
  return splitFullName(fullName)
}

export async function getAccountProfile(institutionId: string, userId: string): Promise<AccountProfile> {
  const db = await getInstitutionDb(institutionId)
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      phone: users.phone,
      role: users.role,
      twoFactorEnabled: users.twoFactorEnabled,
      emailVerifiedAt: users.emailVerifiedAt,
      phoneVerifiedAt: users.phoneVerifiedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user) throw notFound('That account')

  const [institution] = await getPlatformDb()
    .select({ name: institutions.name, shortName: institutions.shortName })
    .from(institutions)
    .where(eq(institutions.id, institutionId))
    .limit(1)

  const [student] = await db
    .select({
      studentNumber: students.studentNumber,
      yearOfStudy: students.yearOfStudy,
      admittedAt: students.admittedAt,
      programmeName: programmes.name,
      facultyName: faculties.name,
    })
    .from(students)
    .innerJoin(programmes, eq(programmes.id, students.programmeId))
    .leftJoin(departments, eq(departments.id, programmes.departmentId))
    .leftJoin(faculties, eq(faculties.id, departments.facultyId))
    .where(eq(students.userId, userId))
    .limit(1)

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    firstName: titleAndFirstName(user.fullName),
    phone: user.phone,
    role: user.role,
    twoFactorEnabled: user.twoFactorEnabled,
    emailVerifiedAt: user.emailVerifiedAt,
    phoneVerifiedAt: user.phoneVerifiedAt,
    institutionName: institution?.name ?? 'Institution',
    institutionShortName: institution?.shortName ?? 'INS',
    studentNumber: student?.studentNumber ?? null,
    programmeName: student?.programmeName ?? null,
    yearOfStudy: student?.yearOfStudy ?? null,
    facultyName: student?.facultyName ?? null,
    admittedAt: student?.admittedAt ?? null,
  }
}

export async function updateAccountProfile(
  institutionId: string,
  user: SessionUser,
  input: UpdateAccountProfileRequest,
): Promise<AccountProfile> {
  if (user.role === 'Student') {
    throw badRequest(`Students can only update their phone number. ${STUDENT_IDENTITY_CONTACT_MESSAGE}`)
  }

  const db = await getInstitutionDb(institutionId)
  const email = input.email.trim().toLowerCase()
  const phone = input.phone === undefined ? undefined : input.phone

  if (email !== user.email) {
    const [taken] = await getPlatformDb()
      .select({ id: userDirectory.id })
      .from(userDirectory)
      .where(and(eq(userDirectory.email, email), ne(userDirectory.institutionUserId, user.id)))
      .limit(1)
    if (taken) throw conflict('An account with that email address already exists.')
  }

  await db
    .update(users)
    .set({
      fullName: input.fullName,
      email,
      ...(phone !== undefined ? { phone } : {}),
    })
    .where(eq(users.id, user.id))

  if (email !== user.email) {
    await getPlatformDb()
      .update(userDirectory)
      .set({ email })
      .where(eq(userDirectory.institutionUserId, user.id))
  }

  const [student] = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.userId, user.id))
    .limit(1)

  if (student) {
    const names = splitName(input.fullName)
    await db
      .update(studentProfiles)
      .set({
        firstName: names.firstName,
        lastName: names.lastName,
        ...(phone !== undefined ? { contactPhone: phone } : {}),
      })
      .where(eq(studentProfiles.studentId, student.id))
  }

  return getAccountProfile(institutionId, user.id)
}

export async function changeAccountPassword(
  institutionId: string,
  userId: string,
  input: ChangePasswordRequest,
): Promise<void> {
  const db = await getInstitutionDb(institutionId)
  const [account] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!account?.passwordHash) throw notFound('That account')
  if (!(await verifyPassword(input.currentPassword, account.passwordHash))) {
    throw badRequest('Current password is not correct.')
  }
  if (input.currentPassword === input.newPassword) {
    throw badRequest('Choose a new password that is different from the current one.')
  }

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(input.newPassword) })
    .where(eq(users.id, userId))

  await db
    .update(sessions)
    .set({ revokedAt: new Date().toISOString() })
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)))
}

export async function updateAccountSecurity(
  institutionId: string,
  userId: string,
  input: UpdateAccountSecurityRequest,
): Promise<AccountProfile> {
  if (input.twoFactorEnabled) {
    throw badRequest('Use the authenticator setup flow in Account Settings to turn on two-factor authentication.')
  }
  const db = await getInstitutionDb(institutionId)
  await db
    .update(users)
    .set({ twoFactorEnabled: false, twoFactorSecret: null })
    .where(eq(users.id, userId))
  return getAccountProfile(institutionId, userId)
}

function latestStamp(values: Array<string | null | undefined>): string | null {
  const present = values.filter((value): value is string => Boolean(value))
  if (present.length === 0) return null
  return present.sort().at(-1) ?? null
}

/** Stamps the open app polls so admissions and the timetable update without a reload. */
export async function getAccountLiveCursor(
  institutionId: string,
  userId: string,
): Promise<AccountLiveCursor> {
  const db = await getInstitutionDb(institutionId)
  // One connection at a time. Five parallel scans filled the Neon session
  // pool while the portal polled, and the queued work pushed the API over
  // Render's 512 MB limit.
  const [notes] = await db
    .select({ at: sql<string | null>`max(${notifications.createdAt})` })
    .from(notifications)
    .where(eq(notifications.userId, userId))
  const [documents] = await db
    .select({ at: sql<string | null>`max(${applicationDocuments.createdAt})` })
    .from(applicationDocuments)
  const [applicationsRow] = await db
    .select({ at: sql<string | null>`max(${applications.updatedAt})` })
    .from(applications)
  const [reviews] = await db
    .select({ at: sql<string | null>`max(${applicationReviews.createdAt})` })
    .from(applicationReviews)
  const [slots] = await db
    .select({ at: sql<string | null>`max(${timetableSlots.updatedAt})` })
    .from(timetableSlots)

  return {
    notificationsAt: notes?.at ?? null,
    admissionsAt: latestStamp([documents?.at, applicationsRow?.at, reviews?.at]),
    timetableAt: slots?.at ?? null,
  }
}

export async function listAccountNotifications(
  institutionId: string,
  userId: string,
  limit = 8,
) {
  const db = await getInstitutionDb(institutionId)
  const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1)
  const rows = await db
    .select({
      id: notifications.id,
      title: notifications.title,
      body: notifications.body,
      category: notifications.category,
      actionUrl: notifications.actionUrl,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
  if (!user) return rows
  return rows.map((row) => ({
    ...row,
    actionUrl: reachableNotificationActionUrl(user.role, row.actionUrl),
  }))
}

export async function markAccountNotificationRead(
  institutionId: string,
  userId: string,
  notificationId: string,
) {
  const db = await getInstitutionDb(institutionId)
  const [updated] = await db
    .update(notifications)
    .set({ readAt: new Date().toISOString() })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
    .returning({ id: notifications.id })
  if (!updated) throw notFound('That notification')
  return listAccountNotifications(institutionId, userId)
}

export async function setupAccountTwoFactor(
  institutionId: string,
  userId: string,
): Promise<TwoFactorSetupResponse> {
  const profile = await getAccountProfile(institutionId, userId)
  const secret = createTotpSecret()
  const otpauthUrl = totpUri({
    email: profile.email,
    issuer: profile.institutionName,
    secret,
  })
  return {
    secret,
    otpauthUrl,
    qrCodeDataUrl: await totpQrDataUrl(otpauthUrl),
  }
}

export async function enableAccountTwoFactor(
  institutionId: string,
  userId: string,
  input: EnableTwoFactorRequest,
): Promise<AccountProfile> {
  if (!verifyTotpCode(input.secret, input.code)) {
    throw badRequest('That code is not correct. Scan the QR code again and enter the latest code.')
  }
  const db = await getInstitutionDb(institutionId)
  await db
    .update(users)
    .set({ twoFactorEnabled: true, twoFactorSecret: input.secret })
    .where(eq(users.id, userId))
  return getAccountProfile(institutionId, userId)
}

export async function disableAccountTwoFactor(
  institutionId: string,
  userId: string,
  input: DisableTwoFactorRequest,
): Promise<AccountProfile> {
  const db = await getInstitutionDb(institutionId)
  const [account] = await db
    .select({ twoFactorSecret: users.twoFactorSecret })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  if (!account?.twoFactorSecret) throw badRequest('Two-factor authentication is not enabled.')
  if (!verifyTotpCode(account.twoFactorSecret, input.code)) {
    throw badRequest('That code is not correct.')
  }
  await db
    .update(users)
    .set({ twoFactorEnabled: false, twoFactorSecret: null })
    .where(eq(users.id, userId))
  return getAccountProfile(institutionId, userId)
}

export async function getAccountNotificationPreferences(
  institutionId: string,
  userId: string,
): Promise<Record<string, { email: boolean; sms: boolean; inapp: boolean }>> {
  const db = await getInstitutionDb(institutionId)
  const [row] = await db
    .select({ notificationPreferences: users.notificationPreferences })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  if (!row) throw notFound('That account')
  return row.notificationPreferences ?? {}
}

export async function updateAccountNotificationPreferences(
  institutionId: string,
  userId: string,
  input: { preferences: Array<{ key: string; email: boolean; sms: boolean; inapp: boolean }> },
): Promise<Record<string, { email: boolean; sms: boolean; inapp: boolean }>> {
  const db = await getInstitutionDb(institutionId)
  const stored = Object.fromEntries(
    input.preferences.map((item) => [item.key, { email: item.email, sms: item.sms, inapp: item.inapp }]),
  )
  const [updated] = await db
    .update(users)
    .set({ notificationPreferences: stored })
    .where(eq(users.id, userId))
    .returning({ notificationPreferences: users.notificationPreferences })
  if (!updated) throw notFound('That account')
  return updated.notificationPreferences ?? stored
}

export async function requestStudentPhoneVerification(
  institutionId: string,
  userId: string,
  phone: string,
): Promise<void> {
  const profile = await getAccountProfile(institutionId, userId)
  if (profile.role !== 'Student') throw forbidden('Only students use phone verification for profile updates.')

  const normalised = phone.trim().replace(/[\s-]/g, '')
  if (normalised === profile.phone) {
    throw badRequest('That is already your phone number.')
  }

  await issuePhoneVerification({ institutionId, userId, phone: normalised })
}

export async function verifyStudentPhoneUpdate(
  institutionId: string,
  userId: string,
  input: { phone: string; code: string },
): Promise<AccountProfile> {
  const profile = await getAccountProfile(institutionId, userId)
  if (profile.role !== 'Student') throw forbidden('Only students use phone verification for profile updates.')

  const normalised = input.phone.trim().replace(/[\s-]/g, '')
  await verifyPhoneUpdate({
    institutionId,
    userId,
    phone: normalised,
    code: input.code,
  })

  return getAccountProfile(institutionId, userId)
}

export async function resendStudentPhoneVerification(
  institutionId: string,
  userId: string,
  phone: string,
): Promise<void> {
  const profile = await getAccountProfile(institutionId, userId)
  if (profile.role !== 'Student') throw forbidden('Only students use phone verification for profile updates.')

  await resendPhoneVerification({
    institutionId,
    userId,
    phone: phone.trim().replace(/[\s-]/g, ''),
  })
}

export function sessionUserFrom(profile: AccountProfile, institution: SessionUser['institution']): SessionUser {
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.fullName,
    role: profile.role,
    emailVerifiedAt: profile.emailVerifiedAt,
    institution,
  }
}
