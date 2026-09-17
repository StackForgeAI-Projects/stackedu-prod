import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { BarChart2, Inbox, Library, TrendingUp } from 'lucide-react'
import { formatAppDateDdMmYyyy, RESOURCE_TYPE_LABELS } from '@stackedu/shared'
import { LibrarianShell } from '@/components/LibrarianShell'
import { StatTile } from '@/components/StatTile'
import { apiErrorMessage } from '@/lib/api/client'
import { getLibrarianDashboard, librarianDashboardQueryKey } from '@/lib/api/library'

export const Route = createFileRoute('/_auth/librarian/dashboard')({
  component: LibrarianDashboardPage,
})

function LibrarianDashboardPage() {
  const { data, isPending, error } = useQuery({
    queryKey: librarianDashboardQueryKey,
    queryFn: getLibrarianDashboard,
  })
  const today = formatAppDateDdMmYyyy(new Date())
  const firstName = data?.profile.firstName ?? 'there'

  return (
    <LibrarianShell pageTitle="Dashboard" guide="Catalogue size, pending requests, and what students downloaded today.">
      <div className="animate-fade-up px-4 py-6 sm:px-8" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)' }}>Hello, {firstName}</h1>
        <p className="t-body mb-6" style={{ color: 'var(--muted-foreground)' }}>{today}</p>

        {isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading dashboard…</p>
        ) : error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load the dashboard.')}</p>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatTile icon={Library} label="TOTAL RESOURCES" value={String(data?.totalResources ?? 0)} />
              <StatTile icon={Inbox} label="PENDING REQUESTS" value={String(data?.pendingRequests ?? 0)} />
              <StatTile icon={TrendingUp} label="DOWNLOADS TODAY" value={String(data?.downloadsToday ?? 0)} />
              <StatTile icon={BarChart2} label="PUBLISHED" value={String(data?.publishedResources ?? 0)} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <section className="p-5" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)' }}>Recent catalogue</h2>
                  <Link to="/librarian/catalogue" className="t-caption" style={{ color: 'var(--brand)' }}>View all</Link>
                </div>
                {(data?.recentResources ?? []).length === 0 ? (
                  <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>No resources yet.</p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {data?.recentResources.map((row) => (
                      <li key={row.id}>
                        <p className="text-sm font-medium">{row.title}</p>
                        <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
                          {RESOURCE_TYPE_LABELS[row.type]} · {row.isPublished ? 'Published' : 'Draft'}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section className="p-5" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)' }}>Pending requests</h2>
                  <Link to="/librarian/requests" className="t-caption" style={{ color: 'var(--brand)' }}>View all</Link>
                </div>
                {(data?.pendingRequestRows ?? []).length === 0 ? (
                  <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>No pending requests.</p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {data?.pendingRequestRows.map((row) => (
                      <li key={row.id}>
                        <p className="text-sm font-medium">{row.title}</p>
                        <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
                          {row.requesterName} · {formatAppDateDdMmYyyy(row.createdAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </LibrarianShell>
  )
}
