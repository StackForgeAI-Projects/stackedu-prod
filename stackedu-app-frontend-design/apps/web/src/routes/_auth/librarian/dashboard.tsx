import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import {
  LayoutDashboard, Library, BookMarked, Inbox, BarChart2, Bell,
  TrendingUp, BookOpen, Eye, Pencil, Sparkles, RotateCcw, Send,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { StatTile } from '@/components/StatTile'
import { Button } from '@/components/ui/button'
import {
  LIBRARIAN, CATALOGUE_RESOURCES, LIBRARY_COLLECTIONS, RESOURCE_REQUESTS,
} from '@/data/librarian'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/librarian/dashboard')({
  component: LibrarianDashboardPage,
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
  'E-Book':         { bg: 'var(--info-bg)',           color: 'var(--info)'             },
  'Journal':        { bg: 'var(--success-bg)',         color: 'var(--success)'          },
  'Research Paper': { bg: 'var(--warning-bg)',         color: 'var(--warning)'          },
  'Course Pack':    { bg: 'rgba(32,244,78,0.12)',      color: 'var(--brand)'            },
  'Physical Book':  { bg: 'var(--muted)',              color: 'var(--muted-foreground)' },
}

const ROLE_STYLE: Record<string, { bg: string; color: string }> = {
  Student:  { bg: 'var(--info-bg)',    color: 'var(--info)'    },
  Lecturer: { bg: 'var(--warning-bg)', color: 'var(--warning)' },
}

// ─────────────────────────────────────────────────────────────────────────────

function LibrarianDashboardPage() {
  const today    = new Date()
  const hours    = today.getHours()
  const greeting = hours < 12 ? 'Good morning' : hours < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr  = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const recentResources = CATALOGUE_RESOURCES.slice(0, 5)
  const pendingRequests = RESOURCE_REQUESTS.filter(r => r.status === 'Pending').slice(0, 4)

  return (
    <AppShell
      navItems={LIBRARIAN_NAV}
      pageTitle="Dashboard"
      userName={LIBRARIAN.fullName}
      userRole="Librarian"
      userInitials={LIBRARIAN.initials}
      unreadCount={3}
      infoCardLabel="LIBRARIAN"
      infoCardValue="StackForgeAI University"
      infoCardSubtext="Library Services"
    >
      <div className="flex" style={{ height: 'calc(100vh - var(--header-height))', overflow: 'hidden' }}>

        {/* ── Left main content (65%) ─────────────────────────────────────── */}
        <div className="flex-1 min-w-0 overflow-y-auto animate-fade-up" style={{ padding: '32px 24px 48px 32px' }}>

          {/* Page header */}
          <div className="mb-8">
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>
              {greeting}, {LIBRARIAN.firstName} 👋
            </h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>{dateStr}</p>
          </div>

          {/* Row 1 — 4 StatTiles in 2×2 grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <StatTile
              icon={Library}
              iconColor="var(--brand)" iconBg="rgba(32,244,78,0.08)"
              label="TOTAL RESOURCES" value="156"
              delta="+12 added this month" deltaColor="var(--brand)"
              animationDelay={0}
            />
            <StatTile
              icon={Inbox}
              iconColor="var(--warning)" iconBg="var(--warning-bg)"
              label="ACTIVE RESOURCE REQUESTS" value="8"
              delta="Awaiting fulfilment" deltaColor="var(--warning)"
              animationDelay={60}
            />
            <StatTile
              icon={TrendingUp}
              iconColor="var(--brand)" iconBg="rgba(32,244,78,0.08)"
              label="MOST ACCESSED TODAY" value="24"
              valueUnit="views"
              delta="Introduction to Algorithms" deltaColor="var(--muted-foreground)"
              animationDelay={120}
            />
            <StatTile
              icon={BookOpen}
              iconColor="var(--error)" iconBg="var(--error-bg)"
              label="PHYSICAL BOOKS ON LOAN" value="14"
              delta="3 overdue" deltaColor="var(--error)"
              animationDelay={180}
            />
          </div>

          {/* Row 2 — Recently Added Resources */}
          <RecentResourcesCard resources={recentResources} />

          {/* Row 3 — Pending Resource Requests */}
          <PendingRequestsCard requests={pendingRequests} />
        </div>

        {/* ── Right sidebar (35%) ────────────────────────────────────────── */}
        <div
          className="flex-shrink-0 overflow-y-auto animate-fade-up"
          style={{
            width: '35%', borderLeft: '1px solid var(--border)',
            padding: '32px 24px 48px 20px',
            animationDelay: '100ms',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}
        >
          <QuickActionsCard />
          <AiAssistantCard />
          <CollectionOverviewCard />
        </div>

      </div>
    </AppShell>
  )
}

// ── Recently Added Resources ──────────────────────────────────────────────────

function RecentResourcesCard({ resources }: { resources: typeof CATALOGUE_RESOURCES }) {
  return (
    <div
      className="mb-5 animate-fade-up"
      style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24, animationDelay: '60ms' }}
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Recently Added Resources</h2>
        <Link to="/librarian/catalogue" className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--success)' }}>
          View all →
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {resources.map((r, i) => {
          const ts = TYPE_STYLE[r.type] ?? { bg: 'var(--muted)', color: 'var(--muted-foreground)' }
          return (
            <div
              key={r.id}
              className="flex items-center gap-4 py-3.5"
              style={{ borderBottom: i < resources.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <span
                className="t-label px-2 py-0.5 flex-shrink-0"
                style={{ backgroundColor: ts.bg, color: ts.color, borderRadius: 'var(--radius-sm)', fontSize: 10 }}
              >
                {r.type === 'Physical Book' ? 'BOOK' : r.type.toUpperCase().replace(' ', ' ')}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{r.title}</p>
                <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{r.author}</p>
              </div>
              <span className="t-caption flex-shrink-0 hidden xl:block" style={{ color: 'var(--muted-foreground)', minWidth: 88 }}>{r.dateAdded}</span>
              <span
                className="t-caption flex-shrink-0"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted-foreground)', minWidth: 56, textAlign: 'right' }}
              >
                {r.accessCount} views
              </span>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button className="flex items-center justify-center rounded-md transition-colors hover:bg-[var(--muted)]" style={{ width: 28, height: 28, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }} aria-label="Preview">
                  <Eye size={14} />
                </button>
                <button className="flex items-center justify-center rounded-md transition-colors hover:bg-[var(--muted)]" style={{ width: 28, height: 28, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }} aria-label="Edit">
                  <Pencil size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Pending Requests card ─────────────────────────────────────────────────────

function PendingRequestsCard({ requests }: { requests: typeof RESOURCE_REQUESTS }) {
  return (
    <div
      className="animate-fade-up"
      style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24, animationDelay: '120ms' }}
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Pending Resource Requests</h2>
        <Link to="/librarian/requests" className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--success)' }}>
          View all →
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {requests.map((req, i) => {
          const rs = ROLE_STYLE[req.role]
          return (
            <div
              key={req.id}
              className="flex items-center gap-4 py-3.5"
              style={{ borderBottom: i < requests.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{req.requester}</span>
                  <span className="t-label px-1.5 py-0.5 flex-shrink-0" style={{ backgroundColor: rs.bg, color: rs.color, borderRadius: 'var(--radius-sm)', fontSize: 10 }}>
                    {req.role}
                  </span>
                </div>
                <p className="t-caption truncate" style={{ color: 'var(--muted-foreground)' }}>{req.resourceTitle}</p>
              </div>
              <span className="t-caption flex-shrink-0 hidden xl:block" style={{ color: 'var(--muted-foreground)' }}>{req.dateSubmitted}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button size="sm" variant="outline" style={{ fontSize: '0.75rem', height: 28, borderColor: 'var(--brand)', color: 'var(--brand)' }}>
                  Fulfil
                </Button>
                <Button size="sm" variant="outline" style={{ fontSize: '0.75rem', height: 28 }}>
                  Decline
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Quick Actions card ────────────────────────────────────────────────────────

function QuickActionsCard() {
  const navigate = useNavigate()

  return (
    <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 20 }}>
      <h3 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '0.9375rem' }}>Quick Actions</h3>
      <div className="flex flex-col gap-2">
        <Button
          className="w-full justify-start font-medium"
          style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', height: 38 }}
          onClick={() => navigate({ to: '/librarian/add-resource' })}
        >
          Add new resource
        </Button>
        <Button variant="outline" className="w-full justify-start" style={{ height: 38 }} onClick={() => navigate({ to: '/librarian/collections' })}>
          Manage collections
        </Button>
        <Button variant="outline" className="w-full justify-start" style={{ height: 38 }} onClick={() => navigate({ to: '/librarian/requests' })}>
          View requests
        </Button>
        <Button variant="outline" className="w-full justify-start" style={{ height: 38 }} onClick={() => navigate({ to: '/librarian/analytics' })}>
          Export analytics
        </Button>
      </div>
    </div>
  )
}

// ── AI Assistant card ─────────────────────────────────────────────────────────

const INITIAL_MESSAGE = 'Hi Diane! I can help with resource management, collection organisation, and usage analytics. What do you need?'

function AiAssistantCard() {
  const [messages, setMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([{ role: 'ai', text: INITIAL_MESSAGE }])
  const [input,    setInput]    = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = () => {
    const text = input.trim()
    if (!text) return
    setMessages(prev => [
      ...prev,
      { role: 'user', text },
      { role: 'ai',  text: 'I\'ve noted your query. I\'ll help you with resource management and library analytics.' },
    ])
    setInput('')
  }

  const clear = () => setMessages([{ role: 'ai', text: INITIAL_MESSAGE }])

  return (
    <div style={{ backgroundColor: 'var(--ink)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--ink-border)', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={16} style={{ color: 'var(--brand)' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9375rem', fontWeight: 600, color: '#FFFFFF' }}>StackEDU AI</span>
          <span
            className="t-label px-1.5 py-0.5"
            style={{ backgroundColor: 'rgba(32,244,78,0.15)', color: 'var(--brand)', borderRadius: 'var(--radius-sm)', fontSize: 9, letterSpacing: '0.05em' }}
          >
            LIVE
          </span>
        </div>
        <button onClick={clear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', padding: 4 }} aria-label="Clear chat">
          <RotateCcw size={13} />
        </button>
      </div>

      <p style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', lineHeight: 1.4 }}>
        Ask anything about library resources, requests, or usage.
      </p>

      {/* Messages */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              backgroundColor: m.role === 'user' ? 'var(--brand)' : 'var(--ink-surface)',
              color: m.role === 'user' ? 'var(--brand-ink)' : '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              padding: '8px 12px',
              maxWidth: '90%',
              fontSize: '0.8125rem',
              lineHeight: 1.5,
            }}
          >
            {m.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send() }}
          placeholder="Ask StackEDU AI…"
          style={{
            flex: 1, backgroundColor: 'var(--ink-surface)', border: '1px solid var(--ink-border)',
            borderRadius: 'var(--radius-md)', padding: '7px 12px', fontSize: '0.8125rem',
            color: '#FFFFFF', outline: 'none',
          }}
        />
        <button
          onClick={send}
          style={{
            width: 32, height: 32, borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--brand)', color: 'var(--brand-ink)',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
          aria-label="Send"
        >
          <Send size={13} />
        </button>
      </div>
    </div>
  )
}

// ── Collection Overview card ──────────────────────────────────────────────────

function CollectionOverviewCard() {
  return (
    <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 20 }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '0.9375rem' }}>Collection Overview</h3>
        <Link to="/librarian/collections" className="text-xs font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--success)' }}>
          Manage →
        </Link>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {LIBRARY_COLLECTIONS.map((col, i) => (
          <div
            key={col.id}
            className="flex items-center gap-3 py-2.5"
            style={{ borderBottom: i < LIBRARY_COLLECTIONS.length - 1 ? '1px solid var(--border)' : 'none' }}
          >
            <div className="flex-shrink-0" style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: col.iconColor }} />
            <p className="flex-1 text-sm" style={{ color: 'var(--foreground)' }}>{col.name}</p>
            <span
              className="t-label px-2 py-0.5 flex-shrink-0"
              style={{ backgroundColor: 'rgba(32,244,78,0.08)', color: 'var(--brand)', borderRadius: 'var(--radius-sm)' }}
            >
              {col.resourceCount}
            </span>
            <span className="t-caption flex-shrink-0" style={{ color: 'var(--muted-foreground)', fontSize: 10, minWidth: 64, textAlign: 'right' }}>{col.lastUpdated}</span>
            <Link to="/librarian/collections" className="text-xs font-medium flex-shrink-0 transition-opacity hover:opacity-70" style={{ color: '#16A34A' }}>
              Manage →
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
