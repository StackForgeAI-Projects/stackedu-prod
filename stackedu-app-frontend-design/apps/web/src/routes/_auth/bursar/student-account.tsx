import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  ChevronLeft, Lock, Unlock, Receipt, CreditCard, AlertCircle, Download, Search, X,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { StatTile } from '@/components/StatTile'
import { Button } from '@/components/ui/button'
import {
  Sheet, SheetContent,
} from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import {
  BURSAR, BURSAR_NAV, BURSAR_STUDENTS, methodColors, statusColors,
  type BursarStudent, type StudentPayment, type PaymentMethod, type BursarReceipt,
} from '@/data/bursar'
import { toast } from 'sonner'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/bursar/student-account')({
  validateSearch: (search: Record<string, unknown>) => ({
    id: (search.id as string) ?? '',
  }),
  component: StudentAccountPage,
})

const TYPE_NEW_SENTINEL = '__type_new__'

const FEE_DESCRIPTIONS = [
  'Semester 1 Tuition Fee',
  'Semester 1 Partial Payment',
  'Semester 1 Remaining Balance',
  'Administrative Levy',
  'Student Union Fee',
  'Library Fee',
  'ICT Fee',
  'Levies & Fees Bundle',
  'Registration Deposit',
  'Other Payment',
]

const FEE_AMOUNTS: Record<string, number> = {
  'Semester 1 Tuition Fee':       650000,
  'Semester 1 Partial Payment':   325000,
  'Semester 1 Remaining Balance': 325000,
  'Administrative Levy':           50000,
  'Student Union Fee':             25000,
  'Library Fee':                   15000,
  'ICT Fee':                       20000,
  'Levies & Fees Bundle':         110000,
  'Registration Deposit':         110000,
  'Other Payment':                      0,
}

// ─────────────────────────────────────────────────────────────────────────────

function StudentAccountPage() {
  const { id } = Route.useSearch()
  const base = BURSAR_STUDENTS.find((s) => s.id === id)

  if (!base) {
    return (
      <AppShell
        navItems={BURSAR_NAV}
        pageTitle="Student Account"
        userName={BURSAR.fullName}
        userRole="Bursar"
        userInitials={BURSAR.initials}
        infoCardLabel="BURSAR"
        infoCardValue={BURSAR.institution}
        infoCardSubtext="Finance Office"
      >
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <AlertCircle style={{ width: 40, height: 40, color: 'var(--muted-foreground)' }} />
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Student not found.</p>
          <Link to="/bursar/student-accounts" style={{ color: 'var(--success)', fontSize: '0.875rem', fontWeight: 600 }}>
            ← Back to Student Accounts
          </Link>
        </div>
      </AppShell>
    )
  }

  return <StudentAccountInner base={base} />
}

// ─────────────────────────────────────────────────────────────────────────────

function StudentAccountInner({ base }: { base: BursarStudent }) {
  const [student, setStudent] = useState<BursarStudent>(base)
  const [payments, setPayments] = useState<(StudentPayment & { isManual?: boolean })[]>(base.payments)
  const [page, setPage]         = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [issueSheetOpen, setIssueSheetOpen]   = useState(false)
  const [manualSheetOpen, setManualSheetOpen] = useState(false)

  const totalPages = Math.max(1, Math.ceil(payments.length / pageSize))
  const paginated  = payments.slice((page - 1) * pageSize, page * pageSize)

  const toggleHold = () => {
    const newHold    = !student.hasHold
    const newStatus  = newHold ? 'On Hold' : student.outstanding > 0 ? 'Outstanding' : 'Paid'
    setStudent((s) => ({ ...s, hasHold: newHold, status: newStatus as BursarStudent['status'] }))
    toast[newHold ? 'error' : 'success'](
      newHold ? `Fee hold applied to ${student.name}.` : `Fee hold removed for ${student.name}.`
    )
  }

  return (
    <AppShell
      navItems={BURSAR_NAV}
      pageTitle={student.name}
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

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 mb-6 t-caption" style={{ color: 'var(--muted-foreground)' }}>
            <Link
              to="/bursar/student-accounts"
              className="flex items-center gap-1 hover:underline"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <ChevronLeft style={{ width: 12, height: 12 }} />
              Student Accounts
            </Link>
            <span style={{ color: 'var(--border)' }}>›</span>
            <span style={{ color: 'var(--foreground)' }}>{student.name}</span>
          </nav>

          {/* Section header */}
          <div className="mb-6">
            <h1
              className="t-h1 mb-1"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}
            >
              {student.name}
            </h1>
            <div className="flex items-center gap-3">
              <span
                className="t-mono"
                style={{ color: 'var(--muted-foreground)', fontSize: 13 }}
              >
                {student.id}
              </span>
              <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
                · {student.programme} · Year {student.year}
              </span>
            </div>
          </div>

          {/* Fee hold alert */}
          {student.hasHold && (
            <div
              className="flex items-start gap-3 p-4 mb-6 rounded-xl animate-fade-up"
              style={{ backgroundColor: 'var(--error-bg)', border: '1px solid rgba(220,38,38,0.2)' }}
            >
              <AlertCircle style={{ width: 18, height: 18, color: 'var(--error)', flexShrink: 0, marginTop: 1 }} />
              <p className="text-sm" style={{ color: 'var(--error)', lineHeight: 1.5 }}>
                This student has an active fee hold. They cannot register for courses or view results.
              </p>
            </div>
          )}

          {/* StatTiles */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <StatTile
              icon={CreditCard}
              iconColor="var(--info)" iconBg="var(--info-bg)"
              label="TOTAL FEES"
              value={formatCurrency(student.totalFees)}
              delta="This semester"
              deltaColor="var(--muted-foreground)"
              animationDelay={0}
            />
            <StatTile
              icon={Receipt}
              iconColor="var(--success)" iconBg="var(--success-bg)"
              label="AMOUNT PAID"
              value={formatCurrency(student.amountPaid)}
              delta="Confirmed payments"
              deltaColor="var(--success)"
              animationDelay={60}
            />
            <StatTile
              icon={AlertCircle}
              iconColor={student.outstanding > 0 ? 'var(--warning)' : 'var(--success)'}
              iconBg={student.outstanding > 0 ? 'var(--warning-bg)' : 'var(--success-bg)'}
              label="OUTSTANDING BALANCE"
              value={formatCurrency(student.outstanding)}
              delta={student.outstanding > 0 ? 'Balance remaining' : 'Fully paid'}
              deltaColor={student.outstanding > 0 ? 'var(--warning)' : 'var(--success)'}
              animationDelay={120}
            />
          </div>

          {/* Payment history */}
          <div className="mb-6">
            <h2
              className="t-h3 mb-4"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
            >
              Payment History
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
              {payments.length === 0 ? (
                <div className="text-sm text-center py-12" style={{ color: 'var(--muted-foreground)' }}>
                  No payments recorded yet.
                </div>
              ) : (
                <>
                  <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          {['Date', 'Description', 'Amount', 'Method', 'Status', 'Receipt'].map((h) => (
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
                        {paginated.map((pmt, i) => {
                          const mc  = methodColors(pmt.method)
                          const sc2 = statusColors(pmt.status)
                          return (
                            <tr
                              key={i}
                              style={{ borderBottom: i < paginated.length - 1 ? '1px solid var(--border)' : 'none' }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--muted)')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                              <td className="t-caption" style={{ color: 'var(--muted-foreground)', padding: '14px 16px', whiteSpace: 'nowrap' }}>
                                {pmt.date}
                              </td>
                              <td className="text-sm" style={{ color: 'var(--foreground)', padding: '14px 16px' }}>
                                <span>{pmt.description}</span>
                                {(pmt as any).isManual && (
                                  <span
                                    className="t-label px-1.5 py-0.5 ml-2"
                                    style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info)', borderRadius: 'var(--radius-sm)', fontSize: 9 }}
                                  >
                                    MANUAL
                                  </span>
                                )}
                              </td>
                              <td className="text-sm" style={{ color: 'var(--foreground)', padding: '14px 16px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                {formatCurrency(pmt.amount)}
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                <span
                                  className="t-label px-2 py-0.5"
                                  style={{ backgroundColor: mc.bg, color: mc.color, borderRadius: 'var(--radius-sm)', whiteSpace: 'nowrap', fontSize: 10 }}
                                >
                                  {pmt.method}
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                <span
                                  className="t-label px-2 py-0.5"
                                  style={{ backgroundColor: sc2.bg, color: sc2.color, borderRadius: 'var(--radius-sm)' }}
                                >
                                  {pmt.status}
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                {pmt.receiptNo ? (
                                  <button
                                    onClick={() => toast.success(`Receipt ${pmt.receiptNo} download started.`)}
                                    className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all duration-150"
                                    style={{ border: '1px solid var(--border)', color: 'var(--foreground)', background: 'var(--card)', cursor: 'pointer' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card)' }}
                                  >
                                    <Download style={{ width: 12, height: 12 }} />
                                    Download
                                  </button>
                                ) : (
                                  <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>—</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2">
                      <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>Show</span>
                      <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1) }}>
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
                        {payments.length === 0 ? '0' : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, payments.length)}`} of {payments.length} entries
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>Previous</Button>
                      <span className="t-caption px-1" style={{ color: 'var(--muted-foreground)' }}>{page} / {totalPages}</span>
                      <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>Next</Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            {/* Hold toggle */}
            <button
              onClick={toggleHold}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
              style={{
                backgroundColor: 'transparent',
                color: student.hasHold ? 'var(--success)' : 'var(--error)',
                border: `1px solid ${student.hasHold ? 'var(--success)' : 'var(--error)'}`,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
            >
              {student.hasHold
                ? <Unlock style={{ width: 15, height: 15 }} />
                : <Lock style={{ width: 15, height: 15 }} />}
              {student.hasHold ? 'Remove fee hold' : 'Apply fee hold'}
            </button>

            {/* Issue receipt */}
            <button
              onClick={() => setIssueSheetOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
              style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
            >
              <Receipt style={{ width: 15, height: 15 }} />
              Issue receipt
            </button>

            {/* Record manual payment */}
            <button
              onClick={() => setManualSheetOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
              style={{ backgroundColor: 'transparent', color: 'var(--foreground)', border: '1px solid var(--border)', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <CreditCard style={{ width: 15, height: 15 }} />
              Record manual payment
            </button>
          </div>

        </div>
      </div>

      {/* Issue Receipt Sheet */}
      <Sheet open={issueSheetOpen} onOpenChange={setIssueSheetOpen}>
        <SheetContent className="overflow-y-auto" style={{ width: 'min(860px, 55vw)', padding: 0 }}>
          <IssueReceiptSheet
            student={student}
            onClose={() => setIssueSheetOpen(false)}
            onIssued={(receiptNo, description, amount, method) => {
              const newPayment: StudentPayment & { isManual?: boolean } = {
                date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                description,
                amount,
                method,
                status: 'Paid',
                receiptNo,
              }
              setPayments((prev) => [newPayment, ...prev])
              setIssueSheetOpen(false)
              toast.success(`Receipt ${receiptNo} issued successfully.`)
            }}
          />
        </SheetContent>
      </Sheet>

      {/* Manual Payment Sheet */}
      <Sheet open={manualSheetOpen} onOpenChange={setManualSheetOpen}>
        <SheetContent className="overflow-y-auto" style={{ width: 'min(860px, 55vw)', padding: 0 }}>
          <ManualPaymentSheet
            student={student}
            onClose={() => setManualSheetOpen(false)}
            onRecorded={(description, amount, method, proofRef) => {
              const newPayment: StudentPayment & { isManual?: boolean } = {
                date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                description,
                amount,
                method,
                status: 'Paid',
                receiptNo: '',
                isManual: true,
              }
              setPayments((prev) => [newPayment, ...prev])
              setStudent((s) => ({
                ...s,
                amountPaid: s.amountPaid + amount,
                outstanding: Math.max(0, s.outstanding - amount),
                status: s.outstanding - amount <= 0 ? 'Paid' : s.status,
              }))
              setManualSheetOpen(false)
              toast.success(`Manual payment of ${formatCurrency(amount)} recorded for ${student.name}.`)
            }}
          />
        </SheetContent>
      </Sheet>
    </AppShell>
  )
}

// ── Issue Receipt Sheet ───────────────────────────────────────────────────────

function IssueReceiptSheet({
  student,
  onClose,
  onIssued,
}: {
  student: BursarStudent
  onClose: () => void
  onIssued: (receiptNo: string, description: string, amount: number, method: PaymentMethod) => void
}) {
  const [description, setDescription]   = useState('')
  const [customDesc, setCustomDesc]     = useState('')
  const [amount, setAmount]             = useState('')
  const [method, setMethod]             = useState<PaymentMethod>('MTN MoMo')
  const [date, setDate]                 = useState('')

  const handleDescChange = (v: string) => {
    setDescription(v)
    if (v !== TYPE_NEW_SENTINEL) {
      const auto = FEE_AMOUNTS[v]
      if (auto !== undefined) setAmount(String(auto))
    } else {
      setAmount('')
    }
  }

  const handleIssue = () => {
    const resolvedDesc = description === TYPE_NEW_SENTINEL ? customDesc.trim() : description
    const resolvedAmount = parseInt(amount, 10)
    if (!resolvedDesc || isNaN(resolvedAmount) || resolvedAmount <= 0) {
      toast.error('Please fill in all required fields.')
      return
    }
    const receiptNo = `RCT-2025-${String(Math.floor(Math.random() * 9000) + 1000)}`
    onIssued(receiptNo, resolvedDesc, resolvedAmount, method)
  }

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
          Issue Receipt
        </h2>
        <button onClick={onClose} style={{ color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <X style={{ width: 18, height: 18 }} />
        </button>
      </div>

      <div className="flex flex-col gap-5">
        {/* Student name — read only */}
        <div>
          <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Student</label>
          <input
            type="text"
            value={student.name}
            readOnly
            className="w-full text-sm rounded-xl px-3 py-2.5 outline-none"
            style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}
          />
          <p className="t-mono mt-1" style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>{student.id}</p>
        </div>

        {/* Fee description with 'Type new' */}
        <div>
          <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Fee Description *</label>
          <Select value={description} onValueChange={handleDescChange}>
            <SelectTrigger className="w-full text-sm">
              <SelectValue placeholder="Select description…" />
            </SelectTrigger>
            <SelectContent>
              {FEE_DESCRIPTIONS.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
              <SelectItem value={TYPE_NEW_SENTINEL}>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>+ Type new description</span>
              </SelectItem>
            </SelectContent>
          </Select>
          {description === TYPE_NEW_SENTINEL && (
            <input
              type="text"
              value={customDesc}
              onChange={(e) => setCustomDesc(e.target.value)}
              placeholder="Enter custom description…"
              autoFocus
              className="w-full text-sm rounded-xl px-3 py-2.5 outline-none mt-2"
              style={{ border: '1px solid var(--brand)', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
            />
          )}
        </div>

        {/* Amount */}
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
          {amount && !isNaN(parseInt(amount, 10)) && (
            <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
              {formatCurrency(parseInt(amount, 10))}
            </p>
          )}
        </div>

        {/* Payment method */}
        <div>
          <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Payment Method</label>
          <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
            <SelectTrigger className="w-full text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="MTN MoMo">MTN MoMo</SelectItem>
              <SelectItem value="Airtel Money">Airtel Money</SelectItem>
              <SelectItem value="Card">Card</SelectItem>
              <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Payment date */}
        <div>
          <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Payment Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full text-sm rounded-xl px-3 py-2.5 outline-none"
            style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleIssue}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
            style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}
          >
            <Receipt style={{ width: 15, height: 15 }} />
            Issue receipt
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
  )
}

// ── Manual Payment Sheet ──────────────────────────────────────────────────────

function ManualPaymentSheet({
  student,
  onClose,
  onRecorded,
}: {
  student: BursarStudent
  onClose: () => void
  onRecorded: (description: string, amount: number, method: PaymentMethod, proofRef: string) => void
}) {
  const [description, setDescription] = useState('')
  const [amount, setAmount]           = useState('')
  const [method, setMethod]           = useState<PaymentMethod>('Bank Transfer')
  const [date, setDate]               = useState('')
  const [proofRef, setProofRef]       = useState('')
  const [notes, setNotes]             = useState('')

  const handleRecord = () => {
    const resolvedAmount = parseInt(amount, 10)
    if (!description || isNaN(resolvedAmount) || resolvedAmount <= 0 || !notes.trim()) {
      toast.error('Please fill in all required fields including notes.')
      return
    }
    onRecorded(description, resolvedAmount, method, proofRef)
  }

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
          Record Manual Payment
        </h2>
        <button onClick={onClose} style={{ color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <X style={{ width: 18, height: 18 }} />
        </button>
      </div>

      {/* Warning alert */}
      <div
        className="flex items-start gap-3 p-4 mb-6 rounded-xl"
        style={{ backgroundColor: 'var(--warning-bg)', border: '1px solid rgba(202,138,4,0.25)' }}
      >
        <AlertCircle style={{ width: 18, height: 18, color: 'var(--warning)', flexShrink: 0, marginTop: 1 }} />
        <p className="text-sm" style={{ color: 'var(--warning)', lineHeight: 1.6 }}>
          Manual payments bypass the payment gateway. Ensure you have physical proof of payment before recording.
          This action will be logged in the audit trail.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {/* Description */}
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

        {/* Amount */}
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
          {amount && !isNaN(parseInt(amount, 10)) && (
            <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
              {formatCurrency(parseInt(amount, 10))}
            </p>
          )}
        </div>

        {/* Payment method */}
        <div>
          <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Payment Method</label>
          <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
            <SelectTrigger className="w-full text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="MTN MoMo">MTN MoMo</SelectItem>
              <SelectItem value="Airtel Money">Airtel Money</SelectItem>
              <SelectItem value="Card">Card</SelectItem>
              <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Payment date */}
        <div>
          <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Payment Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full text-sm rounded-xl px-3 py-2.5 outline-none"
            style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
          />
        </div>

        {/* Proof reference */}
        <div>
          <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
            Proof Reference (e.g. bank slip number)
          </label>
          <input
            type="text"
            value={proofRef}
            onChange={(e) => setProofRef(e.target.value)}
            placeholder="e.g. BNK-SLIP-20250122-001"
            className="w-full text-sm rounded-xl px-3 py-2.5 outline-none"
            style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
          />
        </div>

        {/* Notes — mandatory */}
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

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleRecord}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
            style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}
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
  )
}
