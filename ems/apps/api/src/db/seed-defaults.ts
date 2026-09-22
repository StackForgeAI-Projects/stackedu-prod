import { userRoleSchema } from '@stackedu/shared/enums'
import {
  ATTENDANCE_POLICY_SETTING_KEY,
  DEFAULT_ATTENDANCE_POLICY,
  DEFAULT_RECORDING_RETENTION,
  RECORDING_RETENTION_SETTING_KEY,
} from '@stackedu/shared'
import type { UserRole } from '@stackedu/shared'
import type { InstitutionDb } from './connection'
import { permissions, rolePermissions, roles } from './institution/schema/people'
import { upsertInstitutionSetting } from '../lib/institution-settings'
import { eq } from 'drizzle-orm'

/**
 * The roles and permissions every institution starts with.
 *
 * Seeded rather than hard-coded in the API so an ICT manager can adjust who may
 * do what without a code change, which is exactly what the access levels screen
 * in the ICT portal is for.
 */

const ROLE_LABELS: Record<UserRole, string> = {
  Applicant: 'Applicant',
  Student: 'Student',
  Lecturer: 'Lecturer',
  Bursar: 'Bursar',
  AcademicAdmin: 'Academic Administrator',
  Librarian: 'Librarian',
  ICTManager: 'ICT Manager',
}

interface PermissionDefinition {
  key: string
  module: string
  description: string
  roles: UserRole[]
}

export const DEFAULT_PERMISSIONS: PermissionDefinition[] = [
  // Students
  { key: 'students.read', module: 'Students', description: 'View student records', roles: ['AcademicAdmin', 'Lecturer', 'Bursar', 'ICTManager'] },
  { key: 'students.write', module: 'Students', description: 'Create and edit student records', roles: ['AcademicAdmin'] },
  { key: 'students.changeStatus', module: 'Students', description: 'Suspend, transfer or graduate a student', roles: ['AcademicAdmin'] },

  // Admissions
  { key: 'applications.read', module: 'Admissions', description: 'View applications', roles: ['AcademicAdmin'] },
  { key: 'applications.review', module: 'Admissions', description: 'Accept or reject applications', roles: ['AcademicAdmin'] },

  // Academic structure
  { key: 'courses.read', module: 'Academic', description: 'View the course catalogue', roles: ['AcademicAdmin', 'Lecturer', 'Student', 'Librarian'] },
  { key: 'courses.write', module: 'Academic', description: 'Create and edit courses and programmes', roles: ['AcademicAdmin'] },
  { key: 'timetable.write', module: 'Academic', description: 'Lecturers set class times and rooms. A room or lecturer cannot be booked twice at the same time. Academic Admin reviews the live week.', roles: ['AcademicAdmin', 'Lecturer'] },
  { key: 'calendar.write', module: 'Academic', description: 'Edit the academic calendar', roles: ['AcademicAdmin'] },

  // Teaching
  { key: 'attendance.record', module: 'Teaching', description: 'Take attendance', roles: ['Lecturer'] },
  { key: 'materials.write', module: 'Teaching', description: 'Upload course materials', roles: ['Lecturer', 'AcademicAdmin'] },
  { key: 'classroom.host', module: 'Teaching', description: 'Start and run a live class', roles: ['Lecturer'] },
  { key: 'registrations.approve', module: 'Teaching', description: 'Approve course registrations', roles: ['AcademicAdmin'] },

  // Assessment
  { key: 'grades.write', module: 'Assessment', description: 'Enter and edit marks', roles: ['Lecturer'] },
  { key: 'results.submit', module: 'Assessment', description: 'Submit results for review', roles: ['Lecturer'] },
  { key: 'results.publish', module: 'Assessment', description: 'Publish results to students', roles: ['AcademicAdmin'] },
  { key: 'transcripts.generate', module: 'Assessment', description: 'Generate official transcripts', roles: ['AcademicAdmin'] },

  // Finance
  { key: 'fees.read', module: 'Finance', description: 'View fee accounts and the ledger', roles: ['Bursar', 'AcademicAdmin'] },
  { key: 'fees.write', module: 'Finance', description: 'Edit fee structures', roles: ['Bursar'] },
  { key: 'payments.record', module: 'Finance', description: 'Record and reconcile payments', roles: ['Bursar'] },
  { key: 'payments.void', module: 'Finance', description: 'Void a payment', roles: ['Bursar'] },
  { key: 'refunds.approve', module: 'Finance', description: 'Approve a refund', roles: ['Bursar'] },
  { key: 'feeHolds.manage', module: 'Finance', description: 'Place or release a fee hold', roles: ['Bursar'] },

  // Library
  { key: 'library.read', module: 'Library', description: 'Browse and download resources', roles: ['Student', 'Lecturer', 'Librarian', 'AcademicAdmin'] },
  { key: 'library.write', module: 'Library', description: 'Add and edit library resources', roles: ['Librarian'] },
  { key: 'library.manageAccess', module: 'Library', description: 'Set who may open a resource', roles: ['Librarian'] },

  // Administration
  { key: 'users.read', module: 'Administration', description: 'View platform users', roles: ['ICTManager'] },
  { key: 'users.write', module: 'Administration', description: 'Create and edit users', roles: ['ICTManager'] },
  { key: 'users.revokeAccess', module: 'Administration', description: 'Revoke a user\u2019s access', roles: ['ICTManager'] },
  { key: 'roles.manage', module: 'Administration', description: 'Change what each role may do', roles: ['ICTManager'] },
  { key: 'audit.read', module: 'Administration', description: 'Read the audit log', roles: ['ICTManager'] },
  { key: 'integrations.manage', module: 'Administration', description: 'Configure integrations', roles: ['ICTManager'] },
  { key: 'settings.manage', module: 'Administration', description: 'Change institution settings', roles: ['ICTManager'] },
  { key: 'announcements.write', module: 'Administration', description: 'Publish announcements', roles: ['ICTManager', 'AcademicAdmin'] },

  // Reporting
  { key: 'reports.academic', module: 'Reporting', description: 'Run academic reports', roles: ['AcademicAdmin'] },
  { key: 'reports.financial', module: 'Reporting', description: 'Run financial reports', roles: ['Bursar'] },
  { key: 'reports.platform', module: 'Reporting', description: 'Run platform-wide analytics', roles: ['ICTManager'] },
]

/**
 * Idempotent: safe to run against an existing database when new permissions are
 * added in a later release.
 */
export async function seedInstitutionDefaults(db: InstitutionDb): Promise<void> {
  const roleRows = await db
    .insert(roles)
    .values(
      userRoleSchema.options.map((key) => ({
        key,
        name: ROLE_LABELS[key],
        isSystem: true,
      })),
    )
    .onConflictDoNothing({ target: roles.key })
    .returning({ id: roles.id, key: roles.key })

  const roleIdByKey = new Map(roleRows.map((row) => [row.key, row.id]))

  // On a re-run the insert returns nothing, so read back what is already there.
  if (roleIdByKey.size < userRoleSchema.options.length) {
    const existing = await db.select({ id: roles.id, key: roles.key }).from(roles)
    for (const row of existing) roleIdByKey.set(row.key, row.id)
  }

  const permissionRows = await db
    .insert(permissions)
    .values(
      DEFAULT_PERMISSIONS.map((permission) => ({
        key: permission.key,
        module: permission.module,
        description: permission.description,
      })),
    )
    .onConflictDoNothing({ target: permissions.key })
    .returning({ id: permissions.id, key: permissions.key })

  const permissionIdByKey = new Map(permissionRows.map((row) => [row.key, row.id]))

  if (permissionIdByKey.size < DEFAULT_PERMISSIONS.length) {
    const existing = await db.select({ id: permissions.id, key: permissions.key }).from(permissions)
    for (const row of existing) permissionIdByKey.set(row.key, row.id)
  }

  for (const permission of DEFAULT_PERMISSIONS) {
    await db
      .update(permissions)
      .set({ description: permission.description, module: permission.module })
      .where(eq(permissions.key, permission.key))
  }

  const links = DEFAULT_PERMISSIONS.flatMap((permission) => {
    const permissionId = permissionIdByKey.get(permission.key)
    if (!permissionId) return []

    return permission.roles.flatMap((roleKey) => {
      const roleId = roleIdByKey.get(roleKey)
      return roleId ? [{ roleId, permissionId }] : []
    })
  })

  if (links.length > 0) {
    await db.insert(rolePermissions).values(links).onConflictDoNothing()
  }

  await upsertInstitutionSetting(db, ATTENDANCE_POLICY_SETTING_KEY, DEFAULT_ATTENDANCE_POLICY, {
    category: 'Teaching',
    description: 'Whether lecturers may edit submitted attendance and for how long.',
  })
  await upsertInstitutionSetting(db, RECORDING_RETENTION_SETTING_KEY, DEFAULT_RECORDING_RETENTION, {
    category: 'Teaching',
    description: 'How long a ready classroom recording is kept before it is deleted.',
  })
}

/** Reads back the permission keys granted to a role. Used by tests and the ICT portal. */
export async function permissionsForRole(db: InstitutionDb, role: UserRole): Promise<string[]> {
  const rows = await db
    .select({ key: permissions.key })
    .from(rolePermissions)
    .innerJoin(roles, eq(roles.id, rolePermissions.roleId))
    .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .where(eq(roles.key, role))

  return rows.map((row) => row.key).sort()
}
