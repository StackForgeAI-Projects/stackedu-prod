import {
  boolean,
  index,
  inet,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { institutionStatusSchema, userRoleSchema } from '@stackedu/shared/enums'
import { money, primaryKeyColumn, timestamps } from '../columns'

/**
 * The platform database.
 *
 * Kept deliberately small. It holds the list of institutions and the directory
 * that routes a login to the right institution database, plus our own billing
 * and audit records. It contains no academic or financial data belonging to an
 * institution, so a problem here cannot expose a student record.
 */

export const institutionStatusEnum = pgEnum(
  'institution_status',
  institutionStatusSchema.options,
)

export const platformUserRoleEnum = pgEnum('platform_user_role', userRoleSchema.options)

export const institutions = pgTable(
  'institutions',
  {
    id: primaryKeyColumn(),
    name: text('name').notNull(),
    /** Also used to derive the database name, so it must stay SQL safe. */
    slug: text('slug').notNull(),
    shortName: text('short_name').notNull(),
    status: institutionStatusEnum('status').notNull().default('Provisioning'),
    contactEmail: text('contact_email').notNull(),
    timezone: text('timezone').notNull().default('Africa/Kigali'),
    locale: text('locale').notNull().default('en'),
    website: text('website'),
    location: text('location'),
    logoFileKey: text('logo_file_key'),
    /** `#RRGGBB` the whole system is themed from. Null means StackEDU default. */
    brandColor: text('brand_color'),
    ...timestamps(),
  },
  (t) => [uniqueIndex('institutions_slug_key').on(t.slug)],
)

/**
 * Where each institution's data actually lives.
 *
 * The connection string is stored encrypted at rest by the hosting provider and
 * is never returned over the API. Splitting it from `institutions` means a
 * query that lists institutions for display cannot accidentally leak it.
 */
export const institutionDatabases = pgTable(
  'institution_databases',
  {
    id: primaryKeyColumn(),
    institutionId: uuid('institution_id')
      .notNull()
      .references(() => institutions.id, { onDelete: 'restrict' }),
    databaseName: text('database_name').notNull(),
    connectionUrl: text('connection_url').notNull(),
    /** Region the data physically sits in, recorded for compliance reporting. */
    region: text('region').notNull().default('eu-central-1'),
    /** Schema version this database was last migrated to. */
    schemaVersion: text('schema_version'),
    isPrimary: boolean('is_primary').notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('institution_databases_name_key').on(t.databaseName),
    index('institution_databases_institution_idx').on(t.institutionId),
  ],
)

/**
 * Maps an email address to the institution that owns it.
 *
 * This is the only place a login is resolved. Once we know the institution we
 * connect to its database and never consult this table again for that request.
 */
export const userDirectory = pgTable(
  'user_directory',
  {
    id: primaryKeyColumn(),
    email: text('email').notNull(),
    institutionId: uuid('institution_id')
      .notNull()
      .references(() => institutions.id, { onDelete: 'cascade' }),
    /** Primary key of the matching row in that institution's users table. */
    institutionUserId: uuid('institution_user_id').notNull(),
    /**
     * The other thing a person may type instead of their email: an application
     * reference while they are applying, and their registration number once
     * they are a student. Held here for the same reason as the email — it is
     * how a login finds the right database before anyone is authenticated.
     */
    alternateIdentifier: text('alternate_identifier'),
    role: platformUserRoleEnum('role').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('user_directory_email_key').on(t.email),
    uniqueIndex('user_directory_alternate_key').on(t.alternateIdentifier),
    index('user_directory_institution_idx').on(t.institutionId),
  ],
)

/**
 * Login attempts are recorded at platform level because a credential-stuffing
 * attack spans institutions and would be invisible from inside any single one.
 */
export const loginAttempts = pgTable(
  'login_attempts',
  {
    id: primaryKeyColumn(),
    email: text('email').notNull(),
    institutionId: uuid('institution_id').references(() => institutions.id, {
      onDelete: 'set null',
    }),
    succeeded: boolean('succeeded').notNull(),
    ipAddress: inet('ip_address'),
    userAgent: text('user_agent'),
    failureReason: text('failure_reason'),
    createdAt: timestamps().createdAt,
  },
  (t) => [
    index('login_attempts_email_idx').on(t.email, t.createdAt),
    index('login_attempts_ip_idx').on(t.ipAddress, t.createdAt),
  ],
)

/** StackForgeAI staff who can administer the platform itself. */
export const platformAdmins = pgTable(
  'platform_admins',
  {
    id: primaryKeyColumn(),
    email: text('email').notNull(),
    fullName: text('full_name').notNull(),
    passwordHash: text('password_hash'),
    isActive: boolean('is_active').notNull().default(true),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true, mode: 'string' }),
    ...timestamps(),
  },
  (t) => [uniqueIndex('platform_admins_email_key').on(t.email)],
)

export const platformAuditLogs = pgTable(
  'platform_audit_logs',
  {
    id: primaryKeyColumn(),
    actorId: uuid('actor_id').references(() => platformAdmins.id, { onDelete: 'set null' }),
    actorEmail: text('actor_email'),
    action: text('action').notNull(),
    targetType: text('target_type'),
    targetId: text('target_id'),
    institutionId: uuid('institution_id').references(() => institutions.id, {
      onDelete: 'set null',
    }),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    ipAddress: inet('ip_address'),
    createdAt: timestamps().createdAt,
  },
  (t) => [
    index('platform_audit_logs_institution_idx').on(t.institutionId, t.createdAt),
    index('platform_audit_logs_action_idx').on(t.action, t.createdAt),
  ],
)

export const billingRecords = pgTable(
  'billing_records',
  {
    id: primaryKeyColumn(),
    institutionId: uuid('institution_id')
      .notNull()
      .references(() => institutions.id, { onDelete: 'restrict' }),
    periodStart: timestamp('period_start', { withTimezone: true, mode: 'string' }).notNull(),
    periodEnd: timestamp('period_end', { withTimezone: true, mode: 'string' }).notNull(),
    activeStudentCount: integer('active_student_count').notNull().default(0),
    amount: money('amount').notNull().default(0),
    currency: text('currency').notNull().default('RWF'),
    invoiceReference: text('invoice_reference'),
    paidAt: timestamp('paid_at', { withTimezone: true, mode: 'string' }),
    ...timestamps(),
  },
  (t) => [index('billing_records_institution_idx').on(t.institutionId, t.periodStart)],
)

/**
 * Which migrations have been applied to which institution database.
 *
 * The migration runner writes here as it goes, so an interrupted run can be
 * resumed rather than restarted, and so we can always answer "is every
 * institution on the same schema version?".
 */
export const migrationHistory = pgTable(
  'migration_history',
  {
    id: primaryKeyColumn(),
    /** Null for the platform database itself. */
    institutionId: uuid('institution_id').references(() => institutions.id, {
      onDelete: 'cascade',
    }),
    databaseName: text('database_name').notNull(),
    migrationTag: text('migration_tag').notNull(),
    appliedAt: timestamps().createdAt,
    durationMs: integer('duration_ms'),
    succeeded: boolean('succeeded').notNull().default(true),
    errorMessage: text('error_message'),
  },
  (t) => [
    uniqueIndex('migration_history_db_tag_key').on(t.databaseName, t.migrationTag),
    index('migration_history_institution_idx').on(t.institutionId),
  ],
)

export type Institution = typeof institutions.$inferSelect
export type InstitutionDatabase = typeof institutionDatabases.$inferSelect
export type UserDirectoryEntry = typeof userDirectory.$inferSelect
