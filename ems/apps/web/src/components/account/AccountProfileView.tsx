import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Mail, Pencil, Phone } from 'lucide-react'
import { STUDENT_IDENTITY_CONTACT_MESSAGE } from '@stackedu/shared'
import { FormInfoBox } from '@/components/FormInfoBox'
import { formInfo } from '@/lib/form-info-copy'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { OtpInput } from '@/components/ui/otp-input'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import {
  accountProfileQueryKey,
  getAccountProfile,
  requestStudentPhoneVerification,
  resendStudentPhoneVerification,
  updateAccountProfile,
  verifyStudentPhoneUpdate,
} from '@/lib/api/account'
import { apiErrorMessage } from '@/lib/api/client'
import { sessionQueryKey } from '@/lib/api/auth'
import { ictProfileQueryKey } from '@/lib/api/ict'
import { studentProfileQueryKey } from '@/lib/api/student'
import { initialsFrom } from '@/lib/utils'
import { notifyError, notifySuccess } from '@/lib/notify'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'

const PHONE_RESEND_COOLDOWN = 30

export interface ProfileField {
  icon: React.ElementType
  label: string
  value: string
  mono?: boolean
}

interface AccountProfileViewProps {
  breadcrumb: string
  subtitle: string
  extraFields?: ProfileField[]
  /** When true, name and email are read-only; only phone can be updated (with verification). */
  lockIdentityFields?: boolean
}

export function AccountProfileView({
  breadcrumb,
  subtitle,
  extraFields = [],
  lockIdentityFields = false,
}: AccountProfileViewProps) {
  const queryClient = useQueryClient()
  const { data, isPending, error } = useQuery({ queryKey: accountProfileQueryKey, queryFn: getAccountProfile })
  const [open, setOpen] = useState(false)
  const [confirmSave, setConfirmSave] = useState(false)

  const mutation = useMutation({
    mutationFn: updateAccountProfile,
    onSuccess: async (result) => {
      queryClient.setQueryData(accountProfileQueryKey, result.profile)
      queryClient.setQueryData(sessionQueryKey, result.user)
      await queryClient.invalidateQueries({ queryKey: studentProfileQueryKey })
      await queryClient.invalidateQueries({ queryKey: ictProfileQueryKey })
      notifySuccess('Profile updated.')
      setConfirmSave(false)
      setOpen(false)
    },
    onError: (cause) => notifyError(apiErrorMessage(cause, 'Could not update your profile.')),
  })

  const invalidateProfile = async () => {
    await queryClient.invalidateQueries({ queryKey: accountProfileQueryKey })
    await queryClient.invalidateQueries({ queryKey: studentProfileQueryKey })
    await queryClient.invalidateQueries({ queryKey: ictProfileQueryKey })
  }

  if (isPending) return <p className="t-body p-8" style={{ color: 'var(--muted-foreground)' }}>Loading profile…</p>
  if (error || !data) {
    return <p className="t-body p-8" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load your profile.')}</p>
  }

  const fields: ProfileField[] = [
    { icon: Mail, label: 'Email', value: data.email },
    { icon: Phone, label: 'Phone', value: data.phone ?? '—' },
    ...extraFields,
  ]

  return (
    <div className="animate-fade-up" style={{ padding: '32px 16px 48px', maxWidth: 760, margin: '0 auto' }}>
      <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--muted-foreground)', fontSize: '0.8125rem' }}>
        <span>{breadcrumb}</span>
        <span>›</span>
        <span style={{ color: 'var(--foreground)' }}>My Profile</span>
      </div>
      <h1 className="t-h1 mb-6" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.015em' }}>My Profile</h1>

      <div
        className="flex flex-col sm:flex-row sm:items-center gap-5 mb-6"
        style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 28 }}
      >
        <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 72, height: 72, backgroundColor: 'var(--ink)' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--brand)' }}>
            {initialsFrom(data.fullName)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="t-h2" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>{data.fullName}</h2>
          <p className="t-body mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{subtitle}</p>
        </div>
        <Button variant="outline" className="gap-2 flex-shrink-0" onClick={() => setOpen(true)}>
          <Pencil size={14} />
          Edit profile
        </Button>
      </div>

      <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 28 }}>
        <h3 className="t-h3 mb-5" style={{ fontFamily: 'var(--font-display)' }}>Personal Information</h3>
        {fields.map((field, index) => (
          <div
            key={field.label}
            className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-3.5"
            style={{ borderBottom: index === fields.length - 1 ? 'none' : '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 34, height: 34, backgroundColor: 'var(--muted)' }}>
              <field.icon size={15} style={{ color: 'var(--muted-foreground)' }} />
            </div>
            <span className="t-label flex-shrink-0" style={{ color: 'var(--muted-foreground)', width: 140 }}>{field.label}</span>
            <span className="text-sm flex-1 break-all" style={{ fontFamily: field.mono ? 'var(--font-mono)' : undefined }}>{field.value}</span>
          </div>
        ))}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="p-0 border-l overflow-hidden flex flex-col w-full sm:max-w-md">
          {lockIdentityFields ? (
            <StudentPhoneProfileEditor
              profile={{ fullName: data.fullName, email: data.email, phone: data.phone ?? '' }}
              onClose={() => setOpen(false)}
              onVerified={async (result) => {
                queryClient.setQueryData(accountProfileQueryKey, result.profile)
                queryClient.setQueryData(sessionQueryKey, result.user)
                await invalidateProfile()
                notifySuccess('Phone number updated.')
                setOpen(false)
              }}
            />
          ) : (
            <EditProfileForm
              profile={{ fullName: data.fullName, email: data.email, phone: data.phone ?? '' }}
              saving={mutation.isPending}
              confirmOpen={confirmSave}
              onConfirmOpenChange={setConfirmSave}
              onSave={(payload) => mutation.mutate(payload)}
              onClose={() => { setConfirmSave(false); setOpen(false) }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function IdentityLockedNotice() {
  return (
    <div
      className="flex gap-3 rounded-xl px-3.5 py-3"
      style={{ backgroundColor: 'rgba(var(--brand-rgb), 0.08)', border: '1px solid rgba(var(--brand-rgb), 0.2)' }}
      role="note"
    >
      <AlertCircle size={18} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--brand)' }} />
      <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
        {STUDENT_IDENTITY_CONTACT_MESSAGE}
      </p>
    </div>
  )
}

function LockedIdentityFields({
  fullName,
  email,
}: {
  fullName: string
  email: string
}) {
  return (
    <>
      <IdentityLockedNotice />
      <div className="flex flex-col gap-1.5">
        <Label>Full Name</Label>
        <Input value={fullName} readOnly aria-readonly className="cursor-not-allowed opacity-80" style={{ backgroundColor: 'var(--muted)' }} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Email</Label>
        <Input type="email" value={email} readOnly aria-readonly className="cursor-not-allowed opacity-80" style={{ backgroundColor: 'var(--muted)' }} />
      </div>
    </>
  )
}

function StudentPhoneProfileEditor({
  profile,
  onClose,
  onVerified,
}: {
  profile: { fullName: string; email: string; phone: string }
  onClose: () => void
  onVerified: (result: Awaited<ReturnType<typeof verifyStudentPhoneUpdate>>) => void | Promise<void>
}) {
  const [step, setStep] = useState<'edit' | 'verify'>('edit')
  const [phone, setPhone] = useState(profile.phone)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(PHONE_RESEND_COOLDOWN)
  const [canResend, setCanResend] = useState(false)

  const normalisedPhone = phone.trim().replace(/[\s-]/g, '')
  const phoneChanged = normalisedPhone !== profile.phone.trim().replace(/[\s-]/g, '')
  const phoneValid = /^\+[1-9]\d{7,14}$/.test(normalisedPhone)

  useEffect(() => {
    if (step !== 'verify' || countdown <= 0) {
      setCanResend(true)
      return
    }
    const timer = setTimeout(() => setCountdown((value) => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown, step])

  const requestCode = useMutation({
    mutationFn: () => requestStudentPhoneVerification(normalisedPhone),
    onSuccess: () => {
      setError(null)
      setOtp('')
      setCountdown(PHONE_RESEND_COOLDOWN)
      setCanResend(false)
      setStep('verify')
    },
    onError: (cause) => setError(apiErrorMessage(cause, 'Could not send a verification code.')),
  })

  const verify = useMutation({
    mutationFn: () => verifyStudentPhoneUpdate(normalisedPhone, otp),
    onSuccess: async (result) => {
      setError(null)
      await onVerified(result)
    },
    onError: (cause) => setError(apiErrorMessage(cause, 'That code is invalid or has expired.')),
  })

  const resend = useMutation({
    mutationFn: () => resendStudentPhoneVerification(normalisedPhone),
    onSuccess: () => {
      setCanResend(false)
      setCountdown(PHONE_RESEND_COOLDOWN)
      setOtp('')
      setError(null)
    },
    onError: (cause) => setError(apiErrorMessage(cause, 'Could not resend the code. Please try again.')),
  })

  const busy = requestCode.isPending || verify.isPending || resend.isPending

  if (step === 'verify') {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-shrink-0 px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
            Verify phone number
          </h2>
          <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Enter the 6-digit code sent to <strong style={{ color: 'var(--foreground)' }}>{normalisedPhone}</strong>.
          </p>
        </div>
        <form
          className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (otp.length < 6) return
            setError(null)
            verify.mutate()
          }}
        >
          <OtpInput value={otp} onChange={setOtp} disabled={verify.isPending} />
          {error ? (
            <p className="text-sm" style={{ color: 'var(--error)' }} role="alert">{error}</p>
          ) : null}
          <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
            {canResend ? (
              <button
                type="button"
                className="underline underline-offset-2 disabled:opacity-50"
                disabled={resend.isPending}
                onClick={() => resend.mutate()}
              >
                Resend code
              </button>
            ) : (
              <>Resend available in {countdown}s</>
            )}
          </p>
        </form>
        <div className="flex-shrink-0 flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <Button variant="outline" disabled={busy} onClick={() => { setStep('edit'); setError(null); setOtp('') }}>
            Back
          </Button>
          <Button disabled={verify.isPending || otp.length < 6} onClick={() => verify.mutate()}>
            {verify.isPending ? 'Verifying…' : 'Confirm phone'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600, letterSpacing: '-0.01em' }}>Edit Profile</h2>
        <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>Update your phone number. Your name and email can only be changed by ICT.</p>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="flex flex-col gap-4">
          <LockedIdentityFields fullName={profile.fullName} email={profile.email} />
          <div className="flex flex-col gap-1.5">
            <Label>Phone</Label>
            <Input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+250788123456"
              inputMode="tel"
              autoComplete="tel"
            />
          </div>
          {error ? (
            <p className="text-sm" style={{ color: 'var(--error)' }} role="alert">{error}</p>
          ) : null}
        </div>
      </div>
      <div className="flex-shrink-0 flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid var(--border)' }}>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          disabled={busy || !phoneChanged || !phoneValid}
          onClick={() => {
            setError(null)
            requestCode.mutate()
          }}
        >
          {requestCode.isPending ? 'Sending code…' : 'Save changes'}
        </Button>
      </div>
    </div>
  )
}

function EditProfileForm({
  profile,
  saving,
  confirmOpen,
  onConfirmOpenChange,
  onSave,
  onClose,
}: {
  profile: { fullName: string; email: string; phone: string }
  saving: boolean
  confirmOpen: boolean
  onConfirmOpenChange: (open: boolean) => void
  onSave: (data: { fullName: string; email: string; phone: string | null }) => void
  onClose: () => void
}) {
  const [fullName, setFullName] = useState(profile.fullName)
  const [email, setEmail] = useState(profile.email)
  const [phone, setPhone] = useState(profile.phone)

  const payload = {
    fullName: fullName.trim(),
    email: email.trim(),
    phone: phone.trim() ? phone.trim().replace(/[\s-]/g, '') : null,
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600, letterSpacing: '-0.01em' }}>Edit Profile</h2>
        <FormInfoBox lines={formInfo.editProfile} />
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Full Name</Label>
            <Input value={fullName} onChange={(event) => setFullName(event.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Phone</Label>
            <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+250788123456" />
          </div>
        </div>
      </div>
      <div className="flex-shrink-0 flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid var(--border)' }}>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          disabled={saving || !fullName.trim() || !email.trim()}
          onClick={() => onConfirmOpenChange(true)}
        >
          Save changes
        </Button>
      </div>
      <ConfirmAlertDialog
        open={confirmOpen}
        onOpenChange={(open) => { if (!open) onConfirmOpenChange(false) }}
        title="Save these profile changes?"
        tone="success"
        headlineLabel="Action"
        headline="Update profile"
        summary="Your name, email, and phone on this account will be updated."
        notices={[{ icon: 'info', label: 'You will use the new email the next time you sign in.' }]}
        confirmLabel={saving ? 'Saving…' : 'Confirm'}
        confirmVariant="brand"
        loading={saving}
        onCancel={() => onConfirmOpenChange(false)}
        onConfirm={() => onSave(payload)}
      />
    </div>
  )
}
