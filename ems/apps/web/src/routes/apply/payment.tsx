import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import type { PaymentMethod } from '@stackedu/shared'
import { ShieldCheck } from 'lucide-react'
import { ApplyLayout, type ApplyStep } from '@/components/ApplyLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useApplication } from '@/hooks/useApplication'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import {
  acknowledgeBankTransfer,
  applicationQueryKeyFor,
  initiatePayment,
  submitApplication,
} from '@/lib/api/admissions'
import { apiErrorMessage } from '@/lib/api/client'
import { notifyError, notifySuccess } from '@/lib/notify'
import { requireVerifiedApplicant } from '@/lib/auth/guards'
import { queryClient } from '@/lib/query-client'
import { APPLY_PROGRESS_BY_STEP } from '@/lib/apply/progress'
import { formatCurrency } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/apply/payment')({
  beforeLoad: requireVerifiedApplicant,
  component: ApplyPaymentPage,
})

// ─────────────────────────────────────────────────────────────────────────────

const STEPS: ApplyStep[] = [
  { id: 1, label: 'Personal Details'    },
  { id: 2, label: 'Academic History'    },
  { id: 3, label: 'Programme Selection' },
  { id: 4, label: 'Parent / Guardian'   },
  { id: 5, label: 'Additional Info'     },
  { id: 6, label: 'Documents'           },
  { id: 7, label: 'Application Fee'     },
]

type PayMethod = 'MoMo' | 'Airtel' | 'Card' | 'BankTransfer'

interface MethodCard {
  id:          PayMethod
  name:        string
  description: string
  dotColor:    string
}

const METHODS: MethodCard[] = [
  { id: 'MoMo',          name: 'MTN MoMo',      description: 'PawaPay when live keys are configured',    dotColor: '#F59E0B' },
  { id: 'Airtel',        name: 'Airtel Money',  description: 'PawaPay when live keys are configured', dotColor: '#DC2626' },
  { id: 'Card',          name: 'Card',          description: 'Flutterwave when live keys are configured', dotColor: '#2563EB' },
  { id: 'BankTransfer',  name: 'Bank Transfer', description: 'Direct deposit or wire transfer', dotColor: 'var(--muted-foreground)' },
]

const APP_FEE = 10_000

function toInternational(local: string): string {
  const digits = local.replace(/\D/g, '')
  if (local.trim().startsWith('+')) return `+${digits}`
  if (digits.startsWith('250')) return `+${digits}`
  if (digits.startsWith('0')) return `+250${digits.slice(1)}`
  return `+250${digits}`
}

// ─────────────────────────────────────────────────────────────────────────────

function ApplyPaymentPage() {
  const navigate = useNavigate()
  const { user } = useCurrentUser()
  const [selected, setSelected] = useState<PayMethod | null>(null)
  const [payerPhone, setPayerPhone] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const { application, refetch } = useApplication()

  const alreadyPaid = application?.payment?.status === 'Completed'
  const pendingBank =
    application?.payment?.method === 'BankTransfer' &&
    application.payment.status === 'Pending'

  const payAndSubmit = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error('Select a payment method')

      let payment = application?.payment
      if (!payment || payment.status !== 'Completed') {
        if (selected === 'BankTransfer' && payment?.method === 'BankTransfer' && payment.status === 'Pending') {
          payment = await acknowledgeBankTransfer()
        } else {
          const method: PaymentMethod = selected
          payment = await initiatePayment({
            method,
            ...(selected === 'MoMo' || selected === 'Airtel'
              ? { payerPhone: toInternational(payerPhone) }
              : {}),
          })
        }
      }

      if (payment.status !== 'Completed') {
        return { application: null, payment }
      }

      const submitted = await submitApplication()
      return { application: submitted, payment }
    },
    onSuccess: async (result) => {
      if (result.application) {
        queryClient.setQueryData(applicationQueryKeyFor(user?.id), result.application)
        await navigate({ to: '/apply/confirmation' })
        return
      }
      await refetch()
      notifySuccess(
        'Bank transfer recorded. Admissions will confirm the payment, then you can submit.',
      )
    },
    onError: (error: unknown) => {
      notifyError(
        apiErrorMessage(error, 'We could not process payment. Please try again.'),
      )
    },
  })

  const submitOnly = useMutation({
    mutationFn: submitApplication,
    onSuccess: async (app) => {
      queryClient.setQueryData(applicationQueryKeyFor(user?.id), app)
      await navigate({ to: '/apply/confirmation' })
    },
    onError: (error: unknown) => {
      notifyError(apiErrorMessage(error, 'We could not submit your application.'))
    },
  })

  const loading = payAndSubmit.isPending || submitOnly.isPending
  const mobileSelected = selected === 'MoMo' || selected === 'Airtel'
  const cardReady = selected !== 'Card'
    || (cardNumber.replace(/\s/g, '').length >= 12 && cardExpiry.trim().length >= 4 && cardCvv.trim().length >= 3)

  return (
    <ApplyLayout
      steps={STEPS}
      currentStep={7}
      completedSteps={[1, 2, 3, 4, 5, 6]}
      progressPercent={APPLY_PROGRESS_BY_STEP[7]}
      showBanner={false}
    >
      <div className="mb-6">
        <h2
          className="t-h2"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.01em' }}
        >
          Application fee payment
        </h2>
        <p className="t-body mt-1" style={{ color: 'var(--muted-foreground)' }}>
          A non-refundable application fee is required to submit your application.
        </p>
      </div>

      <div
        className="mb-6 p-6 rounded-xl"
        style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}
      >
        <p className="t-label mb-4" style={{ color: 'var(--muted-foreground)' }}>FEE SUMMARY</p>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--foreground)' }}>Application Fee</span>
            <span className="text-sm font-medium" style={{ fontFamily: 'var(--font-mono)', color: 'var(--foreground)' }}>
              {formatCurrency(application?.payment?.amount ?? APP_FEE)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--foreground)' }}>Processing Fee</span>
            <span
              className="text-sm font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}
            >
              Waived
            </span>
          </div>
          <div
            className="flex items-center justify-between pt-3 mt-1"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <span className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>Total Due</span>
            <span
              className="t-h2"
              style={{
                fontFamily: 'var(--font-display)',
                color:      '#0D7A28',
                letterSpacing: '-0.01em',
              }}
            >
              {formatCurrency(application?.payment?.amount ?? APP_FEE)}
            </span>
          </div>
          {application?.payment && (
            <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
              Payment status: <strong style={{ color: 'var(--foreground)' }}>{application.payment.status}</strong>
              {application.payment.reference ? ` · ${application.payment.reference}` : ''}
            </p>
          )}
        </div>
      </div>

      {!alreadyPaid && (
        <>
          <p className="t-label mb-3" style={{ color: 'var(--muted-foreground)' }}>SELECT PAYMENT METHOD</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelected(m.id)}
                className="flex flex-col items-start p-4 rounded-lg text-left transition-all duration-150"
                style={{
                  border:          selected === m.id ? '2px solid #0D7A28' : '1px solid var(--border)',
                  backgroundColor: selected === m.id ? 'rgba(13,122,40,0.05)' : 'var(--card)',
                  cursor:          'pointer',
                }}
              >
                <div
                  className="rounded-full mb-3"
                  style={{ width: 10, height: 10, backgroundColor: m.dotColor }}
                />
                <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--foreground)' }}>
                  {m.name}
                </p>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)', lineHeight: 1.4 }}>
                  {m.description}
                </p>
              </button>
            ))}
          </div>

          <div
            style={{
              maxHeight:  selected ? 300 : 0,
              overflow:   'hidden',
              transition: 'max-height 200ms ease-out',
            }}
          >
            {mobileSelected && (
              <MoMoDetails
                brand={selected === 'MoMo' ? 'MTN MoMo' : 'Airtel Money'}
                inputLabel={selected === 'MoMo' ? 'MTN MoMo Number' : 'Airtel Money Number'}
                value={payerPhone}
                onChange={setPayerPhone}
              />
            )}
            {selected === 'BankTransfer' && <BankDetails />}
            {selected === 'Card' && (
              <CardDetails
                cardNumber={cardNumber}
                setCardNumber={setCardNumber}
                cardExpiry={cardExpiry}
                setCardExpiry={setCardExpiry}
                cardCvv={cardCvv}
                setCardCvv={setCardCvv}
              />
            )}
          </div>
        </>
      )}

      <div className="mt-6">
        {alreadyPaid ? (
          <Button
            className="w-full h-12 font-semibold text-sm"
            disabled={loading}
            onClick={() => submitOnly.mutate()}
          >
            {loading ? 'Submitting…' : 'Submit application'}
          </Button>
        ) : (
          <Button
            className="w-full h-12 font-semibold text-sm transition-transform duration-150 hover:-translate-y-px active:translate-y-0"
            disabled={
              !selected ||
              loading ||
              (mobileSelected && payerPhone.replace(/\D/g, '').length < 9) ||
              !cardReady
            }
            onClick={() => payAndSubmit.mutate()}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Processing payment…
              </span>
            ) : pendingBank || selected === 'BankTransfer' ? (
              `Confirm transfer of ${formatCurrency(APP_FEE)}`
            ) : (
              `Pay ${formatCurrency(APP_FEE)} and submit application`
            )}
          </Button>
        )}

        <div className="flex items-center justify-center gap-2 mt-3">
          <ShieldCheck size={13} style={{ color: 'var(--muted-foreground)' }} />
          <p style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
            Payments are recorded securely. Your application is submitted only after the fee is confirmed.
          </p>
        </div>
      </div>

      <div className="mt-4 flex justify-start">
        <Button variant="outline" onClick={() => navigate({ to: '/apply/documents' })}>
          ← Back
        </Button>
      </div>
    </ApplyLayout>
  )
}

function MoMoDetails({
  brand,
  inputLabel,
  value,
  onChange,
}: {
  brand: string
  inputLabel: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div
      className="flex flex-col gap-3 p-4 rounded-lg mb-3"
      style={{
        backgroundColor: 'rgba(13,122,40,0.04)',
        border:          '1px solid rgba(13,122,40,0.15)',
      }}
    >
      <p className="t-label" style={{ color: 'var(--muted-foreground)' }}>PAYMENT INSTRUCTIONS</p>
      <p className="text-sm" style={{ color: 'var(--foreground)', lineHeight: 1.5 }}>
        Enter the {brand} number that will approve the payment prompt.
      </p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="mobile-num">{inputLabel}</Label>
        <Input
          id="mobile-num"
          type="tel"
          placeholder="+250 7XX XXX XXX"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}

function CardDetails({
  cardNumber,
  setCardNumber,
  cardExpiry,
  setCardExpiry,
  cardCvv,
  setCardCvv,
}: {
  cardNumber: string
  setCardNumber: (value: string) => void
  cardExpiry: string
  setCardExpiry: (value: string) => void
  cardCvv: string
  setCardCvv: (value: string) => void
}) {
  return (
    <div
      className="flex flex-col gap-3 p-4 rounded-lg mb-3"
      style={{
        backgroundColor: 'rgba(13,122,40,0.04)',
        border: '1px solid rgba(13,122,40,0.15)',
      }}
    >
      <p className="t-label" style={{ color: 'var(--muted-foreground)' }}>CARD DETAILS</p>
      <p className="text-sm" style={{ color: 'var(--foreground)', lineHeight: 1.5 }}>
        Enter card details. Sandbox accepts any valid-looking test card.
      </p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="card-number">Card number</Label>
        <Input
          id="card-number"
          inputMode="numeric"
          placeholder="4111 1111 1111 1111"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="card-expiry">Expiry</Label>
          <Input
            id="card-expiry"
            placeholder="MM/YY"
            value={cardExpiry}
            onChange={(e) => setCardExpiry(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="card-cvv">CVV</Label>
          <Input
            id="card-cvv"
            inputMode="numeric"
            placeholder="123"
            value={cardCvv}
            onChange={(e) => setCardCvv(e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}

function BankDetails() {
  const { application } = useApplication()

  const rows = [
    { label: 'BANK',           value: 'Bank of Kigali',                         mono: false },
    { label: 'ACCOUNT NAME',   value: 'StackForgeAI University — Applications', mono: false },
    { label: 'ACCOUNT NUMBER', value: '0001234567890',                           mono: true  },
    { label: 'BRANCH',         value: 'Kigali City Centre',                     mono: false },
    { label: 'REFERENCE',      value: application?.reference ?? '',             mono: true  },
  ]
  return (
    <div
      className="flex flex-col gap-3 p-4 rounded-lg mb-3"
      style={{
        backgroundColor: 'rgba(13,122,40,0.04)',
        border:          '1px solid rgba(13,122,40,0.15)',
      }}
    >
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between gap-3">
          <span className="t-label" style={{ color: 'var(--muted-foreground)' }}>{r.label}</span>
          <span
            className="text-sm font-medium text-right"
            style={{ fontFamily: r.mono ? 'var(--font-mono)' : undefined, color: 'var(--foreground)' }}
          >
            {r.value}
          </span>
        </div>
      ))}
      <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
        Use your application ID as the transfer reference. In live mode, admissions confirms the deposit before submit.
      </p>
    </div>
  )
}
