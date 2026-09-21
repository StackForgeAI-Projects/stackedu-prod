import { createFileRoute, Link } from '@tanstack/react-router'
import {
  LayoutDashboard, BookOpen, BarChart2, CreditCard, Library, Bell,
  CheckCircle2, Download,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/student/receipt')({
  component: PaymentReceiptPage,
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

// ── Mock receipt data ─────────────────────────────────────────────────────────

const RECEIPT = {
  amount:        45_000,
  transactionId: 'TXN-2025-0112',
  dateTime:      '12 Jan 2025 · 14:32',
  method:        'MTN MoMo',
  description:   'Tuition Fee — Remaining Balance',
  studentId:     'SFE-2024-0042',
  studentName:   'Jean-Paul Mugisha',
  institution:   'StackForgeAI University',
}

// ─────────────────────────────────────────────────────────────────────────────

function PaymentReceiptPage() {
  return (
    <AppShell
      navItems={STUDENT_NAV}
      pageTitle="Payment Receipt"
      userName={RECEIPT.studentName}
      userRole="Student"
      userInitials="JM"
      unreadCount={3}
      infoCardLabel="STUDENT ID"
      infoCardValue={RECEIPT.studentId}
      infoCardSubtext="Year 1"
    >
      <div className="px-8 py-8 flex items-start justify-center animate-fade-up" style={{ minHeight: 'calc(100vh - var(--header-height))' }}>

        <div
          style={{
            width: '100%',
            maxWidth: 520,
            backgroundColor: 'var(--card)',
            borderRadius: 'var(--radius-2xl)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border)',
            padding: 40,
          }}
        >
          {/* ── Success mark ─────────────────────────────────────────────── */}
          <div className="flex flex-col items-center text-center mb-8">
            <div
              className="flex items-center justify-center rounded-2xl mb-5"
              style={{ width: 72, height: 72, backgroundColor: 'var(--success-bg)' }}
            >
              <CheckCircle2 style={{ width: 40, height: 40, color: 'var(--success)' }} />
            </div>
            <h1
              className="t-h1 mb-2"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}
            >
              Payment Successful
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2.25rem',
                fontWeight: 700,
                color: 'var(--brand)',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              {formatCurrency(RECEIPT.amount)}
            </p>
            <p className="t-caption mt-2" style={{ color: 'var(--muted-foreground)' }}>
              Payment confirmed · {RECEIPT.dateTime}
            </p>
          </div>

          {/* Divider with dots */}
          <div className="relative flex items-center justify-center mb-8">
            <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border)' }} />
            <div className="flex gap-1.5 mx-4">
              {[0,1,2].map((i) => (
                <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: 'var(--border)' }} />
              ))}
            </div>
            <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border)' }} />
          </div>

          {/* ── Receipt details ───────────────────────────────────────────── */}
          <div
            className="rounded-xl overflow-hidden mb-8"
            style={{ border: '1px solid var(--border)' }}
          >
            {[
              { label: 'Transaction ID',  value: RECEIPT.transactionId, mono: true  },
              { label: 'Date & Time',      value: RECEIPT.dateTime,      mono: false },
              { label: 'Payment Method',   value: RECEIPT.method,        mono: false },
              { label: 'Fee Description',  value: RECEIPT.description,   mono: false },
              { label: 'Student Name',     value: RECEIPT.studentName,   mono: false },
              { label: 'Student ID',       value: RECEIPT.studentId,     mono: true  },
              { label: 'Institution',      value: RECEIPT.institution,   mono: false },
            ].map((row, i, arr) => (
              <div
                key={row.label}
                className="flex items-center justify-between px-5 py-3.5"
                style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <span className="t-label" style={{ color: 'var(--muted-foreground)' }}>{row.label}</span>
                <span
                  className="text-sm font-medium text-right max-w-[56%]"
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

          {/* Amount summary */}
          <div
            className="flex items-center justify-between px-5 py-4 rounded-xl mb-8"
            style={{ backgroundColor: 'var(--success-bg)', border: '1px solid var(--success)' }}
          >
            <span className="text-sm font-semibold" style={{ color: 'var(--success)' }}>Total Paid</span>
            <span
              className="font-bold"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', color: 'var(--success)' }}
            >
              {formatCurrency(RECEIPT.amount)}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              className="flex-1 gap-2 font-semibold transition-transform duration-150 hover:-translate-y-px active:translate-y-0"
            >
              <Download style={{ width: 15, height: 15 }} />
              Download Receipt
            </Button>
            <Link to="/student/fees" className="flex-1">
              <Button variant="outline" className="w-full font-semibold">
                Back to Fees
              </Button>
            </Link>
          </div>

          {/* Footer note */}
          <p className="text-center t-caption mt-5" style={{ color: 'var(--muted-foreground)' }}>
            A copy of this receipt has been sent to your registered email address.
            Receipt ref: <span style={{ fontFamily: 'var(--font-mono)' }}>{RECEIPT.transactionId}</span>
          </p>
        </div>

      </div>
    </AppShell>
  )
}


