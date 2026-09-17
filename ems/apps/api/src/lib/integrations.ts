import { eq } from 'drizzle-orm'
import { getInstitutionDb } from '../db/connection'
import { integrations } from '../db/institution/schema/settings'

export type IntegrationProvider =
  | 'Resend'
  | 'MTNMoMo'
  | 'AirtelMoney'
  | 'PawaPay'
  | 'Flutterwave'
  | 'Twilio'
  | 'LiveKit'
  | 'AI'

/** Whether an ICT integration toggle is on for this institution. */
export async function isIntegrationEnabled(
  institutionId: string,
  provider: IntegrationProvider,
): Promise<boolean> {
  const db = await getInstitutionDb(institutionId)
  const [row] = await db
    .select({ isEnabled: integrations.isEnabled })
    .from(integrations)
    .where(eq(integrations.provider, provider))
    .limit(1)
  if (!row) {
    // LiveKit and AI were added after institutions already ran with env keys.
    // A missing row must not turn those services off.
    return provider === 'LiveKit' || provider === 'AI'
  }
  return row.isEnabled
}
