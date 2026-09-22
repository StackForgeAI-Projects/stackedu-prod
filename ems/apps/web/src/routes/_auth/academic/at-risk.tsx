import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import type { AcademicAtRiskStudent } from '@stackedu/shared'
import { AcademicShell } from '@/components/AcademicShell'
import { riskColors } from '@/data/academic'
import {
  academicAtRiskQueryKey,
  listAcademicAtRiskStudents,
} from '@/lib/api/academic'
import { apiErrorMessage } from '@/lib/api/client'

export const Route = createFileRoute('/_auth/academic/at-risk')({
  component: AtRiskManagementPage,
})

type RiskTab = AcademicAtRiskStudent['riskLevel'] | 'All'

const RISK_TABS: { label: string; value: RiskTab }[] = [
  { label: 'All', value: 'All' },
  { label: 'High', value: 'High' },
  { label: 'Medium', value: 'Medium' },
  { label: 'Low', value: 'Low' },
]

function AtRiskManagementPage() {
  const { data, isPending, error } = useQuery({
    queryKey: academicAtRiskQueryKey,
    queryFn: listAcademicAtRiskStudents,
  })

  const students = data ?? []
  const [activeTab, setActiveTab] = useState<RiskTab>('All')
  const [programme, setProgramme] = useState('All Programmes')

  const programmeOptions = useMemo(
    () => ['All Programmes', ...Array.from(new Set(students.map((s) => s.programme)))],
    [students],
  )

  const active = students.filter((s) => !s.resolved)
  const resolved = students.filter((s) => s.resolved)

  const countFor = (level: RiskTab) =>
    level === 'All' ? active.length : active.filter((s) => s.riskLevel === level).length

  const filtered = active.filter((s) => {
    const matchTab = activeTab === 'All' || s.riskLevel === activeTab
    const matchProg = programme === 'All Programmes' || s.programme === programme
    return matchTab && matchProg
  })

  return (
    <AcademicShell pageTitle="At-Risk">
      <div className="page-body animate-fade-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>At-Risk Students</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
              {isPending
                ? 'Loading…'
                : active.length === 1
                  ? '1 student currently flagged'
                  : `${active.length} students currently flagged`}
            </p>
          </div>
          <select value={programme} onChange={(e) => setProgramme(e.target.value)}
            className="text-sm rounded-lg px-3 h-9 outline-none"
            style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', cursor: 'pointer' }}>
            {programmeOptions.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>

        {error ? (
          <p className="t-body mb-4" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load at-risk students.')}</p>
        ) : null}

        <div className="flex gap-1 mb-6">
          {RISK_TABS.map((tab) => {
            const isActive = activeTab === tab.value
            return (
              <button key={tab.value} type="button" onClick={() => setActiveTab(tab.value)}
                className={`filter-tab ${isActive ? 'filter-tab--active' : ''}`}>
                {tab.label}
                <span className="t-label filter-tab__badge">{countFor(tab.value)}</span>
              </button>
            )
          })}
        </div>

        <div className="flex flex-col gap-4 mb-8">
          {isPending ? (
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading at-risk students…</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16" style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
              <CheckCircle2 style={{ width: 32, height: 32, color: 'var(--success)', margin: '0 auto 12px' }} />
              <p className="t-h3">No at-risk students in this category</p>
            </div>
          ) : filtered.map((s) => <RiskCard key={s.id} student={s} />)}
        </div>

        {resolved.length > 0 && (
          <>
            <h2 className="t-h2 mb-4">Resolved</h2>
            <div className="flex flex-col gap-3">
              {resolved.map((s) => (
                <div key={s.id} className="flex items-center gap-4 p-4 rounded-xl" style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)', opacity: 0.7 }}>
                  <div className="flex items-center justify-center rounded-full flex-shrink-0 text-sm font-bold" style={{ width: 36, height: 36, backgroundColor: 'var(--border)', color: 'var(--muted-foreground)' }}>{s.initials}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{s.programme} · Resolved {s.resolvedDate ?? '—'}</p>
                    {s.resolution && <p className="t-caption mt-0.5">{s.resolution}</p>}
                  </div>
                  <span className="t-label px-2 py-0.5" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-sm)' }}>Resolved</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AcademicShell>
  )
}

function RiskCard({ student: s }: { student: AcademicAtRiskStudent }) {
  const rc = riskColors(s.riskLevel === 'Critical' ? 'High' : s.riskLevel as Parameters<typeof riskColors>[0])
  return (
    <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 20 }}>
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center justify-center rounded-full flex-shrink-0 text-sm font-bold" style={{ width: 44, height: 44, backgroundColor: 'var(--muted)' }}>{s.initials}</div>
        <div className="flex-shrink-0" style={{ minWidth: 160 }}>
          <Link to="/academic/student" search={{ id: s.studentNumber }} className="text-sm font-semibold" style={{ color: 'var(--foreground)', textDecoration: 'none' }}>{s.name}</Link>
          <p className="t-mono text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{s.studentNumber}</p>
          <p className="t-caption mt-0.5">{s.programme} · Year {s.year}</p>
        </div>
        <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
          {s.riskFactors.map((f, i) => (
            <span key={i} className="t-label px-2 py-0.5" style={{ backgroundColor: f.severity === 'error' ? 'var(--error-bg)' : 'var(--warning-bg)', color: f.severity === 'error' ? 'var(--error)' : 'var(--warning)', borderRadius: 'var(--radius-sm)' }}>{f.label}</span>
          ))}
        </div>
        <div className="flex flex-col items-end gap-2.5 flex-shrink-0">
          <span className="t-label px-2.5 py-1" style={{ backgroundColor: rc.bg, color: rc.color, borderRadius: 'var(--radius-sm)' }}>{s.riskLevel} Risk</span>
        </div>
      </div>
    </div>
  )
}
