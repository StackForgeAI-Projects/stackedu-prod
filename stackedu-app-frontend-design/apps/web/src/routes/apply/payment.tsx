import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { ApplyLayout, type ApplyStep } from '@/components/ApplyLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/apply/payment')({
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

type PayMethod = 'momo' | 'airtel' | 'bank'

interface MethodCard {
  id:        PayMethod
  name:      string
  description: string
  dotColor:  string
}

const METHODS: MethodCard[] = [
  { id: 'momo',   name: 'MTN MoMo',      description: 'USSD push to your MTN number',    dotColor: '#F59E0B' },
  { id: 'airtel', name: 'Airtel Money',  description: 'USSD push to your Airtel number', dotColor: '#DC2626' },
  { id: 'bank',   name: 'Bank Transfer', description: 'Direct deposit or wire transfer', dotColor: 'var(--muted-foreground)' },
]

const APP_FEE    = 10_000
const PROCESSING = 0

// ─────────────────────────────────────────────────────────────────────────────

function ApplyPaymentPage() {
  const navigate  = useNavigate()
  const [selected, setSelected] = useState<PayMethod | null>(null)
  const [loading,  setLoading]  = useState(false)

  const handlePay = async () => {
    if (!selected) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1400))
    setLoading(false)
    navigate({ to: '/apply/confirmation' })
  }

  return (
    <ApplyLayout
      steps={STEPS}
      currentStep={7}
      completedSteps={[1, 2, 3, 4, 5, 6]}
      progressPercent={100}
      showBanner={false}
    >
      {/* Heading */}
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

      {/* Fee summary card */}
      <div
        className="mb-6 p-6 rounded-xl"
        style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}
      >
        <p className="t-label mb-4" style={{ color: 'var(--muted-foreground)' }}>FEE SUMMARY</p>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--foreground)' }}>Application Fee</span>
            <span className="text-sm font-medium" style={{ fontFamily: 'var(--font-mono)', color: 'var(--foreground)' }}>
              {formatCurrency(APP_FEE)}
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
              {formatCurrency(APP_FEE + PROCESSING)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment method selector */}
      <p className="t-label mb-3" style={{ color: 'var(--muted-foreground)' }}>SELECT PAYMENT METHOD</p>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {METHODS.map((m) => (
          <button
            key={m.id}
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

      {/* Expanded method details */}
      <div
        style={{
          maxHeight:  selected ? 300 : 0,
          overflow:   'hidden',
          transition: 'max-height 200ms ease-out',
        }}
      >
        {selected === 'momo' && <MoMoDetails brand="MTN MoMo" inputLabel="MTN MoMo Number" />}
        {selected === 'airtel' && <MoMoDetails brand="Airtel Money" inputLabel="Airtel Money Number" />}
        {selected === 'bank' && <BankDetails />}
      </div>

      {/* Submit */}
      <div className="mt-6">
        <Button
          className="w-full h-12 font-semibold text-sm transition-transform duration-150 hover:-translate-y-px active:translate-y-0"
          disabled={!selected || loading}
          onClick={handlePay}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Processing payment…
            </span>
          ) : (
            `Pay ${formatCurrency(APP_FEE)} and submit application`
          )}
        </Button>

        <div className="flex items-center justify-center gap-2 mt-3">
          <ShieldCheck size={13} style={{ color: 'var(--muted-foreground)' }} />
          <p style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
            Payments are processed securely via DPO Pay. Your application is submitted immediately after payment confirmation.
          </p>
        </div>
      </div>

      {/* Back */}
      <div className="mt-4 flex justify-start">
        <Button variant="outline" onClick={() => navigate({ to: '/apply/documents' })}>
          ← Back
        </Button>
      </div>
    </ApplyLayout>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function MoMoDetails({ brand, inputLabel }: { brand: string; inputLabel: string }) {
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
        A USSD push will be sent to your {brand} number. Approve the prompt to complete payment.
      </p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="mobile-num">{inputLabel}</Label>
        <Input id="mobile-num" type="tel" placeholder="+250 7XX XXX XXX" />
      </div>
    </div>
  )
}

function BankDetails() {
  const rows = [
    { label: 'BANK',           value: 'Bank of Kigali',                         mono: false },
    { label: 'ACCOUNT NAME',   value: 'StackForgeAI University — Applications', mono: false },
    { label: 'ACCOUNT NUMBER', value: '0001234567890',                           mono: true  },
    { label: 'BRANCH',         value: 'Kigali City Centre',                     mono: false },
    { label: 'REFERENCE',      value: 'Amina Uwase — Computer Science',          mono: true  },
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
        <div key={r.label} className="flex items-center justify-between">
          <span className="t-label" style={{ color: 'var(--muted-foreground)' }}>{r.label}</span>
          <span
            className="text-sm font-medium"
            style={{ fontFamily: r.mono ? 'var(--font-mono)' : undefined, color: 'var(--foreground)' }}
          >
            {r.value}
          </span>
        </div>
      ))}
      <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
        Bank transfers may take 1–3 business days.
      </p>
    </div>
  )
}
