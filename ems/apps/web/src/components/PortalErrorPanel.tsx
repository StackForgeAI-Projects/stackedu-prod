import { useNavigate, useRouterState } from '@tanstack/react-router'
import { ArrowLeft, RefreshCw, AlertCircle, Server, Database, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { apiErrorDiagnosis, isApiBreakError } from '@/lib/api/client'
import { dashboardHrefForPath, normalizePath } from '@/lib/auth/portals'

interface PortalErrorPanelProps {
  error?: unknown
  title?: string
  message?: string
  dashboardHref?: string
  onRetry?: () => void
}

const BREAK_META: Record<
  'connection' | 'backend' | 'database',
  { icon: typeof WifiOff; badge: string; badgeBg: string; badgeColor: string }
> = {
  connection: {
    icon: WifiOff,
    badge: 'Connection issue',
    badgeBg: 'var(--error-bg)',
    badgeColor: 'var(--error)',
  },
  backend: {
    icon: Server,
    badge: 'Server error',
    badgeBg: 'var(--warning-bg)',
    badgeColor: 'var(--warning)',
  },
  database: {
    icon: Database,
    badge: 'Service unavailable',
    badgeBg: 'var(--warning-bg)',
    badgeColor: 'var(--warning)',
  },
}

export function PortalErrorPanel({
  error,
  title,
  message,
  dashboardHref,
  onRetry,
}: PortalErrorPanelProps) {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const homeHref = dashboardHref ?? dashboardHrefForPath(pathname)
  const onDashboard = normalizePath(pathname) === normalizePath(homeHref)

  const diagnosis = apiErrorDiagnosis(error, message ?? 'We could not load this page. Please try again.')
  const isBreak = error ? isApiBreakError(error) : false
  const breakMeta = diagnosis.breakCategory ? BREAK_META[diagnosis.breakCategory] : null
  const BreakIcon = breakMeta?.icon ?? AlertCircle
  const heading = title ?? (isBreak ? diagnosis.label : 'Something went wrong')

  const goDashboard = () => {
    void navigate({ to: homeHref as never })
  }

  return (
    <div
      className="mx-4 sm:mx-8 my-10 flex flex-col items-center justify-center text-center px-6 py-12"
      style={{
        maxWidth: 560,
        marginLeft: 'auto',
        marginRight: 'auto',
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        className="flex items-center justify-center rounded-full mb-5"
        style={{ width: 56, height: 56, backgroundColor: 'var(--error-bg)' }}
      >
        <BreakIcon style={{ width: 28, height: 28, color: 'var(--error)' }} />
      </div>

      {breakMeta ? (
        <span
          className="t-caption font-semibold uppercase tracking-wide mb-3 px-3 py-1 rounded-full"
          style={{ backgroundColor: breakMeta.badgeBg, color: breakMeta.badgeColor }}
        >
          {breakMeta.badge}
        </span>
      ) : null}

      <h2 className="t-h2 mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
        {heading}
      </h2>

      <p className="t-body mb-6" style={{ color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
        {message ?? diagnosis.message}
      </p>

      {diagnosis.requestId ? (
        <p className="t-caption mb-6" style={{ color: 'var(--muted-foreground)' }}>
          Reference: <code style={{ fontFamily: 'monospace' }}>{diagnosis.requestId}</code>
        </p>
      ) : null}

      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        {onRetry ? (
          <Button variant="outline" className="gap-2" onClick={onRetry}>
            <RefreshCw style={{ width: 15, height: 15 }} />
            Try again
          </Button>
        ) : null}
        {!onDashboard ? (
          <Button className="gap-2" onClick={goDashboard}>
            <ArrowLeft style={{ width: 15, height: 15 }} />
            Go back to dashboard
          </Button>
        ) : null}
      </div>
    </div>
  )
}
