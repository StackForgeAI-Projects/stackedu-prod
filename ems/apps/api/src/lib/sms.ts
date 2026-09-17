import { env } from '../config/env'
import { createLogger } from './logger'
import { resolveCredential } from './integration-credentials'
import { isIntegrationEnabled } from './integrations'

const log = createLogger('info', { service: 'stackedu-api', component: 'sms' })

/** Sends an SMS via Twilio when credentials and integration are configured. */
export async function sendSmsMessage(
  institutionId: string,
  to: string,
  body: string,
): Promise<boolean> {
  const accountSid = await resolveCredential(institutionId, 'Twilio', 'accountSid')
  const authToken = await resolveCredential(institutionId, 'Twilio', 'authToken')
  const fromNumber = await resolveCredential(institutionId, 'Twilio', 'fromNumber')

  if (!accountSid || !authToken || !fromNumber) {
    return false
  }

  if (env().PAYMENT_MODE !== 'sandbox' && !(await isIntegrationEnabled(institutionId, 'Twilio'))) {
    return false
  }

  try {
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: to,
          From: fromNumber,
          Body: body,
        }),
      },
    )

    if (!response.ok) {
      log.error('Twilio SMS request failed', { status: response.status, to })
      return false
    }

    return true
  } catch (error) {
    log.error('Twilio SMS request error', { to, error: String(error) })
    return false
  }
}
