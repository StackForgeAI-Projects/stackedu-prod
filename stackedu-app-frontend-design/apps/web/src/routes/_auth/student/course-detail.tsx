import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, BookOpen, BarChart2, CreditCard, Library, Bell,
  User, Star, Calendar, MapPin, FileText, Download, CheckCircle2,
  Clock, AlertCircle, ChevronDown, ChevronUp, ArrowLeft, ChevronRight,
} from 'lucide-react'
import { AppShell }  from '@/components/AppShell'
import { Button }    from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ALL_COURSES, type Course } from '@/data/courses'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

// ── Submission types & mock data ──────────────────────────────────────────────

interface SubmissionDetail {
  submittedAt: string
  fileName:    string
  fileSize:    string
  notes?:      string
  grade?: {
    score:        string
    feedback:     string
    feedbackDate: string
  }
}

// Key: `${courseId}-${assignmentId}`
const SUBMISSION_DETAIL: Record<string, SubmissionDetail> = {
  // CSC 101
  'csc-101-1': {
    submittedAt: '10 Sep 2024', fileName: 'Assignment1_JeanPaul.pdf', fileSize: '1.2 MB',
    grade: { score: '18 / 20', feedback: 'Excellent work on binary conversion. The hexadecimal section needs minor corrections but overall very well done.', feedbackDate: '14 Sep 2024' },
  },
  'csc-101-2': {
    submittedAt: '25 Sep 2024', fileName: 'Lab_Report_2_Mugisha.pdf', fileSize: '2.4 MB',
  },
  // CSC 102
  'csc-102-1': {
    submittedAt: '24 Sep 2024', fileName: 'Assignment1_HelloWorld_Mugisha.pdf', fileSize: '0.8 MB',
    grade: { score: '20 / 20', feedback: 'Perfect submission. All tasks completed correctly with clean, well-commented code. Excellent work.', feedbackDate: '28 Sep 2024' },
  },
  'csc-102-2': {
    submittedAt: '14 Oct 2024', fileName: 'Assignment2_Loops_Mugisha.pdf', fileSize: '1.1 MB',
    grade: { score: '16 / 20', feedback: 'Good understanding of loops and conditions. The nested loop section had minor logical errors. Review the worked solutions shared in class.', feedbackDate: '18 Oct 2024' },
  },
  // MTH 101
  'mth-101-1': {
    submittedAt: '21 Sep 2024', fileName: 'ProblemSet1_Limits_Mugisha.pdf', fileSize: '1.5 MB',
    grade: { score: '14 / 20', feedback: 'Good effort on algebraic limit evaluation. Questions 5 and 6 on one-sided limits need more practice. Please review the class notes on continuity.', feedbackDate: '26 Sep 2024' },
  },
  'mth-101-2': {
    submittedAt: '12 Oct 2024', fileName: 'ProblemSet2_Differentiation_Mugisha.pdf', fileSize: '1.8 MB',
  },
  // ENG 101
  'eng-101-1': {
    submittedAt: '17 Sep 2024', fileName: 'Essay1_Descriptive_Mugisha.docx', fileSize: '0.6 MB',
    grade: { score: '17 / 20', feedback: 'Well-structured descriptive essay with strong use of sensory language. The conclusion could be more developed to reinforce the central theme.', feedbackDate: '22 Sep 2024' },
  },
  'eng-101-2': {
    submittedAt: '08 Oct 2024', fileName: 'Presentation_Research_Mugisha.pdf', fileSize: '3.2 MB',
    grade: { score: '19 / 20', feedback: 'Outstanding presentation with excellent delivery and well-researched content. Minor improvement needed on slide transitions. Highly commended.', feedbackDate: '12 Oct 2024' },
  },
  // CSC 103
  'csc-103-1': {
    submittedAt: '24 Sep 2024', fileName: 'LabReport1_LogicGates_Mugisha.pdf', fileSize: '2.1 MB',
    grade: { score: '16 / 20', feedback: 'Good lab report structure and accurate measurements. The truth table for the NAND gate had a minor error. Overall a competent submission.', feedbackDate: '28 Sep 2024' },
  },
  'csc-103-2': {
    submittedAt: '15 Oct 2024', fileName: 'LabReport2_Combinational_Mugisha.pdf', fileSize: '2.8 MB',
  },
  // PHY 101
  'phy-101-1': {
    submittedAt: '27 Sep 2024', fileName: 'LabReport1_FreeFall_Mugisha.pdf', fileSize: '1.9 MB',
    grade: { score: '12 / 20', feedback: 'The experiment setup was correct but the analysis section lacked depth. Several calculations contained arithmetic errors. Please recheck the velocity equations used.', feedbackDate: '03 Oct 2024' },
  },
  // CSC 104
  'csc-104-1': {
    submittedAt: '30 Sep 2024', fileName: 'Assignment1_Architecture_Mugisha.pdf', fileSize: '1.4 MB',
    grade: { score: '15 / 20', feedback: 'Good comparison of Von Neumann and Harvard architectures. The section on data path could be more detailed. The diagrams were clear and well-labelled.', feedbackDate: '05 Oct 2024' },
  },
  'csc-104-2': {
    submittedAt: '21 Oct 2024', fileName: 'Assignment2_Assembly_Mugisha.asm', fileSize: '0.3 MB',
  },
  // MTH 102
  'mth-102-1': {
    submittedAt: '20 Sep 2024', fileName: 'Assignment1_Descriptive_Mugisha.pdf', fileSize: '1.6 MB',
    grade: { score: '20 / 20', feedback: 'Exceptional work. All measures calculated accurately with clear written interpretations. A model submission.', feedbackDate: '25 Sep 2024' },
  },
  'mth-102-2': {
    submittedAt: '11 Oct 2024', fileName: 'Assignment2_Probability_Mugisha.pdf', fileSize: '1.3 MB',
    grade: { score: '18 / 20', feedback: 'Very good understanding of probability concepts. The conditional probability question in part C had a minor calculation error but the method was correct.', feedbackDate: '16 Oct 2024' },
  },
  'mth-102-3': {
    submittedAt: '01 Nov 2024', fileName: 'Assignment3_HypothesisTesting_Mugisha.pdf', fileSize: '2.0 MB',
  },
}

// ── Responsive hook ───────────────────────────────────────────────────────────

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)')
    setIsMobile(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])
  return isMobile
}

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/student/course-detail')({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === 'string' ? search.id : '',
  }),
  component: CourseDetailPage,
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

// ─────────────────────────────────────────────────────────────────────────────
// Page — full course detail view (all screen sizes)
// Reached by clicking any course row on /student/courses.
// The ?id= search param selects the course; falls back to the first course
// if the id is missing or unrecognised.
// ─────────────────────────────────────────────────────────────────────────────

function CourseDetailPage() {
  const { id }   = Route.useSearch()
  const course   = ALL_COURSES.find(c => c.id === id) ?? ALL_COURSES[0]

  return (
    <AppShell
      navItems={STUDENT_NAV}
      pageTitle={course.code}
      userName="Jean-Paul Mugisha"
      userRole="Student"
      userInitials="JM"
      unreadCount={3}
      infoCardLabel="STUDENT ID"
      infoCardValue="SFE-2024-0042"
      infoCardSubtext="Year 1"
    >
      <div className="px-8 py-8 max-w-[1000px] mx-auto animate-fade-up">

        {/* Back navigation */}
        <Link
          to="/student/courses"
          className="inline-flex items-center gap-1.5 mb-6 transition-opacity hover:opacity-70"
          style={{ color: 'var(--muted-foreground)', textDecoration: 'none', fontSize: '0.875rem' }}
        >
          <ArrowLeft style={{ width: 15, height: 15 }} />
          Back to My Courses
        </Link>

        {/* ── Course header ──────────────────────────────────────────────── */}
        <CourseHeader course={course} />

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <CourseContentTabs course={course} />

      </div>
    </AppShell>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Course header
// ─────────────────────────────────────────────────────────────────────────────

function CourseHeader({ course }: { course: Course }) {
  return (
    <div
      className="mb-6 p-6"
      style={{
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Badges */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className="t-label px-2.5 py-1"
          style={{
            backgroundColor: course.color + '18',
            color: course.color,
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.02em',
          }}
        >
          {course.code}
        </span>
        <span
          className="t-label px-2 py-0.5"
          style={{
            backgroundColor: course.type === 'Compulsory' ? 'var(--info-bg)' : 'var(--muted)',
            color: course.type === 'Compulsory' ? 'var(--info)' : 'var(--muted-foreground)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          {course.type}
        </span>
      </div>

      {/* Name */}
      <h1
        className="t-h1 mb-4"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}
      >
        {course.name}
      </h1>

      {/* Meta */}
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center gap-2">
          <User style={{ width: 14, height: 14, color: 'var(--muted-foreground)', flexShrink: 0 }} />
          <span className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>{course.lecturer}</span>
        </div>
        {course.schedule.map((slot, i) => (
          <div key={i} className="flex items-center gap-2">
            <Calendar style={{ width: 14, height: 14, color: 'var(--muted-foreground)', flexShrink: 0 }} />
            <span className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>
              {slot.day}, {slot.time}
            </span>
            <span style={{ color: 'var(--border)', fontSize: 10 }}>·</span>
            <MapPin style={{ width: 13, height: 13, color: 'var(--muted-foreground)', flexShrink: 0 }} />
            <span className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>{slot.room}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <Star style={{ width: 14, height: 14, color: 'var(--muted-foreground)', flexShrink: 0 }} />
          <span className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>
            {course.credits} Credit Units
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="t-body" style={{ color: 'var(--muted-foreground)', lineHeight: 1.65 }}>
        {course.description}
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────────────────────────────────────

function CourseContentTabs({ course }: { course: Course }) {
  return (
    <Tabs defaultValue="modules">
      <TabsList className="mb-5">
        <TabsTrigger value="modules">Course Modules</TabsTrigger>
        <TabsTrigger value="assignments">Assignments</TabsTrigger>
        <TabsTrigger value="attendance">Attendance</TabsTrigger>
      </TabsList>

      <TabsContent value="modules">
        <ModulesTab course={course} />
      </TabsContent>
      <TabsContent value="assignments">
        <AssignmentsTab course={course} />
      </TabsContent>
      <TabsContent value="attendance">
        <AttendanceTab course={course} />
      </TabsContent>
    </Tabs>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Modules tab
// ─────────────────────────────────────────────────────────────────────────────

function ModulesTab({ course }: { course: Course }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
      }}
    >
      {course.modules.map((mod, i) => (
        <ModuleAccordionRow
          key={mod.number}
          module={mod}
          courseColor={course.color}
          isLast={i === course.modules.length - 1}
        />
      ))}
    </div>
  )
}

function ModuleAccordionRow({
  module,
  courseColor,
  isLast,
}: {
  module: Course['modules'][number]
  courseColor: string
  isLast: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 text-left transition-colors duration-150 outline-none"
        style={{
          padding: '14px 20px',
          backgroundColor: expanded ? 'var(--muted)' : 'transparent',
          cursor: 'pointer',
          border: 'none',
        }}
      >
        <div
          className="flex items-center justify-center rounded-md flex-shrink-0"
          style={{ width: 28, height: 28, backgroundColor: courseColor + '15' }}
        >
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: courseColor }}>
            {module.number}
          </span>
        </div>
        <span className="flex-1 text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          Module {module.number} — {module.title}
        </span>
        {expanded
          ? <ChevronUp style={{ width: 15, height: 15, color: 'var(--muted-foreground)', flexShrink: 0 }} />
          : <ChevronDown style={{ width: 15, height: 15, color: 'var(--muted-foreground)', flexShrink: 0 }} />
        }
      </button>

      {expanded && (
        <div style={{ padding: '0 20px 20px 68px', backgroundColor: 'var(--muted)' }}>
          <p className="t-body-sm mb-4" style={{ color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
            {module.description}
          </p>
          {module.materials.length === 0 ? (
            <p className="t-caption" style={{ color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
              No materials uploaded yet
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {module.materials.map((mat, i) => (
                <MaterialItem key={i} material={mat} courseColor={courseColor} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MaterialItem({
  material,
  courseColor,
}: {
  material: Course['modules'][number]['materials'][number]
  courseColor: string
}) {
  const typeBadge: Record<string, { bg: string; color: string }> = {
    PDF:  { bg: 'var(--error-bg)',   color: 'var(--error)'   },
    PPTX: { bg: 'var(--warning-bg)', color: 'var(--warning)' },
    DOCX: { bg: 'var(--info-bg)',    color: 'var(--info)'    },
  }
  const tb = typeBadge[material.type] ?? { bg: 'var(--muted)', color: 'var(--muted-foreground)' }

  return (
    <div
      className="flex items-center gap-3"
      style={{
        padding: '10px 12px',
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
      }}
    >
      <div
        className="flex items-center justify-center rounded-md flex-shrink-0"
        style={{ width: 30, height: 30, backgroundColor: courseColor + '15' }}
      >
        <FileText style={{ width: 14, height: 14, color: courseColor }} />
      </div>
      <span className="flex-1 text-sm truncate" style={{ color: 'var(--foreground)' }}>
        {material.name}
      </span>
      <span
        className="t-label px-1.5 py-0.5 flex-shrink-0"
        style={{ backgroundColor: tb.bg, color: tb.color, borderRadius: 'var(--radius-sm)' }}
      >
        {material.type}
      </span>
      <Link to="/student/library" className="flex-shrink-0">
        <button
          className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors duration-150"
          style={{
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
            backgroundColor: 'var(--card)',
            cursor: 'pointer',
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--card)' }}
        >
          <Download style={{ width: 12, height: 12 }} />
          Download
        </button>
      </Link>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Assignments tab
// ─────────────────────────────────────────────────────────────────────────────

function AssignmentsTab({ course }: { course: Course }) {
  const [activeAssignment, setActiveAssignment] = useState<Course['assignments'][number] | null>(null)
  const isMobile = useIsMobile()

  const openAssignment  = (a: Course['assignments'][number]) => setActiveAssignment(a)
  const closeAssignment = () => setActiveAssignment(null)

  const submission = activeAssignment
    ? (SUBMISSION_DETAIL[`${course.id}-${activeAssignment.id}`] ?? null)
    : null

  if (course.assignments.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 text-center"
        style={{
          backgroundColor: 'var(--card)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border)',
        }}
      >
        <div
          className="flex items-center justify-center rounded-2xl mb-4"
          style={{ width: 52, height: 52, backgroundColor: 'var(--muted)' }}
        >
          <Clock style={{ width: 24, height: 24, color: 'var(--muted-foreground)' }} />
        </div>
        <h3 className="t-h3 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
          No assignments yet
        </h3>
        <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>
          No assignments have been posted for this course.
        </p>
      </div>
    )
  }

  return (
    <>
      <div
        style={{
          backgroundColor: 'var(--card)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        {course.assignments.map((a, i) => (
          <AssignmentItem
            key={a.id}
            assignment={a}
            isLast={i === course.assignments.length - 1}
            onOpen={a.status !== 'Pending' ? () => openAssignment(a) : undefined}
          />
        ))}
      </div>

      {/* Sheet — desktop */}
      <Sheet
        open={!isMobile && activeAssignment !== null}
        onOpenChange={(open) => { if (!open) closeAssignment() }}
      >
        <SheetContent
          side="right"
          className="p-0 border-l overflow-hidden flex flex-col"
          style={{ width: 'min(860px, 55vw)' }}
        >
          {activeAssignment && submission && (
            <SubmissionDetailContent
              assignment={activeAssignment}
              submission={submission}
              courseCode={course.code}
              onClose={closeAssignment}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Dialog — mobile */}
      <Dialog
        open={isMobile && activeAssignment !== null}
        onOpenChange={(open) => { if (!open) closeAssignment() }}
      >
        <DialogContent
          className="p-0 overflow-hidden"
          style={{ maxWidth: '90vw', width: '90vw' }}
        >
          <DialogTitle className="sr-only">
            {activeAssignment?.title ?? 'Submission Detail'}
          </DialogTitle>
          {activeAssignment && submission && (
            <SubmissionDetailContent
              assignment={activeAssignment}
              submission={submission}
              courseCode={course.code}
              onClose={closeAssignment}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function AssignmentItem({
  assignment,
  isLast,
  onOpen,
}: {
  assignment: Course['assignments'][number]
  isLast: boolean
  onOpen?: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const isOpenable = assignment.status === 'Submitted' || assignment.status === 'Graded'

  const statusMap = {
    Graded:    { bg: 'var(--success-bg)', color: 'var(--success)', icon: <CheckCircle2 style={{ width: 12, height: 12 }} /> },
    Submitted: { bg: 'var(--info-bg)',    color: 'var(--info)',    icon: <CheckCircle2 style={{ width: 12, height: 12 }} /> },
    Pending:   { bg: 'var(--warning-bg)', color: 'var(--warning)', icon: <Clock style={{ width: 12, height: 12 }} /> },
  }
  const sc = statusMap[assignment.status]

  return (
    <div
      className="flex items-center gap-4 px-6 transition-colors duration-150"
      style={{
        paddingTop: 15,
        paddingBottom: 15,
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        backgroundColor: hovered && isOpenable ? 'var(--muted)' : 'transparent',
        cursor: isOpenable ? 'pointer' : 'default',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onOpen}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--foreground)' }}>
          {assignment.title}
        </p>
        <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>Due {assignment.due}</p>
      </div>

      {assignment.marks && (
        <span
          className="text-sm font-semibold flex-shrink-0"
          style={{ color: 'var(--foreground)', fontFamily: 'var(--font-mono)' }}
        >
          {assignment.marks}
        </span>
      )}

      <span
        className="t-label flex items-center gap-1 px-2 py-0.5 flex-shrink-0"
        style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)' }}
      >
        {sc.icon}
        {assignment.status}
      </span>

      {assignment.status === 'Pending' && (
        <Link to="/student/assignment-submit" className="flex-shrink-0">
          <Button size="sm" style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}>
            Submit
          </Button>
        </Link>
      )}

      {isOpenable && (
        <ChevronRight
          style={{ width: 14, height: 14, color: 'var(--muted-foreground)', flexShrink: 0 }}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Attendance tab
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Assignment question lookup — matched by keywords in the assignment title
// ─────────────────────────────────────────────────────────────────────────────

const ASSIGNMENT_QUESTIONS: Record<string, string> = {
  'number conversion':
    'Convert the following decimal numbers to binary, octal, and hexadecimal: (a) 156 (b) 2047 (c) 8192. Show all working steps clearly.',
  'data types':
    'Write a lab report documenting your experiments with different data types in Python. Include: (1) Variable declaration examples, (2) Type conversion demonstrations, (3) Common errors encountered and how you resolved them. Minimum 500 words.',
  'limits':
    "Evaluate the following limits using algebraic techniques and L'Hopital's rule where applicable. Show all working: (1) lim(x→2) (x²−4)/(x−2) (2) lim(x→0) sin(x)/x (3) lim(x→∞) (3x²+2x)/(x²−1)",
  'differentiation':
    'Find the derivatives of the following functions using appropriate differentiation rules. Clearly state which rule you are applying at each step.',
}

function getAssignmentQuestion(title: string): string | null {
  const lower = title.toLowerCase()
  for (const [key, question] of Object.entries(ASSIGNMENT_QUESTIONS)) {
    if (lower.includes(key)) return question
  }
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// Submission detail — shared by Sheet (desktop) and Dialog (mobile)
// ─────────────────────────────────────────────────────────────────────────────

function SubmissionDetailContent({
  assignment,
  submission,
  courseCode,
  onClose,
}: {
  assignment: Course['assignments'][number]
  submission: SubmissionDetail
  courseCode: string
  onClose: () => void
}) {
  const statusMap = {
    Graded:    { bg: 'var(--success-bg)', color: 'var(--success)'          },
    Submitted: { bg: 'var(--info-bg)',    color: 'var(--info)'             },
    Pending:   { bg: 'var(--warning-bg)', color: 'var(--warning)'          },
  }
  const sc = statusMap[assignment.status]
  const assignmentQuestion = getAssignmentQuestion(assignment.title)

  return (
    <div className="flex flex-col h-full overflow-y-auto">

      {/* Header — shadcn provides default X close button top-right */}
      <div style={{ padding: '20px 56px 18px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.0625rem',
            fontWeight: 600,
            color: 'var(--foreground)',
            lineHeight: 1.4,
          }}
        >
          {assignment.title}
        </h3>
      </div>

      {/* Metadata rows */}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          flexShrink: 0,
        }}
      >
        <SubmissionDataRow label="Course" value={courseCode} />
        <SubmissionDataRow label="Due date" value={assignment.due} />
        <SubmissionDataRow label="Submitted" value={submission.submittedAt} />
        <div className="flex items-start gap-3">
          <span
            className="t-caption flex-shrink-0"
            style={{ color: 'var(--muted-foreground)', minWidth: 80, paddingTop: 3 }}
          >
            Status
          </span>
          <span
            className="t-label flex items-center gap-1 px-2 py-0.5"
            style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)' }}
          >
            {assignment.status}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '20px 24px', flex: 1 }}>

        {/* ASSIGNMENT QUESTION */}
        {assignmentQuestion && (
          <div className="mb-5">
            <p className="t-label mb-2" style={{ color: 'var(--muted-foreground)' }}>ASSIGNMENT QUESTION</p>
            <div
              style={{
                padding: 16,
                backgroundColor: 'var(--muted)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <p style={{ fontSize: '0.875rem', color: 'var(--foreground)', lineHeight: 1.65 }}>
                {assignmentQuestion}
              </p>
            </div>
          </div>
        )}

        {/* YOUR SUBMISSION */}
        <p className="t-label mb-3" style={{ color: 'var(--muted-foreground)' }}>YOUR SUBMISSION</p>
        <div
          style={{
            padding: 16,
            backgroundColor: 'var(--muted)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            marginBottom: submission.notes ? 0 : 20,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Row 1: file icon + filename (truncated) + file size */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileText style={{ width: 24, height: 24, color: 'var(--muted-foreground)', flexShrink: 0 }} />
              <span style={{
                flex: 1, minWidth: 0,
                fontSize: 14, fontWeight: 500, lineHeight: 1.4,
                color: 'var(--foreground)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {submission.fileName}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', flexShrink: 0 }}>
                {submission.fileSize}
              </span>
            </div>
            {/* Row 2: submitted date */}
            <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', lineHeight: 1.4 }}>
              Submitted {submission.submittedAt}
            </p>
            {/* Row 3: Preview + Download — full width, equal flex */}
            <div style={{ display: 'flex', gap: 12 }}>
              <Button variant="outline" size="sm" style={{ flex: 1, fontSize: '0.8125rem' }}>
                Preview
              </Button>
              <Button variant="outline" size="sm" className="gap-1" style={{ flex: 1, fontSize: '0.8125rem' }}>
                <Download style={{ width: 12, height: 12 }} />
                Download
              </Button>
            </div>
          </div>
        </div>

        {submission.notes && (
          <div style={{ marginBottom: 20 }}>
            <p className="t-label mt-4 mb-2" style={{ color: 'var(--muted-foreground)' }}>NOTES TO LECTURER</p>
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: 'var(--muted)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <p className="t-body-sm" style={{ color: 'var(--foreground)', lineHeight: 1.6 }}>
                {submission.notes}
              </p>
            </div>
          </div>
        )}

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: 'var(--border)', marginBottom: 20 }} />

        {/* FEEDBACK & GRADE or under-review alert */}
        {submission.grade ? (
          <div>
            <p className="t-label mb-4" style={{ color: 'var(--muted-foreground)' }}>FEEDBACK & GRADE</p>
            <div className="flex items-center gap-3 mb-4">
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: 'var(--foreground)',
                  lineHeight: 1.2,
                }}
              >
                {submission.grade.score}
              </span>
              <span
                className="t-label px-2.5 py-1"
                style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-sm)' }}
              >
                Graded
              </span>
            </div>
            <p style={{ fontSize: '0.9375rem', color: 'var(--foreground)', lineHeight: 1.7, marginBottom: 8 }}>
              {submission.grade.feedback}
            </p>
            <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
              Graded on {submission.grade.feedbackDate}
            </p>
          </div>
        ) : (
          <div
            className="flex items-start gap-3"
            style={{
              padding: '14px 16px',
              backgroundColor: 'var(--warning-bg)',
              border: '1px solid var(--warning)',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <AlertCircle style={{ width: 16, height: 16, color: 'var(--warning)', flexShrink: 0, marginTop: 1 }} />
            <p className="text-sm" style={{ color: 'var(--warning)', lineHeight: 1.55 }}>
              Your submission is under review. Feedback will be available once graded.
            </p>
          </div>
        )}
      </div>

      {/* Close button */}
      <div style={{ padding: '0 24px 28px', flexShrink: 0 }}>
        <Button variant="outline" className="w-full" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )
}

function SubmissionDataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="t-caption flex-shrink-0"
        style={{ color: 'var(--muted-foreground)', minWidth: 80, paddingTop: 1 }}
      >
        {label}
      </span>
      <span style={{ fontSize: '0.875rem', color: 'var(--foreground)', lineHeight: 1.5 }}>
        {value}
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Attendance tab
// ─────────────────────────────────────────────────────────────────────────────

function AttendanceTab({ course }: { course: Course }) {
  const { attended, total } = course.attendance
  const pct      = Math.round((attended / total) * 100)
  const attColor = pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : 'var(--error)'
  const attBg    = pct >= 80 ? 'var(--success-bg)' : pct >= 60 ? 'var(--warning-bg)' : 'var(--error-bg)'

  const statusConfig = {
    Present: { bg: 'var(--success-bg)', color: 'var(--success)' },
    Absent:  { bg: 'var(--error-bg)',   color: 'var(--error)'   },
    Late:    { bg: 'var(--warning-bg)', color: 'var(--warning)' },
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Summary */}
      <div
        style={{
          backgroundColor: 'var(--card)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border)',
          padding: 24,
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="t-label mb-0.5" style={{ color: 'var(--muted-foreground)' }}>ATTENDANCE SUMMARY</p>
            <p className="text-sm" style={{ color: 'var(--foreground)' }}>
              <span className="font-semibold">{attended}</span> attended of{' '}
              <span className="font-semibold">{total}</span> sessions
            </p>
          </div>
          <span
            className="t-label px-3 py-1.5"
            style={{ backgroundColor: attBg, color: attColor, borderRadius: 'var(--radius-sm)' }}
          >
            {pct}%
          </span>
        </div>
        <div className="rounded-full overflow-hidden" style={{ height: 8, backgroundColor: 'var(--muted)' }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, backgroundColor: attColor, transition: 'width 600ms ease-out' }}
          />
        </div>
        {pct < 75 && (
          <div
            className="mt-3 px-4 py-3 rounded-lg flex items-start gap-2 text-sm"
            style={{ backgroundColor: 'var(--warning-bg)', border: '1px solid var(--warning)', color: 'var(--warning)' }}
          >
            <AlertCircle style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1 }} />
            Your attendance is below the 75% minimum requirement. Please attend upcoming sessions.
          </div>
        )}
      </div>

      {/* Session list */}
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
            gridTemplateColumns: '120px 1fr 100px',
            borderBottom: '1px solid var(--border)',
            backgroundColor: 'var(--muted)',
          }}
        >
          <span className="t-label" style={{ color: 'var(--muted-foreground)' }}>DATE</span>
          <span className="t-label" style={{ color: 'var(--muted-foreground)' }}>TOPIC</span>
          <span className="t-label text-right" style={{ color: 'var(--muted-foreground)' }}>STATUS</span>
        </div>

        {course.sessions.map((session, i) => {
          const sc = statusConfig[session.status]
          return (
            <div
              key={session.id}
              className="grid items-center px-6"
              style={{
                gridTemplateColumns: '120px 1fr 100px',
                paddingTop: 13,
                paddingBottom: 13,
                borderBottom: i < course.sessions.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{session.date}</span>
              <span className="text-sm" style={{ color: 'var(--foreground)' }}>{session.topic}</span>
              <div className="flex justify-end">
                <span
                  className="t-label px-2 py-0.5"
                  style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)' }}
                >
                  {session.status}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
