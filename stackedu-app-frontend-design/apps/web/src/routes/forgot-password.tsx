import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { CheckCircle2, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
})

// ─────────────────────────────────────────────────────────────────────────────

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    // TODO: call password reset API
    await new Promise((r) => setTimeout(r, 1000))
    setIsLoading(false)
    setSubmitted(true)
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

        {/* ── Default state ──────────────────────────────────────────────────── */}
        {!submitted ? (
          <>
            {/* Icon mark */}
            <div
              className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: 'var(--muted)' }}
            >
              <KeyRound
                className="h-6 w-6"
                strokeWidth={1.5}
                style={{ color: 'var(--foreground)' }}
              />
            </div>

            <h1 className="t-h1 mb-2" style={{ color: 'var(--foreground)' }}>
              Reset your password
            </h1>
            <p className="t-body mb-8" style={{ color: 'var(--muted-foreground)' }}>
              Enter your institutional email and we'll send a reset link.
            </p>

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

              <Button
                type="submit"
                className="w-full h-11 font-semibold text-sm transition-transform duration-150 hover:-translate-y-px active:translate-y-0"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Sending…
                  </span>
                ) : (
                  'Send reset link'
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
              Reset link sent
            </h2>
            <p className="t-body max-w-[300px]" style={{ color: 'var(--muted-foreground)' }}>
              Check your inbox and follow the link to set a new password.
            </p>

            <p
              className="mt-3 text-xs"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Sent to{' '}
              <span
                className="font-medium"
                style={{ color: 'var(--foreground)' }}
              >
                {email}
              </span>
            </p>
          </div>
        )}

        {/* Divider */}
        <div
          className="my-6 h-px"
          style={{ backgroundColor: 'var(--border)' }}
        />

        {/* Back to login */}
        <div className="text-center">
          <Link
            to="/login"
            className="text-xs transition-opacity hover:opacity-70"
            style={{ color: 'var(--muted-foreground)' }}
          >
            ← Back to sign in
          </Link>
        </div>

      </div>
    </div>
  )
}
