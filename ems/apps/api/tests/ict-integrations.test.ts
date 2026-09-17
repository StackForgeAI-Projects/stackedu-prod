import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Hono } from 'hono'
import { createApp } from '../src/app'
import { resetEnvCache } from '../src/config/env'
import { closeAllConnections } from '../src/db/connection'
import { provisionInstitution } from '../src/db/provision'
import { buildBrandedEmail } from '../src/lib/email-layout'
import { setIntegrationVendorProbe } from '../src/lib/integration-probe'
import { login } from '../src/services/auth'
import { checkIctIntegration, listIctIntegrations, updateIctIntegration } from '../src/services/ict'
import { createUser } from '../src/services/users'
import { createTestPlatform, uniqueSlug, type TestPlatform } from './helpers/test-database'

const DUMMY_LIVEKIT_URL = 'wss://dummy-stackedu.livekit.cloud'
const DUMMY_LIVEKIT_KEY = 'devkey_livekit_abc123'
const DUMMY_LIVEKIT_SECRET = 'devsecret_livekit_xyz789'
const DUMMY_SAVED_SECRET = 'ict_saved_livekit_secret_001'
const DUMMY_AI_KEY = 'sk-test-openai-dummy-9999'
const DUMMY_RESEND_KEY = 're_dummy_env_key_12345'

describe('ICT integrations credentials', () => {
  let platform: TestPlatform
  let app: Hono<never>
  let institutionId: string
  let actor: { id: string; email: string; role: 'ICTManager' }
  let sessionCookie: string

  const password = 'Correct#Horse2026'

  beforeAll(async () => {
    platform = await createTestPlatform()
    process.env.LIVEKIT_URL = DUMMY_LIVEKIT_URL
    process.env.LIVEKIT_API_KEY = DUMMY_LIVEKIT_KEY
    process.env.LIVEKIT_API_SECRET = DUMMY_LIVEKIT_SECRET
    process.env.RESEND_API_KEY = DUMMY_RESEND_KEY
    process.env.EMAIL_FROM = 'StackEDU Tests <tests@stackedu.test>'
    resetEnvCache()

    const institution = await provisionInstitution({
      name: 'Integrations University',
      slug: uniqueSlug('integ'),
      shortName: 'INTG',
      contactEmail: 'ict@integ.test',
    })
    institutionId = institution.institutionId

    const user = await createUser({
      institutionId,
      email: 'ict@integ.test',
      fullName: 'Ivy Ict',
      role: 'ICTManager',
      password,
    })
    actor = { id: user.id, email: 'ict@integ.test', role: 'ICTManager' }

    const signedIn = await login({ identifier: 'ict@integ.test', password })
    if (signedIn.status !== 'session') throw new Error('The ICT manager could not sign in.')
    sessionCookie = `stackedu_session=${signedIn.cookieValue}`

    app = createApp().app as unknown as Hono<never>
    setIntegrationVendorProbe(async () => ({ ok: false, message: 'The API rejected this key' }))
  })

  afterAll(async () => {
    await closeAllConnections()
    await platform.cleanup()
    delete process.env.LIVEKIT_URL
    delete process.env.LIVEKIT_API_KEY
    delete process.env.LIVEKIT_API_SECRET
    delete process.env.RESEND_API_KEY
    delete process.env.EMAIL_FROM
    setIntegrationVendorProbe(null)
    resetEnvCache()
  })

  it('lists LiveKit and AI with env keys marked configured and never returned', async () => {
    const listed = await listIctIntegrations(institutionId)
    const providers = listed.map((row) => row.provider)
    expect(providers).toContain('LiveKit')
    expect(providers).toContain('AI')
    expect(providers).toContain('Resend')

    const livekit = listed.find((row) => row.provider === 'LiveKit')
    expect(livekit?.category).toBe('classroom')
    expect(livekit?.docsUrl).toContain('docs.livekit.io')
    expect(livekit?.setupSteps.length).toBeGreaterThan(0)

    const urlField = livekit?.fields.find((field) => field.key === 'url')
    expect(urlField?.secret).toBe(false)
    expect(urlField?.value).toBe(DUMMY_LIVEKIT_URL)
    expect(urlField?.source).toBe('env')

    const keyField = livekit?.fields.find((field) => field.key === 'apiKey')
    expect(keyField?.secret).toBe(true)
    expect(keyField?.configured).toBe(true)
    expect(keyField?.value).toBeNull()
    expect(keyField?.source).toBe('env')

    const secretField = livekit?.fields.find((field) => field.key === 'apiSecret')
    expect(secretField?.configured).toBe(true)
    expect(secretField?.value).toBeNull()

    const payload = JSON.stringify(listed)
    expect(payload).not.toContain(DUMMY_LIVEKIT_KEY)
    expect(payload).not.toContain(DUMMY_LIVEKIT_SECRET)
    expect(payload).not.toContain(DUMMY_RESEND_KEY)
  })

  it('lets ICT save a LiveKit secret that is then hidden', async () => {
    const listed = await listIctIntegrations(institutionId)
    const livekit = listed.find((row) => row.provider === 'LiveKit')
    if (!livekit) throw new Error('LiveKit was not listed.')

    const saved = await updateIctIntegration(institutionId, actor, livekit.id, {
      isEnabled: true,
      credentials: { apiSecret: DUMMY_SAVED_SECRET },
    })
    const secretField = saved.fields.find((field) => field.key === 'apiSecret')
    expect(secretField?.configured).toBe(true)
    expect(secretField?.source).toBe('saved')
    expect(secretField?.value).toBeNull()
    expect(JSON.stringify(saved)).not.toContain(DUMMY_SAVED_SECRET)

    const response = await app.request(`/ict/integrations/${livekit.id}/check`, {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    })
    expect(response.status).toBe(200)
    const body = await response.text()
    expect(body).not.toContain(DUMMY_SAVED_SECRET)
    expect(body).not.toContain(DUMMY_LIVEKIT_SECRET)
  })

  it('lets ICT add an AI key on the integration, never returning it', async () => {
    const listed = await listIctIntegrations(institutionId)
    const ai = listed.find((row) => row.provider === 'AI')
    if (!ai) throw new Error('AI was not listed.')

    const saved = await updateIctIntegration(institutionId, actor, ai.id, {
      credentials: { provider: 'openai', apiKey: DUMMY_AI_KEY },
    })
    expect(saved.fields.find((field) => field.key === 'provider')?.value).toBe('openai')
    expect(saved.fields.find((field) => field.key === 'apiKey')?.configured).toBe(true)
    expect(saved.fields.find((field) => field.key === 'apiKey')?.value).toBeNull()
    expect(JSON.stringify(saved)).not.toContain(DUMMY_AI_KEY)
  })

  it('serves the same public shape over HTTP', async () => {
    const response = await app.request('/ict/integrations', { headers: { Cookie: sessionCookie } })
    expect(response.status).toBe(200)
    const body = (await response.json()) as { integrations: Array<{ provider: string; fields: Array<{ secret: boolean; value: string | null }> }> }
    expect(body.integrations.some((row) => row.provider === 'LiveKit')).toBe(true)
    expect(body.integrations.some((row) => row.provider === 'AI')).toBe(true)
    const text = JSON.stringify(body)
    expect(text).not.toContain(DUMMY_LIVEKIT_SECRET)
    expect(text).not.toContain(DUMMY_SAVED_SECRET)
    expect(text).not.toContain(DUMMY_AI_KEY)
  })

  it('fails a connection check when the service is off or the key is missing', async () => {
    const listed = await listIctIntegrations(institutionId)
    const flutterwave = listed.find((row) => row.provider === 'Flutterwave')
    if (!flutterwave) throw new Error('Flutterwave was not listed.')

    const off = await checkIctIntegration(institutionId, actor, flutterwave.id)
    expect(off.checkOk).toBe(false)
    expect(off.lastStatus).toMatch(/turned off/i)

    await updateIctIntegration(institutionId, actor, flutterwave.id, { isEnabled: true })
    const missing = await checkIctIntegration(institutionId, actor, flutterwave.id)
    expect(missing.checkOk).toBe(false)
    expect(missing.lastStatus).toMatch(/Add the Flutterwave/i)
    expect(JSON.stringify(missing)).not.toContain(DUMMY_LIVEKIT_SECRET)
  })

  it('returns a failed LiveKit check instead of 500 when the vendor SDK throws', async () => {
    const listed = await listIctIntegrations(institutionId)
    const livekit = listed.find((row) => row.provider === 'LiveKit')
    if (!livekit) throw new Error('LiveKit was not listed.')

    await updateIctIntegration(institutionId, actor, livekit.id, { isEnabled: true })
    setIntegrationVendorProbe(async () => {
      const error = new Error('unauthorized') as Error & { status: number }
      error.status = 401
      throw error
    })

    const response = await app.request(`/ict/integrations/${livekit.id}/check`, {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    })
    expect(response.status).toBe(200)
    const body = (await response.json()) as {
      integration: { checkOk?: boolean; lastStatus: string | null }
    }
    expect(body.integration.checkOk).toBe(false)
    expect(body.integration.lastStatus).toMatch(/rejected/i)
    expect(JSON.stringify(body)).not.toContain(DUMMY_LIVEKIT_SECRET)
    expect(JSON.stringify(body)).not.toContain(DUMMY_SAVED_SECRET)

    setIntegrationVendorProbe(async () => ({ ok: false, message: 'The API rejected this key' }))
  })

  it('calls the vendor check and does not treat a dummy key as connected', async () => {
    const listed = await listIctIntegrations(institutionId)
    const livekit = listed.find((row) => row.provider === 'LiveKit')
    if (!livekit) throw new Error('LiveKit was not listed.')

    const rejected = await checkIctIntegration(institutionId, actor, livekit.id)
    expect(rejected.checkOk).toBe(false)
    expect(rejected.lastStatus).toMatch(/rejected/i)

    setIntegrationVendorProbe(async () => ({ ok: true, message: 'LiveKit accepted this URL and API key pair.' }))
    const accepted = await checkIctIntegration(institutionId, actor, livekit.id)
    expect(accepted.checkOk).toBe(true)
    expect(accepted.lastStatus).toMatch(/accepted/i)
    expect(JSON.stringify(accepted)).not.toContain(DUMMY_LIVEKIT_SECRET)
    setIntegrationVendorProbe(async () => ({ ok: false, message: 'The API rejected this key' }))
  })

  it('records a connection check without exposing secrets', async () => {
    const listed = await listIctIntegrations(institutionId)
    const resend = listed.find((row) => row.provider === 'Resend')
    if (!resend) throw new Error('Resend was not listed.')
    const enabled = await updateIctIntegration(institutionId, actor, resend.id, { isEnabled: true })
    expect(enabled.isEnabled).toBe(true)
    const checked = await checkIctIntegration(institutionId, actor, resend.id)
    expect(checked.checkOk).toBe(false)
    expect(checked.lastStatus).toMatch(/rejected|Add the Resend/i)
    expect(JSON.stringify(checked)).not.toContain(DUMMY_RESEND_KEY)
  })
})

describe('branded email uses the institution logo and colour', () => {
  it('paints the header and button with the system colour and shows the logo', () => {
    const { html } = buildBrandedEmail({
      branding: {
        name: 'Colour College',
        slug: 'colour',
        contactEmail: 'hello@colour.test',
        location: 'Kigali',
        website: 'https://colour.test',
        logoUrl: 'https://api.test/logo.png',
        brandColor: '#1D4ED8',
      },
      title: 'Your application',
      greeting: 'Hello Ada.',
      paragraphs: ['We received your application.'],
    })
    expect(html).toContain('#1D4ED8')
    expect(html).toContain('https://api.test/logo.png')
    expect(html).toContain('Colour College')
    expect(html).not.toContain('#16a34a')
  })
})
