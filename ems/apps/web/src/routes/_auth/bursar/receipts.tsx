import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import type { BursarReceiptRow, BursarStudentAccountRow } from '@stackedu/shared'
import { Download, Receipt as ReceiptIcon, Search, X, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { BursarShell } from '@/components/BursarShell'
import { PortalErrorPanel } from '@/components/PortalErrorPanel'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { IconActionButton } from '@/components/IconActionButton'
import { DataTable } from '@/components/DataTable'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import { accountStatusColors, paymentMethodColors, paymentMethodLabel } from '@/lib/bursar-display'
import { downloadReceiptDocument } from '@/lib/receipt-download'
import {
  bursarReceiptsQueryKey,
  bursarStudentAccountsQueryKey,
  listBursarReceipts,
  listBursarStudentAccounts,
  voidBursarReceipt,
} from '@/lib/api/bursar'
import { apiErrorMessage } from '@/lib/api/client'
import { BURSAR_GUIDES } from '@/lib/bursar-guides'

export const Route = createFileRoute('/_auth/bursar/receipts')({
  component: ReceiptsPage,
})

function ReceiptsPage() {
  const queryClient = useQueryClient()
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [issueSheetOpen, setIssueOpen] = useState(false)
  const [voidTarget, setVoidTarget] = useState<BursarReceiptRow | null>(null)
  const [voidReason, setVoidReason] = useState('')

  const filters = useMemo(() => ({
    from: fromDate || undefined,
    to: toDate || undefined,
  }), [fromDate, toDate])

  const { data: receipts = [], isPending, error, refetch } = useQuery({
    queryKey: bursarReceiptsQueryKey(filters),
    queryFn: () => listBursarReceipts(filters),
  })

  const handleDownload = async (receipt: BursarReceiptRow) => {
    try {
      await downloadReceiptDocument({
        receiptNumber: receipt.receiptNumber,
        reference: receipt.reference,
        amount: receipt.amount,
        method: receipt.method,
        paidAt: receipt.paidAt,
        studentName: receipt.studentName,
        studentNumber: receipt.studentNumber,
        description: receipt.description,
        institutionName: receipt.institutionName,
        verificationCode: receipt.verificationCode,
        status: receipt.status,
      })
      toast.success(`Receipt ${receipt.receiptNumber} downloaded.`)
    } catch {
      toast.error('Could not download receipt.')
    }
  }

  const voidMutation = useMutation({
    mutationFn: () => {
      if (!voidTarget || !voidReason.trim()) throw new Error('Please provide a reason for voiding this receipt.')
      return voidBursarReceipt(voidTarget.id, voidReason.trim())
    },
    onSuccess: async (receipt) => {
      toast.success(`Receipt ${receipt.receiptNumber} has been voided and recorded in the audit log.`)
      setVoidTarget(null)
      setVoidReason('')
      await queryClient.invalidateQueries({ queryKey: ['bursar', 'receipts'] })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not void receipt.')),
  })

  return (
    <BursarShell pageTitle="Receipts" guide={BURSAR_GUIDES.receipts}>
      <div className="page-scroll">
        <div className="page-body animate-fade-up">
          <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
            <div>
              <h1 className="t-h1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>
                Receipts
              </h1>
              <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
                Issue, reprint, and void payment receipts
              </p>
            </div>
            <button
              onClick={() => setIssueOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150"
              style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}
            >
              <ReceiptIcon style={{ width: 15, height: 15 }} />
              Issue receipt
            </button>
          </div>

          {isPending ? (
            <p className="t-body py-8" style={{ color: 'var(--muted-foreground)' }}>Loading receipts…</p>
          ) : error ? (
            <PortalErrorPanel error={error} onRetry={() => refetch()} />
          ) : (
            <DataTable
              rows={receipts}
              rowKey={(receipt) => receipt.id}
              searchPlaceholder="Search by name, ID or receipt no…"
              searchFilter={(r, query) =>
                r.studentName.toLowerCase().includes(query)
                || r.receiptNumber.toLowerCase().includes(query)
                || r.studentNumber.toLowerCase().includes(query)
              }
              empty="No receipts found."
              defaultPageSize={10}
              toolbar={
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="t-caption" style={{ color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>From</label>
                  <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="text-sm rounded-lg px-3 py-2 outline-none" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', fontSize: '0.8125rem' }} />
                  <label className="t-caption" style={{ color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>To</label>
                  <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="text-sm rounded-lg px-3 py-2 outline-none" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', fontSize: '0.8125rem' }} />
                </div>
              }
              columns={[
                {
                  id: 'receiptNo',
                  header: 'Receipt No.',
                  value: (receipt) => receipt.receiptNumber,
                  cell: (receipt) => (
                    <span className="t-mono" style={{ color: 'var(--muted-foreground)', fontSize: 12, textDecoration: receipt.status === 'Voided' ? 'line-through' : 'none' }}>
                      {receipt.receiptNumber}
                    </span>
                  ),
                },
                {
                  id: 'studentName',
                  header: 'Student Name',
                  value: (receipt) => receipt.studentName,
                  cell: (receipt) => (
                    <span className="text-sm font-medium whitespace-nowrap" style={{ color: 'var(--foreground)', textDecoration: receipt.status === 'Voided' ? 'line-through' : 'none' }}>
                      {receipt.studentName}
                    </span>
                  ),
                },
                {
                  id: 'studentId',
                  header: 'Student ID',
                  value: (receipt) => receipt.studentNumber,
                  cell: (receipt) => <span className="t-mono" style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>{receipt.studentNumber}</span>,
                },
                {
                  id: 'issueDate',
                  header: 'Issue Date',
                  value: (receipt) => receipt.issueDate ?? '',
                  cell: (receipt) => (
                    <span className="t-caption whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>
                      {receipt.issueDate ? formatDateShort(receipt.issueDate) : '—'}
                    </span>
                  ),
                },
                {
                  id: 'description',
                  header: 'Description',
                  value: (receipt) => receipt.description,
                  cell: (receipt) => <span className="text-sm truncate block" style={{ color: 'var(--muted-foreground)', maxWidth: 180 }}>{receipt.description}</span>,
                },
                {
                  id: 'amount',
                  header: 'Amount',
                  value: (receipt) => receipt.amount,
                  cell: (receipt) => <span className="text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--foreground)' }}>{formatCurrency(receipt.amount)}</span>,
                },
                {
                  id: 'method',
                  header: 'Method',
                  value: (receipt) => paymentMethodLabel(receipt.method),
                  cell: (receipt) => {
                    const mc = paymentMethodColors(receipt.method)
                    return <span className="t-label px-2 py-0.5" style={{ backgroundColor: mc.bg, color: mc.color, borderRadius: 'var(--radius-sm)', whiteSpace: 'nowrap', fontSize: 10 }}>{paymentMethodLabel(receipt.method)}</span>
                  },
                },
                {
                  id: 'status',
                  header: 'Status',
                  value: (receipt) => receipt.status,
                  cell: (receipt) => {
                    const sc = accountStatusColors(receipt.status)
                    return <span className="t-label px-2 py-0.5" style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)' }}>{receipt.status}</span>
                  },
                },
                {
                  id: 'actions',
                  header: 'Actions',
                  cell: (receipt) => {
                    const isVoided = receipt.status === 'Voided'
                    return (
                      <div className="flex items-center gap-1.5" style={{ opacity: isVoided ? 0.65 : 1 }}>
                        <IconActionButton
                          label="Download receipt"
                          icon={Download}
                          onClick={() => void handleDownload(receipt)}
                        />
                        {!isVoided ? (
                          <IconActionButton
                            label="Void receipt"
                            icon={XCircle}
                            danger
                            onClick={() => { setVoidTarget(receipt); setVoidReason('') }}
                          />
                        ) : null}
                      </div>
                    )
                  },
                },
              ]}
            />
          )}
        </div>
      </div>

      <Sheet open={issueSheetOpen} onOpenChange={setIssueOpen}>
        <SheetContent className="overflow-y-auto sheet-lg" style={{ padding: 0 }}>
          <IssueReceiptSheet onClose={() => setIssueOpen(false)} />
        </SheetContent>
      </Sheet>

      <ConfirmAlertDialog
        open={!!voidTarget}
        onOpenChange={(open) => !open && setVoidTarget(null)}
        title={`Void Receipt ${voidTarget?.receiptNumber}?`}
        tone="destructive"
        headlineLabel="Action"
        headline="Void receipt"
        summary="This cannot be undone and will be recorded in the audit log."
        notices={[
          { icon: 'file', label: 'Please provide a clear reason for the audit trail.' },
          { icon: 'shield', label: 'This action is permanently logged for compliance.' },
        ]}
        confirmLabel="Void receipt"
        confirmVariant="destructive"
        onCancel={() => setVoidReason('')}
        onConfirm={() => voidMutation.mutate()}
      >
        <textarea
          placeholder="Reason for voiding this receipt…"
          value={voidReason}
          onChange={(e) => setVoidReason(e.target.value)}
          rows={3}
          className="w-full text-sm rounded-xl px-3 py-2.5 outline-none resize-none"
          style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}
        />
      </ConfirmAlertDialog>
    </BursarShell>
  )
}

function IssueReceiptSheet({ onClose }: { onClose: () => void }) {
  const { data: students = [] } = useQuery({
    queryKey: bursarStudentAccountsQueryKey,
    queryFn: listBursarStudentAccounts,
  })
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<BursarStudentAccountRow | null>(null)

  const matchedStudents = students.filter(
    (s) =>
      studentSearch.length >= 2
      && (s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.studentNumber.toLowerCase().includes(studentSearch.toLowerCase())),
  )

  const handleIssue = () => {
    if (!selectedStudent) {
      toast.error('Please select a student.')
      return
    }
    toast.info('Receipts are generated automatically when payments are recorded. Use Record manual payment on the student account.')
    onClose()
  }

  return (
    <div style={{ padding: '28px 28px 40px' }}>
      <div className="mb-6">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.015em' }}>
          Issue Receipt
        </h2>
      </div>

      <div className="flex flex-col gap-5">
        <div>
          <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Student *</label>
          <div className="relative">
            <div className="flex items-center gap-2 rounded-xl px-3 h-10" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}>
              <Search style={{ width: 14, height: 14, color: 'var(--muted-foreground)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search by name or student ID…"
                value={selectedStudent ? selectedStudent.name : studentSearch}
                onChange={(e) => { setStudentSearch(e.target.value); setSelectedStudent(null) }}
                className="flex-1 text-sm bg-transparent outline-none"
                style={{ color: 'var(--foreground)' }}
              />
              {selectedStudent ? (
                <button onClick={() => { setSelectedStudent(null); setStudentSearch('') }} style={{ color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                  <X style={{ width: 13, height: 13 }} />
                </button>
              ) : null}
            </div>
            {matchedStudents.length > 0 && !selectedStudent ? (
              <div className="absolute z-10 w-full mt-1 rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
                {matchedStudents.map((s) => (
                  <button
                    key={s.studentId}
                    onClick={() => { setSelectedStudent(s); setStudentSearch('') }}
                    className="w-full text-left px-4 py-2.5"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                  >
                    <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{s.name}</p>
                    <p className="t-mono" style={{ color: 'var(--muted-foreground)', fontSize: 11 }}>{s.studentNumber}</p>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <p className="t-caption" style={{ color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
          Receipts are issued automatically when a payment is completed. Record a payment on the student account to generate a receipt.
        </p>

        <div className="flex gap-3 pt-2">
          <button onClick={handleIssue} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold" style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}>
            <ReceiptIcon style={{ width: 15, height: 15 }} />
            Go to student account
          </button>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ backgroundColor: 'transparent', color: 'var(--foreground)', border: '1px solid var(--border)', cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
