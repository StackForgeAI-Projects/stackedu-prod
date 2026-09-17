import type {
  AnnouncementAudience,
  AnnouncementPreview,
  CreateAnnouncementRequest,
  CreateIctUserRequest,
  IctAnalytics,
  IctAnnouncement,
  IctAudienceOptions,
  IctAuditDetail,
  IctAuditRow,
  IctCreatedUser,
  IctDashboard,
  IctIntegration,
  IctNotification,
  IctPermission,
  IctProfile,
  IctProgrammeOption,
  IctRevocation,
  IctRole,
  IctSettings,
  IctUserDetail,
  IctUserRow,
  UpdateIctSettingsRequest,
  UpdateIctUserRequest,
  UpdateIntegrationRequest,
  UserRole,
} from '@stackedu/shared'
import { api, API_URL, ApiClientError } from './client'

export const ictProfileQueryKey = ['ict', 'me'] as const
export const ictDashboardQueryKey = ['ict', 'dashboard'] as const
export const ictAnalyticsQueryKey = ['ict', 'analytics'] as const
export const ictUsersQueryKey = ['ict', 'users'] as const
export const ictUserQueryKey = (id: string) => ['ict', 'user', id] as const
export const ictProgrammesQueryKey = ['ict', 'programmes'] as const
export const ictRevocationsQueryKey = ['ict', 'revocations'] as const
export const ictRolesQueryKey = ['ict', 'roles'] as const
export const ictAuditQueryKey = ['ict', 'audit'] as const
export const ictSettingsQueryKey = ['ict', 'settings'] as const
export const ictIntegrationsQueryKey = ['ict', 'integrations'] as const
export const ictAnnouncementsQueryKey = ['ict', 'announcements'] as const
export const ictAudienceOptionsQueryKey = ['ict', 'audience-options'] as const
export const ictNotificationsQueryKey = ['ict', 'notifications'] as const

export async function getIctProfile(): Promise<IctProfile> {
  const { profile } = await api.get<{ profile: IctProfile }>('/ict/me')
  return profile
}

export async function getIctDashboard(): Promise<IctDashboard> {
  const { dashboard } = await api.get<{ dashboard: IctDashboard }>('/ict/dashboard')
  return dashboard
}

export async function getIctAnalytics(): Promise<IctAnalytics> {
  const { analytics } = await api.get<{ analytics: IctAnalytics }>('/ict/analytics')
  return analytics
}

export async function getIctUsers(): Promise<IctUserRow[]> {
  const { users } = await api.get<{ users: IctUserRow[] }>('/ict/users')
  return users
}

export async function getIctUser(id: string): Promise<IctUserDetail> {
  const { user } = await api.get<{ user: IctUserDetail }>(`/ict/users/${id}`)
  return user
}

export async function getIctProgrammes(): Promise<IctProgrammeOption[]> {
  const { programmes } = await api.get<{ programmes: IctProgrammeOption[] }>('/ict/programmes')
  return programmes
}

export async function createIctUser(input: CreateIctUserRequest): Promise<IctCreatedUser> {
  return api.post<IctCreatedUser>('/ict/users', input)
}

export async function updateIctUser(id: string, input: UpdateIctUserRequest) {
  const { user } = await api.patch<{ user: IctUserDetail }>(`/ict/users/${id}`, input)
  return user
}

export async function resetIctUserPassword(id: string) {
  return api.post<{ temporaryPassword: string }>(`/ict/users/${id}/reset-password`)
}

export async function revokeIctUser(id: string, reason: string) {
  const { revocation } = await api.post<{ revocation: IctRevocation }>(`/ict/users/${id}/revoke`, { reason })
  return revocation
}

export async function getIctRevocations(): Promise<IctRevocation[]> {
  const { revocations } = await api.get<{ revocations: IctRevocation[] }>('/ict/revocations')
  return revocations
}

export async function getIctRevocation(id: string): Promise<IctRevocation> {
  const { revocation } = await api.get<{ revocation: IctRevocation }>(`/ict/revocations/${id}`)
  return revocation
}

export async function restoreIctRevocation(id: string) {
  const { revocation } = await api.post<{ revocation: IctRevocation }>(`/ict/revocations/${id}/restore`)
  return revocation
}

export async function getIctRoles() {
  return api.get<{ roles: IctRole[]; catalogue: IctPermission[] }>('/ict/roles')
}

export async function updateIctRolePermissions(key: UserRole, permissionKeys: string[]) {
  const { role } = await api.patch<{ role: IctRole }>(`/ict/roles/${key}/permissions`, { permissionKeys })
  return role
}

export async function getIctAudit(): Promise<IctAuditRow[]> {
  const { entries } = await api.get<{ entries: IctAuditRow[] }>('/ict/audit')
  return entries
}

export async function getIctAuditEntry(id: string): Promise<IctAuditDetail> {
  const { entry } = await api.get<{ entry: IctAuditDetail }>(`/ict/audit/${id}`)
  return entry
}

export async function getIctSettings(): Promise<IctSettings> {
  const { settings } = await api.get<{ settings: IctSettings }>('/ict/settings')
  return settings
}

export async function updateIctSettings(input: UpdateIctSettingsRequest) {
  const { settings } = await api.patch<{ settings: IctSettings }>('/ict/settings', input)
  return settings
}

export async function uploadIctLogo(file: File): Promise<IctSettings> {
  const response = await fetch(`${API_URL}/ict/settings/logo`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  })

  const payload: unknown = await response.json().catch(() => undefined)
  if (!response.ok) {
    if (
      typeof payload === 'object' &&
      payload !== null &&
      'error' in payload &&
      typeof (payload as { error?: { message?: string } }).error?.message === 'string'
    ) {
      throw new ApiClientError(
        'VALIDATION_FAILED',
        response.status,
        (payload as { error: { message: string } }).error.message,
      )
    }
    throw new ApiClientError('INTERNAL_ERROR', response.status, 'Could not upload the logo.')
  }

  return (payload as { settings: IctSettings }).settings
}

export async function getIctIntegrations(): Promise<IctIntegration[]> {
  const { integrations } = await api.get<{ integrations: IctIntegration[] }>('/ict/integrations')
  return integrations
}

export async function updateIctIntegration(id: string, input: UpdateIntegrationRequest) {
  const { integration } = await api.patch<{ integration: IctIntegration }>(`/ict/integrations/${id}`, input)
  return integration
}

export async function checkIctIntegration(id: string) {
  const { integration } = await api.post<{ integration: IctIntegration }>(`/ict/integrations/${id}/check`)
  return integration
}

export async function getIctAnnouncements(): Promise<IctAnnouncement[]> {
  const { announcements } = await api.get<{ announcements: IctAnnouncement[] }>('/ict/announcements')
  return announcements
}

export async function createIctAnnouncement(input: CreateAnnouncementRequest) {
  const { announcement } = await api.post<{ announcement: IctAnnouncement }>('/ict/announcements', input)
  return announcement
}

export async function getIctAudienceOptions(): Promise<IctAudienceOptions> {
  const { options } = await api.get<{ options: IctAudienceOptions }>('/ict/audience-options')
  return options
}

export async function previewIctAnnouncement(audience: AnnouncementAudience): Promise<AnnouncementPreview> {
  const { preview } = await api.post<{ preview: AnnouncementPreview }>('/ict/announcements/preview', { audience })
  return preview
}

export async function getIctNotifications(): Promise<IctNotification[]> {
  const { notifications } = await api.get<{ notifications: IctNotification[] }>('/ict/notifications')
  return notifications
}

export async function markIctNotificationRead(id: string) {
  const { notifications } = await api.post<{ notifications: IctNotification[] }>(
    `/ict/notifications/${id}/read`,
  )
  return notifications
}
