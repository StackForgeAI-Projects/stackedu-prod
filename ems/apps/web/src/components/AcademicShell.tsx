import { useQuery } from '@tanstack/react-query'
import { AppShell } from '@/components/AppShell'
import { PageGuide } from '@/components/PageGuide'
import { ACADEMIC_NAV } from '@/data/academic'
import { academicProfileQueryKey, getAcademicProfile } from '@/lib/api/academic'
import { ACADEMIC_PAGE_GUIDES } from '@/lib/academic-guides'
import { initialsFrom } from '@/lib/utils'

interface AcademicShellProps {
  pageTitle: string
  guide?: string
  guideKey?: string
  children: React.ReactNode
}

export function AcademicShell({ pageTitle, guide, guideKey, children }: AcademicShellProps) {
  const { data } = useQuery({
    queryKey: academicProfileQueryKey,
    queryFn: getAcademicProfile,
  })

  const guideText = guide ?? ACADEMIC_PAGE_GUIDES[pageTitle]

  return (
    <AppShell
      navItems={ACADEMIC_NAV}
      pageTitle={pageTitle}
      userName={data?.fullName ?? 'Academic Admin'}
      userRole="Academic Admin"
      userInitials={data ? initialsFrom(data.fullName) : 'AA'}
      unreadCount={data?.unreadCount ?? 0}
      infoCardLabel="INSTITUTION"
      infoCardValue={data?.institutionShortName ?? '—'}
      infoCardSubtext={data?.institutionName}
    >
      {guideText ? (
        <div style={{ padding: '20px 16px 0' }}>
          <PageGuide pageKey={guideKey ?? `academic:${pageTitle}`}>{guideText}</PageGuide>
        </div>
      ) : null}
      {children}
    </AppShell>
  )
}
