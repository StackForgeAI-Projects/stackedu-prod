import { eq } from 'drizzle-orm'
import { getInstitutionDb } from '../db/connection'
import { integrations } from '../db/institution/schema/settings'

export type IntegrationProvider = 'Resend' | 'MTNMoMo' | 'AirtelMoney' | 'PawaPay' | 'Flutterwave' | 'Twilio'

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
  return row?.isEnabled ?? false
}
