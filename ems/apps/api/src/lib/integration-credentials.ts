import { z } from 'zod'
import {
  aiProviderSchema,
  integrationCatalogItem,
  type IctIntegrationField,
  type IntegrationCatalogProvider,
} from '@stackedu/shared'
import { env, type Env } from '../config/env'
import { getInstitutionDb } from '../db/connection'
import { badRequest } from './errors'
import { readPublicAiSettings, writeAiRuntime } from './ai-complete'
import { readInstitutionSetting, upsertInstitutionSetting } from './institution-settings'

export const INTEGRATION_CREDENTIALS_SETTING_KEY = 'integrations.credentials'

const storedCredentialsSchema = z.record(z.string(), z.record(z.string(), z.string().min(1)))

type StoredCredentials = z.infer<typeof storedCredentialsSchema>

const EMPTY_CREDENTIALS: StoredCredentials = {}

type EnvReader = (values: Env) => string | undefined

const FIELD_ENV: Record<string, Record<string, EnvReader>> = {
  PawaPay: {
    apiToken: (values) => values.PAWAPAY_API_TOKEN,
  },
  Flutterwave: {
    secretKey: (values) => values.FLUTTERWAVE_SECRET_KEY,
    publicKey: (values) => values.FLUTTERWAVE_PUBLIC_KEY,
  },
  Resend: {
    apiKey: (values) => values.RESEND_API_KEY,
    from: (values) => values.EMAIL_FROM,
    replyTo: (values) => values.EMAIL_REPLY_TO,
  },
  Twilio: {
    accountSid: (values) => values.TWILIO_ACCOUNT_SID,
    authToken: (values) => values.TWILIO_AUTH_TOKEN,
    fromNumber: (values) => values.TWILIO_FROM_NUMBER,
  },
  LiveKit: {
    url: (values) => values.LIVEKIT_URL,
    apiKey: (values) => values.LIVEKIT_API_KEY,
    apiSecret: (values) => values.LIVEKIT_API_SECRET,
  },
}

async function readStoredCredentials(institutionId: string): Promise<StoredCredentials> {
  const db = await getInstitutionDb(institutionId)
  return readInstitutionSetting(
    db,
    INTEGRATION_CREDENTIALS_SETTING_KEY,
    storedCredentialsSchema,
    EMPTY_CREDENTIALS,
  )
}

function envValue(provider: string, fieldKey: string): string | undefined {
  const reader = FIELD_ENV[provider]?.[fieldKey]
  if (!reader) return undefined
  const value = reader(env())?.trim()
  return value || undefined
}

function storedValue(stored: StoredCredentials, provider: string, fieldKey: string): string | undefined {
  const value = stored[provider]?.[fieldKey]?.trim()
  return value || undefined
}

/** Stored override first, then the server environment. Never throws. */
export async function resolveCredential(
  institutionId: string | undefined,
  provider: string,
  fieldKey: string,
): Promise<string | undefined> {
  if (institutionId) {
    const stored = await readStoredCredentials(institutionId)
    const local = storedValue(stored, provider, fieldKey)
    if (local) return local
  }
  return envValue(provider, fieldKey)
}

export async function resolveLiveKitCredentials(institutionId: string): Promise<{
  url: string
  apiKey: string
  apiSecret: string
} | null> {
  const [url, apiKey, apiSecret] = await Promise.all([
    resolveCredential(institutionId, 'LiveKit', 'url'),
    resolveCredential(institutionId, 'LiveKit', 'apiKey'),
    resolveCredential(institutionId, 'LiveKit', 'apiSecret'),
  ])
  if (!url || !apiKey || !apiSecret) return null
  return { url, apiKey, apiSecret }
}

export async function publicIntegrationFields(
  institutionId: string,
  provider: string,
): Promise<IctIntegrationField[]> {
  const catalog = integrationCatalogItem(provider)
  if (!catalog) return []
  if (provider === 'AI') return publicAiFields(institutionId)
  const stored = await readStoredCredentials(institutionId)
  return catalog.fields.map((field) => {
    const saved = storedValue(stored, provider, field.key)
    const fromEnv = envValue(provider, field.key)
    const resolved = saved ?? fromEnv
    const source = saved ? 'saved' : fromEnv ? 'env' : null
    return {
      key: field.key,
      label: field.label,
      hint: field.hint,
      secret: field.secret,
      configured: Boolean(resolved),
      source,
      value: field.secret ? null : resolved ?? null,
    }
  })
}

async function publicAiFields(institutionId: string): Promise<IctIntegrationField[]> {
  const catalog = integrationCatalogItem('AI')
  const ai = await readPublicAiSettings(institutionId)
  const selected = ai.providers.find((row) => row.id === ai.provider)
  const hasKey = ai.provider === 'builtin' ? true : Boolean(selected?.hasKey)
  const defs = catalog?.fields ?? []
  return defs.map((field) => {
    if (field.key === 'provider') {
      return {
        key: field.key,
        label: field.label,
        hint: field.hint,
        secret: false,
        configured: true,
        source: 'saved' as const,
        value: ai.provider,
      }
    }
    if (field.key === 'model') {
      return {
        key: field.key,
        label: field.label,
        hint: field.hint,
        secret: false,
        configured: Boolean(ai.model),
        source: ai.model ? ('saved' as const) : null,
        value: ai.model,
      }
    }
    return {
      key: field.key,
      label: field.label,
      hint: field.hint,
      secret: true,
      configured: hasKey && ai.provider !== 'builtin',
      source: hasKey && ai.provider !== 'builtin' ? ('saved' as const) : null,
      value: null,
    }
  })
}

export async function saveIntegrationCredentials(
  institutionId: string,
  actorId: string,
  provider: IntegrationCatalogProvider,
  credentials: Record<string, string>,
): Promise<void> {
  const catalog = integrationCatalogItem(provider)
  if (!catalog) throw badRequest('That integration cannot store credentials.')

  if (provider === 'AI') {
    await saveAiCredentials(institutionId, actorId, credentials)
    return
  }

  const allowed = new Map(catalog.fields.map((field) => [field.key, field]))
  const patch: Record<string, string> = {}
  for (const [key, raw] of Object.entries(credentials)) {
    const field = allowed.get(key)
    if (!field) continue
    const value = raw.trim()
    if (!value) continue
    if (field.secret && value.length < 4) {
      throw badRequest(`${field.label} is too short.`)
    }
    if (provider === 'LiveKit' && key === 'url') {
      try {
        const parsed = new URL(value)
        if (parsed.protocol !== 'wss:' && parsed.protocol !== 'ws:' && parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
          throw new Error('protocol')
        }
      } catch {
        throw badRequest('Enter a LiveKit WebSocket URL, for example wss://your-project.livekit.cloud')
      }
    }
    patch[key] = value
  }
  if (Object.keys(patch).length === 0) return

  const stored = await readStoredCredentials(institutionId)
  const next: StoredCredentials = {
    ...stored,
    [provider]: { ...stored[provider], ...patch },
  }
  const db = await getInstitutionDb(institutionId)
  await upsertInstitutionSetting(
    db,
    INTEGRATION_CREDENTIALS_SETTING_KEY,
    next,
    {
      category: 'Integrations',
      description: 'API keys and addresses for connected services. Secrets are never returned over the API.',
    },
    actorId,
  )
}

async function saveAiCredentials(
  institutionId: string,
  actorId: string,
  credentials: Record<string, string>,
): Promise<void> {
  const providerRaw = credentials.provider?.trim()
  const parsedProvider = providerRaw ? aiProviderSchema.safeParse(providerRaw) : null
  if (providerRaw && !parsedProvider?.success) {
    throw badRequest('Choose a valid AI model type.')
  }
  const apiKey = credentials.apiKey?.trim()
  if (apiKey && apiKey.length < 8) {
    throw badRequest('The AI API key is too short.')
  }
  const modelRaw = credentials.model
  await writeAiRuntime(institutionId, actorId, {
    provider: parsedProvider?.success ? parsedProvider.data : undefined,
    model: modelRaw === undefined ? undefined : modelRaw.trim() || null,
    apiKey: apiKey || undefined,
  })
}
