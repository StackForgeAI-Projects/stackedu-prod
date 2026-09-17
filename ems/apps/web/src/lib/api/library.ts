import type {
  AttachLibraryFileRequest,
  CreateLibraryCollectionRequest,
  CreateLibraryRequest,
  CreateLibraryResourceRequest,
  DeclineLibraryRequest,
  FulfilLibraryRequest,
  LibrarianDashboard,
  LibrarianNotification,
  LibrarianProfile,
  LibraryAccessOptions,
  LibraryAccessRule,
  LibraryAnalytics,
  LibraryCatalogueItem,
  LibraryCollection,
  LibraryCollectionDetail,
  LibraryRequest,
  LibraryResource,
  ReserveLibraryUploadRequest,
  UpdateLibraryAccessRequest,
  UpdateLibraryCollectionRequest,
  UpdateLibraryResourceRequest,
} from '@stackedu/shared'
import { mimeTypeForLibraryFile } from '@stackedu/shared'
import { api, ApiClientError } from './client'

export const librarianProfileQueryKey = ['librarian', 'me'] as const
export const librarianDashboardQueryKey = ['librarian', 'dashboard'] as const
export const librarianResourcesQueryKey = ['librarian', 'resources'] as const
export const librarianResourceQueryKey = (id: string) => ['librarian', 'resource', id] as const
export const librarianCollectionsQueryKey = ['librarian', 'collections'] as const
export const librarianCollectionQueryKey = (id: string) => ['librarian', 'collection', id] as const
export const librarianRequestsQueryKey = ['librarian', 'requests'] as const
export const librarianAnalyticsQueryKey = ['librarian', 'analytics'] as const
export const librarianNotificationsQueryKey = ['librarian', 'notifications'] as const
export const librarianAccessOptionsQueryKey = ['librarian', 'access-options'] as const
export const readerLibraryQueryKey = (role: LibraryReaderPortal) => [role, 'library'] as const
export const readerLibraryRequestsQueryKey = (role: LibraryReaderPortal) => [role, 'library-requests'] as const

export type LibraryReaderPortal = 'student' | 'lecturer' | 'academic'

export async function getReaderLibrary(
  role: LibraryReaderPortal,
  query?: string,
): Promise<LibraryCatalogueItem[]> {
  const suffix = query?.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''
  const { resources } = await api.get<{ resources: LibraryCatalogueItem[] }>(`/${role}/library${suffix}`)
  return resources
}

export async function getReaderLibraryRequests(role: LibraryReaderPortal): Promise<LibraryRequest[]> {
  const { requests } = await api.get<{ requests: LibraryRequest[] }>(`/${role}/library/requests`)
  return requests
}

export async function createReaderLibraryRequest(
  role: LibraryReaderPortal,
  input: CreateLibraryRequest,
): Promise<LibraryRequest[]> {
  const { requests } = await api.post<{ requests: LibraryRequest[] }>(`/${role}/library/requests`, input)
  return requests
}

export async function getReaderLibraryDownload(
  role: LibraryReaderPortal,
  resourceId: string,
  fileId?: string,
): Promise<{ url: string; expiresAt: string; fileName: string }> {
  const suffix = fileId ? `?fileId=${encodeURIComponent(fileId)}` : ''
  const { download } = await api.get<{ download: { url: string; expiresAt: string; fileName: string } }>(
    `/${role}/library/${resourceId}/download${suffix}`,
  )
  return download
}

export async function getLibrarianProfile(): Promise<LibrarianProfile> {
  const { profile } = await api.get<{ profile: LibrarianProfile }>('/librarian/me')
  return profile
}

export async function getLibrarianDashboard(): Promise<LibrarianDashboard> {
  const { dashboard } = await api.get<{ dashboard: LibrarianDashboard }>('/librarian/dashboard')
  return dashboard
}

export async function getLibrarianNotifications(): Promise<LibrarianNotification[]> {
  const { notifications } = await api.get<{ notifications: LibrarianNotification[] }>('/librarian/notifications')
  return notifications
}

export async function markLibrarianNotificationRead(id: string): Promise<LibrarianNotification[]> {
  const { notifications } = await api.post<{ notifications: LibrarianNotification[] }>(
    `/librarian/notifications/${id}/read`,
  )
  return notifications
}

export async function getLibraryAnalytics(): Promise<LibraryAnalytics> {
  const { analytics } = await api.get<{ analytics: LibraryAnalytics }>('/librarian/analytics')
  return analytics
}

export async function getLibraryAccessOptions(): Promise<LibraryAccessOptions> {
  const { options } = await api.get<{ options: LibraryAccessOptions }>('/librarian/access-options')
  return options
}

export async function listLibrarianResources(query?: string): Promise<LibraryResource[]> {
  const suffix = query?.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''
  const { resources } = await api.get<{ resources: LibraryResource[] }>(`/librarian/resources${suffix}`)
  return resources
}

export async function getLibrarianResource(id: string): Promise<LibraryResource> {
  const { resource } = await api.get<{ resource: LibraryResource }>(`/librarian/resources/${id}`)
  return resource
}

export async function createLibrarianResource(input: CreateLibraryResourceRequest): Promise<LibraryResource> {
  const { resource } = await api.post<{ resource: LibraryResource }>('/librarian/resources', input)
  return resource
}

export async function updateLibrarianResource(
  id: string,
  input: UpdateLibraryResourceRequest,
): Promise<LibraryResource> {
  const { resource } = await api.patch<{ resource: LibraryResource }>(`/librarian/resources/${id}`, input)
  return resource
}

export async function updateLibrarianAccess(id: string, input: UpdateLibraryAccessRequest): Promise<LibraryResource> {
  const { resource } = await api.put<{ resource: LibraryResource }>(`/librarian/resources/${id}/access`, input)
  return resource
}

export async function describeLibrarianResource(input: {
  title?: string
  fileKey?: string
  fileName?: string
  mimeType?: string
}): Promise<{ description: string; subjectTags: string[] }> {
  return api.post<{ description: string; subjectTags: string[] }>('/librarian/resources/describe', input)
}

export async function uploadLibraryFile(
  resourceId: string,
  file: File,
): Promise<Pick<AttachLibraryFileRequest, 'fileKey' | 'fileName' | 'mimeType' | 'fileSizeBytes'>> {
  const mimeType = mimeTypeForLibraryFile(file)
  const payload: ReserveLibraryUploadRequest = {
    fileName: file.name,
    mimeType,
    fileSizeBytes: file.size,
  }
  const { upload } = await api.post<{
    upload: ReserveLibraryUploadRequest & {
      fileKey: string
      uploadUrl: string
      uploadMethod: 'PUT'
      headers: Record<string, string>
    }
  }>(`/librarian/resources/${resourceId}/upload-target`, payload)

  const response = await fetch(upload.uploadUrl, {
    method: upload.uploadMethod,
    headers: upload.headers,
    body: file,
  })
  if (!response.ok) {
    throw new ApiClientError('INTERNAL_ERROR', response.status, 'We could not upload that file. Please try again.')
  }

  return { fileKey: upload.fileKey, fileName: file.name, mimeType, fileSizeBytes: file.size }
}

export async function attachLibrarianFile(
  resourceId: string,
  input: AttachLibraryFileRequest,
): Promise<LibraryResource> {
  const { resource } = await api.post<{ resource: LibraryResource }>(
    `/librarian/resources/${resourceId}/files`,
    input,
  )
  return resource
}

export async function deleteLibrarianFile(resourceId: string, fileId: string): Promise<LibraryResource> {
  const { resource } = await api.delete<{ resource: LibraryResource }>(
    `/librarian/resources/${resourceId}/files/${fileId}`,
  )
  return resource
}

export async function getLibrarianDownload(
  resourceId: string,
  fileId?: string,
): Promise<{ url: string; expiresAt: string; fileName: string }> {
  const suffix = fileId ? `?fileId=${encodeURIComponent(fileId)}` : ''
  const { download } = await api.get<{ download: { url: string; expiresAt: string; fileName: string } }>(
    `/librarian/resources/${resourceId}/download${suffix}`,
  )
  return download
}

export async function listLibrarianCollections(): Promise<LibraryCollection[]> {
  const { collections } = await api.get<{ collections: LibraryCollection[] }>('/librarian/collections')
  return collections
}

export async function getLibrarianCollection(id: string): Promise<LibraryCollectionDetail> {
  const { collection } = await api.get<{ collection: LibraryCollectionDetail }>(`/librarian/collections/${id}`)
  return collection
}

export async function createLibrarianCollection(input: CreateLibraryCollectionRequest): Promise<LibraryCollection> {
  const { collection } = await api.post<{ collection: LibraryCollection }>('/librarian/collections', input)
  return collection
}

export async function updateLibrarianCollection(
  id: string,
  input: UpdateLibraryCollectionRequest,
): Promise<LibraryCollection> {
  const { collection } = await api.patch<{ collection: LibraryCollection }>(`/librarian/collections/${id}`, input)
  return collection
}

export async function deleteLibrarianCollection(id: string): Promise<void> {
  await api.delete(`/librarian/collections/${id}`)
}

export async function addLibrarianCollectionItem(collectionId: string, resourceId: string): Promise<LibraryCollectionDetail> {
  const { collection } = await api.post<{ collection: LibraryCollectionDetail }>(
    `/librarian/collections/${collectionId}/items`,
    { resourceId },
  )
  return collection
}

export async function removeLibrarianCollectionItem(
  collectionId: string,
  resourceId: string,
): Promise<LibraryCollectionDetail> {
  const { collection } = await api.delete<{ collection: LibraryCollectionDetail }>(
    `/librarian/collections/${collectionId}/items/${resourceId}`,
  )
  return collection
}

export async function listLibrarianRequests(): Promise<LibraryRequest[]> {
  const { requests } = await api.get<{ requests: LibraryRequest[] }>('/librarian/requests')
  return requests
}

export async function fulfilLibrarianRequest(id: string, input: FulfilLibraryRequest): Promise<LibraryRequest[]> {
  const { requests } = await api.post<{ requests: LibraryRequest[] }>(`/librarian/requests/${id}/fulfil`, input)
  return requests
}

export async function declineLibrarianRequest(id: string, input: DeclineLibraryRequest): Promise<LibraryRequest[]> {
  const { requests } = await api.post<{ requests: LibraryRequest[] }>(`/librarian/requests/${id}/decline`, input)
  return requests
}

export type { LibraryAccessRule }
