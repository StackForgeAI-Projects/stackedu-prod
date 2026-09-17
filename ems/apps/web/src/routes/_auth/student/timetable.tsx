import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import type { StudentDashboard } from '@stackedu/shared'
import { StudentShell } from '@/components/StudentShell'
import { getStudentCourses, getStudentDashboard, studentCoursesQueryKey, studentDashboardQueryKey } from '@/lib/api/student'
import { apiErrorMessage } from '@/lib/api/client'

export const Route = createFileRoute('/_auth/student/timetable')({
  component: TimetablePage,
})

const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const ISO_WEEKDAYS = [1, 2, 3, 4, 5]
const ROW_H = 64
const LABEL_W = 56

function hourOf(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return (hours ?? 0) + (minutes ?? 0) / 60
}

function durationHours(item: StudentDashboard['schedule'][number]): number {
  return Math.max(1, hourOf(item.endTime) - hourOf(item.startTime))
}

function startsAtHour(item: StudentDashboard['schedule'][number], hour: number): boolean {
  return Math.floor(hourOf(item.startTime)) === hour
}

function coversHour(item: StudentDashboard['schedule'][number], hour: number): boolean {
  const start = hourOf(item.startTime)
  const end = hourOf(item.endTime)
  return start < hour && end > hour
}

function jsToIsoDay(jsDay: number): number {
  return jsDay === 0 ? 7 : jsDay
}

function TimetablePage() {
  const { data, isPending, error } = useQuery({
    queryKey: studentDashboardQueryKey,
    queryFn: getStudentDashboard,
  })
  const courses = useQuery({
    queryKey: studentCoursesQueryKey,
    queryFn: getStudentCourses,
  })
  const todayIso = jsToIsoDay(new Date().getDay())
  const schedule = data?.schedule ?? []

  return (
    <StudentShell pageTitle="Timetable" guide="Your approved classes this week. Academic Admin publishes the timetable; empty days mean no slot is assigned yet.">
      <div className="animate-fade-up" style={{ padding: '24px 16px 56px' }}>
        <div className="mb-8">
          <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.015em' }}>
            Weekly timetable
          </h1>
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
            {courses.data?.semester?.label ?? 'Current semester'}
          </p>
        </div>

        {isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading timetable…</p>
        ) : error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load your timetable.')}</p>
        ) : schedule.length === 0 ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>No classes are on your timetable yet.</p>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <div
                className="min-w-[720px]"
                style={{
                  backgroundColor: 'var(--card)',
                  borderRadius: 'var(--radius-xl)',
                  boxShadow: 'var(--shadow-sm)',
                  border: '1px solid var(--border)',
                  overflow: 'hidden',
                }}
              >
                <div className="flex" style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
                  <div style={{ width: LABEL_W, flexShrink: 0, borderRight: '1px solid var(--border)' }} />
                  {DAYS.map((day, index) => {
                    const isToday = ISO_WEEKDAYS[index] === todayIso
                    return (
                      <div
                        key={day}
                        className="flex-1 text-center py-3"
                        style={{
                          borderRight: index < DAYS.length - 1 ? '1px solid var(--border)' : 'none',
                          backgroundColor: isToday ? 'rgba(var(--brand-rgb),0.06)' : 'transparent',
                        }}
                      >
                        <p className="t-label" style={{ color: isToday ? 'var(--brand)' : 'var(--muted-foreground)' }}>
                          {day.toUpperCase()}
                        </p>
                        {isToday ? <span className="t-label" style={{ color: 'var(--brand)', fontSize: 10 }}>TODAY</span> : null}
                      </div>
                    )
                  })}
                </div>

                {TIME_SLOTS.map((time, index) => {
                  const hour = 8 + index
                  return (
                    <div
                      key={time}
                      className="flex"
                      style={{ height: ROW_H, borderBottom: index < TIME_SLOTS.length - 1 ? '1px solid var(--border)' : 'none' }}
                    >
                      <div
                        className="flex items-start justify-center pt-2 flex-shrink-0"
                        style={{
                          width: LABEL_W,
                          borderRight: '1px solid var(--border)',
                          fontSize: 11,
                          color: 'var(--muted-foreground)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {time}
                      </div>
                      {ISO_WEEKDAYS.map((day, dayIndex) => {
                        const dayItems = schedule.filter((item) => item.dayOfWeek === day)
                        const entry = dayItems.find((item) => startsAtHour(item, hour))
                        const occupied = !entry && dayItems.some((item) => coversHour(item, hour))
                        const isToday = day === todayIso
                        return (
                          <div
                            key={day}
                            className="flex-1 relative"
                            style={{
                              borderRight: dayIndex < ISO_WEEKDAYS.length - 1 ? '1px solid var(--border)' : 'none',
                              backgroundColor: isToday ? 'rgba(var(--brand-rgb),0.03)' : 'transparent',
                            }}
                          >
                            {entry && !occupied ? (
                              <div
                                className="absolute inset-x-1 flex flex-col justify-center px-2.5 py-2 rounded-lg overflow-hidden"
                                style={{
                                  top: 4,
                                  height: durationHours(entry) * ROW_H - 8,
                                  backgroundColor: `${entry.color}18`,
                                  border: `1px solid ${entry.color}40`,
                                  zIndex: 1,
                                }}
                              >
                                <p className="text-xs font-bold truncate" style={{ color: entry.color, fontFamily: 'var(--font-mono)' }}>
                                  {entry.courseCode}
                                </p>
                                <p className="text-xs font-medium truncate mt-0.5" style={{ color: 'var(--foreground)' }}>
                                  {entry.courseName}
                                </p>
                                <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted-foreground)' }}>
                                  {entry.startTime}–{entry.endTime}{entry.room ? ` · ${entry.room}` : ''}
                                </p>
                              </div>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="md:hidden flex flex-col gap-5">
              {DAYS.map((day, index) => {
                const dayIso = ISO_WEEKDAYS[index]!
                const isToday = dayIso === todayIso
                const dayEntries = schedule
                  .filter((item) => item.dayOfWeek === dayIso)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))

                return (
                  <div
                    key={day}
                    style={{
                      backgroundColor: 'var(--card)',
                      borderRadius: 'var(--radius-xl)',
                      boxShadow: 'var(--shadow-sm)',
                      border: isToday ? '1px solid rgba(var(--brand-rgb),0.3)' : '1px solid var(--border)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      className="px-5 py-3 flex items-center justify-between"
                      style={{
                        borderBottom: '1px solid var(--border)',
                        backgroundColor: isToday ? 'rgba(var(--brand-rgb),0.06)' : 'var(--muted)',
                      }}
                    >
                      <p className="t-h3" style={{ fontFamily: 'var(--font-display)', color: isToday ? 'var(--brand)' : 'var(--foreground)' }}>
                        {day}
                      </p>
                      {isToday ? (
                        <span className="t-label px-2 py-0.5" style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', borderRadius: 'var(--radius-sm)' }}>
                          TODAY
                        </span>
                      ) : null}
                    </div>
                    {dayEntries.length === 0 ? (
                      <p className="text-sm px-5 py-4" style={{ color: 'var(--muted-foreground)' }}>No classes</p>
                    ) : (
                      dayEntries.map((entry) => (
                        <div key={entry.id} className="flex items-center gap-3 px-5 py-4" style={{ borderTop: '1px solid var(--border)' }}>
                          <div className="flex-shrink-0 rounded-lg" style={{ width: 4, height: 40, backgroundColor: entry.color }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{entry.courseName}</p>
                            <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                              {entry.startTime} – {entry.endTime}{entry.room ? ` · ${entry.room}` : ''}
                            </p>
                          </div>
                          <span
                            className="t-label px-2 py-0.5 flex-shrink-0"
                            style={{
                              backgroundColor: `${entry.color}18`,
                              color: entry.color,
                              borderRadius: 'var(--radius-sm)',
                              fontFamily: 'var(--font-mono)',
                              fontSize: 10,
                            }}
                          >
                            {entry.courseCode}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </StudentShell>
  )
}
