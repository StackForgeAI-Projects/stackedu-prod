import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Search, Eye, EyeOff, FileText, Clock, ClipboardCheck,
  GraduationCap, XCircle, CheckCircle2, PartyPopper,
} from 'lucide-react'
import { toast } from 'sonner'
import { ApplyLayout, ApplyTopBar, type ApplyStep } from '@/components/ApplyLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/apply/track')({
  component: ApplyTrackPage,
})

// ─────────────────────────────────────────────────────────────────────────────

const STEPS: ApplyStep[] = [
  { id: 1, label: 'Personal Details'    },
  { id: 2, label: 'Academic History'    },
  { id: 3, label: 'Programme Selection' },
  { id: 4, label: 'Parent / Guardian'   },
  { id: 5, label: 'Additional Info'     },
  { id: 6, label: 'Documents'           },
  { id: 7, label: 'Application Fee'     },
]

type AppStatus = 'pending' | 'approved' | 'conditional' | 'rejected'

// Demo: change this value to preview different status states
const DEMO_STATUS: AppStatus = 'approved'

// ─────────────────────────────────────────────────────────────────────────────

function ApplyTrackPage() {
  const [loggedIn, setLoggedIn] = useState(false)

  if (!loggedIn) {
    return <LoggedOutView onLogin={() => setLoggedIn(true)} />
  }
  return <LoggedInView />
}

// ── Logged out ────────────────────────────────────────────────────────────────

function LoggedOutView({ onLogin }: { onLogin: () => void }) {
  const [appId,    setAppId]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1000))
    setLoading(false)
    onLogin()
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <ApplyTopBar progressPercent={0} />

      <div className="flex flex-1 items-center justify-center p-6">
        <div
          className="w-full max-w-[480px] animate-fade-up"
          style={{
            backgroundColor: 'var(--card)',
            borderRadius:    'var(--radius-xl)',
            boxShadow:       'var(--shadow-md)',
            padding:         '2rem',
            border:          '1px solid var(--border)',
          }}
        >
          {/* Icon */}
          <div
            className="flex items-center justify-center rounded-full mb-6"
            style={{
              width:           48,
              height:          48,
              backgroundColor: 'rgba(13,122,40,0.08)',
              border:          '1px solid rgba(13,122,40,0.2)',
            }}
          >
            <Search size={20} style={{ color: '#0D7A28' }} />
          </div>

          <h2
            className="t-h2 mb-6"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
          >
            Track your application
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="track-id">Application ID</Label>
              <Input
                id="track-id"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="APP-2025-XXXXX"
                style={{ fontFamily: 'var(--font-mono)' }}
                required
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="track-pass">Password</Label>
              <div className="relative">
                <Input
                  id="track-pass"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 font-semibold text-sm mt-1 transition-transform duration-150 hover:-translate-y-px active:translate-y-0"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Loading…
                </span>
              ) : (
                'Track application'
              )}
            </Button>
          </form>

          <div className="my-5" style={{ height: 1, backgroundColor: 'var(--border)' }} />

          <p className="text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
            New applicant?{' '}
            <Link
              to="/apply"
              className="font-medium transition-opacity hover:opacity-70"
              style={{ color: '#0D7A28', textDecoration: 'none' }}
            >
              Apply now
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Logged in ─────────────────────────────────────────────────────────────────

function LoggedInView() {
  return (
    <ApplyLayout
      steps={STEPS}
      currentStep={7}
      completedSteps={[1, 2, 3, 4, 5, 6, 7]}
      progressPercent={100}
      showBanner={false}
    >
      <div className="mb-6">
        <h2
          className="t-h2"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.01em' }}
        >
          Welcome back, Amina
        </h2>
        <p className="t-body mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Computer Science · Entry 2025/2026
        </p>
      </div>

      <StatusTimeline status={DEMO_STATUS} />

      <div className="mt-6">
        {DEMO_STATUS === 'approved'    && <ApprovedCard />}
        {DEMO_STATUS === 'conditional' && <ConditionalCard />}
        {DEMO_STATUS === 'pending'     && <PendingCard />}
        {DEMO_STATUS === 'rejected'    && <RejectedCard />}
      </div>
    </ApplyLayout>
  )
}

// ── Status timeline ───────────────────────────────────────────────────────────

const TIMELINE_STAGES = [
  { icon: FileText,        label: 'Application Submitted', date: '4 Jun 2025'    },
  { icon: Search,          label: 'Under Review',          date: 'In progress'   },
  { icon: ClipboardCheck,  label: 'Decision Made',         date: '11 Jun 2025'   },
  { icon: GraduationCap,   label: 'Outcome',               date: 'Offer issued'  },
]

function StatusTimeline({ status }: { status: AppStatus }) {
  const completedCount = status === 'pending' ? 1 : 3
  const activeIndex    = status === 'pending' ? 1 : 2

  return (
    <div
      className="p-6 rounded-xl"
      style={{
        backgroundColor: 'var(--card)',
        border:          '1px solid var(--border)',
        boxShadow:       'var(--shadow-sm)',
      }}
    >
      <p className="text-sm font-semibold mb-5" style={{ color: 'var(--foreground)' }}>
        Application Status
      </p>
      <div className="flex flex-col gap-0">
        {TIMELINE_STAGES.map((stage, i) => {
          const completed = i < completedCount
          const active    = i === activeIndex
          const last      = i === TIMELINE_STAGES.length - 1

          const circleColor = completed || active ? '#0D7A28' : 'var(--muted)'
          const labelColor  = completed ? 'var(--success)' : active ? '#0D7A28' : 'var(--muted-foreground)'
          const Icon        = (status !== 'rejected' || i < 3) ? stage.icon : XCircle

          return (
            <div key={stage.label} className="flex gap-4">
              {/* Line + dot column */}
              <div className="flex flex-col items-center" style={{ width: 24, flexShrink: 0 }}>
                <div
                  className="flex items-center justify-center rounded-full flex-shrink-0"
                  style={{
                    width:           24,
                    height:          24,
                    backgroundColor: circleColor,
                    position:        'relative',
                    zIndex:          1,
                  }}
                >
                  {active && (
                    <div
                      className="absolute inset-0 rounded-full animate-ping"
                      style={{ backgroundColor: '#0D7A28', opacity: 0.3 }}
                    />
                  )}
                  <Icon size={12} style={{ color: completed || active ? 'var(--brand-ink)' : 'var(--muted-foreground)', position: 'relative' }} />
                </div>
                {!last && (
                  <div
                    style={{
                      width:           2,
                      flex:            1,
                      minHeight:       24,
                      backgroundColor: completed ? '#0D7A28' : 'var(--muted)',
                      margin:          '2px 0',
                    }}
                  />
                )}
              </div>

              {/* Label column */}
              <div className="pb-6" style={{ paddingTop: 2 }}>
                <p
                  className="text-sm font-semibold"
                  style={{ color: labelColor }}
                >
                  {stage.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  {completed || active ? stage.date : 'Pending'}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Outcome cards ─────────────────────────────────────────────────────────────

function ApprovedCard() {
  const [acceptOpen,  setAcceptOpen]  = useState(false)
  const [declineOpen, setDeclineOpen] = useState(false)
  const [accepted,    setAccepted]    = useState(false)
  const [declineReason, setDeclineReason] = useState('')

  if (accepted) {
    return (
      <div
        className="flex flex-col items-center text-center p-8 rounded-xl animate-fade-up"
        style={{ backgroundColor: 'var(--success-bg)', border: '1px solid var(--success)' }}
      >
        <PartyPopper size={40} style={{ color: 'var(--success)', marginBottom: 12 }} />
        <h2
          className="t-h2 mb-2"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--success)' }}
        >
          Offer Accepted!
        </h2>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)', maxWidth: 400 }}>
          Check your email and phone for your student ID and login credentials within 24 hours.
        </p>
        {/* Confetti dots */}
        <div className="mt-6 flex gap-2" aria-hidden>
          {['#0D7A28', 'var(--info)', 'var(--warning)', 'var(--success)', 'var(--error)'].map((c, i) => (
            <div
              key={i}
              className="rounded-full animate-bounce"
              style={{
                width:            8,
                height:           8,
                backgroundColor:  c,
                animationDelay:   `${i * 80}ms`,
                animationDuration:'600ms',
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        className="p-6 rounded-xl"
        style={{
          backgroundColor: 'var(--card)',
          border:          '1px solid var(--border)',
          borderLeft:      '4px solid #0D7A28',
          boxShadow:       'var(--shadow-sm)',
        }}
      >
        <h2
          className="t-h2 mb-4"
          style={{ fontFamily: 'var(--font-display)', color: '#0D7A28', letterSpacing: '-0.01em' }}
        >
          Offer of Admission
        </h2>
        {[
          { label: 'Programme',   value: 'Computer Science'   },
          { label: 'Entry Year',  value: '2025/2026'          },
          { label: 'Study Mode',  value: 'Full-time'          },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{row.label}</span>
            <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{row.value}</span>
          </div>
        ))}
        <p className="text-xs mt-3" style={{ color: 'var(--warning)' }}>
          This offer expires on 30 June 2025. Please respond before then.
        </p>

        <div className="flex flex-col gap-3 mt-5">
          <Button
            className="w-full font-semibold h-11 transition-transform duration-150 hover:-translate-y-px active:translate-y-0"
            onClick={() => setAcceptOpen(true)}
          >
            <CheckCircle2 size={16} className="mr-2" />
            Accept offer
          </Button>
          <Button
            variant="outline"
            className="w-full font-semibold h-11"
            style={{ borderColor: 'var(--error)', color: 'var(--error)' }}
            onClick={() => setDeclineOpen(true)}
          >
            <XCircle size={16} className="mr-2" />
            Decline offer
          </Button>
        </div>
      </div>

      {/* Accept dialog */}
      <AlertDialog open={acceptOpen} onOpenChange={setAcceptOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem' }}>
              Accept offer of admission?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are accepting the offer of admission to <strong>Computer Science</strong> at StackForgeAI University.
              You will receive your student login credentials within 24 hours.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { setAcceptOpen(false); setAccepted(true); toast.success('Offer accepted! Check your email for next steps.') }}
            >
              Accept offer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Decline dialog */}
      <AlertDialog open={declineOpen} onOpenChange={setDeclineOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem' }}>
              Decline offer of admission?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Please let us know why you are declining. This helps us improve our admissions process.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-3 px-1">
            <Select onValueChange={setDeclineReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {['Found another institution', 'Programme not suitable', 'Financial reasons', 'Personal reasons', 'Other'].map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea placeholder="Additional notes (optional)" rows={3} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { setDeclineOpen(false); toast.info('Your response has been recorded.') }}
              style={{ backgroundColor: 'var(--error)' }}
            >
              Decline offer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function ConditionalCard() {
  return (
    <div
      className="p-6 rounded-xl"
      style={{
        backgroundColor: 'var(--card)',
        border:          '1px solid var(--border)',
        borderLeft:      '4px solid var(--warning)',
        boxShadow:       'var(--shadow-sm)',
      }}
    >
      <div
        className="flex items-start gap-3 mb-4 px-4 py-3 rounded-lg"
        style={{ backgroundColor: 'var(--warning-bg)', border: '1px solid rgba(202,138,4,0.3)' }}
      >
        <Clock size={15} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 1 }} />
        <div>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--warning)' }}>
            Conditional Offer
          </p>
          <p className="text-sm" style={{ color: 'var(--foreground)', lineHeight: 1.5 }}>
            Your offer is conditional on meeting the following requirements:
          </p>
          <ul className="mt-2 flex flex-col gap-1">
            {[
              'Provide certified copies of your A-Level certificate',
              'Achieve a minimum grade of B in Mathematics',
              'Complete the online orientation module by 1 August 2025',
            ].map((c) => (
              <li key={c} className="flex items-start gap-2 text-sm" style={{ color: 'var(--foreground)' }}>
                <span style={{ color: 'var(--warning)', flexShrink: 0 }}>·</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <Button className="w-full font-semibold h-11 transition-transform duration-150 hover:-translate-y-px active:translate-y-0">
          <CheckCircle2 size={16} className="mr-2" />
          Accept conditional offer
        </Button>
        <Button
          variant="outline"
          className="w-full"
          style={{ borderColor: 'var(--error)', color: 'var(--error)' }}
        >
          <XCircle size={16} className="mr-2" />
          Decline offer
        </Button>
      </div>
    </div>
  )
}

function PendingCard() {
  return (
    <div
      className="flex items-start gap-4 p-6 rounded-xl"
      style={{ backgroundColor: 'var(--info-bg)', border: '1px solid rgba(37,99,235,0.25)' }}
    >
      <Clock size={20} style={{ color: 'var(--info)', flexShrink: 0, marginTop: 2 }} />
      <div>
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--info)' }}>Under Review</p>
        <p className="text-sm" style={{ color: 'var(--foreground)', lineHeight: 1.5 }}>
          Expected response within 5–7 business days. We will notify you by email and SMS.
        </p>
        <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
          Submitted: 4 June 2025
        </p>
      </div>
    </div>
  )
}

function RejectedCard() {
  return (
    <div
      className="flex flex-col gap-4 p-6 rounded-xl"
      style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-start gap-3">
        <XCircle size={20} style={{ color: 'var(--muted-foreground)', flexShrink: 0, marginTop: 2 }} />
        <div>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
            Application Unsuccessful
          </p>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
            We regret that your application was unsuccessful at this time. Thank you for your interest in StackForgeAI University.
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
            Decision date: 11 June 2025
          </p>
        </div>
      </div>
      <Button variant="outline" className="w-fit">
        Contact admissions office
      </Button>
    </div>
  )
}
