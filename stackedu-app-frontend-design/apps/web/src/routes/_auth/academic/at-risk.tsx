import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { ACADEMIC_ADMIN, ACADEMIC_NAV, AT_RISK_STUDENTS, riskColors, type RiskLevel } from '@/data/academic'
import { toast } from 'sonner'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/academic/at-risk')({
  component: AtRiskManagementPage,
})

// ─────────────────────────────────────────────────────────────────────────────

const RISK_TABS: { label: string; value: RiskLevel | 'All' }[] = [
  { label: 'All',    value: 'All'    },
  { label: 'High',   value: 'High'   },
  { label: 'Medium', value: 'Medium' },
  { label: 'Low',    value: 'Low'    },
]

const PROGRAMMES_FILTER = ['All Programmes', 'Computer Science', 'Business Administration']
const COURSES_FILTER    = ['All Courses', 'CSC 101', 'CSC 102', 'MTH 101', 'BUS 101']

// ─────────────────────────────────────────────────────────────────────────────

function AtRiskManagementPage() {
  const [activeTab, setActiveTab]   = useState<RiskLevel | 'All'>('All')
  const [programme, setProgramme]   = useState('All Programmes')
  const [course, setCourse]         = useState('All Courses')

  const active   = AT_RISK_STUDENTS.filter((s) => !s.resolved)
  const resolved = AT_RISK_STUDENTS.filter((s) => s.resolved)

  const countFor = (level: RiskLevel | 'All') =>
    level === 'All' ? active.length : active.filter((s) => s.riskLevel === level).length

  const filtered = active.filter((s) => {
    const matchTab  = activeTab === 'All' || s.riskLevel === activeTab
    const matchProg = programme === 'All Programmes' || s.programme === programme
    return matchTab && matchProg
  })

  return (
    <AppShell
      navItems={ACADEMIC_NAV}
      pageTitle="At-Risk"
      userName={ACADEMIC_ADMIN.fullName}
      userRole={ACADEMIC_ADMIN.role}
      userInitials={ACADEMIC_ADMIN.initials}
      unreadCount={4}
      infoCardLabel="ACADEMIC ADMIN"
      infoCardValue={ACADEMIC_ADMIN.institution}
      infoCardSubtext={ACADEMIC_ADMIN.office}
    >
      <div className="animate-fade-up" style={{ padding: '32px 32px 48px' }}>

        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>At-Risk Students</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>{active.length} students currently flagged</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={programme} onChange={(e) => setProgramme(e.target.value)}
              className="text-sm rounded-lg px-3 h-9 outline-none"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', cursor: 'pointer' }}
            >
              {PROGRAMMES_FILTER.map((p) => <option key={p}>{p}</option>)}
            </select>
            <select value={course} onChange={(e) => setCourse(e.target.value)}
              className="text-sm rounded-lg px-3 h-9 outline-none"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', cursor: 'pointer' }}
            >
              {COURSES_FILTER.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Risk level tabs */}
        <div className="flex gap-1 mb-6">
          {RISK_TABS.map((tab) => {
            const isActive = activeTab === tab.value
            const cnt      = countFor(tab.value)
            return (
              <button key={tab.value} onClick={() => setActiveTab(tab.value)}
                className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm font-medium transition-colors duration-150"
                style={{ backgroundColor: isActive ? 'var(--foreground)' : 'transparent', color: isActive ? 'var(--ink-foreground)' : 'var(--muted-foreground)', border: isActive ? '1px solid var(--foreground)' : '1px solid var(--border)', cursor: 'pointer' }}
              >
                {tab.label}
                <span className="t-label px-1.5 py-0.5 rounded-full" style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : 'var(--muted)', color: isActive ? '#fff' : 'var(--muted-foreground)', fontSize: 10 }}>
                  {cnt}
                </span>
              </button>
            )
          })}
        </div>

        {/* Active cards */}
        <div className="flex flex-col gap-4 mb-8">
          {filtered.length === 0 ? (
            <div className="text-center py-16" style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
              <CheckCircle2 style={{ width: 32, height: 32, color: 'var(--success)', margin: '0 auto 12px' }} />
              <p className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>No at-risk students in this category</p>
            </div>
          ) : filtered.map((s) => {
            const rc = riskColors(s.riskLevel)
            return (
              <RiskCard key={s.id} student={s} rc={rc} />
            )
          })}
        </div>

        {/* Resolved section */}
        {resolved.length > 0 && (
          <>
            <h2 className="t-h2 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Resolved</h2>
            <div className="flex flex-col gap-3">
              {resolved.map((s) => (
                <div key={s.id} className="flex items-center gap-4 p-4 rounded-xl" style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)', opacity: 0.7 }}>
                  <div className="flex items-center justify-center rounded-full flex-shrink-0 text-sm font-bold" style={{ width: 36, height: 36, backgroundColor: 'var(--border)', color: 'var(--muted-foreground)' }}>{s.initials}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{s.name}</p>
                    <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{s.programme} · Resolved {s.resolvedDate}</p>
                    {s.resolution && <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{s.resolution}</p>}
                  </div>
                  <span className="t-label px-2 py-0.5" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-sm)' }}>Resolved</span>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </AppShell>
  )
}

// ── Risk Card ─────────────────────────────────────────────────────────────────

function RiskCard({ student: s, rc }: { student: typeof AT_RISK_STUDENTS[number]; rc: { bg: string; color: string } }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 20, transition: 'box-shadow 150ms ease-out' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="flex items-center justify-center rounded-full flex-shrink-0 text-sm font-bold" style={{ width: 44, height: 44, backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}>
          {s.initials}
        </div>

        {/* Identity */}
        <div className="flex-shrink-0" style={{ minWidth: 160 }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{s.name}</p>
          <p className="t-mono text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{s.id}</p>
          <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{s.programme} · Year {s.year}</p>
        </div>

        {/* Risk factors */}
        <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
          {s.riskFactors.map((f, i) => (
            <span key={i} className="t-label px-2 py-0.5" style={{ backgroundColor: f.severity === 'error' ? 'var(--error-bg)' : 'var(--warning-bg)', color: f.severity === 'error' ? 'var(--error)' : 'var(--warning)', borderRadius: 'var(--radius-sm)', whiteSpace: 'nowrap' }}>
              {f.label}
            </span>
          ))}
        </div>

        {/* Risk level + actions */}
        <div className="flex flex-col items-end gap-2.5 flex-shrink-0">
          <span className="t-label px-2.5 py-1" style={{ backgroundColor: rc.bg, color: rc.color, borderRadius: 'var(--radius-sm)' }}>
            {s.riskLevel} Risk
          </span>
          <div className="flex gap-2">
            <button onClick={() => toast.success(`Advisor assigned to ${s.name}.`)} className="text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors duration-150"
              style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'transparent', cursor: 'pointer' }}>
              Assign advisor
            </button>
            <button onClick={() => toast.success(`Notification sent to ${s.name}.`)} className="text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors duration-150"
              style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'transparent', cursor: 'pointer' }}>
              Send notification
            </button>
            <button onClick={() => toast.success(`${s.name} marked as resolved.`)} className="text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors duration-150"
              style={{ border: '1px solid var(--success)', color: 'var(--success)', backgroundColor: 'transparent', cursor: 'pointer' }}>
              Mark resolved
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
