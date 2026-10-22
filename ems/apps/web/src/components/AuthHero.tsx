import { CheckCircle2 } from 'lucide-react'
import { BrandMark } from '@/components/BrandMark'

/**
 * The dark panel beside the sign-in, apply and tracking forms.
 *
 * All three screens showed the same panel built three times over, which is how
 * they drifted apart. One component keeps the wording, spacing and logo
 * behaviour identical wherever it appears.
 */

// In production this comes from the public institution API (see useInstitutionBranding).
export const INSTITUTION_NAME = 'StackForgeAI University'

/** Written for someone reading English as a second language. */
export const SIGN_IN_FEATURES = [
  'See your results the moment they are released',
  'Pay your fees and get a receipt straight away',
  'Borrow and read library books online',
  'Check your timetable, attendance and deadlines',
  'Works on any phone, tablet or computer',
]

export const APPLY_FEATURES = [
  'Apply online in a few simple steps',
  'Save your answers and finish later',
  'Follow your application from start to decision',
  'Send your documents from your phone',
  'Accept your offer without coming to campus',
]

interface AuthHeroProps {
  title: string
  subtitle: string
  features: string[]
  institutionName?: string
  institutionLogoUrl?: string | null
  /** Where the logo goes. Omitted on the sign-in screen, which is already home. */
  logoTo?: string
  logoAriaLabel?: string
}

export function AuthHero({
  title,
  subtitle,
  features,
  institutionName = INSTITUTION_NAME,
  institutionLogoUrl,
  logoTo,
  logoAriaLabel,
}: AuthHeroProps) {
  return (
    <div
      className="hidden lg:flex lg:w-[42%] flex-col justify-between p-12 flex-shrink-0"
      style={{
        backgroundImage: [
          'linear-gradient(to bottom, rgba(5,19,29,0.72) 0%, rgba(5,19,29,0.88) 60%, rgba(5,19,29,0.97) 100%)',
          "url('/login-hero.webp')",
        ].join(', '),
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
      }}
    >
      <BrandMark
        size={36}
        institutionLogoUrl={institutionLogoUrl}
        wordmarkClassName="text-lg font-bold tracking-tight"
        {...(logoTo ? { to: logoTo } : {})}
        {...(logoAriaLabel ? { ariaLabel: logoAriaLabel } : {})}
      />

      <div className="space-y-8 max-w-md">
        <div>
          <h2
            className="t-display mb-4"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--ink-foreground)',
              fontSize: 'clamp(2.5rem, 4vw, 3.75rem)',
            }}
          >
            {title}
          </h2>
          <p className="t-body-lg" style={{ color: 'var(--ink-muted)', fontSize: '1.125rem' }}>
            {subtitle}
          </p>
        </div>

        <ul className="flex flex-col gap-4">
          {features.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <CheckCircle2
                size={18}
                style={{ color: 'var(--brand)', flexShrink: 0, marginTop: 2 }}
              />
              <span
                className="text-[0.9375rem]"
                style={{ color: 'var(--ink-foreground)', lineHeight: 1.55 }}
              >
                {item}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>
        {institutionName}
      </span>
    </div>
  )
}
