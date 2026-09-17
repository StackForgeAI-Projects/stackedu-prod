import { RoomServiceClient } from 'livekit-server-sdk'
import { env } from '../config/env'
import { resolveAiRuntime } from './ai-complete'
import { resolveCredential } from './integration-credentials'

export type ProbeResult = { ok: boolean; message: string }

export type IntegrationVendorProbe = (input: {
  provider: string
  institutionId: string
}) => Promise<ProbeResult>

const PROBE_TIMEOUT_MS = 6_000

let vendorProbe: IntegrationVendorProbe | null = null

/** Tests replace the vendor ping so dummy keys never wait on the public internet. */
export function setIntegrationVendorProbe(probe: IntegrationVendorProbe | null): void {
  vendorProbe = probe
}

/**
 * Real connection check: service must be on, keys must be present, then the
 * vendor API is called. Being on localhost does not skip the vendor call.
 */
export async function probeIntegration(
  institutionId: string,
  provider: string,
  isEnabled: boolean,
): Promise<ProbeResult> {
  if (!isEnabled) {
    return { ok: false, message: 'Service is turned off. Turn it on and save, then check again.' }
  }

  if (provider === 'AI') {
    const runtime = await resolveAiRuntime(institutionId)
    if (runtime.provider === 'builtin') {
      return { ok: true, message: 'In-built generator is ready. No vendor API to call.' }
    }
    if (!runtime.apiKey) {
      return { ok: false, message: `Add an API key for ${labelForAi(runtime.provider)}` }
    }
    return pingVendor(institutionId, provider)
  }

  const missing = await missingCredentialMessage(institutionId, provider)
  if (missing) return { ok: false, message: missing }

  return pingVendor(institutionId, provider)
}

async function pingVendor(institutionId: string, provider: string): Promise<ProbeResult> {
  try {
    if (vendorProbe) return await vendorProbe({ provider, institutionId })
    return await defaultVendorPing(institutionId, provider)
  } catch (error) {
    const status = httpStatusFromUnknown(error)
    if (status > 0) {
      return fromHttp(
        status,
        `${provider} accepted these credentials.`,
        `${provider} rejected these credentials.`,
      )
    }
    return { ok: false, message: networkMessage(provider, error) }
  }
}

async function missingCredentialMessage(institutionId: string, provider: string): Promise<string | null> {
  if (provider === 'Resend') {
    const apiKey = await resolveCredential(institutionId, 'Resend', 'apiKey')
    const from = await resolveCredential(institutionId, 'Resend', 'from')
    if (!apiKey || !from) return 'Add the Resend API key and From address, then save.'
    return null
  }
  if (provider === 'PawaPay' || provider === 'MTNMoMo' || provider === 'AirtelMoney') {
    const token = await resolveCredential(institutionId, 'PawaPay', 'apiToken')
    if (!token) return 'Add the PawaPay API token, then save.'
    return null
  }
  if (provider === 'Flutterwave') {
    const secret = await resolveCredential(institutionId, 'Flutterwave', 'secretKey')
    if (!secret) return 'Add the Flutterwave secret key, then save.'
    return null
  }
  if (provider === 'Twilio') {
    const sid = await resolveCredential(institutionId, 'Twilio', 'accountSid')
    const token = await resolveCredential(institutionId, 'Twilio', 'authToken')
    const from = await resolveCredential(institutionId, 'Twilio', 'fromNumber')
    if (!sid || !token || !from) return 'Add the Twilio Account SID, auth token and From number, then save.'
    return null
  }
  if (provider === 'LiveKit') {
    const url = await resolveCredential(institutionId, 'LiveKit', 'url')
    const key = await resolveCredential(institutionId, 'LiveKit', 'apiKey')
    const secret = await resolveCredential(institutionId, 'LiveKit', 'apiSecret')
    if (!url || !key || !secret) return 'Add the LiveKit URL, API key and API secret, then save.'
    return null
  }
  return null
}

async function defaultVendorPing(institutionId: string, provider: string): Promise<ProbeResult> {
  if (provider === 'Resend') return pingResend(institutionId)
  if (provider === 'Twilio') return pingTwilio(institutionId)
  if (provider === 'PawaPay' || provider === 'MTNMoMo' || provider === 'AirtelMoney') {
    return pingPawaPay(institutionId, provider)
  }
  if (provider === 'Flutterwave') return pingFlutterwave(institutionId)
  if (provider === 'LiveKit') return pingLiveKit(institutionId)
  if (provider === 'AI') return pingAi(institutionId)
  return { ok: false, message: 'That service has no connection check yet.' }
}

async function pingResend(institutionId: string): Promise<ProbeResult> {
  const apiKey = (await resolveCredential(institutionId, 'Resend', 'apiKey'))!
  const status = await requestStatus('https://api.resend.com/domains', {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  return fromHttp(status, 'Resend accepted this API key.', 'Resend rejected this API key.')
}

async function pingTwilio(institutionId: string): Promise<ProbeResult> {
  const sid = (await resolveCredential(institutionId, 'Twilio', 'accountSid'))!
  const token = (await resolveCredential(institutionId, 'Twilio', 'authToken'))!
  const auth = Buffer.from(`${sid}:${token}`).toString('base64')
  const status = await requestStatus(`https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, {
    headers: { Authorization: `Basic ${auth}` },
  })
  return fromHttp(status, 'Twilio accepted these credentials.', 'Twilio rejected these credentials.')
}

async function pingPawaPay(institutionId: string, provider: string): Promise<ProbeResult> {
  const token = (await resolveCredential(institutionId, 'PawaPay', 'apiToken'))!
  const host = env().PAYMENT_MODE === 'sandbox' ? 'https://api.sandbox.pawapay.io' : 'https://api.pawapay.io'
  const status = await requestStatus(`${host}/v2/deposits`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const connected =
    provider === 'MTNMoMo'
      ? 'PawaPay accepted this token. MTN MoMo can collect.'
      : provider === 'AirtelMoney'
        ? 'PawaPay accepted this token. Airtel Money can collect.'
        : 'PawaPay accepted this API token.'
  return fromHttp(status, connected, 'PawaPay rejected this API token.')
}

async function pingFlutterwave(institutionId: string): Promise<ProbeResult> {
  const secret = (await resolveCredential(institutionId, 'Flutterwave', 'secretKey'))!
  const status = await requestStatus('https://api.flutterwave.com/v3/balances', {
    headers: { Authorization: `Bearer ${secret}` },
  })
  return fromHttp(status, 'Flutterwave accepted this secret key.', 'Flutterwave rejected this secret key.')
}

async function pingLiveKit(institutionId: string): Promise<ProbeResult> {
  const url = (await resolveCredential(institutionId, 'LiveKit', 'url'))!
  const apiKey = (await resolveCredential(institutionId, 'LiveKit', 'apiKey'))!
  const apiSecret = (await resolveCredential(institutionId, 'LiveKit', 'apiSecret'))!
  const rooms = new RoomServiceClient(url, apiKey, apiSecret, {
    requestTimeout: PROBE_TIMEOUT_MS / 1000,
  })
  await rooms.listRooms()
  return { ok: true, message: 'LiveKit accepted this URL and API key pair.' }
}

async function pingAi(institutionId: string): Promise<ProbeResult> {
  const runtime = await resolveAiRuntime(institutionId)
  if (runtime.provider === 'builtin' || !runtime.apiKey) {
    return { ok: false, message: 'Add an API key for this model, then save.' }
  }
  const label = labelForAi(runtime.provider)
  if (runtime.provider === 'openai') {
    const status = await requestStatus('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${runtime.apiKey}` },
    })
    return fromHttp(status, `${label} accepted this API key.`, `${label} rejected this API key.`)
  }
  if (runtime.provider === 'claude') {
    const status = await requestStatus('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': runtime.apiKey,
        'anthropic-version': '2023-06-01',
      },
    })
    return fromHttp(status, `${label} accepted this API key.`, `${label} rejected this API key.`)
  }
  if (runtime.provider === 'gemini') {
    const status = await requestStatus(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(runtime.apiKey)}`,
    )
    return fromHttp(status, `${label} accepted this API key.`, `${label} rejected this API key.`)
  }
  const status = await requestStatus('https://api.x.ai/v1/models', {
    headers: { Authorization: `Bearer ${runtime.apiKey}` },
  })
  return fromHttp(status, `${label} accepted this API key.`, `${label} rejected this API key.`)
}

async function requestStatus(url: string, init?: RequestInit): Promise<number> {
  const response = await fetch(url, {
    ...init,
    method: 'GET',
    signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
  })
  return response.status
}

function fromHttp(status: number, connected: string, rejected: string): ProbeResult {
  if (status === 401 || status === 403) return { ok: false, message: rejected }
  if (status >= 200 && status < 300) return { ok: true, message: connected }
  return { ok: false, message: `The API returned HTTP ${status}. The key may be wrong, or the service is down.` }
}

function httpStatusFromUnknown(error: unknown): number {
  if (!error || typeof error !== 'object' || !('status' in error)) return 0
  const status = Number(error.status)
  return Number.isFinite(status) ? status : 0
}

function networkMessage(provider: string, error: unknown): string {
  const text = error instanceof Error ? error.message : String(error)
  if (/timeout|aborted|AbortError/i.test(text)) {
    return `Could not reach ${provider} in time. Check the URL and try again.`
  }
  return `Could not reach ${provider}. ${text.slice(0, 140)}`
}

function labelForAi(provider: string): string {
  if (provider === 'openai') return 'OpenAI'
  if (provider === 'claude') return 'Claude'
  if (provider === 'gemini') return 'Gemini'
  if (provider === 'grok') return 'Grok'
  return 'This model'
}
