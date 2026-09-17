import { formatDateTime } from '@/lib/utils'

export {
  auditActionLabel,
  auditSummary,
  buildAuditDetail,
  displayRole,
} from '@stackedu/shared'

export function integrationStatusLabel(isEnabled: boolean): string {
  return isEnabled ? 'Currently on' : 'Currently off'
}

export function integrationLastCheckLabel(status: string | null, checkedAt: string | null): string {
  const when = checkedAt ? formatDateTime(checkedAt) : null
  const readable = status === 'Enabled'
    ? 'Last seen as on'
    : status === 'Disabled'
      ? 'Last seen as off'
      : status
        ? status
        : 'Not checked yet'
  if (!status && !when) return 'Not checked yet'
  return when ? `${readable} · ${when}` : readable
}

export function integrationCheckFailed(status: string | null): boolean {
  if (!status) return false
  const lower = status.toLowerCase()
  return (
    lower.includes('turned off')
    || lower.startsWith('add ')
    || lower.includes('rejected')
    || lower.includes('could not reach')
    || lower.includes('returned http')
  )
}
