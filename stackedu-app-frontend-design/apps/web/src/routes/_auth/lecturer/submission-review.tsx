import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  LayoutDashboard, BookOpen, BarChart2, Bell, ClipboardList,
  FileText, TrendingUp, ArrowLeft, Download,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  LECTURER, LECTURER_COURSES, LECTURER_ASSIGNMENTS,
  ASSIGNMENT_SUBMISSIONS, calcGrade, gradeColor, type AssignmentSubmission,
} from '@/data/lecturer'

export const Route = createFileRoute('/_auth/lecturer/submission-review')({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === 'number' ? search.id : 1,
  }),
  component: SubmissionReviewPage,
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

const STATUS_STYLE: Record<AssignmentSubmission['status'], { bg: string; color: string }> = {
  Submitted:     { bg: 'var(--success-bg)', color: 'var(--success)'          },
  Late:          { bg: 'var(--warning-bg)', color: 'var(--warning)'          },
  'Not submitted': { bg: 'var(--muted)',    color: 'var(--muted-foreground)' },
}

// ─────────────────────────────────────────────────────────────────────────────

function SubmissionReviewPage() {
  const { id }        = Route.useSearch()
  const assignment    = LECTURER_ASSIGNMENTS.find(a => a.id === id) ?? LECTURER_ASSIGNMENTS[0]
  const course        = LECTURER_COURSES.find(c => c.id === assignment.courseId)!
  const submissions   = ASSIGNMENT_SUBMISSIONS[assignment.id] ?? []
  const [activeSubmission, setActiveSubmission] = useState<AssignmentSubmission | null>(null)

  const graded     = submissions.filter(s => s.grade !== undefined).length
  const submitted  = submissions.filter(s => s.status !== 'Not submitted').length
  const avgGrade   = (() => {
    const grades = submissions.map(s => s.grade).filter((g): g is number => g !== undefined)
    return grades.length ? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1) : '—'
  })()

  return (
    <AppShell
      navItems={LECTURER_NAV}
      pageTitle={assignment.title}
      userName={LECTURER.fullName}
      userRole="Lecturer"
      userInitials={LECTURER.initials}
      unreadCount={3}
      infoCardLabel="LECTURER ID"
      infoCardValue={LECTURER.id}
      infoCardSubtext={LECTURER.department}
    >
      <div className="animate-fade-up" style={{ padding: '32px 32px 56px', maxWidth: 960, margin: '0 auto' }}>

        {/* Back link */}
        <Link
          to="/lecturer/assignments"
          className="inline-flex items-center gap-1.5 mb-6 transition-opacity hover:opacity-70"
          style={{ color: 'var(--muted-foreground)', textDecoration: 'none', fontSize: '0.875rem' }}
        >
          <ArrowLeft style={{ width: 15, height: 15 }} />
          Back to Assignments
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>{assignment.title}</h1>
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
            {course.code} · Due {assignment.dueDate} · Max: {assignment.maxMarks} marks
          </p>
        </div>

        {/* Summary bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'TOTAL SUBMISSIONS', value: `${submitted} / ${submissions.length}` },
            { label: 'GRADED',            value: `${graded} / ${submitted}`             },
            { label: 'CLASS AVERAGE',     value: avgGrade !== '—' ? `${avgGrade} / ${assignment.maxMarks}` : '—' },
          ].map(tile => (
            <div key={tile.label} style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 20 }}>
              <p className="t-label mb-1" style={{ color: 'var(--muted-foreground)' }}>{tile.label}</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)', lineHeight: 1.2, letterSpacing: '-0.015em' }}>{tile.value}</p>
            </div>
          ))}
        </div>

        {/* Submissions table */}
        <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div className="grid px-5 py-3" style={{ gridTemplateColumns: '140px 1fr 110px 90px 80px 80px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
            {['STUDENT ID', 'NAME', 'SUBMITTED', 'STATUS', 'GRADE', ''].map(h => (
              <span key={h} className="t-label" style={{ color: 'var(--muted-foreground)' }}>{h}</span>
            ))}
          </div>
          {submissions.map((sub, i) => {
            const ss = STATUS_STYLE[sub.status]
            const grade = sub.grade !== undefined ? calcGrade(sub.grade, assignment.maxMarks) : '—'
            const gc    = gradeColor(grade)
            const canGrade = sub.status !== 'Not submitted'
            return (
              <div
                key={sub.studentId}
                className="grid items-center px-5"
                style={{ gridTemplateColumns: '140px 1fr 110px 90px 80px 80px', paddingTop: 13, paddingBottom: 13, borderBottom: i < submissions.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{sub.studentId}</span>
                <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{sub.studentName}</span>
                <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{sub.submittedAt || '—'}</span>
                <span className="t-label px-2 py-0.5 w-fit" style={{ backgroundColor: ss.bg, color: ss.color, borderRadius: 'var(--radius-sm)' }}>
                  {sub.status}
                </span>
                {sub.grade !== undefined
                  ? <span className="t-label px-2 py-0.5 w-fit" style={{ backgroundColor: gc.bg, color: gc.color, borderRadius: 'var(--radius-sm)' }}>{grade}</span>
                  : <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>—</span>
                }
                {canGrade
                  ? <Button variant="outline" size="sm" style={{ fontSize: '0.8125rem' }} onClick={() => setActiveSubmission(sub)}>Grade</Button>
                  : <span />
                }
              </div>
            )
          })}
        </div>
      </div>

      {/* Grade Sheet */}
      <Sheet open={activeSubmission !== null} onOpenChange={open => { if (!open) setActiveSubmission(null) }}>
        <SheetContent side="right" className="p-0 border-l overflow-hidden flex flex-col" style={{ width: 'min(720px, 45vw)' }}>
          {activeSubmission && (
            <GradeSheet
              submission={activeSubmission}
              assignment={assignment}
              onClose={() => setActiveSubmission(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </AppShell>
  )
}

// ── Grade Sheet ───────────────────────────────────────────────────────────────

function GradeSheet({
  submission, assignment, onClose,
}: {
  submission: AssignmentSubmission
  assignment: typeof LECTURER_ASSIGNMENTS[0]
  onClose: () => void
}) {
  const [markInput, setMarkInput]   = useState(submission.grade !== undefined ? String(submission.grade) : '')
  const [feedback,  setFeedback]    = useState('')

  const numMark = parseFloat(markInput)
  const grade   = markInput !== '' && !isNaN(numMark) ? calcGrade(numMark, assignment.maxMarks) : '—'
  const gc      = gradeColor(grade)

  const handleSubmit = () => {
    toast.success(`Grade submitted for ${submission.studentName}`)
    onClose()
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div style={{ padding: '20px 56px 18px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <p className="t-label mb-1" style={{ color: 'var(--muted-foreground)' }}>GRADE SUBMISSION</p>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 600, color: 'var(--foreground)', lineHeight: 1.4 }}>{submission.studentName}</h3>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginTop: 2 }}>{submission.studentId}</p>
      </div>

      <div style={{ padding: '20px 24px', flex: 1 }}>
        {/* Submitted file */}
        {submission.fileName && (
          <div className="mb-5">
            <p className="t-label mb-2" style={{ color: 'var(--muted-foreground)' }}>SUBMITTED FILE</p>
            <div style={{ padding: 14, backgroundColor: 'var(--muted)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <FileText style={{ width: 28, height: 28, color: 'var(--muted-foreground)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {submission.fileName}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: 2 }}>
                  {submission.fileSize} · Submitted {submission.submittedAt}
                </p>
              </div>
              <Button variant="outline" size="sm" className="gap-1 flex-shrink-0" style={{ fontSize: '0.8125rem' }}>
                <Download style={{ width: 12, height: 12 }} /> Download
              </Button>
            </div>
          </div>
        )}

        {/* Marks input */}
        <div className="mb-5">
          <p className="t-label mb-2" style={{ color: 'var(--muted-foreground)' }}>MARKS</p>
          <div className="flex items-center gap-3">
            <Input
              type="number" min={0} max={assignment.maxMarks}
              placeholder={`/ ${assignment.maxMarks}`}
              value={markInput}
              onChange={e => setMarkInput(e.target.value)}
              style={{ width: 120 }}
            />
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>/ {assignment.maxMarks}</span>
            {grade !== '—' && (
              <span className="t-label px-2.5 py-1" style={{ backgroundColor: gc.bg, color: gc.color, borderRadius: 'var(--radius-sm)', transition: 'all 150ms' }}>{grade}</span>
            )}
          </div>
        </div>

        {/* Feedback */}
        <div className="mb-5">
          <p className="t-label mb-2" style={{ color: 'var(--muted-foreground)' }}>FEEDBACK</p>
          <Textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder="Write feedback for the student…"
            rows={5}
          />
        </div>
      </div>

      <div style={{ padding: '0 24px 28px', display: 'flex', gap: 10, flexShrink: 0 }}>
        <Button onClick={handleSubmit} className="flex-1" style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}>Submit grade</Button>
        <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  )
}
