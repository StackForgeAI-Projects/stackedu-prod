import { Resend } from 'resend'
import { env } from '../config/env'
import { resolveCredential } from './integration-credentials'
import { isIntegrationEnabled } from './integrations'
import { createLogger } from './logger'

export interface SendEmailInput {
  to: string
  subject: string
  text: string
  html: string
  /** When set, Resend must be enabled in ICT integrations for this institution. */
  institutionId?: string
}

/**
 * Sends mail via Resend when configured. Missing keys are a no-op so local
 * and early production deploys keep working without email.
 * Failures are logged and never thrown — admissions must not fail because mail did.
 */
export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  const config = env()
  const log = createLogger(config.LOG_LEVEL, { service: 'stackedu-api', component: 'email' })

  if (input.institutionId && !(await isIntegrationEnabled(input.institutionId, 'Resend'))) {
    log.debug('Email skipped — Resend integration is off for institution', {
      institutionId: input.institutionId,
      to: input.to,
      subject: input.subject,
    })
    return false
  }

  const apiKey = await resolveCredential(input.institutionId, 'Resend', 'apiKey')
  const from = await resolveCredential(input.institutionId, 'Resend', 'from')
  const replyTo = await resolveCredential(input.institutionId, 'Resend', 'replyTo')

  if (!apiKey || !from) {
    log.debug('Email skipped — Resend API key or sender address is not set', {
      to: input.to,
      subject: input.subject,
    })
    return false
  }

  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from,
      to: [input.to],
      ...(replyTo ? { replyTo } : {}),
      subject: input.subject,
      text: input.text,
      html: input.html,
    })

    if (error) {
      log.error('Resend rejected email', { to: input.to, subject: input.subject, error })
      return false
    }

    log.info('Email sent', { to: input.to, subject: input.subject })
    return true
  } catch (error) {
    log.error('Email send failed', { to: input.to, subject: input.subject, error })
    return false
  }
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
