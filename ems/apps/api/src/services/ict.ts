import { randomBytes } from 'node:crypto'
import { and, desc, eq, gte, inArray, isNull, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import type {
  AnnouncementPreview,
  CreateAnnouncementRequest,
  CreateIctUserRequest,
  IctAnalytics,
  IctAnnouncement,
  IctAudienceOptions,
  IctAuditDetail,
  IctAuditRow,
  IctCreatedUser,
  IctDashboard,
  IctIntegration,
  IctNotification,
  IctPermission,
  IctProfile,
  IctProgrammeOption,
  IctRevocation,
  IctRole,
  IctSettings,
  IctUserDetail,
  IctUserRow,
  UpdateIctSettingsRequest,
  UpdateIctUserRequest,
  UpdateIntegrationRequest,
  UserRole,
} from '@stackedu/shared'
import {
  ATTENDANCE_POLICY_SETTING_KEY,
  attendancePolicySchema,
  auditActionLabel,
  auditSummary,
  DEFAULT_ATTENDANCE_POLICY,
  DEFAULT_PAYMENT_POLICY,
  INTEGRATION_CATALOG,
  integrationCatalogItem,
  isIntegrationCatalogProvider,
  paymentPolicySchema,
  titleAndFirstName,
} from '@stackedu/shared'
import { publicLogoUrl } from '../lib/branding'
import { readPublicAiSettings, writeAiRuntime } from '../lib/ai-complete'
import { publicIntegrationFields, saveIntegrationCredentials } from '../lib/integration-credentials'
import { probeIntegration } from '../lib/integration-probe'
import { getInstitutionDb, getPlatformDb } from '../db/connection'
import { readInstitutionSetting, upsertInstitutionSetting } from '../lib/institution-settings'
import { readPaymentPolicy, writePaymentPolicy } from '../lib/payment-policy-store'
import { deleteStoredObject, writeInstitutionLogo } from '../lib/storage'
import { institutions, userDirectory } from '../db/platform/schema'
import { programmes } from '../db/institution/schema/academic'
import { announcements } from '../db/institution/schema/teaching'
import { notifications } from '../db/institution/schema/communication'
import {
  accessRevocations,
  permissions,
  rolePermissions,
  roles,
  sessions,
  users,
} from '../db/institution/schema/people'
import { auditLogs, integrations } from '../db/institution/schema/settings'
import { studentProfiles, students } from '../db/institution/schema/students'
import { notifyUserIds } from './role-notifications'
import { writeAudit } from '../lib/audit'
import { sendEmail } from '../lib/email'
import { badRequest, conflict, forbidden, notFound } from '../lib/errors'
import { hashPassword } from '../lib/password'
import { createUser } from './users'
import {
  audienceLabel,
  decodeAudience,
  encodeAudience,
  listIctAudienceOptions,
  resolveAudienceUserIds,
} from './announcement-audience'

const DEFAULT_INTEGRATIONS = INTEGRATION_CATALOG.map((item) => ({
  provider: item.provider,
  displayName: item.displayName,
  isEnabled: item.provider === 'LiveKit' || item.provider === 'AI',
}))

function temporaryPassword(): string {
  return `Tmp#${randomBytes(4).toString('hex')}`
}

function withAuditSummary<T extends {
  action: string
  actorEmail?: string | null
  actorRole?: string | null
  targetType?: string | null
  targetId?: string | null
  createdAt?: string
  changes?: Record<string, { from?: unknown; to?: unknown }> | null
  metadata?: Record<string, unknown> | null
}>(row: T): T & { actionLabel: string; summary: string } {
  return {
    ...row,
    actionLabel: auditActionLabel(row.action),
    summary: auditSummary(row),
  }
}

function profileFirstName(fullName: string): string {
  return titleAndFirstName(fullName)
}

async function unreadCount(institutionId: string, userId: string): Promise<number> {
  const db = await getInstitutionDb(institutionId)
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
  return row?.count ?? 0
}

export async function getIctProfile(institutionId: string, userId: string): Promise<IctProfile> {
  const db = await getInstitutionDb(institutionId)
  const platform = getPlatformDb()
  const [user] = await db
    .select({
      userId: users.id,
      fullName: users.fullName,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  if (!user) throw forbidden('This account is not an ICT manager.')

  const [institution] = await platform
    .select({ name: institutions.name, shortName: institutions.shortName })
    .from(institutions)
    .where(eq(institutions.id, institutionId))
    .limit(1)

  return {
    userId: user.userId,
    fullName: user.fullName,
    firstName: profileFirstName(user.fullName),
    email: user.email,
    role: user.role,
    institutionName: institution?.name ?? 'Institution',
    institutionShortName: institution?.shortName ?? 'INS',
    unreadCount: await unreadCount(institutionId, userId),
  }
}

export async function getIctDashboard(institutionId: string, userId: string): Promise<IctDashboard> {
  const profile = await getIctProfile(institutionId, userId)
  const db = await getInstitutionDb(institutionId)

  const [totals] = await db
    .select({
      totalUsers: sql<number>`count(*)::int`,
      activeUsers: sql<number>`count(*) filter (where ${users.isActive})::int`,
    })
    .from(users)

  const [sessionRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sessions)
    .where(and(isNull(sessions.revokedAt), sql`${sessions.expiresAt} > now()`))

  const [revocationRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(accessRevocations)
    .where(isNull(accessRevocations.restoredAt))

  const roleRows = await db
    .select({ role: users.role, count: sql<number>`count(*)::int` })
    .from(users)
    .groupBy(users.role)

  const recentAuditRows = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      actorEmail: auditLogs.actorEmail,
      actorRole: auditLogs.actorRole,
      targetType: auditLogs.targetType,
      targetId: auditLogs.targetId,
      createdAt: auditLogs.createdAt,
      changes: auditLogs.changes,
      metadata: auditLogs.metadata,
    })
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(8)

  const recentAudit = await Promise.all(recentAuditRows.map((row) => enrichAuditRow(institutionId, row)))

  return {
    profile,
    totalUsers: totals?.totalUsers ?? 0,
    activeUsers: totals?.activeUsers ?? 0,
    activeSessions: sessionRow?.count ?? 0,
    pendingRevocations: revocationRow?.count ?? 0,
    usersByRole: roleRows,
    recentAudit: recentAudit.map((row) => ({
      id: row.id,
      action: row.action,
      summary: row.summary,
      actorEmail: row.actorEmail,
      createdAt: row.createdAt,
    })),
  }
}

export async function getIctAnalytics(institutionId: string): Promise<IctAnalytics> {
  const db = await getInstitutionDb(institutionId)
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString()

  const [totals] = await db
    .select({
      totalUsers: sql<number>`count(*)::int`,
      activeUsers: sql<number>`count(*) filter (where ${users.isActive})::int`,
    })
    .from(users)

  const [sessionRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sessions)
    .where(and(isNull(sessions.revokedAt), sql`${sessions.expiresAt} > now()`))

  const [revocationRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(accessRevocations)
    .where(isNull(accessRevocations.restoredAt))

  const roleRows = await db
    .select({ role: users.role, count: sql<number>`count(*)::int` })
    .from(users)
    .groupBy(users.role)

  const [loginRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(gte(users.lastLoginAt, sevenDaysAgo))

  const [newUserRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(gte(users.createdAt, thirtyDaysAgo))

  const [auditRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(auditLogs)
    .where(gte(auditLogs.createdAt, thirtyDaysAgo))

  await ensureIntegrations(institutionId)
  const integrationRows = await db
    .select({
      total: sql<number>`count(*)::int`,
      enabled: sql<number>`count(*) filter (where ${integrations.isEnabled})::int`,
    })
    .from(integrations)

  return {
    totalUsers: totals?.totalUsers ?? 0,
    activeUsers: totals?.activeUsers ?? 0,
    activeSessions: sessionRow?.count ?? 0,
    pendingRevocations: revocationRow?.count ?? 0,
    usersByRole: roleRows,
    loginsLast7Days: loginRow?.count ?? 0,
    newUsersLast30Days: newUserRow?.count ?? 0,
    auditEventsLast30Days: auditRow?.count ?? 0,
    integrationsEnabled: integrationRows[0]?.enabled ?? 0,
    integrationsTotal: integrationRows[0]?.total ?? 0,
  }
}

export async function checkIctIntegration(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  integrationId: string,
): Promise<IctIntegration> {
  await ensureIntegrations(institutionId)
  const db = await getInstitutionDb(institutionId)
  const [existing] = await db
    .select({
      id: integrations.id,
      provider: integrations.provider,
      displayName: integrations.displayName,
      isEnabled: integrations.isEnabled,
    })
    .from(integrations)
    .where(eq(integrations.id, integrationId))
    .limit(1)
  if (!existing) throw notFound('That integration')

  const probe = await probeIntegration(institutionId, existing.provider, existing.isEnabled)
  const lastStatus = probe.message
  const lastCheckedAt = new Date().toISOString()
  const [updated] = await db
    .update(integrations)
    .set({ lastStatus, lastCheckedAt })
    .where(eq(integrations.id, integrationId))
    .returning({
      id: integrations.id,
      provider: integrations.provider,
      displayName: integrations.displayName,
      isEnabled: integrations.isEnabled,
      lastStatus: integrations.lastStatus,
      lastCheckedAt: integrations.lastCheckedAt,
    })

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'integration.check',
    targetType: 'integration',
    targetId: integrationId,
    metadata: { integrationName: existing.displayName, provider: existing.provider, lastStatus },
  })

  const mapped = await toPublicIntegration(institutionId, updated!)
  return { ...mapped, checkOk: probe.ok }
}

export async function listIctUsers(institutionId: string): Promise<IctUserRow[]> {
  const db = await getInstitutionDb(institutionId)
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      phone: users.phone,
      role: users.role,
      isActive: users.isActive,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
      studentNumber: students.studentNumber,
    })
    .from(users)
    .leftJoin(students, eq(students.userId, users.id))
    .orderBy(users.fullName)

  return rows
}

export async function getIctUser(institutionId: string, userId: string): Promise<IctUserDetail> {
  const db = await getInstitutionDb(institutionId)
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      phone: users.phone,
      role: users.role,
      isActive: users.isActive,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
      deactivatedAt: users.deactivatedAt,
      studentNumber: students.studentNumber,
    })
    .from(users)
    .leftJoin(students, eq(students.userId, users.id))
    .where(eq(users.id, userId))
    .limit(1)
  if (!row) throw notFound('That user')
  return row
}

export async function listIctProgrammes(institutionId: string): Promise<IctProgrammeOption[]> {
  const db = await getInstitutionDb(institutionId)
  return db
    .select({ id: programmes.id, code: programmes.code, name: programmes.name })
    .from(programmes)
    .where(eq(programmes.isActive, true))
    .orderBy(programmes.code)
}

async function nextStudentNumber(institutionId: string): Promise<string> {
  const profile = await getPlatformDb()
    .select({ shortName: institutions.shortName })
    .from(institutions)
    .where(eq(institutions.id, institutionId))
    .limit(1)
  const prefix = `${profile[0]?.shortName ?? 'INS'}-${new Date().getFullYear()}-`
  const db = await getInstitutionDb(institutionId)
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(students)
  const next = (row?.count ?? 0) + 1
  return `${prefix}${String(next).padStart(4, '0')}`
}

export async function createIctUser(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  input: CreateIctUserRequest,
): Promise<IctCreatedUser> {
  if (input.role === 'Student' && !input.programmeId) {
    throw badRequest('Choose a programme for a student account.')
  }

  const password = temporaryPassword()
  const created = await createUser({
    institutionId,
    email: input.email,
    fullName: input.fullName,
    role: input.role,
    password,
    phone: input.phone,
  })

  let studentNumber: string | null = null
  if (input.role === 'Student' && input.programmeId) {
    const db = await getInstitutionDb(institutionId)
    studentNumber = await nextStudentNumber(institutionId)
    const [student] = await db
      .insert(students)
      .values({
        userId: created.id,
        studentNumber,
        programmeId: input.programmeId,
        yearOfStudy: input.yearOfStudy ?? 1,
        admittedAt: new Date().toISOString().slice(0, 10),
      })
      .returning({ id: students.id })

    if (student) {
      const [given, ...rest] = input.fullName.split(' ')
      await db.insert(studentProfiles).values({
        studentId: student.id,
        firstName: given ?? input.fullName,
        lastName: rest.join(' ') || given || input.fullName,
        contactPhone: input.phone ?? null,
      })
    }

    await getPlatformDb()
      .update(userDirectory)
      .set({ alternateIdentifier: studentNumber })
      .where(eq(userDirectory.institutionUserId, created.id))
  }

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'user.create',
    targetType: 'user',
    targetId: created.id,
    metadata: { role: input.role, email: created.email, fullName: created.fullName },
  })

  void sendEmail({
    to: created.email,
    subject: 'Your StackEDU account',
    institutionId,
    text: `Hello ${created.fullName}. Your account is ready. Sign in with ${created.email} and temporary password ${password}. Change it after you sign in.`,
    html: `<p>Hello ${created.fullName}.</p><p>Your account is ready. Sign in with <strong>${created.email}</strong> and temporary password <strong>${password}</strong>.</p><p>Change it after you sign in.</p>`,
  })

  const user = await getIctUser(institutionId, created.id)
  return { user, temporaryPassword: password }
}

export async function updateIctUser(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  userId: string,
  input: UpdateIctUserRequest,
): Promise<IctUserDetail> {
  if (userId === actor.id && input.isActive === false) {
    throw badRequest('You cannot deactivate your own account.')
  }

  const db = await getInstitutionDb(institutionId)
  const existing = await getIctUser(institutionId, userId)
  await db
    .update(users)
    .set({
      ...(input.fullName ? { fullName: input.fullName } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.isActive !== undefined
        ? { isActive: input.isActive, deactivatedAt: input.isActive ? null : new Date().toISOString() }
        : {}),
    })
    .where(eq(users.id, userId))

  if (input.isActive !== undefined) {
    await getPlatformDb()
      .update(userDirectory)
      .set({ isActive: input.isActive })
      .where(eq(userDirectory.institutionUserId, userId))
  }

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'user.update',
    targetType: 'user',
    targetId: userId,
    metadata: { email: existing.email, fullName: existing.fullName },
    changes: {
      ...(input.fullName && input.fullName !== existing.fullName
        ? { fullName: { from: existing.fullName, to: input.fullName } }
        : {}),
      ...(input.isActive !== undefined && input.isActive !== existing.isActive
        ? { isActive: { from: existing.isActive, to: input.isActive } }
        : {}),
    },
  })

  return getIctUser(institutionId, userId)
}

export async function resetIctUserPassword(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  userId: string,
) {
  const user = await getIctUser(institutionId, userId)
  const password = temporaryPassword()
  const db = await getInstitutionDb(institutionId)
  await db.update(users).set({ passwordHash: await hashPassword(password) }).where(eq(users.id, userId))
  await db
    .update(sessions)
    .set({ revokedAt: new Date().toISOString() })
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)))

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'user.resetPassword',
    targetType: 'user',
    targetId: userId,
    metadata: { email: user.email, fullName: user.fullName },
  })

  void sendEmail({
    to: user.email,
    subject: 'Your StackEDU password was reset',
    institutionId,
    text: `Hello ${user.fullName}. Your temporary password is ${password}. Sign in and change it.`,
    html: `<p>Hello ${user.fullName}.</p><p>Your temporary password is <strong>${password}</strong>.</p>`,
  })

  return { temporaryPassword: password }
}

export async function revokeIctUser(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  userId: string,
  reason: string,
): Promise<IctRevocation> {
  if (userId === actor.id) throw badRequest('You cannot revoke your own access.')

  const user = await getIctUser(institutionId, userId)
  if (user.role === 'ICTManager') {
    const db = await getInstitutionDb(institutionId)
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(and(eq(users.role, 'ICTManager'), eq(users.isActive, true)))
    if ((row?.count ?? 0) <= 1) throw badRequest('The last ICT manager cannot be revoked.')
  }

  const now = new Date().toISOString()
  const db = await getInstitutionDb(institutionId)
  await db
    .update(users)
    .set({ isActive: false, deactivatedAt: now })
    .where(eq(users.id, userId))
  await db
    .update(sessions)
    .set({ revokedAt: now })
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)))
  await getPlatformDb()
    .update(userDirectory)
    .set({ isActive: false })
    .where(eq(userDirectory.institutionUserId, userId))

  const [revocation] = await db
    .insert(accessRevocations)
    .values({
      userId,
      revokedBy: actor.id,
      reason,
      effectiveAt: now,
    })
    .returning({ id: accessRevocations.id })

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'user.revoke',
    targetType: 'user',
    targetId: userId,
    metadata: { reason, email: user.email, fullName: user.fullName },
  })

  return getIctRevocation(institutionId, revocation!.id)
}

export async function restoreIctUser(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  revocationId: string,
): Promise<IctRevocation> {
  const db = await getInstitutionDb(institutionId)
  const [row] = await db
    .select({ id: accessRevocations.id, userId: accessRevocations.userId })
    .from(accessRevocations)
    .where(eq(accessRevocations.id, revocationId))
    .limit(1)
  if (!row) throw notFound('That revocation')

  const now = new Date().toISOString()
  await db
    .update(accessRevocations)
    .set({ restoredAt: now, restoredBy: actor.id })
    .where(eq(accessRevocations.id, revocationId))
  await db
    .update(users)
    .set({ isActive: true, deactivatedAt: null })
    .where(eq(users.id, row.userId))
  await getPlatformDb()
    .update(userDirectory)
    .set({ isActive: true })
    .where(eq(userDirectory.institutionUserId, row.userId))

  const restoredUser = await getIctUser(institutionId, row.userId)

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'user.restore',
    targetType: 'user',
    targetId: row.userId,
    metadata: { email: restoredUser.email, fullName: restoredUser.fullName },
  })

  return getIctRevocation(institutionId, revocationId)
}

export async function listIctRevocations(institutionId: string): Promise<IctRevocation[]> {
  const db = await getInstitutionDb(institutionId)
  const revokedByUsers = alias(users, 'revoked_by_users')
  return db
    .select({
      id: accessRevocations.id,
      userId: accessRevocations.userId,
      userName: users.fullName,
      userEmail: users.email,
      userRole: users.role,
      reason: accessRevocations.reason,
      revokedByName: revokedByUsers.fullName,
      effectiveAt: accessRevocations.effectiveAt,
      restoredAt: accessRevocations.restoredAt,
    })
    .from(accessRevocations)
    .innerJoin(users, eq(users.id, accessRevocations.userId))
    .leftJoin(revokedByUsers, eq(revokedByUsers.id, accessRevocations.revokedBy))
    .orderBy(desc(accessRevocations.effectiveAt))
}

export async function getIctRevocation(institutionId: string, id: string): Promise<IctRevocation> {
  const rows = await listIctRevocations(institutionId)
  const row = rows.find((item) => item.id === id)
  if (!row) throw notFound('That revocation')
  return row
}

export async function listIctRoles(institutionId: string): Promise<{
  roles: IctRole[]
  catalogue: IctPermission[]
}> {
  const db = await getInstitutionDb(institutionId)
  const roleRows = await db.select().from(roles).orderBy(roles.name)
  const catalogue = await db
    .select({
      key: permissions.key,
      module: permissions.module,
      description: permissions.description,
    })
    .from(permissions)
    .orderBy(permissions.module, permissions.key)

  const links = await db
    .select({ roleId: rolePermissions.roleId, key: permissions.key })
    .from(rolePermissions)
    .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))

  const keysByRole = new Map<string, string[]>()
  for (const link of links) {
    const current = keysByRole.get(link.roleId) ?? []
    current.push(link.key)
    keysByRole.set(link.roleId, current)
  }

  return {
    catalogue,
    roles: roleRows.map((row) => ({
      key: row.key,
      name: row.name,
      description: row.description,
      isSystem: row.isSystem,
      permissions: (keysByRole.get(row.id) ?? []).sort(),
    })),
  }
}

export async function updateIctRolePermissions(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  roleKey: UserRole,
  permissionKeys: string[],
): Promise<IctRole> {
  if (roleKey === 'ICTManager') {
    const required = ['users.read', 'users.write', 'roles.manage']
    if (required.some((key) => !permissionKeys.includes(key))) {
      throw badRequest('An ICT manager must keep user and role permissions.')
    }
  }

  const db = await getInstitutionDb(institutionId)
  const [role] = await db.select().from(roles).where(eq(roles.key, roleKey)).limit(1)
  if (!role) throw notFound('That role')

  const catalogue = await db.select({ id: permissions.id, key: permissions.key }).from(permissions)
  const idByKey = new Map(catalogue.map((row) => [row.key, row.id]))
  const unknown = permissionKeys.filter((key) => !idByKey.has(key))
  if (unknown.length) throw badRequest('One or more permissions are not recognised.')

  await db.delete(rolePermissions).where(eq(rolePermissions.roleId, role.id))
  if (permissionKeys.length) {
    await db.insert(rolePermissions).values(
      permissionKeys.map((key) => ({
        roleId: role.id,
        permissionId: idByKey.get(key)!,
        grantedBy: actor.id,
      })),
    )
  }

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'role.permissions',
    targetType: 'role',
    targetId: roleKey,
    metadata: { permissionKeys },
  })

  const listed = await listIctRoles(institutionId)
  return listed.roles.find((item) => item.key === roleKey)!
}

async function enrichAuditRow<T extends {
  action: string
  actorEmail?: string | null
  actorRole?: string | null
  targetType?: string | null
  targetId?: string | null
  createdAt?: string
  changes?: Record<string, { from?: unknown; to?: unknown }> | null
  metadata?: Record<string, unknown> | null
}>(institutionId: string, row: T): Promise<T & { actionLabel: string; summary: string }> {
  const db = await getInstitutionDb(institutionId)
  const metadata = { ...(row.metadata ?? {}) }

  if (row.targetType === 'integration' && row.targetId && !metadata.integrationName) {
    const [integration] = await db
      .select({ displayName: integrations.displayName, provider: integrations.provider })
      .from(integrations)
      .where(eq(integrations.id, row.targetId))
      .limit(1)
    if (integration) {
      metadata.integrationName = integration.displayName
      metadata.provider = integration.provider
    }
  }

  if (row.targetType === 'user' && row.targetId && (!metadata.email || !metadata.fullName)) {
    const [user] = await db
      .select({ email: users.email, fullName: users.fullName })
      .from(users)
      .where(eq(users.id, row.targetId))
      .limit(1)
    if (user) {
      metadata.email ??= user.email
      metadata.fullName ??= user.fullName
    }
  }

  if (row.targetType === 'announcement' && row.targetId && !metadata.title) {
    const [announcement] = await db
      .select({ title: announcements.title })
      .from(announcements)
      .where(eq(announcements.id, row.targetId))
      .limit(1)
    if (announcement) metadata.title = announcement.title
  }

  return withAuditSummary({ ...row, metadata })
}

export async function listIctAudit(institutionId: string): Promise<IctAuditRow[]> {
  const db = await getInstitutionDb(institutionId)
  const rows = await db
    .select({
      id: auditLogs.id,
      actorEmail: auditLogs.actorEmail,
      actorRole: auditLogs.actorRole,
      action: auditLogs.action,
      targetType: auditLogs.targetType,
      targetId: auditLogs.targetId,
      createdAt: auditLogs.createdAt,
      changes: auditLogs.changes,
      metadata: auditLogs.metadata,
    })
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(200)

  return Promise.all(rows.map((row) => enrichAuditRow(institutionId, row)))
}

export async function getIctAuditEntry(institutionId: string, id: string): Promise<IctAuditDetail> {
  const db = await getInstitutionDb(institutionId)
  const [row] = await db
    .select({
      id: auditLogs.id,
      actorEmail: auditLogs.actorEmail,
      actorRole: auditLogs.actorRole,
      action: auditLogs.action,
      targetType: auditLogs.targetType,
      targetId: auditLogs.targetId,
      createdAt: auditLogs.createdAt,
      changes: auditLogs.changes,
      metadata: auditLogs.metadata,
      ipAddress: auditLogs.ipAddress,
      requestId: auditLogs.requestId,
    })
    .from(auditLogs)
    .where(eq(auditLogs.id, id))
    .limit(1)
  if (!row) throw notFound('That audit entry')

  const enriched = await enrichAuditRow(institutionId, row)
  return {
    id: enriched.id,
    actorEmail: enriched.actorEmail,
    actorRole: enriched.actorRole,
    action: enriched.action,
    actionLabel: enriched.actionLabel,
    summary: enriched.summary,
    targetType: enriched.targetType,
    targetId: enriched.targetId,
    createdAt: enriched.createdAt,
    changes: enriched.changes ?? null,
    metadata: enriched.metadata ?? null,
    ipAddress: row.ipAddress,
    requestId: row.requestId,
  }
}

export async function getIctSettings(institutionId: string): Promise<IctSettings> {
  const [row] = await getPlatformDb()
    .select({
      name: institutions.name,
      shortName: institutions.shortName,
      contactEmail: institutions.contactEmail,
      timezone: institutions.timezone,
      locale: institutions.locale,
      slug: institutions.slug,
      website: institutions.website,
      location: institutions.location,
      logoFileKey: institutions.logoFileKey,
      brandColor: institutions.brandColor,
      updatedAt: institutions.updatedAt,
    })
    .from(institutions)
    .where(eq(institutions.id, institutionId))
    .limit(1)
  if (!row) throw notFound('That institution')

  const db = await getInstitutionDb(institutionId)
  const attendancePolicy = await readInstitutionSetting(
    db,
    ATTENDANCE_POLICY_SETTING_KEY,
    attendancePolicySchema,
    DEFAULT_ATTENDANCE_POLICY,
  )
  const paymentPolicy = await readPaymentPolicy(db)
  const ai = await readPublicAiSettings(institutionId)
  return mapIctSettings(row, attendancePolicy, paymentPolicy, ai)
}

function mapIctSettings(
  row: {
    name: string
    shortName: string
    contactEmail: string
    timezone: string
    locale: string
    slug: string
    website: string | null
    location: string | null
    logoFileKey: string | null
    brandColor: string | null
    updatedAt: string
  },
  attendancePolicy = DEFAULT_ATTENDANCE_POLICY,
  paymentPolicy = DEFAULT_PAYMENT_POLICY,
  ai: IctSettings['ai'] = {
    provider: 'builtin',
    model: null,
    providers: [],
  },
): IctSettings {
  return {
    name: row.name,
    shortName: row.shortName,
    contactEmail: row.contactEmail,
    timezone: row.timezone,
    locale: row.locale === 'fr' || row.locale === 'rw' ? row.locale : 'en',
    slug: row.slug,
    website: row.website,
    location: row.location,
    logoUrl: publicLogoUrl(row),
    brandColor: row.brandColor,
    attendancePolicy,
    paymentPolicy,
    ai,
  }
}

function normaliseWebsite(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined
  const trimmed = value?.trim() ?? ''
  if (!trimmed) return null
  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
    return url.toString()
  } catch {
    throw badRequest('Enter a valid website URL.')
  }
}

export async function updateIctSettings(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  input: UpdateIctSettingsRequest,
): Promise<IctSettings> {
  const current = await getIctSettings(institutionId)
  const website = normaliseWebsite(input.website)
  const platformPatch = {
    ...(input.name ? { name: input.name } : {}),
    ...(input.shortName ? { shortName: input.shortName } : {}),
    ...(input.contactEmail ? { contactEmail: input.contactEmail } : {}),
    ...(input.timezone ? { timezone: input.timezone } : {}),
    ...(input.locale ? { locale: input.locale } : {}),
    ...(website !== undefined ? { website } : {}),
    ...(input.location !== undefined ? { location: input.location?.trim() || null } : {}),
    ...(input.brandColor !== undefined
      ? { brandColor: input.brandColor ? input.brandColor.toUpperCase() : null }
      : {}),
  }
  if (Object.keys(platformPatch).length > 0) {
    await getPlatformDb()
      .update(institutions)
      .set(platformPatch)
      .where(eq(institutions.id, institutionId))
  }

  if (input.attendancePolicy) {
    const db = await getInstitutionDb(institutionId)
    const nextPolicy = attendancePolicySchema.parse({
      ...current.attendancePolicy,
      ...input.attendancePolicy,
    })
    await upsertInstitutionSetting(
      db,
      ATTENDANCE_POLICY_SETTING_KEY,
      nextPolicy,
      {
        category: 'Teaching',
        description: 'Whether lecturers may edit submitted attendance and for how long.',
      },
      actor.id,
    )
  }

  if (input.paymentPolicy) {
    const db = await getInstitutionDb(institutionId)
    const nextPolicy = paymentPolicySchema.parse({
      ...current.paymentPolicy,
      ...input.paymentPolicy,
    })
    await writePaymentPolicy(db, nextPolicy, actor.id)
  }

  if (input.aiProvider !== undefined || input.aiModel !== undefined || input.aiApiKey) {
    await writeAiRuntime(institutionId, actor.id, {
      provider: input.aiProvider,
      model: input.aiModel,
      apiKey: input.aiApiKey,
    })
  }

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'settings.update',
    targetType: 'institution',
    targetId: institutionId,
    changes: {
      ...(input.name && input.name !== current.name ? { name: { from: current.name, to: input.name } } : {}),
      ...(input.brandColor !== undefined && (input.brandColor ?? null) !== current.brandColor
        ? { brandColor: { from: current.brandColor, to: input.brandColor ?? null } }
        : {}),
      ...(input.aiProvider && input.aiProvider !== current.ai.provider
        ? { aiProvider: { from: current.ai.provider, to: input.aiProvider } }
        : {}),
    },
  })

  return getIctSettings(institutionId)
}

export async function uploadInstitutionLogo(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  input: { body: Buffer; mimeType: string },
): Promise<IctSettings> {
  const [existing] = await getPlatformDb()
    .select({ logoFileKey: institutions.logoFileKey })
    .from(institutions)
    .where(eq(institutions.id, institutionId))
    .limit(1)

  const logoFileKey = await writeInstitutionLogo({
    institutionId,
    body: input.body,
    mimeType: input.mimeType,
  })

  await getPlatformDb()
    .update(institutions)
    .set({ logoFileKey })
    .where(eq(institutions.id, institutionId))

  // A logo saved in a different format lands under a different key, so the
  // previous file would otherwise be left behind for good.
  if (existing?.logoFileKey && existing.logoFileKey !== logoFileKey) {
    await deleteStoredObject(existing.logoFileKey).catch(() => undefined)
  }

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'settings.logo.upload',
    targetType: 'institution',
    targetId: institutionId,
  })

  return getIctSettings(institutionId)
}

async function ensureIntegrations(institutionId: string) {
  const db = await getInstitutionDb(institutionId)
  const existing = await db
    .select({ id: integrations.id, provider: integrations.provider, displayName: integrations.displayName })
    .from(integrations)
  const have = new Map(existing.map((row) => [row.provider, row]))
  const missing = DEFAULT_INTEGRATIONS.filter((item) => !have.has(item.provider))
  if (missing.length) {
    await db.insert(integrations).values(missing)
  }
  for (const item of DEFAULT_INTEGRATIONS) {
    const row = have.get(item.provider)
    if (row && row.displayName !== item.displayName) {
      await db.update(integrations).set({ displayName: item.displayName }).where(eq(integrations.id, row.id))
    }
  }
}

async function toPublicIntegration(
  institutionId: string,
  row: {
    id: string
    provider: string
    displayName: string
    isEnabled: boolean
    lastStatus: string | null
    lastCheckedAt: string | null
  },
): Promise<IctIntegration> {
  const catalog = integrationCatalogItem(row.provider)
  return {
    id: row.id,
    provider: row.provider,
    displayName: catalog?.displayName ?? row.displayName,
    category: catalog?.category ?? 'payments',
    description: catalog?.description ?? 'Connected service.',
    docsUrl: catalog?.docsUrl ?? null,
    setupSteps: catalog?.setupSteps ?? [],
    isEnabled: row.isEnabled,
    lastStatus: row.lastStatus,
    lastCheckedAt: row.lastCheckedAt,
    fields: await publicIntegrationFields(institutionId, row.provider),
  }
}

export async function listIctIntegrations(institutionId: string): Promise<IctIntegration[]> {
  await ensureIntegrations(institutionId)
  const db = await getInstitutionDb(institutionId)
  const rows = await db
    .select({
      id: integrations.id,
      provider: integrations.provider,
      displayName: integrations.displayName,
      isEnabled: integrations.isEnabled,
      lastStatus: integrations.lastStatus,
      lastCheckedAt: integrations.lastCheckedAt,
    })
    .from(integrations)

  const catalogOrder = new Map(INTEGRATION_CATALOG.map((item, index) => [item.provider, index]))
  rows.sort((a, b) => (catalogOrder.get(a.provider) ?? 99) - (catalogOrder.get(b.provider) ?? 99))
  return Promise.all(rows.map((row) => toPublicIntegration(institutionId, row)))
}

export async function updateIctIntegration(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  integrationId: string,
  input: UpdateIntegrationRequest,
): Promise<IctIntegration> {
  const db = await getInstitutionDb(institutionId)
  const [existing] = await db
    .select({
      id: integrations.id,
      provider: integrations.provider,
      displayName: integrations.displayName,
      isEnabled: integrations.isEnabled,
      lastStatus: integrations.lastStatus,
      lastCheckedAt: integrations.lastCheckedAt,
    })
    .from(integrations)
    .where(eq(integrations.id, integrationId))
    .limit(1)
  if (!existing) throw notFound('That integration')

  if (input.credentials && Object.keys(input.credentials).length > 0) {
    if (!isIntegrationCatalogProvider(existing.provider)) {
      throw badRequest('That integration cannot store credentials.')
    }
    await saveIntegrationCredentials(institutionId, actor.id, existing.provider, input.credentials)
  }

  const isEnabled = input.isEnabled ?? existing.isEnabled
  const lastStatus =
    input.isEnabled === undefined
      ? existing.lastStatus
      : input.isEnabled
        ? 'Enabled'
        : 'Disabled'
  const lastCheckedAt = input.isEnabled === undefined ? existing.lastCheckedAt : new Date().toISOString()

  const [updated] = await db
    .update(integrations)
    .set({
      isEnabled,
      lastStatus,
      lastCheckedAt,
      displayName: integrationCatalogItem(existing.provider)?.displayName ?? existing.displayName,
    })
    .where(eq(integrations.id, integrationId))
    .returning({
      id: integrations.id,
      provider: integrations.provider,
      displayName: integrations.displayName,
      isEnabled: integrations.isEnabled,
      lastStatus: integrations.lastStatus,
      lastCheckedAt: integrations.lastCheckedAt,
    })
  if (!updated) throw notFound('That integration')

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'integration.update',
    targetType: 'integration',
    targetId: integrationId,
    metadata: { integrationName: updated.displayName, provider: updated.provider },
    changes: {
      ...(input.isEnabled !== undefined && input.isEnabled !== existing.isEnabled
        ? { isEnabled: { from: existing.isEnabled, to: input.isEnabled } }
        : {}),
      ...(input.credentials && Object.keys(input.credentials).length > 0
        ? { credentials: { from: 'hidden', to: 'updated' } }
        : {}),
    },
  })

  return toPublicIntegration(institutionId, updated)
}

export async function listIctAnnouncements(institutionId: string): Promise<IctAnnouncement[]> {
  const db = await getInstitutionDb(institutionId)
  const rows = await db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      audienceRoles: announcements.audienceRoles,
      isPinned: announcements.isPinned,
      publishedAt: announcements.publishedAt,
      createdAt: announcements.createdAt,
    })
    .from(announcements)
    .where(isNull(announcements.courseOfferingId))
    .orderBy(desc(announcements.createdAt))

  return Promise.all(rows.map(async (row) => ({
    ...row,
    audienceLabel: await audienceLabel(institutionId, row.audienceRoles),
  })))
}

export async function getIctAudienceOptions(institutionId: string): Promise<IctAudienceOptions> {
  return listIctAudienceOptions(institutionId)
}

export async function previewIctAnnouncement(
  institutionId: string,
  input: { audience?: CreateAnnouncementRequest['audience']; audienceRoles?: string[] },
): Promise<AnnouncementPreview> {
  const audience = input.audience ?? decodeAudience(input.audienceRoles ?? [])
  const ids = await resolveAudienceUserIds(institutionId, audience)
  const db = await getInstitutionDb(institutionId)
  const sample = ids.length
    ? await db
      .select({ id: users.id, fullName: users.fullName, email: users.email, role: users.role })
      .from(users)
      .where(inArray(users.id, ids.slice(0, 8)))
    : []

  return { recipientCount: ids.length, sample }
}

export async function createIctAnnouncement(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  input: CreateAnnouncementRequest,
): Promise<IctAnnouncement> {
  const db = await getInstitutionDb(institutionId)
  const audienceRoles = encodeAudience(input.audience, input.audienceRoles)
  const [row] = await db
    .insert(announcements)
    .values({
      title: input.title,
      body: input.body,
      audienceRoles,
      isPinned: input.isPinned ?? false,
      publishedAt: input.publish ? new Date().toISOString() : null,
      createdBy: actor.id,
    })
    .returning({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      audienceRoles: announcements.audienceRoles,
      isPinned: announcements.isPinned,
      publishedAt: announcements.publishedAt,
      createdAt: announcements.createdAt,
    })

  if (input.publish) {
    const audience = input.audience ?? decodeAudience(audienceRoles)
    const recipientIds = await resolveAudienceUserIds(institutionId, audience)
    if (recipientIds.length) {
      await notifyUserIds(db, recipientIds, {
        title: input.title,
        body: input.body,
        category: 'Announcement',
        actionUrl: null,
      })
    }
    await writeAudit({
      institutionId,
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'announcement.create',
      targetType: 'announcement',
      targetId: row!.id,
      metadata: { title: input.title, recipientCount: recipientIds.length },
    })
    return {
      ...row!,
      audienceLabel: await audienceLabel(institutionId, row!.audienceRoles),
      recipientCount: recipientIds.length,
    }
  }

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'announcement.create',
    targetType: 'announcement',
    targetId: row!.id,
    metadata: { title: input.title, recipientCount: 0 },
  })

  return {
    ...row!,
    audienceLabel: await audienceLabel(institutionId, row!.audienceRoles),
    recipientCount: 0,
  }
}

export async function listIctNotifications(institutionId: string, userId: string): Promise<IctNotification[]> {
  const db = await getInstitutionDb(institutionId)
  return db
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
}

export async function markIctNotificationRead(institutionId: string, userId: string, id: string) {
  const db = await getInstitutionDb(institutionId)
  const [updated] = await db
    .update(notifications)
    .set({ readAt: new Date().toISOString() })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
    .returning({ id: notifications.id })
  if (!updated) throw notFound('That notification')
  return listIctNotifications(institutionId, userId)
}
