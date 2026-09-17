import type { PaymentMethod } from '@stackedu/shared'
import { env } from '../config/env'
import { badRequest } from '../lib/errors'
import { resolveCredential } from '../lib/integration-credentials'
import { isIntegrationEnabled } from '../lib/integrations'

export interface PaymentGatewayResult {
  completeImmediately: boolean
  gatewayReference: string | null
}

/**
 * Routes a fee payment to the configured provider.
 * Sandbox completes MoMo, Airtel and Card instantly. Live mode checks ICT
 * toggles and server credentials before recording a pending gateway reference.
 */
export async function initiatePaymentGateway(
  institutionId: string,
  method: PaymentMethod,
  reference: string,
): Promise<PaymentGatewayResult> {
  const settings = env()

  if (settings.PAYMENT_MODE === 'sandbox') {
    if (method === 'BankTransfer') {
      return { completeImmediately: false, gatewayReference: null }
    }
    return { completeImmediately: true, gatewayReference: `sandbox-${reference}` }
  }

  if (method === 'MoMo' || method === 'Airtel') {
    if (!(await isIntegrationEnabled(institutionId, 'PawaPay'))) {
      throw badRequest('Mobile money payments are turned off. Ask ICT to enable PawaPay.')
    }
    if (!(await resolveCredential(institutionId, 'PawaPay', 'apiToken'))) {
      throw badRequest('PawaPay credentials are not configured yet. Ask ICT to add the API token under Integrations.')
    }
    return {
      completeImmediately: false,
      gatewayReference: method === 'Airtel' ? `pawapay-airtel-${reference}` : `pawapay-${reference}`,
    }
  }

  if (method === 'Card') {
    if (!(await isIntegrationEnabled(institutionId, 'Flutterwave'))) {
      throw badRequest('Card payments are turned off. Ask ICT to enable Flutterwave.')
    }
    if (!(await resolveCredential(institutionId, 'Flutterwave', 'secretKey'))) {
      throw badRequest('Flutterwave credentials are not configured yet. Ask ICT to add the secret key under Integrations.')
    }
    return { completeImmediately: false, gatewayReference: `flutterwave-${reference}` }
  }

  return { completeImmediately: false, gatewayReference: null }
}

export async function smsProviderConfigured(institutionId?: string): Promise<boolean> {
  const sid = await resolveCredential(institutionId, 'Twilio', 'accountSid')
  const token = await resolveCredential(institutionId, 'Twilio', 'authToken')
  const from = await resolveCredential(institutionId, 'Twilio', 'fromNumber')
  return Boolean(sid && token && from)
}
