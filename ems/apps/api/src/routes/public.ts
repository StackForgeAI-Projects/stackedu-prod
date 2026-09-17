import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import type { PublicInstitutionBranding } from '@stackedu/shared'
import { env } from '../config/env'
import { getPlatformDb } from '../db/connection'
import { institutions } from '../db/platform/schema'
import { publicLogoUrl } from '../lib/branding'
import { notFound } from '../lib/errors'
import { createDownloadUrl, openInstitutionLogo } from '../lib/storage'
import type { RequestVariables } from '../middleware/request-context'

export const publicRoutes = new Hono<{ Variables: RequestVariables }>()

function mapPublicBranding(row: {
  name: string
  shortName: string
  slug: string
  website: string | null
  location: string | null
  logoFileKey: string | null
  brandColor: string | null
  updatedAt: string
}): PublicInstitutionBranding {
  return {
    name: row.name,
    shortName: row.shortName,
    slug: row.slug,
    website: row.website,
    location: row.location,
    logoUrl: publicLogoUrl(row),
    brandColor: row.brandColor,
  }
}

/** Public institution branding for login, apply, and receipts before sign-in. */
publicRoutes.get('/public/institution/:slug', async (c) => {
  const slug = c.req.param('slug').trim().toLowerCase()
  const [row] = await getPlatformDb()
    .select({
      name: institutions.name,
      shortName: institutions.shortName,
      slug: institutions.slug,
      website: institutions.website,
      location: institutions.location,
      logoFileKey: institutions.logoFileKey,
      brandColor: institutions.brandColor,
      updatedAt: institutions.updatedAt,
    })
    .from(institutions)
    .where(eq(institutions.slug, slug))
    .limit(1)

  if (!row || row.slug !== slug) throw notFound('That institution')

  return c.json(mapPublicBranding(row))
})

publicRoutes.get('/public/institution/:slug/logo', async (c) => {
  const slug = c.req.param('slug').trim().toLowerCase()
  const [row] = await getPlatformDb()
    .select({ logoFileKey: institutions.logoFileKey, slug: institutions.slug })
    .from(institutions)
    .where(eq(institutions.slug, slug))
    .limit(1)

  if (!row?.logoFileKey || row.slug !== slug) throw notFound('That logo')

  if (env().STORAGE_DRIVER === 'r2') {
    const { url } = await createDownloadUrl(row.logoFileKey)
    return c.redirect(url, 302)
  }

  const { stream, mimeType } = openInstitutionLogo(row.logoFileKey)
  c.header('Content-Type', mimeType)
  // The URL carries a version token, so a cached copy is only ever the copy
  // that token was minted for.
  c.header('Cache-Control', 'public, max-age=3600')
  return c.body(stream as unknown as ReadableStream)
})
