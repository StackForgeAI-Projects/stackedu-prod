import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { Search, Download, ChevronLeft, ChevronRight, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { AppShell } from '@/components/AppShell'
import {
  ICT_MANAGER, ICT_NAV, AUDIT_LOG,
  roleBadgeColors, auditModuleColors, auditStatusColors,
  type AuditModule, type UserRole,
} from '@/data/ict'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/ict/audit-log')({
  component: AuditLogPage,
})

// ── Pagination helper ─────────────────────────────────────────────────────────

function PaginationBar({ page, totalPages, perPage, setPage, setPerPage, total }: {
  page: number; totalPages: number; perPage: number; total: number
  setPage: (p: number) => void; setPerPage: (n: number) => void
}) {
  const start = (page - 1) * perPage + 1
  const end   = Math.min(page * perPage, total)
  const btn   = (disabled: boolean) => ({
    width: 30, height: 30, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
    backgroundColor: 'var(--card)', color: disabled ? 'var(--muted-foreground)' : 'var(--foreground)',
    cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.5 : 1,
  } as React.CSSProperties)
  return (
    <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2">
        <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>Show</span>
        <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1) }}
          style={{ fontSize: '0.8125rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '4px 8px', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: 'pointer' }}>
          {[5, 10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>per page</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{start}–{end} of {total}</span>
        <button style={btn(page === 1)} disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft style={{ width: 14, height: 14 }} /></button>
        <button style={btn(page >= totalPages)} disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight style={{ width: 14, height: 14 }} /></button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

const ALL_MODULES: AuditModule[] = [
  'Dashboard', 'Applications', 'Student Registry', 'Course Management',
  'Fee Management', 'E-Library', 'Results', 'Reports',
  'Audit Log', 'System Settings', 'User Management', 'Announcements',
]

const ALL_ROLES: UserRole[] = ['Student', 'Lecturer', 'Bursar', 'Academic Admin', 'Librarian', 'ICT Manager']

function AuditLogPage() {
  const navigate = useNavigate()
  const [search, setSearch]           = useState('')
  const [fromDate, setFromDate]       = useState('')
  const [toDate, setToDate]           = useState('')
  const [roleFilter, setRoleFilter]   = useState<string>('all')
  const [moduleFilter, setModuleFilter] = useState<string>('all')
  const [page, setPage]               = useState(1)
  const [perPage, setPerPage]         = useState(10)

  const filtered = useMemo(() => {
    return AUDIT_LOG.filter((e) => {
      const matchSearch = !search ||
        e.userName.toLowerCase().includes(search.toLowerCase()) ||
        e.action.toLowerCase().includes(search.toLowerCase()) ||
        e.userId.toLowerCase().includes(search.toLowerCase())
      const matchRole   = roleFilter   === 'all' || e.role   === roleFilter
      const matchModule = moduleFilter === 'all' || e.module === moduleFilter
      const matchFrom   = !fromDate || e.timestamp >= fromDate
      const matchTo     = !toDate   || e.timestamp <= toDate + ' 23:59'
      return matchSearch && matchRole && matchModule && matchFrom && matchTo
    })
  }, [search, roleFilter, moduleFilter, fromDate, toDate])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginated  = filtered.slice((page - 1) * perPage, page * perPage)

  const filterSelectStyle: React.CSSProperties = {
    fontSize: '0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
    padding: '8px 12px', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: 'pointer',
  }

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

        {/* Section header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Audit Log</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>{AUDIT_LOG.length} recorded events</p>
          </div>
          <button onClick={() => toast.success('Audit log exported.')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150"
            style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card)' }}>
            <Download style={{ width: 15, height: 15 }} />
            Export
          </button>
        </div>

        {/* Filters row 1 */}
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-2 rounded-lg px-3 h-10 flex-1 min-w-48"
            style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}>
            <Search style={{ width: 14, height: 14, color: 'var(--muted-foreground)', flexShrink: 0 }} />
            <input type="text" placeholder="Search by user, action, or ID…" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="flex-1 bg-transparent text-sm outline-none" style={{ color: 'var(--foreground)' }} />
          </div>
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }} style={filterSelectStyle}>
            <option value="all">All Roles</option>
            {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={moduleFilter} onChange={(e) => { setModuleFilter(e.target.value); setPage(1) }} style={filterSelectStyle}>
            <option value="all">All Modules</option>
            {ALL_MODULES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Filters row 2 — date range */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center gap-2">
            <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>From</span>
            <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1) }}
              style={{ ...filterSelectStyle, padding: '6px 10px' }} />
          </div>
          <div className="flex items-center gap-2">
            <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>To</span>
            <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1) }}
              style={{ ...filterSelectStyle, padding: '6px 10px' }} />
          </div>
          {(fromDate || toDate) && (
            <button onClick={() => { setFromDate(''); setToDate(''); setPage(1) }}
              className="text-sm font-medium transition-opacity hover:opacity-70"
              style={{ color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Clear dates
            </button>
          )}
        </div>

        {/* Table */}
        <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Timestamp', 'User', 'Module', 'Action', 'IP Address', 'Status'].map((h) => (
                    <th key={h} className="t-label text-left" style={{ color: 'var(--muted-foreground)', paddingBottom: 10, borderBottom: '1px solid var(--border)', fontWeight: 600, whiteSpace: 'nowrap', paddingRight: 16 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((entry, i) => {
                  const rc  = roleBadgeColors(entry.role)
                  const mc  = auditModuleColors(entry.module)
                  const asc = auditStatusColors(entry.status)
                  return (
                    <tr key={entry.id}
                      style={{ borderBottom: i < paginated.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}
                      onClick={() => navigate({ to: '/ict/audit-entry', search: { id: entry.id } })}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--muted)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      <td style={{ padding: '14px 16px 14px 0' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--foreground)' }}>{entry.timestamp}</span>
                      </td>
                      <td style={{ padding: '14px 16px 14px 0', minWidth: 140 }}>
                        <p className="text-sm font-medium" style={{ color: 'var(--foreground)', whiteSpace: 'nowrap' }}>{entry.userName}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="t-label px-1.5 py-0.5" style={{ backgroundColor: rc.bg, color: rc.color, borderRadius: 'var(--radius-sm)', fontSize: 10 }}>{entry.role}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--muted-foreground)' }}>{entry.userId}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px 14px 0' }}>
                        <span className="t-label px-1.5 py-0.5" style={{ backgroundColor: mc.bg, color: mc.color, borderRadius: 'var(--radius-sm)', fontSize: 10, whiteSpace: 'nowrap' }}>{entry.module}</span>
                      </td>
                      <td style={{ padding: '14px 16px 14px 0', maxWidth: 280 }}>
                        <p className="text-sm" style={{ color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.action}</p>
                      </td>
                      <td style={{ padding: '14px 16px 14px 0' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{entry.ipAddress}</span>
                      </td>
                      <td style={{ padding: '14px 0' }}>
                        <span className="t-label px-1.5 py-0.5" style={{ backgroundColor: asc.bg, color: asc.color, borderRadius: 'var(--radius-sm)' }}>{entry.status}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <PaginationBar page={page} totalPages={totalPages} perPage={perPage} setPage={setPage} setPerPage={(n) => { setPerPage(n); setPage(1) }} total={filtered.length} />
        </div>

        {/* Tamper-proof note */}
        <div className="flex items-center gap-2 mt-4">
          <Lock style={{ width: 13, height: 13, color: 'var(--muted-foreground)', flexShrink: 0 }} />
          <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
            Audit log entries cannot be modified or deleted. All actions are permanently recorded.
          </p>
        </div>
      </div>

    </AppShell>
  )
}
