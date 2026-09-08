import { redirect } from '@tanstack/react-router'
import type { SessionUser } from '@stackedu/shared'
import { getSession, sessionQueryKey } from '@/lib/api/auth'
import { ApiClientError } from '@/lib/api/client'
import { queryClient } from '@/lib/query-client'
import { dashboardFor } from './portals'

function cachedSession(): SessionUser | null | undefined {
  const state = queryClient.getQueryState<SessionUser | null>(sessionQueryKey)
  if (!state || state.dataUpdatedAt <= 0) return undefined
  return state.data ?? null
}

/**
 * Reads the session inside a route guard.
 *
 * Guards run outside React, so they cannot use the hook. Going through the
 * query cache means one request serves both the guard and every component that
 * later asks who the user is.
 */
export async function loadSession(): Promise<SessionUser | null> {
  try {
    return await queryClient.ensureQueryData({
      queryKey: sessionQueryKey,
      queryFn: getSession,
      revalidateIfStale: true,
    })
  } catch (error) {
    // A brief connection loss should not tear down the whole portal shell.
    // Reuse the last known session when the API cannot be reached.
    if (error instanceof ApiClientError && error.code === 'NETWORK_ERROR') {
      const cached = cachedSession()
      if (cached !== undefined) return cached
      return null
    }
    throw error
  }
}

/**
 * Keeps a signed-in user off the sign-in screen.
 *
 * Someone who is already authenticated has no reason to see a login form, and
 * showing one invites them to wonder whether they are signed in at all.
 */
export async function redirectSignedInToDashboard(): Promise<void> {
  const user = await loadSession()
  if (user) throw redirect({ to: dashboardFor(user.role) })
}

/**
 * Sends an applicant who already has an account to their application, instead
 * of letting them start a second one from the registration screen.
 */
export async function redirectApplicantHome(): Promise<void> {
  const user = await loadSession()
  if (!user) return
  if (user.role === 'Applicant') {
    throw redirect({ to: '/apply/track' })
  }
  throw redirect({ to: dashboardFor(user.role) })
}

/**
 * Guards the application form and its follow-on screens.
 *
 * These read and write a specific application, so there has to be an applicant
 * signed in to own it. Anyone else is sent to where they belong.
 */
export async function requireApplicant(): Promise<void> {
  const user = await loadSession()
  if (!user) throw redirect({ to: '/apply/track' })
  if (user.role !== 'Applicant') throw redirect({ to: dashboardFor(user.role) })
}

/** Applicants must confirm their email before the form, documents or payment. */
export async function requireVerifiedApplicant(): Promise<void> {
  await requireApplicant()
  const user = await loadSession()
  if (user && !user.emailVerifiedAt) throw redirect({ to: '/apply/verify' })
}
