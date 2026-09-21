import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import {
  LayoutDashboard, BookOpen, BarChart2, CreditCard, Library, Bell,
  ChevronRight, Smartphone, Building2, CreditCard as CardIcon,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/student/payment')({
  component: MakePaymentPage,
})

// ── Nav ───────────────────────────────────────────────────────────────────────

const STUDENT_NAV = [
  { label: 'Dashboard',     to: '/student/dashboard',     icon: LayoutDashboard },
  { label: 'My Courses',    to: '/student/courses',       icon: BookOpen        },
  { label: 'Results',       to: '/student/results',       icon: BarChart2       },
  { label: 'Fees',          to: '/student/fees',          icon: CreditCard      },
  { label: 'E-Library',     to: '/student/library',       icon: Library         },
  { label: 'Notifications', to: '/student/notifications', icon: Bell            },
]

// ── Mock data ─────────────────────────────────────────────────────────────────

const DUE_DATE = '31 January 2025'

interface FeeOption {
  value:  string
  label:  string
  amount: number | null
}

const FEE_OPTIONS: FeeOption[] = [
  { value: 'tuition-s1',    label: 'Tuition Fee — Semester 1', amount: 650_000 },
  { value: 'admin-levy',    label: 'Administrative Levy',        amount:  50_000 },
  { value: 'student-union', label: 'Student Union Fee',          amount:  25_000 },
  { value: 'library',       label: 'Library Fee',                amount:  15_000 },
  { value: 'ict',           label: 'ICT Fee',                    amount:  20_000 },
  { value: 'balance',       label: 'Remaining Balance',          amount:  45_000 },
  { value: 'other',         label: 'Type new',                   amount:  null   },
]

// ── Payment methods ───────────────────────────────────────────────────────────

const METHODS = [
  {
    id:          'momo',
    name:        'MTN MoMo',
    description: 'USSD push to your MTN number',
    accentColor: '#FFCB00',
    textColor:   '#78350F',
    icon:        Smartphone,
  },
  {
    id:          'airtel',
    name:        'Airtel Money',
    description: 'USSD push to your Airtel number',
    accentColor: '#E4002B',
    textColor:   '#991B1B',
    icon:        Smartphone,
  },
  {
    id:          'card',
    name:        'Debit / Credit Card',
    description: 'Secure card payment via DPO Pay',
    accentColor: '#2563EB',
    textColor:   '#1D4ED8',
    icon:        CardIcon,
  },
  {
    id:          'bank',
    name:        'Bank Transfer',
    description: 'Direct deposit or wire transfer',
    accentColor: '#64748B',
    textColor:   '#475569',
    icon:        Building2,
  },
] as const

type MethodId = typeof METHODS[number]['id']

// ── Dev constant ──────────────────────────────────────────────────────────────

const DEV_INSTITUTION_NAME = 'StackForgeAI University'

// ── Bank details (read-only) ──────────────────────────────────────────────────

const BANK_DETAILS = [
  { label: 'Bank',           value: 'Bank of Kigali' },
  { label: 'Account Name',   value: `${DEV_INSTITUTION_NAME} — Student Fees` },
  { label: 'Account Number', value: '0001234567890', mono: true },
  { label: 'Branch',         value: 'Kigali City Centre' },
  { label: 'Reference',      value: 'SFE-2024-0042', mono: true },
]

// ─────────────────────────────────────────────────────────────────────────────

function MakePaymentPage() {
  const navigate = useNavigate()
  const [selected, setSelected]   = useState<MethodId | null>(null)
  const [phone, setPhone]         = useState('+250 ')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry]       = useState('')
  const [cvv, setCvv]             = useState('')
  const [loading, setLoading]       = useState(false)
  const [descOption,   setDescOption]   = useState('balance')
  const [customDesc,   setCustomDesc]   = useState('')
  const [customAmount, setCustomAmount] = useState('')

  const method = METHODS.find((m) => m.id === selected)

  const selectedFeeOption = FEE_OPTIONS.find(o => o.value === descOption)!
  const activeAmount: number = descOption === 'other'
    ? (parseInt(customAmount.replace(/\D/g, ''), 10) || 0)
    : (selectedFeeOption.amount ?? 0)
  const activeLabel = descOption === 'other'
    ? (customDesc || 'Other')
    : selectedFeeOption.label

  const canPay = selected !== null && (
    selected === 'bank' ? true :
    selected === 'card' ? (cardNumber.length >= 16 && expiry.length >= 5 && cvv.length >= 3) :
    phone.replace(/\D/g, '').length >= 10
  )

  const handlePay = async () => {
    if (!canPay || loading) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1400))
    setLoading(false)
    void navigate({ to: '/student/receipt' })
  }

  return (
    <AppShell
      navItems={STUDENT_NAV}
      pageTitle="Make Payment"
      userName="Jean-Paul Mugisha"
      userRole="Student"
      userInitials="JM"
      unreadCount={3}
      infoCardLabel="STUDENT ID"
      infoCardValue="SFE-2024-0042"
      infoCardSubtext="Year 1"
    >
      <div className="px-8 py-8 animate-fade-up">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 mb-6 t-caption" style={{ color: 'var(--muted-foreground)' }}>
          <Link to="/student/fees" className="hover:underline" style={{ color: 'var(--muted-foreground)' }}>
            Fee Statement
          </Link>
          <ChevronRight style={{ width: 12, height: 12 }} />
          <span style={{ color: 'var(--foreground)' }}>Make Payment</span>
        </nav>

        {/* Section header */}
        <div className="mb-8">
          <h1
            className="t-h1 mb-1"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}
          >
            Make Payment
          </h1>
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
            Choose your preferred payment method to complete your fee payment.
          </p>
        </div>

        {/* Centred card */}
        <div
          className="mx-auto"
          style={{
            maxWidth: 560,
            backgroundColor: 'var(--card)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border)',
            padding: 32,
          }}
        >
          {/* Payment description */}
          <div className="mb-4">
            <p className="t-label mb-2" style={{ color: 'var(--muted-foreground)' }}>PAYMENT DESCRIPTION</p>
            <Select value={descOption} onValueChange={setDescOption}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FEE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Custom fields — expand when 'Other' is selected */}
            <div
              style={{
                maxHeight: descOption === 'other' ? 200 : 0,
                overflow: 'hidden',
                transition: 'max-height 200ms ease-out',
              }}
            >
              <div className="flex flex-col gap-3 mt-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="custom-desc">Payment description</Label>
                  <Input
                    id="custom-desc"
                    placeholder="Enter payment description"
                    value={customDesc}
                    onChange={e => setCustomDesc(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="custom-amount">Amount (RWF)</Label>
                  <Input
                    id="custom-amount"
                    type="number"
                    placeholder="Enter amount"
                    value={customAmount}
                    onChange={e => setCustomAmount(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Separator */}
          <div style={{ height: 1, backgroundColor: 'var(--border)', marginBottom: 16 }} />

          {/* Fee summary */}
          <div
            className="rounded-xl px-5 py-4 mb-6"
            style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}
          >
            <p className="t-label mb-2" style={{ color: 'var(--muted-foreground)' }}>FEE SUMMARY</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{activeLabel}</p>
                <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Due {DUE_DATE}</p>
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.375rem',
                  fontWeight: 700,
                  color: 'var(--foreground)',
                  letterSpacing: '-0.015em',
                }}
              >
                {formatCurrency(activeAmount)}
              </p>
            </div>
          </div>

          {/* Payment method selector */}
          <div className="mb-6">
            <p className="t-label mb-3" style={{ color: 'var(--muted-foreground)' }}>PAYMENT METHOD</p>
            <div className="grid grid-cols-2 gap-3">
              {METHODS.map((m) => {
                const active = selected === m.id
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelected(m.id)}
                    className="flex flex-col items-start p-4 rounded-xl text-left transition-all duration-150"
                    style={{
                      border: active ? '1.5px solid rgba(32,244,78,0.5)' : '1px solid var(--border)',
                      backgroundColor: active ? 'rgba(32,244,78,0.04)' : 'var(--card)',
                    }}
                  >
                    <div
                      className="flex items-center justify-center rounded-lg mb-3"
                      style={{ width: 32, height: 32, backgroundColor: m.accentColor + '20' }}
                    >
                      <m.icon style={{ width: 16, height: 16, color: m.accentColor }} />
                    </div>
                    <p
                      className="text-sm font-semibold mb-0.5"
                      style={{ color: active ? 'var(--foreground)' : 'var(--foreground)' }}
                    >
                      {m.name}
                    </p>
                    <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
                      {m.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Dynamic form */}
          {selected && (
            <div className="mb-8">
              <div style={{ height: 1, backgroundColor: 'var(--border)', marginBottom: 24 }} />
              <DynamicForm
                method={selected}
                phone={phone} setPhone={setPhone}
                cardNumber={cardNumber} setCardNumber={setCardNumber}
                expiry={expiry} setExpiry={setExpiry}
                cvv={cvv} setCvv={setCvv}
              />
            </div>
          )}

          {/* Pay button */}
          <Button
            onClick={handlePay}
            disabled={!canPay || loading}
            className="w-full h-12 font-semibold text-base transition-transform duration-150 hover:-translate-y-px active:translate-y-0"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Processing payment…
              </span>
            ) : (
              `Pay ${formatCurrency(activeAmount)}`
            )}
          </Button>

          <p className="text-center t-caption mt-4" style={{ color: 'var(--muted-foreground)' }}>
            Payments are processed securely via DPO Pay. Your data is encrypted and never stored.
          </p>
        </div>

      </div>
    </AppShell>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic form by payment method
// ─────────────────────────────────────────────────────────────────────────────

function DynamicForm({
  method, phone, setPhone, cardNumber, setCardNumber, expiry, setExpiry, cvv, setCvv,
}: {
  method: MethodId
  phone: string; setPhone: (v: string) => void
  cardNumber: string; setCardNumber: (v: string) => void
  expiry: string; setExpiry: (v: string) => void
  cvv: string; setCvv: (v: string) => void
}) {
  if (method === 'momo' || method === 'airtel') {
    const label = method === 'momo' ? 'MTN MoMo number' : 'Airtel Money number'
    const placeholder = method === 'momo' ? '+250 788 000 000' : '+250 730 000 000'
    return (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">{label}</Label>
        <Input
          id="phone"
          type="tel"
          placeholder={placeholder}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoFocus
        />
        <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
          You will receive a USSD push notification to approve this payment.
        </p>
      </div>
    )
  }

  if (method === 'card') {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cardNumber">Card number</Label>
          <Input
            id="cardNumber"
            placeholder="1234 5678 9012 3456"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
            maxLength={16}
            autoFocus
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="expiry">Expiry date</Label>
            <Input
              id="expiry"
              placeholder="MM / YY"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              maxLength={7}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cvv">CVV</Label>
            <Input
              id="cvv"
              type="password"
              placeholder="•••"
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
              maxLength={4}
            />
          </div>
        </div>
      </div>
    )
  }

  if (method === 'bank') {
    return (
      <div>
        <p className="text-sm mb-4" style={{ color: 'var(--foreground)' }}>
          Transfer the exact amount to the following bank account. Include your student ID as the payment reference.
        </p>
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--border)' }}
        >
          {BANK_DETAILS.map((row, i) => (
            <div
              key={row.label}
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: i < BANK_DETAILS.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <span className="t-label" style={{ color: 'var(--muted-foreground)' }}>{row.label}</span>
              <span
                className="text-sm font-medium"
                style={{
                  color: 'var(--foreground)',
                  fontFamily: row.mono ? 'var(--font-mono)' : undefined,
                }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
        <p className="t-caption mt-3" style={{ color: 'var(--muted-foreground)' }}>
          Bank transfers may take 1–3 business days. Click "Pay" to notify the bursar once your transfer is complete.
        </p>
      </div>
    )
  }

  return null
}


