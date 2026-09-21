import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { toast } from 'sonner'
import { AppShell } from '@/components/AppShell'
import {
  ICT_MANAGER, ICT_NAV, PLATFORM_USERS, REVOCATIONS,
  roleBadgeColors, revocationStatusColors,
  type RevocationRecord, type RevocationStatus,
} from '@/data/ict'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/ict/revocation')({
  component: AccessRevocationPage,
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

function AccessRevocationPage() {
  const [records, setRecords]           = useState<RevocationRecord[]>(REVOCATIONS)
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage]                 = useState(1)
  const [perPage, setPerPage]           = useState(10)

  // Reinstate dialog
  const [reinstateTarget, setReinstateTarget] = useState<RevocationRecord | null>(null)
  const [reinstateNotes, setReinstateNotes]   = useState('')

  // Revoke sheet
  const [revokeSheetOpen, setRevokeSheetOpen] = useState(false)
  const [revokeForm, setRevokeForm] = useState({
    userId:    '',
    reason:    '',
    type:      'Temporary' as 'Temporary' | 'Permanent',
    endDate:   '',
  })

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const matchSearch = !search ||
        r.userName.toLowerCase().includes(search.toLowerCase()) ||
        r.userId.toLowerCase().includes(search.toLowerCase())
      const matchStatus: boolean = statusFilter === 'all' || r.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [records, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginated  = filtered.slice((page - 1) * perPage, page * perPage)

  const handleReinstate = () => {
    if (!reinstateTarget) return
    setRecords((rs) => rs.map((r) => r.id === reinstateTarget.id
      ? { ...r, status: 'Reinstated' as RevocationStatus, reinstatedDate: new Date().toISOString().split('T')[0], reinstatedBy: ICT_MANAGER.fullName }
      : r
    ))
    toast.success(`Access reinstated for ${reinstateTarget.userName}.`)
    setReinstateTarget(null)
    setReinstateNotes('')
  }

  const handleRevoke = () => {
    const user = PLATFORM_USERS.find((u) => u.id === revokeForm.userId)
    if (!user || !revokeForm.reason) return
    const newRecord: RevocationRecord = {
      id:             `rev-${Date.now()}`,
      userName:       user.fullName,
      userId:         user.userId,
      role:           user.role,
      revokedBy:      ICT_MANAGER.fullName,
      revocationDate: new Date().toISOString().split('T')[0],
      reason:         revokeForm.reason,
      status:         'Active Hold',
      type:           revokeForm.type,
      endDate:        revokeForm.type === 'Temporary' ? revokeForm.endDate : undefined,
    }
    setRecords((rs) => [newRecord, ...rs])
    setRevokeSheetOpen(false)
    setRevokeForm({ userId: '', reason: '', type: 'Temporary', endDate: '' })
    toast.success(`Access revoked for ${user.fullName}.`)
  }

  const filterSelectStyle: React.CSSProperties = {
    fontSize: '0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
    padding: '8px 12px', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: 'pointer',
  }

  return (
    <AppShell
      navItems={ICT_NAV}
      pageTitle="Access Revocation"
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
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Access Revocation</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>{records.filter(r => r.status === 'Active Hold').length} active holds</p>
          </div>
          <button onClick={() => setRevokeSheetOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity duration-150"
            style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}>
            <Plus style={{ width: 16, height: 16 }} />
            Revoke new user
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-2 rounded-lg px-3 h-10 flex-1 min-w-48"
            style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}>
            <Search style={{ width: 14, height: 14, color: 'var(--muted-foreground)', flexShrink: 0 }} />
            <input type="text" placeholder="Search by name or user ID…" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="flex-1 bg-transparent text-sm outline-none" style={{ color: 'var(--foreground)' }} />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} style={filterSelectStyle}>
            <option value="all">All Statuses</option>
            <option value="Active Hold">Active Holds</option>
            <option value="Revoked">Revoked</option>
            <option value="Reinstated">Reinstated</option>
          </select>
        </div>

        {/* Table */}
        <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['User Name', 'User ID', 'Role', 'Revoked By', 'Date', 'Reason', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="t-label text-left" style={{ color: 'var(--muted-foreground)', paddingBottom: 10, borderBottom: '1px solid var(--border)', fontWeight: 600, whiteSpace: 'nowrap', paddingRight: 16 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((rec, i) => {
                  const rc  = roleBadgeColors(rec.role)
                  const sc  = revocationStatusColors(rec.status)
                  return (
                    <tr key={rec.id} style={{ borderBottom: i < paginated.length - 1 ? '1px solid var(--border)' : 'none' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--muted)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      <td className="text-sm font-medium" style={{ color: 'var(--foreground)', padding: '14px 16px 14px 0', whiteSpace: 'nowrap' }}>{rec.userName}</td>
                      <td style={{ padding: '14px 16px 14px 0' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{rec.userId}</span>
                      </td>
                      <td style={{ padding: '14px 16px 14px 0' }}>
                        <span className="t-label px-1.5 py-0.5" style={{ backgroundColor: rc.bg, color: rc.color, borderRadius: 'var(--radius-sm)' }}>{rec.role}</span>
                      </td>
                      <td className="text-sm" style={{ color: 'var(--muted-foreground)', padding: '14px 16px 14px 0', whiteSpace: 'nowrap' }}>{rec.revokedBy}</td>
                      <td className="t-caption" style={{ color: 'var(--muted-foreground)', padding: '14px 16px 14px 0', whiteSpace: 'nowrap' }}>{rec.revocationDate}</td>
                      <td style={{ padding: '14px 16px 14px 0', maxWidth: 220 }}>
                        <p className="text-sm" style={{ color: 'var(--muted-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={rec.reason}>{rec.reason}</p>
                      </td>
                      <td style={{ padding: '14px 16px 14px 0' }}>
                        <span className="t-label px-1.5 py-0.5" style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)', whiteSpace: 'nowrap' }}>{rec.status}</span>
                      </td>
                      <td style={{ padding: '14px 0' }}>
                        <div className="flex items-center gap-1.5">
                          {rec.status !== 'Reinstated' && (
                            <button onClick={() => setReinstateTarget(rec)}
                              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-150"
                              style={{ backgroundColor: 'rgba(32,244,78,0.08)', color: '#16A34A', border: '1px solid rgba(32,244,78,0.3)', cursor: 'pointer' }}
                              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8' }}
                              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}>
                              Reinstate
                            </button>
                          )}
                          <Link to="/ict/revocation-detail" search={{ id: rec.id }}>
                            <button
                              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors duration-150"
                              style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: 'pointer' }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card)' }}>
                              View
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <PaginationBar page={page} totalPages={totalPages} perPage={perPage} setPage={setPage} setPerPage={(n) => { setPerPage(n); setPage(1) }} total={filtered.length} />
        </div>
      </div>

      {/* Reinstate AlertDialog */}
      <AlertDialog open={!!reinstateTarget} onOpenChange={(o) => { if (!o) { setReinstateTarget(null); setReinstateNotes('') } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: 'var(--font-display)' }}>Reinstate access for {reinstateTarget?.userName}?</AlertDialogTitle>
            <AlertDialogDescription>They will be able to sign in immediately after reinstatement.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 pb-2">
            <label className="t-label mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>Notes (optional)</label>
            <textarea value={reinstateNotes} onChange={(e) => setReinstateNotes(e.target.value)} rows={3}
              placeholder="Add reinstatement notes…" className="w-full text-sm outline-none resize-none"
              style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px', color: 'var(--foreground)', backgroundColor: 'var(--card)', lineHeight: 1.5 }} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReinstate} style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}>Reinstate access</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke new user Sheet */}
      <Sheet open={revokeSheetOpen} onOpenChange={setRevokeSheetOpen}>
        <SheetContent side="right" className="p-0 overflow-y-auto" style={{ width: 'min(540px, 100vw)' }}>
          <SheetHeader className="px-8 py-6" style={{ borderBottom: '1px solid var(--border)' }}>
            <SheetTitle style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Revoke User Access</SheetTitle>
          </SheetHeader>
          <div className="px-8 py-6 flex flex-col gap-5">

            <div className="flex flex-col gap-1.5">
              <label className="t-label" style={{ color: 'var(--muted-foreground)' }}>USER</label>
              <select value={revokeForm.userId} onChange={(e) => setRevokeForm((f) => ({ ...f, userId: e.target.value }))}
                style={{ fontSize: '0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px', color: 'var(--foreground)', backgroundColor: 'var(--card)' }}>
                <option value="">Select a user…</option>
                {PLATFORM_USERS.filter(u => u.status === 'Active').map((u) => (
                  <option key={u.id} value={u.id}>{u.fullName} ({u.role})</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="t-label" style={{ color: 'var(--muted-foreground)' }}>REASON (REQUIRED)</label>
              <textarea value={revokeForm.reason} onChange={(e) => setRevokeForm((f) => ({ ...f, reason: e.target.value }))}
                rows={4} placeholder="Provide a mandatory reason for access revocation…"
                className="w-full text-sm outline-none resize-none"
                style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px', color: 'var(--foreground)', backgroundColor: 'var(--card)', lineHeight: 1.5 }} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="t-label" style={{ color: 'var(--muted-foreground)' }}>REVOCATION TYPE</label>
              <div className="flex gap-3">
                {(['Temporary', 'Permanent'] as const).map((t) => (
                  <button key={t} onClick={() => setRevokeForm((f) => ({ ...f, type: t }))}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                    style={{ border: revokeForm.type === t ? '2px solid var(--brand)' : '1px solid var(--border)', backgroundColor: revokeForm.type === t ? 'rgba(32,244,78,0.08)' : 'var(--card)', color: 'var(--foreground)', cursor: 'pointer' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {revokeForm.type === 'Temporary' && (
              <div className="flex flex-col gap-1.5">
                <label className="t-label" style={{ color: 'var(--muted-foreground)' }}>END DATE</label>
                <input type="date" value={revokeForm.endDate} onChange={(e) => setRevokeForm((f) => ({ ...f, endDate: e.target.value }))}
                  style={{ fontSize: '0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px', color: 'var(--foreground)', backgroundColor: 'var(--card)' }} />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={handleRevoke} disabled={!revokeForm.userId || !revokeForm.reason}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity duration-150"
                style={{ backgroundColor: 'var(--error)', color: '#fff', border: 'none', cursor: 'pointer', opacity: revokeForm.userId && revokeForm.reason ? 1 : 0.5 }}
                onMouseEnter={(e) => { if (revokeForm.userId && revokeForm.reason) e.currentTarget.style.opacity = '0.9' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = revokeForm.userId && revokeForm.reason ? '1' : '0.5' }}>
                Revoke access
              </button>
              <button onClick={() => setRevokeSheetOpen(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150"
                style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card)' }}>
                Cancel
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

    </AppShell>
  )
}
