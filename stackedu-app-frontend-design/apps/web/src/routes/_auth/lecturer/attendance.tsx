import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  LayoutDashboard, BookOpen, BarChart2, Bell, ClipboardList,
  FileText, TrendingUp, CheckCircle2, Eye,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
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

export const Route = createFileRoute('/_auth/lecturer/attendance')({
  component: AttendancePage,
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

type AttStatus = 'Present' | 'Absent' | 'Late'

// ─────────────────────────────────────────────────────────────────────────────

function AttendancePage() {
  const [courseId,     setCourseId]     = useState(LECTURER_COURSES[0].id)
  const [sessionActive, setSessionActive] = useState(false)
  const [statuses,     setStatuses]     = useState<Record<string, AttStatus>>({})
  const [viewSession,  setViewSession]  = useState<AttendanceSession | null>(null)

  const course   = LECTURER_COURSES.find(c => c.id === courseId)!
  const students = COURSE_STUDENTS[courseId] ?? []
  const today    = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const pastSessions = ATTENDANCE_SESSIONS.filter(s => s.courseId === courseId)
  const nextSessionNum = (pastSessions[0]?.sessionNumber ?? 0) + 1

  const getStatus = (id: string): AttStatus => statuses[id] ?? 'Present'

  const counts = students.reduce(
    (acc, s) => {
      const st = getStatus(s.id)
      if (st === 'Present') acc.present++
      else if (st === 'Absent') acc.absent++
      else acc.late++
      return acc
    },
    { present: 0, absent: 0, late: 0 }
  )

  const startSession = () => {
    const initial: Record<string, AttStatus> = {}
    students.forEach(s => { initial[s.id] = 'Present' })
    setStatuses(initial)
    setSessionActive(true)
  }

  const submit = () => {
    toast.success(`Attendance recorded for ${course.code} — ${today}`)
    setSessionActive(false)
    setStatuses({})
  }

  return (
    <AppShell
      navItems={LECTURER_NAV}
      pageTitle="Attendance"
      userName={LECTURER.fullName}
      userRole="Lecturer"
      userInitials={LECTURER.initials}
      unreadCount={3}
      infoCardLabel="LECTURER ID"
      infoCardValue={LECTURER.id}
      infoCardSubtext={LECTURER.department}
    >
      <div className="animate-fade-up" style={{ padding: '32px 32px 56px', maxWidth: 900, margin: '0 auto' }}>

        {/* Page header */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Attendance</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Record and track student attendance per session.</p>
          </div>
          <Select value={courseId} onValueChange={id => { setCourseId(id); setSessionActive(false); setStatuses({}) }}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LECTURER_COURSES.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Session info card */}
        <div
          className="flex items-center justify-between mb-6"
          style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: '20px 24px' }}
        >
          <div>
            <p className="t-label mb-1" style={{ color: 'var(--muted-foreground)' }}>CURRENT SESSION</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{course.code} — {course.name}</p>
            <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Session {nextSessionNum} · {today}</p>
          </div>
          {!sessionActive && (
            <Button onClick={startSession} style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}>
              Start session
            </Button>
          )}
          {sessionActive && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="t-label px-2.5 py-1" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-sm)' }}>
                  Present: {counts.present}
                </span>
                <span className="t-label px-2.5 py-1" style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-sm)' }}>
                  Absent: {counts.absent}
                </span>
                <span className="t-label px-2.5 py-1" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)', borderRadius: 'var(--radius-sm)' }}>
                  Late: {counts.late}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Attendance form */}
        {sessionActive && (
          <div className="mb-6">
            <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              {/* Table header */}
              <div className="grid px-5 py-3" style={{ gridTemplateColumns: '140px 1fr 220px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
                <span className="t-label" style={{ color: 'var(--muted-foreground)' }}>STUDENT ID</span>
                <span className="t-label" style={{ color: 'var(--muted-foreground)' }}>NAME</span>
                <span className="t-label" style={{ color: 'var(--muted-foreground)' }}>STATUS</span>
              </div>

              {students.map((s, i) => {
                const status = getStatus(s.id)
                return (
                  <div
                    key={s.id}
                    className="grid items-center px-5"
                    style={{ gridTemplateColumns: '140px 1fr 220px', paddingTop: 13, paddingBottom: 13, borderBottom: i < students.length - 1 ? '1px solid var(--border)' : 'none' }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{s.id}</span>
                    <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{s.name}</span>
                    <div className="flex items-center gap-1">
                      {(['Present', 'Absent', 'Late'] as AttStatus[]).map(opt => {
                        const active = status === opt
                        const colors = { Present: 'var(--success)', Absent: 'var(--error)', Late: 'var(--warning)' }
                        const bgs    = { Present: 'var(--success-bg)', Absent: 'var(--error-bg)', Late: 'var(--warning-bg)' }
                        return (
                          <button
                            key={opt}
                            onClick={() => setStatuses(prev => ({ ...prev, [s.id]: opt }))}
                            className="px-2.5 py-1 text-xs font-semibold transition-colors duration-150"
                            style={{
                              borderRadius: 'var(--radius-sm)',
                              border: active ? `1.5px solid ${colors[opt]}` : '1.5px solid var(--border)',
                              backgroundColor: active ? bgs[opt] : 'transparent',
                              color: active ? colors[opt] : 'var(--muted-foreground)',
                              cursor: 'pointer',
                            }}
                          >
                            {opt}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 mt-4">
              <Button onClick={submit} style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}>
                <CheckCircle2 style={{ width: 15, height: 15, marginRight: 6 }} />
                Submit attendance
              </Button>
              <Button variant="outline" onClick={() => toast.success('Draft saved')}>Save draft</Button>
            </div>
          </div>
        )}

        {/* Empty state if no active session */}
        {!sessionActive && (
          <div className="flex flex-col items-center justify-center py-12 text-center mb-6">
            <div style={{ width: 56, height: 56, backgroundColor: 'var(--muted)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <ClipboardList style={{ width: 24, height: 24, color: 'var(--muted-foreground)' }} />
            </div>
            <p className="t-h3 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>No active session</p>
            <p className="t-body-sm" style={{ color: 'var(--muted-foreground)', maxWidth: 320 }}>
              Click 'Start session' above to begin recording attendance for today.
            </p>
          </div>
        )}

        {/* Attendance History */}
        <div>
          <h2 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Attendance History</h2>
          <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div className="grid px-5 py-3" style={{ gridTemplateColumns: '100px 1fr 100px 80px 80px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
              {['DATE', 'TOPIC', 'PRESENT', 'RATE', ''].map(h => <span key={h} className="t-label" style={{ color: 'var(--muted-foreground)' }}>{h}</span>)}
            </div>
            {pastSessions.length === 0 && (
              <div className="py-10 text-center"><p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>No sessions recorded yet.</p></div>
            )}
            {pastSessions.map((s, i) => {
              const pct = Math.round((s.present / s.total) * 100)
              return (
                <div
                  key={s.id}
                  className="grid items-center px-5"
                  style={{ gridTemplateColumns: '100px 1fr 100px 80px 80px', paddingTop: 13, paddingBottom: 13, borderBottom: i < pastSessions.length - 1 ? '1px solid var(--border)' : 'none' }}
                >
                  <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{s.date}</span>
                  <span className="text-sm" style={{ color: 'var(--foreground)' }}>{s.topic}</span>
                  <span className="text-sm" style={{ color: 'var(--foreground)' }}>{s.present} / {s.total}</span>
                  <span className="t-label px-2 py-0.5 w-fit" style={{ backgroundColor: pct >= 80 ? 'var(--success-bg)' : 'var(--warning-bg)', color: pct >= 80 ? 'var(--success)' : 'var(--warning)', borderRadius: 'var(--radius-sm)' }}>
                    {pct}%
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
      </div>

      {/* Session detail Sheet */}
      <Sheet open={viewSession !== null} onOpenChange={open => { if (!open) setViewSession(null) }}>
        <SheetContent side="right" className="p-0 border-l overflow-hidden flex flex-col" style={{ width: 'min(720px, 45vw)' }}>
          {viewSession && <SessionDetailSheet session={viewSession} courseId={courseId} onClose={() => setViewSession(null)} />}
        </SheetContent>
      </Sheet>
    </AppShell>
  )
}

// ── Session detail Sheet ──────────────────────────────────────────────────────

function SessionDetailSheet({ session, courseId, onClose }: { session: AttendanceSession; courseId: string; onClose: () => void }) {
  const students = COURSE_STUDENTS[courseId] ?? []
  const course   = LECTURER_COURSES.find(c => c.id === courseId)!

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div style={{ padding: '20px 56px 18px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <p className="t-label mb-1" style={{ color: 'var(--muted-foreground)' }}>ATTENDANCE SESSION</p>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 600, color: 'var(--foreground)', lineHeight: 1.4 }}>{session.topic}</h3>
        <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{course.code} · Session {session.sessionNumber} · {session.date}</p>
      </div>

      <div style={{ padding: '20px 24px', flex: 1 }}>
        <div className="flex items-center gap-3 mb-5">
          <span className="t-label px-2.5 py-1" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-sm)' }}>Present: {session.present}</span>
          <span className="t-label px-2.5 py-1" style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-sm)' }}>Absent: {session.total - session.present}</span>
        </div>

        <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          {students.map((s, i) => {
            const present = i < session.present
            return (
              <div key={s.id} className="flex items-center gap-4 px-4" style={{ paddingTop: 12, paddingBottom: 12, borderBottom: i < students.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--muted-foreground)', width: 120, flexShrink: 0 }}>{s.id}</span>
                <span className="text-sm flex-1" style={{ color: 'var(--foreground)' }}>{s.name}</span>
                <span className="t-label px-2 py-0.5" style={{ backgroundColor: present ? 'var(--success-bg)' : 'var(--error-bg)', color: present ? 'var(--success)' : 'var(--error)', borderRadius: 'var(--radius-sm)' }}>
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
