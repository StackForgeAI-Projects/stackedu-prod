import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import type { BursarReconciliationRow, ResolveBursarReconciliationRequest } from '@stackedu/shared'
import { AlertCircle, ArrowRight, CheckCircle, Clock, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { BursarShell } from '@/components/BursarShell'
import { PortalErrorPanel } from '@/components/PortalErrorPanel'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { DataTable } from '@/components/DataTable'
import { StatTile } from '@/components/StatTile'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { bursarReconciliationQueryKey, listBursarReconciliation, resolveBursarReconciliation } from '@/lib/api/bursar'
import { apiErrorMessage } from '@/lib/api/client'
import { BURSAR_GUIDES } from '@/lib/bursar-guides'

export const Route = createFileRoute('/_auth/bursar/reconciliation')({
  component: ReconciliationPage,
})

type UiResolution = 'Mark as Paid' | 'Mark as Failed' | 'Request Refund'

const UI_RESOLUTIONS: UiResolution[] = ['Mark as Paid', 'Mark as Failed', 'Request Refund']

function uiResolutionToApi(value: UiResolution): ResolveBursarReconciliationRequest['resolution'] {
  switch (value) {
    case 'Mark as Paid': return 'Matched'
    case 'Mark as Failed': return 'Written Off'
    case 'Request Refund': return 'Disputed'
  }
}

function apiResolutionToUi(value: string): UiResolution {
  switch (value) {
    case 'Matched': return 'Mark as Paid'
    case 'Written Off':
    case 'Written Off': return 'Mark as Failed'
    case 'Disputed': return 'Request Refund'
    default: return 'Mark as Paid'
  }
}

function reconciliationStatusColors(status: string) {
  switch (status) {
    case 'Pending': return { bg: 'var(--warning-bg)', color: 'var(--warning)' }
    case 'Matched': return { bg: 'var(--success-bg)', color: 'var(--success)' }
    case 'Disputed': return { bg: 'var(--warning-bg)', color: 'var(--warning)' }
    case 'Written Off':
    case 'Written Off': return { bg: 'var(--error-bg)', color: 'var(--error)' }
    default: return { bg: 'var(--muted)', color: 'var(--muted-foreground)' }
  }
}

function ReconciliationPage() {
  const queryClient = useQueryClient()
  const [syncing, setSyncing] = useState(false)
  const [dateFilter, setDateFilter] = useState('')
  const [selectedTxn, setSelectedTxn] = useState<BursarReconciliationRow | null>(null)
  const [escalateTarget, setEscalate] = useState<BursarReconciliationRow | null>(null)
  const [escalateReason, setEscalateReason] = useState('')

  const { data, isPending, error, refetch } = useQuery({
    queryKey: bursarReconciliationQueryKey,
    queryFn: listBursarReconciliation,
  })

  const pending = data?.pending ?? []
  const resolved = data?.resolved ?? []

  const filtered = useMemo(
    () => pending.filter((t) => !dateFilter || (t.transactionDate && String(t.transactionDate).startsWith(dateFilter))),
    [pending, dateFilter],
  )

  const totalPendingAmount = pending.reduce((s, t) => s + t.amount, 0)

  const resolveMutation = useMutation({
    mutationFn: ({ recordId, resolution, notes }: { recordId: string; resolution: UiResolution; notes: string }) =>
      resolveBursarReconciliation(recordId, {
        resolution: uiResolutionToApi(resolution),
        notes: notes.trim() || undefined,
      }),
    onSuccess: async (_record, vars) => {
      toast.success(`Transaction reconciled as "${vars.resolution}".`)
      setSelectedTxn(null)
      await queryClient.invalidateQueries({ queryKey: bursarReconciliationQueryKey })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not reconcile transaction.')),
  })

  const handleSync = async () => {
    setSyncing(true)
    await new Promise((r) => setTimeout(r, 1800))
    setSyncing(false)
    toast.success('Gateway sync complete.')
    await queryClient.invalidateQueries({ queryKey: bursarReconciliationQueryKey })
  }

  const handleEscalate = () => {
    if (!escalateTarget || !escalateReason.trim()) {
      toast.error('Please provide a reason for escalation.')
      return
    }
    toast.error(`Transaction ${escalateTarget.externalReference} escalated to ICT Manager.`)
    setEscalate(null)
    setEscalateReason('')
  }

  return (
    <BursarShell pageTitle="Reconciliation" guide={BURSAR_GUIDES.reconciliation}>
      <div className="page-scroll">
        <div className="page-body animate-fade-up">
          <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
            <div>
              <h1 className="t-h1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>
                Payment Reconciliation
              </h1>
              <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
                Review and resolve pending and failed gateway transactions
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="text-sm rounded-lg px-3 py-2 outline-none" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', fontSize: '0.8125rem' }} />
              <button onClick={handleSync} disabled={syncing} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium" style={{ backgroundColor: 'transparent', color: 'var(--foreground)', border: '1px solid var(--border)', cursor: syncing ? 'not-allowed' : 'pointer', opacity: syncing ? 0.7 : 1 }}>
                <RefreshCw style={{ width: 15, height: 15, animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
                {syncing ? 'Syncing…' : 'Sync gateway'}
              </button>
            </div>
          </div>

          {isPending ? (
            <p className="t-body py-8" style={{ color: 'var(--muted-foreground)' }}>Loading reconciliation records…</p>
          ) : error ? (
            <PortalErrorPanel error={error} onRetry={() => refetch()} />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <StatTile icon={AlertCircle} iconColor="var(--warning)" iconBg="var(--warning-bg)" label="PENDING RECONCILIATION" value={String(pending.length)} delta="Transactions awaiting action" deltaColor="var(--warning)" animationDelay={0} />
                <StatTile icon={AlertCircle} iconColor="var(--error)" iconBg="var(--error-bg)" label="TOTAL PENDING AMOUNT" value={formatCurrency(totalPendingAmount)} delta="Sum of unreconciled transactions" deltaColor="var(--error)" animationDelay={60} />
                <StatTile icon={Clock} iconColor="var(--muted-foreground)" iconBg="var(--muted)" label="RESOLVED RECENTLY" value={String(resolved.length)} delta="Recently reconciled" deltaColor="var(--muted-foreground)" animationDelay={120} />
              </div>

              <div className="mb-8">
                <h2 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
                  Pending Reconciliation
                </h2>

                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center py-16 gap-3" style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                    <CheckCircle style={{ width: 40, height: 40, color: 'var(--success)' }} />
                    <h3 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>All clear</h3>
                    <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>No pending transactions to reconcile.</p>
                  </div>
                ) : (
                  <DataTable
                    rows={filtered}
                    rowKey={(txn) => txn.id}
                    searchPlaceholder="Search pending transactions…"
                    empty="No pending transactions to reconcile."
                    defaultPageSize={10}
                    columns={[
                      { id: 'txnId', header: 'Transaction ID', value: (txn) => txn.externalReference, cell: (txn) => <span className="t-mono" style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>{txn.externalReference}</span> },
                      { id: 'student', header: 'Student', value: (txn) => txn.studentName ?? txn.payerName ?? '', cell: (txn) => <span className="text-sm font-medium whitespace-nowrap" style={{ color: 'var(--foreground)' }}>{txn.studentName ?? txn.payerName ?? '—'}</span> },
                      { id: 'studentId', header: 'Student ID', value: (txn) => txn.studentNumber ?? '', cell: (txn) => <span className="t-mono" style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>{txn.studentNumber ?? '—'}</span> },
                      { id: 'amount', header: 'Amount', value: (txn) => txn.amount, cell: (txn) => <span className="text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--foreground)' }}>{formatCurrency(txn.amount)}</span> },
                      { id: 'source', header: 'Source', value: (txn) => txn.source, cell: (txn) => <span className="t-label px-2 py-0.5" style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', borderRadius: 'var(--radius-sm)', whiteSpace: 'nowrap', fontSize: 10 }}>{txn.source}</span> },
                      {
                        id: 'status',
                        header: 'Status',
                        value: (txn) => txn.status,
                        cell: (txn) => {
                          const sc = reconciliationStatusColors(txn.status)
                          return <span className="t-label px-2 py-0.5" style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)' }}>{txn.status}</span>
                        },
                      },
                      { id: 'date', header: 'Date & Time', value: (txn) => txn.transactionDate, cell: (txn) => <span className="t-caption whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>{formatDateTime(txn.transactionDate)}</span> },
                      {
                        id: 'actions',
                        header: 'Actions',
                        cell: (txn) => (
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => setSelectedTxn(txn)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg" style={{ border: '1px solid var(--brand)', color: 'var(--brand)', background: 'transparent', cursor: 'pointer' }}>
                              Reconcile
                            </button>
                            <button onClick={() => { setEscalate(txn); setEscalateReason('') }} className="text-xs font-medium px-2.5 py-1.5 rounded-lg" style={{ border: '1px solid var(--border)', color: 'var(--muted-foreground)', background: 'transparent', cursor: 'pointer' }}>
                              Escalate
                            </button>
                          </div>
                        ),
                      },
                    ]}
                  />
                )}
              </div>

              {resolved.length > 0 ? (
                <div>
                  <h2 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
                    Recently Resolved
                  </h2>
                  <DataTable
                    rows={resolved}
                    rowKey={(txn) => txn.id}
                    searchPlaceholder="Search resolved transactions…"
                    empty="No resolved transactions."
                    defaultPageSize={10}
                    columns={[
                      { id: 'txnId', header: 'Transaction ID', value: (txn) => txn.externalReference, cell: (txn) => <span className="t-mono" style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>{txn.externalReference}</span> },
                      { id: 'student', header: 'Student', value: (txn) => txn.studentName ?? '', cell: (txn) => <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{txn.studentName ?? '—'}</span> },
                      { id: 'amount', header: 'Amount', value: (txn) => txn.amount, cell: (txn) => <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{formatCurrency(txn.amount)}</span> },
                      {
                        id: 'resolution',
                        header: 'Resolution',
                        value: (txn) => apiResolutionToUi(txn.status),
                        cell: (txn) => {
                          const label = apiResolutionToUi(txn.status)
                          const resColor =
                            label === 'Mark as Paid' ? { bg: 'var(--success-bg)', color: 'var(--success)' }
                            : label === 'Mark as Failed' ? { bg: 'var(--error-bg)', color: 'var(--error)' }
                            : { bg: 'var(--warning-bg)', color: 'var(--warning)' }
                          return <span className="t-label px-2 py-0.5" style={{ backgroundColor: resColor.bg, color: resColor.color, borderRadius: 'var(--radius-sm)', whiteSpace: 'nowrap' }}>{label}</span>
                        },
                      },
                      { id: 'notes', header: 'Notes', value: (txn) => txn.notes ?? '', cell: (txn) => <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{txn.notes ?? '—'}</span> },
                      { id: 'date', header: 'Transaction Date', value: (txn) => txn.transactionDate, cell: (txn) => <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{formatDateTime(txn.transactionDate)}</span> },
                    ]}
                  />
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      <Sheet open={!!selectedTxn} onOpenChange={(o) => !o && setSelectedTxn(null)}>
        <SheetContent className="overflow-y-auto sheet-lg" style={{ padding: 0 }}>
          {selectedTxn ? (
            <ReconcileSheet
              txn={selectedTxn}
              onClose={() => setSelectedTxn(null)}
              onConfirm={(resolution, notes) => resolveMutation.mutate({ recordId: selectedTxn.id, resolution, notes })}
              isPending={resolveMutation.isPending}
            />
          ) : null}
        </SheetContent>
      </Sheet>

      <ConfirmAlertDialog
        open={!!escalateTarget}
        onOpenChange={(open) => !open && setEscalate(null)}
        title="Escalate to ICT Manager?"
        tone="destructive"
        headlineLabel="Action"
        headline="Escalate transaction"
        summary={`Transaction ${escalateTarget?.externalReference} will be flagged and escalated to the ICT Manager for investigation.`}
        notices={[
          { icon: 'shield', label: 'ICT will investigate the mismatch or payment issue.' },
          { icon: 'file', label: 'Your reason will be saved with the escalation record.' },
        ]}
        confirmLabel="Escalate to ICT Manager"
        confirmVariant="destructive"
        onCancel={() => setEscalateReason('')}
        onConfirm={handleEscalate}
      >
        <textarea placeholder="Reason for escalation…" value={escalateReason} onChange={(e) => setEscalateReason(e.target.value)} rows={3} className="w-full text-sm rounded-xl px-3 py-2.5 outline-none resize-none" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)' }} />
      </ConfirmAlertDialog>
    </BursarShell>
  )
}

function ReconcileSheet({
  txn,
  onClose,
  onConfirm,
  isPending,
}: {
  txn: BursarReconciliationRow
  onClose: () => void
  onConfirm: (resolution: UiResolution, notes: string) => void
  isPending: boolean
}) {
  const [resolution, setResolution] = useState<UiResolution>('Mark as Paid')
  const [notes, setNotes] = useState(txn.notes ?? '')

  const sc = reconciliationStatusColors(txn.status)

  const rows = [
    { label: 'Transaction ID', value: txn.externalReference, mono: true },
    { label: 'Student Name', value: txn.studentName ?? txn.payerName ?? '—', mono: false },
    { label: 'Student ID', value: txn.studentNumber ?? '—', mono: true },
    { label: 'Amount', value: formatCurrency(txn.amount), mono: false },
    { label: 'Source', value: txn.source, mono: false },
    { label: 'Date & Time', value: formatDateTime(txn.transactionDate), mono: false },
  ]

  return (
    <div style={{ padding: '28px 28px 40px' }}>
      <div className="mb-6">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.015em' }}>
          Reconcile Transaction
        </h2>
      </div>

      <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 24 }}>
        {rows.map((row, i) => (
          <div key={row.label} className="flex items-center justify-between gap-4 px-4 py-3" style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <span className="t-caption" style={{ color: 'var(--muted-foreground)', flexShrink: 0 }}>{row.label}</span>
            {row.mono ? (
              <span className="t-mono" style={{ color: 'var(--foreground)', textAlign: 'right' }}>{row.value}</span>
            ) : (
              <span className="text-sm font-medium" style={{ color: 'var(--foreground)', textAlign: 'right' }}>{row.value}</span>
            )}
          </div>
        ))}
      </div>

      <div className="mb-6">
        <p className="t-label mb-3" style={{ color: 'var(--muted-foreground)' }}>CURRENT STATUS</p>
        <div className="flex items-center gap-4 p-4 rounded-xl" style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}>
          <span className="t-label px-2.5 py-1.5" style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)' }}>{txn.status}</span>
          {txn.narration ? (
            <>
              <ArrowRight style={{ width: 18, height: 18, color: 'var(--muted-foreground)', flexShrink: 0 }} />
              <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{txn.narration}</span>
            </>
          ) : null}
        </div>
      </div>

      <div className="mb-5">
        <label className="t-label block mb-2" style={{ color: 'var(--muted-foreground)' }}>Resolution</label>
        <Select value={resolution} onValueChange={(v) => setResolution(v as UiResolution)}>
          <SelectTrigger className="w-full text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            {UI_RESOLUTIONS.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-6">
        <label className="t-label block mb-2" style={{ color: 'var(--muted-foreground)' }}>Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add reconciliation notes…" rows={3} className="w-full text-sm rounded-xl px-3 py-2.5 outline-none resize-none" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)' }} />
      </div>

      <div className="flex gap-3">
        <button onClick={() => onConfirm(resolution, notes)} disabled={isPending} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.7 : 1 }}>
          Confirm reconciliation
        </button>
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ backgroundColor: 'transparent', color: 'var(--foreground)', border: '1px solid var(--border)', cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}
