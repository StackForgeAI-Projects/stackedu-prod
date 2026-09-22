import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import type { AcademicDashboard } from '@stackedu/shared'
import {
  Users, FileText, ClipboardList, AlertTriangle,
  Sparkles, RotateCcw, Send,
  CalendarDays, ChevronRight, BookOpen,
} from 'lucide-react'
import { AcademicShell } from '@/components/AcademicShell'
import { DataTable } from '@/components/DataTable'
import { StatTile } from '@/components/StatTile'
import { calEventColors } from '@/data/academic'
import {
  academicDashboardQueryKey,
  getAcademicDashboard,
} from '@/lib/api/academic'
import { ApplicationStatusBadge } from '@/lib/application-status'
import { apiErrorMessage } from '@/lib/api/client'
import { formatDateLong, formatDateShort, formatDateTime } from '@/lib/utils'

export const Route = createFileRoute('/_auth/academic/dashboard')({
  component: AcademicDashboardPage,
})

function eventColors(type: string) {
  const known = ['Semester', 'Registration', 'Exam', 'Holiday', 'Deadline', 'Results'] as const
  if ((known as readonly string[]).includes(type)) {
    return calEventColors(type as (typeof known)[number])
  }
  return { bg: 'var(--muted)', color: 'var(--muted-foreground)' }
}

function AcademicDashboardPage() {
  const { data, isPending, error } = useQuery({
    queryKey: academicDashboardQueryKey,
    queryFn: getAcademicDashboard,
  })

  const today = new Date()
  const hours = today.getHours()
  const greeting = hours < 12 ? 'Good morning' : hours < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr = formatDateLong(today)

  return (
    <AcademicShell pageTitle="Dashboard">
      {isPending ? (
        <p className="t-body p-8" style={{ color: 'var(--muted-foreground)' }}>Loading dashboard…</p>
      ) : error ? (
        <p className="t-body p-8" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load the dashboard.')}</p>
      ) : data ? (
        <div className="page-split">
          <div className="page-split-main animate-fade-up">
            <div className="mb-8">
              <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>
                {greeting}, {data.profile.firstName} 👋
              </h1>
              <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>{dateStr}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              <StatTile icon={Users} iconColor="var(--brand)" iconBg="rgba(var(--brand-rgb),0.08)" label="TOTAL ENROLLED" value={String(data.stats.totalEnrolled)} delta="Current enrolment" deltaColor="var(--success)" animationDelay={0} />
              <StatTile icon={FileText} iconColor="var(--warning)" iconBg="var(--warning-bg)" label="PENDING APPLICATIONS" value={String(data.stats.pendingApplications)} delta="Awaiting review" deltaColor="var(--warning)" animationDelay={60} />
              <StatTile icon={ClipboardList} iconColor="var(--warning)" iconBg="var(--warning-bg)" label="RESULTS PENDING APPROVAL" value={String(data.stats.resultsPendingApproval)} delta="Lecturer submissions" deltaColor="var(--warning)" animationDelay={120} />
              <StatTile icon={AlertTriangle} iconColor="var(--error)" iconBg="var(--error-bg)" label="AT-RISK STUDENTS" value={String(data.stats.atRiskStudents)} delta="Flagged this semester" deltaColor="var(--error)" animationDelay={180} />
            </div>

            <RecentApplicationsCard applications={data.recentApplications} />
            <ResultQueueCard results={data.pendingResults} />
          </div>

          <div className="page-split-aside animate-fade-up" style={{ '--aside-width': '35%', animationDelay: '100ms' } as React.CSSProperties}>
            <QuickActionsCard />
            <AiAssistantCard shortName={data.profile.firstName} />
            <UpcomingEventsCard events={data.upcomingEvents} />
          </div>
        </div>
      ) : null}
    </AcademicShell>
  )
}

function RecentApplicationsCard({ applications }: { applications: AcademicDashboard['recentApplications'] }) {
  return (
    <div className="mb-5 animate-fade-up" style={{ animationDelay: '60ms' }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Recent Applications</h2>
        <Link to="/academic/applications" className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--success)' }}>View all →</Link>
      </div>
      <DataTable
        rows={applications}
        rowKey={(app) => app.id}
        searchPlaceholder="Search applicants…"
        empty="No recent applications."
        defaultPageSize={10}
        columns={[
          { id: 'applicant', header: 'Applicant', value: (app) => app.fullName, cell: (app) => <span className="text-sm font-medium whitespace-nowrap" style={{ color: 'var(--foreground)' }}>{app.fullName}</span> },
          { id: 'programme', header: 'Programme', value: (app) => app.programmeName, cell: (app) => <span className="text-sm whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>{app.programmeName}</span> },
          { id: 'submitted', header: 'Date Submitted', value: (app) => formatDateTime(app.submittedAt), cell: (app) => <span className="t-caption whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>{formatDateTime(app.submittedAt)}</span> },
          {
            id: 'status', header: 'Status', value: (app) => app.status,
            cell: (app) => <ApplicationStatusBadge status={app.status} />,
          },
          {
            id: 'review', header: '', className: 'text-right',
            cell: (app) => (
              <Link to="/academic/application" search={{ id: app.id }}>
                <button type="button" className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors duration-150" style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: 'pointer' }}>Review</button>
              </Link>
            ),
          },
        ]}
      />
    </div>
  )
}

function ResultQueueCard({ results }: { results: AcademicDashboard['pendingResults'] }) {
  return (
    <div className="animate-fade-up" style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24, animationDelay: '120ms' }}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Result Approval Queue</h2>
        <Link to="/academic/results" className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--success)' }}>View all →</Link>
      </div>
      {results.length === 0 ? (
        <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>No results pending approval.</p>
      ) : (
        <div className="flex flex-col" style={{ gap: 0 }}>
          {results.map((r, i) => (
            <div key={r.id} className="flex items-center gap-4 py-4" style={{ borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 42, height: 42, backgroundColor: 'var(--muted)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: 'var(--foreground)' }}>{r.courseCode}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{r.courseName}</p>
                <p className="t-caption mt-0.5 truncate" style={{ color: 'var(--muted-foreground)' }}>
                  {r.lecturerName ?? 'Unassigned'} · {r.studentCount} students · {formatDateTime(r.submittedAt)}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link to="/academic/results"><button type="button" className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}>Approve</button></Link>
                <Link to="/academic/results"><button type="button" className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: 'pointer' }}>Review</button></Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function QuickActionsCard() {
  const actions = [
    { label: 'Review applications', to: '/academic/applications' as const, primary: true },
    { label: 'Approve results', to: '/academic/results' as const, primary: false },
    { label: 'Open registration', to: '/academic/calendar' as const, primary: false },
    { label: 'Generate report', to: '/academic/reports' as const, primary: false },
  ]
  return (
    <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 20 }}>
      <h3 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '0.9375rem' }}>Quick Actions</h3>
      <div className="flex flex-col gap-2.5">
        {actions.map((a) => (
          <Link key={a.label} to={a.to}>
            <button type="button" className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm transition-all duration-150"
              style={{ backgroundColor: a.primary ? 'var(--brand)' : 'transparent', color: a.primary ? 'var(--brand-ink)' : 'var(--foreground)', border: a.primary ? 'none' : '1px solid var(--border)', fontWeight: a.primary ? 600 : 500, cursor: 'pointer' }}>
              {a.primary && <ChevronRight style={{ width: 16, height: 16 }} />}
              {a.label}
            </button>
          </Link>
        ))}
      </div>
    </div>
  )
}

function AiAssistantCard({ shortName }: { shortName: string }) {
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const initial = { role: 'assistant' as const, text: `Hi ${shortName}! I can help with applications, result approvals, and academic queries. What do you need?` }
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([initial])

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setMessages((m) => [...m, { role: 'user' as const, text }])
    setSending(true)
    await new Promise((r) => setTimeout(r, 900))
    setMessages((m) => [...m, { role: 'assistant' as const, text: 'Let me look that up for you. Give me a moment.' }])
    setSending(false)
  }

  return (
    <div style={{ backgroundColor: 'var(--ink)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--ink-border)', padding: 20 }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles style={{ width: 16, height: 16, color: 'var(--brand)' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9375rem', fontWeight: 700, color: '#FFFFFF' }}>StackEDU AI</span>
        </div>
        <button type="button" onClick={() => setMessages([initial])} title="Clear chat" style={{ color: 'var(--ink-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
          <RotateCcw style={{ width: 16, height: 16 }} />
        </button>
      </div>
      <div className="flex flex-col gap-2 mb-3" style={{ maxHeight: 140, overflowY: 'auto' }}>
        {messages.map((msg, i) => (
          <div key={i} className="text-sm px-3 py-2.5" style={{ backgroundColor: msg.role === 'assistant' ? 'var(--ink-surface)' : 'rgba(var(--brand-rgb),0.12)', borderRadius: 'var(--radius-md)', color: 'var(--ink-foreground)', lineHeight: 1.5, alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '92%' }}>{msg.text}</div>
        ))}
        {sending && <div className="text-sm px-3 py-2.5" style={{ backgroundColor: 'var(--ink-surface)', borderRadius: 'var(--radius-md)', color: 'var(--ink-muted)' }}>Thinking…</div>}
      </div>
      <div className="flex items-center gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send() }} placeholder="Ask a question…" className="flex-1 text-sm outline-none bg-transparent"
          style={{ backgroundColor: 'var(--ink-surface)', border: '1px solid var(--ink-border)', borderRadius: 'var(--radius-md)', padding: '8px 12px', color: 'var(--ink-foreground)' }} />
        <button type="button" onClick={send} disabled={!input.trim() || sending} style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: input.trim() && !sending ? 'pointer' : 'not-allowed', opacity: input.trim() && !sending ? 1 : 0.5 }}>
          <Send style={{ width: 14, height: 14 }} />
        </button>
      </div>
    </div>
  )
}

function UpcomingEventsCard({ events }: { events: AcademicDashboard['upcomingEvents'] }) {
  return (
    <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 20 }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays style={{ width: 16, height: 16, color: 'var(--muted-foreground)' }} />
          <h3 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '0.9375rem' }}>Upcoming Events</h3>
        </div>
        <Link to="/academic/calendar" className="text-xs font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--success)' }}>View calendar →</Link>
      </div>
      {events.length === 0 ? (
        <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>No upcoming events.</p>
      ) : (
        <div className="flex flex-col" style={{ gap: 0 }}>
          {events.map((ev, i) => {
            const { bg, color } = eventColors(ev.category)
            return (
              <div key={ev.id} className="flex items-start gap-3 py-3" style={{ borderBottom: i < events.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div className="flex-shrink-0 mt-0.5 rounded-lg flex items-center justify-center" style={{ width: 30, height: 30, backgroundColor: bg }}>
                  <BookOpen style={{ width: 13, height: 13, color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{ev.title}</p>
                  <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                    {formatDateShort(ev.startDate)}{ev.endDate && ev.endDate !== ev.startDate ? ` – ${formatDateShort(ev.endDate)}` : ''}
                  </p>
                </div>
                <span className="t-label px-1.5 py-0.5 flex-shrink-0" style={{ backgroundColor: bg, color, borderRadius: 'var(--radius-sm)', fontSize: 10 }}>{ev.category}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
