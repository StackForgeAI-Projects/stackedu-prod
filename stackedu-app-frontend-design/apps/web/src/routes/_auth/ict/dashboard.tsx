import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Users, Activity, UserPlus, CheckCircle2, Circle, Sparkles, RotateCcw, Send } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { StatTile } from '@/components/StatTile'
import {
  ICT_MANAGER, ICT_NAV, RECENT_ACTIVITY, SYSTEM_SERVICES,
  roleBadgeColors, serviceStatusColors,
} from '@/data/ict'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/ict/dashboard')({
  component: IctDashboardPage,
})

// ─────────────────────────────────────────────────────────────────────────────

function IctDashboardPage() {
  const today    = new Date()
  const hours    = today.getHours()
  const greeting = hours < 12 ? 'Good morning' : hours < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr  = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <AppShell
      navItems={ICT_NAV}
      pageTitle="Dashboard"
      userName={ICT_MANAGER.fullName}
      userRole={ICT_MANAGER.role}
      userInitials={ICT_MANAGER.initials}
      unreadCount={3}
      infoCardLabel="ICT MANAGER"
      infoCardValue={ICT_MANAGER.institution}
      infoCardSubtext={ICT_MANAGER.office}
    >
      <div className="flex" style={{ height: 'calc(100vh - var(--header-height))', overflow: 'hidden' }}>

        {/* ── Main content (65%) ───────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 overflow-y-auto animate-fade-up" style={{ padding: '32px 24px 48px 32px' }}>

          {/* Page header */}
          <div className="mb-8">
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>
              {greeting}, {ICT_MANAGER.shortName} 👋
            </h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>{dateStr}</p>
          </div>

          {/* Row 1 — 4 StatTiles */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <StatTile
              icon={Users}
              iconColor="var(--brand)"
              iconBg="rgba(32,244,78,0.08)"
              label="TOTAL PLATFORM USERS"
              value="1,389"
              delta="Students: 1,247 · Staff: 142"
              deltaColor="var(--muted-foreground)"
              animationDelay={0}
            />
            <StatTile
              icon={Activity}
              iconColor="var(--brand)"
              iconBg="rgba(32,244,78,0.08)"
              label="ACTIVE SESSIONS"
              value="47"
              delta="Right now"
              deltaColor="var(--success)"
              animationDelay={60}
            />
            <StatTile
              icon={UserPlus}
              iconColor="var(--warning)"
              iconBg="var(--warning-bg)"
              label="PENDING ACCOUNT REQUESTS"
              value="8"
              delta="Awaiting creation"
              deltaColor="var(--warning)"
              animationDelay={120}
            />
            <StatTile
              icon={CheckCircle2}
              iconColor="var(--success)"
              iconBg="var(--success-bg)"
              label="SYSTEM HEALTH"
              value="Operational"
              delta="All services running"
              deltaColor="var(--success)"
              animationDelay={180}
            />
          </div>

          {/* Recent User Activity */}
          <RecentActivityCard />
        </div>

        {/* ── Right sidebar (35%) ──────────────────────────────────────────── */}
        <div
          className="flex-shrink-0 overflow-y-auto animate-fade-up"
          style={{ width: '35%', borderLeft: '1px solid var(--border)', padding: '32px 24px 48px 20px', animationDelay: '100ms', display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <QuickActionsCard />
          <AiAssistantCard />
          <SystemStatusCard />
        </div>

      </div>
    </AppShell>
  )
}

// ── Recent Activity Card ──────────────────────────────────────────────────────

function RecentActivityCard() {
  return (
    <div className="animate-fade-up" style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24, animationDelay: '60ms' }}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Recent User Activity</h2>
        <Link to="/ict/audit-log" className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--success)' }}>
          View audit log →
        </Link>
      </div>
      <div className="flex flex-col" style={{ gap: 0 }}>
        {RECENT_ACTIVITY.map((item, i) => {
          const rc = roleBadgeColors(item.role)
          return (
            <div key={item.id} className="flex items-start gap-4 py-4" style={{ borderBottom: i < RECENT_ACTIVITY.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div className="flex items-center justify-center rounded-full flex-shrink-0"
                style={{ width: 36, height: 36, backgroundColor: rc.bg }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: rc.color }}>
                  {item.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{item.name}</p>
                  <span className="t-label px-1.5 py-0.5" style={{ backgroundColor: rc.bg, color: rc.color, borderRadius: 'var(--radius-sm)', fontSize: 10 }}>
                    {item.role}
                  </span>
                </div>
                <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>{item.action}</p>
              </div>
              <span className="t-caption flex-shrink-0" style={{ color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{item.time}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Quick Actions Card ────────────────────────────────────────────────────────

function QuickActionsCard() {
  const actions = [
    { label: 'Add new user',   to: '/ict/users'      as const, primary: true  },
    { label: 'Reset password', to: '/ict/users'      as const, primary: false },
    { label: 'Revoke access',  to: '/ict/revocation' as const, primary: false },
    { label: 'View audit log', to: '/ict/audit-log'  as const, primary: false },
  ]
  return (
    <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 20 }}>
      <h3 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '0.9375rem' }}>Quick Actions</h3>
      <div className="flex flex-col gap-2.5">
        {actions.map((a) => (
          <Link key={a.label} to={a.to}>
            <button className="w-full flex items-center justify-center py-2.5 rounded-xl text-sm transition-all duration-150"
              style={{ backgroundColor: a.primary ? 'var(--brand)' : 'transparent', color: a.primary ? 'var(--brand-ink)' : 'var(--foreground)', border: a.primary ? 'none' : '1px solid var(--border)', fontWeight: a.primary ? 600 : 500, cursor: 'pointer' }}
              onMouseEnter={(e) => { if (!a.primary) e.currentTarget.style.backgroundColor = 'var(--muted)'; else e.currentTarget.style.opacity = '0.9' }}
              onMouseLeave={(e) => { if (!a.primary) e.currentTarget.style.backgroundColor = 'transparent'; else e.currentTarget.style.opacity = '1' }}
            >
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
  const initial: { role: 'user' | 'assistant'; text: string } = {
    role: 'assistant',
    text: `Hi ${ICT_MANAGER.shortName}! I can help with user management, system settings, and platform configuration. What do you need?`,
  }
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([initial])

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setMessages((m) => [...m, { role: 'user' as const, text }])
    setSending(true)
    await new Promise((r) => setTimeout(r, 900))
    setMessages((m) => [...m, { role: 'assistant' as const, text: 'Let me check that for you.' }])
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
      <p className="t-caption mb-4" style={{ color: 'var(--ink-muted)' }}>Ask anything about system configuration, users, or integrations.</p>
      <div className="flex flex-col gap-2 mb-3" style={{ maxHeight: 140, overflowY: 'auto' }}>
        {messages.map((msg, i) => (
          <div key={i} className="text-sm px-3 py-2.5"
            style={{ backgroundColor: msg.role === 'assistant' ? 'var(--ink-surface)' : 'rgba(32,244,78,0.12)', borderRadius: 'var(--radius-md)', color: 'var(--ink-foreground)', lineHeight: 1.5, alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '92%' }}>
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
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send() }}
          placeholder="Ask a question…" className="flex-1 text-sm outline-none bg-transparent"
          style={{ backgroundColor: 'var(--ink-surface)', border: '1px solid var(--ink-border)', borderRadius: 'var(--radius-md)', padding: '8px 12px', color: 'var(--ink-foreground)' }} />
        <button onClick={send} disabled={!input.trim() || sending} className="flex items-center justify-center flex-shrink-0 transition-opacity duration-150"
          style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: input.trim() && !sending ? 'pointer' : 'not-allowed', opacity: input.trim() && !sending ? 1 : 0.5 }}>
          <Send style={{ width: 14, height: 14 }} />
        </button>
      </div>
    </div>
  )
}

// ── System Status Card ────────────────────────────────────────────────────────

function SystemStatusCard() {
  return (
    <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 20 }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '0.9375rem' }}>System Status</h3>
        <Link to="/ict/integrations" className="text-xs font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--success)' }}>
          Manage →
        </Link>
      </div>
      <div className="flex flex-col" style={{ gap: 0 }}>
        {SYSTEM_SERVICES.map((svc, i) => {
          const sc = serviceStatusColors(svc.status)
          return (
            <div key={svc.name} className="flex items-center gap-3 py-2.5"
              style={{ borderBottom: i < SYSTEM_SERVICES.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <Circle style={{ width: 8, height: 8, fill: sc.dot, color: sc.dot, flexShrink: 0 }} />
              <span className="flex-1 text-sm" style={{ color: 'var(--foreground)' }}>{svc.name}</span>
              <span className="t-label px-1.5 py-0.5" style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)', fontSize: 10 }}>
                {svc.status}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
