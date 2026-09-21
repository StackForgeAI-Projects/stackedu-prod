import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  LayoutDashboard, BookOpen, BarChart2, Bell, ClipboardList,
  FileText, TrendingUp, Plus, Trash2, ArrowLeft, GripVertical,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { LECTURER, LECTURER_COURSES } from '@/data/lecturer'

export const Route = createFileRoute('/_auth/lecturer/assessment-builder')({
  component: AssessmentBuilderPage,
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

type QType = 'Multiple Choice' | 'True-False' | 'Short Answer'

interface Question {
  id:       number
  text:     string
  type:     QType
  marks:    string
  options:  string[]
  correct:  number
}

interface Assessment {
  id:           number
  title:        string
  courseId:     string
  type:         'Quiz' | 'Exam'
  duration:     number
  questionCount: number
  status:       'Draft' | 'Published' | 'Closed'
  startDate:    string
}

const MOCK_ASSESSMENTS: Assessment[] = [
  { id: 1, title: 'CSC 201 — Week 5 Quiz',    courseId: 'csc-201', type: 'Quiz', duration: 30, questionCount: 10, status: 'Published', startDate: '15 Jan 2025' },
  { id: 2, title: 'CSC 301 — Mid-Term Exam',  courseId: 'csc-301', type: 'Exam', duration: 120, questionCount: 40, status: 'Draft',    startDate: '10 Feb 2025' },
  { id: 3, title: 'CSC 202 — OOP Concepts Quiz', courseId: 'csc-202', type: 'Quiz', duration: 45, questionCount: 15, status: 'Closed', startDate: '08 Jan 2025' },
]

const STATUS_STYLE: Record<Assessment['status'], { bg: string; color: string }> = {
  Draft:     { bg: 'var(--muted)',       color: 'var(--muted-foreground)' },
  Published: { bg: 'var(--success-bg)', color: 'var(--success)'          },
  Closed:    { bg: 'var(--info-bg)',    color: 'var(--info)'             },
}

// ─────────────────────────────────────────────────────────────────────────────

function AssessmentBuilderPage() {
  const [view, setView] = useState<'list' | 'create'>('list')

  return (
    <AppShell
      navItems={LECTURER_NAV}
      pageTitle="Assessment Builder"
      userName={LECTURER.fullName}
      userRole="Lecturer"
      userInitials={LECTURER.initials}
      unreadCount={3}
      infoCardLabel="LECTURER ID"
      infoCardValue={LECTURER.id}
      infoCardSubtext={LECTURER.department}
    >
      <div className="animate-fade-up" style={{ padding: '32px 32px 56px', maxWidth: 960, margin: '0 auto' }}>
        {view === 'list'
          ? <AssessmentList onCreateNew={() => setView('create')} />
          : <CreateAssessmentForm onBack={() => setView('list')} />
        }
      </div>
    </AppShell>
  )
}

// ── Assessment list ───────────────────────────────────────────────────────────

function AssessmentList({ onCreateNew }: { onCreateNew: () => void }) {
  return (
    <div>
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Assessment Builder</h1>
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Create and manage online quizzes and examinations.</p>
        </div>
        <Button onClick={onCreateNew} style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', gap: 6 }}>
          <Plus style={{ width: 15, height: 15 }} /> Create assessment
        </Button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {MOCK_ASSESSMENTS.map(a => {
          const course = LECTURER_COURSES.find(c => c.id === a.courseId)
          const ss     = STATUS_STYLE[a.status]
          return (
            <div key={a.id} style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: '18px 22px' }}>
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{a.title}</span>
                    <span className="t-label px-2 py-0.5" style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info)', borderRadius: 'var(--radius-sm)' }}>{a.type}</span>
                    <span className="t-label px-2 py-0.5" style={{ backgroundColor: ss.bg, color: ss.color, borderRadius: 'var(--radius-sm)' }}>{a.status}</span>
                  </div>
                  <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                    {course?.code} · {a.duration} min · {a.questionCount} questions · {a.startDate}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button variant="outline" size="sm" style={{ fontSize: '0.8125rem' }}>View results</Button>
                  <Button variant="outline" size="sm" style={{ fontSize: '0.8125rem' }} onClick={onCreateNew}>Edit</Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Create assessment form (full page) ────────────────────────────────────────

function CreateAssessmentForm({ onBack }: { onBack: () => void }) {
  const [title,        setTitle]        = useState('')
  const [courseId,     setCourseId]     = useState(LECTURER_COURSES[0].id)
  const [type,         setType]         = useState<'Quiz' | 'Exam'>('Quiz')
  const [duration,     setDuration]     = useState('')
  const [startDate,    setStartDate]    = useState('')
  const [endDate,      setEndDate]      = useState('')
  const [instructions, setInstructions] = useState('')
  const [questions,    setQuestions]    = useState<Question[]>([])
  const nextId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1

  const addQuestion = () => {
    setQuestions(prev => [
      ...prev,
      { id: nextId, text: '', type: 'Multiple Choice', marks: '1', options: ['', '', '', ''], correct: 0 },
    ])
  }

  const removeQuestion = (id: number) => setQuestions(prev => prev.filter(q => q.id !== id))

  const updateQuestion = (id: number, patch: Partial<Question>) =>
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...patch } : q))

  const publish = () => {
    if (!title.trim()) return
    toast.success(`Assessment "${title}" published`)
    onBack()
  }

  const saveDraft = () => {
    toast.success('Draft saved')
  }

  return (
    <div>
      {/* Back */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 mb-6 transition-opacity hover:opacity-70"
        style={{ color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', padding: 0 }}
      >
        <ArrowLeft style={{ width: 15, height: 15 }} />
        Back to assessments
      </button>

      <h1 className="t-h1 mb-7" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Create Assessment</h1>

      {/* Assessment details card */}
      <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24, marginBottom: 20 }}>
        <h2 className="t-h3 mb-5" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Details</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Title</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Week 5 Quiz" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Course</label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LECTURER_COURSES.map(c => <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Type</label>
              <Select value={type} onValueChange={v => setType(v as 'Quiz' | 'Exam')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Quiz">Quiz</SelectItem>
                  <SelectItem value="Exam">Exam</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Duration (minutes)</label>
              <Input type="number" min={1} value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 60" />
            </div>
            <div>
              <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Start date & time</label>
              <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full rounded-md border text-sm" style={{ padding: '8px 12px', borderColor: 'var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', outline: 'none' }} />
            </div>
            <div>
              <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>End date & time</label>
              <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full rounded-md border text-sm" style={{ padding: '8px 12px', borderColor: 'var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', outline: 'none' }} />
            </div>
          </div>
          <div>
            <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Instructions</label>
            <Textarea value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="Instructions shown to students before they start…" rows={3} />
          </div>
        </div>
      </div>

      {/* Question builder */}
      <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24, marginBottom: 20 }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Questions ({questions.length})</h2>
          <Button onClick={addQuestion} variant="outline" className="gap-1.5">
            <Plus style={{ width: 14, height: 14 }} /> Add question
          </Button>
        </div>

        {questions.length === 0 && (
          <div className="py-8 text-center">
            <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>Click 'Add question' to build your assessment.</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {questions.map((q, idx) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={idx}
              onUpdate={patch => updateQuestion(q.id, patch)}
              onDelete={() => removeQuestion(q.id)}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button onClick={publish} style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}>Publish</Button>
        <Button variant="outline" onClick={saveDraft}>Save as draft</Button>
        <Button variant="outline" onClick={onBack}>Cancel</Button>
      </div>
    </div>
  )
}

// ── Question card ─────────────────────────────────────────────────────────────

function QuestionCard({
  question: q, index, onUpdate, onDelete,
}: {
  question: Question
  index: number
  onUpdate: (patch: Partial<Question>) => void
  onDelete: () => void
}) {
  return (
    <div style={{ backgroundColor: 'var(--muted)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 18 }}>
      <div className="flex items-start gap-3 mb-4">
        <GripVertical style={{ width: 16, height: 16, color: 'var(--muted-foreground)', marginTop: 8, cursor: 'grab', flexShrink: 0 }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="t-label px-2 py-0.5" style={{ backgroundColor: 'var(--card)', color: 'var(--muted-foreground)', borderRadius: 'var(--radius-sm)' }}>Q{index + 1}</span>
            <Select value={q.type} onValueChange={v => onUpdate({ type: v as QType })}>
              <SelectTrigger style={{ height: 30, width: 180, fontSize: '0.8125rem' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Multiple Choice">Multiple Choice</SelectItem>
                <SelectItem value="True-False">True-False</SelectItem>
                <SelectItem value="Short Answer">Short Answer</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number" min={1} value={q.marks} onChange={e => onUpdate({ marks: e.target.value })}
              placeholder="Marks"
              style={{ width: 80, height: 30, fontSize: '0.8125rem' }}
            />
            <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>mark{q.marks !== '1' ? 's' : ''}</span>
          </div>
          <Input
            value={q.text}
            onChange={e => onUpdate({ text: e.target.value })}
            placeholder={`Question ${index + 1} text…`}
            style={{ marginBottom: 12, fontSize: '0.875rem' }}
          />

          {q.type === 'Multiple Choice' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdate({ correct: oi })}
                    style={{
                      width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${q.correct === oi ? 'var(--brand)' : 'var(--border)'}`,
                      backgroundColor: q.correct === oi ? 'var(--brand)' : 'transparent',
                      cursor: 'pointer',
                    }}
                  />
                  <Input
                    value={opt}
                    onChange={e => {
                      const newOpts = [...q.options]; newOpts[oi] = e.target.value; onUpdate({ options: newOpts })
                    }}
                    placeholder={`Option ${oi + 1}`}
                    style={{ fontSize: '0.8125rem', height: 32 }}
                  />
                </div>
              ))}
            </div>
          )}

          {q.type === 'True-False' && (
            <div className="flex items-center gap-3">
              {['True', 'False'].map((opt, oi) => (
                <button
                  key={opt}
                  onClick={() => onUpdate({ correct: oi })}
                  className="px-4 py-1.5 text-sm font-medium rounded-lg transition-colors"
                  style={{
                    border: q.correct === oi ? '2px solid var(--brand)' : '1.5px solid var(--border)',
                    backgroundColor: q.correct === oi ? 'rgba(32,244,78,0.08)' : 'var(--card)',
                    color: q.correct === oi ? 'var(--brand)' : 'var(--foreground)',
                    cursor: 'pointer',
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={onDelete} style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
          <Trash2 style={{ width: 15, height: 15 }} />
        </button>
      </div>
    </div>
  )
}
