import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import type { BursarDashboard, BursarPaymentRow } from '@stackedu/shared'
import {
  TrendingUp, AlertCircle, CreditCard, Lock, Download, ChevronRight,
  Sparkles, RotateCcw, Send,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useState } from 'react'
import { BursarShell } from '@/components/BursarShell'
import { PortalErrorPanel } from '@/components/PortalErrorPanel'
import { DataTable } from '@/components/DataTable'
import { StatTile } from '@/components/StatTile'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import { getBursarDashboard, bursarDashboardQueryKey } from '@/lib/api/bursar'
import { BURSAR_GUIDES } from '@/lib/bursar-guides'
import { accountStatusColors, paymentMethodColors, paymentMethodLabel, paymentStatusLabel } from '@/lib/bursar-display'

export const Route = createFileRoute('/_auth/bursar/dashboard')({
  component: BursarDashboardPage,
})

function BursarDashboardPage() {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: bursarDashboardQueryKey,
    queryFn: getBursarDashboard,
  })

  const today = new Date()
  const hours = today.getHours()
  const greeting = hours < 12 ? 'Good morning' : hours < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <BursarShell pageTitle="Dashboard" guide={BURSAR_GUIDES.dashboard}>
      {isPending ? (
        <p className="t-body px-4 sm:px-8 py-8" style={{ color: 'var(--muted-foreground)' }}>Loading dashboard…</p>
      ) : error ? (
        <PortalErrorPanel error={error} onRetry={() => refetch()} />
      ) : data ? (
        <DashboardBody data={data} greeting={greeting} dateStr={dateStr} />
      ) : null}
    </BursarShell>
  )
}

function DashboardBody({
  data,
  greeting,
  dateStr,
}: {
  data: BursarDashboard
  greeting: string
  dateStr: string
}) {
  const deltaToday = data.stats.collectedToday - data.stats.collectedYesterday

  return (
    <div className="page-split">
      <div className="page-split-main animate-fade-up">
        <div className="mb-8">
          <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>
            {greeting}, {data.profile.firstName} 👋
          </h1>
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>{dateStr}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <StatTile
            icon={TrendingUp}
            iconColor="var(--brand)" iconBg="rgba(var(--brand-rgb),0.08)"
            label="TOTAL COLLECTED TODAY"
            value={formatCurrency(data.stats.collectedToday)}
            delta={`${deltaToday >= 0 ? '+' : ''}${formatCurrency(deltaToday)} from yesterday`}
            deltaColor={deltaToday >= 0 ? 'var(--success)' : 'var(--error)'}
            animationDelay={0}
          />
          <StatTile
            icon={AlertCircle}
            iconColor="var(--warning)" iconBg="var(--warning-bg)"
            label="OUTSTANDING BALANCES"
            value={formatCurrency(data.stats.outstandingBalances)}
            delta={`${data.stats.studentsWithBalance} students with balance`}
            deltaColor="var(--warning)"
            animationDelay={60}
          />
          <StatTile
            icon={CreditCard}
            iconColor="var(--info)" iconBg="var(--info-bg)"
            label="PAYMENTS THIS MONTH"
            value={formatCurrency(data.stats.collectedThisMonth)}
            delta={data.stats.semesterLabel}
            deltaColor="var(--muted-foreground)"
            animationDelay={120}
          />
          <StatTile
            icon={Lock}
            iconColor="var(--error)" iconBg="var(--error-bg)"
            label="FEE HOLDS ACTIVE"
            value={String(data.stats.activeFeeHolds)}
            delta={`${data.stats.activeFeeHolds} students blocked`}
            deltaColor="var(--error)"
            animationDelay={180}
          />
        </div>

        <RecentTransactionsCard transactions={data.recentPayments} />
        <PaymentMethodChart data={data.paymentsByMethod} />
      </div>

      <div className="page-split-aside animate-fade-up" style={{ '--aside-width': '35%', animationDelay: '100ms' } as React.CSSProperties}>
        <QuickActionsCard />
        <AiAssistantCard firstName={data.profile.firstName} />
      </div>
    </div>
  )
}

function RecentTransactionsCard({ transactions }: { transactions: BursarPaymentRow[] }) {
  return (
    <div className="mb-5 animate-fade-up" style={{ animationDelay: '60ms' }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Recent Transactions</h2>
        <Link to="/bursar/ledger" className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--success)' }}>View all →</Link>
      </div>
      <DataTable
        rows={transactions}
        rowKey={(txn) => txn.id}
        searchPlaceholder="Search transactions…"
        empty="No recent transactions."
        defaultPageSize={10}
        columns={[
          {
            id: 'student',
            header: 'Student',
            value: (txn) => txn.studentName,
            cell: (txn) => <span className="text-sm font-medium whitespace-nowrap" style={{ color: 'var(--foreground)' }}>{txn.studentName}</span>,
          },
          {
            id: 'studentId',
            header: 'Student ID',
            value: (txn) => txn.studentNumber,
            cell: (txn) => <span className="t-mono" style={{ color: 'var(--muted-foreground)' }}>{txn.studentNumber}</span>,
          },
          {
            id: 'amount',
            header: 'Amount',
            value: (txn) => txn.amount,
            cell: (txn) => <span className="text-sm font-medium whitespace-nowrap" style={{ color: 'var(--foreground)' }}>{formatCurrency(txn.amount)}</span>,
          },
          {
            id: 'method',
            header: 'Method',
            value: (txn) => paymentMethodLabel(txn.method),
            cell: (txn) => {
              const mc = paymentMethodColors(txn.method)
              return <span className="t-label px-2 py-0.5" style={{ backgroundColor: mc.bg, color: mc.color, borderRadius: 'var(--radius-sm)', whiteSpace: 'nowrap' }}>{paymentMethodLabel(txn.method)}</span>
            },
          },
          {
            id: 'status',
            header: 'Status',
            value: (txn) => paymentStatusLabel(txn.status),
            cell: (txn) => {
              const sc = accountStatusColors(txn.status)
              return <span className="t-label px-2 py-0.5" style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)' }}>{paymentStatusLabel(txn.status)}</span>
            },
          },
          {
            id: 'time',
            header: 'Time',
            value: (txn) => txn.paidAt ?? txn.createdAt,
            cell: (txn) => (
              <span className="t-caption whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>
                {formatDateShort(txn.paidAt ?? txn.createdAt)}
              </span>
            ),
          },
        ]}
      />
    </div>
  )
}

const formatYAxis = (v: number) =>
  v >= 1000000 ? `${(v / 1000000).toFixed(0)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)

function PaymentMethodChart({ data }: { data: BursarDashboard['paymentsByMethod'] }) {
  const chartData = data.map((row) => ({ method: paymentMethodLabel(row.method), total: row.total }))

  return (
    <div className="animate-fade-up" style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24, animationDelay: '120ms' }}>
      <div className="mb-6">
        <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Payment Method Breakdown</h2>
        <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Total collected by method</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} barSize={40}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="method" tick={{ fontSize: 12, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-sans)' }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-sans)' }} axisLine={false} tickLine={false} width={48} />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), 'Total']}
            contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 13, boxShadow: 'var(--shadow-md)' }}
            cursor={{ fill: 'rgba(var(--brand-rgb),0.05)' }}
          />
          <Bar dataKey="total" fill="var(--brand)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function QuickActionsCard() {
  return (
    <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 20 }}>
      <h3 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '0.9375rem' }}>Quick Actions</h3>
      <div className="flex flex-col gap-2.5">
        <Link to="/bursar/receipts">
          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold" style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}>
            <ChevronRight style={{ width: 16, height: 16 }} />Issue receipt
          </button>
        </Link>
        <Link to="/bursar/reports">
          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium" style={{ backgroundColor: 'transparent', color: 'var(--foreground)', border: '1px solid var(--border)', cursor: 'pointer' }}>
            <Download style={{ width: 15, height: 15 }} />Generate report
          </button>
        </Link>
        <Link to="/bursar/reconciliation">
          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium" style={{ backgroundColor: 'transparent', color: 'var(--foreground)', border: '1px solid var(--border)', cursor: 'pointer' }}>
            <CreditCard style={{ width: 15, height: 15 }} />Reconcile payments
          </button>
        </Link>
      </div>
    </div>
  )
}

function AiAssistantCard({ firstName }: { firstName: string }) {
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    { role: 'assistant', text: `Hi ${firstName}! I can help with payment queries, fee structures, and financial reports. What do you need?` },
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

  return (
    <div style={{ backgroundColor: 'var(--ink)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--ink-border)', padding: 20 }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles style={{ width: 16, height: 16, color: 'var(--brand)' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9375rem', fontWeight: 700, color: '#FFFFFF' }}>StackEDU AI</span>
        </div>
        <button onClick={() => setMessages([{ role: 'assistant', text: `Hi ${firstName}! I can help with payment queries, fee structures, and financial reports. What do you need?` }])} style={{ color: 'var(--ink-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
          <RotateCcw style={{ width: 16, height: 16 }} />
        </button>
      </div>
      <div className="flex flex-col gap-2 mb-3" style={{ maxHeight: 140, overflowY: 'auto' }}>
        {messages.map((msg, i) => (
          <div key={i} className="text-sm px-3 py-2.5" style={{ backgroundColor: msg.role === 'assistant' ? 'var(--ink-surface)' : 'rgba(var(--brand-rgb),0.12)', borderRadius: 'var(--radius-md)', color: 'var(--ink-foreground)', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '92%' }}>{msg.text}</div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send() }} placeholder="Ask a question…" className="flex-1 text-sm outline-none" style={{ backgroundColor: 'var(--ink-surface)', border: '1px solid var(--ink-border)', borderRadius: 'var(--radius-md)', padding: '8px 12px', color: 'var(--ink-foreground)' }} />
        <button onClick={send} disabled={!input.trim() || sending} style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer', opacity: input.trim() && !sending ? 1 : 0.5 }}>
          <Send style={{ width: 14, height: 14 }} />
        </button>
      </div>
    </div>
  )
}
