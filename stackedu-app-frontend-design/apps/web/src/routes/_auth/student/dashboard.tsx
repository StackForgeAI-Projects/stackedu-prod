import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  LayoutDashboard, BookOpen, BarChart2, CreditCard, Library, Bell,
  TrendingUp, Users, Sparkles, Send, RotateCcw, ChevronLeft, ChevronRight,
  FileText, AlertCircle, BookMarked,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { StatTile } from '@/components/StatTile'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/student/dashboard')({
  component: StudentDashboardPage,
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

// ── Student ───────────────────────────────────────────────────────────────────

const STUDENT = {
  firstName: 'Jean-Paul',
  fullName:  'Jean-Paul Mugisha',
  id:        'SFE-2024-0042',
  initials:  'JM',
  year:      1,
}

// ── Enrolled courses ──────────────────────────────────────────────────────────

const ENROLLED_COURSES = [
  { code: 'CSC 101', name: 'Introduction to Computer Science', lecturer: 'Dr. Emmanuel Nkurunziza', credits: 3, color: '#0D9488', initials: 'CS' },
  { code: 'CSC 102', name: 'Programming Fundamentals',         lecturer: 'Prof. Aline Uwimana',      credits: 3, color: '#7C3AED', initials: 'PF' },
  { code: 'MTH 101', name: 'Calculus I',                       lecturer: 'Dr. Patrick Habimana',     credits: 3, color: '#D97706', initials: 'CA' },
  { code: 'ENG 101', name: 'English Communication Skills',     lecturer: 'Ms. Grace Mukamana',       credits: 3, color: '#2563EB', initials: 'EC' },
]

// ── Recent results ────────────────────────────────────────────────────────────

const RECENT_RESULTS = [
  { code: 'CSC 101', name: 'Introduction to Computer Science', grade: 'A',  credits: 3 },
  { code: 'MTH 101', name: 'Calculus I',                       grade: 'B+', credits: 3 },
  { code: 'ENG 101', name: 'English Communication Skills',     grade: 'A',  credits: 3 },
]

// ── Deadlines ─────────────────────────────────────────────────────────────────

const DEADLINES = [
  { id: 1, title: 'Semester 1 Fees Due',         date: '31 Jan 2025', type: 'fee',          icon: CreditCard  },
  { id: 2, title: 'Course Registration Closes',  date: '15 Feb 2025', type: 'registration', icon: BookMarked  },
  { id: 3, title: 'CSC 101 — Assignment 2 Due',  date: '20 Jan 2025', type: 'assignment',   icon: FileText    },
]

// ── Timetable (day-of-week → slots) ─────────────────────────────────────────-

const WEEK_SLOTS: Record<number, { code: string; shortName: string; time: string; color: string }[]> = {
  1: [
    { code: 'CSC 101', shortName: 'Intro CS',    time: '08:00', color: '#0D9488' },
    { code: 'MTH 101', shortName: 'Calculus I',  time: '14:00', color: '#D97706' },
  ],
  2: [
    { code: 'CSC 102', shortName: 'Prog Fund',  time: '10:00', color: '#7C3AED' },
    { code: 'ENG 101', shortName: 'Eng Comm',   time: '14:00', color: '#2563EB' },
  ],
  3: [
    { code: 'CSC 101', shortName: 'Intro CS',   time: '10:00', color: '#0D9488' },
    { code: 'MTH 101', shortName: 'Calculus I', time: '08:00', color: '#D97706' },
  ],
  4: [
    { code: 'CSC 102', shortName: 'Prog Fund',  time: '08:00', color: '#7C3AED' },
    { code: 'PHY 101', shortName: 'Physics I',  time: '14:00', color: '#E11D48' },
  ],
  5: [
    { code: 'ENG 101', shortName: 'Eng Comm', time: '10:00', color: '#2563EB' },
  ],
}

// ── Daily schedule (day-of-week → detail list) ────────────────────────────────

const DAILY_DETAIL: Record<number, { time: string; course: string; code: string; type: 'Lecture'|'Tutorial'|'Lab'; room: string; color: string }[]> = {
  1: [
    { time: '08:00 – 10:00', course: 'Introduction to Computer Science', code: 'CSC 101', type: 'Lecture',  room: 'Lab 3',    color: '#0D9488' },
    { time: '14:00 – 16:00', course: 'Calculus I',                       code: 'MTH 101', type: 'Tutorial', room: 'Hall A',   color: '#D97706' },
  ],
  2: [
    { time: '10:00 – 12:00', course: 'Programming Fundamentals',         code: 'CSC 102', type: 'Lab',      room: 'Lab 2',    color: '#7C3AED' },
    { time: '14:00 – 16:00', course: 'English Communication Skills',     code: 'ENG 101', type: 'Lecture',  room: 'Room 101', color: '#2563EB' },
  ],
  3: [
    { time: '08:00 – 10:00', course: 'Calculus I',                       code: 'MTH 101', type: 'Lecture',  room: 'Hall A',   color: '#D97706' },
    { time: '10:00 – 12:00', course: 'Introduction to Computer Science', code: 'CSC 101', type: 'Tutorial', room: 'Lab 3',    color: '#0D9488' },
  ],
  4: [
    { time: '08:00 – 10:00', course: 'Programming Fundamentals',         code: 'CSC 102', type: 'Lecture',  room: 'Lab 2',    color: '#7C3AED' },
    { time: '14:00 – 16:00', course: 'Physics I',                        code: 'PHY 101', type: 'Lab',      room: 'Lab 4',    color: '#E11D48' },
  ],
  5: [
    { time: '10:00 – 12:00', course: 'English Communication Skills',     code: 'ENG 101', type: 'Tutorial', room: 'Room 101', color: '#2563EB' },
  ],
}

// ── Calendar helpers ─────────────────────────────────────────────────────────-

function getWeekDays(ref: Date): Date[] {
  const sunday = new Date(ref)
  sunday.setDate(ref.getDate() - ref.getDay())
  sunday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday); d.setDate(sunday.getDate() + i); return d
  })
}

function getMonthDays(ref: Date): (Date | null)[] {
  const year = ref.getFullYear(), month = ref.getMonth()
  const first = new Date(year, month, 1)
  const last  = new Date(year, month + 1, 0)
  const result: (Date | null)[] = []
  for (let i = 0; i < first.getDay(); i++) result.push(null)
  for (let d = 1; d <= last.getDate(); d++) result.push(new Date(year, month, d))
  while (result.length % 7 !== 0) result.push(null)
  return result
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

const MONTH_NAMES = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']
const DAY_ABBR = ['S','M','T','W','T','F','S']
const DAY_FULL = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

// ── Grade badge ───────────────────────────────────────────────────────────────

function GradeBadge({ grade }: { grade: string }) {
  const isA  = grade.startsWith('A')
  const isB  = grade.startsWith('B')
  const isC  = grade.startsWith('C')
  const bg   = isA ? 'var(--success-bg)' : isB ? 'var(--info-bg)' : isC ? 'var(--warning-bg)' : 'var(--error-bg)'
  const col  = isA ? 'var(--success)'    : isB ? 'var(--info)'    : isC ? 'var(--warning)'    : 'var(--error)'
  return (
    <span
      className="t-label px-2 py-0.5"
      style={{ backgroundColor: bg, color: col, borderRadius: 'var(--radius-sm)' }}
    >
      {grade}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function StudentDashboardPage() {
  const today    = new Date()
  const hours    = today.getHours()
  const greeting = hours < 12 ? 'Good morning' : hours < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr  = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <AppShell
      navItems={STUDENT_NAV}
      pageTitle="Dashboard"
      userName={STUDENT.fullName}
      userRole="Student"
      userInitials={STUDENT.initials}
      unreadCount={3}
      infoCardLabel="STUDENT ID"
      infoCardValue={STUDENT.id}
      infoCardSubtext={`Year ${STUDENT.year}`}
    >
      {/* Two-column layout — both panels scroll independently */}
      <div className="flex" style={{ height: 'calc(100vh - var(--header-height))', overflow: 'hidden' }}>

        {/* ── Left / Main content ─────────────────────────────────────────── */}
        <div
          className="flex-1 min-w-0 overflow-y-auto animate-fade-up"
          style={{ padding: '32px 24px 48px 32px' }}
        >
          {/* Page header */}
          <div className="mb-8">
            <h1
              className="t-h1 mb-1"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}
            >
              {greeting}, {STUDENT.firstName} 👋
            </h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>{dateStr}</p>
          </div>

          {/* ── Row 1 — 3 StatTiles ──────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatTile
              icon={TrendingUp}
              iconColor="var(--brand)"
              iconBg="rgba(32,244,78,0.08)"
              label="CURRENT GPA"
              value="3.6"
              valueUnit="/ 4.0"
              delta="+0.2 this semester"
              deltaColor="var(--success)"
              animationDelay={0}
            />
            <StatTile
              icon={CreditCard}
              iconColor="var(--warning)"
              iconBg="var(--warning-bg)"
              label="OUTSTANDING FEES"
              value={formatCurrency(45000)}
              animationDelay={60}
              footer={
                <Link
                  to="/student/fees"
                  className="text-xs font-semibold mt-2 transition-opacity hover:opacity-70 w-fit"
                  style={{ color: 'var(--success)' }}
                >
                  Pay now →
                </Link>
              }
            />
            <StatTile
              icon={Users}
              iconColor="var(--error)"
              iconBg="var(--error-bg)"
              label="ATTENDANCE RATE"
              value="87%"
              delta="−3% from last week"
              deltaColor="var(--error)"
              animationDelay={120}
            />
          </div>

          {/* ── Row 2 — Courses card ─────────────────────────────────────── */}
          <CoursesCard />

          {/* ── Row 3 — Recent Results card ──────────────────────────────── */}
          <RecentResultsCard />
        </div>

        {/* ── Right / Sidebar panel ───────────────────────────────────────── */}
        <div
          className="flex-shrink-0 overflow-y-auto animate-fade-up"
          style={{
            width: '38%',
            borderLeft: '1px solid var(--border)',
            padding: '32px 24px 48px 20px',
            animationDelay: '100ms',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <CalendarCard />
          <AiAssistantCard />
        </div>

      </div>
    </AppShell>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Courses card
// ─────────────────────────────────────────────────────────────────────────────

function CoursesCard() {
  return (
    <div
      className="mb-5 animate-fade-up"
      style={{
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border)',
        padding: 24,
        animationDelay: '60ms',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
          Courses
        </h2>
        <Link
          to="/student/courses"
          className="text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: 'var(--success)' }}
        >
          View all →
        </Link>
      </div>

      {/* Course rows */}
      <div className="flex flex-col" style={{ gap: 0 }}>
        {ENROLLED_COURSES.map((course, i) => (
          <CourseRow key={course.code} course={course} isLast={i === ENROLLED_COURSES.length - 1} />
        ))}
      </div>
    </div>
  )
}

function CourseRow({ course, isLast }: { course: typeof ENROLLED_COURSES[number]; isLast: boolean }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="flex items-center gap-4 py-3.5 transition-colors duration-150"
      style={{
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        backgroundColor: hovered ? 'var(--muted)' : 'transparent',
        borderRadius: hovered ? 'var(--radius-md)' : 0,
        padding: hovered ? '14px 10px' : '14px 0',
        cursor: 'default',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Course code badge */}
      <div
        className="flex items-center justify-center flex-shrink-0 rounded-lg"
        style={{ width: 52, height: 52, backgroundColor: course.color }}
      >
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: '#FFFFFF' }}>
          {course.code}
        </span>
      </div>

      {/* Course info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
          {course.name}
        </p>
        <p className="t-caption mt-0.5 truncate" style={{ color: 'var(--muted-foreground)' }}>
          {course.lecturer}
        </p>
      </div>

      {/* Credits badge */}
      <span
        className="t-label px-2.5 py-1 flex-shrink-0"
        style={{
          backgroundColor: 'var(--muted)',
          color: 'var(--muted-foreground)',
          borderRadius: 'var(--radius-sm)',
        }}
      >
        {course.credits} cr
      </span>

      {/* Course detail button */}
      <Link
        to="/student/course-detail"
        search={{ id: course.code }}
        className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors duration-150"
        style={{
          border: '1px solid var(--border)',
          color: 'var(--foreground)',
          backgroundColor: 'var(--card)',
          textDecoration: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--muted)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--card)'
        }}
      >
        Course detail
      </Link>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Recent results card
// ─────────────────────────────────────────────────────────────────────────────

function RecentResultsCard() {
  return (
    <div
      className="animate-fade-up"
      style={{
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border)',
        padding: 24,
        animationDelay: '120ms',
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
          Recent Results
        </h2>
        <Link
          to="/student/results"
          className="text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: 'var(--success)' }}
        >
          View all →
        </Link>
      </div>

      <div className="flex flex-col" style={{ gap: 0 }}>
        {RECENT_RESULTS.map((result, i) => {
          const isLast = i === RECENT_RESULTS.length - 1
          return (
            <div
              key={result.code}
              className="flex items-center gap-4 py-3.5"
              style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}
            >
              <span
                className="t-mono flex-shrink-0"
                style={{ color: 'var(--muted-foreground)', width: 56 }}
              >
                {result.code}
              </span>
              <span className="flex-1 text-sm min-w-0 truncate" style={{ color: 'var(--foreground)' }}>
                {result.name}
              </span>
              <GradeBadge grade={result.grade} />
              <span className="t-caption flex-shrink-0" style={{ color: 'var(--muted-foreground)', width: 40, textAlign: 'right' }}>
                {result.credits} cr
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Assistant card
// ─────────────────────────────────────────────────────────────────────────────

function AiAssistantCard() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    { role: 'assistant', text: `Hi ${STUDENT.firstName}! I can help with course, fee payments, and academic questions. What do you need?` },
  ])
  const [sending, setSending] = useState(false)

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text }])
    setSending(true)
    await new Promise((r) => setTimeout(r, 900))
    setMessages((m) => [...m, { role: 'assistant', text: 'Great question! Let me look that up for you.' }])
    setSending(false)
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--ink)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--ink-border)',
        padding: 20,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles style={{ width: 16, height: 16, color: 'var(--brand)' }} />
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.9375rem',
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '-0.01em',
            }}
          >
            StackEDU AI
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="t-label px-2 py-0.5"
            style={{
              backgroundColor: 'var(--brand)',
              color: 'var(--brand-ink)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            LIVE
          </span>
          <button
            onClick={() => setMessages([{ role: 'assistant', text: `Hi ${STUDENT.firstName}! I can help with course, fee payments, and academic questions. What do you need?` }])}
            title="Clear chat"
            style={{ color: 'var(--ink-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
          >
            <RotateCcw style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>
      <p className="t-caption mb-4" style={{ color: 'var(--ink-muted)' }}>
        Ask anything about your courses, fees, or campus.
      </p>

      {/* Chat messages */}
      <div className="flex flex-col gap-2 mb-3" style={{ maxHeight: 140, overflowY: 'auto' }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            className="text-sm px-3 py-2.5"
            style={{
              backgroundColor: msg.role === 'assistant' ? 'var(--ink-surface)' : 'rgba(32,244,78,0.12)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--ink-foreground)',
              lineHeight: 1.5,
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '92%',
            }}
          >
            {msg.text}
          </div>
        ))}
        {sending && (
          <div
            className="text-sm px-3 py-2.5"
            style={{
              backgroundColor: 'var(--ink-surface)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--ink-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Thinking…
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send() }}
          placeholder="Ask a question…"
          className="flex-1 text-sm outline-none bg-transparent"
          style={{
            backgroundColor: 'var(--ink-surface)',
            border: '1px solid var(--ink-border)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            color: 'var(--ink-foreground)',
          }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || sending}
          className="flex items-center justify-center flex-shrink-0 transition-opacity duration-150"
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            backgroundColor: 'var(--brand)',
            color: 'var(--brand-ink)',
            border: 'none',
            cursor: input.trim() && !sending ? 'pointer' : 'not-allowed',
            opacity: input.trim() && !sending ? 1 : 0.5,
          }}
        >
          <Send style={{ width: 14, height: 14 }} />
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Calendar card + Daily Schedule card + Deadlines card
// ─────────────────────────────────────────────────────────────────────────────

function CalendarCard() {
  const today = new Date()
  const [navDate, setNavDate]           = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())

  const navigate = (dir: -1 | 1) => {
    const d = new Date(navDate)
    d.setMonth(d.getMonth() + dir)
    setNavDate(d)
  }

  const monthDays = getMonthDays(navDate)
  const heading   = `${MONTH_NAMES[navDate.getMonth()]} ${navDate.getFullYear()}`

  return (
    <>
      {/* Calendar card */}
      <div
        style={{
          backgroundColor: 'var(--card)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border)',
          padding: 20,
        }}
      >
        {/* Calendar header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center rounded-lg transition-colors duration-150"
            style={{ width: 28, height: 28, color: 'var(--muted-foreground)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            <ChevronLeft style={{ width: 16, height: 16 }} />
          </button>

          <h3 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '0.9375rem' }}>
            {heading}
          </h3>

          <button
            onClick={() => navigate(1)}
            className="flex items-center justify-center rounded-lg transition-colors duration-150"
            style={{ width: 28, height: 28, color: 'var(--muted-foreground)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            <ChevronRight style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Month calendar */}
        <div>
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_FULL.map((d) => (
              <span key={d} className="t-label text-center" style={{ color: 'var(--muted-foreground)', fontSize: 10 }}>
                {d}
              </span>
            ))}
          </div>
          {/* Day grid */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {monthDays.map((day, i) => {
              if (!day) return <div key={`null-${i}`} />
              const isToday     = isSameDay(day, today)
              const isSelected  = isSameDay(day, selectedDate)
              const hasClass    = (WEEK_SLOTS[day.getDay()]?.length ?? 0) > 0
              const isThisMonth = day.getMonth() === navDate.getMonth()

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className="flex flex-col items-center gap-0.5 py-1"
                  style={{
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isSelected ? 'rgba(32,244,78,0.08)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    opacity: isThisMonth ? 1 : 0.3,
                  }}
                >
                  <span
                    className="flex items-center justify-center text-xs"
                    style={{
                      width: 22, height: 22, borderRadius: '50%',
                      backgroundColor: isToday ? 'var(--brand)' : 'transparent',
                      color: isToday ? 'var(--brand-ink)' : 'var(--foreground)',
                      fontWeight: isToday || isSelected ? 700 : 400,
                    }}
                  >
                    {day.getDate()}
                  </span>
                  {hasClass && (
                    <span
                      style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: 'var(--brand)' }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Daily Schedule card */}
      <DailyScheduleCard selectedDate={selectedDate} />

      {/* Deadlines card */}
      <DeadlinesCard />
    </>
  )
}

// ── Daily Schedule ────────────────────────────────────────────────────────────

function DailyScheduleCard({ selectedDate }: { selectedDate: Date }) {
  const dow      = selectedDate.getDay()
  const schedule = DAILY_DETAIL[dow] ?? []
  const dateLabel = selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })

  const typeColors: Record<string, { bg: string; color: string }> = {
    Lecture:  { bg: 'var(--info-bg)',         color: 'var(--info)'    },
    Tutorial: { bg: 'var(--warning-bg)',       color: 'var(--warning)' },
    Lab:      { bg: 'rgba(32,244,78,0.08)',   color: 'var(--brand)'   },
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border)',
        padding: 20,
      }}
    >
      <div className="mb-4">
        <h3 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '0.9375rem', marginBottom: 2 }}>
          Schedule
        </h3>
        <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{dateLabel}</p>
      </div>

      {schedule.length === 0 ? (
        <p className="text-sm text-center py-4" style={{ color: 'var(--muted-foreground)' }}>
          No classes scheduled
        </p>
      ) : (
        <div className="flex flex-col" style={{ gap: 0 }}>
          {schedule.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 py-3"
              style={{ borderBottom: i < schedule.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <span className="t-mono flex-shrink-0" style={{ color: 'var(--muted-foreground)', width: 80, fontSize: 11 }}>
                {item.time}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{item.code}</span>
                  {' · '}{item.course}
                </p>
              </div>
              <span
                className="t-label px-1.5 py-0.5 flex-shrink-0"
                style={{
                  backgroundColor: typeColors[item.type]?.bg ?? 'var(--muted)',
                  color: typeColors[item.type]?.color ?? 'var(--muted-foreground)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 10,
                }}
              >
                {item.type}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Deadlines ─────────────────────────────────────────────────────────────────

function DeadlinesCard() {
  const badgeColors: Record<string, { bg: string; color: string }> = {
    fee:          { bg: 'var(--warning-bg)', color: 'var(--warning)' },
    registration: { bg: 'var(--info-bg)',    color: 'var(--info)'    },
    assignment:   { bg: 'var(--error-bg)',   color: 'var(--error)'   },
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border)',
        padding: 20,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '0.9375rem' }}>
          Deadlines
        </h3>
        <Link
          to="/student/notifications"
          className="text-xs font-medium transition-opacity hover:opacity-70"
          style={{ color: 'var(--success)' }}
        >
          View all →
        </Link>
      </div>

      <div className="flex flex-col" style={{ gap: 0 }}>
        {DEADLINES.map((item, i) => {
          const bc = badgeColors[item.type] ?? { bg: 'var(--muted)', color: 'var(--muted-foreground)' }
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 py-3"
              style={{ borderBottom: i < DEADLINES.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <div
                className="flex items-center justify-center rounded-lg flex-shrink-0"
                style={{ width: 30, height: 30, backgroundColor: bc.bg }}
              >
                <item.icon style={{ width: 14, height: 14, color: bc.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
                  {item.title}
                </p>
                <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  {item.date}
                </p>
              </div>
              <span
                className="t-label px-1.5 py-0.5 flex-shrink-0"
                style={{
                  backgroundColor: bc.bg,
                  color: bc.color,
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 10,
                  textTransform: 'capitalize',
                }}
              >
                {item.type}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}


