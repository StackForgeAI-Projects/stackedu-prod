import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { RefreshCw, ArrowRight, X, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { StatTile } from '@/components/StatTile'
import { Button } from '@/components/ui/button'
import {
  Sheet, SheetContent,
} from '@/components/ui/sheet'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import {
  BURSAR, BURSAR_NAV,
  PENDING_RECONCILIATION, RESOLVED_RECONCILIATION,
  methodColors, gatewayColors, statusColors,
  type PendingReconciliation, type ResolvedReconciliation, type ResolutionType,
} from '@/data/bursar'
import { toast } from 'sonner'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/bursar/reconciliation')({
  component: ReconciliationPage,
})

// ─────────────────────────────────────────────────────────────────────────────

function ReconciliationPage() {
  const [pending, setPending]             = useState(PENDING_RECONCILIATION)
  const [resolved, setResolved]           = useState(RESOLVED_RECONCILIATION)
  const [syncing, setSyncing]             = useState(false)
  const [dateFilter, setDateFilter]       = useState('')
  const [selectedTxn, setSelectedTxn]     = useState<PendingReconciliation | null>(null)
  const [escalateTarget, setEscalate]     = useState<PendingReconciliation | null>(null)
  const [escalateReason, setEscalateReason] = useState('')
  const [pendingPage, setPendingPage]     = useState(1)
  const [pendingPageSize, setPendingPageSize] = useState(10)
  const [resolvedPage, setResolvedPage]   = useState(1)
  const [resolvedPageSize, setResolvedPageSize] = useState(10)

  const filtered = useMemo(() =>
    pending.filter((t) => !dateFilter || t.dateTime.includes(dateFilter)),
    [pending, dateFilter]
  )
  const pendingTotalPages  = Math.max(1, Math.ceil(filtered.length / pendingPageSize))
  const paginatedPending   = filtered.slice((pendingPage - 1) * pendingPageSize, pendingPage * pendingPageSize)
  const resolvedTotalPages = Math.max(1, Math.ceil(resolved.length / resolvedPageSize))
  const paginatedResolved  = resolved.slice((resolvedPage - 1) * resolvedPageSize, resolvedPage * resolvedPageSize)

  const totalPendingAmount = pending.reduce((s, t) => s + t.amount, 0)

  const handleSync = async () => {
    setSyncing(true)
    await new Promise((r) => setTimeout(r, 1800))
    setSyncing(false)
    toast.success('Gateway sync complete. 3 new transactions found.')
  }

  const handleReconcile = (txnId: string, resolution: ResolutionType, notes: string) => {
    const txn = pending.find((t) => t.txnId === txnId)
    if (!txn) return
    setPending((prev) => prev.filter((t) => t.txnId !== txnId))
    setResolved((prev) => [
      {
        id: Date.now(),
        txnId: txn.txnId,
        studentId: txn.studentId,
        studentName: txn.studentName,
        amount: txn.amount,
        resolution,
        resolvedBy: BURSAR.fullName,
        resolvedAt: 'Just now',
      },
      ...prev,
    ])
    toast.success(`Transaction ${txn.txnId} reconciled as "${resolution}".`)
    setSelectedTxn(null)
  }

  const handleEscalate = () => {
    if (!escalateTarget || !escalateReason.trim()) {
      toast.error('Please provide a reason for escalation.')
      return
    }
    setPending((prev) => prev.filter((t) => t.txnId !== escalateTarget.txnId))
    toast.error(`Transaction ${escalateTarget.txnId} escalated to ICT Manager.`)
    setEscalate(null)
    setEscalateReason('')
  }

  return (
    <AppShell
      navItems={BURSAR_NAV}
      pageTitle="Reconciliation"
      userName={BURSAR.fullName}
      userRole="Bursar"
      userInitials={BURSAR.initials}
      unreadCount={2}
      infoCardLabel="BURSAR"
      infoCardValue={BURSAR.institution}
      infoCardSubtext="Finance Office"
    >
      <div className="overflow-y-auto" style={{ height: 'calc(100vh - var(--header-height))' }}>
        <div className="animate-fade-up" style={{ padding: '32px 32px 48px' }}>

          {/* Section header */}
          <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
            <div>
              <h1
                className="t-h1"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}
              >
                Payment Reconciliation
              </h1>
              <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
                Review and resolve pending and failed gateway transactions
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="text-sm rounded-lg px-3 py-2 outline-none"
                style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', fontSize: '0.8125rem' }}
              />
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150"
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                  cursor: syncing ? 'not-allowed' : 'pointer',
                  opacity: syncing ? 0.7 : 1,
                }}
                onMouseEnter={(e) => { if (!syncing) e.currentTarget.style.backgroundColor = 'var(--muted)' }}
                onMouseLeave={(e) => { if (!syncing) e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <RefreshCw
                  style={{ width: 15, height: 15, animation: syncing ? 'spin 1s linear infinite' : 'none' }}
                />
                {syncing ? 'Syncing…' : 'Sync gateway'}
              </button>
            </div>
          </div>

          {/* Summary StatTiles */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <StatTile
              icon={AlertCircle}
              iconColor="var(--warning)" iconBg="var(--warning-bg)"
              label="PENDING RECONCILIATION"
              value={String(pending.length)}
              delta="Transactions awaiting action"
              deltaColor="var(--warning)"
              animationDelay={0}
            />
            <StatTile
              icon={AlertCircle}
              iconColor="var(--error)" iconBg="var(--error-bg)"
              label="TOTAL PENDING AMOUNT"
              value={formatCurrency(totalPendingAmount)}
              delta="Sum of unreconciled transactions"
              deltaColor="var(--error)"
              animationDelay={60}
            />
            <StatTile
              icon={Clock}
              iconColor="var(--muted-foreground)" iconBg="var(--muted)"
              label="LAST SYNC"
              value="Today"
              delta="22 Jan 2025 · 15:47"
              deltaColor="var(--muted-foreground)"
              animationDelay={120}
            />
          </div>

          {/* Pending transactions table */}
          <div className="mb-8">
            <h2
              className="t-h3 mb-4"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
            >
              Pending Reconciliation
            </h2>

            <div
              style={{
                backgroundColor: 'var(--card)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden',
              }}
            >
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center py-16 gap-3">
                  <CheckCircle style={{ width: 40, height: 40, color: 'var(--success)' }} />
                  <h3 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
                    All clear
                  </h3>
                  <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
                    No pending transactions to reconcile.
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        {['Transaction ID', 'Student', 'Student ID', 'Amount', 'Method', 'Gateway Status', 'System Status', 'Date & Time', 'Actions'].map((h) => (
                          <th
                            key={h}
                            className="t-label text-left"
                            style={{ color: 'var(--muted-foreground)', padding: '12px 16px', fontWeight: 600, whiteSpace: 'nowrap' }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedPending.map((txn, i) => {
                        const mc  = methodColors(txn.method)
                        const gc  = gatewayColors(txn.gatewayStatus)
                        const sc  = statusColors(txn.systemStatus)
                        return (
                          <tr
                            key={txn.id}
                            style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--muted)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <td style={{ padding: '14px 16px' }}>
                              <span className="t-mono" style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>{txn.txnId}</span>
                            </td>
                            <td className="text-sm" style={{ color: 'var(--foreground)', padding: '14px 16px', fontWeight: 500, whiteSpace: 'nowrap' }}>
                              {txn.studentName}
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <span className="t-mono" style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>{txn.studentId}</span>
                            </td>
                            <td className="text-sm" style={{ color: 'var(--foreground)', padding: '14px 16px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                              {formatCurrency(txn.amount)}
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <span className="t-label px-2 py-0.5" style={{ backgroundColor: mc.bg, color: mc.color, borderRadius: 'var(--radius-sm)', whiteSpace: 'nowrap', fontSize: 10 }}>
                                {txn.method}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <span className="t-label px-2 py-0.5" style={{ backgroundColor: gc.bg, color: gc.color, borderRadius: 'var(--radius-sm)' }}>
                                {txn.gatewayStatus}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <span className="t-label px-2 py-0.5" style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)' }}>
                                {txn.systemStatus}
                              </span>
                            </td>
                            <td className="t-caption" style={{ color: 'var(--muted-foreground)', padding: '14px 16px', whiteSpace: 'nowrap' }}>
                              {txn.dateTime}
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => setSelectedTxn(txn)}
                                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-150"
                                  style={{
                                    border: '1px solid var(--brand)',
                                    color: 'var(--brand)',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(32,244,78,0.08)' }}
                                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                                >
                                  Reconcile
                                </button>
                                <button
                                  onClick={() => { setEscalate(txn); setEscalateReason('') }}
                                  className="text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all duration-150"
                                  style={{
                                    border: '1px solid var(--border)',
                                    color: 'var(--muted-foreground)',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)'; e.currentTarget.style.color = 'var(--foreground)' }}
                                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--muted-foreground)' }}
                                >
                                  Escalate
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {/* Pending pagination */}
              {filtered.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2">
                    <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>Show</span>
                    <Select value={String(pendingPageSize)} onValueChange={(v) => { setPendingPageSize(Number(v)); setPendingPage(1) }}>
                      <SelectTrigger className="h-8 w-16 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>per page</span>
                    <span className="t-caption" style={{ color: 'var(--muted-foreground)', marginLeft: 12 }}>
                      {`${(pendingPage - 1) * pendingPageSize + 1}–${Math.min(pendingPage * pendingPageSize, filtered.length)}`} of {filtered.length} entries
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPendingPage((p) => p - 1)} disabled={pendingPage === 1}>Previous</Button>
                    <span className="t-caption px-1" style={{ color: 'var(--muted-foreground)' }}>{pendingPage} / {pendingTotalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setPendingPage((p) => p + 1)} disabled={pendingPage >= pendingTotalPages}>Next</Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Resolved section */}
          {resolved.length > 0 && (
            <div>
              <h2
                className="t-h3 mb-4"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
              >
                Recently Resolved
              </h2>
              <div
                style={{
                  backgroundColor: 'var(--card)',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                  overflow: 'hidden',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Transaction ID', 'Student', 'Amount', 'Resolution', 'Resolved By', 'Resolved At'].map((h) => (
                        <th
                          key={h}
                          className="t-label text-left"
                          style={{ color: 'var(--muted-foreground)', padding: '12px 16px', fontWeight: 600, whiteSpace: 'nowrap' }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedResolved.map((txn, i) => {
                      const resColor =
                        txn.resolution === 'Mark as Paid'   ? { bg: 'var(--success-bg)', color: 'var(--success)' }  :
                        txn.resolution === 'Mark as Failed' ? { bg: 'var(--error-bg)',   color: 'var(--error)'   }  :
                        { bg: 'var(--warning-bg)', color: 'var(--warning)' }
                      return (
                        <tr
                          key={txn.id}
                          style={{ borderBottom: i < paginatedResolved.length - 1 ? '1px solid var(--border)' : 'none' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--muted)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <td style={{ padding: '14px 16px' }}>
                            <span className="t-mono" style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>{txn.txnId}</span>
                          </td>
                          <td className="text-sm" style={{ color: 'var(--foreground)', padding: '14px 16px', fontWeight: 500 }}>
                            {txn.studentName}
                          </td>
                          <td className="text-sm" style={{ color: 'var(--foreground)', padding: '14px 16px', fontWeight: 600 }}>
                            {formatCurrency(txn.amount)}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span className="t-label px-2 py-0.5" style={{ backgroundColor: resColor.bg, color: resColor.color, borderRadius: 'var(--radius-sm)', whiteSpace: 'nowrap' }}>
                              {txn.resolution}
                            </span>
                          </td>
                          <td className="text-sm" style={{ color: 'var(--muted-foreground)', padding: '14px 16px' }}>
                            {txn.resolvedBy}
                          </td>
                          <td className="t-caption" style={{ color: 'var(--muted-foreground)', padding: '14px 16px' }}>
                            {txn.resolvedAt}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {/* Resolved pagination */}
                <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2">
                    <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>Show</span>
                    <Select value={String(resolvedPageSize)} onValueChange={(v) => { setResolvedPageSize(Number(v)); setResolvedPage(1) }}>
                      <SelectTrigger className="h-8 w-16 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>per page</span>
                    <span className="t-caption" style={{ color: 'var(--muted-foreground)', marginLeft: 12 }}>
                      {`${(resolvedPage - 1) * resolvedPageSize + 1}–${Math.min(resolvedPage * resolvedPageSize, resolved.length)}`} of {resolved.length} entries
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setResolvedPage((p) => p - 1)} disabled={resolvedPage === 1}>Previous</Button>
                    <span className="t-caption px-1" style={{ color: 'var(--muted-foreground)' }}>{resolvedPage} / {resolvedTotalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setResolvedPage((p) => p + 1)} disabled={resolvedPage >= resolvedTotalPages}>Next</Button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Reconcile Sheet */}
      <Sheet open={!!selectedTxn} onOpenChange={(o) => !o && setSelectedTxn(null)}>
        <SheetContent className="overflow-y-auto" style={{ width: 'min(860px, 55vw)', padding: 0 }}>
          {selectedTxn && (
            <ReconcileSheet
              txn={selectedTxn}
              onClose={() => setSelectedTxn(null)}
              onConfirm={handleReconcile}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Escalate AlertDialog */}
      <AlertDialog open={!!escalateTarget} onOpenChange={(o) => !o && setEscalate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Escalate to ICT Manager?</AlertDialogTitle>
            <AlertDialogDescription>
              Transaction <strong>{escalateTarget?.txnId}</strong> will be flagged and escalated
              to the ICT Manager for investigation. Please provide a reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-1 pb-2">
            <textarea
              placeholder="Reason for escalation…"
              value={escalateReason}
              onChange={(e) => setEscalateReason(e.target.value)}
              rows={3}
              className="w-full text-sm rounded-xl px-3 py-2.5 outline-none resize-none"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEscalateReason('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEscalate}
              style={{ backgroundColor: 'var(--error)', color: '#fff' }}
            >
              Escalate to ICT Manager
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  )
}

// ── Reconcile Sheet ───────────────────────────────────────────────────────────

function ReconcileSheet({
  txn,
  onClose,
  onConfirm,
}: {
  txn: PendingReconciliation
  onClose: () => void
  onConfirm: (txnId: string, resolution: ResolutionType, notes: string) => void
}) {
  const [resolution, setResolution] = useState<ResolutionType>('Mark as Paid')
  const [notes, setNotes]           = useState(txn.notes ?? '')

  const mc  = methodColors(txn.method)
  const gc  = gatewayColors(txn.gatewayStatus)
  const sc  = statusColors(txn.systemStatus)

  const rows = [
    { label: 'Transaction ID', value: txn.txnId,       mono: true  },
    { label: 'Student Name',   value: txn.studentName, mono: false },
    { label: 'Student ID',     value: txn.studentId,   mono: true  },
    { label: 'Amount',         value: formatCurrency(txn.amount), mono: false },
    { label: 'Payment Method', value: txn.method,      mono: false },
    { label: 'Date & Time',    value: txn.dateTime,    mono: false },
  ]

  return (
    <div style={{ padding: '28px 28px 40px' }}>
      <div className="flex items-center justify-between mb-6">
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.375rem',
            fontWeight: 700,
            color: 'var(--foreground)',
            letterSpacing: '-0.015em',
          }}
        >
          Reconcile Transaction
        </h2>
        <button onClick={onClose} style={{ color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <X style={{ width: 18, height: 18 }} />
        </button>
      </div>

      {/* Data rows */}
      <div
        style={{
          backgroundColor: 'var(--card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          marginBottom: 24,
        }}
      >
        {rows.map((row, i) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-4 px-4 py-3"
            style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none' }}
          >
            <span className="t-caption" style={{ color: 'var(--muted-foreground)', flexShrink: 0 }}>{row.label}</span>
            {row.mono ? (
              <span className="t-mono" style={{ color: 'var(--foreground)', textAlign: 'right' }}>{row.value}</span>
            ) : (
              <span className="text-sm font-medium" style={{ color: 'var(--foreground)', textAlign: 'right' }}>{row.value}</span>
            )}
          </div>
        ))}
      </div>

      {/* Status comparison */}
      <div className="mb-6">
        <p className="t-label mb-3" style={{ color: 'var(--muted-foreground)' }}>STATUS COMPARISON</p>
        <div
          className="flex items-center gap-4 p-4 rounded-xl"
          style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}
        >
          <div className="flex-1">
            <p className="t-caption mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Gateway Status</p>
            <span
              className="t-label px-2.5 py-1.5"
              style={{ backgroundColor: gc.bg, color: gc.color, borderRadius: 'var(--radius-sm)' }}
            >
              {txn.gatewayStatus}
            </span>
          </div>
          <ArrowRight style={{ width: 18, height: 18, color: 'var(--muted-foreground)', flexShrink: 0 }} />
          <div className="flex-1">
            <p className="t-caption mb-1.5" style={{ color: 'var(--muted-foreground)' }}>System Status</p>
            <span
              className="t-label px-2.5 py-1.5"
              style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)' }}
            >
              {txn.systemStatus}
            </span>
          </div>
        </div>
        {txn.notes && (
          <p className="t-caption mt-2" style={{ color: 'var(--warning)' }}>
            Note: {txn.notes}
          </p>
        )}
      </div>

      {/* Resolution selector */}
      <div className="mb-5">
        <label className="t-label block mb-2" style={{ color: 'var(--muted-foreground)' }}>Resolution</label>
        <Select value={resolution} onValueChange={(v) => setResolution(v as ResolutionType)}>
          <SelectTrigger className="w-full text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Mark as Paid">Mark as Paid</SelectItem>
            <SelectItem value="Mark as Failed">Mark as Failed</SelectItem>
            <SelectItem value="Request Refund">Request Refund</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notes */}
      <div className="mb-6">
        <label className="t-label block mb-2" style={{ color: 'var(--muted-foreground)' }}>Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add reconciliation notes…"
          rows={3}
          className="w-full text-sm rounded-xl px-3 py-2.5 outline-none resize-none"
          style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => onConfirm(txn.txnId, resolution, notes)}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
          style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
        >
          Confirm reconciliation
        </button>
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium"
          style={{ backgroundColor: 'transparent', color: 'var(--foreground)', border: '1px solid var(--border)', cursor: 'pointer' }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
