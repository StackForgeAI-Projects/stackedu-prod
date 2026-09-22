import type { ApplicationDocumentType, RequestedDocuments } from './schemas/application'
import type { ApplicationStatus, PaymentMethod, PaymentStatus } from './enums'

/** Shown when Academic Admin opens Review on an application that is still a draft. */
export const DRAFT_APPLICATION_REVIEW_MESSAGE =
  "Application could not be found because the applicant hasn't yet submitted it"

/** Prefix for ad-hoc document requests outside the standard application set. */
export const CUSTOM_DOCUMENT_PREFIX = 'Other:'

export const APPLICATION_DOCUMENT_LABELS: Record<ApplicationDocumentType, string> = {
  NationalId: 'National ID',
  SchoolCertificate: 'School Certificate',
  Transcript: 'Transcript',
  Photo: 'Photo',
  MedicalInsurance: 'Medical Insurance',
  BirthCertificate: 'Birth Certificate',
}

/** Document types an academic reviewer can request from an applicant. */
export const REQUESTABLE_APPLICATION_DOCUMENT_TYPES = [
  'NationalId',
  'SchoolCertificate',
  'Transcript',
  'Photo',
  'MedicalInsurance',
  'BirthCertificate',
] as const satisfies ReadonlyArray<ApplicationDocumentType>

const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  Draft: 'Draft',
  Submitted: 'Submitted',
  UnderReview: 'Under Review',
  DocumentsRequested: 'Documents Requested',
  Accepted: 'Accepted',
  Rejected: 'Rejected',
}

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  MoMo: 'MTN MoMo',
  Airtel: 'Airtel Money',
  BankTransfer: 'Bank Transfer',
  Card: 'Card',
}

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  Pending: 'Pending',
  Completed: 'Completed',
  Failed: 'Failed',
  Voided: 'Voided',
}

export function formatApplicationStatus(status: ApplicationStatus): string {
  return APPLICATION_STATUS_LABELS[status] ?? splitCamelCase(status)
}

export function formatPaymentMethod(method: PaymentMethod | string): string {
  if (method in PAYMENT_METHOD_LABELS) {
    return PAYMENT_METHOD_LABELS[method as PaymentMethod]
  }
  return splitCamelCase(String(method))
}

export function formatPaymentStatus(status: PaymentStatus | string): string {
  if (status in PAYMENT_STATUS_LABELS) {
    return PAYMENT_STATUS_LABELS[status as PaymentStatus]
  }
  return splitCamelCase(String(status))
}

export function buildCustomDocumentType(name: string): string {
  return `${CUSTOM_DOCUMENT_PREFIX}${name.trim()}`
}

export function isCustomDocumentType(documentType: string): boolean {
  return documentType.startsWith(CUSTOM_DOCUMENT_PREFIX)
}

export function formatDocumentTypeLabel(documentType: string): string {
  if (isCustomDocumentType(documentType)) {
    return documentType.slice(CUSTOM_DOCUMENT_PREFIX.length)
  }
  if (documentType in APPLICATION_DOCUMENT_LABELS) {
    return APPLICATION_DOCUMENT_LABELS[documentType as ApplicationDocumentType]
  }
  return splitCamelCase(documentType)
}

export function splitCamelCase(value: string): string {
  return value.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ')
}

export function requestedDocumentKeys(request: RequestedDocuments): string[] {
  return [...request.types, ...request.custom.map((name) => buildCustomDocumentType(name))]
}

export function formatRequestedDocumentsList(request: RequestedDocuments): string[] {
  return [
    ...request.types.map((type) => formatDocumentTypeLabel(type)),
    ...request.custom.map((name) => name.trim()).filter(Boolean),
  ]
}

export function isAllowedRequestedDocument(
  documentType: string,
  request: RequestedDocuments,
): boolean {
  return requestedDocumentKeys(request).includes(documentType)
}
