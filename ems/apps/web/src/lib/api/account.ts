import type {
  AccountLiveCursor,
  AccountNotification,
  AccountProfile,
  ChangePasswordRequest,
  DisableTwoFactorRequest,
  EnableTwoFactorRequest,
  NotificationPreferenceItem,
  SessionUser,
  TwoFactorSetupResponse,
  UpdateAccountProfileRequest,
  UpdateAccountSecurityRequest,
  UpdateNotificationPreferencesRequest,
} from '@stackedu/shared'
import { api } from './client'

export const accountProfileQueryKey = ['account', 'profile'] as const
export const accountNotificationPrefsQueryKey = ['account', 'notification-preferences'] as const
export const accountNotificationsQueryKey = ['account', 'notifications'] as const
export const accountLiveQueryKey = ['account', 'live'] as const

export async function getAccountProfile(): Promise<AccountProfile> {
  const { profile } = await api.get<{ profile: AccountProfile }>('/account/profile')
  return profile
}

export async function updateAccountProfile(input: UpdateAccountProfileRequest) {
  return api.patch<{ profile: AccountProfile; user: SessionUser }>('/account/profile', input)
}

export async function requestStudentPhoneVerification(phone: string) {
  return api.post<{ ok: boolean }>('/account/phone/verify-request', { phone })
}

export async function verifyStudentPhoneUpdate(phone: string, code: string) {
  return api.post<{ profile: AccountProfile; user: SessionUser }>('/account/phone/verify', { phone, code })
}

export async function resendStudentPhoneVerification(phone: string) {
  return api.post<{ ok: boolean }>('/account/phone/resend', { phone })
}

export async function changeAccountPassword(input: ChangePasswordRequest) {
  return api.post<{ ok: boolean }>('/account/password', input)
}

export async function updateAccountSecurity(input: UpdateAccountSecurityRequest) {
  const { profile } = await api.patch<{ profile: AccountProfile }>('/account/security', input)
  return profile
}

export async function getAccountNotificationPreferences(): Promise<NotificationPreferenceItem[]> {
  const { preferences } = await api.get<{ preferences: NotificationPreferenceItem[] }>(
    '/account/notification-preferences',
  )
  return preferences
}

export async function updateAccountNotificationPreferences(input: UpdateNotificationPreferencesRequest) {
  const { preferences } = await api.patch<{ preferences: NotificationPreferenceItem[] }>(
    '/account/notification-preferences',
    input,
  )
  return preferences
}

export async function getAccountLiveCursor(): Promise<AccountLiveCursor> {
  const { cursor } = await api.get<{ cursor: AccountLiveCursor }>('/account/live')
  return cursor
}

export async function getAccountNotifications(limit = 8): Promise<AccountNotification[]> {
  const { notifications } = await api.get<{ notifications: AccountNotification[] }>(
    `/account/notifications?limit=${limit}`,
  )
  return notifications
}

export async function markAccountNotificationRead(id: string): Promise<AccountNotification[]> {
  const { notifications } = await api.post<{ notifications: AccountNotification[] }>(
    `/account/notifications/${id}/read`,
  )
  return notifications
}

export async function setupAccountTwoFactor(): Promise<TwoFactorSetupResponse> {
  const { setup } = await api.post<{ setup: TwoFactorSetupResponse }>('/account/2fa/setup')
  return setup
}

export async function enableAccountTwoFactor(input: EnableTwoFactorRequest): Promise<AccountProfile> {
  const { profile } = await api.post<{ profile: AccountProfile }>('/account/2fa/enable', input)
  return profile
}

export async function disableAccountTwoFactor(input: DisableTwoFactorRequest): Promise<AccountProfile> {
  const { profile } = await api.post<{ profile: AccountProfile }>('/account/2fa/disable', input)
  return profile
}
