import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { LecturerShell } from '@/components/LecturerShell'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { apiErrorMessage } from '@/lib/api/client'
import {
  getLecturerAssessment,
  lecturerAssessmentQueryKey,
  saveLecturerGrade,
} from '@/lib/api/lecturer'
import { calcGrade, gradeColor } from '@/data/lecturer'
import { formatDateTime } from '@/lib/utils'
import type { LecturerAssessmentDetail } from '@stackedu/shared'

export const Route = createFileRoute('/_auth/lecturer/submission-review')({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === 'string' ? search.id : '',
  }),
  component: SubmissionReviewPage,
})

function SubmissionReviewPage() {
  const { id } = Route.useSearch()
  const { data, isPending, error } = useQuery({
    queryKey: lecturerAssessmentQueryKey(id),
    queryFn: () => getLecturerAssessment(id),
    enabled: Boolean(id),
  })
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    if (!data?.submissions.length) return
    if (activeId && data.submissions.some((row) => row.studentId === activeId)) return
    const firstSubmitted = data.submissions.find((row) => row.status !== 'Not submitted')
    setActiveId((firstSubmitted ?? data.submissions[0]!).studentId)
  }, [data, activeId])

  const index = data?.submissions.findIndex((row) => row.studentId === activeId) ?? -1
  const active = index >= 0 ? data!.submissions[index]! : null

  return (
    <LecturerShell
      pageTitle="Submissions"
      guide="Mark one student at a time. Late is frozen when they submitted, so changing the due date later does not rewrite it. Component marks always add up to the grade."
    >
      <div className="animate-fade-up px-4 sm:px-8 py-8 pb-14" style={{ maxWidth: 1120, margin: '0 auto' }}>
        <Link to="/lecturer/assignments" className="inline-flex items-center gap-1 text-sm font-medium mb-5" style={{ color: 'var(--success)' }}>
          <ArrowLeft style={{ width: 14, height: 14 }} /> Back to assignments
        </Link>
        {!id ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Choose an assignment to review submissions.</p>
        ) : isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading…</p>
        ) : error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load submissions.')}</p>
        ) : data ? (
          <>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>{data.title}</h1>
            <p className="t-body mb-6" style={{ color: 'var(--muted-foreground)' }}>
              {data.courseCode} · {data.submittedCount}/{data.totalCount} submitted · Max {data.totalMarks}
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-4">
              <div
                style={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-xl)',
                  overflow: 'hidden',
                }}
              >
                {data.submissions.map((row, i) => {
                  const gc = gradeColor(row.score != null ? calcGrade(row.score, data.totalMarks) : '—')
                  const selected = row.studentId === activeId
                  return (
                    <button
                      key={row.studentId}
                      type="button"
                      className="w-full text-left px-4"
                      style={{
                        paddingTop: 12,
                        paddingBottom: 12,
                        borderBottom: i < data.submissions.length - 1 ? '1px solid var(--border)' : 'none',
                        background: selected ? 'rgba(var(--brand-rgb),0.08)' : 'transparent',
                        cursor: 'pointer',
                      }}
                      onClick={() => setActiveId(row.studentId)}
                    >
                      <span className="text-sm font-medium block" style={{ color: 'var(--foreground)' }}>{row.studentName}</span>
                      <span className="t-caption block" style={{ color: 'var(--muted-foreground)' }}>
                        {row.isLate ? 'Late · ' : ''}{row.submittedAt ? formatDateTime(row.submittedAt) : 'Not submitted'}
                      </span>
                      <span className="t-label px-2 py-0.5 mt-1 inline-block" style={{ backgroundColor: gc.bg, color: gc.color, borderRadius: 'var(--radius-sm)' }}>
                        {row.score != null ? calcGrade(row.score, data.totalMarks) : row.status}
                      </span>
                    </button>
                  )
                })}
              </div>
              <div
                style={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-xl)',
                  minHeight: 360,
                }}
              >
                {active ? (
                  <GradePane
                    assessment={data}
                    row={active}
                    index={index}
                    total={data.submissions.length}
                    onPrev={() => index > 0 && setActiveId(data.submissions[index - 1]!.studentId)}
                    onNext={() => index < data.submissions.length - 1 && setActiveId(data.submissions[index + 1]!.studentId)}
                  />
                ) : (
                  <p className="t-body p-6" style={{ color: 'var(--muted-foreground)' }}>Select a student to grade.</p>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </LecturerShell>
  )
}

function GradePane({
  assessment,
  row,
  index,
  total,
  onPrev,
  onNext,
}: {
  assessment: LecturerAssessmentDetail
  row: LecturerAssessmentDetail['submissions'][number]
  index: number
  total: number
  onPrev: () => void
  onNext: () => void
}) {
  const queryClient = useQueryClient()
  const [score, setScore] = useState(row.score != null ? String(row.score) : '')
  const [feedback, setFeedback] = useState(row.feedback ?? '')
  const [parts, setParts] = useState<Record<string, string>>({})

  useEffect(() => {
    setScore(row.score != null ? String(row.score) : '')
    setFeedback(row.feedback ?? '')
    setParts(
      Object.fromEntries(
        assessment.components.map((component) => [
          component.id,
          String(row.componentScores?.[component.id] ?? row.componentScores?.[component.name] ?? ''),
        ]),
      ),
    )
  }, [row, assessment.components])

  const summed = useMemo(() => {
    if (assessment.components.length === 0) return Number(score)
    return assessment.components.reduce((totalScore, component) => totalScore + (Number(parts[component.id]) || 0), 0)
  }, [assessment.components, parts, score])

  const save = useMutation({
    mutationFn: () =>
      saveLecturerGrade(assessment.id, {
        studentId: row.studentId,
        score: assessment.components.length === 0 ? Number(score) : summed,
        componentScores: assessment.components.length
          ? Object.fromEntries(assessment.components.map((component) => [component.id, Number(parts[component.id]) || 0]))
          : undefined,
        feedback: feedback.trim() || undefined,
      }),
    onSuccess: async () => {
      toast.success('Grade saved')
      await queryClient.invalidateQueries({ queryKey: lecturerAssessmentQueryKey(assessment.id) })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not save the grade.')),
  })

  const canSave = assessment.components.length > 0
    ? assessment.components.every((component) => parts[component.id] !== '')
    : score !== ''

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3" style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
        <div>
          <p className="t-label mb-1" style={{ color: 'var(--muted-foreground)' }}>{row.studentNumber}</p>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 600, color: 'var(--foreground)' }}>{row.studentName}</h3>
          {row.isLate ? (
            <p className="t-caption mt-1" style={{ color: 'var(--warning)' }}>
              Late at submit. Moving the due date later will not change this.
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" disabled={index <= 0} onClick={onPrev} className="gap-1">
            <ChevronLeft style={{ width: 14, height: 14 }} /> Previous
          </Button>
          <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{index + 1} / {total}</span>
          <Button variant="outline" size="sm" disabled={index >= total - 1} onClick={onNext} className="gap-1">
            Next <ChevronRight style={{ width: 14, height: 14 }} />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 flex-1">
        <div style={{ padding: 20, borderRight: '1px solid var(--border)' }} className="md:border-r">
          <p className="t-label mb-2" style={{ color: 'var(--muted-foreground)' }}>Submission</p>
          {row.textResponse?.trim() ? (
            <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--foreground)', lineHeight: 1.55 }}>{row.textResponse}</p>
          ) : (
            <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>
              {row.status === 'Not submitted' ? 'This student has not submitted yet.' : 'No written answer. File work is listed on the assignment if they uploaded one.'}
            </p>
          )}
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {assessment.components.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {assessment.components.map((component) => (
                <div key={component.id}>
                  <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>
                    {component.name} / {component.maxScore}
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={component.maxScore}
                    value={parts[component.id] ?? ''}
                    onChange={(e) => setParts((current) => ({ ...current, [component.id]: e.target.value }))}
                  />
                </div>
              ))}
              <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
                Total {Number.isFinite(summed) ? summed : 0} / {assessment.totalMarks}. These parts always count toward the grade.
              </p>
            </div>
          ) : (
            <div>
              <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Score / {assessment.totalMarks}</label>
              <Input type="number" min={0} max={assessment.totalMarks} value={score} onChange={(e) => setScore(e.target.value)} />
            </div>
          )}
          <div>
            <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Feedback</label>
            <Textarea rows={4} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
          </div>
          <ConfirmAlertDialog
            trigger={
              <Button disabled={!canSave || save.isPending} style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}>
                {save.isPending ? 'Saving…' : 'Save grade'}
              </Button>
            }
            title="Save this grade?"
            tone="success"
            headlineLabel="Action"
            headline="Record marks"
            summary={`${row.studentName} will receive ${Number.isFinite(summed) ? summed : score} / ${assessment.totalMarks}. The mark feeds the course results draft.`}
            notices={[
              { icon: 'file', label: 'Component scores always count toward this grade.' },
              { icon: 'lock', label: 'Published results are not changed from here. Draft results stay editable.' },
            ]}
            confirmLabel="Save"
            confirmVariant="brand"
            loading={save.isPending}
            onConfirm={() => save.mutate()}
          />
        </div>
      </div>
    </div>
  )
}
