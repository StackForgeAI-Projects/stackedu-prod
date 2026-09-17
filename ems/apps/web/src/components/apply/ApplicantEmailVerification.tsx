import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OtpInput } from '@/components/ui/otp-input'
import { useInstitutionBranding } from '@/hooks/useInstitutionBranding'
import {
  applicationQueryKey,
  resendApplicantVerification,
  verifyApplicantEmail,
} from '@/lib/api/admissions'
import { sessionQueryKey } from '@/lib/api/auth'
import { apiErrorMessage } from '@/lib/api/client'
import { queryClient } from '@/lib/query-client'

const RESEND_COOLDOWN = 30

interface ApplicantEmailVerificationProps {
  email: string
  fullName: string
  password: string
  onVerified: () => void | Promise<void>
  className?: string
}

/** Shared email verification step for the apply registration flow. */
export function ApplicantEmailVerification({
  email,
  fullName,
  password,
  onVerified,
  className,
}: ApplicantEmailVerificationProps) {
  const { institutionName, logoUrl } = useInstitutionBranding()
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN)
  const [canResend, setCanResend] = useState(false)

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true)
      return
    }
    const timer = setTimeout(() => setCountdown((value) => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const verify = useMutation({
    mutationFn: () => verifyApplicantEmail({ email, code: otp, password }),
    onSuccess: async (user) => {
      queryClient.setQueryData(sessionQueryKey, user)
      queryClient.removeQueries({ queryKey: applicationQueryKey })
      await onVerified()
    },
    onError: (cause) => {
      setError(apiErrorMessage(cause, 'That code is invalid or has expired.'))
    },
  })

  const resend = useMutation({
    mutationFn: () => resendApplicantVerification({ email }),
    onSuccess: () => {
      setCanResend(false)
      setCountdown(RESEND_COOLDOWN)
      setOtp('')
      setError(null)
    },
    onError: (cause) => {
      setError(apiErrorMessage(cause, 'Could not resend the code. Please try again.'))
    },
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (otp.length < 6) return
    setError(null)
    verify.mutate()
  }

  const handleResend = () => {
    if (!canResend || resend.isPending) return
    resend.mutate()
  }

  const isLoading = verify.isPending

  return (
    <div className={className}>
      <div className="mb-6 flex flex-col items-center text-center">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={institutionName}
            className="mb-4 h-14 w-14 rounded-xl object-contain"
            style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
          />
        ) : (
          <div
            className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl"
            style={{
              backgroundColor: 'rgba(var(--brand-rgb), 0.08)',
              border: '1px solid rgba(var(--brand-rgb), 0.2)',
            }}
          >
            <Mail size={24} style={{ color: 'var(--brand)' }} />
          </div>
        )}

        <p className="t-caption mb-1" style={{ color: 'var(--brand)' }}>
          Complete email verification
        </p>
        <h2
          className="t-h2 mb-2"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
        >
          Verify your account
        </h2>
        <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
          Hello, <strong style={{ color: 'var(--foreground)' }}>{fullName}</strong>. We sent a
          6-digit code to <strong style={{ color: 'var(--foreground)' }}>{email}</strong>. Enter it
          below to continue your application.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div
          className="rounded-xl p-4 sm:p-5"
          style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}
        >
          <p
            className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Verification code
          </p>
          <div className="flex justify-center overflow-x-auto pb-1">
            <OtpInput value={otp} onChange={setOtp} disabled={isLoading} autoFocus />
          </div>
        </div>

        {error && (
          <p className="text-sm text-center" style={{ color: 'var(--error)' }} role="alert">
            {error}
          </p>
        )}

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
            'Verify email'
          )}
        </Button>

        <div className="text-center">
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Didn&apos;t receive a code?{' '}
            {canResend ? (
              <button
                type="button"
                onClick={handleResend}
                disabled={resend.isPending}
                className="font-medium transition-opacity hover:opacity-70 disabled:opacity-50"
                style={{ color: 'var(--success)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {resend.isPending ? 'Sending…' : 'Resend code'}
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
          <p className="mt-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            This code expires in 15 minutes.
          </p>
        </div>
      </form>
    </div>
  )
}
