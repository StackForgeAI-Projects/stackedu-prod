import type { ResourceType } from './enums'

import { MAX_UPLOAD_BYTES, formatUploadBytes } from './upload-limits'

export const LIBRARY_RESOURCE_MAX_BYTES = MAX_UPLOAD_BYTES

export const LIBRARY_RESOURCE_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/epub+zip',
  'application/rtf',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/html',
  'text/csv',
  'text/rtf',
  'video/mp4',
  'video/webm',
  'video/quicktime',
])

export const LIBRARY_RESOURCE_ACCEPT = [
  '.pdf,.doc,.docx,.epub,.rtf,.odt,.ppt,.pptx,.xls,.xlsx,.txt,.html,.csv,.mp4,.webm,.mov',
  ...LIBRARY_RESOURCE_MIME_TYPES,
].join(',')

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  Ebook: 'E-book',
  Journal: 'Journal',
  ResearchPaper: 'Research paper',
  CoursePack: 'Course pack',
  Video: 'Video',
}

export const LIBRARY_REQUEST_STATUSES = ['Pending', 'Fulfilled', 'Declined'] as const
export type LibraryRequestStatus = (typeof LIBRARY_REQUEST_STATUSES)[number]

export function mimeTypeForLibraryFile(file: { name: string; type: string }): string {
  if (file.type && LIBRARY_RESOURCE_MIME_TYPES.has(file.type)) return file.type
  const lower = file.name.toLowerCase()
  if (lower.endsWith('.pdf')) return 'application/pdf'
  if (lower.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  if (lower.endsWith('.doc')) return 'application/msword'
  if (lower.endsWith('.epub')) return 'application/epub+zip'
  if (lower.endsWith('.rtf')) return 'application/rtf'
  if (lower.endsWith('.odt')) return 'application/vnd.oasis.opendocument.text'
  if (lower.endsWith('.pptx')) return 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  if (lower.endsWith('.ppt')) return 'application/vnd.ms-powerpoint'
  if (lower.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  if (lower.endsWith('.xls')) return 'application/vnd.ms-excel'
  if (lower.endsWith('.txt')) return 'text/plain'
  if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'text/html'
  if (lower.endsWith('.csv')) return 'text/csv'
  if (lower.endsWith('.mp4')) return 'video/mp4'
  if (lower.endsWith('.webm')) return 'video/webm'
  if (lower.endsWith('.mov')) return 'video/quicktime'
  return file.type || 'application/octet-stream'
}

export function formatFromLibraryFile(fileName: string, mimeType: string | null | undefined): string {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (ext && ext !== fileName.toLowerCase() && ext.length <= 8) return ext
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType?.includes('wordprocessingml')) return 'docx'
  if (mimeType === 'application/msword') return 'doc'
  if (mimeType === 'application/epub+zip') return 'epub'
  if (mimeType === 'video/mp4') return 'mp4'
  return mimeType?.split('/').pop() ?? 'file'
}

export function formatLibraryFileSize(bytes: number | null | undefined): string {
  return formatUploadBytes(bytes)
}
