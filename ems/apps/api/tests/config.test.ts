import { describe, expect, it } from 'vitest'
import {
  DEFAULT_ATTENDANCE_POLICY,
  isAttendanceSessionEditable,
} from '@stackedu/shared'
import { loadEnv } from '../src/config/env'
import { expandOriginsForEnvironment, isOriginAllowed } from '../src/config/cors'
import {
  adminConnectionUrl,
  assertSafeDatabaseName,
  institutionDatabaseName,
  withDatabaseName,
} from '../src/db/naming'

const BASE = {
  NODE_ENV: 'development',
  PLATFORM_DATABASE_URL: 'postgres://user:pass@localhost:5433/stackedu_platform',
}

describe('environment validation', () => {
  it('applies sensible defaults for local development', () => {
    const env = loadEnv({ ...BASE } as NodeJS.ProcessEnv)
    expect(env.NODE_ENV).toBe('development')
    expect(env.PORT).toBe(8080)
    expect(env.ALLOWED_ORIGINS).toContain('https://app.stackedu.rw')
    expect(env.ALLOWED_ORIGINS).toContain('https://app.stackedu.africa')
  })

  it('fails immediately when the database URL is missing', () => {
    expect(() => loadEnv({ NODE_ENV: 'development' } as NodeJS.ProcessEnv)).toThrow(/PLATFORM_DATABASE_URL/)
  })

  it('fails when NODE_ENV is missing or invalid', () => {
    const { NODE_ENV: _nodeEnv, ...rest } = BASE
    expect(() => loadEnv(rest as NodeJS.ProcessEnv)).toThrow(/NODE_ENV/)
    expect(() => loadEnv({ ...BASE, NODE_ENV: 'staging' } as NodeJS.ProcessEnv)).toThrow(/NODE_ENV/)
  })

  it('parses a comma separated origin list', () => {
    const env = loadEnv({
      ...BASE,
      ALLOWED_ORIGINS: 'https://a.example, https://b.example ,',
    } as NodeJS.ProcessEnv)

    expect(env.ALLOWED_ORIGINS).toEqual(['https://a.example', 'https://b.example'])
  })

  it('requires a cookie domain in production, because login spans two hosts', () => {
    expect(() =>
      loadEnv({
        ...BASE,
        NODE_ENV: 'production',
        ALLOWED_ORIGINS: 'https://app.stackedu.rw',
      } as NodeJS.ProcessEnv),
    ).toThrow(/COOKIE_DOMAIN/)
  })

  it('refuses plain-http origins in production', () => {
    expect(() =>
      loadEnv({
        ...BASE,
        NODE_ENV: 'production',
        COOKIE_DOMAIN: '.stackedu.rw',
        ALLOWED_ORIGINS: 'https://app.stackedu.rw,http://localhost:3000',
      } as NodeJS.ProcessEnv),
    ).toThrow(/plain-http/)
  })

  it('accepts a correct production configuration', () => {
    const env = loadEnv({
      ...BASE,
      NODE_ENV: 'production',
      COOKIE_DOMAIN: '.stackedu.rw',
      ALLOWED_ORIGINS: 'https://app.stackedu.rw,https://app.stackedu.africa',
      STORAGE_SIGNING_SECRET: 'production-local-storage-signing-secret',
    } as NodeJS.ProcessEnv)

    expect(env.ALLOWED_ORIGINS).toHaveLength(2)
  })
})

describe('cross-origin allowlist', () => {
  const env = loadEnv({
    ...BASE,
    ALLOWED_ORIGINS: 'https://app.stackedu.rw,https://app.stackedu.africa',
  } as NodeJS.ProcessEnv)

  it('allows both market domains', () => {
    expect(isOriginAllowed('https://app.stackedu.rw', env)).toBe(true)
    expect(isOriginAllowed('https://app.stackedu.africa', env)).toBe(true)
  })

  it('rejects anything not on the list, including lookalikes', () => {
    expect(isOriginAllowed('https://app.stackedu.rw.attacker.example', env)).toBe(false)
    expect(isOriginAllowed('http://app.stackedu.rw', env)).toBe(false)
    expect(isOriginAllowed('*', env)).toBe(false)
  })

  it('adds localhost only in development', () => {
    const dev = expandOriginsForEnvironment(env)
    expect(dev.ALLOWED_ORIGINS).toContain('http://localhost:3000')

    const prod = expandOriginsForEnvironment({ ...env, NODE_ENV: 'production' })
    expect(prod.ALLOWED_ORIGINS).not.toContain('http://localhost:3000')

    const testEnv = expandOriginsForEnvironment({ ...env, NODE_ENV: 'test' })
    expect(testEnv.ALLOWED_ORIGINS).not.toContain('http://localhost:3001')
  })
})

describe('database naming', () => {
  it('derives a database name from an institution slug', () => {
    expect(institutionDatabaseName('uok')).toBe('stackedu_inst_uok')
    expect(institutionDatabaseName('rwanda-poly')).toBe('stackedu_inst_rwanda_poly')
  })

  it('rejects slugs that could break out of a CREATE DATABASE statement', () => {
    const attacks = [
      'evil"; DROP DATABASE postgres; --',
      'has space',
      'UPPER',
      '1leading-digit',
      'trailing-',
      '',
    ]

    for (const attack of attacks) {
      expect(() => institutionDatabaseName(attack)).toThrow()
    }
  })

  it('checks the final name again before it reaches SQL', () => {
    expect(assertSafeDatabaseName('stackedu_inst_uok')).toBe('stackedu_inst_uok')
    expect(() => assertSafeDatabaseName('bad-name')).toThrow()
    expect(() => assertSafeDatabaseName('drop"; --')).toThrow()
  })

  it('swaps the database while preserving credentials and host', () => {
    const url = withDatabaseName(
      'postgres://user:pass@db.example:5432/platform?sslmode=require',
      'stackedu_inst_uok',
    )
    expect(url).toContain('/stackedu_inst_uok')
    expect(url).toContain('user:pass@db.example:5432')
    expect(url).toContain('sslmode=require')
  })

  it('builds the server-level connection used to create databases', () => {
    expect(adminConnectionUrl('postgres://user:pass@db.example:5432/anything')).toContain(
      '/postgres',
    )
  })
})

describe('attendance edit policy', () => {
  it('treats drafts as always editable', () => {
    expect(isAttendanceSessionEditable(null, DEFAULT_ATTENDANCE_POLICY)).toBe(true)
  })

  it('blocks submitted sessions when editing after submit is disabled', () => {
    const closedAt = '2026-08-31T10:00:00.000Z'
    expect(
      isAttendanceSessionEditable(closedAt, { allowEditAfterSubmit: false, editWindowMinutes: 60 }),
    ).toBe(false)
  })

  it('allows edits within the configured window', () => {
    const closedAt = '2026-08-31T10:00:00.000Z'
    const now = new Date('2026-08-31T10:30:00.000Z').getTime()
    expect(
      isAttendanceSessionEditable(
        closedAt,
        { allowEditAfterSubmit: true, editWindowMinutes: 60 },
        now,
      ),
    ).toBe(true)
  })

  it('locks submitted sessions after the window expires', () => {
    const closedAt = '2026-08-31T10:00:00.000Z'
    const now = new Date('2026-08-31T11:30:00.000Z').getTime()
    expect(
      isAttendanceSessionEditable(
        closedAt,
        { allowEditAfterSubmit: true, editWindowMinutes: 60 },
        now,
      ),
    ).toBe(false)
  })
})
