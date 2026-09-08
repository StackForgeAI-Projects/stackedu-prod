import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import type { BursarPaymentRow } from '@stackedu/shared'
import { CheckCircle, CreditCard, Download, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { BursarShell } from '@/components/BursarShell'
import { PortalErrorPanel } from '@/components/PortalErrorPanel'
import { DataTable } from '@/components/DataTable'
import { StatTile } from '@/components/StatTile'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { bursarPaymentsQueryKey, bursarProfileQueryKey, getBursarProfile, listBursarPayments } from '@/lib/api/bursar'
import { downloadReceiptDocument } from '@/lib/receipt-download'
import { IconActionButton } from '@/components/IconActionButton'
import { BURSAR_GUIDES } from '@/lib/bursar-guides'
import {
  accountStatusColors,
  paymentMethodColors,
  paymentMethodLabel,
  paymentStatusLabel,
  uiMethodToApi,
  uiStatusToApi,
} from '@/lib/bursar-display'

export const Route = createFileRoute('/_auth/bursar/ledger')({
  component: LedgerPage,
})

function LedgerPage() {
  const [methodFilter, setMethodFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selectedTxn, setSelectedTxn] = useState<BursarPaymentRow | null>(null)

  const filters = useMemo(() => ({
    method: methodFilter !== 'all' ? uiMethodToApi(methodFilter) : undefined,
    status: statusFilter !== 'all' ? uiStatusToApi(statusFilter) : undefined,
    from: fromDate || undefined,
    to: toDate || undefined,
  }), [methodFilter, statusFilter, fromDate, toDate])

  const { data: payments = [], isPending, error, refetch } = useQuery({
    queryKey: bursarPaymentsQueryKey(filters),
    queryFn: () => listBursarPayments(filters),
  })

  const paidCount = payments.filter((t) => t.status === 'Completed').length
  const totalAmount = payments.filter((t) => t.status === 'Completed').reduce((s, t) => s + t.amount, 0)
  const successRate = payments.length > 0 ? Math.round((paidCount / payments.length) * 100) : 0

  return (
    <BursarShell pageTitle="Payment Ledger" guide={BURSAR_GUIDES.ledger}>
      <div className="page-scroll">
        <div className="page-body animate-fade-up">
          <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
            <div>
              <h1 className="t-h1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>
                Payment Ledger
              </h1>
              <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
                All transactions across all students and payment channels
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="t-caption" style={{ color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>From</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="text-sm rounded-lg px-3 py-2 outline-none"
                  style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', fontSize: '0.8125rem' }}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="t-caption" style={{ color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>To</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="text-sm rounded-lg px-3 py-2 outline-none"
                  style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', fontSize: '0.8125rem' }}
                />
              </div>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-36 text-sm h-9"><SelectValue placeholder="Method" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="MTN MoMo">MTN MoMo</SelectItem>
                  <SelectItem value="Airtel Money">Airtel Money</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 text-sm h-9"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.success('Export started. CSV will download shortly.')}>
                <Download style={{ width: 14, height: 14 }} />
                Export CSV
              </Button>
            </div>
          </div>

          {isPending ? (
            <p className="t-body py-8" style={{ color: 'var(--muted-foreground)' }}>Loading transactions…</p>
          ) : error ? (
            <PortalErrorPanel error={error} onRetry={() => refetch()} />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <StatTile
                  icon={CreditCard}
                  iconColor="var(--brand)" iconBg="rgba(15, 189, 59,0.08)"
                  label="TOTAL TRANSACTIONS"
                  value={String(payments.length)}
                  delta={`${payments.length} matching filters`}
                  deltaColor="var(--muted-foreground)"
                  animationDelay={0}
                />
                <StatTile
                  icon={TrendingUp}
                  iconColor="var(--success)" iconBg="var(--success-bg)"
                  label="TOTAL AMOUNT (PAID)"
                  value={formatCurrency(totalAmount)}
                  delta="Successful transactions only"
                  deltaColor="var(--muted-foreground)"
                  animationDelay={60}
                />
                <StatTile
                  icon={CheckCircle}
                  iconColor="var(--info)" iconBg="var(--info-bg)"
                  label="SUCCESS RATE"
                  value={`${successRate}%`}
                  delta={`${paidCount} of ${payments.length} transactions`}
                  deltaColor="var(--muted-foreground)"
                  animationDelay={120}
                />
              </div>

              <DataTable
                rows={payments}
                rowKey={(txn) => txn.id}
                searchPlaceholder="Search transactions…"
                empty="No transactions match the selected filters."
                defaultPageSize={10}
                onRowClick={(txn) => setSelectedTxn(txn)}
                columns={[
                  {
                    id: 'txnId',
                    header: 'Transaction ID',
                    value: (txn) => txn.reference,
                    cell: (txn) => <span className="t-mono" style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>{txn.reference}</span>,
                  },
                  {
                    id: 'studentName',
                    header: 'Student Name',
                    value: (txn) => txn.studentName,
                    sortable: true,
                    cell: (txn) => <span className="text-sm font-medium whitespace-nowrap" style={{ color: 'var(--foreground)' }}>{txn.studentName}</span>,
                  },
                  {
                    id: 'studentId',
                    header: 'Student ID',
                    value: (txn) => txn.studentNumber,
                    cell: (txn) => <span className="t-mono" style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>{txn.studentNumber}</span>,
                  },
                  {
                    id: 'date',
                    header: 'Date & Time',
                    value: (txn) => txn.paidAt ?? txn.createdAt,
                    sortable: true,
                    cell: (txn) => (
                      <span className="t-caption whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>
                        {formatDateTime(txn.paidAt ?? txn.createdAt)}
                      </span>
                    ),
                  },
                  {
                    id: 'description',
                    header: 'Description',
                    value: (txn) => txn.description,
                    cell: (txn) => <span className="text-sm truncate block" style={{ color: 'var(--muted-foreground)', maxWidth: 200 }}>{txn.description}</span>,
                  },
                  {
                    id: 'amount',
                    header: 'Amount',
                    value: (txn) => txn.amount,
                    sortable: true,
                    className: 'text-right',
                    cell: (txn) => <span className="text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--foreground)' }}>{formatCurrency(txn.amount)}</span>,
                  },
                  {
                    id: 'method',
                    header: 'Method',
                    value: (txn) => paymentMethodLabel(txn.method),
                    cell: (txn) => {
                      const mc = paymentMethodColors(txn.method)
                      return <span className="t-label px-2 py-0.5" style={{ backgroundColor: mc.bg, color: mc.color, borderRadius: 'var(--radius-sm)', whiteSpace: 'nowrap' }}>{paymentMethodLabel(txn.method)}</span>
                    },
                  },
                  {
                    id: 'status',
                    header: 'Status',
                    value: (txn) => paymentStatusLabel(txn.status),
                    sortable: true,
                    cell: (txn) => {
                      const sc = accountStatusColors(txn.status)
                      return <span className="t-label px-2 py-0.5" style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)' }}>{paymentStatusLabel(txn.status)}</span>
                    },
                  },
                ]}
              />
            </>
          )}
        </div>
      </div>

      <Sheet open={!!selectedTxn} onOpenChange={(o) => !o && setSelectedTxn(null)}>
        <SheetContent className="overflow-y-auto sheet-lg" style={{ padding: 0 }}>
          {selectedTxn ? <TransactionSheet txn={selectedTxn} onClose={() => setSelectedTxn(null)} /> : null}
        </SheetContent>
      </Sheet>
    </BursarShell>
  )
}

function TransactionSheet({ txn, onClose }: { txn: BursarPaymentRow; onClose: () => void }) {
  const { data: profile } = useQuery({
    queryKey: bursarProfileQueryKey,
    queryFn: getBursarProfile,
  })
  const mc = paymentMethodColors(txn.method)
  const sc = accountStatusColors(txn.status)

  const handleDownload = async () => {
    if (!txn.receiptNumber || !profile) return
    try {
      await downloadReceiptDocument({
        receiptNumber: txn.receiptNumber,
        reference: txn.reference,
        amount: txn.amount,
        method: txn.method,
        paidAt: txn.paidAt,
        studentName: txn.studentName,
        studentNumber: txn.studentNumber,
        description: txn.description,
        institutionName: profile.institutionName,
        verificationCode: txn.verificationCode,
        status: txn.status === 'Voided' ? 'Voided' : 'Valid',
      })
      toast.success(`Receipt ${txn.receiptNumber} downloaded.`)
    } catch {
      toast.error('Could not download receipt.')
    }
  }

  const rows = [
    { label: 'Transaction ID', value: txn.reference, mono: true },
    { label: 'Student Name', value: txn.studentName, mono: false },
    { label: 'Student ID', value: txn.studentNumber, mono: true },
    { label: 'Date & Time', value: formatDateTime(txn.paidAt ?? txn.createdAt), mono: false },
    { label: 'Description', value: txn.description, mono: false },
    { label: 'Payment Method', value: paymentMethodLabel(txn.method), mono: false },
    { label: 'Gateway Reference', value: txn.gatewayReference ?? '—', mono: true },
    ...(txn.receiptNumber ? [{ label: 'Receipt Number', value: txn.receiptNumber, mono: true }] : []),
  ]

  return (
    <div style={{ padding: '28px 28px 40px' }}>
      <div className="mb-6">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.015em', marginBottom: 6 }}>
          Transaction Detail
        </h2>
        <span className="t-mono" style={{ color: 'var(--muted-foreground)', fontSize: 13 }}>{txn.reference}</span>
      </div>

      <div className="flex items-center justify-between p-4 mb-6" style={{ backgroundColor: 'var(--muted)', borderRadius: 'var(--radius-lg)' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.015em' }}>
          {formatCurrency(txn.amount)}
        </span>
        <div className="flex items-center gap-2">
          <span className="t-label px-2.5 py-1" style={{ backgroundColor: mc.bg, color: mc.color, borderRadius: 'var(--radius-sm)' }}>{paymentMethodLabel(txn.method)}</span>
          <span className="t-label px-2.5 py-1" style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)' }}>{paymentStatusLabel(txn.status)}</span>
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 24 }}>
        {rows.map((row, i) => (
          <div key={row.label} className="flex items-center justify-between gap-4 px-4 py-3.5" style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <span className="t-caption" style={{ color: 'var(--muted-foreground)', flexShrink: 0 }}>{row.label}</span>
            {row.mono ? (
              <span className="t-mono" style={{ color: 'var(--foreground)', textAlign: 'right' }}>{row.value}</span>
            ) : (
              <span className="text-sm font-medium" style={{ color: 'var(--foreground)', textAlign: 'right' }}>{row.value}</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {txn.receiptNumber ? (
          <IconActionButton
            label="Download receipt"
            icon={Download}
            onClick={() => void handleDownload()}
            disabled={!profile}
            className="self-start"
            style={{ width: 42, height: 42 }}
          />
        ) : null}
      </div>
    </div>
  )
}
