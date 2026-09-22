import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

// In production these come from subdomain detection — e.g. kigali.stackedu.rw
// resolves to the institution's name and logo. Defaults are for development.
const DEV_INSTITUTION_NAME = 'StackForgeAI University'
const DEV_INSTITUTION_LOGO: string | null = null

// ─────────────────────────────────────────────────────────────────────────────

function LoginPage() {
  const institutionName = DEV_INSTITUTION_NAME
  const institutionLogo = DEV_INSTITUTION_LOGO

  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    // TODO: replace with real session auth
    await new Promise((r) => setTimeout(r, 1000))
    setIsLoading(false)
    // On success: navigate to /verify (if 2FA) or role dashboard
    // navigate({ to: '/verify' })
  }

  return (
    <div className="flex min-h-screen">

      {/* ── Left panel — Ink dark ───────────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[42%] flex-col justify-between p-12 flex-shrink-0"
        style={{
          backgroundImage: [
            'linear-gradient(to bottom, rgba(5,19,29,0.72) 0%, rgba(5,19,29,0.88) 60%, rgba(5,19,29,0.97) 100%)',
            "url('/login-hero.jpg')",
          ].join(', '),
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
        }}
      >
        {/* Institution mark */}
        <div className="flex items-center gap-3">
          {institutionLogo ? (
            <img
              src={institutionLogo}
              alt={institutionName}
              className="h-9 w-9 rounded-xl object-contain bg-white p-1"
            />
          ) : (
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 text-[11px] font-bold tracking-widest uppercase"
              style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}
            >
              {institutionName.charAt(0)}
            </div>
          )}
          <span
            className="text-sm font-medium truncate"
            style={{ color: 'var(--ink-muted)' }}
          >
            {institutionName}
          </span>
        </div>

        {/* Centre content */}
        <div className="space-y-4 max-w-xs">
          <h2
            className="t-h1"
            style={{ color: 'var(--ink-foreground)' }}
          >
            {institutionName}
          </h2>
          <p
            className="t-body-lg leading-relaxed"
            style={{ color: 'var(--ink-muted)' }}
          >
            One platform. Every campus.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <div
              className="h-[3px] w-8 rounded-full"
              style={{ backgroundColor: 'var(--brand)' }}
            />
            <span
              className="text-xs"
              style={{ color: 'var(--ink-muted)' }}
            >
              Admissions · Results · Fees · Library
            </span>
          </div>
        </div>

        {/* Bottom — StackEDU attribution */}
        <div className="flex items-center gap-2">
          <span
            className="text-[11px] font-semibold tracking-wider uppercase"
            style={{ color: 'var(--ink-muted)' }}
          >
            StackEDU
          </span>
          <span style={{ color: 'var(--ink-border)' }}>·</span>
          <span
            className="text-[11px]"
            style={{ color: 'var(--ink-muted)' }}
          >
            by StackForgeAI
          </span>
        </div>
      </div>

      {/* ── Right panel — Light ─────────────────────────────────────────────── */}
      <div
        className="flex lg:w-[58%] flex-1 flex-col p-8 sm:p-12"
        style={{ backgroundColor: 'var(--background)' }}
      >
        {/* Mobile-only institution mark */}
        <div className="flex items-center gap-3 mb-10 lg:hidden">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold uppercase tracking-wider"
            style={{ backgroundColor: 'var(--ink)', color: 'var(--ink-foreground)' }}
          >
            {institutionName.charAt(0)}
          </div>
          <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            {institutionName}
          </span>
        </div>

        {/* Form — vertically centred in remaining space */}
        <div className="flex flex-1 items-center justify-center">
          <div className={cn('w-full max-w-[400px]', 'animate-fade-up')}>

            <div className="mb-8">
              <h1 className="t-h1 mb-2" style={{ color: 'var(--foreground)' }}>
                Sign in
              </h1>
              <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
                Enter your institutional credentials to continue.
              </p>
            </div>

            {/* Inline error banner */}
            {error && (
              <div
                className="mb-5 rounded-lg border px-4 py-3 text-sm"
                style={{
                  backgroundColor: 'var(--error-bg)',
                  borderColor: 'var(--error)',
                  color: 'var(--error)',
                }}
                role="alert"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@university.ac.rw"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  autoFocus
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded transition-colors"
                    style={{ color: 'var(--muted-foreground)' }}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword
                      ? <EyeOff className="h-4 w-4" />
                      : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me + Forgot password row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(v) => setRememberMe(v as boolean)}
                  />
                  <Label
                    htmlFor="remember"
                    className="cursor-pointer font-normal text-sm"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Remember me
                  </Label>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium transition-opacity hover:opacity-70"
                  style={{ color: 'var(--brand)' }}
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-11 font-semibold text-sm transition-transform duration-150 hover:-translate-y-px active:translate-y-0"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Signing in…
                  </span>
                ) : (
                  'Sign in'
                )}
              </Button>

            </form>
          </div>
        </div>

        {/* Footer */}
        <p
          className="mt-6 text-center"
          style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}
        >
          Powered by{' '}
          <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
            StackForgeAI
          </span>
        </p>
      </div>

    </div>
  )
}
