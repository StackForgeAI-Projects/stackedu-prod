import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OtpInput } from '@/components/ui/otp-input'
import { ApplyTopBar } from '@/components/ApplyLayout'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/apply/verify')({
  component: ApplyVerifyPage,
})

const RESEND_COOLDOWN = 30

// ─────────────────────────────────────────────────────────────────────────────

function ApplyVerifyPage() {
  const navigate = useNavigate()

  const [otp,       setOtp]       = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN)
  const [canResend, setCanResend] = useState(false)

  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length < 6) return
    setError(null)
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 1000))
    setIsLoading(false)
    navigate({ to: '/apply/form' })
  }

  const handleResend = () => {
    if (!canResend) return
    setCanResend(false)
    setCountdown(RESEND_COOLDOWN)
    setOtp('')
    setError(null)
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
          {/* Icon mark */}
          <div
            className="mb-6 flex items-center justify-center rounded-xl"
            style={{
              width:           48,
              height:          48,
              backgroundColor: 'rgba(32,244,78,0.08)',
              border:          '1px solid rgba(32,244,78,0.2)',
            }}
          >
            <Mail size={22} style={{ color: 'var(--brand)' }} />
          </div>

          <h2
            className="t-h2 mb-2"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
          >
            Verify your account
          </h2>
          <p className="t-body mb-8" style={{ color: 'var(--muted-foreground)' }}>
            Enter the 6-digit code sent to your email and phone.
          </p>

          <form onSubmit={handleVerify} className="flex flex-col gap-6">

            <div className="flex flex-col items-center gap-3">
              <OtpInput
                value={otp}
                onChange={setOtp}
                disabled={isLoading}
                autoFocus
              />
              {error && (
                <p className="text-sm text-center" style={{ color: 'var(--error)' }} role="alert">
                  {error}
                </p>
              )}
            </div>

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

            <div className="text-center">
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Didn't receive a code?{' '}
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="font-medium transition-opacity hover:opacity-70"
                    style={{ color: '#16A34A', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Resend code
                  </button>
                ) : (
                  <span style={{ color: 'var(--muted-foreground)' }}>
                    Resend in{' '}
                    <span className="font-semibold tabular-nums" style={{ color: 'var(--foreground)' }}>
                      {String(countdown).padStart(2, '0')}s
                    </span>
                  </span>
                )}
              </p>
            </div>

          </form>

          <div className="my-6" style={{ height: 1, backgroundColor: 'var(--border)' }} />

          <div className="text-center">
            <Link
              to="/apply"
              className="text-xs transition-opacity hover:opacity-70"
              style={{ color: 'var(--muted-foreground)', textDecoration: 'none' }}
            >
              ← Wrong details? Go back
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
