import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { AppShell } from '@/components/AppShell'
import {
  ICT_MANAGER, ICT_NAV, REVOCATIONS,
  roleBadgeColors, revocationStatusColors,
  type RevocationStatus,
} from '@/data/ict'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/ict/revocation-detail')({
  component: RevocationDetailPage,
  validateSearch: (search: Record<string, unknown>) => ({
    id: String(search.id ?? ''),
  }),
})

// ─────────────────────────────────────────────────────────────────────────────

function RevocationDetailPage() {
  const { id } = Route.useSearch()
  const record = REVOCATIONS.find((r) => r.id === id)

  const [status, setStatus]             = useState<RevocationStatus>(record?.status ?? 'Active Hold')
  const [reinstatedDate, setReinstatedDate] = useState(record?.reinstatedDate)
  const [reinstatedBy, setReinstatedBy]     = useState(record?.reinstatedBy)
  const [reinstateOpen, setReinstateOpen]   = useState(false)
  const [reinstateNotes, setReinstateNotes] = useState('')

  if (!record) {
    return (
      <AppShell
        navItems={ICT_NAV}
        pageTitle="Access Revocation"
        userName={ICT_MANAGER.fullName}
        userRole={ICT_MANAGER.role}
        userInitials={ICT_MANAGER.initials}
        infoCardLabel="ICT MANAGER"
        infoCardValue={ICT_MANAGER.institution}
        infoCardSubtext={ICT_MANAGER.office}
      >
        <div className="p-8">
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Revocation record not found.</p>
          <Link to="/ict/revocation" className="text-sm font-medium mt-4 inline-block" style={{ color: 'var(--success)' }}>
            ← Back to Access Revocation
          </Link>
        </div>
      </AppShell>
    )
  }

  const rc = roleBadgeColors(record.role)
  const sc = revocationStatusColors(status)

  const handleReinstate = () => {
    const today = new Date().toISOString().split('T')[0]
    setStatus('Reinstated')
    setReinstatedDate(today)
    setReinstatedBy(ICT_MANAGER.fullName)
    setReinstateOpen(false)
    setReinstateNotes('')
    toast.success(`Access reinstated for ${record.userName}.`)
  }

  const detailRows = [
    { label: 'User Name',       value: record.userName                 },
    { label: 'User ID',         value: record.userId,     mono: true   },
    { label: 'Revoked By',      value: record.revokedBy                },
    { label: 'Revocation Date', value: record.revocationDate           },
    { label: 'Type',            value: record.type                     },
    ...(record.endDate ? [{ label: 'End Date', value: record.endDate, mono: false }] : []),
    ...(reinstatedDate ? [{ label: 'Reinstated Date', value: reinstatedDate, mono: false }] : []),
    ...(reinstatedBy   ? [{ label: 'Reinstated By',   value: reinstatedBy,   mono: false }] : []),
  ]

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

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 mb-6">
          <Link to="/ict/dashboard" className="t-caption font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--success)' }}>
            ICT Manager
          </Link>
          <ChevronRight style={{ width: 12, height: 12, color: 'var(--muted-foreground)' }} />
          <Link to="/ict/revocation" className="t-caption font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--success)' }}>
            Access Revocation
          </Link>
          <ChevronRight style={{ width: 12, height: 12, color: 'var(--muted-foreground)' }} />
          <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{record.userName}</span>
        </div>

        {/* Page header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>
              {record.userName}
            </h1>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{record.userId}</p>
          </div>
          <Link to="/ict/revocation">
            <button
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150"
              style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card)' }}>
              <ArrowLeft style={{ width: 15, height: 15 }} />
              Access Revocation
            </button>
          </Link>
        </div>

        {/* Two-column layout */}
        <div className="flex gap-6" style={{ alignItems: 'flex-start' }}>

          {/* ── Main (65%) ─────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-5" style={{ flex: '0 0 65%', minWidth: 0 }}>

            {/* Record details card */}
            <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24 }}>
              <h2 className="t-h3 mb-5" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Revocation Record</h2>
              <div className="grid grid-cols-2 gap-0">
                {detailRows.map((row, i, arr) => (
                  <div key={row.label} className="flex flex-col gap-0.5 py-3"
                    style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', paddingRight: 16 }}>
                    <span className="t-label" style={{ color: 'var(--muted-foreground)' }}>{row.label.toUpperCase()}</span>
                    <span style={{
                      fontFamily: (row as any).mono ? 'var(--font-mono)' : undefined,
                      fontSize: '0.875rem', color: 'var(--foreground)', fontWeight: 500,
                    }}>
                      {row.value}
                    </span>
                  </div>
                ))}
                <div className="flex flex-col gap-0.5 py-3 col-span-2" style={{ paddingRight: 16 }}>
                  <span className="t-label mb-1.5" style={{ color: 'var(--muted-foreground)' }}>STATUS</span>
                  <span className="t-label px-2 py-0.5 inline-flex w-fit"
                    style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)' }}>
                    {status}
                  </span>
                </div>
              </div>
            </div>

            {/* Reason card */}
            <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24 }}>
              <h2 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Reason for Revocation</h2>
              <p className="t-body" style={{ color: 'var(--foreground)', lineHeight: 1.7 }}>{record.reason}</p>
            </div>

          </div>

          {/* ── Sidebar (35%) ──────────────────────────────────────────────── */}
          <div className="flex flex-col gap-4" style={{ flex: '0 0 calc(35% - 24px)', minWidth: 0 }}>

            {/* Status & role */}
            <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 20 }}>
              <h3 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '0.9375rem' }}>Account Info</h3>
              <div className="flex flex-col gap-4">
                <div>
                  <p className="t-label mb-1.5" style={{ color: 'var(--muted-foreground)' }}>ROLE</p>
                  <span className="t-label px-2 py-0.5 inline-flex"
                    style={{ backgroundColor: rc.bg, color: rc.color, borderRadius: 'var(--radius-sm)' }}>
                    {record.role}
                  </span>
                </div>
                <div>
                  <p className="t-label mb-1.5" style={{ color: 'var(--muted-foreground)' }}>HOLD STATUS</p>
                  <span className="t-label px-2 py-0.5 inline-flex"
                    style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)' }}>
                    {status}
                  </span>
                </div>
                <div>
                  <p className="t-label mb-1.5" style={{ color: 'var(--muted-foreground)' }}>REVOCATION TYPE</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{record.type}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 20 }}>
              <h3 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '0.9375rem' }}>Actions</h3>
              <div className="flex flex-col gap-2.5">
                {status !== 'Reinstated' ? (
                  <button
                    onClick={() => setReinstateOpen(true)}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold transition-opacity duration-150"
                    style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}>
                    Reinstate access
                  </button>
                ) : (
                  <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', textAlign: 'center', fontWeight: 500 }}>
                    Access reinstated
                  </div>
                )}
                <Link to="/ict/users">
                  <button
                    className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors duration-150"
                    style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: 'pointer' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card)' }}>
                    View in User Management
                  </button>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Reinstate AlertDialog */}
      <AlertDialog open={reinstateOpen} onOpenChange={(o) => { if (!o) { setReinstateOpen(false); setReinstateNotes('') } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: 'var(--font-display)' }}>
              Reinstate access for {record.userName}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              They will be able to sign in immediately after reinstatement. This action is recorded in the audit log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 pb-2">
            <label className="t-label mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>Notes (optional)</label>
            <textarea
              value={reinstateNotes}
              onChange={(e) => setReinstateNotes(e.target.value)}
              rows={3}
              placeholder="Add reinstatement notes…"
              className="w-full text-sm outline-none resize-none"
              style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px', color: 'var(--foreground)', backgroundColor: 'var(--card)', lineHeight: 1.5 }}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReinstate} style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}>
              Reinstate access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </AppShell>
  )
}
