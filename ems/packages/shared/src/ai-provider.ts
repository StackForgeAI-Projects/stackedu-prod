import { z } from 'zod'

export const aiProviderSchema = z.enum(['builtin', 'openai', 'claude', 'gemini', 'grok'])

export type AiProvider = z.infer<typeof aiProviderSchema>

export const AI_PROVIDERS = aiProviderSchema.options

export const AI_PROVIDER_LABELS: Record<AiProvider, string> = {
  builtin: 'In-built',
  openai: 'OpenAI',
  claude: 'Claude',
  gemini: 'Gemini',
  grok: 'Grok',
}

export const DEFAULT_AI_MODELS: Record<AiProvider, string> = {
  builtin: 'builtin',
  openai: 'gpt-4o-mini',
  claude: 'claude-3-5-haiku-latest',
  gemini: 'gemini-2.0-flash',
  grok: 'grok-3-mini',
}

export const ictAiProviderStatusSchema = z.object({
  id: aiProviderSchema,
  label: z.string(),
  hasKey: z.boolean(),
  ready: z.boolean(),
})

export const ictAiSettingsSchema = z.object({
  provider: aiProviderSchema,
  model: z.string().nullable(),
  providers: z.array(ictAiProviderStatusSchema),
})

export type IctAiSettings = z.infer<typeof ictAiSettingsSchema>
