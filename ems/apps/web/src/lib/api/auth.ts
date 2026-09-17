import type { LoginRequest, LoginResponse, LogoutReason, SessionResponse, SessionUser } from '@stackedu/shared'
import { api, ApiClientError } from './client'

export const sessionQueryKey = ['auth', 'session'] as const

export type LoginResult = SessionUser | { requiresTwoFactor: true }

export async function login(input: LoginRequest): Promise<LoginResult> {
  const response = await api.post<LoginResponse>('/auth/login', input)
  if ('requiresTwoFactor' in response && response.requiresTwoFactor) {
    return { requiresTwoFactor: true }
  }
  if (!('user' in response)) {
    throw new Error('Sign-in did not return a user.')
  }
  return response.user
}

export async function verifyTwoFactor(code: string): Promise<SessionUser> {
  const { user } = await api.post<SessionResponse>('/auth/2fa/verify', { code })
  return user
}

/** The reason is recorded in the audit log, so idle sign-outs read differently. */
export async function logout(reason: LogoutReason = 'manual'): Promise<void> {
  await api.post<void>('/auth/logout', { reason })
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const { user } = await api.get<SessionResponse>('/auth/session')
    return user
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) return null
    throw error
  }
}
