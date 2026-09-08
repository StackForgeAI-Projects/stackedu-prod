import { randomInt } from 'node:crypto'
import { and, asc, desc, eq } from 'drizzle-orm'
import {
  REQUIRED_APPLICATION_DOCUMENT_TYPES,
  type Application,
  type ApplicationDocument,
  type ApplicationDocumentType,
  type ApplicationPayment,
  type InitiatePaymentRequest,
  type PresignDocumentRequest,
  type PresignDocumentResponse,
  type ProgrammeOption,
  type RegisterApplicantRequest,
  type SaveApplicationRequest,
} from '@stackedu/shared'
import { env } from '../config/env'
import { getInstitutionDb } from '../db/connection'
import {
  applicationDocuments,
  applicationPayments,
  applications,
} from '../db/institution/schema/admissions'
import { users } from '../db/institution/schema/people'
import { programmes } from '../db/institution/schema/academic'
import { badRequest, conflict, notFound } from '../lib/errors'
import { notifyApplicationSubmitted } from '../lib/admissions-email'
import {
  assertDocumentDeleteAllowed,
  assertDocumentUploadAllowed,
  assertRequestedDocumentsComplete,
  mimeRulesForDocumentType,
} from '../lib/application-documents'
import {
  buildFileKey,
  createDownloadUrl,
  createUploadTarget,
  deleteStoredObject,
} from '../lib/storage'
import { createUser } from './users'
import { issueApplicantEmailVerification } from './verification'
import { initiatePaymentGateway } from './payment-gateway'
import { readPaymentPolicy } from '../lib/payment-policy-store'
import { validatePaymentAmount } from '@stackedu/shared'
import { loadLatestDocumentRequest } from './admissions-read'
import { loadAdmissionOffer } from './admissions-enrolment'

/**
 * Admissions.
 *
 * An application is created the moment someone registers, in Draft, rather
 * than when they finish. That way a half-completed form survives a closed
 * browser or a lost connection, which on a mobile network is the common case
 * rather than the exception.
 */

const REFERENCE_ATTEMPTS = 5

function buildReference(): string {
  return `APP-${new Date().getFullYear()}-${String(randomInt(0, 100_000)).padStart(5, '0')}`
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  return {
    firstName: parts[0] ?? fullName.trim(),
    lastName: parts.length > 1 ? parts.slice(1).join(' ') : '',
  }
}

function detailString(details: Record<string, unknown> | null, key: string): string {
  const value = details?.[key]
  return typeof value === 'string' ? value.trim() : ''
}

/** Core fields that must be present before documents / fee / submit. */
export function assertFormComplete(application: Application): void {
  if (!application.dateOfBirth || !application.gender || !application.nationalId) {
    throw badRequest('Complete your personal details before continuing.')
  }
  if (!application.previousInstitution || !application.previousQualification) {
    throw badRequest('Complete your academic history before continuing.')
  }
  if (!application.programme) {
    throw badRequest('Choose a programme before continuing.')
  }

  const details = application.details
  if (
    !detailString(details, 'guardianName') ||
    !detailString(details, 'guardianPhone') ||
    !detailString(details, 'guardianRelationship')
  ) {
    throw badRequest('Complete the parent / guardian section before continuing.')
  }
  if (!detailString(details, 'statement') || !detailString(details, 'emergencyName')) {
    throw badRequest('Complete the additional information section before continuing.')
  }
  if (details?.declared !== true) {
    throw badRequest('Confirm the declaration before continuing.')
  }
}

function assertRequiredDocuments(documents: ApplicationDocument[]): void {
  const present = new Set(documents.map((doc) => doc.documentType))
  const missing = (REQUIRED_APPLICATION_DOCUMENT_TYPES as readonly string[]).filter(
    (type) => !present.has(type as ApplicationDocumentType),
  )
  if (missing.length > 0) {
    throw badRequest('Upload all required documents before continuing.')
  }
}

function mapDocument(row: {
  id: string
  documentType: string
  fileName: string
  fileSizeBytes: number | null
  mimeType: string | null
  createdAt: string
}): ApplicationDocument {
  return {
    id: row.id,
    documentType: row.documentType,
    fileName: row.fileName,
    fileSizeBytes: row.fileSizeBytes,
    mimeType: row.mimeType,
    uploadedAt: row.createdAt,
  }
}

function mapPayment(row: {
  id: string
  reference: string
  amount: number
  method: ApplicationPayment['method']
  status: ApplicationPayment['status']
  paidAt: string | null
  createdAt: string
}): ApplicationPayment {
  return {
    id: row.id,
    reference: row.reference,
    amount: row.amount,
    method: row.method,
    status: row.status,
    paidAt: row.paidAt,
    createdAt: row.createdAt,
  }
}

export async function listProgrammes(institutionId: string): Promise<ProgrammeOption[]> {
  const db = await getInstitutionDb(institutionId)

  return db
    .select({
      id: programmes.id,
      code: programmes.code,
      name: programmes.name,
      level: programmes.level,
      durationYears: programmes.durationYears,
    })
    .from(programmes)
    .where(eq(programmes.isActive, true))
    .orderBy(asc(programmes.name))
}

export async function registerApplicant(
  institutionId: string,
  input: RegisterApplicantRequest,
): Promise<{ userId: string; email: string; reference: string }> {
  const db = await getInstitutionDb(institutionId)

  const [programme] = await db
    .select({ id: programmes.id })
    .from(programmes)
    .where(and(eq(programmes.id, input.programmeId), eq(programmes.isActive, true)))
    .limit(1)

  if (!programme) throw badRequest('That programme is not open for applications.')

  let reference = ''
  for (let attempt = 0; attempt < REFERENCE_ATTEMPTS; attempt += 1) {
    const candidate = buildReference()
    const [taken] = await db
      .select({ id: applications.id })
      .from(applications)
      .where(eq(applications.reference, candidate))
      .limit(1)

    if (!taken) {
      reference = candidate
      break
    }
  }

  if (!reference) throw conflict('Could not allocate an application reference. Please try again.')

  const account = await createUser({
    institutionId,
    email: input.email,
    fullName: input.fullName,
    role: 'Applicant',
    password: input.password,
    phone: input.phone,
    alternateIdentifier: reference,
  })

  const { firstName, lastName } = splitName(input.fullName)

  await db.insert(applications).values({
    reference,
    applicantUserId: account.id,
    programmeId: input.programmeId,
    firstName,
    lastName,
    email: account.email,
    phone: input.phone,
    status: 'Draft',
  })

  await issueApplicantEmailVerification({
    institutionId,
    userId: account.id,
    email: account.email,
    fullName: input.fullName,
  })

  return { userId: account.id, email: account.email, reference }
}

async function loadDocuments(
  institutionId: string,
  applicationId: string,
): Promise<ApplicationDocument[]> {
  const db = await getInstitutionDb(institutionId)
  const rows = await db
    .select({
      id: applicationDocuments.id,
      documentType: applicationDocuments.documentType,
      fileName: applicationDocuments.fileName,
      fileSizeBytes: applicationDocuments.fileSizeBytes,
      mimeType: applicationDocuments.mimeType,
      createdAt: applicationDocuments.createdAt,
    })
    .from(applicationDocuments)
    .where(eq(applicationDocuments.applicationId, applicationId))
    .orderBy(asc(applicationDocuments.createdAt))

  return rows.map(mapDocument)
}

async function loadLatestPayment(
  institutionId: string,
  applicationId: string,
): Promise<ApplicationPayment | null> {
  const db = await getInstitutionDb(institutionId)
  const [row] = await db
    .select({
      id: applicationPayments.id,
      reference: applicationPayments.reference,
      amount: applicationPayments.amount,
      method: applicationPayments.method,
      status: applicationPayments.status,
      paidAt: applicationPayments.paidAt,
      createdAt: applicationPayments.createdAt,
    })
    .from(applicationPayments)
    .where(eq(applicationPayments.applicationId, applicationId))
    .orderBy(desc(applicationPayments.createdAt))
    .limit(1)

  return row ? mapPayment(row) : null
}

/** The signed-in applicant's own application. */
export async function getApplicationFor(
  institutionId: string,
  applicantUserId: string,
): Promise<Application> {
  const db = await getInstitutionDb(institutionId)

  const [row] = await db
    .select({
      id: applications.id,
      reference: applications.reference,
      status: applications.status,
      firstName: applications.firstName,
      lastName: applications.lastName,
      email: applications.email,
      phone: applications.phone,
      dateOfBirth: applications.dateOfBirth,
      gender: applications.gender,
      nationalId: applications.nationalId,
      previousInstitution: applications.previousInstitution,
      previousQualification: applications.previousQualification,
      details: applications.details,
      submittedAt: applications.submittedAt,
      reviewedAt: applications.reviewedAt,
      createdAt: applications.createdAt,
      programmeId: programmes.id,
      programmeCode: programmes.code,
      programmeName: programmes.name,
      programmeLevel: programmes.level,
      programmeDuration: programmes.durationYears,
    })
    .from(applications)
    .leftJoin(programmes, eq(programmes.id, applications.programmeId))
    .where(eq(applications.applicantUserId, applicantUserId))
    .limit(1)

  if (!row) throw notFound('Your application')

  const [documents, payment, documentRequest, admissionOffer] = await Promise.all([
    loadDocuments(institutionId, row.id),
    loadLatestPayment(institutionId, row.id),
    loadLatestDocumentRequest(institutionId, row.id),
    row.status === 'Accepted' ? loadAdmissionOffer(institutionId, row.id) : Promise.resolve(null),
  ])

  return {
    id: row.id,
    reference: row.reference,
    status: row.status,
    fullName: [row.firstName, row.lastName].filter(Boolean).join(' '),
    email: row.email,
    phone: row.phone,
    programme: row.programmeId
      ? {
          id: row.programmeId,
          code: row.programmeCode!,
          name: row.programmeName!,
          level: row.programmeLevel!,
          durationYears: row.programmeDuration!,
        }
      : null,
    dateOfBirth: row.dateOfBirth,
    gender: row.gender,
    nationalId: row.nationalId,
    previousInstitution: row.previousInstitution,
    previousQualification: row.previousQualification,
    details: row.details ?? null,
    documents,
    payment,
    documentRequest,
    admissionOffer,
    submittedAt: row.submittedAt,
    reviewedAt: row.reviewedAt,
    createdAt: row.createdAt,
  }
}

export async function saveApplication(
  institutionId: string,
  applicantUserId: string,
  input: SaveApplicationRequest,
): Promise<Application> {
  const db = await getInstitutionDb(institutionId)
  const current = await getApplicationFor(institutionId, applicantUserId)

  if (current.status !== 'Draft') {
    throw conflict('Your application has been submitted and can no longer be changed.')
  }

  const nextFirstName =
    input.fullName === undefined ? undefined : splitName(input.fullName).firstName
  const nextLastName =
    input.fullName === undefined ? undefined : splitName(input.fullName).lastName

  await db
    .update(applications)
    .set({
      ...(nextFirstName === undefined ? {} : { firstName: nextFirstName }),
      ...(nextLastName === undefined ? {} : { lastName: nextLastName }),
      ...(input.phone === undefined ? {} : { phone: input.phone }),
      ...(input.dateOfBirth === undefined ? {} : { dateOfBirth: input.dateOfBirth }),
      ...(input.gender === undefined ? {} : { gender: input.gender }),
      ...(input.nationalId === undefined ? {} : { nationalId: input.nationalId }),
      ...(input.previousInstitution === undefined
        ? {}
        : { previousInstitution: input.previousInstitution }),
      ...(input.previousQualification === undefined
        ? {}
        : { previousQualification: input.previousQualification }),
      ...(input.programmeId === undefined ? {} : { programmeId: input.programmeId }),
      ...(input.details === undefined
        ? {}
        : { details: { ...(current.details ?? {}), ...input.details } }),
    })
    .where(eq(applications.id, current.id))

  if (input.fullName !== undefined || input.phone !== undefined) {
    await db
      .update(users)
      .set({
        ...(input.fullName === undefined ? {} : { fullName: input.fullName.trim() }),
        ...(input.phone === undefined ? {} : { phone: input.phone }),
      })
      .where(eq(users.id, applicantUserId))
  }

  return getApplicationFor(institutionId, applicantUserId)
}

export async function listApplicantDocuments(
  institutionId: string,
  applicantUserId: string,
): Promise<ApplicationDocument[]> {
  const application = await getApplicationFor(institutionId, applicantUserId)
  return application.documents
}

export async function presignDocument(
  institutionId: string,
  applicantUserId: string,
  input: PresignDocumentRequest,
): Promise<PresignDocumentResponse> {
  const db = await getInstitutionDb(institutionId)
  const application = await getApplicationFor(institutionId, applicantUserId)

  assertDocumentUploadAllowed({
    applicationStatus: application.status,
    documentType: input.documentType,
    documentRequest: application.documentRequest?.requestedDocuments ?? null,
    documentResponseSubmittedAt: application.documentRequest?.responseSubmittedAt ?? null,
  })

  const { allowed, maxBytes } = mimeRulesForDocumentType(input.documentType)
  if (!allowed.includes(input.mimeType)) {
    throw badRequest('That file type is not accepted for this document.')
  }
  if (input.fileSizeBytes > maxBytes) {
    throw badRequest('That file is too large for this document.')
  }

  const existing = application.documents.find((doc) => doc.documentType === input.documentType)
  if (existing) {
    await removeDocumentRow(institutionId, application.id, existing.id)
  }

  const fileKey = buildFileKey({
    institutionId,
    applicationId: application.id,
    documentType: input.documentType,
    fileName: input.fileName,
  })

  const [row] = await db
    .insert(applicationDocuments)
    .values({
      applicationId: application.id,
      documentType: input.documentType,
      fileName: input.fileName,
      fileKey,
      fileSizeBytes: input.fileSizeBytes,
      mimeType: input.mimeType,
    })
    .returning({ id: applicationDocuments.id })

  const upload = await createUploadTarget({
    fileKey,
    mimeType: input.mimeType,
    fileSizeBytes: input.fileSizeBytes,
  })

  return {
    documentId: row!.id,
    fileKey,
    uploadUrl: upload.uploadUrl,
    uploadMethod: upload.uploadMethod,
    headers: upload.headers,
  }
}

async function removeDocumentRow(
  institutionId: string,
  applicationId: string,
  documentId: string,
): Promise<void> {
  const db = await getInstitutionDb(institutionId)
  const [row] = await db
    .select({
      id: applicationDocuments.id,
      fileKey: applicationDocuments.fileKey,
    })
    .from(applicationDocuments)
    .where(
      and(
        eq(applicationDocuments.id, documentId),
        eq(applicationDocuments.applicationId, applicationId),
      ),
    )
    .limit(1)

  if (!row) return

  await db.delete(applicationDocuments).where(eq(applicationDocuments.id, row.id))
  await deleteStoredObject(row.fileKey).catch(() => undefined)
}

export async function confirmDocument(
  institutionId: string,
  applicantUserId: string,
  documentId: string,
): Promise<ApplicationDocument[]> {
  const application = await getApplicationFor(institutionId, applicantUserId)
  const db = await getInstitutionDb(institutionId)
  const [pending] = await db
    .select({ documentType: applicationDocuments.documentType })
    .from(applicationDocuments)
    .where(
      and(
        eq(applicationDocuments.id, documentId),
        eq(applicationDocuments.applicationId, application.id),
      ),
    )
    .limit(1)

  if (!pending) throw notFound('That document')

  assertDocumentUploadAllowed({
    applicationStatus: application.status,
    documentType: pending.documentType,
    documentRequest: application.documentRequest?.requestedDocuments ?? null,
    documentResponseSubmittedAt: application.documentRequest?.responseSubmittedAt ?? null,
  })

  const [row] = await db
    .select({ id: applicationDocuments.id })
    .from(applicationDocuments)
    .where(
      and(
        eq(applicationDocuments.id, documentId),
        eq(applicationDocuments.applicationId, application.id),
      ),
    )
    .limit(1)

  if (!row) throw notFound('That document')
  return loadDocuments(institutionId, application.id)
}

export async function deleteDocument(
  institutionId: string,
  applicantUserId: string,
  documentId: string,
): Promise<ApplicationDocument[]> {
  const application = await getApplicationFor(institutionId, applicantUserId)
  assertDocumentDeleteAllowed({
    applicationStatus: application.status,
    documentRequest: application.documentRequest?.requestedDocuments ?? null,
    documentResponseSubmittedAt: application.documentRequest?.responseSubmittedAt ?? null,
  })

  await removeDocumentRow(institutionId, application.id, documentId)
  return loadDocuments(institutionId, application.id)
}

export async function getDocumentDownloadForApplicant(
  institutionId: string,
  applicantUserId: string,
  documentId: string,
) {
  const application = await getApplicationFor(institutionId, applicantUserId)
  const db = await getInstitutionDb(institutionId)
  const [row] = await db
    .select({ fileKey: applicationDocuments.fileKey })
    .from(applicationDocuments)
    .where(
      and(
        eq(applicationDocuments.id, documentId),
        eq(applicationDocuments.applicationId, application.id),
      ),
    )
    .limit(1)

  if (!row) throw notFound('That document')
  return createDownloadUrl(row.fileKey)
}

export async function initiatePayment(
  institutionId: string,
  applicantUserId: string,
  input: InitiatePaymentRequest,
): Promise<ApplicationPayment> {
  const db = await getInstitutionDb(institutionId)
  const application = await getApplicationFor(institutionId, applicantUserId)

  if (application.status !== 'Draft') {
    throw conflict('Your application has already been submitted.')
  }

  assertFormComplete(application)
  assertRequiredDocuments(application.documents)

  if (application.payment?.status === 'Completed') {
    return application.payment
  }

  if (
    (input.method === 'MoMo' || input.method === 'Airtel') &&
    !input.payerPhone
  ) {
    throw badRequest('Enter the mobile money number that will pay.')
  }

  const amount = env().APPLICATION_FEE_RWF
  const reference = `PAY-${application.reference}-${randomInt(1000, 9999)}`
  const policy = await readPaymentPolicy(db)

  const validation = validatePaymentAmount({
    amount,
    outstanding: amount,
    policy,
    context: { feeKind: 'ApplicationFee' },
  })
  if (!validation.ok) throw badRequest(validation.message)

  const gateway = await initiatePaymentGateway(institutionId, input.method, reference)
  const completeNow = gateway.completeImmediately

  const [row] = await db
    .insert(applicationPayments)
    .values({
      applicationId: application.id,
      reference,
      amount,
      method: input.method,
      status: completeNow ? 'Completed' : 'Pending',
      gatewayReference: gateway.gatewayReference,
      paidAt: completeNow ? new Date().toISOString() : null,
    })
    .returning({
      id: applicationPayments.id,
      reference: applicationPayments.reference,
      amount: applicationPayments.amount,
      method: applicationPayments.method,
      status: applicationPayments.status,
      paidAt: applicationPayments.paidAt,
      createdAt: applicationPayments.createdAt,
    })

  // Keep a phone against the application details for reconciliation notes.
  if (input.payerPhone) {
    await db
      .update(applications)
      .set({
        details: {
          ...(application.details ?? {}),
          paymentPhone: input.payerPhone,
          paymentMethod: input.method,
        },
      })
      .where(eq(applications.id, application.id))
  }

  return mapPayment(row!)
}

/** Staff / sandbox path to mark a bank transfer (or stuck payment) paid. */
export async function confirmPayment(
  institutionId: string,
  applicationId: string,
  actorUserId: string,
): Promise<ApplicationPayment> {
  const db = await getInstitutionDb(institutionId)
  const [row] = await db
    .select({
      id: applicationPayments.id,
      reference: applicationPayments.reference,
      amount: applicationPayments.amount,
      method: applicationPayments.method,
      status: applicationPayments.status,
      paidAt: applicationPayments.paidAt,
      createdAt: applicationPayments.createdAt,
      applicationId: applicationPayments.applicationId,
    })
    .from(applicationPayments)
    .where(eq(applicationPayments.applicationId, applicationId))
    .orderBy(desc(applicationPayments.createdAt))
    .limit(1)

  if (!row) throw notFound('Payment')
  if (row.status === 'Completed') return mapPayment(row)

  const [updated] = await db
    .update(applicationPayments)
    .set({
      status: 'Completed',
      paidAt: new Date().toISOString(),
      gatewayReference: `manual-${actorUserId}`,
    })
    .where(eq(applicationPayments.id, row.id))
    .returning({
      id: applicationPayments.id,
      reference: applicationPayments.reference,
      amount: applicationPayments.amount,
      method: applicationPayments.method,
      status: applicationPayments.status,
      paidAt: applicationPayments.paidAt,
      createdAt: applicationPayments.createdAt,
    })

  return mapPayment(updated!)
}

/** Applicant confirms bank transfer was sent (still Pending until staff verifies in live mode). */
export async function acknowledgeBankTransfer(
  institutionId: string,
  applicantUserId: string,
): Promise<ApplicationPayment> {
  const application = await getApplicationFor(institutionId, applicantUserId)
  if (!application.payment) throw badRequest('Start a payment before confirming a transfer.')
  if (application.payment.method !== 'BankTransfer') {
    throw badRequest('Only bank transfers use this confirmation step.')
  }

  if (env().PAYMENT_MODE === 'sandbox') {
    return confirmPayment(institutionId, application.id, applicantUserId)
  }

  return application.payment
}

/** Applicant submits uploaded documents in response to an admissions request. */
export async function submitDocumentResponse(
  institutionId: string,
  applicantUserId: string,
): Promise<Application> {
  const db = await getInstitutionDb(institutionId)
  const application = await getApplicationFor(institutionId, applicantUserId)

  if (application.status !== 'DocumentsRequested' || !application.documentRequest) {
    throw badRequest('There are no documents waiting to be submitted.')
  }
  if (application.documentRequest.responseSubmittedAt) {
    throw conflict('Your documents have already been submitted.')
  }

  assertRequestedDocumentsComplete({
    request: application.documentRequest.requestedDocuments,
    documents: application.documents,
  })

  await db
    .update(applications)
    .set({ documentResponseSubmittedAt: new Date().toISOString() })
    .where(eq(applications.id, application.id))

  return getApplicationFor(institutionId, applicantUserId)
}

export { acceptAdmissionOffer, declineAdmissionOffer } from './admissions-enrolment'

/** Hands the application to the admissions office for review. */
export async function submitApplication(
  institutionId: string,
  applicantUserId: string,
): Promise<Application> {
  const db = await getInstitutionDb(institutionId)
  const current = await getApplicationFor(institutionId, applicantUserId)

  if (current.status !== 'Draft') {
    throw conflict('Your application has already been submitted.')
  }

  assertFormComplete(current)
  assertRequiredDocuments(current.documents)

  if (!current.payment || current.payment.status !== 'Completed') {
    throw badRequest('Pay the application fee before submitting.')
  }

  await db
    .update(applications)
    .set({ status: 'Submitted', submittedAt: new Date().toISOString() })
    .where(eq(applications.id, current.id))

  const submitted = await getApplicationFor(institutionId, applicantUserId)

  await notifyApplicationSubmitted({
    institutionId,
    to: submitted.email,
    fullName: submitted.fullName,
    reference: submitted.reference,
    programmeName: submitted.programme?.name ?? null,
  })

  return submitted
}

