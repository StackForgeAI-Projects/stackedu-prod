import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { BursarStudentAccountDetail, PaymentMethod } from '@stackedu/shared'
import {
  AlertCircle, ChevronLeft, CreditCard, Download, Lock, Receipt, Unlock,
} from 'lucide-react'
import { toast } from 'sonner'
import { BursarShell } from '@/components/BursarShell'
import { PortalErrorPanel } from '@/components/PortalErrorPanel'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { FormInfoBox } from '@/components/FormInfoBox'
import { formInfo } from '@/lib/form-info-copy'
import { DataTable } from '@/components/DataTable'
import { IconActionButton } from '@/components/IconActionButton'
import { StatTile } from '@/components/StatTile'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import {
  accountStatusColors,
  paymentMethodColors,
  paymentMethodLabel,
  paymentStatusLabel,
  uiMethodToApi,
} from '@/lib/bursar-display'
import {
  bursarDashboardQueryKey,
  bursarProfileQueryKey,
  bursarStudentAccountQueryKey,
  bursarStudentAccountsQueryKey,
  getBursarProfile,
  getBursarStudentAccount,
  recordBursarManualPayment,
  releaseBursarFeeHold,
  setBursarFeeHold,
} from '@/lib/api/bursar'
import { apiErrorMessage } from '@/lib/api/client'
import { downloadReceiptDocument } from '@/lib/receipt-download'
import { BURSAR_GUIDES } from '@/lib/bursar-guides'

export const Route = createFileRoute('/_auth/bursar/student-account')({
  validateSearch: (search: Record<string, unknown>) => ({
    id: (search.id as string) ?? '',
  }),
  component: StudentAccountPage,
})

const PAYMENT_METHOD_OPTIONS = [
  { label: 'MTN MoMo', value: 'MTN MoMo' },
  { label: 'Airtel Money', value: 'Airtel Money' },
  { label: 'Card', value: 'Card' },
  { label: 'Bank Transfer', value: 'Bank Transfer' },
] as const

function StudentAccountPage() {
  const { id } = Route.useSearch()
  const { data, isPending, error, refetch } = useQuery({
    queryKey: bursarStudentAccountQueryKey(id),
    queryFn: () => getBursarStudentAccount(id),
    enabled: Boolean(id),
  })

  if (!id) {
    return (
      <BursarShell pageTitle="Student Account" guide={BURSAR_GUIDES.studentAccount}>
        <StudentNotFound />
      </BursarShell>
    )
  }

  if (isPending) {
    return (
      <BursarShell pageTitle="Student Account" guide={BURSAR_GUIDES.studentAccount}>
        <p className="t-body px-4 sm:px-8 py-8" style={{ color: 'var(--muted-foreground)' }}>Loading student account…</p>
      </BursarShell>
    )
  }

  if (error || !data) {
    return (
      <BursarShell pageTitle="Student Account" guide={BURSAR_GUIDES.studentAccount}>
        {error ? (
          <PortalErrorPanel error={error} onRetry={() => refetch()} />
        ) : (
          <StudentNotFound />
        )}
      </BursarShell>
    )
  }

  return <StudentAccountInner account={data} studentId={id} />
}

function StudentNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <AlertCircle style={{ width: 40, height: 40, color: 'var(--muted-foreground)' }} />
      <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Student not found.</p>
      <Link to="/bursar/student-accounts" style={{ color: 'var(--success)', fontSize: '0.875rem', fontWeight: 600 }}>
        ← Back to Student Accounts
      </Link>
    </div>
  )
}

function StudentAccountInner({ account, studentId }: { account: BursarStudentAccountDetail; studentId: string }) {
  const queryClient = useQueryClient()
  const { data: profile } = useQuery({
    queryKey: bursarProfileQueryKey,
    queryFn: getBursarProfile,
  })
  const [manualSheetOpen, setManualSheetOpen] = useState(false)
  const [holdDialogOpen, setHoldDialogOpen] = useState(false)
  const [holdReason, setHoldReason] = useState('')

  const handleReceiptDownload = async (pmt: BursarStudentAccountDetail['payments'][number]) => {
    if (!pmt.receiptNumber || !profile) return
    try {
      await downloadReceiptDocument({
        receiptNumber: pmt.receiptNumber,
        reference: pmt.reference,
        amount: pmt.amount,
        method: pmt.method,
        paidAt: pmt.paidAt,
        studentName: account.name,
        studentNumber: account.studentNumber,
        description: pmt.description,
        institutionName: profile.institutionName,
        verificationCode: pmt.verificationCode,
        status: pmt.status === 'Voided' ? 'Voided' : 'Valid',
      })
      toast.success(`Receipt ${pmt.receiptNumber} downloaded.`)
    } catch {
      toast.error('Could not download receipt.')
    }
  }

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: bursarStudentAccountQueryKey(studentId) })
    await queryClient.invalidateQueries({ queryKey: bursarStudentAccountsQueryKey })
    await queryClient.invalidateQueries({ queryKey: bursarDashboardQueryKey })
  }

  const holdMutation = useMutation({
    mutationFn: async (reason: string) => {
      if (account.hasHold) return releaseBursarFeeHold(studentId, reason)
      return setBursarFeeHold(studentId, { reason })
    },
    onSuccess: async () => {
      toast.success(account.hasHold ? `Fee hold removed for ${account.name}.` : `Fee hold applied to ${account.name}.`)
      setHoldDialogOpen(false)
      setHoldReason('')
      await invalidate()
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not update fee hold.')),
  })

  return (
    <BursarShell pageTitle={account.name} guide={BURSAR_GUIDES.studentAccount}>
      <div className="page-scroll">
        <div className="page-body animate-fade-up">
          <nav className="flex items-center gap-1.5 mb-6 t-caption" style={{ color: 'var(--muted-foreground)' }}>
            <Link to="/bursar/student-accounts" className="flex items-center gap-1 hover:underline" style={{ color: 'var(--muted-foreground)' }}>
              <ChevronLeft style={{ width: 12, height: 12 }} />
              Student Accounts
            </Link>
            <span style={{ color: 'var(--border)' }}>›</span>
            <span style={{ color: 'var(--foreground)' }}>{account.name}</span>
          </nav>

          <div className="mb-6">
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>
              {account.name}
            </h1>
            <div className="flex items-center gap-3">
              <span className="t-mono" style={{ color: 'var(--muted-foreground)', fontSize: 13 }}>{account.studentNumber}</span>
              <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
                · {account.programme} · Year {account.yearOfStudy}
              </span>
            </div>
          </div>

          {account.hasHold ? (
            <div className="flex items-start gap-3 p-4 mb-6 rounded-xl animate-fade-up" style={{ backgroundColor: 'var(--error-bg)', border: '1px solid rgba(220,38,38,0.2)' }}>
              <AlertCircle style={{ width: 18, height: 18, color: 'var(--error)', flexShrink: 0, marginTop: 1 }} />
              <div>
                <p className="text-sm" style={{ color: 'var(--error)', lineHeight: 1.5 }}>
                  This student has an active fee hold. They cannot register for courses or view results.
                </p>
                {account.holdReason ? (
                  <p className="t-caption mt-1" style={{ color: 'var(--error)' }}>Reason: {account.holdReason}</p>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <StatTile
              icon={CreditCard}
              iconColor="var(--info)" iconBg="var(--info-bg)"
              label="TOTAL FEES"
              value={formatCurrency(account.totalCharged)}
              delta="This semester"
              deltaColor="var(--muted-foreground)"
              animationDelay={0}
            />
            <StatTile
              icon={Receipt}
              iconColor="var(--success)" iconBg="var(--success-bg)"
              label="AMOUNT PAID"
              value={formatCurrency(account.totalPaid)}
              delta="Confirmed payments"
              deltaColor="var(--success)"
              animationDelay={60}
            />
            <StatTile
              icon={AlertCircle}
              iconColor={account.outstanding > 0 ? 'var(--warning)' : 'var(--success)'}
              iconBg={account.outstanding > 0 ? 'var(--warning-bg)' : 'var(--success-bg)'}
              label="OUTSTANDING BALANCE"
              value={formatCurrency(account.outstanding)}
              delta={account.outstanding > 0 ? 'Balance remaining' : 'Fully paid'}
              deltaColor={account.outstanding > 0 ? 'var(--warning)' : 'var(--success)'}
              animationDelay={120}
            />
          </div>

          <div className="mb-6">
            <h2 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
              Payment History
            </h2>
            <DataTable
              rows={account.payments}
              rowKey={(pmt) => pmt.id}
              searchPlaceholder="Search payments…"
              empty="No payments recorded yet."
              defaultPageSize={10}
              columns={[
                {
                  id: 'date',
                  header: 'Date',
                  value: (pmt) => pmt.paidAt ?? '',
                  cell: (pmt) => (
                    <span className="t-caption whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>
                      {pmt.paidAt ? formatDateShort(pmt.paidAt) : '—'}
                    </span>
                  ),
                },
                {
                  id: 'description',
                  header: 'Description',
                  value: (pmt) => pmt.description,
                  cell: (pmt) => <span className="text-sm" style={{ color: 'var(--foreground)' }}>{pmt.description}</span>,
                },
                {
                  id: 'amount',
                  header: 'Amount',
                  value: (pmt) => pmt.amount,
                  cell: (pmt) => <span className="text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--foreground)' }}>{formatCurrency(pmt.amount)}</span>,
                },
                {
                  id: 'method',
                  header: 'Method',
                  value: (pmt) => paymentMethodLabel(pmt.method),
                  cell: (pmt) => {
                    const mc = paymentMethodColors(pmt.method)
                    return <span className="t-label px-2 py-0.5" style={{ backgroundColor: mc.bg, color: mc.color, borderRadius: 'var(--radius-sm)', whiteSpace: 'nowrap', fontSize: 10 }}>{paymentMethodLabel(pmt.method)}</span>
                  },
                },
                {
                  id: 'status',
                  header: 'Status',
                  value: (pmt) => paymentStatusLabel(pmt.status),
                  cell: (pmt) => {
                    const sc = accountStatusColors(pmt.status)
                    return <span className="t-label px-2 py-0.5" style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)' }}>{paymentStatusLabel(pmt.status)}</span>
                  },
                },
                {
                  id: 'receipt',
                  header: 'Receipt',
                  value: (pmt) => pmt.receiptNumber ?? '',
                  cell: (pmt) => pmt.receiptNumber ? (
                    <IconActionButton
                      label="Download receipt"
                      icon={Download}
                      onClick={() => void handleReceiptDownload(pmt)}
                      disabled={!profile}
                    />
                  ) : (
                    <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>—</span>
                  ),
                },
              ]}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => { setHoldReason(''); setHoldDialogOpen(true) }}
              disabled={holdMutation.isPending}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
              style={{
                backgroundColor: 'transparent',
                color: account.hasHold ? 'var(--success)' : 'var(--error)',
                border: `1px solid ${account.hasHold ? 'var(--success)' : 'var(--error)'}`,
                cursor: holdMutation.isPending ? 'not-allowed' : 'pointer',
                opacity: holdMutation.isPending ? 0.7 : 1,
              }}
            >
              {account.hasHold ? <Unlock style={{ width: 15, height: 15 }} /> : <Lock style={{ width: 15, height: 15 }} />}
              {account.hasHold ? 'Remove fee hold' : 'Apply fee hold'}
            </button>

            <button
              onClick={() => toast.info('Issue receipt from the Receipts page after a payment is recorded.')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
              style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}
            >
              <Receipt style={{ width: 15, height: 15 }} />
              Issue receipt
            </button>

            <button
              onClick={() => setManualSheetOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
              style={{ backgroundColor: 'transparent', color: 'var(--foreground)', border: '1px solid var(--border)', cursor: 'pointer' }}
            >
              <CreditCard style={{ width: 15, height: 15 }} />
              Record manual payment
            </button>
          </div>
        </div>
      </div>

      <Sheet open={manualSheetOpen} onOpenChange={setManualSheetOpen}>
        <SheetContent className="overflow-y-auto sheet-lg" style={{ padding: 0 }}>
          <ManualPaymentSheet
            account={account}
            studentId={studentId}
            onClose={() => setManualSheetOpen(false)}
            onSuccess={async () => {
              setManualSheetOpen(false)
              await invalidate()
            }}
          />
        </SheetContent>
      </Sheet>

      <ConfirmAlertDialog
        open={holdDialogOpen}
        onOpenChange={(open) => { if (!open) { setHoldDialogOpen(false); setHoldReason('') } }}
        title={account.hasHold ? `Remove fee hold for ${account.name}?` : `Apply fee hold to ${account.name}?`}
        tone={account.hasHold ? 'success' : 'destructive'}
        headlineLabel="Action"
        headline={account.hasHold ? 'Remove fee hold' : 'Apply fee hold'}
        summary={account.hasHold
          ? 'The student will regain access to registration and results once the hold is removed.'
          : 'The student will be blocked from registration and viewing results until the hold is lifted.'}
        notices={[
          { icon: 'shield', label: 'This action is logged in the audit trail.' },
          { icon: 'file', label: 'Provide a clear reason for compliance.' },
        ]}
        confirmLabel={account.hasHold ? 'Remove hold' : 'Apply hold'}
        confirmVariant={account.hasHold ? 'default' : 'destructive'}
        onCancel={() => setHoldReason('')}
        onConfirm={() => {
          if (!holdReason.trim()) {
            toast.error('Please provide a reason.')
            return
          }
          holdMutation.mutate(holdReason.trim())
        }}
      >
        <textarea
          placeholder={account.hasHold ? 'Reason for removing the hold…' : 'Reason for applying the hold…'}
          value={holdReason}
          onChange={(e) => setHoldReason(e.target.value)}
          rows={3}
          className="w-full text-sm rounded-xl px-3 py-2.5 outline-none resize-none"
          style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}
        />
      </ConfirmAlertDialog>
    </BursarShell>
  )
}

function ManualPaymentSheet({
  account,
  studentId,
  onClose,
  onSuccess,
}: {
  account: BursarStudentAccountDetail
  studentId: string
  onClose: () => void
  onSuccess: () => void | Promise<void>
}) {
  const queryClient = useQueryClient()
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [methodLabel, setMethodLabel] = useState<(typeof PAYMENT_METHOD_OPTIONS)[number]['value']>('Bank Transfer')
  const [notes, setNotes] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const mutation = useMutation({
    mutationFn: () => {
      const parsed = parseInt(amount, 10)
      const method = uiMethodToApi(methodLabel) as PaymentMethod
      if (!description.trim() || isNaN(parsed) || parsed <= 0 || !notes.trim() || !method) {
        throw new Error('Please fill in all required fields including notes.')
      }
      return recordBursarManualPayment(studentId, {
        amount: parsed,
        method,
        description: description.trim(),
        notes: notes.trim(),
      })
    },
    onSuccess: async () => {
      toast.success(`Manual payment of ${formatCurrency(parseInt(amount, 10))} recorded for ${account.name}.`)
      setConfirmOpen(false)
      await queryClient.invalidateQueries({ queryKey: bursarStudentAccountQueryKey(studentId) })
      await onSuccess()
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not record payment.')),
  })

  const handleRecord = () => {
    const parsed = parseInt(amount, 10)
    if (!description.trim() || isNaN(parsed) || parsed <= 0 || !notes.trim()) {
      toast.error('Please fill in all required fields including notes.')
      return
    }
    setConfirmOpen(true)
  }

  return (
    <>
      <div style={{ padding: '28px 28px 40px' }}>
        <div className="mb-6">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.015em' }}>
            Record Manual Payment
          </h2>
          <FormInfoBox lines={formInfo.recordManualPayment} />
        </div>

        <div className="flex items-start gap-3 p-4 mb-6 rounded-xl" style={{ backgroundColor: 'var(--warning-bg)', border: '1px solid rgba(202,138,4,0.25)' }}>
          <AlertCircle style={{ width: 18, height: 18, color: 'var(--warning)', flexShrink: 0, marginTop: 1 }} />
          <p className="text-sm" style={{ color: 'var(--warning)', lineHeight: 1.6 }}>
            Manual payments bypass the payment gateway. Ensure you have physical proof of payment before recording.
            This action will be logged in the audit trail.
          </p>
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Description *</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Semester 1 Partial Payment"
              className="w-full text-sm rounded-xl px-3 py-2.5 outline-none"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
            />
          </div>

          <div>
            <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Amount (RWF) *</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 325000"
              className="w-full text-sm rounded-xl px-3 py-2.5 outline-none"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
            />
            {amount && !isNaN(parseInt(amount, 10)) ? (
              <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>{formatCurrency(parseInt(amount, 10))}</p>
            ) : null}
          </div>

          <div>
            <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Payment Method</label>
            <Select value={methodLabel} onValueChange={(v) => setMethodLabel(v as typeof methodLabel)}>
              <SelectTrigger className="w-full text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_METHOD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
              Notes * <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(required)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe why this payment is being recorded manually…"
              rows={3}
              className="w-full text-sm rounded-xl px-3 py-2.5 outline-none resize-none"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleRecord}
              disabled={mutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
              style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer', opacity: mutation.isPending ? 0.7 : 1 }}
            >
              <CreditCard style={{ width: 15, height: 15 }} />
              Record payment
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
      </div>

      <ConfirmAlertDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Record manual payment?"
        tone="warning"
        headlineLabel="Action"
        headline="Record manual payment"
        summary={`A payment of ${amount && !isNaN(parseInt(amount, 10)) ? formatCurrency(parseInt(amount, 10)) : '—'} will be recorded for ${account.name}.`}
        notices={[
          { icon: 'shield', label: 'This bypasses the payment gateway and is permanently logged.' },
          { icon: 'file', label: 'Ensure you have verified proof of payment.' },
        ]}
        confirmLabel="Confirm payment"
        onConfirm={() => mutation.mutate()}
      />
    </>
  )
}
