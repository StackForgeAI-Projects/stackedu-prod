import { drizzle } from 'drizzle-orm/postgres-js'
import { eq } from 'drizzle-orm'
import postgres from 'postgres'
import { env } from '../config/env'
import { notFound, serviceUnavailable } from '../lib/errors'
import * as institutionSchema from './institution/schema/index'
import * as platformSchema from './platform/schema'

export type PlatformDb = ReturnType<typeof createPlatformDb>
export type InstitutionDb = ReturnType<typeof createInstitutionDb>

function createPlatformDb(sql: postgres.Sql) {
  return drizzle(sql, { schema: platformSchema })
}

function createInstitutionDb(sql: postgres.Sql) {
  return drizzle(sql, { schema: institutionSchema })
}

function poolOptions(max: number): postgres.Options<Record<string, never>> {
  return {
    // Hard cap. A larger pool fills Neon session mode, queues work in this
    // process, and Render then kills the API at 512 MB.
    max: Math.min(max, 2),
    // Closes individual connections that sit unused. Neon bills for compute
    // time, so idle connections are a cost as well as a resource.
    idle_timeout: 30,
    connect_timeout: 10,
    // Prepared statements are disabled because connection poolers in
    // transaction mode cannot guarantee the same backend across statements.
    prepare: false,
    onnotice: () => {},
  }
}

interface InstitutionPool {
  sql: postgres.Sql
  db: InstitutionDb
  databaseName: string
  lastUsedAt: number
}

let platformSql: postgres.Sql | undefined
let platformDb: PlatformDb | undefined
const institutionPools = new Map<string, InstitutionPool>()
const connectionUrlCache = new Map<string, { url: string; databaseName: string }>()
let sweeper: NodeJS.Timeout | undefined

export function getPlatformDb(): PlatformDb {
  if (!platformDb) {
    platformSql = postgres(env().PLATFORM_DATABASE_URL, poolOptions(env().DB_POOL_MAX_CONNECTIONS))
    platformDb = createPlatformDb(platformSql)
  }
  return platformDb
}

/**
 * Finds where an institution's data lives.
 *
 * Cached in memory because it is needed on every single request and almost
 * never changes. Provisioning clears the cache for the affected institution.
 */
async function resolveConnection(institutionId: string) {
  const cached = connectionUrlCache.get(institutionId)
  if (cached) return cached

  const [row] = await getPlatformDb()
    .select({
      url: platformSchema.institutionDatabases.connectionUrl,
      databaseName: platformSchema.institutionDatabases.databaseName,
      status: platformSchema.institutions.status,
    })
    .from(platformSchema.institutionDatabases)
    .innerJoin(
      platformSchema.institutions,
      eq(platformSchema.institutions.id, platformSchema.institutionDatabases.institutionId),
    )
    .where(eq(platformSchema.institutionDatabases.institutionId, institutionId))
    .limit(1)

  if (!row) throw notFound('That institution')
  if (row.status === 'Archived' || row.status === 'Suspended') {
    throw serviceUnavailable('This institution is not currently active.')
  }

  const entry = { url: row.url, databaseName: row.databaseName }
  connectionUrlCache.set(institutionId, entry)
  return entry
}

function startSweeper() {
  if (sweeper) return

  const idleMs = env().DB_POOL_IDLE_TIMEOUT_SECONDS * 1000
  sweeper = setInterval(() => {
    const cutoff = Date.now() - idleMs
    for (const [institutionId, pool] of institutionPools) {
      if (pool.lastUsedAt < cutoff) {
        institutionPools.delete(institutionId)
        void pool.sql.end({ timeout: 5 }).catch(() => {})
      }
    }
  }, Math.min(idleMs, 60_000))

  // Without unref an idle timer would keep the process alive after shutdown.
  sweeper.unref()
}

/**
 * Returns a database handle scoped to one institution.
 *
 * The pool is created the first time an institution is used and closed again
 * after a period of inactivity, so a platform with ten institutions does not
 * hold ten pools open overnight for the sake of one early-morning request.
 */
export async function getInstitutionDb(institutionId: string): Promise<InstitutionDb> {
  const existing = institutionPools.get(institutionId)
  if (existing) {
    existing.lastUsedAt = Date.now()
    return existing.db
  }

  const { url, databaseName } = await resolveConnection(institutionId)
  const sql = postgres(url, poolOptions(env().DB_POOL_MAX_CONNECTIONS))
  const db = createInstitutionDb(sql)

  institutionPools.set(institutionId, { sql, db, databaseName, lastUsedAt: Date.now() })
  startSweeper()

  return db
}

/** Opens a handle to a database by URL, bypassing the registry. Used by tooling. */
export function connectToInstitutionUrl(url: string): {
  db: InstitutionDb
  sql: postgres.Sql
} {
  const sql = postgres(url, poolOptions(2))
  return { db: createInstitutionDb(sql), sql }
}

/** Called after provisioning or a connection change so the next read is fresh. */
export function invalidateInstitutionConnection(institutionId: string): void {
  connectionUrlCache.delete(institutionId)
  const pool = institutionPools.get(institutionId)
  if (pool) {
    institutionPools.delete(institutionId)
    void pool.sql.end({ timeout: 5 }).catch(() => {})
  }
}

export function openInstitutionPoolCount(): number {
  return institutionPools.size
}

/** Closes every pool. Called on shutdown and between test files. */
export async function closeAllConnections(): Promise<void> {
  if (sweeper) {
    clearInterval(sweeper)
    sweeper = undefined
  }

  const closing = [...institutionPools.values()].map((pool) =>
    pool.sql.end({ timeout: 5 }).catch(() => {}),
  )
  institutionPools.clear()
  connectionUrlCache.clear()

  if (platformSql) {
    closing.push(platformSql.end({ timeout: 5 }).catch(() => {}))
    platformSql = undefined
    platformDb = undefined
  }

  await Promise.all(closing)
}
