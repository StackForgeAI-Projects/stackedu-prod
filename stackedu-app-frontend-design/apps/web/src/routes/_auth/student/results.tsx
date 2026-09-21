import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  LayoutDashboard, BookOpen, BarChart2, CreditCard, Library, Bell,
  TrendingUp, Download,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { StatTile } from '@/components/StatTile'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/student/results')({
  component: AcademicResultsPage,
})

// ── Nav ───────────────────────────────────────────────────────────────────────

const STUDENT_NAV = [
  { label: 'Dashboard',     to: '/student/dashboard',     icon: LayoutDashboard },
  { label: 'My Courses',    to: '/student/courses',       icon: BookOpen        },
  { label: 'Results',       to: '/student/results',       icon: BarChart2       },
  { label: 'Fees',          to: '/student/fees',          icon: CreditCard      },
  { label: 'E-Library',     to: '/student/library',       icon: Library         },
  { label: 'Notifications', to: '/student/notifications', icon: Bell            },
]

// ── Mock data ─────────────────────────────────────────────────────────────────

const SEMESTERS = [
  {
    id: 'S1-2024',
    label: '1st Semester 2024/2025',
    gpa: 3.6,
    courses: [
      { code: 'CSC 101', name: 'Introduction to Computer Science', type: 'Compulsory' as const, credits: 3, score: 85, grade: 'A',  points: 4.0 },
      { code: 'CSC 102', name: 'Programming Fundamentals',         type: 'Compulsory' as const, credits: 3, score: 77, grade: 'B+', points: 3.5 },
      { code: 'MTH 101', name: 'Calculus I',                       type: 'Compulsory' as const, credits: 3, score: 80, grade: 'B+', points: 3.5 },
      { code: 'ENG 101', name: 'English Communication Skills',     type: 'Compulsory' as const, credits: 3, score: 88, grade: 'A',  points: 4.0 },
      { code: 'PHY 101', name: 'Physics I',                        type: 'Elective'   as const, credits: 3, score: 71, grade: 'B',  points: 3.0 },
    ],
  },
  {
    id: 'S2-2023',
    label: '2nd Semester 2023/2024',
    gpa: 3.3,
    courses: [
      { code: 'CSC 104', name: 'Data Structures',                  type: 'Compulsory' as const, credits: 3, score: 79, grade: 'B+', points: 3.5 },
      { code: 'MTH 102', name: 'Calculus II',                      type: 'Compulsory' as const, credits: 3, score: 74, grade: 'B',  points: 3.0 },
      { code: 'CSC 106', name: 'Discrete Mathematics',             type: 'Compulsory' as const, credits: 3, score: 82, grade: 'A',  points: 4.0 },
      { code: 'ENG 102', name: 'Technical Writing',                type: 'Elective'   as const, credits: 2, score: 76, grade: 'B+', points: 3.5 },
    ],
  },
  {
    id: 'S1-2023',
    label: '1st Semester 2023/2024',
    gpa: 3.1,
    courses: [
      { code: 'CSC 101', name: 'Introduction to Computer Science', type: 'Compulsory' as const, credits: 3, score: 78, grade: 'B+', points: 3.5 },
      { code: 'MTH 101', name: 'Calculus I',                       type: 'Compulsory' as const, credits: 3, score: 72, grade: 'B',  points: 3.0 },
      { code: 'ENG 101', name: 'English Communication Skills',     type: 'Compulsory' as const, credits: 3, score: 80, grade: 'B+', points: 3.5 },
      { code: 'PHY 101', name: 'Physics I',                        type: 'Elective'   as const, credits: 3, score: 65, grade: 'B',  points: 3.0 },
    ],
  },
  {
    id: 'S2-2022',
    label: '2nd Semester 2022/2023',
    gpa: 2.9,
    courses: [
      { code: 'CSC 104', name: 'Data Structures',                  type: 'Compulsory' as const, credits: 3, score: 70, grade: 'B',  points: 3.0 },
      { code: 'MTH 102', name: 'Calculus II',                      type: 'Compulsory' as const, credits: 3, score: 65, grade: 'B',  points: 3.0 },
      { code: 'ENG 102', name: 'Technical Writing',                type: 'Elective'   as const, credits: 2, score: 68, grade: 'B',  points: 3.0 },
    ],
  },
  {
    id: 'S1-2022',
    label: '1st Semester 2022/2023',
    gpa: 2.7,
    courses: [
      { code: 'CSC 101', name: 'Introduction to Computer Science', type: 'Compulsory' as const, credits: 3, score: 68, grade: 'B',  points: 3.0 },
      { code: 'MTH 101', name: 'Calculus I',                       type: 'Compulsory' as const, credits: 3, score: 62, grade: 'C+', points: 2.5 },
      { code: 'ENG 101', name: 'English Communication Skills',     type: 'Compulsory' as const, credits: 3, score: 70, grade: 'B',  points: 3.0 },
    ],
  },
]

const CGPA = 3.4

// ── Grade badge ───────────────────────────────────────────────────────────────

function GradeBadge({ grade }: { grade: string }) {
  const g = grade.charAt(0)
  const bg    = g === 'A' ? 'var(--success-bg)' : g === 'B' ? 'var(--info-bg)' : g === 'C' ? 'var(--warning-bg)' : 'var(--error-bg)'
  const color = g === 'A' ? 'var(--success)'    : g === 'B' ? 'var(--info)'    : g === 'C' ? 'var(--warning)'    : 'var(--error)'
  return (
    <span
      className="t-label px-2 py-0.5 inline-flex items-center"
      style={{ backgroundColor: bg, color, borderRadius: 'var(--radius-sm)' }}
    >
      {grade}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function AcademicResultsPage() {
  const [semesterId, setSemesterId] = useState('S1-2024')

  const semester = SEMESTERS.find((s) => s.id === semesterId) ?? SEMESTERS[0]
  const totalCredits  = semester.courses.reduce((s, c) => s + c.credits, 0)
  const weightedPoints = semester.courses.reduce((s, c) => s + c.points * c.credits, 0)

  return (
    <AppShell
      navItems={STUDENT_NAV}
      pageTitle="Academic Results"
      userName="Jean-Paul Mugisha"
      userRole="Student"
      userInitials="JM"
      unreadCount={3}
      infoCardLabel="STUDENT ID"
      infoCardValue="SFE-2024-0042"
      infoCardSubtext="Year 1"
    >
      <div className="px-8 py-8 max-w-[1100px] mx-auto animate-fade-up">

        {/* Section header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1
              className="t-h1 mb-1"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}
            >
              Academic Results
            </h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
              Academic Year 2024/2025
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Semester selector */}
            <Select value={semesterId} onValueChange={setSemesterId}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEMESTERS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Download transcript */}
            <Link to="/student/transcript">
              <Button variant="outline" className="gap-2">
                <Download style={{ width: 15, height: 15 }} />
                Download Transcript
              </Button>
            </Link>
          </div>
        </div>

        {/* GPA stat tiles */}
        <div className="grid grid-cols-2 gap-5 mb-8" style={{ maxWidth: 560 }}>
          <StatTile
            icon={TrendingUp}
            iconColor="var(--brand)"
            iconBg="rgba(32,244,78,0.08)"
            label="SEMESTER GPA"
            value={semester.gpa.toFixed(1)}
            valueUnit="/ 4.0"
            delta="+0.2 from last semester"
            deltaColor="var(--success)"
            animationDelay={0}
          />
          <StatTile
            icon={TrendingUp}
            iconColor="var(--info)"
            iconBg="var(--info-bg)"
            label="CUMULATIVE GPA (CGPA)"
            value={CGPA.toFixed(1)}
            valueUnit="/ 4.0"
            delta="Year 1 · 1 semester"
            deltaColor="var(--muted-foreground)"
            animationDelay={60}
          />
        </div>

        {/* Results table */}
        <div
          style={{
            backgroundColor: 'var(--card)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border)',
            overflow: 'hidden',
          }}
        >
          {/* Table header */}
          <div
            className="grid px-6 py-3"
            style={{
              gridTemplateColumns: '100px 1fr 110px 70px 70px 80px 80px',
              borderBottom: '1px solid var(--border)',
              backgroundColor: 'var(--muted)',
            }}
          >
            {['COURSE CODE', 'COURSE NAME', 'TYPE', 'CREDITS', 'SCORE', 'GRADE', 'POINTS'].map((col) => (
              <span key={col} className="t-label" style={{ color: 'var(--muted-foreground)' }}>{col}</span>
            ))}
          </div>

          {/* Rows */}
          {semester.courses.map((course, i) => {
            const isLast = i === semester.courses.length - 1
            return (
              <ResultRow key={course.code} course={course} isLast={isLast} />
            )
          })}

          {/* Footer / totals */}
          <div
            className="grid px-6 py-4"
            style={{
              gridTemplateColumns: '100px 1fr 110px 70px 70px 80px 80px',
              borderTop: '2px solid var(--border)',
              backgroundColor: 'var(--muted)',
            }}
          >
            <span />
            <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Semester Totals</span>
            <span />
            <span className="text-sm font-semibold" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-mono)' }}>
              {totalCredits}
            </span>
            <span />
            <span />
            <span className="text-sm font-semibold" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-mono)' }}>
              {weightedPoints.toFixed(1)}
            </span>
          </div>

          {/* GPA calculation row */}
          <div
            className="flex items-center justify-end gap-6 px-6 py-3"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
              GPA = {weightedPoints.toFixed(1)} ÷ {totalCredits} credits
            </span>
            <span className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
              Semester GPA: {semester.gpa.toFixed(2)}
            </span>
            <span
              className="t-label px-3 py-1"
              style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-sm)' }}
            >
              Good Standing
            </span>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Result row
// ─────────────────────────────────────────────────────────────────────────────

function ResultRow({ course, isLast }: { course: { code: string; name: string; type: 'Compulsory' | 'Elective'; credits: number; score: number; grade: string; points: number }; isLast: boolean }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="grid items-center px-6"
      style={{
        gridTemplateColumns: '100px 1fr 110px 70px 70px 80px 80px',
        paddingTop: 14,
        paddingBottom: 14,
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        backgroundColor: hovered ? 'var(--muted)' : 'transparent',
        transition: 'background-color 150ms ease-out',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="t-mono text-sm" style={{ color: 'var(--muted-foreground)' }}>{course.code}</span>
      <span className="text-sm" style={{ color: 'var(--foreground)' }}>{course.name}</span>
      <span>
        <span
          className="t-label px-2 py-0.5 inline-flex items-center"
          style={{
            backgroundColor: course.type === 'Compulsory' ? 'var(--info-bg)' : 'var(--muted)',
            color: course.type === 'Compulsory' ? 'var(--info)' : 'var(--muted-foreground)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          {course.type}
        </span>
      </span>
      <span className="text-sm" style={{ color: 'var(--foreground)' }}>{course.credits}</span>
      <span className="text-sm" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-mono)' }}>{course.score}%</span>
      <GradeBadge grade={course.grade} />
      <span className="text-sm" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-mono)' }}>{course.points.toFixed(1)}</span>
    </div>
  )
}


