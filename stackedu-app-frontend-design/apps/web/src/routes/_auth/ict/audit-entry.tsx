import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, ChevronRight, Lock } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import {
  ICT_MANAGER, ICT_NAV, AUDIT_LOG, PLATFORM_USERS,
  roleBadgeColors, auditModuleColors, auditStatusColors,
} from '@/data/ict'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/ict/audit-entry')({
  component: AuditEntryPage,
  validateSearch: (search: Record<string, unknown>) => ({
    id: String(search.id ?? ''),
  }),
})

// ─────────────────────────────────────────────────────────────────────────────

function AuditEntryPage() {
  const { id } = Route.useSearch()
  const entry  = AUDIT_LOG.find((e) => e.id === id)

  if (!entry) {
    return (
      <AppShell
        navItems={ICT_NAV}
        pageTitle="Audit Log"
        userName={ICT_MANAGER.fullName}
        userRole={ICT_MANAGER.role}
        userInitials={ICT_MANAGER.initials}
        infoCardLabel="ICT MANAGER"
        infoCardValue={ICT_MANAGER.institution}
        infoCardSubtext={ICT_MANAGER.office}
      >
        <div className="p-8">
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Audit entry not found.</p>
          <Link to="/ict/audit-log" className="text-sm font-medium mt-4 inline-block" style={{ color: 'var(--success)' }}>
            ← Back to Audit Log
          </Link>
        </div>
      </AppShell>
    )
  }

  const asc = auditStatusColors(entry.status)
  const mc  = auditModuleColors(entry.module)
  const rc  = roleBadgeColors(entry.role)

  const relatedUser = entry.userId !== '—'
    ? PLATFORM_USERS.find((u) => u.userId === entry.userId)
    : null

  return (
    <AppShell
      navItems={ICT_NAV}
      pageTitle="Audit Log"
      userName={ICT_MANAGER.fullName}
      userRole={ICT_MANAGER.role}
      userInitials={ICT_MANAGER.initials}
      unreadCount={3}
      infoCardLabel="ICT MANAGER"
      infoCardValue={ICT_MANAGER.institution}
      infoCardSubtext={ICT_MANAGER.office}
    >
      <div className="animate-fade-up" style={{ padding: '32px 32px 48px' }}>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 mb-6">
          <Link to="/ict/dashboard" className="t-caption font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--success)' }}>
            ICT Manager
          </Link>
          <ChevronRight style={{ width: 12, height: 12, color: 'var(--muted-foreground)' }} />
          <Link to="/ict/audit-log" className="t-caption font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--success)' }}>
            Audit Log
          </Link>
          <ChevronRight style={{ width: 12, height: 12, color: 'var(--muted-foreground)' }} />
          <span className="t-caption" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}>{entry.id}</span>
        </div>

        {/* Page header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>
              Audit Entry
            </h1>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{entry.id}</p>
          </div>
          <Link to="/ict/audit-log">
            <button
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150"
              style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card)' }}>
              <ArrowLeft style={{ width: 15, height: 15 }} />
              Audit Log
            </button>
          </Link>
        </div>

        {/* Two-column layout */}
        <div className="flex gap-6" style={{ alignItems: 'flex-start' }}>

          {/* ── Main (65%) ─────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-5" style={{ flex: '0 0 65%', minWidth: 0 }}>

            {/* Event details card */}
            <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24 }}>
              <h2 className="t-h3 mb-5" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Event Details</h2>
              <div className="flex flex-col" style={{ gap: 0 }}>
                {[
                  { label: 'Timestamp',  value: entry.timestamp,  mono: true  },
                  { label: 'User Name',  value: entry.userName,   mono: false },
                  { label: 'User ID',    value: entry.userId,     mono: true  },
                  { label: 'IP Address', value: entry.ipAddress,  mono: true  },
                  { label: 'Action',     value: entry.action,     mono: false },
                ].map((row, i, arr) => (
                  <div key={row.label} className="flex flex-col gap-0.5 py-3"
                    style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <span className="t-label" style={{ color: 'var(--muted-foreground)' }}>{row.label.toUpperCase()}</span>
                    <span style={{
                      fontFamily: row.mono ? 'var(--font-mono)' : undefined,
                      fontSize: '0.875rem', color: 'var(--foreground)', fontWeight: 500, lineHeight: 1.5,
                    }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Change details card (conditional) */}
            {entry.details && (entry.details.before || entry.details.after || entry.details.notes) && (
              <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24 }}>
                <h2 className="t-h3 mb-5" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Change Details</h2>
                <div className="flex flex-col gap-4">
                  {entry.details.before && (
                    <div className="flex flex-col gap-1.5">
                      <span className="t-label" style={{ color: 'var(--muted-foreground)' }}>BEFORE</span>
                      <span className="text-sm px-4 py-3 rounded-xl"
                        style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error)', fontFamily: 'var(--font-mono)', lineHeight: 1.5, display: 'block' }}>
                        {entry.details.before}
                      </span>
                    </div>
                  )}
                  {entry.details.after && (
                    <div className="flex flex-col gap-1.5">
                      <span className="t-label" style={{ color: 'var(--muted-foreground)' }}>AFTER</span>
                      <span className="text-sm px-4 py-3 rounded-xl"
                        style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', fontFamily: 'var(--font-mono)', lineHeight: 1.5, display: 'block' }}>
                        {entry.details.after}
                      </span>
                    </div>
                  )}
                  {entry.details.notes && (
                    <div className="flex flex-col gap-1.5">
                      <span className="t-label" style={{ color: 'var(--muted-foreground)' }}>NOTES</span>
                      <p className="text-sm" style={{ color: 'var(--foreground)', lineHeight: 1.6 }}>{entry.details.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tamper-proof notice */}
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
              style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}>
              <Lock style={{ width: 13, height: 13, color: 'var(--muted-foreground)', flexShrink: 0 }} />
              <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
                This entry is tamper-proof and cannot be modified or deleted. All system actions are permanently recorded.
              </p>
            </div>

          </div>

          {/* ── Sidebar (35%) ──────────────────────────────────────────────── */}
          <div className="flex flex-col gap-4" style={{ flex: '0 0 calc(35% - 24px)', minWidth: 0 }}>

            {/* Classification */}
            <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 20 }}>
              <h3 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '0.9375rem' }}>Classification</h3>
              <div className="flex flex-col gap-4">
                <div>
                  <p className="t-label mb-1.5" style={{ color: 'var(--muted-foreground)' }}>STATUS</p>
                  <span className="t-label px-2 py-0.5 inline-flex"
                    style={{ backgroundColor: asc.bg, color: asc.color, borderRadius: 'var(--radius-sm)' }}>
                    {entry.status}
                  </span>
                </div>
                <div>
                  <p className="t-label mb-1.5" style={{ color: 'var(--muted-foreground)' }}>MODULE</p>
                  <span className="t-label px-2 py-0.5 inline-flex"
                    style={{ backgroundColor: mc.bg, color: mc.color, borderRadius: 'var(--radius-sm)' }}>
                    {entry.module}
                  </span>
                </div>
                <div>
                  <p className="t-label mb-1.5" style={{ color: 'var(--muted-foreground)' }}>USER ROLE</p>
                  <span className="t-label px-2 py-0.5 inline-flex"
                    style={{ backgroundColor: rc.bg, color: rc.color, borderRadius: 'var(--radius-sm)' }}>
                    {entry.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Related user */}
            <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 20 }}>
              <h3 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '0.9375rem' }}>User</h3>
              <div className="flex flex-col gap-3">
                <div>
                  <p className="t-label mb-1" style={{ color: 'var(--muted-foreground)' }}>NAME</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{entry.userName}</p>
                </div>
                <div>
                  <p className="t-label mb-1" style={{ color: 'var(--muted-foreground)' }}>USER ID</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--foreground)' }}>{entry.userId}</p>
                </div>
                {relatedUser && (
                  <Link to="/ict/user" search={{ id: relatedUser.id }}>
                    <button
                      className="w-full py-2 rounded-xl text-sm font-medium transition-colors duration-150"
                      style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: 'pointer' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card)' }}>
                      View user account
                    </button>
                  </Link>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </AppShell>
  )
}
