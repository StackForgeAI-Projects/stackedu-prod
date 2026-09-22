import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import type { LecturerDashboard } from '@stackedu/shared'
import {
  BookOpen, ClipboardList, AlertTriangle, Users, Clock,
} from 'lucide-react'
import { LecturerShell } from '@/components/LecturerShell'
import { CourseCodePill } from '@/components/CourseCodePill'
import { StatTile } from '@/components/StatTile'
import { Button } from '@/components/ui/button'
import { getLecturerDashboard, lecturerDashboardQueryKey } from '@/lib/api/lecturer'
import { apiErrorMessage } from '@/lib/api/client'
import { formatDateLong, formatDateShort } from '@/lib/utils'

export const Route = createFileRoute('/_auth/lecturer/dashboard')({
  component: LecturerDashboardPage,
})

function LecturerDashboardPage() {
  const { data, isPending, error } = useQuery({
    queryKey: lecturerDashboardQueryKey,
    queryFn: getLecturerDashboard,
  })

  const today = new Date()
  const hours = today.getHours()
  const greeting = hours < 12 ? 'Good morning' : hours < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr = formatDateLong(today)

  return (
    <LecturerShell pageTitle="Dashboard" guide="Your assigned courses, today's classes, attendance, pending result submissions and at-risk students from live records.">
      {isPending ? (
        <p className="t-body px-4 sm:px-8 py-8" style={{ color: 'var(--muted-foreground)' }}>Loading dashboard…</p>
      ) : error ? (
        <p className="t-body px-4 sm:px-8 py-8" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load the dashboard.')}</p>
      ) : data ? (
        <DashboardBody data={data} greeting={greeting} dateStr={dateStr} />
      ) : null}
    </LecturerShell>
  )
}

function DashboardBody({
  data,
  greeting,
  dateStr,
}: {
  data: LecturerDashboard
  greeting: string
  dateStr: string
}) {
  return (
    <div className="page-split">
      <div className="page-split-main animate-fade-up">
        <div className="mb-8">
          <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>
            {greeting}, {data.profile.firstName} 👋
          </h1>
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>{dateStr}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <StatTile
            icon={BookOpen}
            iconColor="var(--brand)" iconBg="rgba(var(--brand-rgb),0.08)"
            label="ASSIGNED COURSES" value={String(data.stats.assignedCourses)}
            delta={data.stats.semesterLabel} deltaColor="var(--muted-foreground)"
            animationDelay={0}
          />
          <StatTile
            icon={ClipboardList}
            iconColor="var(--warning)" iconBg="var(--warning-bg)"
            label="PENDING RESULT ENTRIES" value={String(data.stats.pendingResultEntries)}
            delta="Awaiting submission" deltaColor="var(--warning)"
            animationDelay={60}
          />
          <StatTile
            icon={AlertTriangle}
            iconColor="var(--error)" iconBg="var(--error-bg)"
            label="AT-RISK STUDENTS" value={String(data.stats.atRiskStudents)}
            delta="Flagged this semester" deltaColor="var(--error)"
            animationDelay={120}
          />
        </div>

        <CoursesCard courses={data.courses} />
        <RecentAttendanceCard sessions={data.recentAttendance} />
      </div>

      <div className="page-split-aside animate-fade-up" style={{ animationDelay: '100ms' }}>
        <TodayScheduleCard items={data.todaySchedule} />
        <AtRiskCard alerts={data.atRisk} />
        <PendingActionsCard actions={data.pendingActions} />
      </div>
    </div>
  )
}

function CoursesCard({ courses }: { courses: LecturerDashboard['courses'] }) {
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

      {courses.length === 0 ? (
        <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>No courses assigned this semester.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {courses.map((course, i) => (
            <div
              key={course.offeringId}
              className="flex items-center gap-4 py-3.5"
              style={{ borderBottom: i < courses.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <CourseCodePill code={course.code} color={course.color} />
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
      )}
    </div>
  )
}

function RecentAttendanceCard({ sessions }: { sessions: LecturerDashboard['recentAttendance'] }) {
  return (
    <div
      className="animate-fade-up"
      style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24, animationDelay: '120ms' }}
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Recent Attendance</h2>
        <Link to="/lecturer/attendance" className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--success)' }}>
          View all →
        </Link>
      </div>

      {sessions.length === 0 ? (
        <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>No attendance sessions recorded yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {sessions.slice(0, 3).map((s, i) => {
            const pct = s.total ? Math.round(((s.present + s.late) / s.total) * 100) : 0
            return (
              <div key={s.id} className="py-3.5" style={{ borderBottom: i < Math.min(sessions.length, 3) - 1 ? '1px solid var(--border)' : 'none' }}>
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className="t-label px-2 py-0.5 flex-shrink-0"
                    style={{ backgroundColor: 'rgba(var(--brand-rgb), 0.10)', color: 'var(--brand)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: 10 }}
                  >
                    {s.courseCode}
                  </span>
                  <span className="text-sm font-medium flex-1 truncate" style={{ color: 'var(--foreground)' }}>{s.topic ?? 'Class session'}</span>
                  <span className="t-caption flex-shrink-0" style={{ color: 'var(--muted-foreground)' }}>{formatDateShort(s.sessionDate)}</span>
                  <span className="t-label px-2 py-0.5 flex-shrink-0" style={{ backgroundColor: pct >= 80 ? 'var(--success-bg)' : 'var(--warning-bg)', color: pct >= 80 ? 'var(--success)' : 'var(--warning)', borderRadius: 'var(--radius-sm)' }}>
                    {pct}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-full overflow-hidden" style={{ height: 5, backgroundColor: 'var(--muted)' }}>
                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: pct >= 80 ? 'var(--success)' : 'var(--warning)', borderRadius: 9999 }} />
                  </div>
                  <span className="t-caption flex-shrink-0" style={{ color: 'var(--muted-foreground)', width: 56, textAlign: 'right' }}>
                    {s.present + s.late} / {s.total}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TodayScheduleCard({ items }: { items: LecturerDashboard['todaySchedule'] }) {
  const typeColors: Record<string, { bg: string; color: string }> = {
    Lecture: { bg: 'var(--info-bg)', color: 'var(--info)' },
    Tutorial: { bg: 'var(--warning-bg)', color: 'var(--warning)' },
    Lab: { bg: 'rgba(var(--brand-rgb),0.08)', color: 'var(--brand)' },
  }

  return (
    <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 20 }}>
      <h3 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '0.9375rem' }}>Today's Schedule</h3>
      {items.length === 0 ? (
        <p className="text-sm text-center py-4" style={{ color: 'var(--muted-foreground)' }}>No classes today</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {items.map((item, i) => {
            const tc = typeColors[item.sessionType] ?? { bg: 'var(--muted)', color: 'var(--muted-foreground)' }
            return (
              <div key={item.id} className="flex items-center gap-3 py-3" style={{ borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span className="t-mono flex-shrink-0" style={{ color: 'var(--muted-foreground)', fontSize: 11, width: 80 }}>{item.startTime} – {item.endTime}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{item.courseCode} · {item.courseName}</p>
                  <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{item.room ?? 'TBA'}</p>
                </div>
                <span className="t-label px-1.5 py-0.5 flex-shrink-0" style={{ backgroundColor: tc.bg, color: tc.color, borderRadius: 'var(--radius-sm)', fontSize: 10 }}>
                  {item.sessionType}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function AtRiskCard({ alerts }: { alerts: LecturerDashboard['atRisk'] }) {
  return (
    <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 20 }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '0.9375rem' }}>At-Risk Alerts</h3>
        <Link to="/lecturer/at-risk" className="text-xs font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--success)' }}>
          View all →
        </Link>
      </div>
      {alerts.length === 0 ? (
        <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>No open alerts in your courses.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {alerts.map((s, i) => (
            <div key={s.id} className="py-3" style={{ borderBottom: i < alerts.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 28, height: 28, backgroundColor: 'var(--error-bg)' }}>
                  <AlertTriangle style={{ width: 13, height: 13, color: 'var(--error)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{s.name}</p>
                  <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{s.courseCode} · {s.reason}</p>
                </div>
              </div>
              <Link to="/lecturer/at-risk">
                <Button variant="outline" size="sm" style={{ fontSize: '0.75rem', height: 26 }}>Follow up</Button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PendingActionsCard({ actions }: { actions: LecturerDashboard['pendingActions'] }) {
  return (
    <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 20 }}>
      <h3 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '0.9375rem' }}>Pending Actions</h3>
      {actions.length === 0 ? (
        <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>You are up to date.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {actions.map((action, i) => (
            <a
              key={action.id}
              href={action.href}
              className="flex items-start gap-3 py-2.5"
              style={{ borderBottom: i < actions.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <Clock style={{ width: 14, height: 14, color: 'var(--muted-foreground)', marginTop: 3, flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ color: 'var(--foreground)', lineHeight: 1.4 }}>{action.task}</p>
                <span className="t-caption" style={{ color: action.due === 'Today' ? 'var(--error)' : 'var(--muted-foreground)' }}>{action.due}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
