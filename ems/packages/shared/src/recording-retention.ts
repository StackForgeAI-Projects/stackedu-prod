import { z } from 'zod'

export const recordingRetentionSchema = z
  .object({
    unit: z.enum(['hours', 'days']),
    value: z.number().int().min(1).max(720),
  })
  .superRefine((value, ctx) => {
    if (value.unit === 'days' && value.value > 30) {
      ctx.addIssue({ code: 'custom', message: 'Use 30 days or fewer.', path: ['value'] })
    }
  })

export type RecordingRetention = z.infer<typeof recordingRetentionSchema>

export const RECORDING_RETENTION_SETTING_KEY = 'classroom.recording_retention'

export const DEFAULT_RECORDING_RETENTION: RecordingRetention = {
  unit: 'hours',
  value: 72,
}

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

export function recordingRetentionMs(policy: RecordingRetention): number {
  return policy.unit === 'days' ? policy.value * DAY_MS : policy.value * HOUR_MS
}

export function recordingExpiresAt(from: Date, policy: RecordingRetention): Date {
  return new Date(from.getTime() + recordingRetentionMs(policy))
}

/** Fire one reminder when a quarter of the window remains, capped at 24 hours. */
export function recordingReminderAt(expiresAt: Date, policy: RecordingRetention): Date {
  const total = recordingRetentionMs(policy)
  const lead = Math.min(DAY_MS, Math.max(HOUR_MS, Math.floor(total * 0.25)))
  return new Date(expiresAt.getTime() - lead)
}

export function formatRetentionWindow(policy: RecordingRetention): string {
  if (policy.unit === 'days') return policy.value === 1 ? '1 day' : `${policy.value} days`
  return policy.value === 1 ? '1 hour' : `${policy.value} hours`
}

export function formatDurationUntil(fromMs: number, untilMs: number): string {
  const remaining = Math.max(0, untilMs - fromMs)
  if (remaining >= 36 * HOUR_MS) {
    const days = Math.round(remaining / DAY_MS)
    return days === 1 ? '1 day' : `${days} days`
  }
  const hours = Math.max(1, Math.round(remaining / HOUR_MS))
  return hours === 1 ? '1 hour' : `${hours} hours`
}

export const classroomAutoRecordUsersSchema = z.object({
  userIds: z.array(z.string()),
})

export const CLASSROOM_AUTO_RECORD_SETTING_KEY = 'classroom.auto_record'

export const classroomPreferencesSchema = z.object({
  autoRecord: z.boolean(),
})

export const updateClassroomPreferencesRequestSchema = z.object({
  autoRecord: z.boolean(),
})

export type ClassroomPreferences = z.infer<typeof classroomPreferencesSchema>
export type UpdateClassroomPreferencesRequest = z.infer<typeof updateClassroomPreferencesRequestSchema>
