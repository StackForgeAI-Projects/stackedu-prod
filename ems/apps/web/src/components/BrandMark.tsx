import { Link } from '@tanstack/react-router'
import { useInstitutionBranding } from '@/hooks/useInstitutionBranding'
import { cn } from '@/lib/utils'

interface BrandMarkProps {
  /**
   * Where the mark navigates. Signed-in surfaces pass the role's dashboard,
   * signed-out ones pass "/" for sign-in. Omit it on the sign-in screen
   * itself, where the mark is decoration rather than a link.
   */
  to?: string
  /** Square size of the logo tile in pixels. */
  size?: number
  /**
   * Overrides the logo from ICT settings. Left unset, the mark resolves the
   * institution's own logo itself, so every surface stays in step with it.
   */
  institutionLogoUrl?: string | null
  wordmarkColor?: string
  wordmarkClassName?: string
  ariaLabel?: string
  className?: string
}

/**
 * The StackEDU logo and wordmark. Kept in one place so the artwork, the
 * fallback and the click target stay identical everywhere they appear.
 */
export function BrandMark({
  to,
  size = 32,
  institutionLogoUrl,
  wordmarkColor = '#FFFFFF',
  wordmarkClassName = 'text-[17px] font-bold tracking-tight truncate',
  ariaLabel = 'StackEDU home',
  className,
}: BrandMarkProps) {
  const { logoUrl, institutionName } = useInstitutionBranding()
  const logoSrc = institutionLogoUrl ?? logoUrl

  const content = (
    <>
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center font-bold tracking-widest uppercase',
            size >= 36 ? 'rounded-xl text-[11px]' : 'rounded-lg text-[10px]',
          )}
          style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}
        >
          S
        </div>
        <img
          src={logoSrc ?? '/stackedu-logo.webp'}
          alt={logoSrc ? institutionName : 'StackEDU'}
          className="absolute inset-0"
          style={{ width: size, height: size, objectFit: 'contain' }}
          onError={(e) => {
            if (logoSrc) {
              e.currentTarget.src = '/stackedu-logo.webp'
              return
            }
            e.currentTarget.style.display = 'none'
          }}
        />
      </div>

      <span
        className={wordmarkClassName}
        style={{ fontFamily: 'var(--font-display)', color: wordmarkColor }}
      >
        StackEDU
      </span>
    </>
  )

  if (!to) {
    return <div className={cn('flex items-center gap-3', className)}>{content}</div>
  }

  return (
    <Link
      to={to}
      aria-label={ariaLabel}
      className={cn(
        'flex items-center gap-3 outline-none transition-opacity hover:opacity-80',
        className,
      )}
      style={{ textDecoration: 'none' }}
    >
      {content}
    </Link>
  )
}
