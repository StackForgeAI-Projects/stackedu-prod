import { env } from '../config/env'
import { createLogger } from './logger'
import { isIntegrationEnabled } from './integrations'

const log = createLogger('info', { service: 'stackedu-api', component: 'sms' })

/** Sends an SMS via Twilio when credentials and integration are configured. */
export async function sendSmsMessage(
  institutionId: string,
  to: string,
  body: string,
): Promise<boolean> {
  const settings = env()
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = settings

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    return false
  }

  if (settings.PAYMENT_MODE !== 'sandbox' && !(await isIntegrationEnabled(institutionId, 'Twilio'))) {
    return false
  }

  try {
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: to,
          From: TWILIO_FROM_NUMBER,
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
