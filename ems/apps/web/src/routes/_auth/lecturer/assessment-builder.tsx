import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react'
import type {
  AssessmentType,
  LecturerAssessmentItem,
  LecturerAssessmentRow,
  LecturerCourseRow,
  LecturerQuestion,
  QuestionType,
} from '@stackedu/shared'
import {
  ASSESSMENT_TYPE_LABELS,
  blankOptionsForQuestionType,
  DOCUMENT_IMPORT_ACCEPT,
  MAX_UPLOAD_LABEL,
} from '@stackedu/shared'
import { LecturerShell } from '@/components/LecturerShell'
import { PagedList } from '@/components/ListPagination'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { FileTooLargeDialog, useOversizeUpload } from '@/components/FileTooLargeDialog'
import { FormInfoBox } from '@/components/FormInfoBox'
import { formInfo } from '@/lib/form-info-copy'
import { IconActionButton } from '@/components/IconActionButton'
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
  deleteLecturerAssessment,
  createLecturerQuestion,
  deleteLecturerQuestion,
  generateLecturerQuestions,
  lecturerAssessmentItemsQueryKey,
  lecturerAssessmentsQueryKey,
  lecturerCoursesQueryKey,
  lecturerQuestionsQueryKey,
  listLecturerAssessmentItems,
  listLecturerAssessments,
  listLecturerCourses,
  listLecturerQuestions,
  saveLecturerAssessmentItems,
  updateLecturerQuestion,
  uploadLecturerQuestionImport,
} from '@/lib/api/lecturer'
import { formatDateShort } from '@/lib/utils'

export const Route = createFileRoute('/_auth/lecturer/assessment-builder')({
  component: AssessmentBuilderPage,
})

const STATUS_STYLE: Record<LecturerAssessmentRow['status'], { bg: string; color: string }> = {
  Draft: { bg: 'var(--muted)', color: 'var(--muted-foreground)' },
  Active: { bg: 'var(--success-bg)', color: 'var(--success)' },
  Closed: { bg: 'var(--info-bg)', color: 'var(--info)' },
  Graded: { bg: 'var(--warning-bg)', color: 'var(--warning)' },
}

function uniqueCourses(courses: LecturerCourseRow[]): LecturerCourseRow[] {
  return Array.from(new Map(courses.map((row) => [row.courseId, row])).values())
}

const TYPE_LABEL: Record<QuestionType, string> = {
  MultipleChoice: 'Multiple choice',
  TrueFalse: 'True / false',
  ShortAnswer: 'Short answer',
}

function AssessmentBuilderPage() {
  const queryClient = useQueryClient()
  const { data: courses = [] } = useQuery({ queryKey: lecturerCoursesQueryKey, queryFn: listLecturerCourses })
  const [courseFilter, setCourseFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [question, setQuestion] = useState<LecturerQuestion | null>(null)
  const [questionOpen, setQuestionOpen] = useState(false)
  const [editing, setEditing] = useState<LecturerAssessmentRow | null>(null)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [generateTarget, setGenerateTarget] = useState<{
    offeringId?: string
    assessmentId?: string
    title?: string
    type?: AssessmentType
    alsoCreate?: boolean
  }>({})
  const [deletePaper, setDeletePaper] = useState<LecturerAssessmentRow | null>(null)
  const { data: assessments = [], isPending, error } = useQuery({
    queryKey: lecturerAssessmentsQueryKey(courseFilter === 'all' ? undefined : courseFilter),
    queryFn: () => listLecturerAssessments(courseFilter === 'all' ? undefined : courseFilter),
  })
  const { data: questions = [], isPending: questionsPending } = useQuery({
    queryKey: lecturerQuestionsQueryKey(),
    queryFn: () => listLecturerQuestions(),
  })

  const papers = assessments

  const deletePaperMutation = useMutation({
    mutationFn: (id: string) => deleteLecturerAssessment(id),
    onSuccess: async () => {
      toast.success('Assessment deleted.')
      setDeletePaper(null)
      await queryClient.invalidateQueries({ queryKey: lecturerAssessmentsQueryKey() })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not delete that assessment.')),
  })

  return (
    <LecturerShell
      pageTitle="Assessment Builder"
      guide="A quiz is a paper made from the bank. Pin a question if every student should get the same one. Use a random draw if you want different students to get different questions from a topic. Save the paper before students sit it. If you pin some questions and also draw from that topic, leave enough unused questions in the topic for the draw."
    >
      <div className="animate-fade-up px-4 sm:px-8 py-8 pb-14" style={{ maxWidth: 960, margin: '0 auto' }}>
        {editing ? (
          <QuizItemsEditor
            assessment={editing}
            courses={courses}
            questions={questions}
            onBack={() => setEditing(null)}
            onAddQuestion={() => {
              setQuestion(null)
              setQuestionOpen(true)
            }}
            onGenerate={() => {
              setGenerateTarget({ offeringId: editing.offeringId, assessmentId: editing.id })
              setGenerateOpen(true)
            }}
          />
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-7">
              <div>
                <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>
                  Assessment Builder
                </h1>
                <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
                  Create an assessment or quiz from the shared question bank. Objective items are marked automatically.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Select value={courseFilter} onValueChange={setCourseFilter}>
                  <SelectTrigger className="w-full sm:w-52"><SelectValue placeholder="All courses" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All courses</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.offeringId} value={course.offeringId}>{course.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => setCreateOpen(true)}
                  disabled={courses.length === 0}
                  style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', gap: 6 }}
                >
                  <Plus style={{ width: 15, height: 15 }} /> Create Assessment/Quiz
                </Button>
              </div>
            </div>

            {isPending ? <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading…</p> : null}
            {error ? <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load assessments.')}</p> : null}

            {!isPending && papers.length === 0 ? (
              <p className="t-body-sm mb-8" style={{ color: 'var(--muted-foreground)' }}>
                No assessments yet. Create one, then pin questions or draw a random set from a topic.
              </p>
            ) : (
              <div className="mb-8">
                <PagedList
                  items={papers}
                  getKey={(quiz) => quiz.id}
                  defaultPageSize={5}
                  resetKey={courseFilter}
                  itemLabel="assessments"
                  renderItem={(quiz) => {
                    const course = courses.find((row) => row.offeringId === quiz.offeringId)
                    const ss = STATUS_STYLE[quiz.status]
                    return (
                      <div
                        style={{
                          backgroundColor: 'var(--card)',
                          borderRadius: 'var(--radius-xl)',
                          boxShadow: 'var(--shadow-sm)',
                          border: '1px solid var(--border)',
                          padding: '18px 20px',
                        }}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{quiz.title}</span>
                              <span className="t-label px-2 py-0.5" style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info)', borderRadius: 'var(--radius-sm)' }}>
                                {ASSESSMENT_TYPE_LABELS[quiz.type]}
                              </span>
                              <span className="t-label px-2 py-0.5" style={{ backgroundColor: ss.bg, color: ss.color, borderRadius: 'var(--radius-sm)' }}>
                                {quiz.status}
                              </span>
                            </div>
                            <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
                              {course?.code ?? quiz.courseCode} · {quiz.itemCount === 1 ? '1 question' : `${quiz.itemCount} questions`}
                              {quiz.dueAt ? ` · due ${formatDateShort(quiz.dueAt)}` : ''} · {quiz.totalMarks} marks
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setEditing(quiz)}>
                              Build questions
                            </Button>
                            <IconActionButton
                              label="Delete assessment"
                              icon={Trash2}
                              danger
                              onClick={() => setDeletePaper(quiz)}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  }}
                />
              </div>
            )}

            <div
              style={{
                backgroundColor: 'var(--card)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--border)',
                padding: 24,
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
                    Question bank
                  </h2>
                  <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
                    Owned by the institution. Tag by course and topic so a quiz can draw a random subset.
                </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => {
                    setGenerateTarget({})
                    setGenerateOpen(true)
                  }}
                  disabled={courses.length === 0}
                >
                  <Sparkles style={{ width: 14, height: 14 }} /> Generate with AI
                </Button>
                <Button
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => {
                    setQuestion(null)
                    setQuestionOpen(true)
                  }}
                >
                  <Plus style={{ width: 14, height: 14 }} /> Add question
                </Button>
                </div>
              </div>

              {questionsPending ? (
                <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>Loading bank…</p>
              ) : questions.length === 0 ? (
                <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>No questions yet. Add one to start the bank.</p>
              ) : (
                <PagedList
                  items={questions}
                  getKey={(item) => item.id}
                  defaultPageSize={5}
                  itemLabel="questions"
                  gap={10}
                  renderItem={(item) => (
                    <div
                      className="flex flex-col sm:flex-row sm:items-start gap-3"
                      style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 14 }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="t-label px-2 py-0.5" style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', borderRadius: 'var(--radius-sm)' }}>
                            {TYPE_LABEL[item.type]}
                          </span>
                          <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
                            {item.topic}{item.courseCode ? ` · ${item.courseCode}` : ''} · v{item.version} · {item.marks} marks
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: 'var(--foreground)' }}>{item.stem}</p>
                        {item.answeredCount > 0 ? (
                          <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
                            Answered {item.answeredCount} time{item.answeredCount === 1 ? '' : 's'}. An edit will create version {item.version + 1}.
                          </p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <IconActionButton
                          label="Edit question"
                          icon={Pencil}
                          onClick={() => {
                            setQuestion(item)
                            setQuestionOpen(true)
                          }}
                        />
                        <DeleteQuestionButton
                          question={item}
                          onDeleted={() => queryClient.invalidateQueries({ queryKey: lecturerQuestionsQueryKey() })}
                        />
                      </div>
                    </div>
                  )}
                />
              )}
            </div>
          </>
        )}
      </div>

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="right" className="p-0 border-l overflow-hidden flex flex-col sheet-md">
          <CreateQuizForm
            courses={courses}
            onClose={() => setCreateOpen(false)}
            onCreated={(row) => {
              setCreateOpen(false)
              setEditing(row)
            }}
            onGenerate={(draft) => {
              setCreateOpen(false)
              setGenerateTarget({
                offeringId: draft.offeringId,
                title: draft.title,
                type: draft.type,
                alsoCreate: true,
              })
              setGenerateOpen(true)
            }}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={questionOpen} onOpenChange={setQuestionOpen}>
        <SheetContent side="right" className="p-0 border-l overflow-hidden flex flex-col sheet-md">
          <QuestionForm
            question={question}
            courses={courses}
            onClose={() => setQuestionOpen(false)}
            onSaved={async () => {
              await queryClient.invalidateQueries({ queryKey: lecturerQuestionsQueryKey() })
              setQuestionOpen(false)
            }}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={generateOpen} onOpenChange={setGenerateOpen}>
        <SheetContent side="right" className="p-0 border-l overflow-hidden flex flex-col sheet-md">
          <GenerateQuestionsForm
            key={`${generateTarget.assessmentId ?? 'new'}-${generateTarget.offeringId ?? 'any'}`}
            courses={courses}
            lockOfferingId={generateTarget.offeringId}
            attachAssessmentId={generateTarget.assessmentId}
            defaultAlsoCreate={generateTarget.alsoCreate}
            defaultTitle={generateTarget.title}
            defaultType={generateTarget.type}
            onClose={() => setGenerateOpen(false)}
            onDone={async (assessment) => {
              await queryClient.invalidateQueries({ queryKey: lecturerQuestionsQueryKey() })
              await queryClient.invalidateQueries({ queryKey: lecturerAssessmentsQueryKey() })
              if (generateTarget.assessmentId) {
                await queryClient.invalidateQueries({ queryKey: lecturerAssessmentItemsQueryKey(generateTarget.assessmentId) })
              }
              setGenerateOpen(false)
              if (assessment) setEditing(assessment)
            }}
          />
        </SheetContent>
      </Sheet>

      <ConfirmAlertDialog
        open={Boolean(deletePaper)}
        onOpenChange={(open) => { if (!open) setDeletePaper(null) }}
        title="Delete this assessment?"
        tone="destructive"
        headlineLabel="Action"
        headline="Remove assessment"
        summary={deletePaper ? `"${deletePaper.title}" will be removed from ${deletePaper.courseCode}.` : ''}
        notices={[
          { icon: 'trash', label: 'This cannot be undone.' },
          { icon: 'lock', label: 'Assessments students have already handed in cannot be deleted.' },
        ]}
        confirmLabel="Delete"
        confirmVariant="destructive"
        loading={deletePaperMutation.isPending}
        onConfirm={() => { if (deletePaper) deletePaperMutation.mutate(deletePaper.id) }}
      />
    </LecturerShell>
  )
}

function DeleteQuestionButton({
  question,
  onDeleted,
}: {
  question: LecturerQuestion
  onDeleted: () => Promise<unknown> | void
}) {
  const mutation = useMutation({
    mutationFn: () => deleteLecturerQuestion(question.id),
    onSuccess: async () => {
      toast.success('Question removed from the bank.')
      await onDeleted()
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not delete that question.')),
  })

  return (
    <ConfirmAlertDialog
      trigger={
        <span className="inline-flex">
          <IconActionButton label="Delete question" icon={Trash2} danger />
        </span>
      }
      title="Delete this question?"
      tone="destructive"
      headlineLabel="Action"
      headline="Remove from the bank"
      summary={`"${question.stem}" will be removed. Quizzes that already pin a version keep that version.`}
      notices={[
        { icon: 'trash', label: 'Questions students have already answered cannot be deleted.' },
        { icon: 'lock', label: 'Remove it from any quiz first if it is still attached.' },
      ]}
      confirmLabel="Delete"
      confirmVariant="destructive"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate()}
    />
  )
}

function CreateQuizForm({
  courses,
  onClose,
  onCreated,
  onGenerate,
}: {
  courses: LecturerCourseRow[]
  onClose: () => void
  onCreated: (row: LecturerAssessmentRow) => void
  onGenerate: (draft: { offeringId: string; title: string; type: AssessmentType }) => void
}) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [offeringId, setOfferingId] = useState(courses[0]?.offeringId ?? '')
  const [type, setType] = useState<AssessmentType>('Quiz')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [maxMarks, setMaxMarks] = useState('10')
  const [weight, setWeight] = useState('10')

  const create = useMutation({
    mutationFn: () =>
      createLecturerAssessment({
        offeringId,
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        weight: Number(weight) || 10,
        totalMarks: Number(maxMarks) || 10,
        dueAt: dueDate || undefined,
        acceptsSubmissions: true,
        publish: true,
      }),
    onSuccess: async (row) => {
      toast.success(`${ASSESSMENT_TYPE_LABELS[row.type]} "${row.title}" created`)
      await queryClient.invalidateQueries({ queryKey: lecturerAssessmentsQueryKey() })
      onCreated(row)
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not create the assessment.')),
  })

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div style={{ padding: '20px 56px 18px 24px', borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 600, color: 'var(--foreground)' }}>
          Create Assessment/Quiz
        </h3>
        <FormInfoBox lines={formInfo.createAssessment} />
      </div>
      <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Assessment title" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Course</label>
            <Select value={offeringId} onValueChange={setOfferingId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.offeringId} value={course.offeringId}>{course.code} — {course.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Type</label>
            <Select value={type} onValueChange={(value) => setType(value as AssessmentType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(ASSESSMENT_TYPE_LABELS) as AssessmentType[]).map((value) => (
                  <SelectItem key={value} value={value}>{ASSESSMENT_TYPE_LABELS[value]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Instructions (optional)</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-md border text-sm"
              style={{ padding: '8px 12px', borderColor: 'var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
            />
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
        <Button
          variant="outline"
          className="flex-1 gap-1.5"
          disabled={!offeringId}
          onClick={() => onGenerate({ offeringId, title: title.trim(), type })}
        >
          <Sparkles style={{ width: 14, height: 14 }} /> Generate with AI
        </Button>
        <ConfirmAlertDialog
          trigger={
            <Button className="flex-1" disabled={!title.trim() || !offeringId || create.isPending} style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}>
              {create.isPending ? 'Creating…' : 'Create Assessment/Quiz'}
            </Button>
          }
          title="Create this assessment?"
          tone="success"
          headlineLabel="Action"
          headline={`Publish ${ASSESSMENT_TYPE_LABELS[type].toLowerCase()}`}
          summary={`"${title.trim()}" will be published to ${courses.find((row) => row.offeringId === offeringId)?.code ?? 'the course'}.`}
          notices={[
            { icon: 'user', label: 'Enrolled students can sit it once you attach questions.' },
            { icon: 'file', label: 'You will add questions from the institution bank next.' },
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

type DraftItem =
  | { kind: 'question'; questionId: string }
  | { kind: 'draw'; drawTopic: string; drawCourseId: string | null; drawCount: number }

function QuizItemsEditor({
  assessment,
  courses,
  questions,
  onBack,
  onAddQuestion,
  onGenerate,
}: {
  assessment: LecturerAssessmentRow
  courses: LecturerCourseRow[]
  questions: LecturerQuestion[]
  onBack: () => void
  onAddQuestion: () => void
  onGenerate: () => void
}) {
  const queryClient = useQueryClient()
  const { data: savedItems = [], isPending } = useQuery({
    queryKey: lecturerAssessmentItemsQueryKey(assessment.id),
    queryFn: () => listLecturerAssessmentItems(assessment.id),
  })
  const [draft, setDraft] = useState<DraftItem[] | null>(null)
  const items = draft ?? savedItems.map(toDraftItem)
  const course = courses.find((row) => row.offeringId === assessment.offeringId)
  const topics = useMemo(
    () => Array.from(new Set(questions.map((row) => row.topic).filter(Boolean))),
    [questions],
  )

  useEffect(() => {
    setDraft(null)
  }, [assessment.id])

  const save = useMutation({
    mutationFn: () =>
      saveLecturerAssessmentItems(assessment.id, {
        items: items.map((item) =>
          item.kind === 'question'
            ? { questionId: item.questionId }
            : { drawTopic: item.drawTopic, drawCourseId: item.drawCourseId, drawCount: item.drawCount },
        ),
      }),
    onSuccess: async () => {
      toast.success('Quiz questions saved.')
      await queryClient.invalidateQueries({ queryKey: lecturerAssessmentItemsQueryKey(assessment.id) })
      await queryClient.invalidateQueries({ queryKey: lecturerAssessmentsQueryKey() })
      setDraft(null)
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not save those questions.')),
  })

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 mb-6 transition-opacity hover:opacity-70"
        style={{ color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', padding: 0 }}
      >
        <ArrowLeft style={{ width: 15, height: 15 }} />
        Back to assessments
      </button>
      <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>
        {assessment.title}
      </h1>
      <p className="t-body mb-6" style={{ color: 'var(--muted-foreground)' }}>
        {course?.code ?? assessment.courseCode} · {ASSESSMENT_TYPE_LABELS[assessment.type]}. Pin a question if every student should get it. Draw from a topic if you want a random set. Save before students sit it.
      </p>
      <div className="mb-5">
        <Button variant="outline" className="gap-1.5" onClick={onGenerate}>
          <Sparkles style={{ width: 14, height: 14 }} /> Generate with AI
        </Button>
      </div>

      {isPending ? (
        <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading questions…</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map((item, index) => (
            <div
              key={`${item.kind}-${index}`}
              style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16 }}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="t-label px-2 py-0.5" style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', borderRadius: 'var(--radius-sm)' }}>
                  Q{index + 1}
                </span>
                <IconActionButton
                  label="Remove item"
                  icon={Trash2}
                  danger
                  onClick={() => setDraft(items.filter((_, i) => i !== index))}
                />
              </div>
              {item.kind === 'question' ? (
                <p className="text-sm mt-2" style={{ color: 'var(--foreground)' }}>
                  {questions.find((row) => row.id === item.questionId)?.stem ?? 'Question from the bank'}
                </p>
              ) : (
                <p className="text-sm mt-2" style={{ color: 'var(--foreground)' }}>
                  Draw {item.drawCount} from “{item.drawTopic}”
                  {item.drawCourseId
                    ? ` in ${courses.find((row) => row.courseId === item.drawCourseId)?.code ?? 'that course'}`
                    : ''}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
        <AttachQuestionCard
          questions={questions}
          attachedIds={items.filter((item): item is Extract<DraftItem, { kind: 'question' }> => item.kind === 'question').map((item) => item.questionId)}
          onAdd={(questionId) => {
            const question = questions.find((row) => row.id === questionId)
            const next: DraftItem[] = [...items, { kind: 'question', questionId }]
            const shortage = drawShortage(questions, next)
            if (shortage) {
              toast.error(shortage)
              return
            }
            setDraft(next)
          }}
          onCreate={onAddQuestion}
        />
        <DrawTopicCard
          topics={topics}
          courses={courses}
          onAdd={(draw) => {
            const next: DraftItem[] = [...items, draw]
            const shortage = drawShortage(questions, next)
            if (shortage) {
              toast.error(shortage)
              return
            }
            setDraft(next)
          }}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <ConfirmAlertDialog
          trigger={
            <Button disabled={save.isPending} style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}>
              {save.isPending ? 'Saving…' : 'Save quiz questions'}
            </Button>
          }
          title="Save these quiz questions?"
          tone="success"
          headlineLabel="Action"
          headline="Update quiz paper"
          summary={`Students sitting "${assessment.title}" will receive these ${items.length} item${items.length === 1 ? '' : 's'}.`}
          notices={[
            { icon: 'lock', label: 'Pinned questions keep the version attached now, even if the bank is edited later.' },
            { icon: 'file', label: 'A random draw is chosen once per student, on their first open, and then stays put.' },
          ]}
          confirmLabel="Save"
          confirmVariant="brand"
          loading={save.isPending}
          onConfirm={() => {
            const shortage = drawShortage(questions, items)
            if (shortage) {
              toast.error(shortage)
              return
            }
            save.mutate()
          }}
        />
        <Button variant="outline" onClick={onBack}>Cancel</Button>
      </div>
    </div>
  )
}

function toDraftItem(item: LecturerAssessmentItem): DraftItem {
  if (item.questionId) return { kind: 'question', questionId: item.questionId }
  return {
    kind: 'draw',
    drawTopic: item.drawTopic ?? '',
    drawCourseId: item.drawCourseId,
    drawCount: item.drawCount ?? 1,
  }
}

function drawShortage(questions: LecturerQuestion[], items: DraftItem[]): string | null {
  const pinnedIds = items.filter((item): item is Extract<DraftItem, { kind: 'question' }> => item.kind === 'question').map((item) => item.questionId)
  const remaining = new Map<string, number>()
  for (const item of items) {
    if (item.kind !== 'draw') continue
    const key = `${item.drawTopic}::${item.drawCourseId ?? ''}`
    if (!remaining.has(key)) {
      const unused = questions.filter((row) =>
        row.topic === item.drawTopic
        && (!item.drawCourseId || row.courseId === item.drawCourseId)
        && !pinnedIds.includes(row.id),
      ).length
      remaining.set(key, unused)
    }
    const unused = remaining.get(key) ?? 0
    if (unused < item.drawCount) {
      const available = unused === 1 ? '1 unused question' : `${unused} unused questions`
      return `“${item.drawTopic}” only has ${available}. You asked to draw ${item.drawCount}. Pin fewer of those questions, or lower the random draw.`
    }
    remaining.set(key, unused - item.drawCount)
  }
  return null
}

function AttachQuestionCard({
  questions,
  attachedIds,
  onAdd,
  onCreate,
}: {
  questions: LecturerQuestion[]
  attachedIds: string[]
  onAdd: (questionId: string) => void
  onCreate: () => void
}) {
  const available = questions.filter((row) => !attachedIds.includes(row.id))
  const [questionId, setQuestionId] = useState(available[0]?.id ?? '')
  useEffect(() => {
    if (!available.some((row) => row.id === questionId)) setQuestionId(available[0]?.id ?? '')
  }, [available, questionId])

  return (
    <div style={{ backgroundColor: 'var(--muted)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
      <h3 className="t-h3 mb-3" style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem' }}>Pin a question</h3>
      {available.length === 0 ? (
        <p className="t-caption mb-3" style={{ color: 'var(--muted-foreground)' }}>Every bank question is already on this quiz.</p>
      ) : (
        <Select value={questionId} onValueChange={setQuestionId}>
          <SelectTrigger><SelectValue placeholder="Choose a question" /></SelectTrigger>
          <SelectContent>
            {available.map((row) => (
              <SelectItem key={row.id} value={row.id}>{row.stem.slice(0, 80)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <div className="flex flex-col sm:flex-row gap-2 mt-3">
        <Button type="button" variant="outline" size="sm" disabled={!questionId} onClick={() => questionId && onAdd(questionId)}>
          Add to quiz
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCreate}>New bank question</Button>
      </div>
    </div>
  )
}

function DrawTopicCard({
  topics,
  courses,
  onAdd,
}: {
  topics: string[]
  courses: LecturerCourseRow[]
  onAdd: (item: Extract<DraftItem, { kind: 'draw' }>) => void
}) {
  const [topic, setTopic] = useState(topics[0] ?? '')
  const [courseId, setCourseId] = useState('all')
  const [count, setCount] = useState('2')
  useEffect(() => {
    if (topics.length > 0 && !topics.includes(topic)) setTopic(topics[0] ?? '')
  }, [topics, topic])

  return (
    <div style={{ backgroundColor: 'var(--muted)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
      <h3 className="t-h3 mb-3" style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem' }}>Random draw by topic</h3>
      {topics.length === 0 ? (
        <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>Add tagged questions to the bank first.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Select value={topic} onValueChange={setTopic}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {topics.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={courseId} onValueChange={setCourseId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any course</SelectItem>
              {uniqueCourses(courses).map((course) => (
                <SelectItem key={course.courseId} value={course.courseId}>{course.code}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="number" min={1} max={40} value={count} onChange={(e) => setCount(e.target.value)} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!topic.trim()}
            onClick={() =>
              onAdd({
                kind: 'draw',
                drawTopic: topic,
                drawCourseId: courseId === 'all' ? null : courseId,
                drawCount: Math.max(1, Number(count) || 1),
              })
            }
          >
            Add draw
          </Button>
        </div>
      )}
    </div>
  )
}

function QuestionForm({
  question,
  courses,
  onClose,
  onSaved,
}: {
  question: LecturerQuestion | null
  courses: LecturerCourseRow[]
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const isEdit = question !== null
  const [stem, setStem] = useState(question?.stem ?? '')
  const [topic, setTopic] = useState(question?.topic ?? 'Foundations')
  const [courseId, setCourseId] = useState(question?.courseId ?? courses[0]?.courseId ?? 'none')
  const [type, setType] = useState<QuestionType>(question?.type ?? 'MultipleChoice')
  const [options, setOptions] = useState<string[]>(question?.options ?? blankOptionsForQuestionType(question?.type ?? 'MultipleChoice'))
  const [correctAnswer, setCorrectAnswer] = useState(question?.correctAnswer ?? '')
  const [marks, setMarks] = useState(String(question?.marks ?? 1))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setStem(question?.stem ?? '')
    setTopic(question?.topic ?? 'Foundations')
    setCourseId(question?.courseId ?? courses[0]?.courseId ?? 'none')
    setType(question?.type ?? 'MultipleChoice')
    setOptions(question?.options ?? blankOptionsForQuestionType(question?.type ?? 'MultipleChoice'))
    setCorrectAnswer(question?.correctAnswer ?? '')
    setMarks(String(question?.marks ?? 1))
  }, [question, courses])

  const applyType = (next: QuestionType) => {
    setType(next)
    setOptions(blankOptionsForQuestionType(next))
    if (next === 'TrueFalse') {
      setCorrectAnswer((current) => (current === 'False' ? 'False' : 'True'))
    } else {
      setCorrectAnswer('')
    }
  }

  const saveQuestion = async () => {
    if (stem.trim().length < 4 || topic.trim().length < 1) return
    const payload = {
      courseId: courseId === 'none' ? null : courseId,
      topic: topic.trim(),
      stem: stem.trim(),
      options: type === 'MultipleChoice' ? options.map((row) => row.trim()).filter(Boolean) : type === 'TrueFalse' ? ['True', 'False'] : undefined,
      correctAnswer: correctAnswer.trim(),
      marks: Number(marks) || 1,
    }
    setSaving(true)
    try {
      if (isEdit && question) {
        await updateLecturerQuestion(question.id, payload)
        toast.success(question.answeredCount > 0 ? 'New version saved. Earlier answers keep the old wording.' : 'Question updated.')
      } else {
        await createLecturerQuestion({ ...payload, type })
        toast.success('Question added to the bank.')
      }
      await onSaved()
    } catch (err) {
      toast.error(apiErrorMessage(err, isEdit ? 'Could not update that question.' : 'Could not add that question.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div style={{ padding: '20px 56px 18px 24px', borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 600, color: 'var(--foreground)' }}>
          {isEdit ? 'Edit question' : 'Add question'}
        </h3>
        <FormInfoBox
          lines={
            isEdit && question.answeredCount > 0
              ? formInfo.editQuestionAnswered
              : isEdit
                ? formInfo.editQuestion
                : formInfo.addQuestion
          }
        />
      </div>
      <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Question</label>
          <Textarea value={stem} onChange={(e) => setStem(e.target.value)} rows={3} placeholder="The question students will see…" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Topic</label>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic" />
          </div>
          <div>
            <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Course (optional)</label>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Any course</SelectItem>
                {uniqueCourses(courses).map((course) => (
                  <SelectItem key={course.courseId} value={course.courseId}>{course.code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Type</label>
            <Select value={type} onValueChange={(value) => applyType(value as QuestionType)} disabled={isEdit}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MultipleChoice">Multiple choice</SelectItem>
                <SelectItem value="TrueFalse">True / false</SelectItem>
                <SelectItem value="ShortAnswer">Short answer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Marks</label>
            <Input type="number" min={0.5} step={0.5} value={marks} onChange={(e) => setMarks(e.target.value)} />
          </div>
        </div>
        {type === 'MultipleChoice' ? (
          <div>
            <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Options</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={`Mark option ${index + 1} correct`}
                    onClick={() => setCorrectAnswer(option)}
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      flexShrink: 0,
                      border: `2px solid ${correctAnswer === option && option ? 'var(--brand)' : 'var(--border)'}`,
                      backgroundColor: correctAnswer === option && option ? 'var(--brand)' : 'transparent',
                      cursor: 'pointer',
                    }}
                  />
                  <Input
                    value={option}
                    onChange={(e) => {
                      const next = [...options]
                      next[index] = e.target.value
                      setOptions(next)
                      if (correctAnswer === option) setCorrectAnswer(e.target.value)
                    }}
                    placeholder={`Option ${index + 1}`}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {type === 'TrueFalse' ? (
          <div className="flex items-center gap-3">
            {['True', 'False'].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setCorrectAnswer(value)}
                className="px-4 py-1.5 text-sm font-medium rounded-lg"
                style={{
                  border: correctAnswer === value ? '2px solid var(--brand)' : '1.5px solid var(--border)',
                  backgroundColor: correctAnswer === value ? 'rgba(var(--brand-rgb),0.08)' : 'var(--card)',
                  color: correctAnswer === value ? 'var(--brand)' : 'var(--foreground)',
                  cursor: 'pointer',
                }}
              >
                {value}
              </button>
            ))}
          </div>
        ) : null}
        {type === 'ShortAnswer' ? (
          <div>
            <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Correct answer</label>
            <Input value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} placeholder="Expected answer" />
          </div>
        ) : null}
      </div>
      <div className="flex flex-col sm:flex-row gap-3" style={{ padding: '16px 24px 24px' }}>
        <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
        <ConfirmAlertDialog
          trigger={
            <Button
              className="flex-1"
              disabled={stem.trim().length < 4 || !topic.trim() || !correctAnswer.trim() || saving}
              style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}
            >
              {saving ? 'Saving…' : isEdit ? 'Save question' : 'Add to bank'}
            </Button>
          }
          title={isEdit ? 'Save this question?' : 'Add this question to the bank?'}
          tone="success"
          headlineLabel="Action"
          headline={isEdit ? 'Update question' : 'Create question'}
          summary={
            isEdit && question.answeredCount > 0
              ? 'A new version will be created so earlier student answers stay attached to the wording they saw.'
              : `"${stem.trim() || 'This question'}" will be stored in the institution bank.`
          }
          notices={[
            { icon: 'file', label: 'Quizzes already sitting this version keep it until you attach a newer one.' },
            { icon: 'user', label: 'Any lecturer in this institution can reuse tagged questions.' },
          ]}
          confirmLabel={isEdit ? 'Save' : 'Add'}
          confirmVariant="brand"
          loading={saving}
          onConfirm={saveQuestion}
        />
      </div>
    </div>
  )
}

function GenerateQuestionsForm({
  courses,
  lockOfferingId,
  attachAssessmentId,
  defaultAlsoCreate,
  defaultTitle,
  defaultType,
  onClose,
  onDone,
}: {
  courses: LecturerCourseRow[]
  lockOfferingId?: string
  attachAssessmentId?: string
  defaultAlsoCreate?: boolean
  defaultTitle?: string
  defaultType?: AssessmentType
  onClose: () => void
  onDone: (assessment: LecturerAssessmentRow | null) => Promise<void>
}) {
  const [offeringId, setOfferingId] = useState(lockOfferingId ?? courses[0]?.offeringId ?? '')
  const [topic, setTopic] = useState('Foundations')
  const [count, setCount] = useState('4')
  const [types, setTypes] = useState<QuestionType[]>(['MultipleChoice', 'TrueFalse', 'ShortAnswer'])
  const [file, setFile] = useState<File | null>(null)
  const { oversizeFile, setOversizeFile, takeFile } = useOversizeUpload()
  const [formUrl, setFormUrl] = useState('')
  const [useMaterials, setUseMaterials] = useState(true)
  const [alsoCreate, setAlsoCreate] = useState(Boolean(defaultAlsoCreate && !attachAssessmentId))
  const [title, setTitle] = useState(defaultTitle ?? '')
  const [assessmentType, setAssessmentType] = useState<AssessmentType>(defaultType ?? 'Quiz')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (lockOfferingId) setOfferingId(lockOfferingId)
  }, [lockOfferingId])

  const toggleType = (value: QuestionType) => {
    setTypes((current) => {
      if (current.includes(value)) {
        const next = current.filter((item) => item !== value)
        return next.length > 0 ? next : current
      }
      return [...current, value]
    })
  }

  const run = async () => {
    if (!offeringId || topic.trim().length < 1) return
    setSaving(true)
    try {
      let fileKey: string | undefined
      let fileName: string | undefined
      let mimeType: string | undefined
      if (file) {
        const uploaded = await uploadLecturerQuestionImport(file)
        fileKey = uploaded.fileKey
        fileName = uploaded.fileName
        mimeType = uploaded.mimeType
      }
      const result = await generateLecturerQuestions({
        offeringId,
        topic: topic.trim(),
        types,
        count: Math.max(1, Math.min(8, Number(count) || 4)),
        useCourseMaterials: useMaterials && !file && !formUrl.trim(),
        fileKey,
        fileName,
        mimeType,
        externalUrl: formUrl.trim() || undefined,
        createAssessment: alsoCreate && title.trim() && !attachAssessmentId
          ? { title: title.trim(), type: assessmentType }
          : undefined,
        assessmentId: attachAssessmentId,
      })
      toast.success(
        result.assessment
          ? `${result.questions.length} questions added and attached to "${result.assessment.title}".`
          : `${result.questions.length} questions added to the bank.`,
      )
      await onDone(result.assessment)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not generate those questions.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div style={{ padding: '20px 56px 18px 24px', borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 600, color: 'var(--foreground)' }}>
          Generate with AI
        </h3>
        <FormInfoBox lines={formInfo.generateQuestions} />
      </div>
      <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Course</label>
          <Select value={offeringId} onValueChange={setOfferingId} disabled={Boolean(lockOfferingId)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.offeringId} value={course.offeringId}>{course.code} — {course.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Topic</label>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>
          <div>
            <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>How many</label>
            <Input type="number" min={1} max={8} value={count} onChange={(e) => setCount(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Question types</label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(TYPE_LABEL) as QuestionType[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => toggleType(value)}
                className="px-3 py-1.5 text-sm rounded-lg"
                style={{
                  border: types.includes(value) ? '2px solid var(--brand)' : '1.5px solid var(--border)',
                  backgroundColor: types.includes(value) ? 'rgba(var(--brand-rgb),0.08)' : 'var(--card)',
                  color: 'var(--foreground)',
                  cursor: 'pointer',
                }}
              >
                {TYPE_LABEL[value]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Upload a document (optional)</label>
          <input
            type="file"
            accept={DOCUMENT_IMPORT_ACCEPT}
            onChange={(event) => {
              const next = event.target.files?.[0] ?? null
              event.target.value = ''
              takeFile(next, setFile)
            }}
            className="w-full text-sm"
          />
          <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
            PDF, Word, Excel, CSV · max {MAX_UPLOAD_LABEL}. Or a Google Form link below.
          </p>
        </div>
        <div>
          <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Google Form or other public link</label>
          <Input value={formUrl} onChange={(e) => setFormUrl(e.target.value)} placeholder="https://docs.google.com/forms/..." />
        </div>
        <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--foreground)' }}>
          <input
            type="checkbox"
            checked={useMaterials}
            onChange={(e) => setUseMaterials(e.target.checked)}
            disabled={Boolean(file) || Boolean(formUrl.trim())}
          />
          Draft from published course materials
        </label>
        {attachAssessmentId ? (
          <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
            These questions will be added to this assessment and to the bank.
          </p>
        ) : (
          <>
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--foreground)' }}>
              <input type="checkbox" checked={alsoCreate} onChange={(e) => setAlsoCreate(e.target.checked)} />
              Also create an assessment from these questions
            </label>
            {alsoCreate ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Assessment title</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Assessment title" />
                </div>
                <div>
                  <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Type</label>
                  <Select value={assessmentType} onValueChange={(value) => setAssessmentType(value as AssessmentType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(ASSESSMENT_TYPE_LABELS) as AssessmentType[]).map((value) => (
                        <SelectItem key={value} value={value}>{ASSESSMENT_TYPE_LABELS[value]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-3" style={{ padding: '16px 24px 24px' }}>
        <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
        <ConfirmAlertDialog
          trigger={
            <Button
              className="flex-1"
              disabled={!offeringId || topic.trim().length < 1 || saving || (alsoCreate && !attachAssessmentId && !title.trim())}
              style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}
            >
              {saving ? 'Generating…' : 'Generate questions'}
            </Button>
          }
          title="Generate these questions?"
          tone="success"
          headlineLabel="Action"
          headline="Add to the bank"
          summary={`About ${count} question${count === '1' ? '' : 's'} will be tagged to ${courses.find((row) => row.offeringId === offeringId)?.code ?? 'the selected course'} / ${topic.trim() || 'this topic'}.`}
          notices={[
            { icon: 'file', label: 'An uploaded file is read once and then removed.' },
            { icon: 'file', label: 'With no file or link, published course materials are used when that box is ticked.' },
            { icon: 'lock', label: 'The in-built generator is used if no cloud key is set, or if the vendor is slow.' },
          ]}
          confirmLabel="Generate"
          confirmVariant="brand"
          loading={saving}
          onConfirm={run}
        />
      </div>
      <FileTooLargeDialog
        file={oversizeFile}
        onAccept={(next) => {
          setFile(next)
          setOversizeFile(null)
        }}
        onClose={() => setOversizeFile(null)}
      />
    </div>
  )
}
