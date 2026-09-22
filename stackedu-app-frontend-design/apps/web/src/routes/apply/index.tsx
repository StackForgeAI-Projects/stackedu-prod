import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/apply/')({
  component: ApplyCreateAccountPage,
})

const DEV_INSTITUTION_NAME = 'StackForgeAI University'

const PROGRAMMES = [
  'Computer Science',
  'Information Technology',
  'Mathematics',
  'Business Administration',
]

// ─────────────────────────────────────────────────────────────────────────────

function ApplyCreateAccountPage() {
  const navigate = useNavigate()

  const [fullName,   setFullName]   = useState('')
  const [email,      setEmail]      = useState('')
  const [phone,      setPhone]      = useState('')
  const [programme,  setProgramme]  = useState('')
  const [password,   setPassword]   = useState('')
  const [confirm,    setConfirm]    = useState('')
  const [showPass,   setShowPass]   = useState(false)
  const [showConf,   setShowConf]   = useState(false)
  const [isLoading,  setIsLoading]  = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName || !email || !phone || !programme || !password || password !== confirm) return
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 1000))
    setIsLoading(false)
    navigate({ to: '/apply/verify' })
  }

  const mismatch = confirm.length > 0 && password !== confirm

  return (
    <div className="flex min-h-screen">

      {/* ── Left panel ──────────────────────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[42%] flex-col justify-between p-12 flex-shrink-0"
        style={{
          backgroundImage: [
            'linear-gradient(to bottom, rgba(5,19,29,0.72) 0%, rgba(5,19,29,0.88) 60%, rgba(5,19,29,0.97) 100%)',
            "url('/login-hero.jpg')",
          ].join(', '),
          backgroundSize:     'cover',
          backgroundPosition: 'center top',
        }}
      >
        {/* Logo + wordmark */}
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0" style={{ width: 36, height: 36 }}>
            <div
              className="absolute inset-0 flex items-center justify-center rounded-xl text-[11px] font-bold tracking-widest uppercase"
              style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}
            >
              S
            </div>
            <img
              src="/stackedu-logo.png"
              alt="StackEDU"
              className="absolute inset-0"
              style={{ width: 36, height: 36, objectFit: 'contain' }}
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          </div>
          <span
            className="text-base font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: '#FFFFFF' }}
          >
            StackEDU
          </span>
        </div>

        {/* Centre content */}
        <div className="space-y-6 max-w-xs">
          <div>
            <h2
              className="t-h1 mb-3"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--ink-foreground)' }}
            >
              Apply for admission
            </h2>
            <p className="t-body-lg" style={{ color: 'var(--ink-muted)' }}>
              Join thousands of students at {DEV_INSTITUTION_NAME}
            </p>
          </div>

          <ul className="flex flex-col gap-3">
            {[
              'Simple online application',
              'Track your admission status in real time',
              'Accept your offer digitally',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <CheckCircle2 size={16} style={{ color: 'var(--brand)', flexShrink: 0 }} />
                <span className="text-sm" style={{ color: 'var(--ink-foreground)' }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom */}
        <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>
          {DEV_INSTITUTION_NAME}
        </span>
      </div>

      {/* ── Right panel ─────────────────────────────────────────────────────── */}
      <div
        className="flex lg:w-[58%] flex-1 flex-col p-8 sm:p-12"
        style={{ backgroundColor: 'var(--background)' }}
      >
        {/* Mobile logo */}
        <div className="flex items-center gap-3 mb-8 lg:hidden">
          <div
            className="flex items-center justify-center rounded-lg text-[10px] font-bold uppercase tracking-wider"
            style={{ width: 32, height: 32, backgroundColor: 'var(--ink)', color: 'var(--ink-foreground)' }}
          >
            S
          </div>
          <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            {DEV_INSTITUTION_NAME}
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className={cn('w-full max-w-[520px]', 'animate-fade-up')}>

            <div className="mb-6">
              <h2
                className="t-h2 mb-1"
                style={{
                  fontFamily:    'var(--font-display)',
                  color:         'var(--foreground)',
                  letterSpacing: '-0.01em',
                }}
              >
                Create your applicant account
              </h2>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Already applied?{' '}
                <Link
                  to="/apply/track"
                  className="font-medium transition-opacity hover:opacity-70"
                  style={{ color: '#0D7A28', textDecoration: 'none' }}
                >
                  Track your application →
                </Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              {/* Full name — full width */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="e.g. Amina Uwase"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {/* Email + Phone — two column */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="phone">Phone number</Label>
                  <div className="flex">
                    <span
                      className="flex items-center px-3 rounded-l-md border border-r-0 text-sm select-none"
                      style={{
                        backgroundColor: 'var(--muted)',
                        borderColor:     'var(--border)',
                        color:           'var(--muted-foreground)',
                        flexShrink:      0,
                      }}
                    >
                      +250
                    </span>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="7XX XXX XXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="rounded-l-none"
                    />
                  </div>
                </div>
              </div>

              {/* Programme — full width */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="programme">Programme of interest</Label>
                <Select value={programme} onValueChange={setProgramme} required>
                  <SelectTrigger id="programme">
                    <SelectValue placeholder="Select a programme" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROGRAMMES.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Password + Confirm — two column */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <ToggleVisibility show={showPass} onToggle={() => setShowPass((v) => !v)} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <div className="relative">
                    <Input
                      id="confirm"
                      type={showConf ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      className="pr-10"
                      style={mismatch ? { borderColor: 'var(--error)' } : {}}
                    />
                    <ToggleVisibility show={showConf} onToggle={() => setShowConf((v) => !v)} />
                  </div>
                  {mismatch && (
                    <p className="text-xs" style={{ color: 'var(--error)' }}>Passwords do not match</p>
                  )}
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-11 font-semibold text-sm mt-1 transition-transform duration-150 hover:-translate-y-px active:translate-y-0"
                disabled={isLoading || mismatch}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Creating account…
                  </span>
                ) : (
                  'Create account'
                )}
              </Button>

              <p className="text-center" style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
                By creating an account you agree to our{' '}
                <span className="underline cursor-pointer">Terms</span>
                {' '}and{' '}
                <span className="underline cursor-pointer">Privacy Policy</span>
              </p>

            </form>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center" style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
          Powered by{' '}
          <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
            StackForgeAI
          </span>
        </p>
      </div>

    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function ToggleVisibility({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      tabIndex={-1}
      className="absolute right-3 top-1/2 -translate-y-1/2 rounded transition-colors"
      style={{ color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer' }}
      aria-label={show ? 'Hide password' : 'Show password'}
    >
      {show
        ? <EyeOff className="h-4 w-4" />
        : <Eye className="h-4 w-4" />}
    </button>
  )
}
