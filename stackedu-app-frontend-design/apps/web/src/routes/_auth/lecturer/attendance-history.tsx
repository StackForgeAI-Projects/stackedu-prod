import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  LayoutDashboard, BookOpen, BarChart2, Bell, ClipboardList,
  FileText, TrendingUp, Eye, Download,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { StatTile } from '@/components/StatTile'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { toast } from 'sonner'
import {
  LECTURER, LECTURER_COURSES, COURSE_STUDENTS, ATTENDANCE_SESSIONS,
  type AttendanceSession,
} from '@/data/lecturer'

export const Route = createFileRoute('/_auth/lecturer/attendance-history')({
  component: AttendanceHistoryPage,
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

// ─────────────────────────────────────────────────────────────────────────────

function AttendanceHistoryPage() {
  const [courseId,     setCourseId]     = useState('all')
  const [dateFrom,     setDateFrom]     = useState('')
  const [dateTo,       setDateTo]       = useState('')
  const [viewSession,  setViewSession]  = useState<AttendanceSession | null>(null)

  const allSessions = courseId === 'all'
    ? ATTENDANCE_SESSIONS
    : ATTENDANCE_SESSIONS.filter(s => s.courseId === courseId)

  const filtered = allSessions.filter(s => {
    if (dateFrom && new Date(s.date) < new Date(dateFrom)) return false
    if (dateTo   && new Date(s.date) > new Date(dateTo))   return false
    return true
  })

  const avgRate     = filtered.length
    ? Math.round(filtered.reduce((sum, s) => sum + Math.round((s.present / s.total) * 100), 0) / filtered.length)
    : 0

  const perfectCount = (() => {
    const courseStudents = courseId !== 'all' ? (COURSE_STUDENTS[courseId] ?? []) : []
    return courseStudents.filter(s => s.attendanceRate === 100).length
  })()

  return (
    <AppShell
      navItems={LECTURER_NAV}
      pageTitle="Attendance History"
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
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Attendance History</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Session-by-session attendance records across all your courses.</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger className="w-52"><SelectValue placeholder="All courses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All courses</SelectItem>
                {LECTURER_COURSES.map(c => <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ height: 36, borderRadius: 8, border: '1px solid var(--border)', padding: '0 10px', fontSize: '0.875rem', color: 'var(--foreground)', backgroundColor: 'var(--card)', outline: 'none' }} />
              <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>to</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ height: 36, borderRadius: 8, border: '1px solid var(--border)', padding: '0 10px', fontSize: '0.875rem', color: 'var(--foreground)', backgroundColor: 'var(--card)', outline: 'none' }} />
            </div>
            <Button variant="outline" className="gap-1.5" onClick={() => toast.success('Attendance report exported')}>
              <Download style={{ width: 14, height: 14 }} /> Export report
            </Button>
          </div>
        </div>

        {/* StatTiles */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatTile
            icon={ClipboardList}
            iconColor="var(--brand)" iconBg="rgba(32,244,78,0.08)"
            label="AVG ATTENDANCE RATE" value={`${avgRate}%`}
            delta="Across filtered sessions" deltaColor="var(--muted-foreground)"
            animationDelay={0}
          />
          <StatTile
            icon={BookOpen}
            iconColor="var(--info)" iconBg="var(--info-bg)"
            label="TOTAL SESSIONS" value={String(filtered.length)}
            delta="Recorded sessions" deltaColor="var(--muted-foreground)"
            animationDelay={60}
          />
          <StatTile
            icon={TrendingUp}
            iconColor="var(--success)" iconBg="var(--success-bg)"
            label="PERFECT ATTENDANCE" value={courseId !== 'all' ? String(perfectCount) : '—'}
            delta={courseId !== 'all' ? 'Students at 100%' : 'Select a course to view'} deltaColor="var(--muted-foreground)"
            animationDelay={120}
          />
        </div>

        {/* Sessions table */}
        <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div className="grid px-5 py-3" style={{ gridTemplateColumns: '100px 80px 1fr 100px 80px 90px 80px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
            {['DATE', 'COURSE', 'TOPIC', 'PRESENT', 'RATE', 'STATUS', ''].map(h => <span key={h} className="t-label" style={{ color: 'var(--muted-foreground)' }}>{h}</span>)}
          </div>

          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>No sessions match your filters.</p>
            </div>
          )}

          {filtered.map((s, i) => {
            const pct    = Math.round((s.present / s.total) * 100)
            const course = LECTURER_COURSES.find(c => c.id === s.courseId)
            return (
              <div
                key={s.id}
                className="grid items-center px-5"
                style={{ gridTemplateColumns: '100px 80px 1fr 100px 80px 90px 80px', paddingTop: 13, paddingBottom: 13, borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{s.date}</span>
                {course && (
                  <span className="t-label px-1.5 py-0.5 w-fit" style={{ backgroundColor: course.color + '18', color: course.color, borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>{course.code}</span>
                )}
                <span className="text-sm truncate" style={{ color: 'var(--foreground)' }}>{s.topic}</span>
                <span className="text-sm" style={{ color: 'var(--foreground)' }}>{s.present} / {s.total}</span>
                <span className="text-sm font-medium" style={{ color: pct >= 80 ? 'var(--success)' : 'var(--warning)' }}>{pct}%</span>
                <span className="t-label px-2 py-0.5 w-fit" style={{ backgroundColor: pct >= 80 ? 'var(--success-bg)' : 'var(--warning-bg)', color: pct >= 80 ? 'var(--success)' : 'var(--warning)', borderRadius: 'var(--radius-sm)' }}>
                  {pct >= 80 ? 'Good' : 'Low'}
                </span>
                <button
                  className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-70"
                  style={{ color: 'var(--success)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  onClick={() => setViewSession(s)}
                >
                  <Eye style={{ width: 12, height: 12 }} /> View
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Session detail Sheet */}
      <Sheet open={viewSession !== null} onOpenChange={open => { if (!open) setViewSession(null) }}>
        <SheetContent side="right" className="p-0 border-l overflow-hidden flex flex-col" style={{ width: 'min(720px, 45vw)' }}>
          {viewSession && <SessionDetailSheet session={viewSession} onClose={() => setViewSession(null)} />}
        </SheetContent>
      </Sheet>
    </AppShell>
  )
}

// ── Session detail Sheet ──────────────────────────────────────────────────────

function SessionDetailSheet({ session, onClose }: { session: AttendanceSession; onClose: () => void }) {
  const students = COURSE_STUDENTS[session.courseId] ?? []
  const course   = LECTURER_COURSES.find(c => c.id === session.courseId)!

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div style={{ padding: '20px 56px 18px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <p className="t-label mb-1" style={{ color: 'var(--muted-foreground)' }}>SESSION DETAILS</p>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 600, color: 'var(--foreground)', lineHeight: 1.4 }}>{session.topic}</h3>
        <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{course.code} · Session {session.sessionNumber} · {session.date}</p>
      </div>

      <div style={{ padding: '20px 24px', flex: 1 }}>
        <div className="flex items-center gap-3 mb-5">
          <span className="t-label px-2.5 py-1" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-sm)' }}>Present: {session.present}</span>
          <span className="t-label px-2.5 py-1" style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-sm)' }}>Absent: {session.total - session.present}</span>
        </div>

        <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div className="grid px-4 py-2.5" style={{ gridTemplateColumns: '120px 1fr 80px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
            {['STUDENT ID', 'NAME', 'STATUS'].map(h => <span key={h} className="t-label" style={{ color: 'var(--muted-foreground)' }}>{h}</span>)}
          </div>
          {students.map((s, i) => {
            const present = i < session.present
            return (
              <div key={s.id} className="grid items-center px-4" style={{ gridTemplateColumns: '120px 1fr 80px', paddingTop: 11, paddingBottom: 11, borderBottom: i < students.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{s.id}</span>
                <span className="text-sm" style={{ color: 'var(--foreground)' }}>{s.name}</span>
                <span className="t-label px-2 py-0.5 w-fit" style={{ backgroundColor: present ? 'var(--success-bg)' : 'var(--error-bg)', color: present ? 'var(--success)' : 'var(--error)', borderRadius: 'var(--radius-sm)' }}>
                  {present ? 'Present' : 'Absent'}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ padding: '0 24px 28px', flexShrink: 0 }}>
        <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
      </div>
    </div>
  )
}
