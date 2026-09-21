import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  LayoutDashboard, BookOpen, BarChart2, CreditCard, Library, Bell,
  ArrowLeft, AlertCircle, CheckCircle2, AlertTriangle,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Button }   from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ALL_COURSES } from '@/data/courses'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/student/course-registration')({
  component: CourseRegistrationPage,
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

const MAX_CREDITS     = 21
const COMPULSORY      = ALL_COURSES.filter(c => c.type === 'Compulsory')
const ELECTIVES       = ALL_COURSES.filter(c => c.type === 'Elective')
const COMPULSORY_CRED = COMPULSORY.reduce((sum, c) => sum + c.credits, 0) // 12

// Mock retake courses for this student — CSC 103 failed Semester 1 2024/2025
const RETAKE_COURSES = [
  {
    code:           'CSC 103',
    name:           'Digital Logic Design',
    semesterFailed: 'Semester 1 · 2024/2025',
    credits:        3,
    lecturer:       'Dr. Emmanuel Nkurunziza',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

function CourseRegistrationPage() {
  const navigate = useNavigate()

  const [selectedElectives, setSelectedElectives] = useState<string[]>([])
  const [showSuccess,       setShowSuccess]       = useState(false)

  const totalCredits = COMPULSORY_CRED + selectedElectives.length * 3

  const handleElectiveToggle = (id: string) => {
    if (selectedElectives.includes(id)) {
      setSelectedElectives(prev => prev.filter(e => e !== id))
      return
    }
    const nextTotal = COMPULSORY_CRED + (selectedElectives.length + 1) * 3
    if (nextTotal > MAX_CREDITS) {
      toast.warning('You have reached the maximum credit limit for this semester.')
      return
    }
    setSelectedElectives(prev => [...prev, id])
  }

  const handleConfirm = () => {
    setShowSuccess(true)
  }

  const handleGoToCourses = () => {
    setShowSuccess(false)
    void navigate({ to: '/student/courses' })
  }

  return (
    <AppShell
      navItems={STUDENT_NAV}
      pageTitle="Course Registration"
      userName="Jean-Paul Mugisha"
      userRole="Student"
      userInitials="JM"
      unreadCount={3}
      infoCardLabel="STUDENT ID"
      infoCardValue="SFE-2024-0042"
      infoCardSubtext="Year 1"
    >
      <div className="px-8 py-8 animate-fade-up">
        <div className="mx-auto" style={{ maxWidth: 800 }}>

          {/* Back breadcrumb */}
          <Link
            to="/student/courses"
            className="inline-flex items-center gap-1.5 mb-6 transition-opacity hover:opacity-70"
            style={{ color: 'var(--muted-foreground)', textDecoration: 'none', fontSize: '0.875rem' }}
          >
            <ArrowLeft style={{ width: 15, height: 15 }} />
            Back to My Courses
          </Link>

          {/* Section header */}
          <div className="mb-8">
            <h1
              className="t-h1 mb-1"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}
            >
              Course Registration
            </h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
              Semester 1 · 2024/2025
            </p>
          </div>

          {/* Info banner */}
          <div
            className="flex items-start gap-3 rounded-xl px-5 py-4 mb-6"
            style={{ backgroundColor: 'var(--info-bg)', border: '1px solid var(--info)' }}
          >
            <AlertCircle style={{ width: 16, height: 16, color: 'var(--info)', flexShrink: 0, marginTop: 1 }} />
            <p className="text-sm" style={{ color: 'var(--info)', lineHeight: 1.6 }}>
              Compulsory courses are pre-selected and cannot be removed. You may add up to{' '}
              <strong>{Math.floor((MAX_CREDITS - COMPULSORY_CRED) / 3)}</strong> elective courses.
              Maximum credit load is <strong>{MAX_CREDITS}</strong> credits per semester.
            </p>
          </div>

          {/* Retake alert — only shown when student has failed courses */}
          {RETAKE_COURSES.length > 0 && (
            <div
              className="mb-6"
              style={{
                backgroundColor: 'var(--error-bg)',
                borderRadius: 'var(--radius-md)',
                borderLeft: '4px solid var(--error)',
                padding: 16,
              }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <AlertTriangle style={{ width: 15, height: 15, color: 'var(--error)', flexShrink: 0 }} />
                <h2 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--error)' }}>
                  Courses to Retake
                </h2>
              </div>
              <p className="t-caption mb-3" style={{ color: 'var(--error)', opacity: 0.85 }}>
                The following courses are required retakes. They have been pre-selected and cannot be removed from your registration.
              </p>
              <div className="flex flex-col gap-2">
                {RETAKE_COURSES.map((r) => (
                  <div
                    key={r.code}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg flex-wrap"
                    style={{ backgroundColor: 'rgba(220,38,38,0.10)' }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--error)', backgroundColor: 'rgba(220,38,38,0.15)', borderRadius: '10px', padding: '2px 7px', whiteSpace: 'nowrap' }}>
                      {r.code}
                    </span>
                    <span className="text-sm font-medium flex-1" style={{ color: 'var(--foreground)' }}>{r.name}</span>
                    <span className="t-caption" style={{ color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                      Failed {r.semesterFailed}
                    </span>
                    <span className="t-label px-2 py-0.5" style={{ backgroundColor: 'rgba(220,38,38,0.18)', color: 'var(--error)', borderRadius: '10px' }}>
                      Failed
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Registration card */}
          <div
            style={{
              backgroundColor: 'var(--card)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--border)',
              overflow: 'hidden',
              marginBottom: 24,
            }}
          >
            {/* Table header */}
            <div
              className="grid items-center px-6 py-3"
              style={{
                gridTemplateColumns: '36px 1fr 100px 90px 90px 180px',
                backgroundColor: 'var(--muted)',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span />
              <span className="t-label" style={{ color: 'var(--muted-foreground)' }}>COURSE NAME</span>
              <span className="t-label" style={{ color: 'var(--muted-foreground)' }}>CODE</span>
              <span className="t-label" style={{ color: 'var(--muted-foreground)' }}>TYPE</span>
              <span className="t-label text-center" style={{ color: 'var(--muted-foreground)' }}>CREDITS</span>
              <span className="t-label" style={{ color: 'var(--muted-foreground)' }}>LECTURER</span>
            </div>

            {/* Retake courses — pre-checked, disabled */}
            {RETAKE_COURSES.length > 0 && (
              <div>
                <div
                  className="px-6 py-2"
                  style={{ backgroundColor: 'rgba(220,38,38,0.06)', borderBottom: '1px solid var(--border)' }}
                >
                  <span className="t-label" style={{ color: 'var(--error)', letterSpacing: '0.04em' }}>
                    RETAKE REQUIRED
                  </span>
                </div>
                {RETAKE_COURSES.map((course, i) => (
                  <RetakeRow
                    key={course.code}
                    course={course}
                    isLast={i === RETAKE_COURSES.length - 1}
                  />
                ))}
              </div>
            )}

            {/* Compulsory courses */}
            <div>
              <div
                className="px-6 py-2"
                style={{ backgroundColor: 'rgba(37,99,235,0.04)', borderBottom: '1px solid var(--border)' }}
              >
                <span className="t-label" style={{ color: 'var(--info)', letterSpacing: '0.04em' }}>
                  COMPULSORY — PRE-ENROLLED
                </span>
              </div>
              {COMPULSORY.map((course, i) => (
                <RegistrationRow
                  key={course.id}
                  course={course}
                  checked
                  disabled
                  isLast={i === COMPULSORY.length - 1 && ELECTIVES.length === 0}
                  onToggle={() => {}}
                />
              ))}
            </div>

            {/* Elective courses */}
            <div>
              <div
                className="px-6 py-2"
                style={{ backgroundColor: 'var(--muted)', borderBottom: '1px solid var(--border)', borderTop: '1px solid var(--border)' }}
              >
                <span className="t-label" style={{ color: 'var(--muted-foreground)', letterSpacing: '0.04em' }}>
                  ELECTIVES — SELECT UP TO {Math.floor((MAX_CREDITS - COMPULSORY_CRED) / 3)}
                </span>
              </div>
              {ELECTIVES.map((course, i) => (
                <RegistrationRow
                  key={course.id}
                  course={course}
                  checked={selectedElectives.includes(course.id)}
                  disabled={false}
                  isLast={i === ELECTIVES.length - 1}
                  onToggle={() => handleElectiveToggle(course.id)}
                />
              ))}
            </div>
          </div>

          {/* Footer — credit total + actions */}
          <div
            className="flex items-center justify-between rounded-xl px-6 py-4"
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {/* Credit counter */}
            <div className="flex items-center gap-3">
              <div>
                <p className="t-label mb-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  TOTAL CREDITS SELECTED
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span
                    className="text-2xl font-bold"
                    style={{
                      fontFamily: 'var(--font-display)',
                      color: totalCredits > MAX_CREDITS ? 'var(--error)' : 'var(--foreground)',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {totalCredits}
                  </span>
                  <span className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>
                    / {MAX_CREDITS} credits
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div
                className="rounded-full overflow-hidden"
                style={{ width: 120, height: 6, backgroundColor: 'var(--muted)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (totalCredits / MAX_CREDITS) * 100)}%`,
                    backgroundColor: totalCredits > MAX_CREDITS
                      ? 'var(--error)'
                      : totalCredits >= MAX_CREDITS * 0.8
                      ? 'var(--warning)'
                      : 'var(--brand)',
                  }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Link to="/student/courses">
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button
                onClick={handleConfirm}
                disabled={selectedElectives.length === 0}
                style={{
                  backgroundColor: selectedElectives.length > 0 ? 'var(--brand)' : undefined,
                  color: selectedElectives.length > 0 ? 'var(--brand-ink)' : undefined,
                }}
              >
                Confirm Registration
              </Button>
            </div>
          </div>

        </div>
      </div>

      {/* ── Success dialog ────────────────────────────────────────────────── */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent
          style={{
            borderRadius: 'var(--radius-2xl)',
            border: '1px solid var(--border)',
          }}
        >
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div
                className="flex items-center justify-center rounded-2xl"
                style={{ width: 60, height: 60, backgroundColor: 'var(--success-bg)' }}
              >
                <CheckCircle2 style={{ width: 28, height: 28, color: 'var(--success)' }} />
              </div>
            </div>
            <DialogTitle
              className="text-center"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}
            >
              Registration Submitted
            </DialogTitle>
            <DialogDescription className="text-center" style={{ lineHeight: 1.65 }}>
              Registration submitted successfully. Your courses are now active and will appear
              in your course list for Semester 1 · 2024/2025.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <Button
              onClick={handleGoToCourses}
              className="w-full"
              style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}
            >
              Go to My Courses
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </AppShell>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Retake row — pre-checked, disabled, shows Failed badge
// ─────────────────────────────────────────────────────────────────────────────

function RetakeRow({
  course,
  isLast,
}: {
  course: typeof RETAKE_COURSES[number]
  isLast: boolean
}) {
  return (
    <div
      className="grid items-center px-6"
      style={{
        gridTemplateColumns: '36px 1fr 100px 90px 90px 180px',
        paddingTop: 14,
        paddingBottom: 14,
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        backgroundColor: 'rgba(220,38,38,0.04)',
        cursor: 'default',
      }}
    >
      {/* Checkbox — pre-checked, disabled */}
      <div>
        <Checkbox checked disabled />
      </div>

      {/* Course name */}
      <div className="min-w-0 pr-4">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
          {course.name}
        </p>
        <p className="t-caption mt-0.5" style={{ color: 'var(--error)' }}>
          Retake · Failed {course.semesterFailed}
        </p>
      </div>

      {/* Code */}
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--error)', fontWeight: 600 }}>
        {course.code}
      </span>

      {/* Failed badge in place of Type */}
      <span
        className="t-label px-2 py-0.5 w-fit"
        style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error)', borderRadius: '10px' }}
      >
        Failed
      </span>

      {/* Credits */}
      <span
        className="text-sm font-medium text-center"
        style={{ color: 'var(--foreground)', fontFamily: 'var(--font-mono)' }}
      >
        {course.credits}
      </span>

      {/* Lecturer */}
      <span className="t-caption truncate" style={{ color: 'var(--muted-foreground)' }}>
        {course.lecturer}
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Registration row
// ─────────────────────────────────────────────────────────────────────────────

function RegistrationRow({
  course,
  checked,
  disabled,
  isLast,
  onToggle,
}: {
  course: typeof ALL_COURSES[number]
  checked: boolean
  disabled: boolean
  isLast: boolean
  onToggle: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="grid items-center px-6 transition-colors duration-150"
      style={{
        gridTemplateColumns: '36px 1fr 100px 90px 90px 180px',
        paddingTop: 14,
        paddingBottom: 14,
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        backgroundColor: checked && !disabled
          ? 'rgba(32,244,78,0.04)'
          : hovered && !disabled ? 'var(--muted)' : 'transparent',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.75 : 1,
      }}
      onClick={disabled ? undefined : onToggle}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Checkbox */}
      <div onClick={e => e.stopPropagation()}>
        <Checkbox
          checked={checked}
          disabled={disabled}
          onCheckedChange={disabled ? undefined : onToggle}
          style={checked && !disabled ? { backgroundColor: 'var(--brand)', borderColor: 'var(--brand)' } : {}}
        />
      </div>

      {/* Course name */}
      <div className="min-w-0 pr-4">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
          {course.name}
        </p>
      </div>

      {/* Code */}
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: course.color,
          fontWeight: 600,
        }}
      >
        {course.code}
      </span>

      {/* Type badge */}
      <span
        className="t-label px-2 py-0.5 w-fit"
        style={{
          backgroundColor: course.type === 'Compulsory' ? 'var(--info-bg)' : 'var(--muted)',
          color: course.type === 'Compulsory' ? 'var(--info)' : 'var(--muted-foreground)',
          borderRadius: 'var(--radius-sm)',
        }}
      >
        {course.type}
      </span>

      {/* Credits */}
      <span
        className="text-sm font-medium text-center"
        style={{ color: 'var(--foreground)', fontFamily: 'var(--font-mono)' }}
      >
        {course.credits}
      </span>

      {/* Lecturer */}
      <span className="t-caption truncate" style={{ color: 'var(--muted-foreground)' }}>
        {course.lecturer}
      </span>
    </div>
  )
}
