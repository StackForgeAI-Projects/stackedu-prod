import type { LogoutReason } from '@stackedu/shared'
import { logout, sessionQueryKey } from '@/lib/api/auth'
import { rememberInactivityLogout, inactivityLogoutDestination } from '@/lib/inactivity-logout-notice'
import { queryClient } from '@/lib/query-client'

export async function performSignOutRedirect(
  destination: string,
  reason: LogoutReason = 'manual',
): Promise<void> {
  await queryClient.cancelQueries()
  await logout(reason).catch(() => undefined)
  queryClient.setQueryData(sessionQueryKey, null)
  queryClient.removeQueries()
  window.location.replace(destination)
}

/**
 * Ends the session after idle timeout without surfacing API errors from
 * in-flight dashboard queries. A hard navigation clears React state cleanly.
 */
export async function performInactivityLogout(destination = '/login'): Promise<void> {
  rememberInactivityLogout()
  await performSignOutRedirect(inactivityLogoutDestination(destination), 'inactivity')
}
