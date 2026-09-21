import { createFileRoute } from '@tanstack/react-router'
import {
  LayoutDashboard, BookOpen, BarChart2, CreditCard, Library, Bell,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/student/timetable')({
  component: TimetablePage,
})

// ── Nav ───────────────────────────────────────────────────────────────────────

const STUDENT_NAV = [
  { label: 'Dashboard',     to: '/student/dashboard',     icon: LayoutDashboard },
  { label: 'My Courses',    to: '/student/courses',       icon: BookOpen        },
  { label: 'Results',       to: '/student/results',       icon: BarChart2       },
  { label: 'Fees',          to: '/student/fees',          icon: CreditCard      },
  { label: 'E-Library',     to: '/student/library',       icon: Library         },
  { label: 'Notifications', to: '/student/notifications', icon: Bell            },
]

// ── Constants ─────────────────────────────────────────────────────────────────

const TIME_SLOTS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00']
const DAYS       = ['Monday','Tuesday','Wednesday','Thursday','Friday']
const DAY_IDX    = [1, 2, 3, 4, 5] // 1=Monday in Date.getDay()

// ── Timetable entries ─────────────────────────────────────────────────────────
// dayIndex: 1=Mon … 5=Fri, startHour: 8-17 (24h), duration in hours

const ENTRIES: {
  dayIndex: number
  startHour: number
  duration: number
  code: string
  name: string
  room: string
  color: string
}[] = [
  { dayIndex: 1, startHour:  8, duration: 2, code: 'CSC 101', name: 'Intro to Computer Science', room: 'Lab 3',    color: '#0D9488' },
  { dayIndex: 1, startHour: 14, duration: 2, code: 'MTH 101', name: 'Calculus I',                room: 'Hall A',   color: '#D97706' },
  { dayIndex: 2, startHour: 10, duration: 2, code: 'CSC 102', name: 'Programming Fundamentals',  room: 'Lab 2',    color: '#7C3AED' },
  { dayIndex: 2, startHour: 14, duration: 2, code: 'ENG 101', name: 'English Comm Skills',       room: 'Room 101', color: '#2563EB' },
  { dayIndex: 3, startHour:  8, duration: 2, code: 'MTH 101', name: 'Calculus I',                room: 'Hall A',   color: '#D97706' },
  { dayIndex: 3, startHour: 10, duration: 2, code: 'CSC 101', name: 'Intro to Computer Science', room: 'Lab 3',    color: '#0D9488' },
  { dayIndex: 4, startHour:  8, duration: 2, code: 'CSC 102', name: 'Programming Fundamentals',  room: 'Lab 2',    color: '#7C3AED' },
  { dayIndex: 4, startHour: 14, duration: 2, code: 'PHY 101', name: 'Physics I',                 room: 'Lab 4',    color: '#E11D48' },
  { dayIndex: 5, startHour: 10, duration: 2, code: 'ENG 101', name: 'English Comm Skills',       room: 'Room 101', color: '#2563EB' },
]

// Row height in px per 1 hour
const ROW_H = 64
// Left label column width
const LABEL_W = 56

// ── Helpers ───────────────────────────────────────────────────────────────────

function getEntry(dayIdx: number, hour: number) {
  // Returns entry if it *starts* at this hour on this day
  return ENTRIES.find((e) => e.dayIndex === dayIdx && e.startHour === hour)
}

function isOccupied(dayIdx: number, hour: number) {
  // Returns true if this slot is covered by a multi-hour entry started above
  return ENTRIES.some(
    (e) => e.dayIndex === dayIdx && e.startHour < hour && e.startHour + e.duration > hour
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function TimetablePage() {
  const today       = new Date()
  const todayDayIdx = today.getDay() // 0=Sun … 6=Sat

  return (
    <AppShell
      navItems={STUDENT_NAV}
      pageTitle="Timetable"
      userName="Jean-Paul Mugisha"
      userRole="Student"
      userInitials="JM"
      unreadCount={3}
      infoCardLabel="STUDENT ID"
      infoCardValue="SFE-2024-0042"
      infoCardSubtext="Year 1"
    >
      <div className="px-8 py-8 animate-fade-up">

        {/* Section header */}
        <div className="mb-8">
          <h1
            className="t-h1 mb-1"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}
          >
            Weekly Timetable
          </h1>
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
            Semester 1 · 2024/2025
          </p>
        </div>

        {/* ── Desktop grid ──────────────────────────────────────────────────── */}
        <div className="hidden md:block">
          <div
            style={{
              backgroundColor: 'var(--card)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--border)',
              overflow: 'hidden',
            }}
          >
            {/* Day headers */}
            <div
              className="flex"
              style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}
            >
              {/* Empty top-left corner */}
              <div style={{ width: LABEL_W, flexShrink: 0, borderRight: '1px solid var(--border)' }} />
              {DAYS.map((day, di) => {
                const isToday = DAY_IDX[di] === todayDayIdx
                return (
                  <div
                    key={day}
                    className="flex-1 text-center py-3"
                    style={{
                      borderRight: di < DAYS.length - 1 ? '1px solid var(--border)' : 'none',
                      backgroundColor: isToday ? 'rgba(32,244,78,0.06)' : 'transparent',
                    }}
                  >
                    <p
                      className="t-label"
                      style={{ color: isToday ? 'var(--brand)' : 'var(--muted-foreground)' }}
                    >
                      {day.toUpperCase()}
                    </p>
                    {isToday && (
                      <span
                        className="t-label"
                        style={{ color: 'var(--brand)', fontSize: 10 }}
                      >
                        TODAY
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Time slot rows */}
            {TIME_SLOTS.map((time, ti) => {
              const hour = 8 + ti
              return (
                <div
                  key={time}
                  className="flex"
                  style={{
                    height: ROW_H,
                    borderBottom: ti < TIME_SLOTS.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  {/* Time label */}
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

                  {/* Day columns */}
                  {DAY_IDX.map((dayIdx, di) => {
                    const entry    = getEntry(dayIdx, hour)
                    const occupied = !entry && isOccupied(dayIdx, hour)
                    const isToday  = dayIdx === todayDayIdx

                    return (
                      <div
                        key={dayIdx}
                        className="flex-1 relative"
                        style={{
                          borderRight: di < DAY_IDX.length - 1 ? '1px solid var(--border)' : 'none',
                          backgroundColor: isToday ? 'rgba(32,244,78,0.03)' : 'transparent',
                        }}
                      >
                        {entry && !occupied && (
                          <div
                            className="absolute inset-x-1 flex flex-col justify-center px-2.5 py-2 rounded-lg overflow-hidden"
                            style={{
                              top: 4,
                              height: entry.duration * ROW_H - 8,
                              backgroundColor: entry.color + '18',
                              border: `1px solid ${entry.color}40`,
                              zIndex: 1,
                            }}
                          >
                            <p
                              className="text-xs font-bold truncate"
                              style={{ color: entry.color, fontFamily: 'var(--font-mono)', letterSpacing: '0.02em' }}
                            >
                              {entry.code}
                            </p>
                            <p
                              className="text-xs font-medium truncate mt-0.5"
                              style={{ color: 'var(--foreground)' }}
                            >
                              {entry.name}
                            </p>
                            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted-foreground)' }}>
                              {entry.room}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Mobile list view ──────────────────────────────────────────────── */}
        <div className="md:hidden flex flex-col gap-5">
          {DAYS.map((day, di) => {
            const dayIdx   = DAY_IDX[di]
            const isToday  = dayIdx === todayDayIdx
            const dayEntries = ENTRIES
              .filter((e) => e.dayIndex === dayIdx)
              .sort((a, b) => a.startHour - b.startHour)

            return (
              <div
                key={day}
                style={{
                  backgroundColor: 'var(--card)',
                  borderRadius: 'var(--radius-xl)',
                  boxShadow: 'var(--shadow-sm)',
                  border: isToday ? '1px solid rgba(32,244,78,0.3)' : '1px solid var(--border)',
                  overflow: 'hidden',
                }}
              >
                <div
                  className="px-5 py-3 flex items-center justify-between"
                  style={{
                    borderBottom: '1px solid var(--border)',
                    backgroundColor: isToday ? 'rgba(32,244,78,0.06)' : 'var(--muted)',
                  }}
                >
                  <p
                    className="t-h3"
                    style={{ fontFamily: 'var(--font-display)', color: isToday ? 'var(--brand)' : 'var(--foreground)' }}
                  >
                    {day}
                  </p>
                  {isToday && (
                    <span
                      className="t-label px-2 py-0.5"
                      style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', borderRadius: 'var(--radius-sm)' }}
                    >
                      TODAY
                    </span>
                  )}
                </div>

                {dayEntries.length === 0 ? (
                  <p className="text-sm px-5 py-4" style={{ color: 'var(--muted-foreground)' }}>
                    No classes
                  </p>
                ) : (
                  <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                    {dayEntries.map((entry) => (
                      <div key={entry.code + entry.startHour} className="flex items-center gap-3 px-5 py-4">
                        <div
                          className="flex-shrink-0 rounded-lg"
                          style={{ width: 4, height: 40, backgroundColor: entry.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{entry.name}</p>
                          <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                            {`${String(entry.startHour).padStart(2,'0')}:00 – ${String(entry.startHour + entry.duration).padStart(2,'0')}:00`} · {entry.room}
                          </p>
                        </div>
                        <span
                          className="t-label px-2 py-0.5 flex-shrink-0"
                          style={{
                            backgroundColor: entry.color + '18',
                            color: entry.color,
                            borderRadius: 'var(--radius-sm)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                          }}
                        >
                          {entry.code}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

      </div>
    </AppShell>
  )
}


