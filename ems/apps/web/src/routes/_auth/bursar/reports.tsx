import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import type { BursarReports } from '@stackedu/shared'
import {
  AlertCircle, BarChart2 as BarChart2Icon, BookOpen, Calendar, CreditCard, Download, FileText, TrendingUp,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { toast } from 'sonner'
import { BursarShell } from '@/components/BursarShell'
import { PortalErrorPanel } from '@/components/PortalErrorPanel'
import { DataTable } from '@/components/DataTable'
import { StatTile } from '@/components/StatTile'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { brandColorValue } from '@/lib/brand-theme'
import { formatCurrency } from '@/lib/utils'
import { bursarReportsQueryKey, getBursarReports } from '@/lib/api/bursar'
import { BURSAR_GUIDES } from '@/lib/bursar-guides'

export const Route = createFileRoute('/_auth/bursar/reports')({
  component: ReportsPage,
})

type ReportType = BursarReports['type']

interface ReportCard {
  type: ReportType
  icon: typeof FileText
  title: string
  description: string
}

const REPORT_CARDS: ReportCard[] = [
  { type: 'daily', icon: FileText, title: 'Daily Summary', description: 'End-of-day payment summary with method breakdown' },
  { type: 'monthly', icon: Calendar, title: 'Monthly Report', description: 'Monthly collections, outstanding balances, and trends' },
  { type: 'semester', icon: BookOpen, title: 'Semester Report', description: 'Full semester financial overview by programme' },
  { type: 'annual', icon: BarChart2Icon, title: 'Annual Report', description: 'Complete academic year financial analysis' },
]

const formatYAxis = (v: number) =>
  v >= 1000000 ? `${(v / 1000000).toFixed(0)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)

function ReportsPage() {
  const [activeType, setActiveType] = useState<ReportType | null>(null)
  const [shouldFetch, setShouldFetch] = useState(false)
  const [dailyDate, setDailyDate] = useState('')
  const [monthlyMonth, setMonthlyMonth] = useState('')
  const [semester, setSemester] = useState('Semester 1 2024/2025')
  const [annualYear, setAnnualYear] = useState('2024/2025')
  const [progFilter, setProgFilter] = useState('all')

  const { data, isPending, error, isFetching, refetch } = useQuery({
    queryKey: bursarReportsQueryKey(activeType ?? 'daily'),
    queryFn: () => getBursarReports(activeType!),
    enabled: shouldFetch && activeType !== null,
  })

  const handleCardClick = (type: ReportType) => {
    if (activeType === type) {
      setActiveType(null)
      setShouldFetch(false)
    } else {
      setActiveType(type)
      setShouldFetch(false)
    }
  }

  const handleGenerate = () => {
    if (!activeType) return
    setShouldFetch(true)
  }

  const reportTitle =
    activeType === 'daily' ? 'Daily Summary Report'
    : activeType === 'monthly' ? 'Monthly Financial Report'
    : activeType === 'semester' ? 'Semester Financial Report'
    : 'Annual Financial Report'

  const breakdownRows = data?.programmeBreakdown.filter(
    (row) => progFilter === 'all' || row.programme === progFilter,
  ) ?? []

  return (
    <BursarShell pageTitle="Financial Reports" guide={BURSAR_GUIDES.reports}>
      <div className="page-scroll">
        <div className="page-body animate-fade-up">
          <div className="mb-8">
            <h1 className="t-h1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>
              Financial Reports
            </h1>
            <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
              Generate and export financial reports by period, programme, or payment channel
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6" style={{ maxWidth: 800 }}>
            {REPORT_CARDS.map((card) => {
              const Icon = card.icon
              const isActive = activeType === card.type
              return (
                <button
                  key={card.type}
                  onClick={() => handleCardClick(card.type)}
                  className="text-left transition-all duration-150"
                  style={{
                    backgroundColor: isActive ? 'var(--ink)' : 'var(--card)',
                    borderRadius: 'var(--radius-xl)',
                    border: isActive ? '1px solid var(--ink-border)' : '1px solid var(--border)',
                    boxShadow: 'var(--shadow-sm)',
                    padding: 24,
                    cursor: 'pointer',
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center justify-center rounded-xl" style={{ width: 44, height: 44, backgroundColor: isActive ? 'rgba(var(--brand-rgb),0.12)' : 'var(--muted)' }}>
                      <Icon style={{ width: 20, height: 20, color: isActive ? 'var(--brand)' : 'var(--muted-foreground)' }} />
                    </div>
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: isActive ? '#FFFFFF' : 'var(--foreground)', marginBottom: 6 }}>
                    {card.title}
                  </h3>
                  <p className="text-sm" style={{ color: isActive ? 'var(--ink-muted)' : 'var(--muted-foreground)', lineHeight: 1.5, marginBottom: 12 }}>
                    {card.description}
                  </p>
                  <span className="text-xs font-semibold" style={{ color: isActive ? 'var(--brand)' : 'var(--success)' }}>
                    {isActive ? 'Configuring →' : 'Generate →'}
                  </span>
                </button>
              )
            })}
          </div>

          {activeType ? (
            <div className="animate-fade-up mb-6" style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', padding: 24, maxWidth: 800 }}>
              <h3 className="t-h3 mb-5" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '1rem' }}>
                Configure {reportTitle}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                {activeType === 'daily' ? (
                  <div>
                    <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Report Date</label>
                    <input type="date" value={dailyDate} onChange={(e) => setDailyDate(e.target.value)} className="w-full text-sm rounded-xl px-3 py-2.5 outline-none" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)' }} />
                  </div>
                ) : null}
                {activeType === 'monthly' ? (
                  <div>
                    <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Month</label>
                    <input type="month" value={monthlyMonth} onChange={(e) => setMonthlyMonth(e.target.value)} className="w-full text-sm rounded-xl px-3 py-2.5 outline-none" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)' }} />
                  </div>
                ) : null}
                {activeType === 'semester' ? (
                  <div>
                    <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Semester</label>
                    <Select value={semester} onValueChange={setSemester}>
                      <SelectTrigger className="w-full text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Semester 1 2024/2025">Semester 1 · 2024/2025</SelectItem>
                        <SelectItem value="Semester 2 2024/2025">Semester 2 · 2024/2025</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
                {activeType === 'annual' ? (
                  <div>
                    <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Academic Year</label>
                    <Select value={annualYear} onValueChange={setAnnualYear}>
                      <SelectTrigger className="w-full text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024/2025">2024/2025</SelectItem>
                        <SelectItem value="2023/2024">2023/2024</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}

                <div>
                  <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Programme</label>
                  <Select value={progFilter} onValueChange={setProgFilter}>
                    <SelectTrigger className="w-full text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Programmes</SelectItem>
                      {(data?.programmeBreakdown ?? []).map((row) => (
                        <SelectItem key={row.programme} value={row.programme}>{row.programme}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isFetching}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: isFetching ? 'not-allowed' : 'pointer', opacity: isFetching ? 0.7 : 1 }}
              >
                {isFetching ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Generating…
                  </>
                ) : (
                  <>
                    <BarChart2Icon style={{ width: 15, height: 15 }} />
                    Generate report
                  </>
                )}
              </button>
            </div>
          ) : null}

          {shouldFetch && isPending ? (
            <p className="t-body py-8" style={{ color: 'var(--muted-foreground)' }}>Generating report…</p>
          ) : null}

          {shouldFetch && error ? (
            <PortalErrorPanel error={error} onRetry={() => refetch()} />
          ) : null}

          {shouldFetch && data ? (
            <div className="animate-fade-up" style={{ maxWidth: 1100 }}>
              <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.015em', marginBottom: 4 }}>
                    {data.label || reportTitle}
                  </h2>
                  <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
                    Generated on {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold" style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }} onClick={() => toast.success('PDF export started.')}>
                    <Download style={{ width: 14, height: 14 }} />
                    Export PDF
                  </button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.success('CSV export started.')}>
                    <Download style={{ width: 14, height: 14 }} />
                    Export CSV
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatTile icon={TrendingUp} iconColor="var(--brand)" iconBg="rgba(var(--brand-rgb),0.08)" label="TOTAL COLLECTED" value={formatCurrency(data.totalCollected)} delta={data.label} deltaColor="var(--muted-foreground)" animationDelay={0} />
                <StatTile icon={AlertCircle} iconColor="var(--warning)" iconBg="var(--warning-bg)" label="TOTAL OUTSTANDING" value={formatCurrency(data.totalOutstanding)} delta="Across programmes" deltaColor="var(--warning)" animationDelay={60} />
                <StatTile icon={CreditCard} iconColor="var(--success)" iconBg="var(--success-bg)" label="COLLECTION RATE" value={`${data.successRate}%`} delta="Paid vs total" deltaColor="var(--success)" animationDelay={120} />
                <StatTile icon={FileText} iconColor="var(--info)" iconBg="var(--info-bg)" label="TOTAL TRANSACTIONS" value={String(data.paymentCount)} delta="All payment statuses" deltaColor="var(--muted-foreground)" animationDelay={180} />
              </div>

              <div className="mb-6" style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', padding: 24 }}>
                <h3 className="t-h3 mb-5" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '1rem' }}>
                  Collections Over Period
                </h3>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={data.trend}>
                    <defs>
                      <linearGradient id="brandGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={brandColorValue()} stopOpacity={0.18} />
                        <stop offset="95%" stopColor={brandColorValue()} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-sans)' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-sans)' }} axisLine={false} tickLine={false} width={48} />
                    <Tooltip formatter={(v: number) => [formatCurrency(v), 'Collected']} contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 13, boxShadow: 'var(--shadow-md)' }} />
                    <Area type="monotone" dataKey="amount" stroke="var(--ink)" strokeWidth={2} fill="url(#brandGrad)" dot={false} activeDot={{ r: 4, fill: 'var(--brand)', stroke: 'var(--ink)', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <h3 className="t-h3 mb-3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '1rem' }}>
                Breakdown by Programme
              </h3>
              <DataTable
                rows={breakdownRows}
                rowKey={(row) => row.programme}
                hideSearch
                empty="No programme breakdown."
                defaultPageSize={10}
                columns={[
                  { id: 'name', header: 'Programme', value: (row) => row.programme, cell: (row) => <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{row.programme}</span> },
                  { id: 'students', header: 'Students', value: (row) => row.students, cell: (row) => <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{row.students}</span> },
                  { id: 'collected', header: 'Total Collected', value: (row) => row.collected, cell: (row) => <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{formatCurrency(row.collected)}</span> },
                  { id: 'outstanding', header: 'Outstanding', value: (row) => row.outstanding, cell: (row) => <span className="text-sm font-medium" style={{ color: 'var(--warning)' }}>{formatCurrency(row.outstanding)}</span> },
                  {
                    id: 'rate',
                    header: 'Collection Rate',
                    value: (row) => Math.round((row.collected / (row.collected + row.outstanding)) * 100),
                    cell: (row) => {
                      const rate = Math.round((row.collected / (row.collected + row.outstanding)) * 100)
                      return (
                        <div className="flex items-center gap-2">
                          <div style={{ flex: 1, height: 5, backgroundColor: 'var(--muted)', borderRadius: 9999, overflow: 'hidden' }}>
                            <div style={{ width: `${rate}%`, height: '100%', backgroundColor: 'var(--brand)', borderRadius: 9999 }} />
                          </div>
                          <span className="text-sm font-semibold" style={{ color: 'var(--foreground)', minWidth: 36 }}>{rate}%</span>
                        </div>
                      )
                    },
                  },
                ]}
              />
            </div>
          ) : null}
        </div>
      </div>
    </BursarShell>
  )
}
