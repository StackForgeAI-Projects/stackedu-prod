import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { StudentShell } from '@/components/StudentShell'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { FormInfoBox } from '@/components/FormInfoBox'
import { formInfo } from '@/lib/form-info-copy'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  getStudentAssessment,
  getStudentAssessments,
  studentAssessmentQueryKey,
  studentAssessmentsQueryKey,
  submitStudentAssessment,
} from '@/lib/api/student'
import { apiErrorMessage } from '@/lib/api/client'
import { formatDateShort, formatDateTime } from '@/lib/utils'

export const Route = createFileRoute('/_auth/student/assignment-submit')({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === 'string' ? search.id : '',
  }),
  component: AssignmentSubmitPage,
})

function AssignmentSubmitPage() {
  const { id } = Route.useSearch()
  const queryClient = useQueryClient()
  const listQuery = useQuery({
    queryKey: studentAssessmentsQueryKey,
    queryFn: getStudentAssessments,
  })
  const detailQuery = useQuery({
    queryKey: studentAssessmentQueryKey(id),
    queryFn: () => getStudentAssessment(id),
    enabled: Boolean(id),
  })
  const [text, setText] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const selected = detailQuery.data

  useEffect(() => {
    if (!selected) return
    const next: Record<string, string> = {}
    for (const question of selected.questions) {
      if (question.response) next[question.questionVersionId] = question.response
    }
    setAnswers(next)
  }, [selected])

  const mutation = useMutation({
    mutationFn: () =>
      submitStudentAssessment(
        id,
        selected && selected.questions.length > 0
          ? {
              answers: selected.questions.map((question) => ({
                questionVersionId: question.questionVersionId,
                response: answers[question.questionVersionId]?.trim() ?? '',
              })),
            }
          : { textResponse: text },
      ),
    onSuccess: async () => {
      toast.success(selected && selected.questions.length > 0 ? 'Quiz submitted.' : 'Assignment submitted.')
      setText('')
      await queryClient.invalidateQueries({ queryKey: studentAssessmentsQueryKey })
      await queryClient.invalidateQueries({ queryKey: studentAssessmentQueryKey(id) })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not submit that assignment.')),
  })

  const quizComplete = Boolean(
    selected
    && selected.questions.length > 0
    && selected.questions.every((question) => answers[question.questionVersionId]?.trim()),
  )

  return (
    <StudentShell pageTitle="Submit assignment" guide="Written coursework and auto-marked quizzes both submit from here. A confirmation appears before anything is sent.">
      <div className="animate-fade-up px-4 py-6 pb-14" style={{ maxWidth: 760, margin: '0 auto' }}>
        <Link to="/student/courses" className="t-caption mb-4 inline-block" style={{ color: 'var(--success)' }}>
          ← My courses
        </Link>
        <h1 className="t-h1 mb-2" style={{ fontFamily: 'var(--font-display)' }}>Submit assignment</h1>
        <FormInfoBox lines={formInfo.submitAssignment} />
        <p className="t-body mb-6" style={{ color: 'var(--muted-foreground)' }}>
          Written work is saved as you submitted it. Quiz answers are marked against the question version you sat.
        </p>

        {listQuery.isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading assignments…</p>
        ) : listQuery.error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(listQuery.error, 'Could not load assignments.')}</p>
        ) : !listQuery.data?.length ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>No open assignments accept submissions yet.</p>
        ) : !id ? (
          <div className="flex flex-col gap-3">
            {listQuery.data.map((item) => (
              <Link
                key={item.id}
                to="/student/assignment-submit"
                search={{ id: item.id }}
                className="block p-5"
                style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', textDecoration: 'none' }}
              >
                <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{item.title}</p>
                <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
                  {item.courseCode} · {item.courseName}
                  {item.dueAt ? ` · due ${formatDateShort(item.dueAt)}` : ''}
                  {item.questionCount > 0 ? ` · ${item.questionCount} questions` : ''}
                  {item.submitted ? ' · submitted' : ''}
                </p>
              </Link>
            ))}
          </div>
        ) : detailQuery.isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading…</p>
        ) : detailQuery.error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(detailQuery.error, 'Could not load that assignment.')}</p>
        ) : !selected ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>That assignment is not available.</p>
        ) : (
          <div className="p-5" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
            <p className="t-label mb-1">{selected.courseCode}</p>
            <h2 className="t-h3 mb-2" style={{ fontFamily: 'var(--font-display)' }}>{selected.title}</h2>
            <p className="t-caption mb-4" style={{ color: 'var(--muted-foreground)' }}>
              {selected.courseName}
              {selected.dueAt ? ` · due ${formatDateTime(selected.dueAt)}` : ''}
            </p>
            {selected.description ? (
              <p className="text-sm mb-5 whitespace-pre-line" style={{ color: 'var(--foreground)' }}>{selected.description}</p>
            ) : null}

            {selected.submitted ? (
              <div>
                <p className="t-body" style={{ color: 'var(--success)' }}>You have already submitted this assignment.</p>
                {selected.score !== null ? (
                  <p className="t-body mt-2" style={{ color: 'var(--foreground)' }}>Score: {selected.score}</p>
                ) : null}
                {selected.questions.length > 0 ? (
                  <div className="mt-5" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {selected.questions.map((question) => (
                      <QuestionPrompt
                        key={question.questionVersionId}
                        question={question}
                        value={question.response ?? ''}
                        disabled
                        onChange={() => undefined}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            ) : selected.questions.length > 0 ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {selected.questions.map((question) => (
                    <QuestionPrompt
                      key={question.questionVersionId}
                      question={question}
                      value={answers[question.questionVersionId] ?? ''}
                      onChange={(value) => setAnswers((current) => ({ ...current, [question.questionVersionId]: value }))}
                    />
                  ))}
                </div>
                <ConfirmAlertDialog
                  trigger={
                    <Button className="mt-5" disabled={!quizComplete || mutation.isPending}>
                      {mutation.isPending ? 'Submitting…' : 'Submit quiz'}
                    </Button>
                  }
                  title="Submit this quiz?"
                  tone="success"
                  headlineLabel="Action"
                  headline="Submit answers"
                  summary={`You are sending ${selected.questions.length} answers for "${selected.title}".`}
                  notices={[
                    { icon: 'lock', label: 'You cannot change answers after this.' },
                    { icon: 'file', label: 'Objective questions are marked immediately against the version you sat.' },
                  ]}
                  confirmLabel="Submit"
                  confirmVariant="brand"
                  loading={mutation.isPending}
                  onConfirm={() => mutation.mutate()}
                />
              </>
            ) : (
              <>
                <Label htmlFor="response" className="mb-2 block">Your response</Label>
                <Textarea
                  id="response"
                  rows={8}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Write your answer here"
                />
                <ConfirmAlertDialog
                  trigger={
                    <Button className="mt-4" disabled={!text.trim() || mutation.isPending}>
                      {mutation.isPending ? 'Submitting…' : 'Submit assignment'}
                    </Button>
                  }
                  title="Submit this assignment?"
                  tone="success"
                  headlineLabel="Action"
                  headline="Submit written work"
                  summary={`Your response for "${selected.title}" will be saved as submitted.`}
                  notices={[
                    { icon: 'lock', label: 'You cannot edit the response after this.' },
                    { icon: 'file', label: 'Your lecturer marks written work from the submissions list.' },
                  ]}
                  confirmLabel="Submit"
                  confirmVariant="brand"
                  loading={mutation.isPending}
                  onConfirm={() => mutation.mutate()}
                />
              </>
            )}
          </div>
        )}
      </div>
    </StudentShell>
  )
}

function QuestionPrompt({
  question,
  value,
  onChange,
  disabled,
}: {
  question: {
    questionVersionId: string
    sequence: number
    type: 'MultipleChoice' | 'TrueFalse' | 'ShortAnswer'
    stem: string
    options: string[] | null
    marks: number
  }
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) {
  return (
    <div>
      <p className="text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
        {question.sequence + 1}. {question.stem}
      </p>
      <p className="t-caption mb-2" style={{ color: 'var(--muted-foreground)' }}>{question.marks} mark{question.marks === 1 ? '' : 's'}</p>
      {question.type === 'ShortAnswer' ? (
        <Textarea
          rows={3}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Your answer"
        />
      ) : (
        <RadioGroup value={value} onValueChange={onChange} disabled={disabled}>
          {(question.options ?? []).map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm" style={{ color: 'var(--foreground)' }}>
              <RadioGroupItem value={option} />
              {option}
            </label>
          ))}
        </RadioGroup>
      )}
    </div>
  )
}
