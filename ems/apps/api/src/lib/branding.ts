import { createHash } from 'node:crypto'
import { env } from '../config/env'

/** Where ICT posts a new logo. The general request size limit skips this path. */
export const INSTITUTION_LOGO_UPLOAD_PATH = '/ict/settings/logo'

const PUBLIC_LOGO_PATH = /^\/public\/institution\/[^/]+\/logo$/

/**
 * The logo is the one response the app is expected to embed from another
 * origin, so it needs a resource policy of its own.
 */
export function isPublicLogoPath(path: string): boolean {
  return PUBLIC_LOGO_PATH.test(path)
}

/**
 * A logo always overwrites the previous one at the same address, so the URL
 * carries a version token. Without it a replaced logo stays hidden behind the
 * browser cache — which is exactly what "I uploaded a logo and nothing
 * changed" looks like from the outside.
 */
function logoVersion(logoFileKey: string, updatedAt: string | null | undefined): string {
  return createHash('sha1').update(`${logoFileKey}:${updatedAt ?? ''}`).digest('hex').slice(0, 10)
}

/** Public URL for an institution's logo, or null when none has been uploaded. */
export function publicLogoUrl(input: {
  slug: string
  logoFileKey: string | null
  updatedAt?: string | null
}): string | null {
  if (!input.logoFileKey) return null
  const origin = env().API_PUBLIC_URL.replace(/\/$/, '')
  const version = logoVersion(input.logoFileKey, input.updatedAt)
  return `${origin}/public/institution/${input.slug}/logo?v=${version}`
}
