import { and, asc, desc, eq, ilike, ne, or, sql } from 'drizzle-orm'
import {
  applicationStatusSchema,
  DRAFT_APPLICATION_REVIEW_MESSAGE,
  type AcademicApplicationDetail,
  type AcademicApplicationSummary,
  type ApplicationPayment,
  type ReviewApplicationRequest,
} from '@stackedu/shared'
import { getInstitutionDb } from '../db/connection'
import {
  applicationDocuments,
  applicationPayments,
  applicationReviews,
  applications,
} from '../db/institution/schema/admissions'
import { programmes } from '../db/institution/schema/academic'
import { AppError, badRequest, conflict, notFound } from '../lib/errors'
import { isDocumentNewForAdmin } from '../lib/application-documents'
import { notifyApplicationDecision } from '../lib/admissions-email'
import { createDownloadUrl } from '../lib/storage'
import { confirmPayment } from './admissions'
import {
  loadApplicationReviews,
  loadLatestDocumentRequest,
  mapRequestedDocumentsForStorage,
} from './admissions-read'
import { createAdmissionOffer, loadAdmissionOffer } from './admissions-enrolment'

function mapDocument(
  row: {
    id: string
    documentType: string
    fileName: string
    fileSizeBytes: number | null
    mimeType: string | null
    createdAt: string
    adminViewedAt: string | null
  },
  documentRequestRequestedAt: string | null,
) {
  return {
    id: row.id,
    documentType: row.documentType,
    fileName: row.fileName,
    fileSizeBytes: row.fileSizeBytes,
    mimeType: row.mimeType,
    uploadedAt: row.createdAt,
    isNew: isDocumentNewForAdmin({
      uploadedAt: row.createdAt,
      adminViewedAt: row.adminViewedAt,
      documentRequestRequestedAt,
    }),
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

/** Submitted applications and later — drafts stay private to the applicant. */
export async function listApplicationsForReview(
  institutionId: string,
  filters: { status?: string; q?: string } = {},
): Promise<AcademicApplicationSummary[]> {
  const db = await getInstitutionDb(institutionId)

  const conditions = [ne(applications.status, 'Draft')]
  if (filters.status && filters.status !== 'All') {
    const status = applicationStatusSchema.safeParse(filters.status)
    if (!status.success) throw badRequest('Unknown application status filter.')
    conditions.push(eq(applications.status, status.data))
  }
  if (filters.q?.trim()) {
    const term = `%${filters.q.trim()}%`
    conditions.push(
      or(
        ilike(applications.reference, term),
        ilike(applications.firstName, term),
        ilike(applications.lastName, term),
        ilike(applications.email, term),
        ilike(programmes.name, term),
      )!,
    )
  }

  const rows = await db
    .select({
      id: applications.id,
      reference: applications.reference,
      firstName: applications.firstName,
      lastName: applications.lastName,
      email: applications.email,
      phone: applications.phone,
      status: applications.status,
      submittedAt: applications.submittedAt,
      reviewedAt: applications.reviewedAt,
      createdAt: applications.createdAt,
      programmeName: programmes.name,
      programmeCode: programmes.code,
      documentCount: sql<number>`(
        select count(*)::int from application_documents d
        where d.application_id = ${applications.id}
      )`,
      paymentStatus: sql<ApplicationPayment['status'] | null>`(
        select p.status from application_payments p
        where p.application_id = ${applications.id}
        order by p.created_at desc
        limit 1
      )`,
    })
    .from(applications)
    .innerJoin(programmes, eq(programmes.id, applications.programmeId))
    .where(and(...conditions))
    .orderBy(desc(applications.submittedAt), desc(applications.createdAt))

  return rows.map((row) => ({
    id: row.id,
    reference: row.reference,
    fullName: [row.firstName, row.lastName].filter(Boolean).join(' '),
    email: row.email,
    phone: row.phone,
    programmeName: row.programmeName,
    programmeCode: row.programmeCode,
    status: row.status,
    submittedAt: row.submittedAt,
    reviewedAt: row.reviewedAt,
    createdAt: row.createdAt,
    paymentStatus: row.paymentStatus,
    documentCount: Number(row.documentCount ?? 0),
  }))
}

export async function getApplicationForReview(
  institutionId: string,
  applicationId: string,
): Promise<AcademicApplicationDetail> {
  const db = await getInstitutionDb(institutionId)

  const [row] = await db
    .select({
      id: applications.id,
      reference: applications.reference,
      firstName: applications.firstName,
      lastName: applications.lastName,
      email: applications.email,
      phone: applications.phone,
      status: applications.status,
      dateOfBirth: applications.dateOfBirth,
      gender: applications.gender,
      nationalId: applications.nationalId,
      previousInstitution: applications.previousInstitution,
      previousQualification: applications.previousQualification,
      details: applications.details,
      submittedAt: applications.submittedAt,
      reviewedAt: applications.reviewedAt,
      createdAt: applications.createdAt,
      programmeName: programmes.name,
      programmeCode: programmes.code,
    })
    .from(applications)
    .innerJoin(programmes, eq(programmes.id, applications.programmeId))
    .where(and(eq(applications.id, applicationId), ne(applications.status, 'Draft')))
    .limit(1)

  if (!row) {
    const [hidden] = await db
      .select({ status: applications.status })
      .from(applications)
      .where(eq(applications.id, applicationId))
      .limit(1)
    if (hidden?.status === 'Draft') {
      throw new AppError('NOT_FOUND', 404, DRAFT_APPLICATION_REVIEW_MESSAGE)
    }
    throw notFound('Application')
  }

  const [latestDocumentRequest, docs] = await Promise.all([
    loadLatestDocumentRequest(institutionId, applicationId),
    db
      .select({
        id: applicationDocuments.id,
        documentType: applicationDocuments.documentType,
        fileName: applicationDocuments.fileName,
        fileSizeBytes: applicationDocuments.fileSizeBytes,
        mimeType: applicationDocuments.mimeType,
        createdAt: applicationDocuments.createdAt,
        adminViewedAt: applicationDocuments.adminViewedAt,
      })
      .from(applicationDocuments)
      .where(eq(applicationDocuments.applicationId, applicationId))
      .orderBy(desc(applicationDocuments.createdAt)),
  ])

  const documentRequestRequestedAt = latestDocumentRequest?.requestedAt ?? null

  const [payment] = await db
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

  return {
    id: row.id,
    reference: row.reference,
    fullName: [row.firstName, row.lastName].filter(Boolean).join(' '),
    email: row.email,
    phone: row.phone,
    programmeName: row.programmeName,
    programmeCode: row.programmeCode,
    status: row.status,
    submittedAt: row.submittedAt,
    reviewedAt: row.reviewedAt,
    createdAt: row.createdAt,
    paymentStatus: payment?.status ?? null,
    documentCount: docs.length,
    dateOfBirth: row.dateOfBirth,
    gender: row.gender,
    nationalId: row.nationalId,
    previousInstitution: row.previousInstitution,
    previousQualification: row.previousQualification,
    details: row.details ?? null,
    documents: docs.map((doc) => mapDocument(doc, documentRequestRequestedAt)),
    payment: payment ? mapPayment(payment) : null,
    reviews: await loadApplicationReviews(institutionId, applicationId),
    admissionOffer: await loadAdmissionOffer(institutionId, applicationId),
  }
}

export async function reviewApplication(
  institutionId: string,
  applicationId: string,
  reviewerId: string,
  input: ReviewApplicationRequest,
): Promise<AcademicApplicationDetail> {
  const db = await getInstitutionDb(institutionId)
  const current = await getApplicationForReview(institutionId, applicationId)

  if (current.status === 'Accepted' || current.status === 'Rejected') {
    throw conflict('This application already has a final decision.')
  }

  if (
    input.decision === 'Accepted' &&
    current.payment?.status !== 'Completed'
  ) {
    throw badRequest('Confirm the application fee is paid before accepting.')
  }

  const requestedDocuments =
    input.decision === 'DocumentsRequested'
      ? mapRequestedDocumentsForStorage(input.requestedDocuments)
      : null

  if (input.decision === 'DocumentsRequested' && !requestedDocuments) {
    throw badRequest('Select at least one document to request.')
  }

  await db.insert(applicationReviews).values({
    applicationId,
    reviewerId,
    decision: input.decision,
    comments: input.comments?.trim() || null,
    requestedDocuments,
  })

  await db
    .update(applications)
    .set({
      status: input.decision,
      reviewedBy: reviewerId,
      reviewedAt: new Date().toISOString(),
      ...(input.decision === 'DocumentsRequested'
        ? { documentResponseSubmittedAt: null }
        : {}),
    })
    .where(eq(applications.id, applicationId))

  if (input.decision === 'Accepted') {
    const [applicationRow] = await db
      .select({ programmeId: applications.programmeId })
      .from(applications)
      .where(eq(applications.id, applicationId))
      .limit(1)

    if (applicationRow) {
      await createAdmissionOffer({
        institutionId,
        applicationId,
        programmeId: applicationRow.programmeId,
        issuedBy: reviewerId,
      })
    }
  }

  const updated = await getApplicationForReview(institutionId, applicationId)

  await notifyApplicationDecision({
    institutionId,
    to: updated.email,
    fullName: updated.fullName,
    reference: updated.reference,
    decision: input.decision,
    comments: input.comments,
    requestedDocuments,
  })

  return updated
}

export async function confirmApplicationPayment(
  institutionId: string,
  applicationId: string,
  actorUserId: string,
): Promise<AcademicApplicationDetail> {
  await getApplicationForReview(institutionId, applicationId)
  await confirmPayment(institutionId, applicationId, actorUserId)
  return getApplicationForReview(institutionId, applicationId)
}

export async function getDocumentDownloadForReview(
  institutionId: string,
  applicationId: string,
  documentId: string,
) {
  await getApplicationForReview(institutionId, applicationId)
  const db = await getInstitutionDb(institutionId)
  const [row] = await db
    .select({ fileKey: applicationDocuments.fileKey })
    .from(applicationDocuments)
    .where(
      and(
        eq(applicationDocuments.id, documentId),
        eq(applicationDocuments.applicationId, applicationId),
      ),
    )
    .limit(1)

  if (!row) throw notFound('That document')

  await db
    .update(applicationDocuments)
    .set({ adminViewedAt: new Date().toISOString() })
    .where(
      and(
        eq(applicationDocuments.id, documentId),
        eq(applicationDocuments.applicationId, applicationId),
      ),
    )

  return createDownloadUrl(row.fileKey)
}
