import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Hono } from 'hono'
import { desc } from 'drizzle-orm'
import { updateIctSettingsRequestSchema } from '@stackedu/shared'
import { createApp } from '../src/app'
import { resetEnvCache } from '../src/config/env'
import { closeAllConnections, getInstitutionDb } from '../src/db/connection'
import { auditLogs } from '../src/db/institution/schema/settings'
import { provisionInstitution } from '../src/db/provision'
import { openInstitutionLogo, writeInstitutionLogo } from '../src/lib/storage'
import { login } from '../src/services/auth'
import { getIctSettings, updateIctSettings, uploadInstitutionLogo } from '../src/services/ict'
import { createUser } from '../src/services/users'
import { createTestPlatform, uniqueSlug, type TestPlatform } from './helpers/test-database'

/**
 * Institution branding: the logo and the colour the whole system is themed
 * from. The logo used to upload successfully and then never appear, so these
 * tests follow it all the way to the bytes a browser would receive.
 */
describe('institution branding', () => {
  let platform: TestPlatform
  let app: Hono<never>
  let storageRoot: string
  let institutionId: string
  let slug: string
  let actor: { id: string; email: string; role: 'ICTManager' }
  let sessionCookie: string

  const password = 'Correct#Horse2026'
  const PNG_BYTES = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  )
  const JPEG_BYTES = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xdb]), Buffer.alloc(64, 0x20)])

  beforeAll(async () => {
    platform = await createTestPlatform()
    storageRoot = mkdtempSync(path.join(tmpdir(), 'stackedu-logo-'))
    process.env.STORAGE_LOCAL_ROOT = storageRoot
    resetEnvCache()

    slug = uniqueSlug('brand')
    const institution = await provisionInstitution({
      name: 'Brand University',
      slug,
      shortName: 'BRAND',
      contactEmail: 'registrar@brand.test',
    })
    institutionId = institution.institutionId

    const user = await createUser({
      institutionId,
      email: 'ict@brand.test',
      fullName: 'Ada Ict',
      role: 'ICTManager',
      password,
    })
    actor = { id: user.id, email: 'ict@brand.test', role: 'ICTManager' }

    const signedIn = await login({ identifier: 'ict@brand.test', password })
    if (signedIn.status !== 'session') throw new Error('The ICT manager could not sign in.')
    sessionCookie = `stackedu_session=${signedIn.cookieValue}`

    app = createApp().app as unknown as Hono<never>
  })

  afterAll(async () => {
    await closeAllConnections()
    await platform.cleanup()
    rmSync(storageRoot, { recursive: true, force: true })
  })

  async function auditActions(): Promise<string[]> {
    const db = await getInstitutionDb(institutionId)
    const rows = await db
      .select({ action: auditLogs.action })
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
    return rows.map((row) => row.action)
  }

  it('serves an uploaded logo as an image a browser is allowed to render', async () => {
    const response = await app.request('/ict/settings/logo', {
      method: 'POST',
      headers: { Cookie: sessionCookie, 'Content-Type': 'image/png' },
      body: PNG_BYTES,
    })
    expect(response.status).toBe(200)

    const { settings } = (await response.json()) as { settings: { logoUrl: string } }
    const logoPath = new URL(settings.logoUrl).pathname + new URL(settings.logoUrl).search
    expect(logoPath).toMatch(new RegExp(`^/public/institution/${slug}/logo\\?v=`))

    const served = await app.request(logoPath)
    expect(served.status).toBe(200)
    expect(served.headers.get('content-type')).toBe('image/png')
    // Without this the browser refuses the image, because the app and the API
    // are on different origins.
    expect(served.headers.get('cross-origin-resource-policy')).toBe('cross-origin')
  })

  it('accepts a logo larger than the general request limit, up to 2 MB', async () => {
    const response = await app.request('/ict/settings/logo', {
      method: 'POST',
      headers: { Cookie: sessionCookie, 'Content-Type': 'image/png' },
      body: Buffer.concat([PNG_BYTES, Buffer.alloc(1_500_000, 0)]),
    })
    expect(response.status).toBe(200)
  })

  it('gives a replaced logo a new address, so the old one cannot be served from cache', async () => {
    const before = await uploadInstitutionLogo(institutionId, actor, {
      body: PNG_BYTES,
      mimeType: 'image/png',
    })
    const after = await uploadInstitutionLogo(institutionId, actor, {
      body: JPEG_BYTES,
      mimeType: 'image/jpeg',
    })

    expect(before.logoUrl).not.toBe(after.logoUrl)
    expect(after.logoUrl).toContain('?v=')
  })

  it('remembers the image format, so the logo is never served as a file download', async () => {
    const pngKey = await writeInstitutionLogo({
      institutionId,
      body: PNG_BYTES,
      mimeType: 'image/png',
    })
    expect(pngKey.endsWith('.png')).toBe(true)
    expect(openInstitutionLogo(pngKey).mimeType).toBe('image/png')

    const svgKey = await writeInstitutionLogo({
      institutionId,
      body: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
      mimeType: 'image/svg+xml',
    })
    expect(openInstitutionLogo(svgKey).mimeType).toBe('image/svg+xml')
  })

  it('refuses a file format it cannot serve as a logo', async () => {
    await expect(
      writeInstitutionLogo({ institutionId, body: PNG_BYTES, mimeType: 'image/gif' }),
    ).rejects.toThrow()
  })

  it('themes the system from the colour ICT chooses, and returns to the default when cleared', async () => {
    const themed = await updateIctSettings(institutionId, actor, { brandColor: '#1d4ed8' })
    expect(themed.brandColor).toBe('#1D4ED8')

    const branding = await app.request(`/public/institution/${slug}`)
    const body = (await branding.json()) as { brandColor: string | null }
    expect(body.brandColor).toBe('#1D4ED8')

    const cleared = await updateIctSettings(institutionId, actor, { brandColor: null })
    expect(cleared.brandColor).toBeNull()
    expect((await getIctSettings(institutionId)).brandColor).toBeNull()
  })

  it('will not accept a colour that is not a hex code', () => {
    expect(updateIctSettingsRequestSchema.safeParse({ brandColor: 'dark blue' }).success).toBe(false)
    expect(updateIctSettingsRequestSchema.safeParse({ brandColor: '#12345' }).success).toBe(false)
    expect(updateIctSettingsRequestSchema.safeParse({ brandColor: '#1D4ED8' }).success).toBe(true)
  })

  it('stores an AI key without returning it, and can switch back to the in-built model', async () => {
    const saved = await updateIctSettings(institutionId, actor, {
      aiProvider: 'openai',
      aiApiKey: 'sk-test-key-123456',
    })
    expect(saved.ai.provider).toBe('openai')
    expect(saved.ai.providers.find((row) => row.id === 'openai')?.hasKey).toBe(true)
    expect(JSON.stringify(saved)).not.toContain('sk-test-key-123456')

    const builtin = await updateIctSettings(institutionId, actor, { aiProvider: 'builtin' })
    expect(builtin.ai.provider).toBe('builtin')
    expect(builtin.ai.providers.find((row) => row.id === 'openai')?.hasKey).toBe(true)
  })

  it('records the logo and colour changes in the audit log', async () => {
    const actions = await auditActions()
    expect(actions).toContain('settings.logo.upload')
    expect(actions).toContain('settings.update')
  })

  it('describes every audit entry in plain English and gives it a stable label', async () => {
    const response = await app.request('/ict/audit', { headers: { Cookie: sessionCookie } })
    expect(response.status).toBe(200)

    const { entries } = (await response.json()) as {
      entries: Array<{ action: string; actionLabel: string; summary: string }>
    }

    const logo = entries.find((entry) => entry.action === 'settings.logo.upload')
    expect(logo?.summary).toBe('Uploaded a new institution logo')
    expect(logo?.actionLabel).toBe('Changed the institution logo')

    const signIn = entries.find((entry) => entry.action === 'session.login')
    expect(signIn?.summary).toBe('Signed in with a password')

    // Nothing may fall back to showing the raw action string to a reader.
    for (const entry of entries) {
      expect(entry.summary).not.toBe(entry.action)
      expect(entry.summary).not.toMatch(/^[a-z_]+(\.[a-z_]+)+$/i)
      expect(entry.actionLabel.length).toBeGreaterThan(0)
    }
  })
})
