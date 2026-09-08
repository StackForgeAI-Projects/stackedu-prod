import { useQuery } from '@tanstack/react-query'
import { AppShell } from '@/components/AppShell'
import { PageGuide } from '@/components/PageGuide'
import { BURSAR_NAV } from '@/data/bursar'
import { getBursarProfile, bursarProfileQueryKey } from '@/lib/api/bursar'
import { initialsFrom } from '@/lib/utils'

interface BursarShellProps {
  pageTitle: string
  guide?: string
  children: React.ReactNode
}

export function BursarShell({ pageTitle, guide, children }: BursarShellProps) {
  const { data } = useQuery({
    queryKey: bursarProfileQueryKey,
    queryFn: getBursarProfile,
  })

  return (
    <AppShell
      navItems={BURSAR_NAV}
      pageTitle={pageTitle}
      userName={data?.fullName ?? 'Bursar'}
      userRole="Bursar"
      userInitials={data ? initialsFrom(data.fullName) : 'BU'}
      unreadCount={data?.unreadCount ?? 0}
      infoCardLabel="BURSAR"
      infoCardValue={data?.institutionShortName ?? '—'}
      infoCardSubtext={data?.institutionName ?? 'Finance Office'}
    >
      {guide ? (
        <div style={{ padding: '20px 16px 0' }}>
          <PageGuide pageKey={`bursar:${pageTitle}`}>{guide}</PageGuide>
        </div>
      ) : null}
      {children}
    </AppShell>
  )
}
