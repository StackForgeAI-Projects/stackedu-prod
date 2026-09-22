import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  LayoutDashboard, BookOpen, BarChart2, Bell, ClipboardList,
  FileText, TrendingUp, Plus, Pencil, ChevronRight,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  LECTURER, LECTURER_COURSES, LECTURER_ASSIGNMENTS, type LecturerAssignment,
} from '@/data/lecturer'

export const Route = createFileRoute('/_auth/lecturer/assignments')({
  component: AssignmentsPage,
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

const STATUS_STYLE: Record<LecturerAssignment['status'], { bg: string; color: string }> = {
  Draft:  { bg: 'var(--muted)',       color: 'var(--muted-foreground)' },
  Active: { bg: 'var(--success-bg)', color: 'var(--success)'          },
  Closed: { bg: 'var(--info-bg)',    color: 'var(--info)'             },
  Graded: { bg: 'var(--warning-bg)', color: 'var(--warning)'          },
}

// ─────────────────────────────────────────────────────────────────────────────

function AssignmentsPage() {
  const [courseFilter, setCourseFilter] = useState('all')
  const [createOpen,   setCreateOpen]   = useState(false)

  const filtered = courseFilter === 'all'
    ? LECTURER_ASSIGNMENTS
    : LECTURER_ASSIGNMENTS.filter(a => a.courseId === courseFilter)

  return (
    <AppShell
      navItems={LECTURER_NAV}
      pageTitle="Assignments"
      userName={LECTURER.fullName}
      userRole="Lecturer"
      userInitials={LECTURER.initials}
      unreadCount={3}
      infoCardLabel="LECTURER ID"
      infoCardValue={LECTURER.id}
      infoCardSubtext={LECTURER.department}
    >
      <div className="animate-fade-up" style={{ padding: '32px 32px 56px', maxWidth: 920, margin: '0 auto' }}>

        {/* Header */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Assignments</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Manage assignments and review student submissions.</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="All courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All courses</SelectItem>
                {LECTURER_COURSES.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setCreateOpen(true)} style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', gap: 6 }}>
              <Plus style={{ width: 15, height: 15 }} /> Create assignment
            </Button>
          </div>
        </div>

        {/* Assignment cards */}
        {filtered.length === 0 ? (
          <EmptyState onAction={() => setCreateOpen(true)} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(a => <AssignmentCard key={a.id} assignment={a} />)}
          </div>
        )}
      </div>

      {/* Create assignment Sheet */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="right" className="p-0 border-l overflow-hidden flex flex-col" style={{ width: 'min(720px, 45vw)' }}>
          <CreateAssignmentForm onClose={() => setCreateOpen(false)} />
        </SheetContent>
      </Sheet>
    </AppShell>
  )
}

// ── Assignment card ───────────────────────────────────────────────────────────

function AssignmentCard({ assignment: a }: { assignment: LecturerAssignment }) {
  const [hovered, setHovered] = useState(false)
  const course  = LECTURER_COURSES.find(c => c.id === a.courseId)
  const ss      = STATUS_STYLE[a.status]
  const pctSub  = a.totalCount > 0 ? Math.round((a.submittedCount / a.totalCount) * 100) : 0

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        border: '1px solid var(--border)',
        padding: '18px 20px',
        transition: 'box-shadow 150ms ease-out',
      }}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{a.title}</span>
            {course && (
              <span className="t-label px-2 py-0.5" style={{ backgroundColor: course.color + '18', color: course.color, borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                {course.code}
              </span>
            )}
            <span className="t-label px-2 py-0.5" style={{ backgroundColor: ss.bg, color: ss.color, borderRadius: 'var(--radius-sm)' }}>
              {a.status}
            </span>
          </div>

          <p className="t-body-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>{a.description}</p>

          {/* Submission progress */}
          <div className="flex items-center gap-3 mb-1">
            <div className="flex-1 rounded-full overflow-hidden" style={{ height: 5, backgroundColor: 'var(--muted)' }}>
              <div style={{ width: `${pctSub}%`, height: '100%', backgroundColor: 'var(--brand)', borderRadius: 9999, transition: 'width 600ms ease-out' }} />
            </div>
            <span className="t-caption flex-shrink-0" style={{ color: 'var(--muted-foreground)' }}>
              {a.submittedCount} / {a.totalCount} submitted
            </span>
          </div>
          <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>Due: {a.dueDate} · Max: {a.maxMarks} marks</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Link to="/lecturer/submission-review" search={{ id: a.id }}>
            <Button variant="outline" size="sm" className="gap-1" style={{ fontSize: '0.8125rem' }}>
              View submissions <ChevronRight style={{ width: 12, height: 12 }} />
            </Button>
          </Link>
          <Button variant="outline" size="sm" style={{ fontSize: '0.8125rem' }}>
            <Pencil style={{ width: 12, height: 12 }} />
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Create assignment form ────────────────────────────────────────────────────

function CreateAssignmentForm({ onClose }: { onClose: () => void }) {
  const [title,       setTitle]       = useState('')
  const [courseId,    setCourseId]    = useState(LECTURER_COURSES[0].id)
  const [description, setDescription] = useState('')
  const [dueDate,     setDueDate]     = useState('')
  const [maxMarks,    setMaxMarks]    = useState('')
  const [hasAttach,   setHasAttach]   = useState(false)

  const handleCreate = () => {
    if (!title.trim()) return
    toast.success(`Assignment "${title}" created`)
    onClose()
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div style={{ padding: '20px 56px 18px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 600, color: 'var(--foreground)', lineHeight: 1.4 }}>Create Assignment</h3>
      </div>

      <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Title */}
        <div>
          <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Assignment title</label>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Binary Tree Implementation" />
        </div>

        {/* Course */}
        <div>
          <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Course</label>
          <Select value={courseId} onValueChange={setCourseId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {LECTURER_COURSES.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div>
          <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Description</label>
          <Textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe the assignment requirements…"
            rows={4}
          />
        </div>

        {/* Due date + max marks */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full rounded-md border text-sm"
              style={{ padding: '8px 12px', borderColor: 'var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', outline: 'none' }}
            />
          </div>
          <div>
            <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Max marks</label>
            <Input type="number" min={1} value={maxMarks} onChange={e => setMaxMarks(e.target.value)} placeholder="e.g. 20" />
          </div>
        </div>

        {/* File attachment toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setHasAttach(v => !v)}
            style={{
              width: 40, height: 22, borderRadius: 11,
              backgroundColor: hasAttach ? 'var(--brand)' : 'var(--border)',
              transition: 'background-color 150ms', border: 'none', cursor: 'pointer', position: 'relative',
            }}
          >
            <span style={{ position: 'absolute', top: 2, left: hasAttach ? 20 : 2, width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 150ms' }} />
          </button>
          <span className="text-sm" style={{ color: 'var(--foreground)' }}>Allow file attachments</span>
        </div>
      </div>

      <div style={{ padding: '0 24px 28px', display: 'flex', gap: 10, flexShrink: 0 }}>
        <Button onClick={handleCreate} className="flex-1" style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}>Create</Button>
        <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onAction }: { onAction: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div style={{ width: 56, height: 56, backgroundColor: 'var(--muted)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <FileText style={{ width: 24, height: 24, color: 'var(--muted-foreground)' }} />
      </div>
      <p className="t-h3 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>No assignments</p>
      <p className="t-body-sm mb-5" style={{ color: 'var(--muted-foreground)', maxWidth: 300 }}>
        No assignments match your filter. Try selecting all courses or create a new one.
      </p>
      <Button onClick={onAction} style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}>
        Create assignment
      </Button>
    </div>
  )
}
