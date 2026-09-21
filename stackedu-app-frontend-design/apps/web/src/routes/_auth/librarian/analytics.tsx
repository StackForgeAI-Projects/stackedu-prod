import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  LayoutDashboard, Library, BookMarked, Inbox, BarChart2, Bell,
  TrendingUp, Users, BookOpen, Download,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts'
import { toast } from 'sonner'
import { AppShell } from '@/components/AppShell'
import { StatTile } from '@/components/StatTile'
import { Button } from '@/components/ui/button'
import {
  LIBRARIAN, CATALOGUE_RESOURCES, BOOK_LOANS,
  USAGE_TREND, USAGE_BY_CATEGORY, USAGE_BY_DEPARTMENT, SEARCH_KEYWORDS,
  type ResourceType,
} from '@/data/librarian'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/librarian/analytics')({
  component: LibrarianAnalyticsPage,
})

const LIBRARIAN_NAV = [
  { label: 'Dashboard',          to: '/librarian/dashboard',    icon: LayoutDashboard },
  { label: 'Resource Catalogue', to: '/librarian/catalogue',    icon: Library         },
  { label: 'Collections',        to: '/librarian/collections',  icon: BookMarked      },
  { label: 'Resource Requests',  to: '/librarian/requests',     icon: Inbox           },
  { label: 'Analytics',          to: '/librarian/analytics',    icon: BarChart2       },
  { label: 'Notifications',      to: '/librarian/notifications', icon: Bell           },
]

const TYPE_STYLE: Record<string, { bg: string; color: string }> = {
  'E-Book':         { bg: 'var(--info-bg)',       color: 'var(--info)'             },
  'Journal':        { bg: 'var(--success-bg)',    color: 'var(--success)'          },
  'Research Paper': { bg: 'var(--warning-bg)',    color: 'var(--warning)'          },
  'Course Pack':    { bg: 'rgba(32,244,78,0.12)', color: 'var(--brand)'            },
  'Physical Book':  { bg: 'var(--muted)',         color: 'var(--muted-foreground)' },
}

const TYPE_BADGE_LABELS: Record<ResourceType, string> = {
  'E-Book':         'E-BOOK',
  'Journal':        'JOURNAL',
  'Research Paper': 'RESEARCH PAPER',
  'Course Pack':    'COURSE PACK',
  'Physical Book':  'BOOK',
}

const DATE_RANGES = ['This Week', 'This Month', 'This Semester', 'This Year']

const tooltipStyle = {
  contentStyle: { backgroundColor: 'var(--ink)', border: '1px solid var(--ink-border)', borderRadius: 12, color: '#fff', fontSize: 12 },
  itemStyle:    { color: '#fff' },
  labelStyle:   { color: 'var(--ink-muted)', fontWeight: 600 },
}

// ─────────────────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 28, marginBottom: 24 }}>
      <h2 className="t-h3 mb-6" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>{title}</h2>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function LibrarianAnalyticsPage() {
  const [dateRange, setDateRange] = useState('This Month')

  const topResources = [...CATALOGUE_RESOURCES].sort((a, b) => b.accessCount - a.accessCount).slice(0, 10)
  const maxAccess = topResources[0]?.accessCount ?? 1
  const maxCategoryViews = Math.max(...USAGE_BY_CATEGORY.map(c => c.views))
  const maxDeptViews = Math.max(...USAGE_BY_DEPARTMENT.map(d => d.views))
  const maxKeywordCount = Math.max(...SEARCH_KEYWORDS.map(k => k.count))
  const minKeywordCount = Math.min(...SEARCH_KEYWORDS.map(k => k.count))

  const overdueLoans = BOOK_LOANS.filter(l => l.overdue)

  const keywordFontSize = (count: number) => {
    if (maxKeywordCount === minKeywordCount) return 16
    const ratio = (count - minKeywordCount) / (maxKeywordCount - minKeywordCount)
    return Math.round(12 + ratio * 8)
  }

  return (
    <AppShell
      navItems={LIBRARIAN_NAV}
      pageTitle="Analytics"
      userName={LIBRARIAN.fullName}
      userRole="Librarian"
      userInitials={LIBRARIAN.initials}
      unreadCount={3}
      infoCardLabel="LIBRARIAN"
      infoCardValue="StackForgeAI University"
      infoCardSubtext="Library Services"
    >
      <div className="animate-fade-up" style={{ padding: '32px 32px 48px' }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--muted-foreground)', fontSize: '0.8125rem' }}>
          <span>Librarian</span>
          <span>›</span>
          <span style={{ color: 'var(--foreground)' }}>Analytics</span>
        </div>
        <div className="flex items-start justify-between mb-6">
          <h1 className="t-h1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>
            Library Analytics
          </h1>
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              style={{ fontSize: '0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '8px 12px', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: 'pointer', outline: 'none' }}
            >
              {DATE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => toast.success('Analytics report exported.')}
            >
              <Download style={{ width: 15, height: 15 }} />
              Export report
            </Button>
          </div>
        </div>

        {/* ── Section 1 — Overview StatTiles ────────────────────────────── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <StatTile
            icon={TrendingUp}
            iconColor="var(--brand)" iconBg="rgba(32,244,78,0.08)"
            label="TOTAL RESOURCE VIEWS" value="1,847"
            delta="+234 this week" deltaColor="var(--success)"
            animationDelay={0}
          />
          <StatTile
            icon={Users}
            iconColor="var(--brand)" iconBg="rgba(32,244,78,0.08)"
            label="UNIQUE ACTIVE USERS" value="312"
            delta="Students and lecturers" deltaColor="var(--muted-foreground)"
            animationDelay={60}
          />
          <StatTile
            icon={BookOpen}
            iconColor="var(--info)" iconBg="var(--info-bg)"
            label="MOST POPULAR CATEGORY" value="E-Books"
            delta="642 views" deltaColor="var(--muted-foreground)"
            animationDelay={120}
          />
          <StatTile
            icon={BookOpen}
            iconColor="var(--error)" iconBg="var(--error-bg)"
            label="PHYSICAL BOOKS ON LOAN" value="14"
            delta="3 overdue returns" deltaColor="var(--error)"
            animationDelay={180}
          />
        </div>

        {/* ── Section 2 — Most Accessed Resources ───────────────────────── */}
        <Section title="Most Accessed Resources">
          <div className="flex flex-col" style={{ gap: 0 }}>
            {topResources.map((r, i) => {
              const ts = TYPE_STYLE[r.type] ?? { bg: 'var(--muted)', color: 'var(--muted-foreground)' }
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-4 py-3"
                  style={{ borderBottom: i < topResources.length - 1 ? '1px solid var(--border)' : 'none' }}
                >
                  <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 24, height: 24, backgroundColor: 'rgba(32,244,78,0.12)' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--brand)' }}>{i + 1}</span>
                  </div>
                  <span className="t-label px-1.5 py-0.5 flex-shrink-0" style={{ backgroundColor: ts.bg, color: ts.color, borderRadius: 'var(--radius-sm)', fontSize: 9, width: 82, textAlign: 'center' }}>
                    {TYPE_BADGE_LABELS[r.type]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{r.title}</p>
                    <p className="t-caption mt-0.5 truncate" style={{ color: 'var(--muted-foreground)' }}>{r.author}</p>
                  </div>
                  <div className="hidden md:block flex-shrink-0" style={{ width: 160 }}>
                    <div className="rounded-full overflow-hidden" style={{ height: 5, backgroundColor: 'var(--muted)' }}>
                      <div style={{ height: '100%', width: `${Math.round((r.accessCount / maxAccess) * 100)}%`, backgroundColor: 'var(--brand)', borderRadius: 4 }} />
                    </div>
                  </div>
                  <span
                    className="t-label px-2 py-0.5 flex-shrink-0"
                    style={{ fontFamily: 'var(--font-mono)', backgroundColor: 'rgba(32,244,78,0.10)', color: '#16A34A', borderRadius: 'var(--radius-sm)', minWidth: 44, textAlign: 'right' }}
                  >
                    {r.accessCount}
                  </span>
                </div>
              )
            })}
          </div>
        </Section>

        {/* ── Section 3 — Usage Trends ───────────────────────────────────── */}
        <Section title="Usage Trends">
          <p className="t-label mb-4" style={{ color: 'var(--muted-foreground)' }}>DAILY RESOURCE VIEWS — {dateRange.toUpperCase()}</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={USAGE_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} interval={3} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [v, 'Views']} />
              <Line type="monotone" dataKey="views" stroke="#20F44E" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Section>

        {/* ── Section 4 & 5 — Category + Department usage ───────────────── */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 28 }}>
            <h2 className="t-h3 mb-6" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Usage by Category</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={USAGE_BY_CATEGORY} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="type" tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false}
                  tickFormatter={(v: string) => v.replace(' Book', '').replace(' Paper', '')} />
                <YAxis domain={[0, maxCategoryViews]} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} formatter={(v: number) => [v, 'Views']} />
                <Bar dataKey="views" fill="#20F44E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 28 }}>
            <h2 className="t-h3 mb-6" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Usage by Department</h2>
            <div className="flex flex-col gap-4">
              {USAGE_BY_DEPARTMENT.map(d => (
                <div key={d.department}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm" style={{ color: 'var(--foreground)' }}>{d.department}</span>
                    <span className="t-label" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted-foreground)' }}>{d.views}</span>
                  </div>
                  <div className="rounded-full overflow-hidden" style={{ height: 8, backgroundColor: 'var(--muted)' }}>
                    <div style={{ height: '100%', width: `${Math.round((d.views / maxDeptViews) * 100)}%`, backgroundColor: 'var(--brand)', borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Section 6 — Search Keywords ─────────────────────────────────── */}
        <Section title="Search Keywords">
          <p className="t-label mb-4" style={{ color: 'var(--muted-foreground)' }}>TOP SEARCH TERMS — {dateRange.toUpperCase()}</p>
          <div className="flex flex-wrap items-center gap-3">
            {SEARCH_KEYWORDS.map(k => (
              <span
                key={k.term}
                title={`${k.count} searches`}
                className="px-3 py-1.5 rounded-full"
                style={{
                  backgroundColor: 'var(--muted)',
                  color: 'var(--foreground)',
                  fontSize: keywordFontSize(k.count),
                  fontWeight: keywordFontSize(k.count) > 16 ? 600 : 400,
                  lineHeight: 1.4,
                }}
              >
                {k.term}
              </span>
            ))}
          </div>
        </Section>

        {/* ── Section 7 — Physical Book Loans ───────────────────────────── */}
        <Section title="Physical Book Loans">
          <div style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
              <span className="t-label flex-1" style={{ color: 'var(--muted-foreground)' }}>BOOK</span>
              <span className="t-label flex-shrink-0" style={{ color: 'var(--muted-foreground)', width: 160 }}>BORROWER</span>
              <span className="t-label flex-shrink-0 hidden lg:block" style={{ color: 'var(--muted-foreground)', width: 90 }}>LOAN DATE</span>
              <span className="t-label flex-shrink-0" style={{ color: 'var(--muted-foreground)', width: 90 }}>DUE DATE</span>
              <span className="t-label flex-shrink-0" style={{ color: 'var(--muted-foreground)', width: 90, textAlign: 'center' }}>STATUS</span>
              <span className="t-label flex-shrink-0" style={{ color: 'var(--muted-foreground)', width: 110, textAlign: 'right' }}>ACTION</span>
            </div>
            {BOOK_LOANS.map((loan, i) => (
              <div
                key={loan.id}
                className="flex items-center gap-3 px-4"
                style={{ paddingTop: 14, paddingBottom: 14, borderBottom: i < BOOK_LOANS.length - 1 ? '1px solid var(--border)' : 'none', backgroundColor: 'var(--card)' }}
              >
                <p className="flex-1 text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{loan.title}</p>
                <div className="flex-shrink-0" style={{ width: 160 }}>
                  <p className="text-sm truncate" style={{ color: 'var(--foreground)' }}>{loan.borrower}</p>
                  <p className="t-caption mt-0.5" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted-foreground)' }}>{loan.studentId}</p>
                </div>
                <span className="t-caption flex-shrink-0 hidden lg:block" style={{ color: 'var(--muted-foreground)', width: 90 }}>{loan.loanDate}</span>
                <span className="t-caption flex-shrink-0" style={{ color: 'var(--muted-foreground)', width: 90 }}>{loan.dueDate}</span>
                <div className="flex-shrink-0" style={{ width: 90, textAlign: 'center' }}>
                  {loan.overdue ? (
                    <span className="t-label px-2 py-0.5" style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-sm)' }}>Overdue</span>
                  ) : (
                    <span className="t-label px-2 py-0.5" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-sm)' }}>On time</span>
                  )}
                </div>
                <div className="flex-shrink-0" style={{ width: 110, textAlign: 'right' }}>
                  {loan.overdue && (
                    <Button
                      size="sm"
                      variant="outline"
                      style={{ fontSize: '0.75rem', height: 28 }}
                      onClick={() => toast.success(`Reminder sent to ${loan.borrower}.`)}
                    >
                      Send reminder
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {overdueLoans.length > 0 && (
            <p className="t-caption mt-3" style={{ color: 'var(--muted-foreground)' }}>
              {overdueLoans.length} of {BOOK_LOANS.length} loans overdue.
            </p>
          )}
        </Section>

      </div>
    </AppShell>
  )
}
