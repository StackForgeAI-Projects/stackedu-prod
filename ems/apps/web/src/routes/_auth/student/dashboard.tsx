import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { jsWeekdayToIso, type StudentDashboard } from '@stackedu/shared'
import {
  CreditCard, TrendingUp, Users, Sparkles, ChevronLeft, ChevronRight, FileText, BookMarked, CalendarDays, Bell,
} from 'lucide-react'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { StudentShell } from '@/components/StudentShell'
import { StatTile } from '@/components/StatTile'
import { TimetableEventDialog, type StudentTimetableSlot } from '@/components/timetable/TimetableEventDialog'
import { formatCurrency } from '@/lib/utils'
import { getStudentDashboard, studentDashboardQueryKey } from '@/lib/api/student'
import { apiErrorMessage } from '@/lib/api/client'
import { showNewStudentWelcomeIfPresent } from '@/lib/new-student-welcome'

export const Route = createFileRoute('/_auth/student/dashboard')({
  component: StudentDashboardPage,
})

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function getMonthDays(ref: Date): (Date | null)[] {
  const year = ref.getFullYear()
  const month = ref.getMonth()
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const result: (Date | null)[] = []
  for (let i = 0; i < first.getDay(); i++) result.push(null)
  for (let d = 1; d <= last.getDate(); d++) result.push(new Date(year, month, d))
  while (result.length % 7 !== 0) result.push(null)
  return result
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_FULL = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function GradeBadge({ grade }: { grade: string }) {
  const isA = grade.startsWith('A')
  const isB = grade.startsWith('B')
  const isC = grade.startsWith('C')
  const bg = isA ? 'var(--success-bg)' : isB ? 'var(--info-bg)' : isC ? 'var(--warning-bg)' : 'var(--error-bg)'
  const col = isA ? 'var(--success)' : isB ? 'var(--info)' : isC ? 'var(--warning)' : 'var(--error)'
  return (
    <span className="t-label px-2 py-0.5" style={{ backgroundColor: bg, color: col, borderRadius: 'var(--radius-sm)' }}>
      {grade}
    </span>
  )
}

function StudentDashboardPage() {
  const [welcomeOpen, setWelcomeOpen] = useState(false)
  const [welcomeStudentNumber, setWelcomeStudentNumber] = useState<string | null>(null)

  useEffect(() => {
    showNewStudentWelcomeIfPresent((studentNumber) => {
      setWelcomeStudentNumber(studentNumber)
      setWelcomeOpen(true)
    })
  }, [])

  const { data, isPending, error } = useQuery({
    queryKey: studentDashboardQueryKey,
    queryFn: getStudentDashboard,
  })

  const today = new Date()
  const hours = today.getHours()
  const greeting = hours < 12 ? 'Good morning' : hours < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <StudentShell pageTitle="Dashboard" guide="Your live record: GPA, outstanding fees, attendance, registered courses and this week's classes. StackEDU AI is paused.">
      <ConfirmAlertDialog
        open={welcomeOpen}
        onOpenChange={setWelcomeOpen}
        title="Welcome to the institution!"
        tone="success"
        headlineLabel="Congratulations"
        headline="You are now a student"
        summary={
          welcomeStudentNumber
            ? `Your student number is ${welcomeStudentNumber}. Keep it safe — you will use it to sign in, pay fees, and register for courses.`
            : 'Your student record is ready. You can now pay fees and register for courses from your dashboard.'
        }
        notices={[
          { icon: 'shield', label: 'Your student dashboard is ready — explore fees, registration, and your timetable.' },
          { icon: 'file', label: 'Next: pay your fees, then register for courses for this semester.' },
          { icon: 'clock', label: 'Your profile and academic record are now linked to this student number.' },
        ]}
        confirmLabel="Get started"
        confirmVariant="brand"
        onConfirm={(event) => {
          event.preventDefault()
          setWelcomeOpen(false)
        }}
      />
      {isPending ? (
        <p className="t-body p-8" style={{ color: 'var(--muted-foreground)' }}>Loading your dashboard…</p>
      ) : error ? (
        <p className="t-body p-8" style={{ color: 'var(--error)' }}>
          {apiErrorMessage(error, 'Could not load your dashboard.')}
        </p>
      ) : data ? (
        <div className="page-split">
          <div className="page-split-main animate-fade-up">
            <div className="mb-8">
              <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>
                {greeting}, {data.profile.firstName}
              </h1>
              <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>{dateStr}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <StatTile
                icon={TrendingUp}
                iconColor="var(--brand)"
                iconBg="rgba(var(--brand-rgb),0.08)"
                label="CURRENT GPA"
                value={data.gpa === null ? '—' : data.gpa.toFixed(1)}
                valueUnit={data.gpa === null ? '' : '/ 4.0'}
                animationDelay={0}
              />
              <StatTile
                icon={CreditCard}
                iconColor="var(--warning)"
                iconBg="var(--warning-bg)"
                label="OUTSTANDING FEES"
                value={formatCurrency(data.outstandingFees)}
                animationDelay={60}
                footer={
                  <Link to="/student/fees" className="text-xs font-semibold mt-2 transition-opacity hover:opacity-70 w-fit" style={{ color: 'var(--success)' }}>
                    Pay now →
                  </Link>
                }
              />
              <StatTile
                icon={Users}
                iconColor="var(--error)"
                iconBg="var(--error-bg)"
                label="ATTENDANCE RATE"
                value={data.attendanceRate === null ? '—' : `${data.attendanceRate}%`}
                animationDelay={120}
              />
            </div>

            <CoursesCard courses={data.courses} />
            <RecentResultsCard results={data.recentResults} />
          </div>

          <div className="page-split-aside animate-fade-up" style={{ animationDelay: '100ms' }}>
            <CalendarCard schedule={data.schedule} deadlines={data.deadlines} />
            <AiPausedCard firstName={data.profile.firstName} />
          </div>
        </div>
      ) : null}
    </StudentShell>
  )
}

function CoursesCard({ courses }: { courses: StudentDashboard['courses'] }) {
  return (
    <div className="mb-5 animate-fade-up" style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24 }}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Courses</h2>
        <Link to="/student/courses" className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--success)' }}>View all →</Link>
      </div>
      {courses.length === 0 ? (
        <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
          No approved courses yet.{' '}
          <Link to="/student/course-registration" style={{ color: 'var(--success)' }}>Register now</Link>
        </p>
      ) : (
        <div className="flex flex-col">
          {courses.map((course, i) => (
            <div key={course.offeringId} className="flex items-center gap-4 py-3.5" style={{ borderBottom: i === courses.length - 1 ? 'none' : '1px solid var(--border)' }}>
              <div className="flex items-center justify-center flex-shrink-0 rounded-lg" style={{ width: 52, height: 52, backgroundColor: course.color }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: '#FFFFFF' }}>{course.code}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{course.name}</p>
                <p className="t-caption mt-0.5 truncate" style={{ color: 'var(--muted-foreground)' }}>{course.lecturerName ?? 'Lecturer to be assigned'}</p>
              </div>
              <span className="t-label px-2.5 py-1 flex-shrink-0" style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', borderRadius: 'var(--radius-sm)' }}>
                {course.credits} cr
              </span>
              <Link
                to="/student/course-detail"
                search={{ id: course.offeringId }}
                className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg"
                style={{ border: '1px solid var(--border)', color: 'var(--foreground)', textDecoration: 'none' }}
              >
                Course detail
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RecentResultsCard({ results }: { results: StudentDashboard['recentResults'] }) {
  return (
    <div className="animate-fade-up" style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24 }}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Recent Results</h2>
        <Link to="/student/results" className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--success)' }}>View all →</Link>
      </div>
      {results.length === 0 ? (
        <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>No published results yet.</p>
      ) : (
        results.map((result, i) => (
          <div key={result.offeringId} className="flex items-center gap-4 py-3.5" style={{ borderBottom: i === results.length - 1 ? 'none' : '1px solid var(--border)' }}>
            <span className="t-mono flex-shrink-0" style={{ color: 'var(--muted-foreground)', width: 64 }}>{result.courseCode}</span>
            <span className="flex-1 text-sm min-w-0 truncate" style={{ color: 'var(--foreground)' }}>{result.courseName}</span>
            {result.grade ? <GradeBadge grade={result.grade} /> : null}
            <span className="t-caption flex-shrink-0" style={{ color: 'var(--muted-foreground)', width: 40, textAlign: 'right' }}>{result.credits} cr</span>
          </div>
        ))
      )}
    </div>
  )
}

function CalendarCard({
  schedule,
  deadlines,
}: {
  schedule: StudentDashboard['schedule']
  deadlines: StudentDashboard['deadlines']
}) {
  const today = new Date()
  const [navDate, setNavDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(today)
  const [selectedSlot, setSelectedSlot] = useState<StudentTimetableSlot | null>(null)
  const monthDays = getMonthDays(navDate)
  const heading = `${MONTH_NAMES[navDate.getMonth()]} ${navDate.getFullYear()}`
  const selectedIso = jsWeekdayToIso(selectedDate.getDay())
  const daySchedule = schedule.filter((item) => item.dayOfWeek === selectedIso)
  const daysWithClass = new Set(schedule.map((item) => item.dayOfWeek))

  return (
    <>
      <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 20 }}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setNavDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="flex items-center justify-center rounded-lg" style={{ width: 28, height: 28, color: 'var(--muted-foreground)' }}>
            <ChevronLeft style={{ width: 16, height: 16 }} />
          </button>
          <h3 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '0.9375rem' }}>{heading}</h3>
          <button onClick={() => setNavDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="flex items-center justify-center rounded-lg" style={{ width: 28, height: 28, color: 'var(--muted-foreground)' }}>
            <ChevronRight style={{ width: 16, height: 16 }} />
          </button>
        </div>
        <div className="grid grid-cols-7 mb-1">
          {DAY_FULL.map((d) => (
            <span key={d} className="t-label text-center" style={{ color: 'var(--muted-foreground)', fontSize: 10 }}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-0.5">
          {monthDays.map((day, i) => {
            if (!day) return <div key={`null-${i}`} />
            const isToday = isSameDay(day, today)
            const isSelected = isSameDay(day, selectedDate)
            const hasClass = daysWithClass.has(jsWeekdayToIso(day.getDay()))
            return (
              <button key={day.toISOString()} onClick={() => setSelectedDate(day)} className="flex flex-col items-center gap-0.5 py-1" style={{ borderRadius: 'var(--radius-md)', backgroundColor: isSelected ? 'rgba(var(--brand-rgb),0.08)' : 'transparent', border: 'none', cursor: 'pointer' }}>
                <span className="flex items-center justify-center text-xs" style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: isToday ? 'var(--brand)' : 'transparent', color: isToday ? 'var(--brand-ink)' : 'var(--foreground)', fontWeight: isToday || isSelected ? 700 : 400 }}>
                  {day.getDate()}
                </span>
                {hasClass ? <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: 'var(--brand)' }} /> : null}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 20 }}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '0.9375rem' }}>Schedule</h3>
          <Link to="/student/timetable" className="text-xs font-medium" style={{ color: 'var(--success)' }}>Full timetable →</Link>
        </div>
        <p className="t-caption mb-4" style={{ color: 'var(--muted-foreground)' }}>
          {selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
        </p>
        {daySchedule.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: 'var(--muted-foreground)' }}>No classes scheduled</p>
        ) : (
          daySchedule.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedSlot(item)}
              className="flex items-center gap-3 py-3 w-full text-left"
              style={{ borderBottom: i < daySchedule.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <span className="t-mono flex-shrink-0" style={{ color: 'var(--muted-foreground)', width: 80, fontSize: 11 }}>{item.startTime} – {item.endTime}</span>
              <p className="flex-1 text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{item.courseCode}</span>
                {' · '}{item.courseName}
              </p>
              {item.reminder ? <Bell className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--muted-foreground)' }} /> : null}
              <span className="t-label px-1.5 py-0.5" style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', borderRadius: 'var(--radius-sm)', fontSize: 10 }}>{item.sessionType}</span>
            </button>
          ))
        )}
      </div>

      <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 20 }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '0.9375rem' }}>Deadlines</h3>
          <Link to="/student/notifications" className="text-xs font-medium" style={{ color: 'var(--success)' }}>View all →</Link>
        </div>
        {deadlines.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No upcoming deadlines.</p>
        ) : (
          deadlines.map((item, i) => {
            const Icon = item.type === 'fee' ? CreditCard : item.type === 'registration' ? BookMarked : item.type === 'calendar' ? CalendarDays : FileText
            return (
              <div key={item.id} className="flex items-center gap-3 py-3" style={{ borderBottom: i < deadlines.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 30, height: 30, backgroundColor: 'var(--muted)' }}>
                  <Icon style={{ width: 14, height: 14, color: 'var(--muted-foreground)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{item.title}</p>
                  <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                    {item.date ? new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date TBC'}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
      <TimetableEventDialog slot={selectedSlot} open={selectedSlot !== null} onOpenChange={(next) => { if (!next) setSelectedSlot(null) }} />
    </>
  )
}

function AiPausedCard({ firstName }: { firstName: string }) {
  return (
    <div style={{ backgroundColor: 'var(--ink)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--ink-border)', padding: 20 }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles style={{ width: 16, height: 16, color: 'var(--brand)' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9375rem', fontWeight: 700, color: '#FFFFFF' }}>StackEDU AI</span>
        </div>
        <span className="t-label px-2 py-0.5" style={{ backgroundColor: 'var(--ink-surface)', color: 'var(--ink-muted)', borderRadius: 'var(--radius-sm)' }}>
          PAUSED
        </span>
      </div>
      <p className="t-caption" style={{ color: 'var(--ink-muted)' }}>
        Hi {firstName}. The study assistant is paused for now. Your courses, fees, results and timetable above are live from your record.
      </p>
    </div>
  )
}
