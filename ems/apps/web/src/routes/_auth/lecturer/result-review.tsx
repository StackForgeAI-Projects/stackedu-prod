import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { BarChart2, Download } from 'lucide-react'
import { LecturerShell } from '@/components/LecturerShell'
import { Button } from '@/components/ui/button'
import { brandColorValue } from '@/lib/brand-theme'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from 'recharts'
import { toast } from 'sonner'
import {
  LECTURER_COURSES, COURSE_STUDENTS, ASSESSMENTS,
  PUBLISHED_MARKS, calcGrade, gradeColor, type CourseStudent,
} from '@/data/lecturer'

export const Route = createFileRoute('/_auth/lecturer/result-review')({
  component: ResultReviewPage,
})

const SEMESTERS = [
  { value: '1-2024-2025', label: '1st Semester 2024/2025' },
  { value: '2-2023-2024', label: '2nd Semester 2023/2024' },
]

// ─────────────────────────────────────────────────────────────────────────────

function ResultReviewPage() {
  const [courseId,  setCourseId]  = useState(LECTURER_COURSES[0].id)
  const [semester,  setSemester]  = useState('1-2024-2025')

  const course      = LECTURER_COURSES.find(c => c.id === courseId)!
  const students    = COURSE_STUDENTS[courseId] ?? []
  const published   = ASSESSMENTS.filter(a => a.courseId === courseId && a.status === 'published')

  return (
    <LecturerShell pageTitle="Published Results">
      <div className="animate-fade-up" style={{ padding: '32px 32px 56px', maxWidth: 1000, margin: '0 auto' }}>

        {/* Header */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Published Results</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Read-only view of results approved and published by the Academic Admin.</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={semester} onValueChange={setSemester}>
              <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SEMESTERS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LECTURER_COURSES.map(c => <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {published.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div style={{ width: 56, height: 56, backgroundColor: 'var(--muted)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <BarChart2 style={{ width: 24, height: 24, color: 'var(--muted-foreground)' }} />
            </div>
            <p className="t-h3 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>No published results</p>
            <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>No results have been published for {course.code} this semester.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {published.map(a => (
              <PublishedAssessmentBlock key={a.id} assessment={a} students={students} />
            ))}
          </div>
        )}
      </div>
    </LecturerShell>
  )
}

// ── Published assessment block ────────────────────────────────────────────────

function PublishedAssessmentBlock({
  assessment: a, students,
}: {
  assessment: typeof ASSESSMENTS[0]
  students: CourseStudent[]
}) {
  const marks = PUBLISHED_MARKS[a.id] ?? {}

  const numericMarks = students
    .map((s: CourseStudent) => marks[s.id])
    .filter((v: number | undefined): v is number => v !== undefined)
  const avg = numericMarks.length
    ? (numericMarks.reduce((x: number, y: number) => x + y, 0) / numericMarks.length).toFixed(1)
    : '—'

  // Grade distribution
  const dist: Record<string, number> = { A: 0, 'B+': 0, B: 0, 'C+': 0, C: 0, 'D+': 0, D: 0, F: 0 }
  students.forEach((s: CourseStudent) => {
    if (marks[s.id] !== undefined) {
      const g = calcGrade(marks[s.id], a.maxMarks)
      if (g in dist) dist[g]++
    }
  })
  const chartData = Object.entries(dist).map(([grade, count]) => ({ grade, count }))

  return (
    <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', overflow: 'hidden' }}>
      {/* Section header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
        <div className="flex items-center gap-3">
          <span className="t-label px-2.5 py-1" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-sm)' }}>Published</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{a.name}</p>
            <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Max: {a.maxMarks} marks · Weight: {a.weight}% · Class avg: {avg}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.success(`Exported ${a.name}`)}>
          <Download style={{ width: 13, height: 13 }} /> Export
        </Button>
      </div>

      {/* Results table (read-only) */}
      <div className="grid px-5 py-2.5" style={{ gridTemplateColumns: '140px 1fr 140px 80px', borderBottom: '1px solid var(--border)' }}>
        {['STUDENT ID', 'NAME', `MARKS / ${a.maxMarks}`, 'GRADE'].map(h => <span key={h} className="t-label" style={{ color: 'var(--muted-foreground)' }}>{h}</span>)}
      </div>
      {students.map((s: CourseStudent, i: number) => {
        const m  = marks[s.id]
        const grade = m !== undefined ? calcGrade(m, a.maxMarks) : '—'
        const gc    = gradeColor(grade)
        return (
          <div key={s.id} className="grid items-center px-5" style={{ gridTemplateColumns: '140px 1fr 140px 80px', paddingTop: 12, paddingBottom: 12, borderBottom: i < students.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{s.id}</span>
            <span className="text-sm" style={{ color: 'var(--foreground)' }}>{s.name}</span>
            <span className="text-sm" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-mono)', opacity: 0.8 }}>
              {m !== undefined ? `${m} / ${a.maxMarks}` : '—'}
            </span>
            <span className="t-label px-2 py-0.5 w-fit" style={{ backgroundColor: gc.bg, color: gc.color, borderRadius: 'var(--radius-sm)' }}>{grade}</span>
          </div>
        )
      })}

      {/* Grade distribution chart */}
      {chartData.some(d => d.count > 0) && (
        <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border)' }}>
          <p className="t-label mb-3" style={{ color: 'var(--muted-foreground)' }}>GRADE DISTRIBUTION</p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="grade" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', backgroundColor: 'var(--card)', fontSize: 12 }} />
              <Bar dataKey="count" fill={brandColorValue()} radius={[3, 3, 0, 0]} name="Students" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
