import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Users, BarChart2, Calendar, GraduationCap, Download } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts'
import { AppShell } from '@/components/AppShell'
import { ACADEMIC_ADMIN, ACADEMIC_NAV } from '@/data/academic'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/academic/reports')({
  component: AcademicReportsPage,
})

// ─────────────────────────────────────────────────────────────────────────────

type ReportType = 'enrollment' | 'results' | 'attendance' | 'programme'

interface ReportConfig {
  key:         ReportType
  icon:        typeof Users
  title:       string
  description: string
}

const REPORT_CONFIGS: ReportConfig[] = [
  { key: 'enrollment',  icon: Users,         title: 'Enrollment Report',       description: 'Student enrollment by programme, year, and status' },
  { key: 'results',     icon: BarChart2,      title: 'Results Summary',         description: 'Grade distributions and GPA analysis by cohort' },
  { key: 'attendance',  icon: Calendar,       title: 'Attendance Report',       description: 'Attendance trends by course and department' },
  { key: 'programme',   icon: GraduationCap,  title: 'Programme Performance',   description: 'Comparative performance across programmes' },
]

const PROGRAMMES_FILTER = ['All Programmes', 'Computer Science', 'Information Technology', 'Mathematics', 'Business Administration']
const SEMESTERS_FILTER  = ['All Semesters', 'Semester 1 · 2024/2025', 'Semester 2 · 2024/2025']
const DEPTS_FILTER      = ['All Departments', 'School of Computing', 'School of Sciences', 'School of Business']

// ── Mock chart data ───────────────────────────────────────────────────────────

const enrollmentData = [
  { name: 'Comp. Sci.',  Year1: 48, Year2: 36, Year3: 24, Year4: 18 },
  { name: 'Info. Tech.', Year1: 32, Year2: 28, Year3: 20, Year4: 0  },
  { name: 'Mathematics', Year1: 18, Year2: 14, Year3: 12, Year4: 0  },
  { name: 'Bus. Admin.', Year1: 65, Year2: 58, Year3: 42, Year4: 0  },
]

const resultsData = [
  { grade: 'A+', count: 22 }, { grade: 'A',  count: 48 }, { grade: 'B+', count: 56 },
  { grade: 'B',  count: 61 }, { grade: 'C+', count: 38 }, { grade: 'C',  count: 24 },
  { grade: 'D',  count: 15 }, { grade: 'F',  count: 8  },
]

const attendanceData = [
  { week: 'Wk 1', avg: 94 }, { week: 'Wk 2', avg: 91 }, { week: 'Wk 3', avg: 88 },
  { week: 'Wk 4', avg: 86 }, { week: 'Wk 5', avg: 85 }, { week: 'Wk 6', avg: 83 },
  { week: 'Wk 7', avg: 80 }, { week: 'Wk 8', avg: 79 }, { week: 'Wk 9', avg: 82 },
  { week: 'Wk 10', avg: 84 },
]

const programmeData = [
  { name: 'Comp. Sci.',  avgGPA: 3.4 }, { name: 'Info. Tech.', avgGPA: 3.1 },
  { name: 'Mathematics', avgGPA: 3.6 }, { name: 'Bus. Admin.', avgGPA: 3.2 },
]

const REPORT_STATS: Record<ReportType, { label: string; value: string; color: string }[]> = {
  enrollment: [
    { label: 'Total Enrolled',     value: '1,247', color: 'var(--foreground)' },
    { label: 'New This Semester',  value: '165',   color: 'var(--success)'    },
    { label: 'Deferred',           value: '8',     color: 'var(--warning)'    },
    { label: 'Suspended',          value: '4',     color: 'var(--error)'      },
  ],
  results: [
    { label: 'Class Average',      value: '71.4%', color: 'var(--foreground)' },
    { label: 'Pass Rate',          value: '88%',   color: 'var(--success)'    },
    { label: 'Avg GPA',            value: '3.2',   color: 'var(--info)'       },
    { label: 'Distinction Rate',   value: '18%',   color: 'var(--brand)'      },
  ],
  attendance: [
    { label: 'Overall Avg',        value: '85%',   color: 'var(--foreground)' },
    { label: 'Full Attendance',    value: '312',   color: 'var(--success)'    },
    { label: 'Below 75%',          value: '48',    color: 'var(--warning)'    },
    { label: 'Critical (<50%)',    value: '12',    color: 'var(--error)'      },
  ],
  programme: [
    { label: 'Best Performing',    value: 'Maths', color: 'var(--success)'    },
    { label: 'Avg GPA Across All', value: '3.33',  color: 'var(--foreground)' },
    { label: 'Highest Enrolment',  value: '484',   color: 'var(--info)'       },
    { label: 'Completion Rate',    value: '91%',   color: 'var(--brand)'      },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────

function AcademicReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType | null>(null)
  const [programme, setProgramme]       = useState(PROGRAMMES_FILTER[0])
  const [semester, setSemester]         = useState(SEMESTERS_FILTER[0])
  const [dept, setDept]                 = useState(DEPTS_FILTER[0])
  const [generated, setGenerated]       = useState(false)

  const activeCfg = REPORT_CONFIGS.find((r) => r.key === activeReport)

  return (
    <AppShell
      navItems={ACADEMIC_NAV}
      pageTitle="Reports"
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
        <div className="mb-8">
          <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Academic Reports</h1>
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Generate and export academic reports</p>
        </div>

        {/* Report type cards */}
        <div className="grid grid-cols-2 gap-5 mb-8">
          {REPORT_CONFIGS.map((cfg) => {
            const Icon    = cfg.icon
            const isActive = activeReport === cfg.key
            return (
              <button key={cfg.key} onClick={() => { setActiveReport(cfg.key); setGenerated(false) }}
                className="text-left p-6 rounded-xl transition-all duration-150"
                style={{
                  backgroundColor: isActive ? 'var(--foreground)' : 'var(--card)',
                  border: `1px solid ${isActive ? 'var(--foreground)' : 'var(--border)'}`,
                  boxShadow: isActive ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                  cursor: 'pointer',
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center justify-center rounded-xl" style={{ width: 40, height: 40, backgroundColor: isActive ? 'rgba(255,255,255,0.12)' : 'rgba(32,244,78,0.08)' }}>
                    <Icon style={{ width: 18, height: 18, color: isActive ? '#fff' : 'var(--brand)' }} />
                  </div>
                  <h3 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: isActive ? '#fff' : 'var(--foreground)', fontSize: '1rem' }}>{cfg.title}</h3>
                </div>
                <p className="t-body-sm" style={{ color: isActive ? 'rgba(255,255,255,0.7)' : 'var(--muted-foreground)' }}>{cfg.description}</p>
                <span className="text-sm font-medium mt-3 block" style={{ color: isActive ? 'var(--brand)' : '#16A34A' }}>
                  {isActive ? 'Selected →' : 'Generate →'}
                </span>
              </button>
            )
          })}
        </div>

        {/* Configuration panel */}
        {activeReport && !generated && (
          <div className="mb-6" style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24 }}>
            <h2 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Configure — {activeCfg?.title}</h2>
            <div className="flex flex-wrap gap-4 mb-6">
              {activeReport !== 'attendance' && (
                <div className="flex-1 min-w-40">
                  <label className="t-label mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>Programme</label>
                  <select value={programme} onChange={(e) => setProgramme(e.target.value)}
                    className="w-full text-sm rounded-lg px-3 h-9 outline-none"
                    style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)', cursor: 'pointer' }}
                  >
                    {PROGRAMMES_FILTER.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
              )}
              <div className="flex-1 min-w-40">
                <label className="t-label mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>Semester</label>
                <select value={semester} onChange={(e) => setSemester(e.target.value)}
                  className="w-full text-sm rounded-lg px-3 h-9 outline-none"
                  style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)', cursor: 'pointer' }}
                >
                  {SEMESTERS_FILTER.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              {activeReport === 'attendance' && (
                <div className="flex-1 min-w-40">
                  <label className="t-label mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>Department</label>
                  <select value={dept} onChange={(e) => setDept(e.target.value)}
                    className="w-full text-sm rounded-lg px-3 h-9 outline-none"
                    style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)', cursor: 'pointer' }}
                  >
                    {DEPTS_FILTER.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
              )}
            </div>
            <button onClick={() => setGenerated(true)} className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
              style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
            >
              Generate report
            </button>
          </div>
        )}

        {/* Generated report */}
        {activeReport && generated && (
          <div>
            {/* Summary tiles */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {REPORT_STATS[activeReport].map((s, i) => (
                <div key={s.label} className={`animate-fade-up-${i + 1}`} style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 20 }}>
                  <p className="t-label mb-2" style={{ color: 'var(--muted-foreground)' }}>{s.label}</p>
                  <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: s.color, letterSpacing: '-0.015em' }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="mb-6" style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24 }}>
              <h3 className="t-h3 mb-6" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>{activeCfg?.title}</h3>
              <ResponsiveContainer width="100%" height={240}>
                {activeReport === 'attendance' ? (
                  <LineChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={36} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 13 }} />
                    <Line type="monotone" dataKey="avg" stroke="var(--brand)" strokeWidth={2} dot={{ fill: 'var(--brand)', r: 4 }} />
                  </LineChart>
                ) : activeReport === 'programme' ? (
                  <BarChart data={programmeData} barSize={50}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 4]} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={36} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 13 }} />
                    <Bar dataKey="avgGPA" fill="var(--brand)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                ) : activeReport === 'results' ? (
                  <BarChart data={resultsData} barSize={36}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="grade" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={36} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 13 }} />
                    <Bar dataKey="count" fill="var(--brand)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                ) : (
                  <BarChart data={enrollmentData} barSize={20}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={36} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 13 }} />
                    <Bar dataKey="Year1" fill="var(--brand)" radius={[4, 4, 0, 0]} name="Year 1" />
                    <Bar dataKey="Year2" fill="var(--info)" radius={[4, 4, 0, 0]} name="Year 2" />
                    <Bar dataKey="Year3" fill="var(--warning)" radius={[4, 4, 0, 0]} name="Year 3" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Export buttons */}
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
                style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}>
                <Download style={{ width: 14, height: 14 }} />Export PDF
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150"
                style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: 'pointer' }}>
                <Download style={{ width: 14, height: 14 }} />Export CSV
              </button>
              <button onClick={() => setGenerated(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150"
                style={{ border: '1px solid var(--border)', color: 'var(--muted-foreground)', backgroundColor: 'transparent', cursor: 'pointer' }}>
                Reconfigure
              </button>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  )
}
