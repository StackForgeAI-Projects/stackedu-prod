import {
  AI_PROVIDER_LABELS,
  AI_PROVIDERS,
  DEFAULT_AI_MODELS,
  aiProviderSchema,
  type AiProvider,
  type IctAiSettings,
  type QuestionType,
} from '@stackedu/shared'
import { z } from 'zod'
import { env } from '../config/env'
import { getInstitutionDb } from '../db/connection'
import { aiUsageLogs } from '../db/institution/schema/ai'
import { readInstitutionSetting, upsertInstitutionSetting } from './institution-settings'

const MAX_COMPLETION_CHARS = 600
const CLOUD_TIMEOUT_MS = 8_000
export const AI_RUNTIME_SETTING_KEY = 'ai.runtime'

const storedKeysSchema = z.object({
  openai: z.string().min(1).optional(),
  claude: z.string().min(1).optional(),
  gemini: z.string().min(1).optional(),
  grok: z.string().min(1).optional(),
})

const storedRuntimeSchema = z.object({
  provider: aiProviderSchema.default('builtin'),
  model: z.string().nullable().optional(),
  keys: storedKeysSchema.default({}),
})

type StoredAiRuntime = z.infer<typeof storedRuntimeSchema>

const DEFAULT_RUNTIME: StoredAiRuntime = { provider: 'builtin', model: null, keys: {} }

export type QuestionDraft = {
  type: QuestionType
  stem: string
  options?: string[]
  correctAnswer: string
  marks: number
}

export function heuristicMaterialDescription(input: {
  title?: string
  fileName?: string
  url?: string
  excerpt?: string
}): string {
  const title = input.title?.trim()
  const host = hostFromUrl(input.url)
  const source = input.fileName?.trim() || host || 'this resource'
  const head = title ? `"${title}"` : source
  const excerpt = input.excerpt?.replace(/\s+/g, ' ').trim()
  if (excerpt) {
    return `Reading for students: ${head}. ${excerpt.slice(0, 280)}`
  }
  if (host) {
    return `Reading for students: ${head}, from ${host}. Open the link for the full material.`
  }
  return `Reading for students: ${head}. Open the attached file for the full material.`
}

export function heuristicQuestions(input: {
  courseCode: string
  courseName: string
  topic: string
  types?: QuestionType[]
  count?: number
  excerpt?: string
}): QuestionDraft[] {
  const types = input.types?.length ? input.types : (['MultipleChoice', 'TrueFalse', 'ShortAnswer'] as QuestionType[])
  const count = Math.min(8, Math.max(1, input.count ?? 4))
  const excerpt = input.excerpt?.replace(/\s+/g, ' ').trim()
  const drafts: QuestionDraft[] = []
  for (let index = 0; index < count; index += 1) {
    drafts.push(draftForType(types[index % types.length]!, input, excerpt, index))
  }
  return drafts
}

export async function readPublicAiSettings(institutionId: string): Promise<IctAiSettings> {
  const stored = await readStoredRuntime(institutionId)
  const envKeys = envFallbackKeys()
  return {
    provider: stored.provider,
    model: stored.model ?? null,
    providers: AI_PROVIDERS.map((id) => {
      const hasKey = id === 'builtin' || Boolean(stored.keys[id] || envKeys[id])
      return {
        id,
        label: AI_PROVIDER_LABELS[id],
        hasKey,
        ready: id === 'builtin' || (stored.provider === id && hasKey) || hasKey,
      }
    }),
  }
}

export async function writeAiRuntime(
  institutionId: string,
  actorId: string,
  patch: { provider?: AiProvider; model?: string | null; apiKey?: string },
): Promise<IctAiSettings> {
  const stored = await readStoredRuntime(institutionId)
  const next: StoredAiRuntime = {
    provider: patch.provider ?? stored.provider,
    model: patch.model === undefined ? stored.model ?? null : patch.model,
    keys: { ...stored.keys },
  }
  if (patch.apiKey && next.provider !== 'builtin') {
    next.keys[next.provider] = patch.apiKey
  }
  const db = await getInstitutionDb(institutionId)
  await upsertInstitutionSetting(
    db,
    AI_RUNTIME_SETTING_KEY,
    next,
    {
      category: 'Integrations',
      description: 'Which AI provider writes descriptions and bank questions for this institution.',
    },
    actorId,
  )
  return readPublicAiSettings(institutionId)
}

export async function completeMaterialDescription(input: {
  institutionId: string
  userId: string
  prompt: string
  fallback: string
}): Promise<string> {
  const result = await completeText({
    ...input,
    feature: 'material.describe',
    system: 'Write one short description a lecturer can show to students. Plain sentences. No markdown.',
    maxTokens: 180,
  })
  return clip(result)
}

export async function completeLibraryDescription(input: {
  institutionId: string
  userId: string
  prompt: string
  fallback: string
}): Promise<string> {
  const result = await completeText({
    ...input,
    feature: 'library.describe',
    system: 'Write one short university e-library catalogue description. Plain sentences. No markdown.',
    maxTokens: 180,
  })
  return clip(result)
}

export async function completeQuestionDrafts(input: {
  institutionId: string
  userId: string
  prompt: string
  fallback: QuestionDraft[]
}): Promise<QuestionDraft[]> {
  const fallbackJson = JSON.stringify(input.fallback)
  const text = await completeText({
    institutionId: input.institutionId,
    userId: input.userId,
    feature: 'questions.generate',
    system:
      'Return only a JSON array of questions. Each item has type (MultipleChoice, TrueFalse, or ShortAnswer), stem, options (array, omit for ShortAnswer), correctAnswer, and marks. No markdown.',
    prompt: input.prompt,
    fallback: fallbackJson,
    maxTokens: 700,
  })
  const parsed = parseQuestionDrafts(text)
  return parsed.length > 0 ? parsed : input.fallback
}

export async function completePlainText(input: {
  institutionId: string
  userId: string
  feature: string
  system: string
  prompt: string
  fallback: string
  maxTokens?: number
}): Promise<string> {
  return clip(
    await completeText({
      institutionId: input.institutionId,
      userId: input.userId,
      feature: input.feature,
      system: input.system,
      prompt: input.prompt,
      fallback: input.fallback,
      maxTokens: input.maxTokens ?? 400,
    }),
  )
}

async function completeText(input: {
  institutionId: string
  userId: string
  feature: string
  system: string
  prompt: string
  fallback: string
  maxTokens: number
}): Promise<string> {
  const resolved = await resolveRuntime(input.institutionId)
  if (resolved.provider === 'builtin' || !resolved.apiKey) {
    return input.fallback
  }

  const started = Date.now()
  try {
    const cloud = await callProvider({
      provider: resolved.provider,
      apiKey: resolved.apiKey,
      model: resolved.model,
      system: input.system,
      prompt: input.prompt,
      maxTokens: input.maxTokens,
    })
    await logUsage(
      input,
      cloud.model,
      Date.now() - started,
      Boolean(cloud.text),
      cloud.promptTokens,
      cloud.completionTokens,
    )
    return cloud.text || input.fallback
  } catch {
    await logUsage(input, resolved.model, Date.now() - started, false)
    return input.fallback
  }
}

async function resolveRuntime(institutionId: string): Promise<{
  provider: AiProvider
  model: string
  apiKey: string | null
}> {
  const stored = await readStoredRuntime(institutionId)
  const envKeys = envFallbackKeys()
  const provider = stored.provider
  if (provider === 'builtin') {
    return { provider, model: DEFAULT_AI_MODELS.builtin, apiKey: null }
  }
  const apiKey = stored.keys[provider] || envKeys[provider] || null
  const model = stored.model?.trim() || envModel(provider) || DEFAULT_AI_MODELS[provider]
  return { provider, model, apiKey }
}

/** Used by ICT connection checks to ping the selected vendor with the stored key. */
export async function resolveAiRuntime(institutionId: string): Promise<{
  provider: AiProvider
  model: string
  apiKey: string | null
}> {
  return resolveRuntime(institutionId)
}

async function readStoredRuntime(institutionId: string): Promise<StoredAiRuntime> {
  const db = await getInstitutionDb(institutionId)
  const stored = await readInstitutionSetting(db, AI_RUNTIME_SETTING_KEY, storedRuntimeSchema, DEFAULT_RUNTIME)
  return {
    provider: stored.provider ?? 'builtin',
    model: stored.model ?? null,
    keys: stored.keys ?? {},
  }
}

function envFallbackKeys(): Partial<Record<Exclude<AiProvider, 'builtin'>, string>> {
  const values = env()
  return {
    openai: values.OPENAI_API_KEY,
    claude: values.ANTHROPIC_API_KEY,
    gemini: values.GEMINI_API_KEY,
    grok: values.GROK_API_KEY ?? values.XAI_API_KEY,
  }
}

function envModel(provider: Exclude<AiProvider, 'builtin'>): string | undefined {
  const values = env()
  if (provider === 'openai') return values.OPENAI_MODEL
  if (provider === 'claude') return values.ANTHROPIC_MODEL
  if (provider === 'gemini') return values.GEMINI_MODEL
  return values.GROK_MODEL
}

async function callProvider(input: {
  provider: Exclude<AiProvider, 'builtin'>
  apiKey: string
  model: string
  system: string
  prompt: string
  maxTokens: number
}): Promise<{ text: string; model: string; promptTokens: number; completionTokens: number }> {
  const signal = AbortSignal.timeout(CLOUD_TIMEOUT_MS)
  if (input.provider === 'claude') return callClaude(input, signal)
  if (input.provider === 'gemini') return callGemini(input, signal)
  return callOpenAiCompatible(input, signal, input.provider === 'grok' ? 'https://api.x.ai/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions')
}

async function callOpenAiCompatible(
  input: { apiKey: string; model: string; system: string; prompt: string; maxTokens: number },
  signal: AbortSignal,
  url: string,
): Promise<{ text: string; model: string; promptTokens: number; completionTokens: number }> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: input.model,
      temperature: 0.3,
      max_tokens: input.maxTokens,
      messages: [
        { role: 'system', content: input.system },
        { role: 'user', content: input.prompt },
      ],
    }),
    signal,
  })
  if (!response.ok) throw new Error('provider')
  const body = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
    usage?: { prompt_tokens?: number; completion_tokens?: number }
    model?: string
  }
  return {
    text: body.choices?.[0]?.message?.content?.trim() ?? '',
    model: body.model ?? input.model,
    promptTokens: body.usage?.prompt_tokens ?? 0,
    completionTokens: body.usage?.completion_tokens ?? 0,
  }
}

async function callClaude(
  input: { apiKey: string; model: string; system: string; prompt: string; maxTokens: number },
  signal: AbortSignal,
): Promise<{ text: string; model: string; promptTokens: number; completionTokens: number }> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': input.apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: input.model,
      max_tokens: input.maxTokens,
      temperature: 0.3,
      system: input.system,
      messages: [{ role: 'user', content: input.prompt }],
    }),
    signal,
  })
  if (!response.ok) throw new Error('provider')
  const body = (await response.json()) as {
    content?: Array<{ text?: string }>
    usage?: { input_tokens?: number; output_tokens?: number }
    model?: string
  }
  return {
    text: body.content?.map((part) => part.text ?? '').join('').trim() ?? '',
    model: body.model ?? input.model,
    promptTokens: body.usage?.input_tokens ?? 0,
    completionTokens: body.usage?.output_tokens ?? 0,
  }
}

async function callGemini(
  input: { apiKey: string; model: string; system: string; prompt: string; maxTokens: number },
  signal: AbortSignal,
): Promise<{ text: string; model: string; promptTokens: number; completionTokens: number }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(input.model)}:generateContent?key=${encodeURIComponent(input.apiKey)}`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: input.system }] },
      contents: [{ parts: [{ text: input.prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: input.maxTokens },
    }),
    signal,
  })
  if (!response.ok) throw new Error('provider')
  const body = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number }
  }
  return {
    text: body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim() ?? '',
    model: input.model,
    promptTokens: body.usageMetadata?.promptTokenCount ?? 0,
    completionTokens: body.usageMetadata?.candidatesTokenCount ?? 0,
  }
}

function draftForType(
  type: QuestionType,
  input: { courseCode: string; courseName: string; topic: string },
  excerpt: string | undefined,
  index: number,
): QuestionDraft {
  const course = `${input.courseCode} ${input.courseName}`.trim()
  const snippet = excerpt ? excerpt.slice(0, 120) : input.topic
  if (type === 'TrueFalse') {
    return {
      type,
      stem: `${input.topic} in ${course} is a required part of this course.`,
      options: ['True', 'False'],
      correctAnswer: 'True',
      marks: 1,
    }
  }
  if (type === 'ShortAnswer') {
    return {
      type,
      stem: `Name one idea from ${input.topic} that students cover in ${course}.`,
      correctAnswer: input.topic,
      marks: 2,
    }
  }
  const distractors = ['A fee invoice', 'A library overdue notice', 'A timetable clash', 'An attendance register']
  const correct = snippet || `${input.topic} in ${course}`
  return {
    type: 'MultipleChoice',
    stem: `Which of these best matches ${input.topic} in ${course}?`,
    options: [correct, distractors[index % distractors.length]!, distractors[(index + 1) % distractors.length]!, distractors[(index + 2) % distractors.length]!],
    correctAnswer: correct,
    marks: 1,
  }
}

function parseQuestionDrafts(text: string): QuestionDraft[] {
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) return []
  try {
    const parsed = JSON.parse(match[0]) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((row) => {
      if (!row || typeof row !== 'object') return []
      const item = row as Record<string, unknown>
      const type = item.type
      if (type !== 'MultipleChoice' && type !== 'TrueFalse' && type !== 'ShortAnswer') return []
      const stem = typeof item.stem === 'string' ? item.stem.trim() : ''
      const correctAnswer = typeof item.correctAnswer === 'string' ? item.correctAnswer.trim() : ''
      if (stem.length < 4 || !correctAnswer) return []
      const marks = Number(item.marks)
      return [{
        type,
        stem,
        options: Array.isArray(item.options) ? item.options.filter((value): value is string => typeof value === 'string') : undefined,
        correctAnswer,
        marks: Number.isFinite(marks) && marks > 0 ? marks : type === 'ShortAnswer' ? 2 : 1,
      }]
    })
  } catch {
    return []
  }
}

function clip(value: string): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, MAX_COMPLETION_CHARS)
}

function hostFromUrl(value?: string): string | null {
  if (!value) return null
  try {
    return new URL(value).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

async function logUsage(
  input: { institutionId: string; userId: string; feature: string },
  model: string,
  latencyMs: number,
  succeeded: boolean,
  promptTokens = 0,
  completionTokens = 0,
): Promise<void> {
  try {
    const db = await getInstitutionDb(input.institutionId)
    await db.insert(aiUsageLogs).values({
      userId: input.userId,
      feature: input.feature,
      model,
      promptTokens,
      completionTokens,
      latencyMs,
      succeeded,
    })
  } catch {
    // Usage is measured for cost, not for the lecturer's save path.
  }
}
