import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  LayoutDashboard, BookOpen, BarChart2, CreditCard, Library, Bell,
  TrendingUp, AlertCircle, Search, Receipt,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { StatTile } from '@/components/StatTile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/student/fees')({
  component: FeeStatementPage,
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

const TOTAL_FEES   = 450_000
const AMOUNT_PAID  = 405_000
const OUTSTANDING  = TOTAL_FEES - AMOUNT_PAID

const PAYMENT_HISTORY = [
  {
    id: 'TXN-2024-001', date: '05 Sep 2024',
    description: 'Tuition Fee — Semester 1',
    amount: 200_000, method: 'MTN MoMo',   status: 'Paid',
  },
  {
    id: 'TXN-2024-002', date: '06 Sep 2024',
    description: 'Administrative Levy — Semester 1',
    amount:  50_000, method: 'Airtel Money', status: 'Paid',
  },
  {
    id: 'TXN-2024-003', date: '10 Sep 2024',
    description: 'Student Union Fee',
    amount:  25_000, method: 'Card',         status: 'Paid',
  },
  {
    id: 'TXN-2024-004', date: '15 Sep 2024',
    description: 'Tuition Fee — Partial 2',
    amount: 130_000, method: 'Bank Transfer', status: 'Paid',
  },
  {
    id: 'TXN-2024-005', date: '01 Oct 2024',
    description: 'Tuition Fee — Remaining Balance',
    amount:  45_000, method: 'MTN MoMo',   status: 'Pending',
  },
]

const METHOD_COLORS: Record<string, { bg: string; color: string }> = {
  'MTN MoMo':     { bg: '#FEF9C3', color: '#92400E' },
  'Airtel Money': { bg: '#FEE2E2', color: '#991B1B' },
  'Card':         { bg: 'var(--info-bg)',    color: 'var(--info)'    },
  'Bank Transfer':{ bg: 'var(--muted)',      color: 'var(--muted-foreground)' },
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  Paid:    { bg: 'var(--success-bg)', color: 'var(--success)' },
  Pending: { bg: 'var(--warning-bg)', color: 'var(--warning)' },
  Failed:  { bg: 'var(--error-bg)',   color: 'var(--error)'   },
}

// ─────────────────────────────────────────────────────────────────────────────

function FeeStatementPage() {
  const [search, setSearch]         = useState('')
  const [dateFilter, setDateFilter] = useState('')

  const filtered = PAYMENT_HISTORY.filter((t) => {
    const q = search.toLowerCase()
    return (
      t.description.toLowerCase().includes(q) ||
      t.method.toLowerCase().includes(q)       ||
      t.id.toLowerCase().includes(q)
    )
  })

  return (
    <AppShell
      navItems={STUDENT_NAV}
      pageTitle="Fee Statement"
      userName="Jean-Paul Mugisha"
      userRole="Student"
      userInitials="JM"
      unreadCount={3}
      infoCardLabel="STUDENT ID"
      infoCardValue="SFE-2024-0042"
      infoCardSubtext="Year 1"
    >
      <div className="px-8 py-8 max-w-[1100px] mx-auto animate-fade-up">

        {/* Section header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1
              className="t-h1 mb-1"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}
            >
              Fee Statement
            </h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
              Academic Year 2024/2025
            </p>
          </div>
          {OUTSTANDING > 0 && (
            <Link to="/student/payment">
              <Button className="font-semibold transition-transform duration-150 hover:-translate-y-px active:translate-y-0">
                Make Payment
              </Button>
            </Link>
          )}
        </div>

        {/* Outstanding alert */}
        {OUTSTANDING > 0 && (
          <div
            className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm mb-6"
            style={{
              backgroundColor: 'var(--warning-bg)',
              border: '1px solid var(--warning)',
              color: 'var(--warning)',
            }}
          >
            <AlertCircle style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1 }} />
            <span>
              You have an outstanding balance of{' '}
              <strong>{formatCurrency(OUTSTANDING)}</strong> due by <strong>31 January 2025</strong>.
              Late payment may result in a fee hold on your account.
            </span>
          </div>
        )}

        {/* Stat tiles */}
        <div className="grid grid-cols-3 gap-5 mb-8">
          <StatTile
            icon={CreditCard}
            iconColor="var(--brand)"
            iconBg="rgba(32,244,78,0.08)"
            label="TOTAL FEES"
            value={formatCurrency(TOTAL_FEES)}
            delta="Semester 1 · 2024/2025"
            deltaColor="var(--muted-foreground)"
            animationDelay={0}
          />
          <StatTile
            icon={TrendingUp}
            iconColor="var(--success)"
            iconBg="var(--success-bg)"
            label="AMOUNT PAID"
            value={formatCurrency(AMOUNT_PAID)}
            delta={`${Math.round((AMOUNT_PAID / TOTAL_FEES) * 100)}% of total`}
            deltaColor="var(--success)"
            animationDelay={60}
          />
          <StatTile
            icon={AlertCircle}
            iconColor="var(--warning)"
            iconBg="var(--warning-bg)"
            label="OUTSTANDING BALANCE"
            value={formatCurrency(OUTSTANDING)}
            delta="Due 31 Jan 2025"
            deltaColor="var(--warning)"
            animationDelay={120}
            footer={
              OUTSTANDING > 0 ? (
                <Link
                  to="/student/payment"
                  className="text-xs font-semibold mt-2 transition-opacity hover:opacity-70 w-fit"
                  style={{ color: 'var(--success)' }}
                >
                  Pay now →
                </Link>
              ) : null
            }
          />
        </div>

        {/* Payment history table */}
        <div
          style={{
            backgroundColor: 'var(--card)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border)',
            overflow: 'hidden',
          }}
        >
          {/* Toolbar */}
          <div
            className="flex items-center gap-3 px-6 py-4"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <h3 className="t-h3 flex-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
              Payment History
            </h3>
            <div className="relative">
              <Search
                style={{
                  position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                  width: 14, height: 14, color: 'var(--muted-foreground)',
                }}
              />
              <Input
                placeholder="Search transactions…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 w-52"
              />
            </div>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-40"
              placeholder="Filter by date"
            />
          </div>

          {/* Table header */}
          <div
            className="grid px-6 py-3"
            style={{
              gridTemplateColumns: '110px 1fr 130px 120px 100px 80px',
              borderBottom: '1px solid var(--border)',
              backgroundColor: 'var(--muted)',
            }}
          >
            {['DATE', 'DESCRIPTION', 'AMOUNT', 'METHOD', 'STATUS', ''].map((h, i) => (
              <span key={i} className="t-label" style={{ color: 'var(--muted-foreground)' }}>{h}</span>
            ))}
          </div>

          {/* Rows */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt style={{ width: 28, height: 28, color: 'var(--muted-foreground)', marginBottom: 10 }} />
              <p className="t-body font-medium mb-1" style={{ color: 'var(--foreground)' }}>No transactions found</p>
              <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>Try adjusting your search filter.</p>
            </div>
          ) : (
            filtered.map((txn, i) => {
              const mc = METHOD_COLORS[txn.method] ?? METHOD_COLORS['Bank Transfer']
              const sc = STATUS_COLORS[txn.status] ?? STATUS_COLORS['Pending']
              const isLast = i === filtered.length - 1
              return (
                <TxnRow key={txn.id} txn={txn} mc={mc} sc={sc} isLast={isLast} />
              )
            })
          )}
        </div>

      </div>
    </AppShell>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Transaction row
// ─────────────────────────────────────────────────────────────────────────────

function TxnRow({
  txn, mc, sc, isLast,
}: {
  txn: typeof PAYMENT_HISTORY[number]
  mc: { bg: string; color: string }
  sc: { bg: string; color: string }
  isLast: boolean
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="grid items-center px-6"
      style={{
        gridTemplateColumns: '110px 1fr 130px 120px 100px 80px',
        paddingTop: 14,
        paddingBottom: 14,
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        backgroundColor: hovered ? 'var(--muted)' : 'transparent',
        transition: 'background-color 150ms ease-out',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{txn.date}</span>
      <div>
        <p className="text-sm" style={{ color: 'var(--foreground)' }}>{txn.description}</p>
        <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          {txn.id}
        </p>
      </div>
      <span className="text-sm font-semibold" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-mono)' }}>
        {formatCurrency(txn.amount)}
      </span>
      <span
        className="t-label px-2 py-0.5 w-fit"
        style={{ backgroundColor: mc.bg, color: mc.color, borderRadius: 'var(--radius-sm)' }}
      >
        {txn.method}
      </span>
      <span
        className="t-label px-2 py-0.5 w-fit"
        style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)' }}
      >
        {txn.status}
      </span>
      {txn.status === 'Paid' ? (
        <Link to="/student/receipt">
          <button
            className="flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70"
            style={{ color: 'var(--success)' }}
          >
            <Receipt style={{ width: 12, height: 12 }} />
            Receipt
          </button>
        </Link>
      ) : (
        <span />
      )}
    </div>
  )
}


