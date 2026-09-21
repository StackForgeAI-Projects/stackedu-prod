import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  LayoutDashboard, BookOpen, BarChart2, CreditCard as _CreditCard,
  Library as _Library, Bell, ClipboardList, FileText, TrendingUp,
  AlertTriangle, Users, Clock, ChevronRight,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { StatTile } from '@/components/StatTile'
import { Button } from '@/components/ui/button'
import {
  LECTURER, LECTURER_COURSES, COURSE_STUDENTS, ATTENDANCE_SESSIONS,
  AT_RISK_STUDENTS,
} from '@/data/lecturer'

export const Route = createFileRoute('/_auth/lecturer/dashboard')({
  component: LecturerDashboardPage,
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

const TODAY_SCHEDULE = [
  { time: '08:00 – 10:00', course: 'Data Structures & Algorithms', code: 'CSC 201', type: 'Lecture'  as const, room: 'Lab 3',    color: '#0D9488' },
  { time: '14:00 – 16:00', course: 'Operating Systems',           code: 'CSC 301', type: 'Tutorial' as const, room: 'Room 201', color: '#7C3AED' },
]

const PENDING_ACTIONS = [
  { id: 1, task: 'Submit CSC 201 Assignment 2 results',      due: '31 Jan 2025', done: false },
  { id: 2, task: 'Mark attendance — CSC 202 (Wed 22 Jan)',   due: 'Today',       done: false },
  { id: 3, task: 'Grade CSC 301 Assignment 1 submissions',   due: '28 Jan 2025', done: false },
  { id: 4, task: 'Upload CSC 401 Week 10 lecture slides',    due: '30 Jan 2025', done: true  },
]

// ─────────────────────────────────────────────────────────────────────────────

function LecturerDashboardPage() {
  const today    = new Date()
  const hours    = today.getHours()
  const greeting = hours < 12 ? 'Good morning' : hours < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr  = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const atRiskCount  = AT_RISK_STUDENTS.filter(s => !s.resolved).length
  const recentSessions = ATTENDANCE_SESSIONS.slice(0, 3)

  return (
    <AppShell
      navItems={LECTURER_NAV}
      pageTitle="Dashboard"
      userName={LECTURER.fullName}
      userRole="Lecturer"
      userInitials={LECTURER.initials}
      unreadCount={3}
      infoCardLabel="LECTURER ID"
      infoCardValue={LECTURER.id}
      infoCardSubtext={LECTURER.department}
    >
      <div className="flex" style={{ height: 'calc(100vh - var(--header-height))', overflow: 'hidden' }}>

        {/* ── Left — main content ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 overflow-y-auto animate-fade-up" style={{ padding: '32px 24px 48px 32px' }}>

          {/* Page header */}
          <div className="mb-8">
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>
              {greeting}, Dr. {LECTURER.firstName} 👋
            </h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>{dateStr}</p>
          </div>

          {/* Row 1 — StatTiles */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatTile
              icon={BookOpen}
              iconColor="var(--brand)" iconBg="rgba(32,244,78,0.08)"
              label="ASSIGNED COURSES" value="4"
              delta="Semester 1 · 2024/2025" deltaColor="var(--muted-foreground)"
              animationDelay={0}
            />
            <StatTile
              icon={ClipboardList}
              iconColor="var(--warning)" iconBg="var(--warning-bg)"
              label="PENDING RESULT ENTRIES" value="2"
              delta="Awaiting submission" deltaColor="var(--warning)"
              animationDelay={60}
            />
            <StatTile
              icon={AlertTriangle}
              iconColor="var(--error)" iconBg="var(--error-bg)"
              label="AT-RISK STUDENTS" value={String(atRiskCount)}
              delta="Flagged this semester" deltaColor="var(--error)"
              animationDelay={120}
            />
          </div>

          {/* Row 2 — My Courses */}
          <CoursesCard />

          {/* Row 3 — Recent Attendance */}
          <RecentAttendanceCard sessions={recentSessions} />
        </div>

        {/* ── Right — sidebar panel ───────────────────────────────────────── */}
        <div
          className="flex-shrink-0 overflow-y-auto animate-fade-up"
          style={{ width: '38%', borderLeft: '1px solid var(--border)', padding: '32px 24px 48px 20px', animationDelay: '100ms', display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <TodayScheduleCard />
          <AtRiskCard />
          <PendingActionsCard />
        </div>

      </div>
    </AppShell>
  )
}

// ── Courses card ──────────────────────────────────────────────────────────────

function CoursesCard() {
  return (
    <div
      className="mb-5 animate-fade-up"
      style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24, animationDelay: '60ms' }}
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>My Courses</h2>
        <Link to="/lecturer/courses" className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--success)' }}>
          View all →
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {LECTURER_COURSES.map((course, i) => (
          <div
            key={course.id}
            className="flex items-center gap-4 py-3.5"
            style={{ borderBottom: i < LECTURER_COURSES.length - 1 ? '1px solid var(--border)' : 'none' }}
          >
            <div
              className="flex items-center justify-center rounded-lg flex-shrink-0"
              style={{ width: 44, height: 44, backgroundColor: course.color }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: '#fff' }}>{course.code}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{course.name}</p>
              <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                <Users style={{ width: 11, height: 11, display: 'inline', marginRight: 3 }} />
                {course.enrolledCount} students · Next: {course.nextClassShort}
              </p>
            </div>
            <Link to="/lecturer/results">
              <Button variant="outline" size="sm" style={{ fontSize: '0.8125rem', flexShrink: 0 }}>
                Enter results
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Recent Attendance card ────────────────────────────────────────────────────

function RecentAttendanceCard({ sessions }: { sessions: typeof ATTENDANCE_SESSIONS }) {
  return (
    <div
      className="animate-fade-up"
      style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24, animationDelay: '120ms' }}
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Recent Attendance</h2>
        <Link to="/lecturer/attendance-history" className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--success)' }}>
          View all →
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {sessions.map((s, i) => {
          const course = LECTURER_COURSES.find(c => c.id === s.courseId)!
          const pct = Math.round((s.present / s.total) * 100)
          return (
            <div key={s.id} className="py-3.5" style={{ borderBottom: i < sessions.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div className="flex items-center gap-3 mb-2">
                <span
                  className="t-label px-2 py-0.5 flex-shrink-0"
                  style={{ backgroundColor: course.color + '18', color: course.color, borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: 10 }}
                >
                  {course.code}
                </span>
                <span className="text-sm font-medium flex-1 truncate" style={{ color: 'var(--foreground)' }}>{s.topic}</span>
                <span className="t-caption flex-shrink-0" style={{ color: 'var(--muted-foreground)' }}>{s.date}</span>
                <span className="t-label px-2 py-0.5 flex-shrink-0" style={{ backgroundColor: pct >= 80 ? 'var(--success-bg)' : 'var(--warning-bg)', color: pct >= 80 ? 'var(--success)' : 'var(--warning)', borderRadius: 'var(--radius-sm)' }}>
                  {pct}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-full overflow-hidden" style={{ height: 5, backgroundColor: 'var(--muted)' }}>
                  <div style={{ width: `${pct}%`, height: '100%', backgroundColor: pct >= 80 ? 'var(--success)' : 'var(--warning)', borderRadius: 9999, transition: 'width 600ms ease-out' }} />
                </div>
                <span className="t-caption flex-shrink-0" style={{ color: 'var(--muted-foreground)', width: 56, textAlign: 'right' }}>
                  {s.present} / {s.total}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Today's schedule card ─────────────────────────────────────────────────────

function TodayScheduleCard() {
  const typeColors: Record<string, { bg: string; color: string }> = {
    Lecture:  { bg: 'var(--info-bg)',       color: 'var(--info)'    },
    Tutorial: { bg: 'var(--warning-bg)',    color: 'var(--warning)' },
    Lab:      { bg: 'rgba(32,244,78,0.08)', color: 'var(--brand)'   },
  }

  return (
    <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 20 }}>
      <h3 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '0.9375rem' }}>Today's Schedule</h3>
      {TODAY_SCHEDULE.length === 0 ? (
        <p className="text-sm text-center py-4" style={{ color: 'var(--muted-foreground)' }}>No classes today</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {TODAY_SCHEDULE.map((item, i) => {
            const tc = typeColors[item.type] ?? { bg: 'var(--muted)', color: 'var(--muted-foreground)' }
            return (
              <div key={i} className="flex items-center gap-3 py-3" style={{ borderBottom: i < TODAY_SCHEDULE.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span className="t-mono flex-shrink-0" style={{ color: 'var(--muted-foreground)', fontSize: 11, width: 80 }}>{item.time}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{item.code} · {item.course}</p>
                  <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{item.room}</p>
                </div>
                <span className="t-label px-1.5 py-0.5 flex-shrink-0" style={{ backgroundColor: tc.bg, color: tc.color, borderRadius: 'var(--radius-sm)', fontSize: 10 }}>
                  {item.type}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── At-Risk Alerts card ───────────────────────────────────────────────────────

function AtRiskCard() {
  const alerts = AT_RISK_STUDENTS.filter(s => !s.resolved).slice(0, 3)

  return (
    <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 20 }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '0.9375rem' }}>At-Risk Alerts</h3>
        <Link to="/lecturer/at-risk" className="text-xs font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--success)' }}>
          View all →
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {alerts.map((s, i) => {
          const course = LECTURER_COURSES.find(c => c.id === s.courseId)
          return (
            <div key={s.id} className="py-3" style={{ borderBottom: i < alerts.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className="flex items-center justify-center rounded-full flex-shrink-0"
                  style={{ width: 28, height: 28, backgroundColor: 'var(--error-bg)' }}
                >
                  <AlertTriangle style={{ width: 13, height: 13, color: 'var(--error)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{s.name}</p>
                  <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{course?.code} · {s.reasons[0]}</p>
                </div>
              </div>
              <Link to="/lecturer/at-risk">
                <Button variant="outline" size="sm" style={{ fontSize: '0.75rem', height: 26 }}>Follow up</Button>
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Pending Actions card ──────────────────────────────────────────────────────

function PendingActionsCard() {
  const [done, setDone] = useState<Set<number>>(new Set(PENDING_ACTIONS.filter(p => p.done).map(p => p.id)))

  return (
    <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 20 }}>
      <h3 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '0.9375rem' }}>Pending Actions</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {PENDING_ACTIONS.map((action, i) => {
          const isDone = done.has(action.id)
          return (
            <div
              key={action.id}
              className="flex items-start gap-3 py-2.5"
              style={{ borderBottom: i < PENDING_ACTIONS.length - 1 ? '1px solid var(--border)' : 'none', opacity: isDone ? 0.5 : 1 }}
            >
              <button
                onClick={() => setDone(prev => { const n = new Set(prev); isDone ? n.delete(action.id) : n.add(action.id); return n })}
                className="flex-shrink-0 mt-0.5"
                style={{
                  width: 16, height: 16, borderRadius: 4,
                  border: `2px solid ${isDone ? 'var(--brand)' : 'var(--border)'}`,
                  backgroundColor: isDone ? 'var(--brand)' : 'transparent',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {isDone && <span style={{ color: 'var(--brand-ink)', fontSize: 10, fontWeight: 900, lineHeight: 1 }}>✓</span>}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ color: 'var(--foreground)', textDecoration: isDone ? 'line-through' : 'none', lineHeight: 1.4 }}>{action.task}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock style={{ width: 10, height: 10, color: 'var(--muted-foreground)' }} />
                  <span className="t-caption" style={{ color: action.due === 'Today' ? 'var(--error)' : 'var(--muted-foreground)' }}>{action.due}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
