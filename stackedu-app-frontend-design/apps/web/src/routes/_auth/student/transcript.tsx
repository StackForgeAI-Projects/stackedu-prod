import { createFileRoute } from '@tanstack/react-router'
import {
  LayoutDashboard, BookOpen, BarChart2, CreditCard, Library, Bell,
  Download,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/ui/button'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/student/transcript')({
  component: TranscriptPage,
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

// ── Mock data ─────────────────────────────────────────────────────────────────

const STUDENT = {
  fullName:       'Jean-Paul Mugisha',
  id:             'SFE-2024-0042',
  programme:      'Bachelor of Science in Computer Science',
  faculty:        'Faculty of Science & Technology',
  enrollmentDate: '02 September 2024',
  institution:    'StackForgeAI University',
  initials:       'JM',
}

const SEMESTERS = [
  {
    label: 'Semester 1 — Academic Year 2024/2025',
    gpa: 3.60,
    courses: [
      { code: 'CSC 101', name: 'Introduction to Computer Science', credits: 3, grade: 'A',  points: 4.0 },
      { code: 'CSC 102', name: 'Programming Fundamentals',         credits: 3, grade: 'B+', points: 3.5 },
      { code: 'MTH 101', name: 'Calculus I',                       credits: 3, grade: 'B+', points: 3.5 },
      { code: 'ENG 101', name: 'English Communication Skills',     credits: 3, grade: 'A',  points: 4.0 },
      { code: 'PHY 101', name: 'Physics I',                        credits: 3, grade: 'B',  points: 3.0 },
    ],
  },
]

const TOTAL_CREDITS = SEMESTERS.reduce(
  (sum, sem) => sum + sem.courses.reduce((s, c) => s + c.credits, 0), 0
)
const CGPA = 3.40

// ── Grade badge ───────────────────────────────────────────────────────────────

function GradeBadge({ grade }: { grade: string }) {
  const g     = grade.charAt(0)
  const bg    = g === 'A' ? 'var(--success-bg)' : g === 'B' ? 'var(--info-bg)' : g === 'C' ? 'var(--warning-bg)' : 'var(--error-bg)'
  const color = g === 'A' ? 'var(--success)'    : g === 'B' ? 'var(--info)'    : g === 'C' ? 'var(--warning)'    : 'var(--error)'
  return (
    <span
      className="t-label px-2 py-0.5 inline-flex items-center"
      style={{ backgroundColor: bg, color, borderRadius: 'var(--radius-sm)' }}
    >
      {grade}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function TranscriptPage() {
  return (
    <AppShell
      navItems={STUDENT_NAV}
      pageTitle="Official Transcript"
      userName={STUDENT.fullName}
      userRole="Student"
      userInitials={STUDENT.initials}
      unreadCount={3}
      infoCardLabel="STUDENT ID"
      infoCardValue={STUDENT.id}
      infoCardSubtext="Year 1"
    >
      <div className="px-8 py-8 animate-fade-up">

        {/* Section header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1
              className="t-h1 mb-1"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}
            >
              Official Transcript
            </h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
              Generated {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <Button className="gap-2 font-semibold transition-transform duration-150 hover:-translate-y-px active:translate-y-0">
            <Download style={{ width: 15, height: 15 }} />
            Download PDF
          </Button>
        </div>

        {/* Transcript card */}
        <div
          className="mx-auto"
          style={{
            maxWidth: 800,
            backgroundColor: 'var(--card)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border)',
            padding: 48,
          }}
        >
          {/* ── Document header ───────────────────────────────────────────── */}
          <div className="flex flex-col items-center text-center mb-8">
            {/* Logo mark */}
            <div
              className="flex items-center justify-center rounded-xl mb-3 text-xs font-bold tracking-widest uppercase"
              style={{ width: 48, height: 48, backgroundColor: 'var(--ink)', color: 'var(--brand)' }}
            >
              SE
            </div>
            <h2
              className="t-h2 mb-1"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.01em' }}
            >
              {STUDENT.institution}
            </h2>
            <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>
              Powered by StackEDU · StackForgeAI
            </p>
            <div style={{ height: 1, width: 60, backgroundColor: 'var(--brand)', marginTop: 12, marginBottom: 12 }} />
            <p
              className="t-label"
              style={{ color: 'var(--muted-foreground)', letterSpacing: '0.12em', textTransform: 'uppercase' }}
            >
              Official Academic Transcript
            </p>
          </div>

          {/* ── Student information ───────────────────────────────────────── */}
          <div
            className="mb-8 p-6 rounded-xl"
            style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}
          >
            <p className="t-label mb-4" style={{ color: 'var(--muted-foreground)' }}>STUDENT INFORMATION</p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              {[
                { label: 'Full Name',        value: STUDENT.fullName,       mono: false },
                { label: 'Student ID',       value: STUDENT.id,             mono: true  },
                { label: 'Programme',        value: STUDENT.programme,      mono: false },
                { label: 'Faculty',          value: STUDENT.faculty,        mono: false },
                { label: 'Enrollment Date',  value: STUDENT.enrollmentDate, mono: false },
                { label: 'Transcript Date',
                  value: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
                  mono: false },
              ].map((item) => (
                <div key={item.label}>
                  <p className="t-label mb-0.5" style={{ color: 'var(--muted-foreground)' }}>{item.label}</p>
                  <p
                    className="text-sm font-medium"
                    style={{
                      color: 'var(--foreground)',
                      fontFamily: item.mono ? 'var(--font-mono)' : undefined,
                    }}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Results by semester ───────────────────────────────────────── */}
          {SEMESTERS.map((sem, si) => {
            const semCredits = sem.courses.reduce((s, c) => s + c.credits, 0)
            const semPoints  = sem.courses.reduce((s, c) => s + c.points * c.credits, 0)

            return (
              <div key={si} className="mb-8">
                <div
                  className="flex items-center justify-between px-4 py-2.5 rounded-lg mb-3"
                  style={{ backgroundColor: 'var(--ink)', border: '1px solid var(--ink-border)' }}
                >
                  <p
                    className="text-sm font-semibold"
                    style={{ fontFamily: 'var(--font-display)', color: '#FFFFFF', letterSpacing: '-0.01em' }}
                  >
                    {sem.label}
                  </p>
                  <span
                    className="t-label px-2 py-0.5"
                    style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', borderRadius: 'var(--radius-sm)' }}
                  >
                    GPA {sem.gpa.toFixed(2)}
                  </span>
                </div>

                {/* Semester table */}
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                  {/* Header */}
                  <div
                    className="grid px-4 py-2.5"
                    style={{
                      gridTemplateColumns: '90px 1fr 70px 70px 70px',
                      borderBottom: '1px solid var(--border)',
                      backgroundColor: 'var(--muted)',
                    }}
                  >
                    {['CODE', 'COURSE NAME', 'CREDITS/UNITS', 'GRADE', 'POINTS'].map((h) => (
                      <span key={h} className="t-label" style={{ color: 'var(--muted-foreground)' }}>{h}</span>
                    ))}
                  </div>

                  {/* Rows */}
                  {sem.courses.map((course, ci) => (
                    <div
                      key={course.code}
                      className="grid items-center px-4"
                      style={{
                        gridTemplateColumns: '90px 1fr 70px 70px 70px',
                        paddingTop: 12,
                        paddingBottom: 12,
                        borderBottom: ci < sem.courses.length - 1 ? '1px solid var(--border)' : 'none',
                      }}
                    >
                      <span className="t-mono text-sm" style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>
                        {course.code}
                      </span>
                      <span className="text-sm" style={{ color: 'var(--foreground)' }}>{course.name}</span>
                      <span className="text-sm" style={{ color: 'var(--foreground)' }}>{course.credits}</span>
                      <GradeBadge grade={course.grade} />
                      <span className="text-sm" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-mono)' }}>
                        {course.points.toFixed(1)}
                      </span>
                    </div>
                  ))}

                  {/* Semester total row */}
                  <div
                    className="grid items-center px-4 py-2.5"
                    style={{
                      gridTemplateColumns: '90px 1fr 70px 70px 70px',
                      borderTop: '2px solid var(--border)',
                      backgroundColor: 'var(--muted)',
                    }}
                  >
                    <span />
                    <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                      Semester Total
                    </span>
                    <span className="text-sm font-semibold" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-mono)' }}>
                      {semCredits}
                    </span>
                    <span />
                    <span className="text-sm font-semibold" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-mono)' }}>
                      {semPoints.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}

          {/* ── Summary footer ────────────────────────────────────────────── */}
          <div
            className="p-6 rounded-xl"
            style={{ backgroundColor: 'var(--ink)', border: '1px solid var(--ink-border)' }}
          >
            <p className="t-label mb-4" style={{ color: 'var(--ink-muted)' }}>ACADEMIC SUMMARY</p>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="t-label mb-1" style={{ color: 'var(--ink-muted)' }}>TOTAL CREDITS EARNED</p>
                <p
                  style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.01em' }}
                >
                  {TOTAL_CREDITS}
                </p>
              </div>
              <div>
                <p className="t-label mb-1" style={{ color: 'var(--ink-muted)' }}>CGPA</p>
                <p
                  style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--brand)', letterSpacing: '-0.01em' }}
                >
                  {CGPA.toFixed(2)} <span style={{ fontSize: '1rem', color: 'var(--ink-muted)', fontWeight: 400 }}> / 4.0</span>
                </p>
              </div>
              <div>
                <p className="t-label mb-1" style={{ color: 'var(--ink-muted)' }}>ACADEMIC STANDING</p>
                <span
                  className="t-label px-3 py-1.5 inline-block mt-1"
                  style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-sm)' }}
                >
                  Good Standing
                </span>
              </div>
            </div>

            <div
              className="mt-4 pt-4 text-xs"
              style={{ borderTop: '1px solid var(--ink-border)', color: 'var(--ink-muted)' }}
            >
              This is an official transcript generated by StackEDU on behalf of {STUDENT.institution}.
              For certified copies please contact the registry office.
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  )
}


