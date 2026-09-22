import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  LayoutDashboard, BookOpen, BarChart2, Bell, ClipboardList,
  FileText, TrendingUp, Users, ChevronRight, Search, Trash2, Upload,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import {
  LECTURER, LECTURER_COURSES, COURSE_STUDENTS, ATTENDANCE_SESSIONS,
  COURSE_MATERIALS, ASSESSMENTS, PUBLISHED_MARKS, calcGrade, gradeColor,
  type LecturerCourse, type CourseStudent,
} from '@/data/lecturer'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

export const Route = createFileRoute('/_auth/lecturer/courses')({
  component: MyCoursesPage,
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

function MyCoursesPage() {
  const [selected,       setSelected]       = useState<LecturerCourse>(LECTURER_COURSES[0])
  const [activeStudent,  setActiveStudent]  = useState<CourseStudent | null>(null)
  const [studentSearch,  setStudentSearch]  = useState('')

  return (
    <AppShell
      navItems={LECTURER_NAV}
      pageTitle="My Courses"
      userName={LECTURER.fullName}
      userRole="Lecturer"
      userInitials={LECTURER.initials}
      unreadCount={3}
      infoCardLabel="LECTURER ID"
      infoCardValue={LECTURER.id}
      infoCardSubtext={LECTURER.department}
    >
      <div className="flex animate-fade-up" style={{ height: 'calc(100vh - var(--header-height))', overflow: 'hidden' }}>

        {/* ── Left — course list ─────────────────────────────────────────── */}
        <div
          className="flex-shrink-0 overflow-y-auto"
          style={{ width: 320, borderRight: '1px solid var(--border)', padding: '24px 16px' }}
        >
          <h2 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', paddingLeft: 4 }}>My Courses</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {LECTURER_COURSES.map(course => (
              <CourseListCard
                key={course.id}
                course={course}
                active={selected.id === course.id}
                onClick={() => setSelected(course)}
              />
            ))}
          </div>
        </div>

        {/* ── Right — course detail ─────────────────────────────────────── */}
        <div className="flex-1 min-w-0 overflow-y-auto" style={{ padding: '24px 32px 48px' }}>
          <CourseDetail
            course={selected}
            studentSearch={studentSearch}
            onStudentSearchChange={setStudentSearch}
            onStudentClick={setActiveStudent}
          />
        </div>

      </div>

      {/* Student performance Sheet */}
      <Sheet open={activeStudent !== null} onOpenChange={open => { if (!open) setActiveStudent(null) }}>
        <SheetContent side="right" className="p-0 border-l overflow-hidden flex flex-col" style={{ width: 'min(720px, 45vw)' }}>
          {activeStudent && <StudentPerformanceSheet student={activeStudent} course={selected} onClose={() => setActiveStudent(null)} />}
        </SheetContent>
      </Sheet>
    </AppShell>
  )
}

// ── Course list card ──────────────────────────────────────────────────────────

function CourseListCard({ course, active, onClick }: { course: LecturerCourse; active: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: active ? 'rgba(32,244,78,0.06)' : hovered ? 'var(--muted)' : 'var(--card)',
        border: active ? '1px solid rgba(32,244,78,0.2)' : '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)', padding: '14px 14px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: hovered && !active ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        transition: 'box-shadow 150ms ease-out',
      }}
    >
      <div className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 44, height: 44, backgroundColor: course.color }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: '#fff' }}>{course.code}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: active ? 'var(--brand)' : 'var(--foreground)' }}>{course.name}</p>
        <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
          {course.enrolledCount} students · {course.credits} credits
        </p>
        <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Next: {course.nextClassShort}</p>
      </div>
      <ChevronRight style={{ width: 15, height: 15, color: active ? 'var(--brand)' : 'var(--muted-foreground)', flexShrink: 0 }} />
    </div>
  )
}

// ── Course detail ─────────────────────────────────────────────────────────────

function CourseDetail({
  course, studentSearch, onStudentSearchChange, onStudentClick,
}: {
  course: LecturerCourse
  studentSearch: string
  onStudentSearchChange: (q: string) => void
  onStudentClick: (s: CourseStudent) => void
}) {
  const students   = COURSE_STUDENTS[course.id] ?? []
  const materials  = COURSE_MATERIALS.filter(m => m.courseId === course.id)
  const assessments = ASSESSMENTS.filter(a => a.courseId === course.id && a.status === 'published')

  const filteredStudents = students.filter(s =>
    !studentSearch || s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.id.includes(studentSearch)
  )

  const avg = students.length
    ? Math.round(students.reduce((sum, s) => sum + s.attendanceRate, 0) / students.length)
    : 0

  const gradeDistribution = (() => {
    const dist: Record<string, number> = { A: 0, 'B+': 0, B: 0, 'C+': 0, C: 0, D: 0, F: 0 }
    const assessment = assessments[0]
    if (!assessment) return dist
    const marks = PUBLISHED_MARKS[assessment.id] ?? {}
    students.forEach(s => {
      const g = calcGrade(marks[s.id] ?? 0, assessment.maxMarks)
      if (g in dist) dist[g]++
    })
    return dist
  })()

  const chartData = Object.entries(gradeDistribution).map(([grade, count]) => ({ grade, count }))

  const typeBadge: Record<string, { bg: string; color: string }> = {
    PDF:  { bg: 'var(--error-bg)',   color: 'var(--error)'   },
    PPTX: { bg: 'var(--warning-bg)', color: 'var(--warning)' },
    DOCX: { bg: 'var(--info-bg)',    color: 'var(--info)'    },
    ZIP:  { bg: 'var(--muted)',      color: 'var(--muted-foreground)' },
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 48, height: 48, backgroundColor: course.color }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: '#fff' }}>{course.code}</span>
          </div>
          <div>
            <h1 className="t-h2" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.01em' }}>{course.name}</h1>
            <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>Department of Computer Science · {course.credits} credits</p>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          {course.schedule.map((slot, i) => (
            <span key={i} className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
              {slot.day} · {slot.time} · {slot.room}
            </span>
          ))}
          <span className="flex items-center gap-1 t-caption" style={{ color: 'var(--muted-foreground)' }}>
            <Users style={{ width: 12, height: 12 }} /> {course.enrolledCount} students
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="students">
        <TabsList className="mb-5">
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="content">Course Content</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Students tab */}
        <TabsContent value="students">
          <div className="mb-4 flex items-center gap-2" style={{
            backgroundColor: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0 12px', height: 38,
          }}>
            <Search style={{ width: 14, height: 14, color: 'var(--muted-foreground)', flexShrink: 0 }} />
            <input
              type="text" placeholder="Search students…" value={studentSearch}
              onChange={e => onStudentSearchChange(e.target.value)}
              className="flex-1 bg-transparent outline-none" style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}
            />
          </div>

          <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            {/* Header */}
            <div className="grid px-5 py-3" style={{ gridTemplateColumns: '140px 1fr 110px 70px 80px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
              {['STUDENT ID', 'NAME', 'ATTENDANCE', 'GRADE', ''].map(h => (
                <span key={h} className="t-label" style={{ color: 'var(--muted-foreground)' }}>{h}</span>
              ))}
            </div>
            {filteredStudents.map((s, i) => {
              const gc = gradeColor(s.lastGrade ?? '—')
              return (
                <div
                  key={s.id}
                  className="grid items-center px-5 cursor-pointer transition-colors duration-150"
                  style={{ gridTemplateColumns: '140px 1fr 110px 70px 80px', paddingTop: 13, paddingBottom: 13, borderBottom: i < filteredStudents.length - 1 ? '1px solid var(--border)' : 'none' }}
                  onClick={() => onStudentClick(s)}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{s.id}</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{s.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-full overflow-hidden" style={{ height: 5, backgroundColor: 'var(--muted)' }}>
                      <div style={{ width: `${s.attendanceRate}%`, height: '100%', backgroundColor: s.attendanceRate >= 75 ? 'var(--success)' : 'var(--error)', borderRadius: 9999 }} />
                    </div>
                    <span className="t-caption" style={{ color: 'var(--muted-foreground)', flexShrink: 0 }}>{s.attendanceRate}%</span>
                  </div>
                  <span className="t-label px-2 py-0.5 w-fit" style={{ backgroundColor: gc.bg, color: gc.color, borderRadius: 'var(--radius-sm)' }}>
                    {s.lastGrade ?? '—'}
                  </span>
                  <span className="t-caption" style={{ color: 'var(--success)', cursor: 'pointer' }}>View →</span>
                </div>
              )
            })}
            {filteredStudents.length === 0 && (
              <div className="py-10 text-center">
                <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>No students match your search.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Content tab */}
        <TabsContent value="content">
          <div className="flex items-center justify-end mb-4">
            <Button style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', gap: 6 }}>
              <Upload style={{ width: 14, height: 14 }} /> Upload material
            </Button>
          </div>
          <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            {materials.length === 0 && (
              <div className="py-12 text-center"><p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>No materials uploaded yet.</p></div>
            )}
            {materials.map((m, i) => {
              const tb = typeBadge[m.type] ?? { bg: 'var(--muted)', color: 'var(--muted-foreground)' }
              return (
                <div key={m.id} className="flex items-center gap-4 px-5" style={{ paddingTop: 14, paddingBottom: 14, borderBottom: i < materials.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span className="t-label px-2 py-0.5 flex-shrink-0" style={{ backgroundColor: tb.bg, color: tb.color, borderRadius: 'var(--radius-sm)' }}>{m.type}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{m.title}</p>
                    <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{m.uploadDate} · {m.fileSize} · {m.downloads} downloads</p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1 flex-shrink-0" style={{ fontSize: '0.8125rem', color: 'var(--error)', borderColor: 'var(--error)' }}>
                    <Trash2 style={{ width: 12, height: 12 }} /> Delete
                  </Button>
                </div>
              )
            })}
          </div>
        </TabsContent>

        {/* Analytics tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Class Average', value: avg + '%', sub: 'Attendance rate' },
              { label: 'Students Enrolled', value: String(course.enrolledCount), sub: 'This semester' },
              { label: 'Sessions Held', value: String(ATTENDANCE_SESSIONS.filter(s => s.courseId === course.id).length), sub: 'Recorded sessions' },
            ].map(tile => (
              <div key={tile.label} style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 20 }}>
                <p className="t-label mb-1" style={{ color: 'var(--muted-foreground)' }}>{tile.label.toUpperCase()}</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--foreground)', lineHeight: 1.2, letterSpacing: '-0.015em' }}>{tile.value}</p>
                <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{tile.sub}</p>
              </div>
            ))}
          </div>

          <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24 }}>
            <h3 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Grade Distribution</h3>
            {chartData.some(d => d.count > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="grade" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', backgroundColor: 'var(--card)', fontSize: 12 }} />
                  <Bar dataKey="count" fill="#20F44E" radius={[4, 4, 0, 0]} name="Students" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="t-body-sm text-center py-8" style={{ color: 'var(--muted-foreground)' }}>No published results yet.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ── Student performance Sheet ─────────────────────────────────────────────────

function StudentPerformanceSheet({ student, course, onClose }: { student: CourseStudent; course: LecturerCourse; onClose: () => void }) {
  const sessions = ATTENDANCE_SESSIONS.filter(s => s.courseId === course.id)
  const assessments = ASSESSMENTS.filter(a => a.courseId === course.id)
  const gc = gradeColor(student.avgGrade ?? '—')

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div style={{ padding: '20px 56px 18px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <p className="t-label mb-1" style={{ color: 'var(--muted-foreground)' }}>STUDENT PERFORMANCE</p>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 600, color: 'var(--foreground)', lineHeight: 1.4 }}>{student.name}</h3>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginTop: 2 }}>{student.id}</p>
      </div>

      <div style={{ padding: '20px 24px', flex: 1 }}>
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div style={{ backgroundColor: 'var(--muted)', borderRadius: 'var(--radius-md)', padding: 14 }}>
            <p className="t-label mb-0.5" style={{ color: 'var(--muted-foreground)' }}>ATTENDANCE</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: student.attendanceRate >= 75 ? 'var(--success)' : 'var(--error)' }}>{student.attendanceRate}%</p>
          </div>
          <div style={{ backgroundColor: 'var(--muted)', borderRadius: 'var(--radius-md)', padding: 14 }}>
            <p className="t-label mb-0.5" style={{ color: 'var(--muted-foreground)' }}>AVG GRADE</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: gc.color }}>{student.avgGrade ?? '—'}</p>
          </div>
        </div>

        {/* Assessment marks */}
        <p className="t-label mb-3" style={{ color: 'var(--muted-foreground)' }}>ASSESSMENT RESULTS</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 20 }}>
          {assessments.map((a, i) => {
            const marks = PUBLISHED_MARKS[a.id]?.[student.id]
            const grade = marks !== undefined ? calcGrade(marks, a.maxMarks) : '—'
            const gc2 = gradeColor(grade)
            return (
              <div key={a.id} className="flex items-center gap-4 px-4" style={{ paddingTop: 12, paddingBottom: 12, borderBottom: i < assessments.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{a.name}</p>
                  <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Max: {a.maxMarks} · {a.status}</p>
                </div>
                {marks !== undefined
                  ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--foreground)' }}>{marks} / {a.maxMarks}</span>
                  : <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>Not recorded</span>
                }
                <span className="t-label px-2 py-0.5" style={{ backgroundColor: gc2.bg, color: gc2.color, borderRadius: 'var(--radius-sm)' }}>{grade}</span>
              </div>
            )
          })}
        </div>

        {/* Attendance sessions */}
        <p className="t-label mb-3" style={{ color: 'var(--muted-foreground)' }}>RECENT SESSIONS</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          {sessions.slice(0, 4).map((s, i) => (
            <div key={s.id} className="flex items-center gap-4 px-4" style={{ paddingTop: 12, paddingBottom: 12, borderBottom: i < Math.min(sessions.length, 4) - 1 ? '1px solid var(--border)' : 'none' }}>
              <span className="t-caption flex-shrink-0" style={{ color: 'var(--muted-foreground)', width: 88 }}>{s.date}</span>
              <span className="text-sm flex-1 truncate" style={{ color: 'var(--foreground)' }}>{s.topic}</span>
              <span className="t-label px-2 py-0.5 flex-shrink-0" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-sm)' }}>Present</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 24px 28px', flexShrink: 0 }}>
        <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
      </div>
    </div>
  )
}
