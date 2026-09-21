import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import {
  LayoutDashboard, BookOpen, BarChart2, Bell, ClipboardList,
  FileText, TrendingUp,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  LECTURER, LECTURER_COURSES, COURSE_STUDENTS, ASSESSMENTS, PUBLISHED_MARKS,
  calcGrade, gradeColor,
} from '@/data/lecturer'

export const Route = createFileRoute('/_auth/lecturer/results')({
  component: ResultEntryPage,
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

// ─────────────────────────────────────────────────────────────────────────────

function ResultEntryPage() {
  const [courseId, setCourseId] = useState(LECTURER_COURSES[0].id)

  const course      = LECTURER_COURSES.find(c => c.id === courseId)!
  const assessments = ASSESSMENTS.filter(a => a.courseId === courseId)
  const draftItems  = assessments.filter(a => a.status === 'draft' || a.status === 'submitted')
  const published   = assessments.filter(a => a.status === 'published')

  return (
    <AppShell
      navItems={LECTURER_NAV}
      pageTitle="Results"
      userName={LECTURER.fullName}
      userRole="Lecturer"
      userInitials={LECTURER.initials}
      unreadCount={3}
      infoCardLabel="LECTURER ID"
      infoCardValue={LECTURER.id}
      infoCardSubtext={LECTURER.department}
    >
      <div className="animate-fade-up" style={{ padding: '32px 32px 56px', maxWidth: 1000, margin: '0 auto' }}>

        {/* Header */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Results</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Enter and submit marks for your assigned courses.</p>
          </div>
          <Select value={courseId} onValueChange={setCourseId}>
            <SelectTrigger className="w-60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LECTURER_COURSES.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Draft / Entry tabs */}
        {draftItems.length > 0 && (
          <div className="mb-8">
            <h2 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Mark Entry</h2>
            <Tabs defaultValue={draftItems[0]?.id}>
              <TabsList className="mb-5">
                {draftItems.map(a => (
                  <TabsTrigger key={a.id} value={a.id}>{a.name}</TabsTrigger>
                ))}
              </TabsList>
              {draftItems.map(a => (
                <TabsContent key={a.id} value={a.id}>
                  <MarksEntryTable course={course} assessment={a} />
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}

        {/* Published results */}
        {published.length > 0 && (
          <div>
            <h2 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Published Results</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {published.map(a => (
                <PublishedResultCard key={a.id} assessment={a} courseId={courseId} />
              ))}
            </div>
          </div>
        )}

        {assessments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div style={{ width: 56, height: 56, backgroundColor: 'var(--muted)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <BarChart2 style={{ width: 24, height: 24, color: 'var(--muted-foreground)' }} />
            </div>
            <p className="t-h3 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>No assessments</p>
            <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>No assessments have been set up for this course yet.</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}

// ── Marks entry table ─────────────────────────────────────────────────────────

function MarksEntryTable({ course, assessment }: { course: typeof LECTURER_COURSES[0]; assessment: typeof ASSESSMENTS[0] }) {
  const students  = COURSE_STUDENTS[course.id] ?? []
  const [marks, setMarks] = useState<Record<string, string>>({})

  const setMark = (id: string, val: string) => {
    const num = parseInt(val)
    if (val !== '' && (isNaN(num) || num < 0 || num > assessment.maxMarks)) return
    setMarks(prev => ({ ...prev, [id]: val }))
  }

  const numericMarks = useMemo(() =>
    students.map(s => parseFloat(marks[s.id] ?? '')).filter(v => !isNaN(v)),
  [marks, students])

  const avg     = numericMarks.length ? (numericMarks.reduce((a, b) => a + b, 0) / numericMarks.length).toFixed(1) : '—'
  const highest = numericMarks.length ? Math.max(...numericMarks).toFixed(0) : '—'
  const lowest  = numericMarks.length ? Math.min(...numericMarks).toFixed(0) : '—'

  const handleSubmit = () => {
    toast.success(`${assessment.name} results submitted for publishing`)
  }

  return (
    <div>
      <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 16 }}>
        {/* Header */}
        <div className="grid px-5 py-3" style={{ gridTemplateColumns: '140px 1fr 160px 80px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
          {['STUDENT ID', 'NAME', `MARKS / ${assessment.maxMarks}`, 'GRADE'].map(h => (
            <span key={h} className="t-label" style={{ color: 'var(--muted-foreground)' }}>{h}</span>
          ))}
        </div>

        {students.map((s, i) => {
          const rawMark = marks[s.id] ?? ''
          const numMark = parseFloat(rawMark)
          const grade   = rawMark !== '' && !isNaN(numMark) ? calcGrade(numMark, assessment.maxMarks) : '—'
          const gc      = gradeColor(grade)

          return (
            <div
              key={s.id}
              className="grid items-center px-5"
              style={{ gridTemplateColumns: '140px 1fr 160px 80px', paddingTop: 12, paddingBottom: 12, borderBottom: i < students.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{s.id}</span>
              <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{s.name}</span>
              <div className="flex items-center gap-2" style={{ paddingRight: 16 }}>
                <Input
                  type="number"
                  min={0}
                  max={assessment.maxMarks}
                  placeholder={`/ ${assessment.maxMarks}`}
                  value={rawMark}
                  onChange={e => setMark(s.id, e.target.value)}
                  style={{ height: 32, width: 100, fontSize: '0.875rem' }}
                />
              </div>
              <span
                className="t-label px-2 py-0.5 w-fit"
                style={{ backgroundColor: gc.bg, color: gc.color, borderRadius: 'var(--radius-sm)', transition: 'all 150ms' }}
              >
                {grade}
              </span>
            </div>
          )
        })}

        {/* Summary footer */}
        <div
          className="grid px-5 py-3 items-center"
          style={{ gridTemplateColumns: '140px 1fr 160px 80px', borderTop: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}
        >
          <span className="t-label" style={{ color: 'var(--muted-foreground)' }}>SUMMARY</span>
          <span />
          <div className="flex items-center gap-3">
            <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>Avg: <strong style={{ color: 'var(--foreground)' }}>{avg}</strong></span>
            <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>High: <strong style={{ color: 'var(--success)' }}>{highest}</strong></span>
            <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>Low: <strong style={{ color: 'var(--error)' }}>{lowest}</strong></span>
          </div>
          <span />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}>Submit for publishing</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Submit results for publishing?</AlertDialogTitle>
              <AlertDialogDescription>
                Once submitted, results will be reviewed by the Academic Admin before publishing to students. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSubmit}
                style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}
              >
                Submit
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button variant="outline" onClick={() => toast.success('Draft saved')}>Save draft</Button>
      </div>
    </div>
  )
}

// ── Published result card ─────────────────────────────────────────────────────

function PublishedResultCard({ assessment, courseId }: { assessment: typeof ASSESSMENTS[0]; courseId: string }) {
  const students = COURSE_STUDENTS[courseId] ?? []
  const marks    = PUBLISHED_MARKS[assessment.id] ?? {}
  const [open, setOpen] = useState(false)

  const numericMarks = students.map(s => marks[s.id]).filter((v): v is number => v !== undefined)
  const avg = numericMarks.length ? (numericMarks.reduce((a, b) => a + b, 0) / numericMarks.length).toFixed(1) : '—'

  return (
    <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
      {/* Card header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer"
        style={{ borderBottom: open ? '1px solid var(--border)' : 'none' }}
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3">
          <span className="t-label px-2.5 py-1" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-sm)' }}>Published</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{assessment.name}</p>
            <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Max: {assessment.maxMarks} · Weight: {assessment.weight}% · Class avg: {avg}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" style={{ fontSize: '0.8125rem' }} onClick={e => { e.stopPropagation(); toast.success(`Exported ${assessment.name}`) }}>
            Export
          </Button>
        </div>
      </div>

      {open && (
        <div style={{ overflow: 'hidden' }}>
          <div className="grid px-5 py-2.5" style={{ gridTemplateColumns: '140px 1fr 120px 70px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
            {['STUDENT ID', 'NAME', `MARKS / ${assessment.maxMarks}`, 'GRADE'].map(h => (
              <span key={h} className="t-label" style={{ color: 'var(--muted-foreground)' }}>{h}</span>
            ))}
          </div>
          {students.map((s, i) => {
            const m = marks[s.id]
            const grade = m !== undefined ? calcGrade(m, assessment.maxMarks) : '—'
            const gc    = gradeColor(grade)
            return (
              <div key={s.id} className="grid items-center px-5" style={{ gridTemplateColumns: '140px 1fr 120px 70px', paddingTop: 12, paddingBottom: 12, borderBottom: i < students.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{s.id}</span>
                <span className="text-sm" style={{ color: 'var(--foreground)' }}>{s.name}</span>
                <span className="text-sm font-medium" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-mono)' }}>{m !== undefined ? `${m} / ${assessment.maxMarks}` : '—'}</span>
                <span className="t-label px-2 py-0.5 w-fit" style={{ backgroundColor: gc.bg, color: gc.color, borderRadius: 'var(--radius-sm)' }}>{grade}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
