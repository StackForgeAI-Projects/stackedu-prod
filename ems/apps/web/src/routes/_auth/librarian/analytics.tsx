import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatAppDateDdMmYyyy, RESOURCE_TYPE_LABELS } from '@stackedu/shared'
import { AnalyticsChartCard, analyticsTooltipStyle } from '@/components/AnalyticsChartCard'
import { LibrarianShell } from '@/components/LibrarianShell'
import { StatTile } from '@/components/StatTile'
import { BookOpen, Download, Eye, Inbox } from 'lucide-react'
import { apiErrorMessage } from '@/lib/api/client'
import { getLibraryAnalytics, librarianAnalyticsQueryKey } from '@/lib/api/library'

export const Route = createFileRoute('/_auth/librarian/analytics')({
  component: LibrarianAnalyticsPage,
})

function LibrarianAnalyticsPage() {
  const { data, isPending, error } = useQuery({
    queryKey: librarianAnalyticsQueryKey,
    queryFn: getLibraryAnalytics,
  })

  const daily = (data?.daily ?? []).map((row) => ({
    ...row,
    label: formatAppDateDdMmYyyy(row.date).slice(0, 5),
  }))
  const byType = (data?.byType ?? []).map((row) => ({
    name: RESOURCE_TYPE_LABELS[row.type],
    count: row.count,
  }))

  return (
    <LibrarianShell pageTitle="Analytics" guide="Usage comes from signed downloads and opens, which publishers require for licensing reports.">
      <div className="animate-fade-up px-4 py-6 sm:px-8" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h1 className="t-h1 mb-5" style={{ fontFamily: 'var(--font-display)' }}>Analytics</h1>
        {isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading analytics…</p>
        ) : error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load analytics.')}</p>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatTile icon={BookOpen} label="RESOURCES" value={String(data?.totalResources ?? 0)} />
              <StatTile icon={Download} label="DOWNLOADS" value={String(data?.totalDownloads ?? 0)} />
              <StatTile icon={Eye} label="VIEWS" value={String(data?.totalViews ?? 0)} />
              <StatTile icon={Inbox} label="PENDING REQUESTS" value={String(data?.pendingRequests ?? 0)} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <AnalyticsChartCard title="Downloads and views" empty={daily.every((row) => row.downloads === 0 && row.views === 0) ? 'No usage yet.' : null}>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={daily}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip {...analyticsTooltipStyle} />
                    <Line type="monotone" dataKey="downloads" stroke="var(--brand)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="views" stroke="var(--info)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </AnalyticsChartCard>
              <AnalyticsChartCard title="By type" empty={byType.length === 0 ? 'No resources yet.' : null}>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={byType}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip {...analyticsTooltipStyle} />
                    <Bar dataKey="count" fill="var(--brand)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </AnalyticsChartCard>
            </div>

            <section className="mt-4 p-5" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
              <h2 className="t-h3 mb-3" style={{ fontFamily: 'var(--font-display)' }}>Most downloaded</h2>
              {(data?.topResources ?? []).length === 0 ? (
                <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>No downloads yet.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {data?.topResources.map((row) => (
                    <li key={row.id} className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{row.title}</p>
                        <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{RESOURCE_TYPE_LABELS[row.type]}</p>
                      </div>
                      <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{row.downloadCount} downloads</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </LibrarianShell>
  )
}
