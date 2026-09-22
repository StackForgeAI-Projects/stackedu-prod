import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Search, User, Lock, LogOut, CheckCircle2, Info, X, ChevronDown,
} from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// ─────────────────────────────────────────────────────────────────────────────

export interface ApplyStep {
  id: number
  label: string
}

export interface ApplyLayoutProps {
  /** Show the left sidebar (false = top bar only) */
  showSidebar?: boolean
  /** Show the instruction banner inside main content */
  showBanner?: boolean
  /** Steps to display in the sidebar */
  steps?: ApplyStep[]
  /** 1-based index of the currently active step */
  currentStep?: number
  /** IDs of completed steps */
  completedSteps?: number[]
  /** 0-100 */
  progressPercent?: number
  applicantName?: string
  applicantInitials?: string
  programmeApplied?: string
  applicationId?: string
  institutionName?: string
  children: React.ReactNode
}

// ── Mock applicant — replace with real auth context ───────────────────────────

const DEFAULT_APPLICANT = {
  name:       'Amina Uwase',
  initials:   'AU',
  programme:  'Computer Science',
  appId:      'APP-2025-04872',
}

// ── All 7 steps — always shown in full ────────────────────────────────────────

const ALL_STEPS: ApplyStep[] = [
  { id: 1, label: 'Personal Details'    },
  { id: 2, label: 'Academic History'    },
  { id: 3, label: 'Programme Selection' },
  { id: 4, label: 'Parent / Guardian'   },
  { id: 5, label: 'Additional Info'     },
  { id: 6, label: 'Documents'           },
  { id: 7, label: 'Application Fee'     },
]

// ─────────────────────────────────────────────────────────────────────────────

export function ApplyLayout({
  showSidebar     = true,
  showBanner      = true,
  steps           = ALL_STEPS,
  currentStep     = 1,
  completedSteps  = [],
  progressPercent = 0,
  applicantName   = DEFAULT_APPLICANT.name,
  applicantInitials = DEFAULT_APPLICANT.initials,
  programmeApplied  = DEFAULT_APPLICANT.programme,
  applicationId     = DEFAULT_APPLICANT.appId,
  institutionName   = 'StackForgeAI University',
  children,
}: ApplyLayoutProps) {
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [profileSheetOpen, setProfileSheetOpen] = useState(false)
  const [passwordSheetOpen, setPasswordSheetOpen] = useState(false)

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--background)' }}>

      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <ApplyTopBar
        institutionName={institutionName}
        progressPercent={progressPercent}
        applicantName={applicantName}
        applicantInitials={applicantInitials}
        onOpenProfile={() => setProfileSheetOpen(true)}
        onOpenPassword={() => setPasswordSheetOpen(true)}
      />

      {/* ── Body row ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left sidebar ─────────────────────────────────────────────────── */}
        {showSidebar && steps.length > 0 && (
          <ApplySidebar
            steps={steps}
            currentStep={currentStep}
            completedSteps={completedSteps}
            applicantName={applicantName}
            programmeApplied={programmeApplied}
            applicationId={applicationId}
          />
        )}

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <main
          className="flex-1 overflow-y-auto"
          style={{ backgroundColor: 'var(--background)' }}
        >
          <div
            style={{
              maxWidth: 860,
              margin:   '0 auto',
              padding:  '2rem',
            }}
          >
            {/* Instruction banner */}
            {showBanner && !bannerDismissed && (
              <div
                className="flex items-start gap-3 mb-6 rounded-lg px-4 py-3"
                style={{
                  backgroundColor: 'var(--warning-bg)',
                  borderLeft:      '4px solid var(--warning)',
                }}
              >
                <Info
                  size={16}
                  style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 2 }}
                />
                <p className="flex-1 text-sm" style={{ color: 'var(--foreground)', lineHeight: 1.5 }}>
                  Please ensure all your responses are accurate and in English.
                  Applications that do not comply may not be considered.
                </p>
                <button
                  onClick={() => setBannerDismissed(true)}
                  style={{ color: 'var(--warning)', flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                  aria-label="Dismiss"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {children}
          </div>
        </main>
      </div>

      {/* ── Profile Sheet ────────────────────────────────────────────────────── */}
      <Sheet open={profileSheetOpen} onOpenChange={setProfileSheetOpen}>
        <SheetContent side="right" style={{ width: 'min(480px, 100vw)' }}>
          <SheetHeader>
            <SheetTitle style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem' }}>
              Personal Information
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 mt-6">
            {[
              { label: 'Full Name',   value: applicantName },
              { label: 'Gender',      value: 'Female' },
              { label: 'Email',       value: 'amina.uwase@gmail.com' },
              { label: 'Phone',       value: '+250 788 456 789' },
            ].map((row) => (
              <div key={row.label}
                className="px-4 py-3 rounded-lg"
                style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}
              >
                <p className="t-label mb-0.5" style={{ color: 'var(--muted-foreground)' }}>{row.label}</p>
                <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{row.value}</p>
              </div>
            ))}
            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
              To update your details, contact the admissions office at admissions@stackforgeai.ac.rw
            </p>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Change Password Sheet ─────────────────────────────────────────────── */}
      <Sheet open={passwordSheetOpen} onOpenChange={setPasswordSheetOpen}>
        <SheetContent side="right" style={{ width: 'min(480px, 100vw)' }}>
          <SheetHeader>
            <SheetTitle style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem' }}>
              Change Password
            </SheetTitle>
          </SheetHeader>
          <ChangePasswordForm onClose={() => setPasswordSheetOpen(false)} />
        </SheetContent>
      </Sheet>

    </div>
  )
}

// ── Top bar ───────────────────────────────────────────────────────────────────

export function ApplyTopBar({
  institutionName   = 'StackForgeAI University',
  progressPercent   = 0,
  applicantName     = DEFAULT_APPLICANT.name,
  applicantInitials = DEFAULT_APPLICANT.initials,
  onOpenProfile,
  onOpenPassword,
}: {
  institutionName?:   string
  progressPercent?:   number
  applicantName?:     string
  applicantInitials?: string
  onOpenProfile?: () => void
  onOpenPassword?: () => void
}) {
  return (
    <header
      className="flex items-center flex-shrink-0 px-6"
      style={{
        height:          56,
        backgroundColor: 'var(--card)',
        borderBottom:    '1px solid var(--border)',
        gap:             16,
      }}
    >
      {/* Left — logo + name */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <div className="relative flex-shrink-0" style={{ width: 32, height: 32 }}>
          <div
            className="absolute inset-0 flex items-center justify-center rounded-lg text-[10px] font-bold tracking-widest uppercase"
            style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}
          >
            S
          </div>
          <img
            src="/stackedu-logo.png"
            alt="StackEDU"
            className="absolute inset-0"
            style={{ width: 32, height: 32, objectFit: 'contain' }}
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        </div>
        <span
          className="text-sm font-semibold tracking-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
        >
          StackEDU
        </span>
        <span style={{ color: 'var(--border)', fontSize: 16 }}>·</span>
        <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {institutionName}
        </span>
      </div>

      {/* Center — progress bar */}
      <div className="flex-1 flex items-center justify-center">
        <div style={{ width: 200 }}>
          <div
            className="rounded-full overflow-hidden"
            style={{ height: 6, backgroundColor: 'var(--muted)' }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width:           `${progressPercent}%`,
                backgroundColor: '#0D7A28',
                transition:      'width 400ms ease-out',
              }}
            />
          </div>
          <p
            className="text-center mt-1"
            style={{ fontSize: 10, color: 'var(--muted-foreground)' }}
          >
            {progressPercent}% complete
          </p>
        </div>
      </div>

      {/* Right — track link + profile dropdown */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <Link
          to="/apply/track"
          className="flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: '#0D7A28', textDecoration: 'none' }}
        >
          <Search size={14} />
          Track application
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors"
              style={{ border: '1px solid var(--border)', backgroundColor: 'transparent', cursor: 'pointer' }}
            >
              <div
                className="flex items-center justify-center rounded-full text-[11px] font-bold"
                style={{
                  width: 26, height: 26,
                  backgroundColor: 'var(--brand)',
                  color:           'var(--brand-ink)',
                  flexShrink: 0,
                }}
              >
                {applicantInitials}
              </div>
              <ChevronDown size={12} style={{ color: 'var(--muted-foreground)' }} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" style={{ minWidth: 200 }}>
            <DropdownMenuLabel>
              <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                {applicantName}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onOpenProfile} className="gap-2 cursor-pointer">
              <User size={14} style={{ color: 'var(--muted-foreground)' }} />
              Personal Information
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenPassword} className="gap-2 cursor-pointer">
              <Lock size={14} style={{ color: 'var(--muted-foreground)' }} />
              Change Password
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                to="/apply"
                className="flex items-center gap-2 cursor-pointer"
                style={{ color: 'var(--error)', textDecoration: 'none' }}
              >
                <LogOut size={14} />
                Log out
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

// ── Left sidebar ──────────────────────────────────────────────────────────────

function ApplySidebar({
  steps,
  currentStep,
  completedSteps,
  applicantName,
  programmeApplied,
  applicationId,
}: {
  steps:           ApplyStep[]
  currentStep:     number
  completedSteps:  number[]
  applicantName:   string
  programmeApplied: string
  applicationId:   string
}) {
  return (
    <aside
      className="hidden lg:flex flex-col flex-shrink-0"
      style={{
        width:           260,
        backgroundColor: 'var(--ink)',
        borderRight:     '1px solid var(--ink-border)',
      }}
    >
      {/* Step list */}
      <nav className="flex-1 overflow-y-auto" style={{ padding: '24px 12px 16px' }}>
        <p
          className="t-label mb-4 px-3"
          style={{ color: 'var(--ink-muted)' }}
        >
          Application Steps
        </p>
        <ul className="flex flex-col" style={{ gap: 2 }}>
          {steps.map((step) => {
            const completed = completedSteps.includes(step.id)
            const active    = currentStep === step.id

            const bg = active
              ? 'rgba(32, 244, 78, 0.15)'
              : 'transparent'
            const border = active
              ? '1px solid rgba(32, 244, 78, 0.25)'
              : '1px solid transparent'

            const numBg    = completed ? 'var(--success-bg)' : active ? 'var(--brand)' : 'var(--ink-surface)'
            const numColor = completed ? 'var(--success)'    : active ? 'var(--brand-ink)' : 'var(--ink-muted)'
            const labelColor = active ? 'var(--brand)' : completed ? 'var(--ink-muted)' : 'rgba(248,250,252,0.55)'

            return (
              <li key={step.id}>
                <div
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                  style={{ backgroundColor: bg, border }}
                >
                  {/* Number circle */}
                  <div
                    className="flex items-center justify-center rounded-full flex-shrink-0 text-[11px] font-bold"
                    style={{ width: 22, height: 22, backgroundColor: numBg, color: numColor }}
                  >
                    {completed
                      ? <CheckCircle2 size={12} style={{ color: 'var(--success)' }} />
                      : step.id}
                  </div>

                  {/* Label */}
                  <span
                    className="flex-1 text-sm"
                    style={{ color: labelColor, fontWeight: active ? 600 : 400, lineHeight: 1.4 }}
                  >
                    {step.label}
                  </span>

                  {/* Completed check on right */}
                  {completed && (
                    <CheckCircle2 size={14} style={{ color: 'var(--brand)', flexShrink: 0 }} />
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom identity chip */}
      <div
        className="flex-shrink-0 px-3 py-4"
        style={{ borderTop: '1px solid var(--ink-border)' }}
      >
        <p className="text-sm font-semibold mb-0.5" style={{ color: '#FFFFFF', lineHeight: 1.4 }}>
          {applicantName}
        </p>
        <p className="text-xs mb-1.5" style={{ color: 'var(--ink-muted)' }}>
          {programmeApplied}
        </p>
        <p
          className="text-xs font-medium"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand)' }}
        >
          {applicationId}
        </p>
      </div>
    </aside>
  )
}

// ── Change Password form ──────────────────────────────────────────────────────

function ChangePasswordForm({ onClose }: { onClose: () => void }) {
  const [current,  setCurrent]  = useState('')
  const [next,     setNext]     = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showCurr, setShowCurr] = useState(false)
  const [showNew,  setShowNew]  = useState(false)
  const [showConf, setShowConf] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!current || !next || !confirm || next !== confirm) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 900))
    setLoading(false)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-6">
      <div className="flex flex-col gap-1.5">
        <Label>Current password</Label>
        <div className="relative">
          <Input
            type={showCurr ? 'text' : 'password'}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder="••••••••"
            className="pr-10"
          />
          <EyeToggle show={showCurr} onToggle={() => setShowCurr((v) => !v)} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>New password</Label>
        <div className="relative">
          <Input
            type={showNew ? 'text' : 'password'}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            placeholder="••••••••"
            className="pr-10"
          />
          <EyeToggle show={showNew} onToggle={() => setShowNew((v) => !v)} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Confirm new password</Label>
        <div className="relative">
          <Input
            type={showConf ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            className="pr-10"
          />
          <EyeToggle show={showConf} onToggle={() => setShowConf((v) => !v)} />
        </div>
        {confirm && next && confirm !== next && (
          <p className="text-xs" style={{ color: 'var(--error)' }}>Passwords do not match</p>
        )}
      </div>
      <Button
        type="submit"
        className="mt-2 font-semibold"
        disabled={!current || !next || !confirm || next !== confirm || loading}
      >
        {loading ? 'Updating…' : 'Update password'}
      </Button>
    </form>
  )
}

function EyeToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      tabIndex={-1}
      className="absolute right-3 top-1/2 -translate-y-1/2"
      style={{ color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer' }}
    >
      {show
        ? <span style={{ fontSize: 12 }}>Hide</span>
        : <span style={{ fontSize: 12 }}>Show</span>}
    </button>
  )
}
