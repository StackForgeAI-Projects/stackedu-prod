import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Plus, ChevronRight } from 'lucide-react'
import type { LecturerAssessmentRow, LecturerCourseRow } from '@stackedu/shared'
import { isQuizAssessmentType } from '@stackedu/shared'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { FormInfoBox } from '@/components/FormInfoBox'
import { formInfo } from '@/lib/form-info-copy'
import { LecturerShell } from '@/components/LecturerShell'
import { PagedList } from '@/components/ListPagination'
import { AssessmentWeightField } from '@/components/AssessmentWeightField'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { apiErrorMessage } from '@/lib/api/client'
import {
  createLecturerAssessment,
  lecturerAssessmentsQueryKey,
  lecturerCoursesQueryKey,
  listLecturerAssessments,
  listLecturerCourses,
} from '@/lib/api/lecturer'
import { formatDateShort } from '@/lib/utils'

export const Route = createFileRoute('/_auth/lecturer/assignments')({
  component: AssignmentsPage,
})

const STATUS_STYLE: Record<LecturerAssessmentRow['status'], { bg: string; color: string }> = {
  Draft: { bg: 'var(--muted)', color: 'var(--muted-foreground)' },
  Active: { bg: 'var(--success-bg)', color: 'var(--success)' },
  Closed: { bg: 'var(--info-bg)', color: 'var(--info)' },
  Graded: { bg: 'var(--warning-bg)', color: 'var(--warning)' },
}

function AssignmentsPage() {
  const { data: courses = [] } = useQuery({ queryKey: lecturerCoursesQueryKey, queryFn: listLecturerCourses })
  const [courseFilter, setCourseFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const { data: assessments = [], isPending, error } = useQuery({
    queryKey: lecturerAssessmentsQueryKey(courseFilter === 'all' ? undefined : courseFilter),
    queryFn: () => listLecturerAssessments(courseFilter === 'all' ? undefined : courseFilter),
  })
  const coursework = assessments.filter((row) => !isQuizAssessmentType(row.type))

  return (
    <LecturerShell pageTitle="Assignments" guide="Create coursework for your assigned courses and review student submissions.">
      <div className="animate-fade-up px-4 sm:px-8 py-8 pb-14" style={{ maxWidth: 920, margin: '0 auto' }}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-7">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Assignments</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Manage assignments and review student submissions.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="w-full sm:w-52"><SelectValue placeholder="All courses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All courses</SelectItem>
                {courses.map((c) => <SelectItem key={c.offeringId} value={c.offeringId}>{c.code}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={() => setCreateOpen(true)} disabled={courses.length === 0} style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', gap: 6 }}>
              <Plus style={{ width: 15, height: 15 }} /> Create assignment
            </Button>
          </div>
        </div>

        {isPending ? <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading…</p> : null}
        {error ? <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load assignments.')}</p> : null}

        {!isPending && coursework.length === 0 ? (
          <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>No assignments yet. Create one for an assigned course.</p>
        ) : (
          <PagedList
            items={coursework}
            getKey={(row) => row.id}
            defaultPageSize={5}
            resetKey={courseFilter}
            itemLabel="assignments"
            renderItem={(a) => <AssignmentCard assignment={a} courses={courses} />}
          />
        )}
      </div>

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="right" className="p-0 border-l overflow-hidden flex flex-col sheet-md">
          <CreateAssignmentForm courses={courses} onClose={() => setCreateOpen(false)} />
        </SheetContent>
      </Sheet>
    </LecturerShell>
  )
}

function AssignmentCard({ assignment: a, courses }: { assignment: LecturerAssessmentRow; courses: LecturerCourseRow[] }) {
  const course = courses.find((c) => c.offeringId === a.offeringId)
  const ss = STATUS_STYLE[a.status]
  const pctSub = a.totalCount > 0 ? Math.round((a.submittedCount / a.totalCount) * 100) : 0
  return (
    <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: '18px 20px' }}>
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{a.title}</span>
            <span className="t-label px-2 py-0.5" style={{ backgroundColor: (course?.color ?? '#0D9488') + '18', color: course?.color ?? 'var(--brand)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>{a.courseCode}</span>
            <span className="t-label px-2 py-0.5" style={{ backgroundColor: ss.bg, color: ss.color, borderRadius: 'var(--radius-sm)' }}>{a.status}</span>
          </div>
          <p className="t-body-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>{a.description || a.type}</p>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex-1 rounded-full overflow-hidden" style={{ height: 5, backgroundColor: 'var(--muted)' }}>
              <div style={{ width: `${pctSub}%`, height: '100%', backgroundColor: 'var(--brand)', borderRadius: 9999 }} />
            </div>
            <span className="t-caption flex-shrink-0" style={{ color: 'var(--muted-foreground)' }}>{a.submittedCount} / {a.totalCount} submitted</span>
          </div>
          <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>Due: {a.dueAt ? formatDateShort(a.dueAt) : '—'} · Max: {a.totalMarks} marks</p>
        </div>
        <Link to="/lecturer/submission-review" search={{ id: a.id }}>
          <Button variant="outline" size="sm" className="gap-1" style={{ fontSize: '0.8125rem' }}>
            View submissions <ChevronRight style={{ width: 12, height: 12 }} />
          </Button>
        </Link>
      </div>
    </div>
  )
}

function CreateAssignmentForm({ courses, onClose }: { courses: LecturerCourseRow[]; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [offeringId, setOfferingId] = useState(courses[0]?.offeringId ?? '')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [maxMarks, setMaxMarks] = useState('20')
  const [weight, setWeight] = useState('10')

  const create = useMutation({
    mutationFn: () =>
      createLecturerAssessment({
        offeringId,
        title: title.trim(),
        description: description.trim() || undefined,
        type: 'Coursework',
        weight: Number(weight) || 10,
        totalMarks: Number(maxMarks) || 20,
        dueAt: dueDate || undefined,
        acceptsSubmissions: true,
        publish: true,
      }),
    onSuccess: async (row) => {
      toast.success(`Assignment "${row.title}" created`)
      await queryClient.invalidateQueries({ queryKey: lecturerAssessmentsQueryKey() })
      onClose()
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not create the assignment.')),
  })

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div style={{ padding: '20px 56px 18px 24px', borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 600, color: 'var(--foreground)' }}>Create Assignment</h3>
        <FormInfoBox lines={formInfo.createAssignment} />
      </div>
      <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Assignment title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Assignment title" />
        </div>
        <div>
          <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Course</label>
          <Select value={offeringId} onValueChange={setOfferingId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {courses.map((c) => <SelectItem key={c.offeringId} value={c.offeringId}>{c.code} — {c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Description</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Due date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full rounded-md border text-sm" style={{ padding: '8px 12px', borderColor: 'var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)' }} />
          </div>
          <div>
            <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Max marks</label>
            <Input type="number" min={1} value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} />
          </div>
          <AssessmentWeightField value={weight} onChange={setWeight} />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3" style={{ padding: '16px 24px 24px' }}>
        <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
        <ConfirmAlertDialog
          trigger={
            <Button className="flex-1" disabled={!title.trim() || !offeringId || create.isPending} style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}>
              {create.isPending ? 'Creating…' : 'Create'}
            </Button>
          }
          title="Create this assignment?"
          tone="success"
          headlineLabel="Action"
          headline="Publish assignment"
          summary={`"${title.trim()}" will be published to ${courses.find((row) => row.offeringId === offeringId)?.code ?? 'the course'}.`}
          notices={[
            { icon: 'user', label: 'Enrolled students can submit a written response from their portal.' },
            { icon: 'file', label: 'Quizzes belong on Assessment Builder, not this list.' },
          ]}
          confirmLabel="Create"
          confirmVariant="brand"
          loading={create.isPending}
          onConfirm={() => create.mutate()}
        />
      </div>
    </div>
  )
}
