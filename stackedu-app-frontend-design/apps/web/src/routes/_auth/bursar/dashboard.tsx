import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  TrendingUp, AlertCircle, CreditCard, Lock, Download, ChevronRight,
  Sparkles, RotateCcw, Send,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { AppShell } from '@/components/AppShell'
import { StatTile } from '@/components/StatTile'
import { formatCurrency } from '@/lib/utils'
import {
  BURSAR, BURSAR_NAV, TRANSACTIONS, PAYMENT_CHART_DATA, methodColors, statusColors,
} from '@/data/bursar'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/bursar/dashboard')({
  component: BursarDashboardPage,
})

// ─────────────────────────────────────────────────────────────────────────────

function BursarDashboardPage() {
  const today    = new Date()
  const hours    = today.getHours()
  const greeting = hours < 12 ? 'Good morning' : hours < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr  = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const recentTxns = TRANSACTIONS.slice(0, 5)

  return (
    <AppShell
      navItems={BURSAR_NAV}
      pageTitle="Dashboard"
      userName={BURSAR.fullName}
      userRole="Bursar"
      userInitials={BURSAR.initials}
      unreadCount={2}
      infoCardLabel="BURSAR"
      infoCardValue={BURSAR.institution}
      infoCardSubtext="Finance Office"
    >
      <div className="flex" style={{ height: 'calc(100vh - var(--header-height))', overflow: 'hidden' }}>

        {/* ── Main content ────────────────────────────────────────────────── */}
        <div
          className="flex-1 min-w-0 overflow-y-auto animate-fade-up"
          style={{ padding: '32px 24px 48px 32px' }}
        >
          {/* Page header */}
          <div className="mb-8">
            <h1
              className="t-h1 mb-1"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}
            >
              {greeting}, {BURSAR.firstName} 👋
            </h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>{dateStr}</p>
          </div>

          {/* Row 1 — 4 StatTiles */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <StatTile
              icon={TrendingUp}
              iconColor="var(--brand)" iconBg="rgba(32,244,78,0.08)"
              label="TOTAL COLLECTED TODAY"
              value={formatCurrency(2450000)}
              delta={`+${formatCurrency(320000)} from yesterday`}
              deltaColor="var(--success)"
              animationDelay={0}
            />
            <StatTile
              icon={AlertCircle}
              iconColor="var(--warning)" iconBg="var(--warning-bg)"
              label="OUTSTANDING BALANCES"
              value={formatCurrency(8750000)}
              delta="47 students with balance"
              deltaColor="var(--warning)"
              animationDelay={60}
            />
            <StatTile
              icon={CreditCard}
              iconColor="var(--info)" iconBg="var(--info-bg)"
              label="PAYMENTS THIS MONTH"
              value={formatCurrency(45200000)}
              delta="Semester 1 · 2024/2025"
              deltaColor="var(--muted-foreground)"
              animationDelay={120}
            />
            <StatTile
              icon={Lock}
              iconColor="var(--error)" iconBg="var(--error-bg)"
              label="FEE HOLDS ACTIVE"
              value="8"
              delta="8 students blocked"
              deltaColor="var(--error)"
              animationDelay={180}
            />
          </div>

          {/* Recent Transactions */}
          <RecentTransactionsCard transactions={recentTxns} />

          {/* Payment Method Breakdown */}
          <PaymentMethodChart />
        </div>

        {/* ── Right sidebar panel ──────────────────────────────────────────── */}
        <div
          className="flex-shrink-0 overflow-y-auto animate-fade-up"
          style={{
            width: '35%',
            borderLeft: '1px solid var(--border)',
            padding: '32px 24px 48px 20px',
            animationDelay: '100ms',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <QuickActionsCard />
          <AiAssistantCard />
        </div>

      </div>
    </AppShell>
  )
}

// ── Recent Transactions ───────────────────────────────────────────────────────

function RecentTransactionsCard({ transactions }: { transactions: typeof TRANSACTIONS }) {
  return (
    <div
      className="mb-5 animate-fade-up"
      style={{
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border)',
        padding: 24,
        animationDelay: '60ms',
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
          Recent Transactions
        </h2>
        <Link
          to="/bursar/ledger"
          className="text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: 'var(--success)' }}
        >
          View all →
        </Link>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Student', 'Student ID', 'Amount', 'Method', 'Status', 'Time'].map((h) => (
                <th
                  key={h}
                  className="t-label text-left"
                  style={{
                    color: 'var(--muted-foreground)',
                    paddingBottom: 10,
                    borderBottom: '1px solid var(--border)',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    paddingRight: 16,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn, i) => {
              const mc = methodColors(txn.method)
              const sc = statusColors(txn.status)
              return (
                <tr
                  key={txn.id}
                  style={{
                    borderBottom: i < transactions.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--muted)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td className="text-sm" style={{ color: 'var(--foreground)', padding: '14px 16px 14px 0', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {txn.studentName}
                  </td>
                  <td style={{ padding: '14px 16px 14px 0' }}>
                    <span className="t-mono" style={{ color: 'var(--muted-foreground)' }}>{txn.studentId}</span>
                  </td>
                  <td className="text-sm" style={{ color: 'var(--foreground)', padding: '14px 16px 14px 0', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {formatCurrency(txn.amount)}
                  </td>
                  <td style={{ padding: '14px 16px 14px 0' }}>
                    <span
                      className="t-label px-2 py-0.5"
                      style={{ backgroundColor: mc.bg, color: mc.color, borderRadius: 'var(--radius-sm)', whiteSpace: 'nowrap' }}
                    >
                      {txn.method}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px 14px 0' }}>
                    <span
                      className="t-label px-2 py-0.5"
                      style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)' }}
                    >
                      {txn.status}
                    </span>
                  </td>
                  <td className="t-caption" style={{ color: 'var(--muted-foreground)', padding: '14px 0', whiteSpace: 'nowrap' }}>
                    {txn.date} · {txn.time}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Payment Method Chart ──────────────────────────────────────────────────────

const formatYAxis = (v: number) =>
  v >= 1000000 ? `${(v / 1000000).toFixed(0)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)

function PaymentMethodChart() {
  return (
    <div
      className="animate-fade-up"
      style={{
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border)',
        padding: 24,
        animationDelay: '120ms',
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
            Payment Method Breakdown
          </h2>
          <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            Total collected by method — January 2025
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={PAYMENT_CHART_DATA} barSize={40}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="method"
            tick={{ fontSize: 12, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-sans)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-sans)' }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), 'Total']}
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              fontSize: 13,
              boxShadow: 'var(--shadow-md)',
            }}
            cursor={{ fill: 'rgba(32,244,78,0.05)' }}
          />
          <Bar dataKey="total" fill="var(--brand)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Quick Actions Card ────────────────────────────────────────────────────────

function QuickActionsCard() {
  return (
    <div
      style={{
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border)',
        padding: 20,
      }}
    >
      <h3 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '0.9375rem' }}>
        Quick Actions
      </h3>

      <div className="flex flex-col gap-2.5">
        <Link to="/bursar/receipts">
          <button
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
            style={{
              backgroundColor: 'var(--brand)',
              color: 'var(--brand-ink)',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
          >
            <ChevronRight style={{ width: 16, height: 16 }} />
            Issue receipt
          </button>
        </Link>
        <Link to="/bursar/reports">
          <button
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            <Download style={{ width: 15, height: 15 }} />
            Generate report
          </button>
        </Link>
        <Link to="/bursar/reconciliation">
          <button
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            <CreditCard style={{ width: 15, height: 15 }} />
            Reconcile payments
          </button>
        </Link>
      </div>
    </div>
  )
}

// ── AI Assistant Card ─────────────────────────────────────────────────────────

function AiAssistantCard() {
  const [input, setInput]     = useState('')
  const [sending, setSending] = useState(false)
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    { role: 'assistant', text: `Hi ${BURSAR.firstName}! I can help with payment queries, fee structures, and financial reports. What do you need?` },
  ])

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text }])
    setSending(true)
    await new Promise((r) => setTimeout(r, 900))
    setMessages((m) => [...m, { role: 'assistant', text: 'Let me look that up for you. Give me a moment.' }])
    setSending(false)
  }

  const clearChat = () =>
    setMessages([{ role: 'assistant', text: `Hi ${BURSAR.firstName}! I can help with payment queries, fee structures, and financial reports. What do you need?` }])

  return (
    <div
      style={{
        backgroundColor: 'var(--ink)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--ink-border)',
        padding: 20,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles style={{ width: 16, height: 16, color: 'var(--brand)' }} />
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.9375rem',
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '-0.01em',
            }}
          >
            StackEDU AI
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="t-label px-2 py-0.5"
            style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', borderRadius: 'var(--radius-sm)' }}
          >
            LIVE
          </span>
          <button
            onClick={clearChat}
            title="Clear chat"
            style={{ color: 'var(--ink-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
          >
            <RotateCcw style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>
      <p className="t-caption mb-4" style={{ color: 'var(--ink-muted)' }}>
        Ask anything about fees, payments, or student accounts.
      </p>

      {/* Messages */}
      <div className="flex flex-col gap-2 mb-3" style={{ maxHeight: 140, overflowY: 'auto' }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            className="text-sm px-3 py-2.5"
            style={{
              backgroundColor: msg.role === 'assistant' ? 'var(--ink-surface)' : 'rgba(32,244,78,0.12)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--ink-foreground)',
              lineHeight: 1.5,
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '92%',
            }}
          >
            {msg.text}
          </div>
        ))}
        {sending && (
          <div
            className="text-sm px-3 py-2.5"
            style={{ backgroundColor: 'var(--ink-surface)', borderRadius: 'var(--radius-md)', color: 'var(--ink-muted)', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Thinking…
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send() }}
          placeholder="Ask a question…"
          className="flex-1 text-sm outline-none bg-transparent"
          style={{
            backgroundColor: 'var(--ink-surface)',
            border: '1px solid var(--ink-border)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            color: 'var(--ink-foreground)',
          }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || sending}
          className="flex items-center justify-center flex-shrink-0 transition-opacity duration-150"
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            backgroundColor: 'var(--brand)',
            color: 'var(--brand-ink)',
            border: 'none',
            cursor: input.trim() && !sending ? 'pointer' : 'not-allowed',
            opacity: input.trim() && !sending ? 1 : 0.5,
          }}
        >
          <Send style={{ width: 14, height: 14 }} />
        </button>
      </div>
    </div>
  )
}
