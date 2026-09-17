import type { PublicInstitutionBranding } from '@stackedu/shared'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { api } from '@/lib/api/client'
import { applyBrandColor, rememberBrandColor } from '@/lib/brand-theme'

const DEFAULT_SLUG = import.meta.env.VITE_DEFAULT_INSTITUTION_SLUG ?? 'sfu'
const FALLBACK_NAME = 'StackForgeAI University'
export const FALLBACK_WEBSITE = 'https://stackedu.rw'

export type InstitutionBranding = PublicInstitutionBranding

export const institutionBrandingQueryKey = ['public', 'institution', DEFAULT_SLUG] as const

export async function fetchInstitutionBranding(slug = DEFAULT_SLUG): Promise<InstitutionBranding> {
  return api.get<InstitutionBranding>(`/public/institution/${slug}`)
}

export function useInstitutionBranding() {
  const query = useQuery({
    queryKey: institutionBrandingQueryKey,
    queryFn: () => fetchInstitutionBranding(),
    staleTime: 5 * 60 * 1000,
  })

  return {
    ...query,
    institutionName: query.data?.name ?? FALLBACK_NAME,
    institutionShortName: query.data?.shortName ?? 'SFU',
    logoUrl: query.data?.logoUrl ?? null,
    institutionWebsite: query.data?.website?.trim() || FALLBACK_WEBSITE,
    location: query.data?.location ?? null,
  }
}

/**
 * Paints the app in the institution's colour. Mounted once at the router root
 * so every screen — signed in or not — follows the same setting.
 */
export function useInstitutionBrandTheme(): void {
  const { data, isSuccess } = useQuery({
    queryKey: institutionBrandingQueryKey,
    queryFn: () => fetchInstitutionBranding(),
    staleTime: 5 * 60 * 1000,
  })

  const brandColor = data?.brandColor ?? null

  useEffect(() => {
    if (!isSuccess) return
    applyBrandColor(brandColor)
    rememberBrandColor(brandColor)
  }, [brandColor, isSuccess])
}
