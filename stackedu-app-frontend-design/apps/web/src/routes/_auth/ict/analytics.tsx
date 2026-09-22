import { createFileRoute } from '@tanstack/react-router'
import { Download } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area,
} from 'recharts'
import { toast } from 'sonner'
import { AppShell } from '@/components/AppShell'
import { StatTile } from '@/components/StatTile'
import { Users, Activity, UserPlus, Wifi, ShieldAlert, KeyRound, ShieldCheck } from 'lucide-react'
import {
  ICT_MANAGER, ICT_NAV, roleBadgeColors,
  ENROL_BY_PROGRAMME, ENROL_TREND,
  AVG_GPA_BY_PROGRAMME, PASS_RATES_BY_DEPT, DAILY_ACTIVE_USERS,
  ACTIVITY_HEATMAP, HEATMAP_DAYS, TOP_LIBRARY_RESOURCES,
  FAILED_LOGINS_DAILY, TOP_ACTIVE_ADMINS,
} from '@/data/ict'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/ict/analytics')({
  component: AnalyticsPage,
})

// ── Chart tooltip style ───────────────────────────────────────────────────────

const tooltipStyle = {
  contentStyle: { backgroundColor: 'var(--ink)', border: '1px solid var(--ink-border)', borderRadius: 12, color: '#fff', fontSize: 12 },
  itemStyle:    { color: '#fff' },
  labelStyle:   { color: 'var(--ink-muted)', fontWeight: 600 },
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 28, marginBottom: 24 }}>
      <h2 className="t-h3 mb-6" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>{title}</h2>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function AnalyticsPage() {
  const failedLoginsTotal = FAILED_LOGINS_DAILY.reduce((s, d) => s + d.count, 0)

  // Heatmap max value for normalisation
  const hmMax = Math.max(...ACTIVITY_HEATMAP.flat())

  return (
    <AppShell
      navItems={ICT_NAV}
      pageTitle="Analytics"
      userName={ICT_MANAGER.fullName}
      userRole={ICT_MANAGER.role}
      userInitials={ICT_MANAGER.initials}
      unreadCount={3}
      infoCardLabel="ICT MANAGER"
      infoCardValue={ICT_MANAGER.institution}
      infoCardSubtext={ICT_MANAGER.office}
    >
      <div className="animate-fade-up" style={{ padding: '32px 32px 48px' }}>

        {/* Section header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Analytics</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Institution-wide performance overview</p>
          </div>
          <div className="flex items-center gap-3">
            <select style={{ fontSize: '0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '8px 12px', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: 'pointer' }}>
              <option>2025/2026 Academic Year</option>
              <option>2024/2025 Academic Year</option>
            </select>
            <button onClick={() => toast.success('Report exported.')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150"
              style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card)' }}>
              <Download style={{ width: 15, height: 15 }} /> Export report
            </button>
          </div>
        </div>

        {/* Section 1 — Platform Overview */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Platform Overview</h2>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatTile icon={Users}    iconColor="var(--brand)"   iconBg="rgba(32,244,78,0.08)"  label="TOTAL USERS"           value="1,389"    delta="All roles"              deltaColor="var(--muted-foreground)" animationDelay={0}   />
            <StatTile icon={Activity} iconColor="var(--brand)"   iconBg="rgba(32,244,78,0.08)"  label="ACTIVE THIS MONTH"     value="1,204"    delta="87% of total users"     deltaColor="var(--success)"          animationDelay={60}  />
            <StatTile icon={UserPlus} iconColor="var(--success)" iconBg="var(--success-bg)"     label="NEW REGISTRATIONS"     value="42"       delta="This month"             deltaColor="var(--success)"          animationDelay={120} />
            <StatTile icon={Wifi}     iconColor="var(--success)" iconBg="var(--success-bg)"     label="SYSTEM UPTIME"         value="99.7%"    delta="Last 30 days"           deltaColor="var(--success)"          animationDelay={180} />
          </div>
        </div>

        {/* Section 2 — Enrollment Analytics */}
        <Section title="Enrollment Analytics">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="t-label mb-4" style={{ color: 'var(--muted-foreground)' }}>ENROLLED STUDENTS BY PROGRAMME</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ENROL_BY_PROGRAMME} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false}
                    tickFormatter={(v: string) => v.split(' ').slice(0,1).join('')} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="enrolled" fill="#20F44E" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="t-label mb-4" style={{ color: 'var(--muted-foreground)' }}>ENROLLMENT TREND (12 MONTHS)</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={ENROL_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                  <Tooltip {...tooltipStyle} />
                  <Line type="monotone" dataKey="enrolled" stroke="#20F44E" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Section>

        {/* Section 3 — Security Overview */}
        <Section title="Security Overview">
          {/* 3 StatTiles */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatTile
              icon={ShieldAlert}
              iconColor="var(--warning)"
              iconBg="var(--warning-bg)"
              label="FAILED LOGIN ATTEMPTS"
              value={String(failedLoginsTotal)}
              delta="This month"
              deltaColor="var(--warning)"
              animationDelay={0}
            />
            <StatTile
              icon={KeyRound}
              iconColor="var(--info)"
              iconBg="var(--info-bg)"
              label="PASSWORD RESETS"
              value="12"
              delta="This month"
              deltaColor="var(--muted-foreground)"
              animationDelay={60}
            />
            <StatTile
              icon={ShieldCheck}
              iconColor="var(--success)"
              iconBg="var(--success-bg)"
              label="ACTIVE 2FA USERS"
              value="68%"
              delta="Of all admin accounts"
              deltaColor="var(--success)"
              animationDelay={120}
            />
          </div>

          {/* Failed logins bar chart */}
          <p className="t-label mb-4" style={{ color: 'var(--muted-foreground)' }}>FAILED LOGIN ATTEMPTS — LAST 30 DAYS</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={FAILED_LOGINS_DAILY} barSize={10}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [v, 'Failed attempts']} />
              <Bar dataKey="count" fill="var(--error)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* Top 5 most active admin users */}
          <p className="t-label mt-6 mb-4" style={{ color: 'var(--muted-foreground)' }}>TOP 5 MOST ACTIVE ADMIN USERS THIS MONTH</p>
          <div className="flex flex-col" style={{ gap: 0 }}>
            {TOP_ACTIVE_ADMINS.map((admin, i) => {
              const rc = roleBadgeColors(admin.role)
              const maxActions = TOP_ACTIVE_ADMINS[0].actions
              return (
                <div key={admin.name} className="flex items-center gap-4 py-3"
                  style={{ borderBottom: i < TOP_ACTIVE_ADMINS.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted-foreground)', width: 18, flexShrink: 0 }}>
                    #{i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{admin.name}</p>
                      <span className="t-label px-1.5 py-0.5 flex-shrink-0"
                        style={{ backgroundColor: rc.bg, color: rc.color, borderRadius: 'var(--radius-sm)', fontSize: 10 }}>
                        {admin.role}
                      </span>
                    </div>
                    <div className="rounded-full overflow-hidden" style={{ height: 4, backgroundColor: 'var(--muted)' }}>
                      <div style={{ height: '100%', width: `${Math.round((admin.actions / maxActions) * 100)}%`, backgroundColor: 'var(--brand)', borderRadius: 4 }} />
                    </div>
                  </div>
                  <span className="t-label px-2 py-0.5 flex-shrink-0"
                    style={{ backgroundColor: 'rgba(32,244,78,0.10)', color: '#16A34A', borderRadius: 'var(--radius-sm)' }}>
                    {admin.actions}
                  </span>
                </div>
              )
            })}
          </div>
        </Section>

        {/* Section 4 — Academic Performance */}
        <Section title="Academic Performance">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="t-label mb-4" style={{ color: 'var(--muted-foreground)' }}>AVERAGE GPA BY PROGRAMME</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={AVG_GPA_BY_PROGRAMME} layout="vertical" barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" domain={[0, 4]} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={100}
                    tickFormatter={(v: string) => v.split(' ').slice(0,2).join(' ')} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="gpa" fill="#20F44E" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="t-label mb-4" style={{ color: 'var(--muted-foreground)' }}>PASS RATE BY DEPARTMENT (%)</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={PASS_RATES_BY_DEPT} layout="vertical" barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="dept" type="category" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={120}
                    tickFormatter={(v: string) => v.split(' ').slice(0,2).join(' ')} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="rate" fill="#16A34A" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Section>

        {/* Section 5 — Library Usage */}
        <Section title="Library Usage">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="t-label mb-4" style={{ color: 'var(--muted-foreground)' }}>TOP 5 MOST ACCESSED RESOURCES</p>
              <div className="flex flex-col gap-3">
                {TOP_LIBRARY_RESOURCES.map((res, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted-foreground)', width: 18, flexShrink: 0 }}>#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{res.title}</p>
                      <div className="mt-1 rounded-full overflow-hidden" style={{ height: 4, backgroundColor: 'var(--muted)' }}>
                        <div style={{ height: '100%', width: `${Math.round((res.accesses / TOP_LIBRARY_RESOURCES[0].accesses) * 100)}%`, backgroundColor: 'var(--brand)', borderRadius: 4 }} />
                      </div>
                    </div>
                    <span className="t-label px-2 py-0.5 flex-shrink-0" style={{ backgroundColor: 'rgba(32,244,78,0.10)', color: '#16A34A', borderRadius: 'var(--radius-sm)' }}>{res.accesses}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1 p-4 rounded-xl" style={{ backgroundColor: 'var(--muted)' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.01em' }}>312</span>
                <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>Active library users this month</span>
              </div>
              <div className="flex flex-col gap-1 p-4 rounded-xl" style={{ backgroundColor: 'var(--muted)' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.01em' }}>1,753</span>
                <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>Total resource accesses this month</span>
              </div>
              <div className="flex flex-col gap-1 p-4 rounded-xl" style={{ backgroundColor: 'var(--muted)' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.01em' }}>248</span>
                <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>Total resources in catalogue</span>
              </div>
            </div>
          </div>
        </Section>

        {/* Section 6 — System Activity */}
        <Section title="System Activity">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <p className="t-label mb-4" style={{ color: 'var(--muted-foreground)' }}>DAILY ACTIVE USERS — LAST 30 DAYS</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={DAILY_ACTIVE_USERS}>
                  <defs>
                    <linearGradient id="dauGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#20F44E" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#20F44E" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false}
                    interval={4} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Area type="monotone" dataKey="users" stroke="#20F44E" strokeWidth={2} fill="url(#dauGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Activity heatmap */}
            <div>
              <p className="t-label mb-4" style={{ color: 'var(--muted-foreground)' }}>PEAK USAGE — HOURS VS DAYS OF WEEK</p>
              <div style={{ overflowX: 'auto' }}>
                <div style={{ minWidth: 620 }}>
                  {/* Hour labels */}
                  <div style={{ display: 'grid', gridTemplateColumns: '44px repeat(24, 1fr)', gap: 2, marginBottom: 4 }}>
                    <div />
                    {Array.from({ length: 24 }, (_, h) => (
                      <div key={h} className="t-caption text-center" style={{ color: 'var(--muted-foreground)', fontSize: 9 }}>
                        {h % 6 === 0 ? `${String(h).padStart(2,'0')}h` : ''}
                      </div>
                    ))}
                  </div>
                  {HEATMAP_DAYS.map((day, d) => (
                    <div key={day} style={{ display: 'grid', gridTemplateColumns: '44px repeat(24, 1fr)', gap: 2, marginBottom: 2 }}>
                      <div className="t-caption flex items-center" style={{ color: 'var(--muted-foreground)', fontSize: 10 }}>{day}</div>
                      {ACTIVITY_HEATMAP[d].map((val, h) => {
                        const intensity = val / hmMax
                        return (
                          <div key={h} title={`${day} ${String(h).padStart(2,'0')}:00 — ${val} sessions`}
                            style={{
                              height: 18, borderRadius: 3,
                              backgroundColor: intensity > 0.05
                                ? `rgba(32, 244, 78, ${0.1 + intensity * 0.85})`
                                : 'var(--muted)',
                            }} />
                        )
                      })}
                    </div>
                  ))}
                  {/* Legend */}
                  <div className="flex items-center gap-2 mt-3">
                    <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>Low</span>
                    {[0.1, 0.3, 0.5, 0.7, 0.95].map((v) => (
                      <div key={v} style={{ width: 16, height: 16, borderRadius: 3, backgroundColor: `rgba(32, 244, 78, ${v})` }} />
                    ))}
                    <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>High</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>

      </div>
    </AppShell>
  )
}
