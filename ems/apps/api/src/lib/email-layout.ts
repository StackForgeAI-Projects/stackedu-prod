import { eq } from 'drizzle-orm'
import { env } from '../config/env'
import { getPlatformDb } from '../db/connection'
import { institutions } from '../db/platform/schema'
import { publicLogoUrl } from './branding'
import { escapeHtml } from './email'

/** Shown in email footers when ICT settings have not set location / website yet. */
const DEMO_LOCATION = 'KG 11 Ave, Nyarugenge, Kigali, Rwanda'
const DEMO_WEBSITE = 'https://sfu.ac.rw'
/** Matches the portal default when ICT has not set a system colour. */
const DEFAULT_EMAIL_BRAND_COLOR = '#0FBD3B'

export interface InstitutionEmailBranding {
  name: string
  slug: string
  contactEmail: string
  location: string
  website: string
  logoUrl: string
  brandColor: string
}

export interface BrandedEmailInput {
  branding: InstitutionEmailBranding
  title: string
  greeting: string
  /** Shown immediately after the greeting — used for admissions notes on document requests. */
  leadNote?: string
  paragraphs: string[]
  /** Extra HTML inserted after paragraphs and before the CTA button. */
  bodyHtmlExtra?: string
  /** When set, replaces the default “Open Track” button label. */
  ctaLabel?: string
  /** When false, the Track button is omitted (e.g. account provisioning mail). */
  showTrackButton?: boolean
  trackUrl?: string
}

function defaultLogoUrl(): string {
  return `${env().WEB_APP_URL.replace(/\/$/, '')}/stackedu-logo.png`
}

export async function getInstitutionEmailBranding(
  institutionId: string,
): Promise<InstitutionEmailBranding> {
  const [row] = await getPlatformDb()
    .select({
      name: institutions.name,
      slug: institutions.slug,
      contactEmail: institutions.contactEmail,
      website: institutions.website,
      location: institutions.location,
      logoFileKey: institutions.logoFileKey,
      brandColor: institutions.brandColor,
      updatedAt: institutions.updatedAt,
    })
    .from(institutions)
    .where(eq(institutions.id, institutionId))
    .limit(1)

  const slug = row?.slug ?? 'sfu'
  const logoFromStorage = publicLogoUrl({
    slug,
    logoFileKey: row?.logoFileKey ?? null,
    updatedAt: row?.updatedAt,
  })

  return {
    name: row?.name ?? 'StackForgeAI University',
    slug,
    contactEmail: row?.contactEmail ?? 'admissions@stackedu.rw',
    location: row?.location?.trim() || DEMO_LOCATION,
    website: row?.website?.trim() || DEMO_WEBSITE,
    logoUrl: logoFromStorage ?? defaultLogoUrl(),
    brandColor: row?.brandColor?.trim() || DEFAULT_EMAIL_BRAND_COLOR,
  }
}

function footerLines(branding: InstitutionEmailBranding): string[] {
  const websiteLabel = branding.website.replace(/^https?:\/\//, '')
  return [
    branding.name,
    'Admissions Office',
    branding.location,
    `Email: ${branding.contactEmail}`,
    `Website: ${websiteLabel}`,
    '',
    'Need help? Contact us using the details above.',
    '',
    'Powered by StackEDU',
  ]
}

function buildEmailFooterHtml(branding: InstitutionEmailBranding): string {
  const websiteLabel = branding.website.replace(/^https?:\/\//, '')
  const accent = escapeHtml(branding.brandColor)
  return `
    <div style="text-align:center">
      <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#374151">${escapeHtml(branding.name)}</p>
      <p style="margin:0 0 6px;font-size:12px;line-height:1.5;color:#6b7280">Admissions Office</p>
      <p style="margin:0 0 6px;font-size:12px;line-height:1.5;color:#6b7280">${escapeHtml(branding.location)}</p>
      <p style="margin:0 0 6px;font-size:12px;color:#6b7280">
        Email:
        <a href="mailto:${escapeHtml(branding.contactEmail)}" style="color:${accent};text-decoration:none">${escapeHtml(branding.contactEmail)}</a>
      </p>
      <p style="margin:0 0 12px;font-size:12px;color:#6b7280">
        Website:
        <a href="${escapeHtml(branding.website)}" style="color:${accent};text-decoration:none">${escapeHtml(websiteLabel)}</a>
      </p>
      <p style="margin:0;font-size:11px;line-height:1.5;color:#9ca3af">Need help? Contact us using the details above.</p>
      <p style="margin:8px 0 0;font-size:11px;color:#9ca3af">Powered by StackEDU</p>
    </div>`
}

function buildLeadNoteHtml(leadNote: string): string {
  return `<div style="margin:0 0 16px;padding:14px 16px;border-radius:10px;background:#fffbeb;border:1px solid #fcd34d;border-left:4px solid #f59e0b">
        <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.08em;color:#92400e;font-weight:600">MESSAGE FROM ADMISSIONS</p>
        <p style="margin:0;line-height:1.55;color:#1a1a1a;font-size:14px;font-weight:600">${escapeHtml(leadNote)}</p>
      </div>`
}

export function buildBrandedEmail(input: BrandedEmailInput): { text: string; html: string } {
  const track = input.trackUrl ?? `${env().WEB_APP_URL.replace(/\/$/, '')}/apply/track`
  const showTrack = input.showTrackButton !== false
  const ctaLabel = input.ctaLabel ?? 'Open Track'

  const text = [
    input.greeting,
    '',
    ...(input.leadNote ? [input.leadNote, ''] : []),
    ...input.paragraphs,
    '',
    ...(showTrack ? [`${ctaLabel}: ${track}`, ''] : []),
    ...footerLines(input.branding),
  ].join('\n')

  const accent = escapeHtml(input.branding.brandColor)

  const htmlParagraphs = input.paragraphs
    .map((p) => `<p style="margin:0 0 12px;line-height:1.5;color:#1a1a1a">${escapeHtml(p)}</p>`)
    .join('')

  const trackButton = showTrack
    ? `<p style="margin:20px 0 0">
        <a href="${escapeHtml(track)}" style="display:inline-block;background:${accent};color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600">
          ${escapeHtml(ctaLabel)}
        </a>
      </p>`
    : ''

  const footerHtml = buildEmailFooterHtml(input.branding)

  const leadNoteHtml = input.leadNote ? buildLeadNoteHtml(input.leadNote) : ''

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:system-ui,-apple-system,sans-serif;background:#f6f7f8">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f8;padding:24px 12px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
          <tr>
            <td style="padding:20px 24px;background:#111827;border-bottom:3px solid ${accent}">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:12px;vertical-align:middle">
                    <img src="${escapeHtml(input.branding.logoUrl)}" alt="${escapeHtml(input.branding.name)}" width="44" height="44" style="display:block;border-radius:8px;object-fit:contain;background:#ffffff" />
                  </td>
                  <td style="vertical-align:middle">
                    <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;line-height:1.2">${escapeHtml(input.branding.name)}</p>
                    <p style="margin:4px 0 0;font-size:12px;color:#d1d5db">Admissions Office</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px">
              <h1 style="margin:0 0 16px;font-size:20px;color:#111">${escapeHtml(input.title)}</h1>
              <p style="margin:0 0 12px;line-height:1.5;color:#1a1a1a">${escapeHtml(input.greeting)}</p>
              ${leadNoteHtml}
              ${htmlParagraphs}
              ${input.bodyHtmlExtra ?? ''}
              ${trackButton}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:20px 24px;background:#f9fafb;border-top:1px solid #e5e7eb">
              ${footerHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { text, html }
}
