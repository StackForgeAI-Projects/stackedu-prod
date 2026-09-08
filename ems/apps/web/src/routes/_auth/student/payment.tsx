import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { PaymentMethod } from '@stackedu/shared'
import { ArrowLeft, CreditCard, Landmark, ShieldCheck, Smartphone, Wallet } from 'lucide-react'
import { StudentShell } from '@/components/StudentShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils'
import { paymentMethodColors, paymentMethodLabel } from '@/lib/bursar-display'
import { getStudentFees, payStudentFees, studentDashboardQueryKey, studentFeesQueryKey } from '@/lib/api/student'
import { apiErrorMessage } from '@/lib/api/client'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_auth/student/payment')({
  validateSearch: (search: Record<string, unknown>) => ({
    invoiceId: typeof search.invoiceId === 'string' ? search.invoiceId : undefined,
  }),
  component: MakePaymentPage,
})

const DEMO_MOMO_PHONE = '0781234567'
const DEMO_AIRTEL_PHONE = '0731234567'

const METHODS: Array<{
  id: PaymentMethod
  label: string
  hint: string
  icon: typeof Smartphone
}> = [
  { id: 'MoMo', label: 'MTN MoMo', hint: 'PawaPay · sandbox completes instantly', icon: Smartphone },
  { id: 'Airtel', label: 'Airtel Money', hint: 'PawaPay · sandbox completes instantly', icon: Smartphone },
  { id: 'Card', label: 'Card', hint: 'Flutterwave · use any test card in sandbox', icon: CreditCard },
  { id: 'BankTransfer', label: 'Bank transfer', hint: 'Pending until the Bursar confirms', icon: Landmark },
]

function MakePaymentPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { invoiceId } = Route.useSearch()
  const { data, isPending } = useQuery({ queryKey: studentFeesQueryKey, queryFn: getStudentFees })

  const invoice = useMemo(() => {
    if (!data) return undefined
    if (invoiceId) return data.invoices.find((row) => row.id === invoiceId)
    return data.invoices.find((row) => row.outstanding > 0)
  }, [data, invoiceId])

  const outstanding = invoice?.outstanding ?? data?.balance ?? 0
  const allowPartial = invoice?.allowPartial ?? true

  const [payMode, setPayMode] = useState<'full' | 'partial'>('full')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('MoMo')
  const [phone, setPhone] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')

  useEffect(() => {
    if (!allowPartial) setPayMode('full')
  }, [allowPartial, invoice?.id])

  useEffect(() => {
    if (method === 'MoMo' && !phone) setPhone(DEMO_MOMO_PHONE)
    if (method === 'Airtel' && !phone) setPhone(DEMO_AIRTEL_PHONE)
  }, [method, phone])

  const payAmount = payMode === 'full' ? outstanding : Math.round(Number(amount || 0))
  const selectedMethod = METHODS.find((item) => item.id === method)
  const cardReady = method !== 'Card'
    || (cardNumber.replace(/\s/g, '').length >= 12 && cardExpiry.trim().length >= 4 && cardCvv.trim().length >= 3)
  const phoneReady = method !== 'MoMo' && method !== 'Airtel' ? true : phone.replace(/\D/g, '').length >= 9

  const mutation = useMutation({
    mutationFn: payStudentFees,
    onSuccess: async (fees) => {
      toast.success('Payment recorded.')
      await queryClient.invalidateQueries({ queryKey: studentFeesQueryKey })
      await queryClient.invalidateQueries({ queryKey: studentDashboardQueryKey })
      const latest = fees.payments[0]
      if (latest?.status === 'Completed') void navigate({ to: '/student/receipt', search: { id: latest.id } })
      else void navigate({ to: '/student/fees' })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Payment failed.')),
  })

  if (isPending) {
    return (
      <StudentShell pageTitle="Pay fees" guide="Pay an outstanding invoice.">
        <p className="t-body px-4 py-8" style={{ color: 'var(--muted-foreground)' }}>Loading payment details…</p>
      </StudentShell>
    )
  }

  if (!invoice || outstanding <= 0) {
    return (
      <StudentShell pageTitle="Pay fees" guide="Pay an outstanding invoice.">
        <div className="animate-fade-up max-w-lg mx-auto px-4 py-12 text-center">
          <p className="t-body mb-4" style={{ color: 'var(--muted-foreground)' }}>You have no outstanding fees to pay.</p>
          <Link to="/student/fees" className="text-sm font-semibold" style={{ color: 'var(--success)' }}>← Back to fee statement</Link>
        </div>
      </StudentShell>
    )
  }

  return (
    <StudentShell pageTitle="Pay fees" guide="Pay an outstanding invoice. Sandbox mobile money and card complete immediately and open a receipt.">
      <div className="animate-fade-up" style={{ padding: '24px 16px 56px' }}>
        <Link to="/student/fees" className="inline-flex items-center gap-1.5 t-caption mb-4" style={{ color: 'var(--muted-foreground)' }}>
          <ArrowLeft style={{ width: 14, height: 14 }} />
          Fee statement
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] gap-6 max-w-5xl mx-auto">
          <section
            className="rounded-2xl p-5 sm:p-6"
            style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
          >
            <div className="flex items-start gap-3 mb-5">
              <span
                className="flex items-center justify-center rounded-xl flex-shrink-0"
                style={{ width: 44, height: 44, backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}
              >
                <Wallet style={{ width: 20, height: 20 }} />
              </span>
              <div>
                <h1 className="t-h2 mb-1" style={{ fontFamily: 'var(--font-display)' }}>Pay fees</h1>
                <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{invoice.invoiceNumber}</p>
              </div>
            </div>

            <div className="rounded-xl p-4 mb-5" style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}>
              <p className="text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>{invoice.description}</p>
              <div className="flex flex-col gap-2">
                {invoice.lineItems.map((item, index) => (
                  <div key={`${item.name}-${index}`} className="flex items-center justify-between gap-3 text-sm">
                    <span style={{ color: 'var(--muted-foreground)' }}>{item.name}</span>
                    <span className="font-medium whitespace-nowrap">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
              <div
                className="flex items-center justify-between gap-3 mt-4 pt-4"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <span className="text-sm font-semibold">Outstanding</span>
                <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: '#0D7A28' }}>
                  {formatCurrency(outstanding)}
                </span>
              </div>
            </div>

            {allowPartial ? (
              <div className="mb-5">
                <p className="t-label mb-2" style={{ color: 'var(--muted-foreground)' }}>PAYMENT AMOUNT</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['full', 'partial'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPayMode(mode)}
                      className={cn('rounded-xl px-3 py-3 text-left transition-colors')}
                      style={{
                        border: payMode === mode ? '2px solid var(--brand)' : '1px solid var(--border)',
                        backgroundColor: payMode === mode ? 'var(--success-bg)' : 'var(--card)',
                      }}
                    >
                      <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                        {mode === 'full' ? 'Pay in full' : 'Part payment'}
                      </p>
                      <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                        {mode === 'full' ? formatCurrency(outstanding) : 'Choose amount below'}
                      </p>
                    </button>
                  ))}
                </div>
                {payMode === 'partial' ? (
                  <div className="mt-3">
                    <Label htmlFor="amount">Amount to pay (RWF)</Label>
                    <Input
                      id="amount"
                      inputMode="numeric"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={`Up to ${outstanding.toLocaleString()}`}
                      className="mt-1.5"
                    />
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="t-caption mb-5 px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)' }}>
                This fee must be paid in full.
              </p>
            )}

            <p className="t-label mb-2" style={{ color: 'var(--muted-foreground)' }}>PAYMENT METHOD</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {METHODS.map((item) => {
                const Icon = item.icon
                const colors = paymentMethodColors(item.id)
                const active = method === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMethod(item.id)}
                    className="flex items-start gap-3 rounded-xl p-3 text-left transition-colors"
                    style={{
                      border: active ? '2px solid var(--brand)' : '1px solid var(--border)',
                      backgroundColor: active ? 'var(--success-bg)' : 'var(--card)',
                    }}
                  >
                    <span
                      className="flex items-center justify-center rounded-lg flex-shrink-0"
                      style={{ width: 36, height: 36, backgroundColor: colors.bg, color: colors.color }}
                    >
                      <Icon style={{ width: 16, height: 16 }} />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{item.label}</span>
                      <span className="block t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{item.hint}</span>
                    </span>
                  </button>
                )
              })}
            </div>

            {(method === 'MoMo' || method === 'Airtel') ? (
              <div className="rounded-xl p-4 mb-4" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
                <Label htmlFor="phone">{paymentMethodLabel(method)} number</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={method === 'MoMo' ? DEMO_MOMO_PHONE : DEMO_AIRTEL_PHONE}
                  className="mt-1.5"
                />
                <p className="t-caption mt-2" style={{ color: 'var(--muted-foreground)' }}>
                  Sandbox demo: use {method === 'MoMo' ? DEMO_MOMO_PHONE : DEMO_AIRTEL_PHONE}
                </p>
              </div>
            ) : null}

            {method === 'Card' ? (
              <div className="rounded-xl p-4 mb-4 flex flex-col gap-3" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
                <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>Sandbox accepts any valid-looking test card.</p>
                <div>
                  <Label htmlFor="cardNumber">Card number</Label>
                  <Input id="cardNumber" inputMode="numeric" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="4111 1111 1111 1111" className="mt-1.5" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="cardExpiry">Expiry</Label>
                    <Input id="cardExpiry" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} placeholder="MM/YY" className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="cardCvv">CVV</Label>
                    <Input id="cardCvv" inputMode="numeric" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} placeholder="123" className="mt-1.5" />
                  </div>
                </div>
              </div>
            ) : null}

            {method === 'BankTransfer' ? (
              <p className="t-caption mb-4 px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                Bank transfers stay pending until the Bursar confirms receipt of funds.
              </p>
            ) : null}

            <Button
              className="w-full h-12 text-sm font-semibold"
              disabled={
                mutation.isPending
                || payAmount <= 0
                || payAmount > outstanding
                || !phoneReady
                || !cardReady
              }
              onClick={() => mutation.mutate({
                invoiceId: invoice.id,
                amount: payAmount,
                method,
                payerPhone: phone.trim() || undefined,
              })}
            >
              {mutation.isPending ? 'Processing…' : `Pay ${formatCurrency(payAmount)}`}
            </Button>

            <div className="flex items-center justify-center gap-2 mt-3">
              <ShieldCheck size={13} style={{ color: 'var(--muted-foreground)' }} />
              <p style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Secure payment · receipt issued on completion</p>
            </div>
          </section>

          <aside className="lg:sticky lg:top-24 h-fit">
            <div
              className="rounded-2xl p-5"
              style={{ background: 'linear-gradient(145deg, rgba(13,122,40,0.08) 0%, rgba(13,122,40,0.02) 100%)', border: '1px solid rgba(13,122,40,0.15)' }}
            >
              <p className="t-label mb-3" style={{ color: 'var(--muted-foreground)' }}>SUMMARY</p>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between gap-3 text-sm">
                  <span style={{ color: 'var(--muted-foreground)' }}>You pay</span>
                  <span className="font-semibold">{formatCurrency(payAmount)}</span>
                </div>
                <div className="flex justify-between gap-3 text-sm">
                  <span style={{ color: 'var(--muted-foreground)' }}>Method</span>
                  <span className="font-semibold">{selectedMethod?.label}</span>
                </div>
                <div className="flex justify-between gap-3 text-sm">
                  <span style={{ color: 'var(--muted-foreground)' }}>Remaining after</span>
                  <span className="font-semibold">{formatCurrency(Math.max(0, outstanding - payAmount))}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </StudentShell>
  )
}
