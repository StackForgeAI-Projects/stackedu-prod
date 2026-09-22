import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Eye, EyeOff, CheckCircle2, LockKeyhole } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/reset-password')({
  component: ResetPasswordPage,
})

// ── Password strength helper ─────────────────────────────────────────────────

type StrengthLevel = 'none' | 'weak' | 'medium' | 'strong'

interface StrengthResult {
  level: StrengthLevel
  label: string
  width: string
  color: string
}

function getPasswordStrength(password: string): StrengthResult {
  if (!password) {
    return { level: 'none', label: '', width: '0%', color: '' }
  }

  const hasLower   = /[a-z]/.test(password)
  const hasUpper   = /[A-Z]/.test(password)
  const hasNumber  = /\d/.test(password)
  const hasSpecial = /[^a-zA-Z0-9]/.test(password)
  const typeCount  = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length

  if (password.length < 8) {
    return { level: 'weak', label: 'Weak', width: '33%', color: 'var(--error)' }
  }
  if (typeCount >= 3) {
    return { level: 'strong', label: 'Strong', width: '100%', color: 'var(--success)' }
  }
  if (typeCount >= 2) {
    return { level: 'medium', label: 'Medium', width: '66%', color: 'var(--warning)' }
  }
  return { level: 'weak', label: 'Weak', width: '33%', color: 'var(--error)' }
}

// ─────────────────────────────────────────────────────────────────────────────

function ResetPasswordPage() {
  const navigate = useNavigate()

  const [newPassword, setNewPassword]         = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew]                 = useState(false)
  const [showConfirm, setShowConfirm]         = useState(false)
  const [isLoading, setIsLoading]             = useState(false)
  const [error, setError]                     = useState<string | null>(null)
  const [success, setSuccess]                 = useState(false)

  const strength = getPasswordStrength(newPassword)
  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Check and try again.')
      return
    }
    if (strength.level === 'weak' || strength.level === 'none') {
      setError('Choose a stronger password — at least 8 characters with a mix of letters and numbers.')
      return
    }

    setIsLoading(true)
    // TODO: call set-new-password API with token from URL search params
    await new Promise((r) => setTimeout(r, 1000))
    setIsLoading(false)
    setSuccess(true)
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ backgroundColor: 'var(--ink)' }}
    >
      <div
        className="w-full max-w-[440px] rounded-2xl p-8 sm:p-10 animate-fade-up"
        style={{
          backgroundColor: 'var(--card)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >

        {/* ── Form state ─────────────────────────────────────────────────────── */}
        {!success ? (
          <>
            {/* Icon mark */}
            <div
              className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: 'var(--muted)' }}
            >
              <LockKeyhole
                className="h-6 w-6"
                strokeWidth={1.5}
                style={{ color: 'var(--foreground)' }}
              />
            </div>

            <h1 className="t-h1 mb-2" style={{ color: 'var(--foreground)' }}>
              Set new password
            </h1>
            <p className="t-body mb-8" style={{ color: 'var(--muted-foreground)' }}>
              Your new password must be at least 8 characters.
            </p>

            {/* Error banner */}
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

              {/* New password */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-password">New password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNew ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    autoFocus
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded transition-colors"
                    style={{ color: 'var(--muted-foreground)' }}
                    tabIndex={-1}
                    aria-label={showNew ? 'Hide password' : 'Show password'}
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password strength indicator */}
                {newPassword && (
                  <div className="flex flex-col gap-1 pt-0.5">
                    {/* Bar track */}
                    <div
                      className="h-1 w-full overflow-hidden rounded-full"
                      style={{ backgroundColor: 'var(--muted)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-300 ease-out"
                        style={{
                          width: strength.width,
                          backgroundColor: strength.color,
                        }}
                      />
                    </div>
                    {/* Strength label */}
                    <p
                      className="text-xs font-medium"
                      style={{ color: strength.color }}
                    >
                      {strength.label}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    className={cn(
                      'pr-10',
                      mismatch && 'border-error focus-visible:ring-error',
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded transition-colors"
                    style={{ color: 'var(--muted-foreground)' }}
                    tabIndex={-1}
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {mismatch && (
                  <p className="text-xs" style={{ color: 'var(--error)' }}>
                    Passwords do not match.
                  </p>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-11 font-semibold text-sm transition-transform duration-150 hover:-translate-y-px active:translate-y-0 mt-1"
                disabled={isLoading || mismatch}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Updating…
                  </span>
                ) : (
                  'Set new password'
                )}
              </Button>

            </form>
          </>
        ) : (

          /* ── Success state — in-place, no navigation ─────────────────────── */
          <div className="flex flex-col items-center text-center py-4 animate-fade-up">
            <div
              className="mb-5 flex h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: 'var(--success-bg)' }}
            >
              <CheckCircle2
                className="h-7 w-7"
                strokeWidth={1.5}
                style={{ color: 'var(--success)' }}
              />
            </div>

            <h2 className="t-h2 mb-2" style={{ color: 'var(--foreground)' }}>
              Password updated
            </h2>
            <p className="t-body max-w-[280px]" style={{ color: 'var(--muted-foreground)' }}>
              You can now sign in with your new password.
            </p>

            <Button
              className="mt-8 w-full h-11 font-semibold text-sm transition-transform duration-150 hover:-translate-y-px active:translate-y-0"
              onClick={() => navigate({ to: '/login' })}
            >
              Back to sign in
            </Button>
          </div>
        )}

        {/* Divider + back link — only shown in form state */}
        {!success && (
          <>
            <div
              className="my-6 h-px"
              style={{ backgroundColor: 'var(--border)' }}
            />
            <div className="text-center">
              <Link
                to="/login"
                className="text-xs transition-opacity hover:opacity-70"
                style={{ color: 'var(--muted-foreground)' }}
              >
                ← Back to sign in
              </Link>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
