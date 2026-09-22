import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OtpInput } from '@/components/ui/otp-input'

export const Route = createFileRoute('/verify')({
  component: VerifyPage,
})

const RESEND_COOLDOWN = 30

// ─────────────────────────────────────────────────────────────────────────────

function VerifyPage() {
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN)
  const [canResend, setCanResend] = useState(false)

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true)
      return
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length < 6) return
    setError(null)
    setIsLoading(true)
    // TODO: replace with real OTP verification
    await new Promise((r) => setTimeout(r, 1000))
    setIsLoading(false)
    // On success: navigate to role dashboard
  }

  const handleResend = async () => {
    if (!canResend) return
    setCanResend(false)
    setCountdown(RESEND_COOLDOWN)
    setOtp('')
    setError(null)
    // TODO: call resend OTP API
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

        {/* Icon mark */}
        <div
          className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl"
          style={{ backgroundColor: 'var(--muted)' }}
        >
          <ShieldCheck
            className="h-6 w-6"
            strokeWidth={1.5}
            style={{ color: 'var(--brand)' }}
          />
        </div>

        {/* Heading */}
        <h1 className="t-h1 mb-2" style={{ color: 'var(--foreground)' }}>
          Check your device
        </h1>
        <p className="t-body mb-8" style={{ color: 'var(--muted-foreground)' }}>
          Enter the 6-digit code sent to your phone or email.
        </p>

        <form onSubmit={handleVerify} className="flex flex-col gap-6">

          {/* OTP input */}
          <div className="flex flex-col items-center gap-4">
            <OtpInput
              value={otp}
              onChange={setOtp}
              disabled={isLoading}
              autoFocus
            />

            {/* Inline error */}
            {error && (
              <p
                className="text-sm text-center"
                style={{ color: 'var(--error)' }}
                role="alert"
              >
                {error}
              </p>
            )}
          </div>

          {/* Verify button */}
          <Button
            type="submit"
            className="w-full h-11 font-semibold text-sm transition-transform duration-150 hover:-translate-y-px active:translate-y-0"
            disabled={isLoading || otp.length < 6}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Verifying…
              </span>
            ) : (
              'Verify'
            )}
          </Button>

          {/* Resend link + countdown */}
          <div className="text-center">
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Didn't receive a code?{' '}
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  className="font-medium underline-offset-4 hover:underline transition-opacity"
                  style={{ color: 'var(--brand)' }}
                >
                  Resend code
                </button>
              ) : (
                <span style={{ color: 'var(--muted-foreground)' }}>
                  Resend in{' '}
                  <span
                    className="font-semibold tabular-nums"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {String(countdown).padStart(2, '0')}s
                  </span>
                </span>
              )}
            </p>
          </div>

        </form>

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
