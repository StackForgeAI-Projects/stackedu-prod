import { useQuery } from '@tanstack/react-query'
import { AppShell } from '@/components/AppShell'
import { PageGuide } from '@/components/PageGuide'
import { LIBRARIAN_NAV } from '@/data/librarian'
import { getLibrarianProfile, librarianProfileQueryKey } from '@/lib/api/library'
import { initialsFrom } from '@/lib/utils'

interface LibrarianShellProps {
  pageTitle: string
  guide?: string
  children: React.ReactNode
}

export function LibrarianShell({ pageTitle, guide, children }: LibrarianShellProps) {
  const { data } = useQuery({
    queryKey: librarianProfileQueryKey,
    queryFn: getLibrarianProfile,
  })

  return (
    <AppShell
      navItems={LIBRARIAN_NAV}
      pageTitle={pageTitle}
      userName={data?.fullName ?? 'Librarian'}
      userRole="Librarian"
      userInitials={data ? initialsFrom(data.fullName) : 'LB'}
      unreadCount={data?.unreadCount ?? 0}
      infoCardLabel="LIBRARY"
      infoCardValue={data?.institutionShortName ?? '—'}
      infoCardSubtext={data?.institutionName}
    >
      {guide ? (
        <div style={{ padding: '20px 16px 0' }}>
          <PageGuide pageKey={`librarian:${pageTitle}`}>{guide}</PageGuide>
        </div>
      ) : null}
      {children}
    </AppShell>
  )
}
