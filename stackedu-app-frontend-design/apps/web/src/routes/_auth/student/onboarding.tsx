import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useRef } from 'react'
import {
  LayoutDashboard, BookOpen, BarChart2, CreditCard, Library, Bell,
  CheckCircle2, Upload, FileDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/student/onboarding')({
  component: StudentOnboardingPage,
})

// ── Dev constant ──────────────────────────────────────────────────────────────

const DEV_INSTITUTION_NAME = 'StackForgeAI University'

// ── Student mock data ─────────────────────────────────────────────────────────

const STUDENT = {
  firstName:      'Jean-Paul',
  fullName:       'Jean-Paul Mugisha',
  id:             'SFE-2024-0042',
  dob:            '15 March 2003',
  gender:         'Male',
  phone:          '+250 788 123 456',
  nationality:    'Rwandan',
  programme:      'Computer Science',
  year:           1,
  faculty:        'Faculty of Science & Technology',
  enrollmentDate: '02 September 2024',
  initials:       'JM',
}

// ── Nav ───────────────────────────────────────────────────────────────────────

const STUDENT_NAV = [
  { label: 'Dashboard',     to: '/student/dashboard',     icon: LayoutDashboard },
  { label: 'My Courses',    to: '/student/courses',       icon: BookOpen        },
  { label: 'Results',       to: '/student/results',       icon: BarChart2       },
  { label: 'Fees',          to: '/student/fees',          icon: CreditCard      },
  { label: 'E-Library',     to: '/student/library',       icon: Library         },
  { label: 'Notifications', to: '/student/notifications', icon: Bell            },
]

// ── Step definitions ──────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, shortTitle: 'Verify Details',  fullTitle: 'Verify Personal Details'  },
  { id: 2, shortTitle: 'Upload Docs',     fullTitle: 'Upload Documents'          },
  { id: 3, shortTitle: 'Pay Fees',        fullTitle: 'Pay Tuition Fees'          },
  { id: 4, shortTitle: 'Register',        fullTitle: 'Register for Courses'      },
  { id: 5, shortTitle: 'E-Library',       fullTitle: 'Access E-Library'          },
  { id: 6, shortTitle: 'Handbook',        fullTitle: 'Download Handbook'         },
]

// ── Course data ───────────────────────────────────────────────────────────────

const COURSES = [
  { code: 'CSC 101', name: 'Introduction to Computer Science', credits: 3 },
  { code: 'CSC 102', name: 'Programming Fundamentals',         credits: 3 },
  { code: 'CSC 103', name: 'Digital Logic Design',             credits: 3 },
  { code: 'MTH 101', name: 'Calculus I',                       credits: 3 },
  { code: 'PHY 101', name: 'Physics I',                        credits: 3 },
  { code: 'ENG 101', name: 'English Communication Skills',     credits: 3 },
  { code: 'CSC 104', name: 'Computer Organisation',            credits: 3 },
]
const MAX_CREDITS = 21

// ── Fee data ──────────────────────────────────────────────────────────────────

const FEES = [
  { label: 'Tuition Fee',         amount: 650_000 },
  { label: 'Administrative Levy', amount:  50_000 },
  { label: 'Student Union Fee',   amount:  25_000 },
]
const FEES_TOTAL   = FEES.reduce((s, f) => s + f.amount, 0)
const FEES_DUE     = '30 September 2024'

// ─────────────────────────────────────────────────────────────────────────────

function StudentOnboardingPage() {
  const institutionName = DEV_INSTITUTION_NAME

  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [activeStep, setActiveStep] = useState(1)

  const completedCount  = completedSteps.length
  const progressPercent = Math.round((completedCount / STEPS.length) * 100)

  const handleComplete = () => {
    if (completedSteps.includes(activeStep)) return
    const next = STEPS.find((s) => !completedSteps.includes(s.id) && s.id !== activeStep)
    setCompletedSteps((prev) => [...prev, activeStep])
    if (next) setActiveStep(next.id)
  }

  const goToStep = (id: number) => {
    // Allow navigating to completed steps or the next pending step
    if (completedSteps.includes(id) || id === activeStep) setActiveStep(id)
  }

  return (
    <AppShell
      navItems={STUDENT_NAV}
      pageTitle="Onboarding"
      userName={STUDENT.fullName}
      userRole="Student"
      userInitials={STUDENT.initials}
      unreadCount={3}
      infoCardLabel="STUDENT ID"
      infoCardValue={STUDENT.id}
      infoCardSubtext={`Year ${STUDENT.year}`}
    >
      <div className="px-6 py-8 max-w-[840px] mx-auto">

        {/* ── Plain text welcome block ───────────────────────────────────── */}
        <div className="mb-8 animate-fade-up">
          <h1
            className="t-h1 mb-2"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
          >
            🎓 Welcome, {STUDENT.firstName}.
          </h1>
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
            Your admission to{' '}
            <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>
              {institutionName}
            </span>{' '}
            has been confirmed. Complete the steps below to activate your student account.
          </p>
        </div>

        {/* ── Main card ─────────────────────────────────────────────────── */}
        <div
          className="animate-fade-up"
          style={{
            backgroundColor: 'var(--card)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border)',
            padding: 32,
            animationDelay: '60ms',
          }}
        >
          {/* Horizontal step indicator */}
          <StepIndicator
            steps={STEPS}
            completedSteps={completedSteps}
            activeStep={activeStep}
            onStepClick={goToStep}
          />

          {/* Progress bar */}
          <div className="mt-4 mb-8">
            <div
              className="rounded-full overflow-hidden"
              style={{ height: 4, backgroundColor: 'var(--muted)' }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: 'var(--brand)',
                  transition: 'width 500ms ease-out',
                }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
                {completedCount} of {STEPS.length} steps complete
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand)' }}>
                {progressPercent}%
              </span>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, backgroundColor: 'var(--border)', marginBottom: 32 }} />

          {/* Active step content */}
          <StepContent
            stepId={activeStep}
            institutionName={institutionName}
            onComplete={handleComplete}
          />
        </div>

        {/* ── Footer row ────────────────────────────────────────────────── */}
        <div className="mt-4">
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: 'var(--muted-foreground)',
            }}
          >
            {STUDENT.id}
          </span>
        </div>

      </div>
    </AppShell>
  )
}

// ── Horizontal step indicator ─────────────────────────────────────────────────

function StepIndicator({
  steps,
  completedSteps,
  activeStep,
  onStepClick,
}: {
  steps: typeof STEPS
  completedSteps: number[]
  activeStep: number
  onStepClick: (id: number) => void
}) {
  return (
    <div className="relative">
      {/* Track line behind all circles */}
      <div
        className="absolute"
        style={{
          top: 17,           // half of 34px circle
          left: '8.33%',     // half of first step column
          right: '8.33%',    // half of last step column
          height: 1,
          backgroundColor: 'var(--border)',
          zIndex: 0,
        }}
      />

      <div className="relative flex" style={{ zIndex: 1 }}>
        {steps.map((step) => {
          const completed = completedSteps.includes(step.id)
          const active    = activeStep === step.id
          const clickable = completed || active

          return (
            <div
              key={step.id}
              className="flex flex-col items-center"
              style={{ flex: '1 1 0', cursor: clickable ? 'pointer' : 'default' }}
              onClick={() => clickable && onStepClick(step.id)}
            >
              {/* Circle */}
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 34,
                  height: 34,
                  flexShrink: 0,
                  backgroundColor: completed
                    ? 'var(--success-bg)'
                    : active
                      ? 'var(--brand)'
                      : 'var(--card)',
                  border: completed
                    ? '2px solid var(--success)'
                    : active
                      ? 'none'
                      : '2px solid var(--border)',
                  color: completed
                    ? 'var(--success)'
                    : active
                      ? 'var(--brand-ink)'
                      : 'var(--muted-foreground)',
                  fontSize: 12,
                  fontWeight: 700,
                  transition: 'background-color 200ms ease-out, border-color 200ms ease-out',
                }}
              >
                {completed ? <CheckCircle2 size={16} /> : step.id}
              </div>

              {/* Step label */}
              <p
                className="mt-2 text-center"
                style={{
                  fontSize: 11,
                  fontWeight: active ? 600 : 400,
                  color: active
                    ? 'var(--brand)'
                    : completed
                      ? 'var(--muted-foreground)'
                      : 'var(--muted-foreground)',
                  lineHeight: 1.3,
                  maxWidth: 72,
                  opacity: !completed && !active ? 0.6 : 1,
                  transition: 'color 200ms ease-out',
                }}
              >
                {step.shortTitle}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Step content router ───────────────────────────────────────────────────────

function StepContent({
  stepId,
  institutionName,
  onComplete,
}: {
  stepId: number
  institutionName: string
  onComplete: () => void
}) {
  switch (stepId) {
    case 1: return <Step1_VerifyDetails onComplete={onComplete} />
    case 2: return <Step2_UploadDocuments onComplete={onComplete} />
    case 3: return <Step3_PayFees institutionName={institutionName} onComplete={onComplete} />
    case 4: return <Step4_RegisterCourses onComplete={onComplete} />
    case 5: return <Step5_ELibrary onComplete={onComplete} />
    case 6: return <Step6_Handbook onComplete={onComplete} />
    default: return null
  }
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function StepHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h2
        className="t-h3 mb-1"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
      >
        {title}
      </h2>
      <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
        {subtitle}
      </p>
    </div>
  )
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="mb-4 p-4"
      style={{
        backgroundColor: 'rgba(32, 244, 78, 0.04)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
      }}
    >
      <p
        className="t-label mb-3"
        style={{ color: 'var(--muted-foreground)' }}
      >
        {title}
      </p>
      {children}
    </div>
  )
}

function DataGrid({ items }: { items: { label: string; value: string; mono?: boolean }[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
      {items.map((item) => (
        <div key={item.label}>
          <p
            className="t-label mb-0.5"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {item.label}
          </p>
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--foreground)',
              fontFamily: item.mono ? 'var(--font-mono)' : undefined,
              fontWeight: item.mono ? 500 : 400,
              lineHeight: 1.5,
            }}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  )
}

function StepActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-end gap-3 mt-6 pt-5"
      style={{ borderTop: '1px solid var(--border)' }}>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — Verify Personal Details
// ─────────────────────────────────────────────────────────────────────────────

function Step1_VerifyDetails({ onComplete }: { onComplete: () => void }) {
  const [reportOpen, setReportOpen] = useState(false)

  const basicDetails = [
    { label: 'Full Name',     value: STUDENT.fullName                    },
    { label: 'Student ID',   value: STUDENT.id,          mono: true     },
    { label: 'Date of Birth', value: STUDENT.dob                        },
    { label: 'Gender',        value: STUDENT.gender                      },
    { label: 'Phone Number',  value: STUDENT.phone                       },
    { label: 'Nationality',   value: STUDENT.nationality                 },
  ]
  const academicDetails = [
    { label: 'Programme',       value: STUDENT.programme                 },
    { label: 'Year of Study',   value: `Year ${STUDENT.year}`            },
    { label: 'Faculty',         value: STUDENT.faculty                   },
    { label: 'Enrollment Date', value: STUDENT.enrollmentDate            },
  ]

  return (
    <div className="animate-fade-up" style={{ animationDelay: '200ms' }}>
      <StepHeading
        title="Verify Personal Details"
        subtitle="Review your information carefully. Contact the registry if any detail is incorrect."
      />
      <FormSection title="Basic Details">
        <DataGrid items={basicDetails} />
      </FormSection>
      <FormSection title="Academic Details">
        <DataGrid items={academicDetails} />
      </FormSection>
      <StepActions>
        <button
          className="text-sm font-medium transition-opacity hover:opacity-70"
          onClick={() => setReportOpen(true)}
          style={{ color: 'var(--success)' }}
        >
          Report an issue
        </button>
        <Button
          className="font-semibold transition-transform duration-150 hover:-translate-y-px active:translate-y-0"
          onClick={onComplete}
        >
          Confirm details
        </Button>
      </StepActions>
      <ReportIssueDialog open={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — Upload Documents
// ─────────────────────────────────────────────────────────────────────────────

const DOC_TYPES = [
  { id: 'national-id',   label: 'National ID or Passport'      },
  { id: 'certificate',   label: 'Secondary School Certificate'  },
  { id: 'photo',         label: 'Passport Photo'                },
]

function Step2_UploadDocuments({ onComplete }: { onComplete: () => void }) {
  const [uploads, setUploads] = useState<Record<string, File | null>>({})
  const uploadedCount = Object.values(uploads).filter(Boolean).length

  return (
    <div className="animate-fade-up" style={{ animationDelay: '200ms' }}>
      <StepHeading
        title="Upload Documents"
        subtitle="Upload clear scans or photos. Accepted: PDF, JPG, PNG — max 5 MB each."
      />
      <div className="flex flex-col gap-4">
        {DOC_TYPES.map((doc) => (
          <UploadArea
            key={doc.id}
            label={doc.label}
            file={uploads[doc.id] ?? null}
            onFileSelect={(f) => setUploads((prev) => ({ ...prev, [doc.id]: f }))}
          />
        ))}
      </div>
      <StepActions>
        <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
          {uploadedCount} / {DOC_TYPES.length} uploaded
        </span>
        <Button
          className="font-semibold transition-transform duration-150 hover:-translate-y-px active:translate-y-0"
          onClick={onComplete}
        >
          Continue
        </Button>
      </StepActions>
    </div>
  )
}

function UploadArea({
  label,
  file,
  onFileSelect,
}: {
  label: string
  file: File | null
  onFileSelect: (f: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          {label}
        </span>
        <span
          className="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: file ? 'var(--success-bg)' : 'var(--muted)',
            color: file ? 'var(--success)' : 'var(--muted-foreground)',
          }}
        >
          {file ? 'Uploaded' : 'Pending'}
        </span>
      </div>

      {file ? (
        <div
          className="flex items-center gap-2.5 px-4 py-3 rounded-lg"
          style={{ border: '1px solid var(--success)', backgroundColor: 'var(--success-bg)' }}
        >
          <CheckCircle2 size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
          <span className="text-sm font-medium truncate" style={{ color: 'var(--success)' }}>
            {file.name}
          </span>
          <button
            className="ml-auto text-xs transition-opacity hover:opacity-70 flex-shrink-0"
            style={{ color: 'var(--muted-foreground)' }}
            onClick={() => inputRef.current?.click()}
          >
            Replace
          </button>
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center py-6 px-4 rounded-lg cursor-pointer transition-colors duration-150"
          style={{
            border: `2px dashed ${dragging ? 'var(--brand)' : 'var(--border)'}`,
            backgroundColor: dragging ? 'rgba(32,244,78,0.04)' : 'rgba(32,244,78,0.02)',
          }}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            const f = e.dataTransfer.files?.[0]
            if (f) onFileSelect(f)
          }}
        >
          <Upload size={20} style={{ color: 'var(--muted-foreground)', marginBottom: 8 }} />
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Click to upload or drag and drop
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)', opacity: 0.7 }}>
            PDF, JPG, PNG — max 5 MB
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFileSelect(f)
        }}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3 — Pay Tuition Fees
// ─────────────────────────────────────────────────────────────────────────────

const PAYMENT_METHODS = [
  { id: 'momo',   name: 'MTN MoMo',      description: 'USSD push to your MTN number', dotColor: '#FFCB00' },
  { id: 'airtel', name: 'Airtel Money',  description: 'USSD push to your Airtel number', dotColor: '#E4002B' },
  { id: 'bank',   name: 'Bank Transfer', description: 'Direct deposit or wire transfer', dotColor: '#2563EB' },
]

function Step3_PayFees({ onComplete, institutionName }: { onComplete: () => void; institutionName: string }) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className="animate-fade-up" style={{ animationDelay: '200ms' }}>
      <StepHeading
        title="Pay Tuition Fees"
        subtitle="Review your fee summary and choose a payment method to proceed."
      />

      {/* Fee summary */}
      <FormSection title="Fee Breakdown">
        <div className="flex flex-col gap-2.5">
          {FEES.map((fee) => (
            <div key={fee.label} className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--foreground)' }}>{fee.label}</span>
              <span className="text-sm font-medium" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-mono)' }}>
                {formatCurrency(fee.amount)}
              </span>
            </div>
          ))}
          <div
            className="flex items-center justify-between pt-2.5 mt-1"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Total Due</span>
            <span
              className="font-bold"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--foreground)' }}
            >
              {formatCurrency(FEES_TOTAL)}
            </span>
          </div>
          <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
            Due date: {FEES_DUE}
          </p>
        </div>
      </FormSection>

      {/* Payment methods */}
      <FormSection title="Payment Method">
        <div className="grid grid-cols-3 gap-3">
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelected(method.id)}
              className="flex flex-col items-start p-3.5 rounded-lg text-left transition-all duration-150"
              style={{
                border: selected === method.id
                  ? '1px solid rgba(32,244,78,0.5)'
                  : '1px solid var(--border)',
                backgroundColor: selected === method.id
                  ? 'rgba(32,244,78,0.05)'
                  : 'var(--card)',
              }}
            >
              {/* Provider dot */}
              <div
                className="rounded-full mb-3"
                style={{ width: 10, height: 10, backgroundColor: method.dotColor }}
              />
              <p
                className="text-sm font-semibold mb-0.5"
                style={{ color: 'var(--foreground)' }}
              >
                {method.name}
              </p>
              <p
                className="t-caption"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {method.description}
              </p>
            </button>
          ))}
        </div>
        {/* Inline expanded payment details */}
        {selected && (
          <PaymentMethodDetails method={selected} institutionName={institutionName} />
        )}
      </FormSection>

      <StepActions>
        <Button
          disabled={!selected}
          className="font-semibold transition-transform duration-150 hover:-translate-y-px active:translate-y-0"
          onClick={onComplete}
        >
          Proceed to payment
        </Button>
      </StepActions>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 4 — Register for Courses
// ─────────────────────────────────────────────────────────────────────────────

function Step4_RegisterCourses({ onComplete }: { onComplete: () => void }) {
  const [selected, setSelected] = useState<string[]>(['CSC 101', 'CSC 102', 'MTH 101', 'ENG 101'])

  const totalCredits = COURSES
    .filter((c) => selected.includes(c.code))
    .reduce((sum, c) => sum + c.credits, 0)

  const toggle = (code: string) => {
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }

  const overLimit = totalCredits > MAX_CREDITS

  return (
    <div className="animate-fade-up" style={{ animationDelay: '200ms' }}>
      <StepHeading
        title="Register for Courses"
        subtitle="Select your courses for Semester 1. Maximum 21 credits allowed."
      />

      <FormSection title="Available Courses — Semester 1">
        <div className="flex flex-col gap-0">
          {/* Header row */}
          <div
            className="grid pb-2 mb-1"
            style={{
              gridTemplateColumns: '1fr auto auto',
              gap: '0 16px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <span className="t-label" style={{ color: 'var(--muted-foreground)' }}>Course</span>
            <span className="t-label" style={{ color: 'var(--muted-foreground)' }}>Code</span>
            <span className="t-label" style={{ color: 'var(--muted-foreground)' }}>Credits/Units</span>
          </div>
          {/* Course rows */}
          {COURSES.map((course) => {
            const checked = selected.includes(course.code)
            return (
              <label
                key={course.code}
                className="grid items-center py-3 cursor-pointer"
                style={{
                  gridTemplateColumns: '1fr auto auto',
                  gap: '0 16px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggle(course.code)}
                  />
                  <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                    {course.name}
                  </span>
                </div>
                <span
                  className="text-sm"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted-foreground)' }}
                >
                  {course.code}
                </span>
                <span className="text-sm text-center" style={{ color: 'var(--foreground)', width: 48 }}>
                  {course.credits}
                </span>
              </label>
            )
          })}
          {/* Credits total */}
          <div className="flex items-center justify-end gap-2 pt-3">
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Total credits/units:</span>
            <span
              className="text-sm font-bold"
              style={{ color: overLimit ? 'var(--error)' : 'var(--foreground)' }}
            >
              {totalCredits} / {MAX_CREDITS}
            </span>
            {overLimit && (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error)' }}
              >
                Over limit
              </span>
            )}
          </div>
        </div>
      </FormSection>

      <StepActions>
        <Button
          disabled={selected.length === 0 || overLimit}
          className="font-semibold transition-transform duration-150 hover:-translate-y-px active:translate-y-0"
          onClick={onComplete}
        >
          Confirm registration
        </Button>
      </StepActions>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 5 — Access E-Library
// ─────────────────────────────────────────────────────────────────────────────

function Step5_ELibrary({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="animate-fade-up" style={{ animationDelay: '200ms' }}>
      <StepHeading
        title="Access E-Library"
        subtitle="Your e-library access is now active. Browse thousands of e-books, journals, and course materials."
      />
      <FormSection title="Library Access">
        <div className="flex flex-col gap-3">
          {[
            'Full access to the digital resource catalogue',
            'Course materials uploaded by your lecturers',
            'Research journals and academic publications',
            'Available 24 hours a day from any device',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2.5">
              <CheckCircle2 size={15} style={{ color: 'var(--success)', flexShrink: 0 }} />
              <span className="text-sm" style={{ color: 'var(--foreground)' }}>{item}</span>
            </div>
          ))}
        </div>
      </FormSection>
      <StepActions>
        <Link to="/student/library">
          <Button
            variant="outline"
            className="font-semibold transition-transform duration-150 hover:-translate-y-px active:translate-y-0"
          >
            Go to E-Library
          </Button>
        </Link>
        <Button
          className="font-semibold transition-transform duration-150 hover:-translate-y-px active:translate-y-0"
          onClick={onComplete}
        >
          Continue
        </Button>
      </StepActions>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 6 — Download Handbook
// ─────────────────────────────────────────────────────────────────────────────

function Step6_Handbook({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="animate-fade-up" style={{ animationDelay: '200ms' }}>
      <StepHeading
        title="Download Student Handbook"
        subtitle="Read the student handbook to understand academic policies, code of conduct, and support services."
      />
      <FormSection title="Student Handbook">
        <div
          className="flex items-center gap-4 p-4 rounded-lg"
          style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}
        >
          <div
            className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{
              width: 48, height: 48,
              backgroundColor: 'rgba(32,244,78,0.08)',
              border: '1px solid rgba(32,244,78,0.2)',
            }}
          >
            <FileDown size={22} style={{ color: 'var(--brand)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              Student Handbook 2024/2025
            </p>
            <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              PDF · 4.2 MB · Academic policies, conduct, examination rules
            </p>
          </div>
        </div>
      </FormSection>
      <StepActions>
        <button
          className="text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: 'var(--muted-foreground)' }}
          onClick={onComplete}
        >
          Skip
        </button>
        <Button
          className="font-semibold transition-transform duration-150 hover:-translate-y-px active:translate-y-0"
          onClick={onComplete}
        >
          Download handbook
        </Button>
      </StepActions>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Report Issue Dialog
// ─────────────────────────────────────────────────────────────────────────────

function ReportIssueDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail]           = useState('jeanpaul.mugisha@ur.ac.rw')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!description.trim() || submitting) return
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 800))
    setSubmitting(false)
    onClose()
    toast.success('Your report has been submitted. We will follow up within 24 hours.')
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle
            style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600 }}
          >
            Report an Issue
          </DialogTitle>
          <DialogDescription>
            Describe the issue with your details. Our admissions and ICT team will be notified and follow up within 24 hours.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="report-email">Your email address</Label>
            <Input
              id="report-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="report-desc">Describe the issue</Label>
            <Textarea
              id="report-desc"
              placeholder="e.g. My name is spelled incorrectly, wrong date of birth..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!description.trim() || submitting}
            className="font-semibold"
          >
            {submitting ? 'Submitting…' : 'Submit report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Payment Method Details — inline expand on Step 3
// ─────────────────────────────────────────────────────────────────────────────

function PaymentMethodDetails({
  method,
  institutionName,
}: {
  method: string
  institutionName: string
}) {
  return (
    <div
      className="animate-fade-up mt-3"
      style={{
        backgroundColor: 'rgba(32,244,78,0.04)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid rgba(32,244,78,0.12)',
        padding: 16,
      }}
    >
      {(method === 'momo' || method === 'airtel') && (
        <div className="flex flex-col gap-3">
          <p className="t-label" style={{ color: 'var(--muted-foreground)' }}>PAYMENT INSTRUCTIONS</p>
          <p className="text-sm" style={{ color: 'var(--foreground)' }}>
            {method === 'momo'
              ? 'A USSD push will be sent to your MTN number. Approve the prompt to complete payment.'
              : 'A USSD push will be sent to your Airtel number. Approve the prompt to complete payment.'}
          </p>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${method}-number`}>
              {method === 'momo' ? 'MTN MoMo Number' : 'Airtel Money Number'}
            </Label>
            <Input
              id={`${method}-number`}
              type="tel"
              defaultValue="+250 7XX XXX XXX"
            />
          </div>
          {method === 'momo' && (
            <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
              Make sure your MoMo account has sufficient balance.
            </p>
          )}
        </div>
      )}

      {method === 'bank' && (
        <div className="flex flex-col gap-3">
          {[
            { label: 'BANK',           value: 'Bank of Kigali',                      mono: false, brand: false },
            { label: 'ACCOUNT NAME',   value: `${institutionName} — Student Fees`,   mono: false, brand: false },
            { label: 'ACCOUNT NUMBER', value: '0001234567890',                        mono: true,  brand: false },
            { label: 'BRANCH',         value: 'Kigali City Centre',                  mono: false, brand: false },
            { label: 'REFERENCE',      value: STUDENT.id,                             mono: true,  brand: true  },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="t-label" style={{ color: 'var(--muted-foreground)' }}>{row.label}</span>
              <span
                className="text-sm font-medium"
                style={{
                  fontFamily: row.mono ? 'var(--font-mono)' : undefined,
                  color: row.brand ? 'var(--brand)' : 'var(--foreground)',
                }}
              >
                {row.value}
              </span>
            </div>
          ))}
          <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Bank transfers may take 1–3 business days. Click Proceed to payment to notify the bursar once your transfer is complete.
          </p>
        </div>
      )}
    </div>
  )
}
