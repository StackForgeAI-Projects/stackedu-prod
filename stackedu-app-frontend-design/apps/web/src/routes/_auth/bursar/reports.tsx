import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  FileText, Calendar, BookOpen, BarChart2 as BarChart2Icon, Download, TrendingUp, AlertCircle, CreditCard,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { AppShell } from '@/components/AppShell'
import { StatTile } from '@/components/StatTile'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import { BURSAR, BURSAR_NAV, AREA_CHART_DATA } from '@/data/bursar'
import { toast } from 'sonner'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/bursar/reports')({
  component: ReportsPage,
})

type ReportType = 'daily' | 'monthly' | 'semester' | 'annual'

interface ReportCard {
  type:        ReportType
  icon:        typeof FileText
  title:       string
  description: string
}

const REPORT_CARDS: ReportCard[] = [
  { type: 'daily',    icon: FileText,       title: 'Daily Summary',   description: 'End-of-day payment summary with method breakdown'      },
  { type: 'monthly',  icon: Calendar,       title: 'Monthly Report',  description: 'Monthly collections, outstanding balances, and trends'  },
  { type: 'semester', icon: BookOpen,       title: 'Semester Report', description: 'Full semester financial overview by programme'          },
  { type: 'annual',   icon: BarChart2Icon,  title: 'Annual Report',   description: 'Complete academic year financial analysis'             },
]

const BREAKDOWN_DATA = [
  { name: 'Computer Science',       collected: 28400000, outstanding: 5200000, students: 45 },
  { name: 'Business Administration',collected: 16800000, outstanding: 3550000, students: 38 },
]

const formatYAxis = (v: number) =>
  v >= 1000000 ? `${(v / 1000000).toFixed(0)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)

// ─────────────────────────────────────────────────────────────────────────────

function ReportsPage() {
  const [activeType, setActiveType]   = useState<ReportType | null>(null)
  const [isGenerated, setIsGenerated] = useState(false)
  const [generating, setGenerating]   = useState(false)

  // Config state per type
  const [dailyDate, setDailyDate]         = useState('')
  const [monthlyMonth, setMonthlyMonth]   = useState('')
  const [semester, setSemester]           = useState('Semester 1 2024/2025')
  const [annualYear, setAnnualYear]       = useState('2024/2025')
  const [progFilter, setProgFilter]       = useState('all')

  const handleCardClick = (type: ReportType) => {
    if (activeType === type) {
      setActiveType(null)
      setIsGenerated(false)
    } else {
      setActiveType(type)
      setIsGenerated(false)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    await new Promise((r) => setTimeout(r, 1200))
    setGenerating(false)
    setIsGenerated(true)
  }

  const reportTitle =
    activeType === 'daily'    ? 'Daily Summary Report'    :
    activeType === 'monthly'  ? 'Monthly Financial Report' :
    activeType === 'semester' ? 'Semester Financial Report':
    'Annual Financial Report'

  return (
    <AppShell
      navItems={BURSAR_NAV}
      pageTitle="Financial Reports"
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

          {/* Section header */}
          <div className="mb-8">
            <h1
              className="t-h1"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}
            >
              Financial Reports
            </h1>
            <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
              Generate and export financial reports by period, programme, or payment channel
            </p>
          </div>

          {/* Report type cards — 2×2 grid */}
          <div className="grid grid-cols-2 gap-4 mb-6" style={{ maxWidth: 800 }}>
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
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="flex items-center justify-center rounded-xl"
                      style={{
                        width: 44,
                        height: 44,
                        backgroundColor: isActive ? 'rgba(32,244,78,0.12)' : 'var(--muted)',
                      }}
                    >
                      <Icon style={{ width: 20, height: 20, color: isActive ? 'var(--brand)' : 'var(--muted-foreground)' }} />
                    </div>
                  </div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: isActive ? '#FFFFFF' : 'var(--foreground)',
                      marginBottom: 6,
                    }}
                  >
                    {card.title}
                  </h3>
                  <p className="text-sm" style={{ color: isActive ? 'var(--ink-muted)' : 'var(--muted-foreground)', lineHeight: 1.5, marginBottom: 12 }}>
                    {card.description}
                  </p>
                  <span
                    className="text-xs font-semibold transition-opacity hover:opacity-70"
                    style={{ color: isActive ? 'var(--brand)' : 'var(--success)' }}
                  >
                    {isActive ? 'Configuring →' : 'Generate →'}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Config panel — shown when a card is selected */}
          {activeType && (
            <div
              className="animate-fade-up mb-6"
              style={{
                backgroundColor: 'var(--card)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
                padding: 24,
                maxWidth: 800,
              }}
            >
              <h3
                className="t-h3 mb-5"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '1rem' }}
              >
                Configure {reportTitle}
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-5">
                {/* Date / period selector */}
                {activeType === 'daily' && (
                  <div>
                    <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Report Date</label>
                    <input
                      type="date"
                      value={dailyDate}
                      onChange={(e) => setDailyDate(e.target.value)}
                      className="w-full text-sm rounded-xl px-3 py-2.5 outline-none"
                      style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}
                    />
                  </div>
                )}
                {activeType === 'monthly' && (
                  <div>
                    <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Month</label>
                    <input
                      type="month"
                      value={monthlyMonth}
                      onChange={(e) => setMonthlyMonth(e.target.value)}
                      className="w-full text-sm rounded-xl px-3 py-2.5 outline-none"
                      style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}
                    />
                  </div>
                )}
                {activeType === 'semester' && (
                  <div>
                    <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Semester</label>
                    <Select value={semester} onValueChange={setSemester}>
                      <SelectTrigger className="w-full text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Semester 1 2024/2025">Semester 1 · 2024/2025</SelectItem>
                        <SelectItem value="Semester 2 2024/2025">Semester 2 · 2024/2025</SelectItem>
                        <SelectItem value="Semester 1 2023/2024">Semester 1 · 2023/2024</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {activeType === 'annual' && (
                  <div>
                    <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Academic Year</label>
                    <Select value={annualYear} onValueChange={setAnnualYear}>
                      <SelectTrigger className="w-full text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024/2025">2024/2025</SelectItem>
                        <SelectItem value="2023/2024">2023/2024</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Programme filter */}
                <div>
                  <label className="t-label block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Programme</label>
                  <Select value={progFilter} onValueChange={setProgFilter}>
                    <SelectTrigger className="w-full text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Programmes</SelectItem>
                      <SelectItem value="Computer Science">Computer Science</SelectItem>
                      <SelectItem value="Business Administration">Business Administration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
                style={{
                  backgroundColor: 'var(--brand)',
                  color: 'var(--brand-ink)',
                  border: 'none',
                  cursor: generating ? 'not-allowed' : 'pointer',
                  opacity: generating ? 0.7 : 1,
                }}
              >
                {generating ? (
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
          )}

          {/* Generated report */}
          {isGenerated && activeType && (
            <div className="animate-fade-up" style={{ maxWidth: 1100 }}>

              {/* Report meta */}
              <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                <div>
                  <h2
                    style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.015em', marginBottom: 4 }}
                  >
                    {reportTitle}
                  </h2>
                  <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
                    Generated on {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {BURSAR.institution}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150"
                    style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}
                    onClick={() => toast.success('PDF export started.')}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                  >
                    <Download style={{ width: 14, height: 14 }} />
                    Export PDF
                  </button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.success('CSV export started.')}>
                    <Download style={{ width: 14, height: 14 }} />
                    Export CSV
                  </Button>
                </div>
              </div>

              {/* Summary StatTiles */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <StatTile
                  icon={TrendingUp}
                  iconColor="var(--brand)" iconBg="rgba(32,244,78,0.08)"
                  label="TOTAL COLLECTED"
                  value={formatCurrency(45200000)}
                  delta="Jan 2025"
                  deltaColor="var(--muted-foreground)"
                  animationDelay={0}
                />
                <StatTile
                  icon={AlertCircle}
                  iconColor="var(--warning)" iconBg="var(--warning-bg)"
                  label="TOTAL OUTSTANDING"
                  value={formatCurrency(8750000)}
                  delta="47 students"
                  deltaColor="var(--warning)"
                  animationDelay={60}
                />
                <StatTile
                  icon={CreditCard}
                  iconColor="var(--success)" iconBg="var(--success-bg)"
                  label="COLLECTION RATE"
                  value="83.8%"
                  delta="+2.1% vs last month"
                  deltaColor="var(--success)"
                  animationDelay={120}
                />
                <StatTile
                  icon={FileText}
                  iconColor="var(--info)" iconBg="var(--info-bg)"
                  label="TOTAL TRANSACTIONS"
                  value="127"
                  delta="Paid + Pending + Failed"
                  deltaColor="var(--muted-foreground)"
                  animationDelay={180}
                />
              </div>

              {/* Area chart */}
              <div
                className="mb-6"
                style={{
                  backgroundColor: 'var(--card)',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                  padding: 24,
                }}
              >
                <h3 className="t-h3 mb-5" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '1rem' }}>
                  Collections Over Period
                </h3>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={AREA_CHART_DATA}>
                    <defs>
                      <linearGradient id="brandGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#20F44E" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#20F44E" stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-sans)' }}
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
                      formatter={(v: number) => [formatCurrency(v), 'Collected']}
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: 12,
                        fontSize: 13,
                        boxShadow: 'var(--shadow-md)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="var(--ink)"
                      strokeWidth={2}
                      fill="url(#brandGrad)"
                      dot={false}
                      activeDot={{ r: 4, fill: 'var(--brand)', stroke: 'var(--ink)', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Breakdown table */}
              <div
                style={{
                  backgroundColor: 'var(--card)',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--border)' }}>
                  <h3
                    className="t-h3 mb-4"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '1rem' }}
                  >
                    Breakdown by Programme
                  </h3>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Programme', 'Students', 'Total Collected', 'Outstanding', 'Collection Rate'].map((h) => (
                        <th
                          key={h}
                          className="t-label text-left"
                          style={{ color: 'var(--muted-foreground)', padding: '12px 24px', fontWeight: 600 }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {BREAKDOWN_DATA.map((row, i) => {
                      const rate = Math.round((row.collected / (row.collected + row.outstanding)) * 100)
                      return (
                        <tr
                          key={row.name}
                          style={{ borderBottom: i < BREAKDOWN_DATA.length - 1 ? '1px solid var(--border)' : 'none' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--muted)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <td className="text-sm" style={{ color: 'var(--foreground)', padding: '14px 24px', fontWeight: 500 }}>{row.name}</td>
                          <td className="text-sm" style={{ color: 'var(--muted-foreground)', padding: '14px 24px' }}>{row.students}</td>
                          <td className="text-sm" style={{ color: 'var(--foreground)', padding: '14px 24px', fontWeight: 600 }}>{formatCurrency(row.collected)}</td>
                          <td className="text-sm" style={{ color: 'var(--warning)', padding: '14px 24px', fontWeight: 500 }}>{formatCurrency(row.outstanding)}</td>
                          <td style={{ padding: '14px 24px' }}>
                            <div className="flex items-center gap-2">
                              <div style={{ flex: 1, height: 5, backgroundColor: 'var(--muted)', borderRadius: 9999, overflow: 'hidden' }}>
                                <div style={{ width: `${rate}%`, height: '100%', backgroundColor: 'var(--brand)', borderRadius: 9999 }} />
                              </div>
                              <span className="text-sm font-semibold" style={{ color: 'var(--foreground)', minWidth: 36 }}>{rate}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>
      </div>
    </AppShell>
  )
}
