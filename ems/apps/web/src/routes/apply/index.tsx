import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Eye, EyeOff } from 'lucide-react'
import { ApplicantEmailVerification } from '@/components/apply/ApplicantEmailVerification'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { BrandMark } from '@/components/BrandMark'
import { FormInfoBox } from '@/components/FormInfoBox'
import { formInfo } from '@/lib/form-info-copy'
import { APPLY_FEATURES, AuthHero } from '@/components/AuthHero'
import { getProgrammes, programmesQueryKey, registerApplicant } from '@/lib/api/admissions'
import { apiErrorMessage } from '@/lib/api/client'
import { redirectApplicantHome } from '@/lib/auth/guards'
import { useInstitutionBranding } from '@/hooks/useInstitutionBranding'
import { notifyError, notifySuccess } from '@/lib/notify'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/apply/')({
  beforeLoad: redirectApplicantHome,
  component: ApplyCreateAccountPage,
})

// ─────────────────────────────────────────────────────────────────────────────

function ApplyCreateAccountPage() {
  const navigate = useNavigate()
  const { institutionName, logoUrl } = useInstitutionBranding()

  const [fullName,   setFullName]   = useState('')
  const [email,      setEmail]      = useState('')
  const [phone,      setPhone]      = useState('')
  const [programmeId, setProgrammeId] = useState('')
  const [password,   setPassword]   = useState('')
  const [confirm,    setConfirm]    = useState('')
  const [showPass,   setShowPass]   = useState(false)
  const [showConf,   setShowConf]   = useState(false)
  const [verifyOpen, setVerifyOpen] = useState(false)
  const [registered, setRegistered] = useState<{
    email: string
    fullName: string
    password: string
  } | null>(null)

  const { data: programmes = [], isPending: programmesLoading } = useQuery({
    queryKey: programmesQueryKey,
    queryFn: getProgrammes,
  })

  const register = useMutation({
    mutationFn: registerApplicant,
    onSuccess: (result) => {
      setRegistered({ email: result.email, fullName: result.fullName, password })
      setVerifyOpen(true)
    },
    onError: (error: unknown) => {
      notifyError(apiErrorMessage(error, 'We could not create your account. Please try again.'))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName || !email || !phone || !programmeId || !password || password !== confirm) return
    register.mutate({ fullName, email, phone: toInternational(phone), programmeId, password })
  }

  const mismatch = confirm.length > 0 && password !== confirm
  const isLoading = register.isPending

  return (
    <>
      <div className="flex min-h-screen">
        <AuthHero
          title="Apply for admission"
          subtitle={`Start your application to ${institutionName}`}
          features={APPLY_FEATURES}
          institutionName={institutionName}
          institutionLogoUrl={logoUrl}
          logoTo="/"
          logoAriaLabel="Go to sign in"
        />

        <div
          className="flex lg:w-[58%] flex-1 flex-col p-8 sm:p-12"
          style={{ backgroundColor: 'var(--background)' }}
        >
          <div className="mb-8 lg:hidden">
            <BrandMark
              to="/"
              size={32}
              institutionLogoUrl={logoUrl}
              ariaLabel="Go to sign in"
              wordmarkColor="var(--foreground)"
              wordmarkClassName="text-base font-bold tracking-tight"
            />
          </div>

          <div className="flex flex-1 items-center justify-center">
            <div className={cn('w-full max-w-[520px]', 'animate-fade-up')}>
              <div className="mb-6">
                <p
                  className="text-sm font-medium mb-1 lg:hidden"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {institutionName}
                </p>
                <h2
                  className="t-h1 mb-2"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
                >
                  Create your applicant account
                </h2>
                <FormInfoBox lines={formInfo.createApplicantAccount} />
                <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
                  Already applied?{' '}
                  <Link
                    to="/apply/track"
                    className="font-medium transition-opacity hover:opacity-70"
                    style={{ color: 'var(--success)', textDecoration: 'none' }}
                  >
                    Track your application →
                  </Link>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="programme">Programme of interest</Label>
                  <Select value={programmeId} onValueChange={setProgrammeId} required>
                    <SelectTrigger id="programme">
                      <SelectValue
                        placeholder={programmesLoading ? 'Loading programmes…' : 'Select a programme'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {programmes.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} · {p.level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          <p className="mt-6 text-center" style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
            Powered by{' '}
            <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
              StackForgeAI
            </span>
          </p>
        </div>
      </div>

      <Dialog
        open={verifyOpen}
        onOpenChange={(open) => {
          if (open) setVerifyOpen(true)
        }}
      >
        <DialogContent className="max-w-[520px] p-0 gap-0 overflow-hidden [&>button.absolute]:hidden">
          <div className="p-6 sm:p-8">
            <DialogHeader className="sr-only">
              <DialogTitle>Verify your email</DialogTitle>
              <DialogDescription>Enter the verification code sent to your email.</DialogDescription>
            </DialogHeader>
            {registered ? (
              <ApplicantEmailVerification
                email={registered.email}
                fullName={registered.fullName}
                password={registered.password}
                onVerified={async () => {
                  notifySuccess('Email verified. Let us start your application.')
                  setVerifyOpen(false)
                  setRegistered(null)
                  await navigate({ to: '/apply/form', search: { step: undefined } })
                }}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function toInternational(local: string): string {
  return `+250${local.replace(/\D/g, '').replace(/^0+/, '')}`
}

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
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  )
}
