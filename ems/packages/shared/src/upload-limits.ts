/** Hard ceiling for every file upload in StackEDU. The API and the browser share this. */
export const MAX_UPLOAD_BYTES = 14 * 1024 * 1024
export const MAX_UPLOAD_MB = 14

/**
 * Above this original size we refuse before compressing. A 50 MB file will not
 * reliably reduce to 14 MB in the browser, and trying wastes time.
 */
export const EXTREME_UPLOAD_BYTES = 50 * 1024 * 1024

export const MAX_UPLOAD_LABEL = `${MAX_UPLOAD_MB} MB`

export function formatUploadBytes(bytes: number | null | undefined): string {
  if (bytes == null || bytes < 0) return '—'
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function isOverUploadLimit(bytes: number): boolean {
  return bytes > MAX_UPLOAD_BYTES
}

export function isExtremelyLargeUpload(bytes: number): boolean {
  return bytes > EXTREME_UPLOAD_BYTES
}

export function uploadLimitMessage(): string {
  return `The file is too large. Maximum size is ${MAX_UPLOAD_LABEL}.`
}
