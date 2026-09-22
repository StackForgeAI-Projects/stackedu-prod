import type { ApplicationDocumentType, RequestedDocuments } from '@stackedu/shared'
import {
  APPLICATION_DOCUMENT_LABELS,
  MAX_UPLOAD_BYTES,
  buildCustomDocumentType,
  isAllowedRequestedDocument,
  isCustomDocumentType,
} from '@stackedu/shared'
import { badRequest } from './errors'

const ALLOWED_MIME: Record<ApplicationDocumentType, readonly string[]> = {
  NationalId: ['application/pdf', 'image/jpeg', 'image/png'],
  SchoolCertificate: ['application/pdf'],
  Transcript: ['application/pdf'],
  Photo: ['image/jpeg', 'image/png'],
  MedicalInsurance: ['application/pdf', 'image/jpeg', 'image/png'],
  BirthCertificate: ['application/pdf', 'image/jpeg', 'image/png'],
}

const MAX_BYTES: Record<ApplicationDocumentType, number> = {
  NationalId: MAX_UPLOAD_BYTES,
  SchoolCertificate: MAX_UPLOAD_BYTES,
  Transcript: MAX_UPLOAD_BYTES,
  Photo: MAX_UPLOAD_BYTES,
  MedicalInsurance: MAX_UPLOAD_BYTES,
  BirthCertificate: MAX_UPLOAD_BYTES,
}

const CUSTOM_ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png'] as const
const CUSTOM_MAX_BYTES = MAX_UPLOAD_BYTES

export function normalizeRequestedDocuments(
  input: RequestedDocuments | null | undefined,
): RequestedDocuments | null {
  if (!input) return null
  const types = input.types ?? []
  const custom = (input.custom ?? []).map((name) => name.trim()).filter(Boolean)
  if (types.length + custom.length === 0) return null
  return { types, custom }
}

export function assertDocumentUploadAllowed(input: {
  applicationStatus: string
  documentType: string
  documentRequest: RequestedDocuments | null
  documentResponseSubmittedAt?: string | null
}): void {
  if (input.applicationStatus === 'Draft') return
  if (input.applicationStatus !== 'DocumentsRequested' || !input.documentRequest) {
    throw badRequest('Your application has been submitted and can no longer be changed.')
  }
  if (input.documentResponseSubmittedAt) {
    throw badRequest('Your documents have already been submitted. Wait for admissions to review them.')
  }
  if (!isAllowedRequestedDocument(input.documentType, input.documentRequest)) {
    throw badRequest('That document was not requested by admissions.')
  }
}

export function assertDocumentDeleteAllowed(input: {
  applicationStatus: string
  documentRequest: RequestedDocuments | null
  documentResponseSubmittedAt?: string | null
}): void {
  if (input.applicationStatus === 'Draft') return
  if (input.applicationStatus !== 'DocumentsRequested') {
    throw badRequest('Uploaded documents can no longer be removed.')
  }
  if (input.documentResponseSubmittedAt) {
    throw badRequest('Your documents have already been submitted. Wait for admissions to review them.')
  }
}

export function listRequiredRequestedDocumentTypes(request: RequestedDocuments): string[] {
  return [
    ...request.types,
    ...request.custom.map((name) => buildCustomDocumentType(name)),
  ]
}

export function assertRequestedDocumentsComplete(input: {
  request: RequestedDocuments
  documents: ReadonlyArray<{ documentType: string }>
}): void {
  const present = new Set(input.documents.map((doc) => doc.documentType))
  const missing = listRequiredRequestedDocumentTypes(input.request).filter((type) => !present.has(type))
  if (missing.length > 0) {
    throw badRequest('Upload every requested document before you submit.')
  }
}

export function isDocumentNewForAdmin(input: {
  uploadedAt: string
  adminViewedAt: string | null
  documentRequestRequestedAt: string | null
}): boolean {
  if (!input.documentRequestRequestedAt || input.adminViewedAt) return false
  return input.uploadedAt > input.documentRequestRequestedAt
}

export function mimeRulesForDocumentType(documentType: string): {
  allowed: readonly string[]
  maxBytes: number
} {
  if (isCustomDocumentType(documentType)) {
    return { allowed: CUSTOM_ALLOWED_MIME, maxBytes: CUSTOM_MAX_BYTES }
  }
  if (!(documentType in APPLICATION_DOCUMENT_LABELS)) {
    throw badRequest('Unknown document type.')
  }
  const key = documentType as ApplicationDocumentType
  return { allowed: ALLOWED_MIME[key], maxBytes: MAX_BYTES[key] }
}

export function mapStoredDocumentType(documentType: string): string {
  return documentType
}

export function buildStoredCustomDocumentType(name: string): string {
  return buildCustomDocumentType(name)
}

export { ALLOWED_MIME, MAX_BYTES }
