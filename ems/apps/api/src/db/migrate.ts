import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { asc, eq } from 'drizzle-orm'
import postgres from 'postgres'
import { env } from '../config/env'
import type { Logger } from '../lib/logger'
import { getPlatformDb } from './connection'
import { migrationsFolder } from './migration-paths'
import { institutionDatabases, institutions, migrationHistory } from './platform/schema'

export const PLATFORM_MIGRATIONS_FOLDER = migrationsFolder('platform')
export const INSTITUTION_MIGRATIONS_FOLDER = migrationsFolder('institution')

export interface MigrationOutcome {
  target: string
  databaseName: string
  succeeded: boolean
  durationMs: number
  error?: string
}

async function migrateOne(connectionUrl: string, folder: string): Promise<void> {
  // A single, dedicated connection: migrations must not compete with app
  // traffic for a pooled connection, and DDL should run in a predictable order.
  const sql = postgres(connectionUrl, { max: 1, onnotice: () => {} })
  try {
    await migrate(drizzle(sql), { migrationsFolder: folder })
  } finally {
    await sql.end({ timeout: 10 })
  }
}

export async function migratePlatform(logger?: Logger): Promise<MigrationOutcome> {
  const startedAt = Date.now()
  try {
    await migrateOne(env().PLATFORM_DATABASE_URL, PLATFORM_MIGRATIONS_FOLDER)
    const outcome: MigrationOutcome = {
      target: 'platform',
      databaseName: 'platform',
      succeeded: true,
      durationMs: Date.now() - startedAt,
    }
    logger?.info('Platform database migrated', { durationMs: outcome.durationMs })
    return outcome
  } catch (error) {
    logger?.error('Platform migration failed', { error })
    return {
      target: 'platform',
      databaseName: 'platform',
      succeeded: false,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Applies pending migrations to every institution database in turn.
 *
 * Progress is recorded in the platform database as each institution finishes,
 * so an interrupted run can be resumed rather than restarted. The run stops at
 * the first failure: leaving half the platform on a new schema and half on the
 * old one, without anyone being told, is worse than stopping early.
 */
export async function migrateAllInstitutions(options?: {
  logger?: Logger
  /** Continue past a failure. Intended for diagnostics, not routine deploys. */
  continueOnError?: boolean
}): Promise<MigrationOutcome[]> {
  const logger = options?.logger
  const platform = getPlatformDb()

  const targets = await platform
    .select({
      institutionId: institutions.id,
      slug: institutions.slug,
      databaseName: institutionDatabases.databaseName,
      connectionUrl: institutionDatabases.connectionUrl,
    })
    .from(institutionDatabases)
    .innerJoin(institutions, eq(institutions.id, institutionDatabases.institutionId))
    // A fixed order makes a run reproducible: the same institutions are always
    // migrated in the same sequence, so a resumed run picks up predictably and
    // two runs can be compared line by line.
    .orderBy(asc(institutions.slug))

  const outcomes: MigrationOutcome[] = []

  for (const target of targets) {
    const startedAt = Date.now()
    try {
      await migrateOne(target.connectionUrl, INSTITUTION_MIGRATIONS_FOLDER)
      const durationMs = Date.now() - startedAt

      await platform
        .insert(migrationHistory)
        .values({
          institutionId: target.institutionId,
          databaseName: target.databaseName,
          migrationTag: 'latest',
          durationMs,
          succeeded: true,
        })
        .onConflictDoUpdate({
          target: [migrationHistory.databaseName, migrationHistory.migrationTag],
          set: { durationMs, succeeded: true, errorMessage: null },
        })

      outcomes.push({
        target: target.slug,
        databaseName: target.databaseName,
        succeeded: true,
        durationMs,
      })
      logger?.info('Institution migrated', { institution: target.slug, durationMs })
    } catch (error) {
      const durationMs = Date.now() - startedAt
      const message = error instanceof Error ? error.message : String(error)

      await platform
        .insert(migrationHistory)
        .values({
          institutionId: target.institutionId,
          databaseName: target.databaseName,
          migrationTag: 'latest',
          durationMs,
          succeeded: false,
          errorMessage: message,
        })
        .onConflictDoUpdate({
          target: [migrationHistory.databaseName, migrationHistory.migrationTag],
          set: { durationMs, succeeded: false, errorMessage: message },
        })
        .catch(() => {})

      outcomes.push({
        target: target.slug,
        databaseName: target.databaseName,
        succeeded: false,
        durationMs,
        error: message,
      })
      logger?.error('Institution migration failed — stopping', {
        institution: target.slug,
        error,
      })

      if (!options?.continueOnError) break
    }
  }

  return outcomes
}

/** Applies migrations to one freshly created database. */
export async function migrateInstitutionUrl(connectionUrl: string): Promise<void> {
  await migrateOne(connectionUrl, INSTITUTION_MIGRATIONS_FOLDER)
}
