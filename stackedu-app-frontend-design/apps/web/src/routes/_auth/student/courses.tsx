import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  LayoutDashboard, BookOpen, BarChart2, CreditCard, Library, Bell,
  CalendarCheck, ChevronRight, ChevronLeft,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Button }   from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ALL_COURSES, type Course, type CourseType } from '@/data/courses'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/student/courses')({
  component: MyCoursesPage,
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

// ── Semesters ─────────────────────────────────────────────────────────────────

const SEMESTERS = [
  { value: '1-2024-2025', label: '1st Semester 2024/2025' },
  { value: '2-2023-2024', label: '2nd Semester 2023/2024' },
  { value: '1-2023-2024', label: '1st Semester 2023/2024' },
  { value: '2-2022-2023', label: '2nd Semester 2022/2023' },
]

const PAGE_SIZE = 8

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

function MyCoursesPage() {
  const [semester, setSemester] = useState('1-2024-2025')
  const [filter,   setFilter]   = useState<'all' | CourseType>('all')
  const [page,     setPage]     = useState(1)

  const filtered   = ALL_COURSES.filter(c => filter === 'all' || c.type === filter)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleFilterChange   = (f: 'all' | CourseType) => { setFilter(f); setPage(1) }
  const handleSemesterChange = (v: string)              => { setSemester(v); setPage(1) }

  return (
    <AppShell
      navItems={STUDENT_NAV}
      pageTitle="My Courses"
      userName="Jean-Paul Mugisha"
      userRole="Student"
      userInitials="JM"
      unreadCount={3}
      infoCardLabel="STUDENT ID"
      infoCardValue="SFE-2024-0042"
      infoCardSubtext="Year 1"
    >
      <div className="animate-fade-up" style={{ padding: '32px 32px 56px' }}>

        {/* ── Page header ───────────────────────────────────────────────────── */}
        <div
          className="flex items-start justify-between mb-7"
          style={{ gap: 24 }}
        >

          {/* Left — title + inline semester selector */}
          <div>
            <h1
              className="t-h1"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--foreground)',
                letterSpacing: '-0.015em',
                marginBottom: 8,
              }}
            >
              My Courses
            </h1>

            {/* Inline compact semester selector */}
            <div className="flex items-center gap-1">
              <span
                style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', lineHeight: 1 }}
              >
                Semester ·
              </span>
              <Select value={semester} onValueChange={handleSemesterChange}>
                <SelectTrigger
                  style={{
                    height: 'auto',
                    width: 'fit-content',
                    border: 'none',
                    backgroundColor: 'transparent',
                    boxShadow: 'none',
                    padding: '0 2px 0 0',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'var(--foreground)',
                    gap: 4,
                    outline: 'none',
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEMESTERS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Right — registration banner */}
          <RegistrationBanner />
        </div>

        {/* ── Filter pills + count ──────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-5">
          {(['all', 'Compulsory', 'Elective'] as const).map((f) => {
            const active = filter === f
            return (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
                className="px-3 py-1 rounded-full text-xs font-semibold transition-colors duration-150"
                style={{
                  backgroundColor: active ? 'var(--brand)' : 'var(--muted)',
                  color: active ? 'var(--brand-ink)' : 'var(--muted-foreground)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {f === 'all' ? 'All' : f}
              </button>
            )
          })}
          <span
            className="t-caption ml-auto"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {filtered.length} course{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Course list ───────────────────────────────────────────────────── */}
        {paginated.length === 0 ? (
          <EmptyListState />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {paginated.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}

        {/* ── Pagination ────────────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="mt-5">
            <CoursePagination
              page={page}
              totalPages={totalPages}
              onChange={setPage}
            />
          </div>
        )}

      </div>
    </AppShell>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Registration banner — always visible in the page header
// ─────────────────────────────────────────────────────────────────────────────

function RegistrationBanner() {
  return (
    <div
      className="flex items-center gap-3 flex-shrink-0"
      style={{
        padding: '8px 16px',
        backgroundColor: 'var(--success-bg)',
        border: '1px solid var(--success)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <CalendarCheck
        style={{ width: 16, height: 16, color: 'var(--success)', flexShrink: 0 }}
      />
      <div style={{ flexShrink: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)', lineHeight: 1.3, whiteSpace: 'nowrap' }}>
          Registration Open
        </p>
        <p className="t-caption" style={{ color: 'var(--muted-foreground)', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
          Until 15 Feb 2025
        </p>
      </div>
      <Link to="/student/course-registration">
        <Button
          size="sm"
          style={{
            backgroundColor: 'var(--brand)',
            color: 'var(--brand-ink)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          Register for Courses
        </Button>
      </Link>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Course card — full-width horizontal row
// ─────────────────────────────────────────────────────────────────────────────

function CourseCard({ course }: { course: Course }) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      to="/student/course-detail"
      search={{ id: course.id }}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          backgroundColor: 'var(--card)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
          border: '1px solid var(--border)',
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
          transition: 'box-shadow 150ms ease-out, transform 150ms ease-out',
          cursor: 'pointer',
        }}
      >
        {/* 52px coloured code badge */}
        <div
          style={{
            width: 52,
            height: 52,
            backgroundColor: course.color,
            borderRadius: 12,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '0.02em',
              lineHeight: 1.2,
              textAlign: 'center',
            }}
          >
            {course.code}
          </span>
        </div>

        {/* Course info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name + type badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: 3,
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--foreground)',
                lineHeight: 1.4,
              }}
            >
              {course.name}
            </span>
            <span
              className="t-label px-1.5 py-0.5"
              style={{
                backgroundColor: course.type === 'Compulsory' ? 'var(--info-bg)' : 'var(--muted)',
                color: course.type === 'Compulsory' ? 'var(--info)' : 'var(--muted-foreground)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 10,
                letterSpacing: '0.06em',
                whiteSpace: 'nowrap',
              }}
            >
              {course.type.toUpperCase()}
            </span>
          </div>

          {/* Lecturer */}
          <p
            className="t-caption"
            style={{ color: 'var(--muted-foreground)', marginBottom: 1 }}
          >
            {course.lecturer}
          </p>

          {/* Credits */}
          <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
            {course.credits} credit units
          </p>
        </div>

        {/* Navigation arrow */}
        <ChevronRight
          style={{
            width: 18,
            height: 18,
            color: 'var(--muted-foreground)',
            flexShrink: 0,
            transition: 'transform 150ms ease-out',
            transform: hovered ? 'translateX(2px)' : 'translateX(0)',
          }}
        />
      </div>
    </Link>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty list state
// ─────────────────────────────────────────────────────────────────────────────

function EmptyListState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        style={{
          width: 56,
          height: 56,
          backgroundColor: 'var(--muted)',
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
        }}
      >
        <BookOpen style={{ width: 24, height: 24, color: 'var(--muted-foreground)' }} />
      </div>
      <p
        className="t-h3 mb-1"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
      >
        No courses found
      </p>
      <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>
        Try selecting a different filter or semester.
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Pagination — prev / next
// ─────────────────────────────────────────────────────────────────────────────

function CoursePagination({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (p: number) => void
}) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150"
        style={{
          color: page === 1 ? 'var(--muted-foreground)' : 'var(--foreground)',
          backgroundColor: 'var(--muted)',
          border: 'none',
          cursor: page === 1 ? 'not-allowed' : 'pointer',
          opacity: page === 1 ? 0.5 : 1,
        }}
      >
        <ChevronLeft style={{ width: 13, height: 13 }} />
        Previous
      </button>
      <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150"
        style={{
          color: page === totalPages ? 'var(--muted-foreground)' : 'var(--foreground)',
          backgroundColor: 'var(--muted)',
          border: 'none',
          cursor: page === totalPages ? 'not-allowed' : 'pointer',
          opacity: page === totalPages ? 0.5 : 1,
        }}
      >
        Next
        <ChevronRight style={{ width: 13, height: 13 }} />
      </button>
    </div>
  )
}
