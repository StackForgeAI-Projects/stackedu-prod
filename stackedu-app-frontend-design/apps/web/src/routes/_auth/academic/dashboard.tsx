import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Users, FileText, ClipboardList, AlertTriangle,
  Sparkles, RotateCcw, Send,
  CalendarDays, ChevronRight, BookOpen,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { StatTile } from '@/components/StatTile'
import {
  ACADEMIC_ADMIN, ACADEMIC_NAV, APPLICATIONS, PENDING_RESULTS,
  CAL_EVENTS, appStatusColors, calEventColors,
} from '@/data/academic'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/academic/dashboard')({
  component: AcademicDashboardPage,
})

// ─────────────────────────────────────────────────────────────────────────────

function AcademicDashboardPage() {
  const today    = new Date()
  const hours    = today.getHours()
  const greeting = hours < 12 ? 'Good morning' : hours < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr  = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const recentApps    = APPLICATIONS.slice(0, 5)
  const pendingQueue  = PENDING_RESULTS.slice(0, 4)
  const upcomingEvents = CAL_EVENTS.filter(e => e.startDate >= '2025-01-10').slice(0, 3)

  return (
    <AppShell
      navItems={ACADEMIC_NAV}
      pageTitle="Dashboard"
      userName={ACADEMIC_ADMIN.fullName}
      userRole={ACADEMIC_ADMIN.role}
      userInitials={ACADEMIC_ADMIN.initials}
      unreadCount={4}
      infoCardLabel="ACADEMIC ADMIN"
      infoCardValue={ACADEMIC_ADMIN.institution}
      infoCardSubtext={ACADEMIC_ADMIN.office}
    >
      <div className="flex" style={{ height: 'calc(100vh - var(--header-height))', overflow: 'hidden' }}>

        {/* ── Main content ────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 overflow-y-auto animate-fade-up" style={{ padding: '32px 24px 48px 32px' }}>

          {/* Page header */}
          <div className="mb-8">
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>
              {greeting}, {ACADEMIC_ADMIN.shortName} 👋
            </h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>{dateStr}</p>
          </div>

          {/* Row 1 — 4 StatTiles */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <StatTile icon={Users}         iconColor="var(--brand)"   iconBg="rgba(32,244,78,0.08)" label="TOTAL ENROLLED"          value="1,247" delta="+23 this semester" deltaColor="var(--success)" animationDelay={0}   />
            <StatTile icon={FileText}      iconColor="var(--warning)" iconBg="var(--warning-bg)"   label="PENDING APPLICATIONS"    value="34"    delta="Awaiting review"     deltaColor="var(--warning)" animationDelay={60}  />
            <StatTile icon={ClipboardList} iconColor="var(--warning)" iconBg="var(--warning-bg)"   label="RESULTS PENDING APPROVAL" value="12"   delta="Lecturer submissions"  deltaColor="var(--warning)" animationDelay={120} />
            <StatTile icon={AlertTriangle} iconColor="var(--error)"   iconBg="var(--error-bg)"     label="AT-RISK STUDENTS"         value="18"   delta="Flagged this semester" deltaColor="var(--error)"   animationDelay={180} />
          </div>

          {/* Recent Applications */}
          <RecentApplicationsCard applications={recentApps} />

          {/* Result Approval Queue */}
          <ResultQueueCard results={pendingQueue} />
        </div>

        {/* ── Right sidebar ────────────────────────────────────────────────── */}
        <div
          className="flex-shrink-0 overflow-y-auto animate-fade-up"
          style={{ width: '35%', borderLeft: '1px solid var(--border)', padding: '32px 24px 48px 20px', animationDelay: '100ms', display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <QuickActionsCard />
          <AiAssistantCard />
          <UpcomingEventsCard events={upcomingEvents} />
        </div>

      </div>
    </AppShell>
  )
}

// ── Recent Applications Card ──────────────────────────────────────────────────

function RecentApplicationsCard({ applications }: { applications: typeof APPLICATIONS }) {
  return (
    <div className="mb-5 animate-fade-up" style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24, animationDelay: '60ms' }}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Recent Applications</h2>
        <Link to="/academic/applications" className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--success)' }}>
          View all →
        </Link>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Applicant', 'Programme', 'Date Submitted', 'Status', ''].map((h) => (
                <th key={h} className="t-label text-left" style={{ color: 'var(--muted-foreground)', paddingBottom: 10, borderBottom: '1px solid var(--border)', fontWeight: 600, whiteSpace: 'nowrap', paddingRight: 16 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {applications.map((app, i) => {
              const sc = appStatusColors(app.status)
              return (
                <tr key={app.id} style={{ borderBottom: i < applications.length - 1 ? '1px solid var(--border)' : 'none' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--muted)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td className="text-sm" style={{ color: 'var(--foreground)', padding: '14px 16px 14px 0', fontWeight: 500, whiteSpace: 'nowrap' }}>{app.fullName}</td>
                  <td className="text-sm" style={{ color: 'var(--muted-foreground)', padding: '14px 16px 14px 0', whiteSpace: 'nowrap' }}>{app.programme}</td>
                  <td className="t-caption" style={{ color: 'var(--muted-foreground)', padding: '14px 16px 14px 0', whiteSpace: 'nowrap' }}>{app.submittedDate}</td>
                  <td style={{ padding: '14px 16px 14px 0' }}>
                    <span className="t-label px-2 py-0.5" style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)' }}>{app.status}</span>
                  </td>
                  <td style={{ padding: '14px 0' }}>
                    <Link to="/academic/application" search={{ id: app.id }}>
                      <button className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors duration-150" style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: 'pointer' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card)' }}
                      >
                        Review
                      </button>
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Result Queue Card ─────────────────────────────────────────────────────────

function ResultQueueCard({ results }: { results: typeof PENDING_RESULTS }) {
  return (
    <div className="animate-fade-up" style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24, animationDelay: '120ms' }}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Result Approval Queue</h2>
        <Link to="/academic/results" className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--success)' }}>
          View all →
        </Link>
      </div>
      <div className="flex flex-col" style={{ gap: 0 }}>
        {results.map((r, i) => (
          <div key={r.id} className="flex items-center gap-4 py-4" style={{ borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 42, height: 42, backgroundColor: 'var(--muted)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: 'var(--foreground)' }}>{r.courseCode}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{r.courseName}</p>
              <p className="t-caption mt-0.5 truncate" style={{ color: 'var(--muted-foreground)' }}>{r.lecturer} · {r.studentCount} students · {r.submittedDate}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link to="/academic/results">
                <button className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-150" style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                >
                  Approve
                </button>
              </Link>
              <Link to="/academic/results">
                <button className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors duration-150" style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card)' }}
                >
                  Review
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Quick Actions Card ────────────────────────────────────────────────────────

function QuickActionsCard() {
  const actions = [
    { label: 'Review applications', to: '/academic/applications' as const, primary: true  },
    { label: 'Approve results',     to: '/academic/results'      as const, primary: false },
    { label: 'Open registration',   to: '/academic/calendar'     as const, primary: false },
    { label: 'Generate report',     to: '/academic/reports'      as const, primary: false },
  ]
  return (
    <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 20 }}>
      <h3 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '0.9375rem' }}>Quick Actions</h3>
      <div className="flex flex-col gap-2.5">
        {actions.map((a) => (
          <Link key={a.label} to={a.to}>
            <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm transition-all duration-150"
              style={{ backgroundColor: a.primary ? 'var(--brand)' : 'transparent', color: a.primary ? 'var(--brand-ink)' : 'var(--foreground)', border: a.primary ? 'none' : '1px solid var(--border)', fontWeight: a.primary ? 600 : 500, cursor: 'pointer' }}
              onMouseEnter={(e) => { if (!a.primary) e.currentTarget.style.backgroundColor = 'var(--muted)'; else e.currentTarget.style.opacity = '0.9' }}
              onMouseLeave={(e) => { if (!a.primary) e.currentTarget.style.backgroundColor = 'transparent'; else e.currentTarget.style.opacity = '1' }}
            >
              {a.primary && <ChevronRight style={{ width: 16, height: 16 }} />}
              {a.label}
            </button>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ── AI Assistant Card ─────────────────────────────────────────────────────────

function AiAssistantCard() {
  const [input, setInput]     = useState('')
  const [sending, setSending] = useState(false)
  const initial: { role: 'user' | 'assistant'; text: string } = { role: 'assistant', text: `Hi ${ACADEMIC_ADMIN.shortName}! I can help with applications, result approvals, and academic queries. What do you need?` }
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
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9375rem', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.01em' }}>StackEDU AI</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="t-label px-2 py-0.5" style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', borderRadius: 'var(--radius-sm)' }}>LIVE</span>
          <button onClick={() => setMessages([initial])} title="Clear chat" style={{ color: 'var(--ink-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}>
            <RotateCcw style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>
      <p className="t-caption mb-4" style={{ color: 'var(--ink-muted)' }}>Ask anything about admissions, results, or student records.</p>
      <div className="flex flex-col gap-2 mb-3" style={{ maxHeight: 140, overflowY: 'auto' }}>
        {messages.map((msg, i) => (
          <div key={i} className="text-sm px-3 py-2.5" style={{ backgroundColor: msg.role === 'assistant' ? 'var(--ink-surface)' : 'rgba(32,244,78,0.12)', borderRadius: 'var(--radius-md)', color: 'var(--ink-foreground)', lineHeight: 1.5, alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '92%' }}>
            {msg.text}
          </div>
        ))}
        {sending && (
          <div className="text-sm px-3 py-2.5" style={{ backgroundColor: 'var(--ink-surface)', borderRadius: 'var(--radius-md)', color: 'var(--ink-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />Thinking…
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send() }} placeholder="Ask a question…" className="flex-1 text-sm outline-none bg-transparent"
          style={{ backgroundColor: 'var(--ink-surface)', border: '1px solid var(--ink-border)', borderRadius: 'var(--radius-md)', padding: '8px 12px', color: 'var(--ink-foreground)' }} />
        <button onClick={send} disabled={!input.trim() || sending} className="flex items-center justify-center flex-shrink-0 transition-opacity duration-150"
          style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: input.trim() && !sending ? 'pointer' : 'not-allowed', opacity: input.trim() && !sending ? 1 : 0.5 }}>
          <Send style={{ width: 14, height: 14 }} />
        </button>
      </div>
    </div>
  )
}

// ── Upcoming Events Card ──────────────────────────────────────────────────────

function UpcomingEventsCard({ events }: { events: typeof CAL_EVENTS }) {
  return (
    <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 20 }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays style={{ width: 16, height: 16, color: 'var(--muted-foreground)' }} />
          <h3 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '0.9375rem' }}>Upcoming Events</h3>
        </div>
        <Link to="/academic/calendar" className="text-xs font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--success)' }}>
          View calendar →
        </Link>
      </div>
      <div className="flex flex-col" style={{ gap: 0 }}>
        {events.map((ev, i) => {
          const { bg, color } = calEventColors(ev.type)
          return (
            <div key={ev.id} className="flex items-start gap-3 py-3" style={{ borderBottom: i < events.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div className="flex-shrink-0 mt-0.5 rounded-lg flex items-center justify-center" style={{ width: 30, height: 30, backgroundColor: bg }}>
                <BookOpen style={{ width: 13, height: 13, color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{ev.title}</p>
                <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  {ev.startDate === ev.endDate ? ev.startDate : `${ev.startDate} – ${ev.endDate}`}
                </p>
              </div>
              <span className="t-label px-1.5 py-0.5 flex-shrink-0" style={{ backgroundColor: bg, color, borderRadius: 'var(--radius-sm)', fontSize: 10 }}>
                {ev.type}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
