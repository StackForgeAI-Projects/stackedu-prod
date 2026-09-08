import type { PaymentMethod } from '@stackedu/shared'
import { env } from '../config/env'
import { badRequest } from '../lib/errors'
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

  if (method === 'MoMo') {
    if (!(await isIntegrationEnabled(institutionId, 'PawaPay'))) {
      throw badRequest('Mobile money payments are turned off. Ask ICT to enable PawaPay.')
    }
    if (!settings.PAWAPAY_API_TOKEN) {
      throw badRequest('PawaPay credentials are not configured on the server yet.')
    }
    return { completeImmediately: false, gatewayReference: `pawapay-${reference}` }
  }

  if (method === 'Airtel') {
    if (!(await isIntegrationEnabled(institutionId, 'PawaPay'))) {
      throw badRequest('Mobile money payments are turned off. Ask ICT to enable PawaPay.')
    }
    if (!settings.PAWAPAY_API_TOKEN) {
      throw badRequest('PawaPay credentials are not configured on the server yet.')
    }
    return { completeImmediately: false, gatewayReference: `pawapay-airtel-${reference}` }
  }

  if (method === 'Card') {
    if (!(await isIntegrationEnabled(institutionId, 'Flutterwave'))) {
      throw badRequest('Card payments are turned off. Ask ICT to enable Flutterwave.')
    }
    if (!settings.FLUTTERWAVE_SECRET_KEY) {
      throw badRequest('Flutterwave credentials are not configured on the server yet.')
    }
    return { completeImmediately: false, gatewayReference: `flutterwave-${reference}` }
  }

  return { completeImmediately: false, gatewayReference: null }
}

export function smsProviderConfigured(): boolean {
  const settings = env()
  return Boolean(settings.TWILIO_ACCOUNT_SID && settings.TWILIO_AUTH_TOKEN && settings.TWILIO_FROM_NUMBER)
}
