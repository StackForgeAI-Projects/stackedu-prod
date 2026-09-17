export const COURSE_MATERIAL_MAX_BYTES = 10 * 1024 * 1024

export const COURSE_MATERIAL_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

export const COURSE_MATERIAL_ACCEPT =
  '.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp,image/gif'

export function mimeTypeForMaterialFile(file: File): string {
  if (file.type && COURSE_MATERIAL_MIME_TYPES.has(file.type)) return file.type
  const lower = file.name.toLowerCase()
  if (lower.endsWith('.pdf')) return 'application/pdf'
  if (lower.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  if (lower.endsWith('.doc')) return 'application/msword'
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.gif')) return 'image/gif'
  return file.type || 'application/octet-stream'
}

export function formatMaterialFileSize(bytes: number | null | undefined): string {
  if (bytes == null || bytes <= 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function materialSourceLabel(input: {
  fileKey: string | null
  externalUrl: string | null
  bodyText?: string | null
}): 'File' | 'Link' | 'Page' | 'Notes' {
  if (input.fileKey) return 'File'
  if (input.externalUrl) return 'Link'
  if (input.bodyText?.trim()) return 'Page'
  return 'Notes'
}
