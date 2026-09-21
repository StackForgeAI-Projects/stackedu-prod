import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  LayoutDashboard, BookOpen, BarChart2, Bell, ClipboardList,
  FileText, TrendingUp, AlertTriangle, Flag,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { StatTile } from '@/components/StatTile'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  LineChart, Line,
} from 'recharts'
import { toast } from 'sonner'
import {
  LECTURER, LECTURER_COURSES, COURSE_STUDENTS, ATTENDANCE_SESSIONS,
  AT_RISK_STUDENTS, PUBLISHED_MARKS, ASSESSMENTS, calcGrade,
} from '@/data/lecturer'

export const Route = createFileRoute('/_auth/lecturer/analytics')({
  component: AnalyticsPage,
})

const LECTURER_NAV = [
  { label: 'Dashboard',     to: '/lecturer/dashboard',     icon: LayoutDashboard },
  { label: 'My Courses',    to: '/lecturer/courses',       icon: BookOpen        },
  { label: 'Attendance',    to: '/lecturer/attendance',    icon: ClipboardList   },
  { label: 'Results',       to: '/lecturer/results',       icon: BarChart2       },
  { label: 'Assignments',   to: '/lecturer/assignments',   icon: FileText        },
  { label: 'Analytics',     to: '/lecturer/analytics',     icon: TrendingUp      },
  { label: 'Notifications', to: '/lecturer/notifications', icon: Bell            },
]

const RISK_STYLE: Record<'High' | 'Medium' | 'Low', { bg: string; color: string }> = {
  High:   { bg: 'var(--error-bg)',   color: 'var(--error)'   },
  Medium: { bg: 'var(--warning-bg)', color: 'var(--warning)' },
  Low:    { bg: 'var(--info-bg)',    color: 'var(--info)'    },
}

// ─────────────────────────────────────────────────────────────────────────────

function AnalyticsPage() {
  const [courseId, setCourseId] = useState(LECTURER_COURSES[0].id)

  const course       = LECTURER_COURSES.find(c => c.id === courseId)!
  const students     = COURSE_STUDENTS[courseId] ?? []
  const assessments  = ASSESSMENTS.filter(a => a.courseId === courseId && a.status === 'published')
  const sessions     = ATTENDANCE_SESSIONS.filter(s => s.courseId === courseId)
  const atRisk       = AT_RISK_STUDENTS.filter(s => s.courseId === courseId && !s.resolved)

  const avgAttendance = students.length
    ? Math.round(students.reduce((sum, s) => sum + s.attendanceRate, 0) / students.length)
    : 0

  // Grade distribution from first published assessment
  const gradeDistribution = (() => {
    const dist: Record<string, number> = { A: 0, 'B+': 0, B: 0, 'C+': 0, C: 0, 'D+': 0, D: 0, F: 0 }
    const assessment = assessments[0]
    if (!assessment) return dist
    const marks = PUBLISHED_MARKS[assessment.id] ?? {}
    students.forEach(s => {
      const g = calcGrade(marks[s.id] ?? 0, assessment.maxMarks)
      if (g in dist) dist[g]++
    })
    return dist
  })()

  const chartData = Object.entries(gradeDistribution).map(([grade, count]) => ({ grade, count }))

  // Attendance trend per session
  const trendData = [...sessions].reverse().map(s => ({
    session: `S${s.sessionNumber}`,
    rate: Math.round((s.present / s.total) * 100),
  }))

  // Class average grade
  const classAvgGrade = (() => {
    const assessment = assessments[0]
    if (!assessment) return '—'
    const marks = PUBLISHED_MARKS[assessment.id] ?? {}
    const nums = students.map(s => marks[s.id]).filter((v): v is number => v !== undefined)
    if (!nums.length) return '—'
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length
    return calcGrade(avg, assessment.maxMarks)
  })()

  // Cross-course comparison
  const courseComparison = LECTURER_COURSES.map(c => {
    const sts = COURSE_STUDENTS[c.id] ?? []
    const att = sts.length ? Math.round(sts.reduce((s, st) => s + st.attendanceRate, 0) / sts.length) : 0
    const firstA = ASSESSMENTS.find(a => a.courseId === c.id && a.status === 'published')
    const avgMark = (() => {
      if (!firstA) return 0
      const m = PUBLISHED_MARKS[firstA.id] ?? {}
      const nums = sts.map(s => m[s.id]).filter((v): v is number => v !== undefined)
      return nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0
    })()
    return { code: c.code, color: c.color, avgAttendance: att, avgMark }
  })

  return (
    <AppShell
      navItems={LECTURER_NAV}
      pageTitle="Analytics"
      userName={LECTURER.fullName}
      userRole="Lecturer"
      userInitials={LECTURER.initials}
      unreadCount={3}
      infoCardLabel="LECTURER ID"
      infoCardValue={LECTURER.id}
      infoCardSubtext={LECTURER.department}
    >
      <div className="animate-fade-up" style={{ padding: '32px 32px 56px', maxWidth: 1000, margin: '0 auto' }}>

        {/* Header */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Analytics</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Course performance, attendance trends, and at-risk overview.</p>
          </div>
          <Select value={courseId} onValueChange={setCourseId}>
            <SelectTrigger className="w-60"><SelectValue /></SelectTrigger>
            <SelectContent>
              {LECTURER_COURSES.map(c => <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* StatTiles */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatTile
            icon={BarChart2}
            iconColor="var(--brand)" iconBg="rgba(32,244,78,0.08)"
            label="CLASS AVG GRADE" value={classAvgGrade}
            delta={assessments[0]?.name ?? 'No data'} deltaColor="var(--muted-foreground)"
            animationDelay={0}
          />
          <StatTile
            icon={ClipboardList}
            iconColor="var(--info)" iconBg="var(--info-bg)"
            label="ATTENDANCE RATE" value={`${avgAttendance}%`}
            delta="Class average" deltaColor="var(--muted-foreground)"
            animationDelay={60}
          />
          <StatTile
            icon={FileText}
            iconColor="var(--success)" iconBg="var(--success-bg)"
            label="ASSIGNMENTS SUBMITTED" value={`${Math.round((LECTURER_COURSES.find(c => c.id === courseId)?.enrolledCount ?? 0) * 0.84)}%`}
            delta="Across active assignments" deltaColor="var(--muted-foreground)"
            animationDelay={120}
          />
          <StatTile
            icon={AlertTriangle}
            iconColor="var(--error)" iconBg="var(--error-bg)"
            label="AT-RISK STUDENTS" value={String(atRisk.length)}
            delta="Flagged this semester" deltaColor="var(--error)"
            animationDelay={180}
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-2 gap-5 mb-6">
          {/* Grade distribution */}
          <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24 }}>
            <h3 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Grade Distribution</h3>
            {chartData.some(d => d.count > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="grade" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', backgroundColor: 'var(--card)', fontSize: 12 }} />
                  <Bar dataKey="count" fill="#20F44E" radius={[4, 4, 0, 0]} name="Students" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center" style={{ height: 200 }}>
                <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>No published results yet.</p>
              </div>
            )}
          </div>

          {/* Attendance trend */}
          <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24 }}>
            <h3 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Attendance Trend</h3>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="session" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', backgroundColor: 'var(--card)', fontSize: 12 }} formatter={(v) => [`${v}%`, 'Attendance']} />
                  <Line type="monotone" dataKey="rate" stroke="#20F44E" strokeWidth={2} dot={{ fill: '#20F44E', r: 4 }} name="Rate" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center" style={{ height: 200 }}>
                <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>No sessions recorded yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* At-risk table */}
        {atRisk.length > 0 && (
          <div className="mb-6">
            <h2 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>At-Risk Students</h2>
            <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div className="grid px-5 py-3" style={{ gridTemplateColumns: '140px 1fr 90px 80px 80px 100px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
                {['STUDENT ID', 'NAME', 'ATTENDANCE', 'AVG GRADE', 'RISK', ''].map(h => <span key={h} className="t-label" style={{ color: 'var(--muted-foreground)' }}>{h}</span>)}
              </div>
              {atRisk.map((s, i) => {
                const stu = students.find(st => st.id === s.id)
                const rs  = RISK_STYLE[s.riskLevel]
                return (
                  <div key={s.id} className="grid items-center px-5" style={{ gridTemplateColumns: '140px 1fr 90px 80px 80px 100px', paddingTop: 13, paddingBottom: 13, borderBottom: i < atRisk.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{s.id}</span>
                    <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{s.name}</span>
                    <span className="text-sm" style={{ color: (stu?.attendanceRate ?? 0) >= 75 ? 'var(--success)' : 'var(--error)', fontWeight: 500 }}>{stu?.attendanceRate ?? '—'}%</span>
                    <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{stu?.avgGrade ?? '—'}</span>
                    <span className="t-label px-2 py-0.5 w-fit" style={{ backgroundColor: rs.bg, color: rs.color, borderRadius: 'var(--radius-sm)' }}>{s.riskLevel}</span>
                    <Button variant="outline" size="sm" className="gap-1" style={{ fontSize: '0.75rem' }} onClick={() => toast.success(`Flagged ${s.name} for follow-up`)}>
                      <Flag style={{ width: 11, height: 11 }} /> Flag
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Course comparison */}
        <div>
          <h2 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Course Comparison</h2>
          <div className="grid grid-cols-4 gap-4">
            {courseComparison.map((c, i) => (
              <div
                key={c.code}
                className={`animate-fade-up-${i + 1}`}
                style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 18 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: c.color }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 700, color: 'var(--foreground)' }}>{c.code}</span>
                </div>
                <p className="t-label mb-0.5" style={{ color: 'var(--muted-foreground)' }}>AVG ATTENDANCE</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: 8 }}>{c.avgAttendance}%</p>
                <p className="t-label mb-0.5" style={{ color: 'var(--muted-foreground)' }}>AVG MARK</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: c.avgMark > 0 ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
                  {c.avgMark > 0 ? c.avgMark : '—'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
