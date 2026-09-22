import { Hono } from 'hono'
import { setCookie } from 'hono/cookie'
import { bodyLimit } from 'hono/body-limit'
import {
  confirmDocumentSchema,
  initiatePaymentSchema,
  presignDocumentSchema,
  registerApplicantSchema,
  reviewApplicationSchema,
  saveApplicationSchema,
  verifyApplicantEmailSchema,
  resendApplicantVerificationSchema,
  type RegisterApplicantResponse,
  type AcademicApplicationDetailResponse,
  type AcademicApplicationsResponse,
  type ApplicationResponse,
  type DocumentDownloadUrl,
  type DocumentsResponse,
  type PaymentResponse,
  type PresignDocumentResponse,
  type ProgrammesResponse,
  type SessionResponse,
  MAX_UPLOAD_BYTES,
} from '@stackedu/shared'
import { env } from '../config/env'
import { SESSION_COOKIE, sessionCookieOptions } from '../lib/cookies'
import { badRequest, validationFailed } from '../lib/errors'
import { openLocalFile, writeLocalUpload } from '../lib/storage'
import { requireAuth, requireRole, type AuthVariables } from '../middleware/auth'
import type { RequestVariables } from '../middleware/request-context'
import {
  acknowledgeBankTransfer,
  confirmDocument,
  deleteDocument,
  getApplicationFor,
  getDocumentDownloadForApplicant,
  initiatePayment,
  listApplicantDocuments,
  listProgrammes,
  presignDocument,
  registerApplicant,
  saveApplication,
  submitApplication,
  submitDocumentResponse,
  acceptAdmissionOffer,
  declineAdmissionOffer,
} from '../services/admissions'
import {
  confirmApplicationPayment,
  getApplicationForReview,
  getDocumentDownloadForReview,
  listApplicationsForReview,
  reviewApplication,
} from '../services/admissions-review'
import { resolvePublicInstitution } from '../services/institutions'
import { login } from '../services/auth'
import {
  resendApplicantEmailVerificationByEmail,
  verifyApplicantEmailByEmail,
} from '../services/verification'
import { requireEmailVerified } from '../middleware/auth'

type Variables = RequestVariables & Partial<AuthVariables>

export const admissionRoutes = new Hono<{ Variables: Variables }>()

function fieldErrors(error: { flatten: () => { fieldErrors: unknown } }): Record<string, string[]> {
  return error.flatten().fieldErrors as Record<string, string[]>
}

/** The programmes someone can apply to. Public — there is no account yet. */
admissionRoutes.get('/apply/programmes', async (c) => {
  const institution = await resolvePublicInstitution(c.req.header('host'))
  const programmes = await listProgrammes(institution.id)

  return c.json<ProgrammesResponse>({ programmes })
})

/**
 * Creates the applicant's account and draft application, then sends a verification
 * code. They are not signed in until the code is confirmed.
 */
admissionRoutes.post('/apply/register', async (c) => {
  const parsed = registerApplicantSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))

  const institution = await resolvePublicInstitution(c.req.header('host'))
  const created = await registerApplicant(institution.id, parsed.data)

  c.get('logger').info('Applicant registered', {
    reference: created.reference,
    institution: institution.slug,
  })

  return c.json<RegisterApplicantResponse>(
    {
      email: created.email,
      fullName: parsed.data.fullName,
      reference: created.reference,
    },
    201,
  )
})

/**
 * Local-driver PUT target. Authenticated by a short-lived HMAC token, not the
 * session cookie, so the browser can upload with a plain fetch.
 */
admissionRoutes.put(
  '/apply/documents/upload/:token',
  bodyLimit({ maxSize: MAX_UPLOAD_BYTES }),
  async (c) => {
    const token = c.req.param('token')
    const lengthHeader = c.req.header('content-length')
    const contentLength = lengthHeader ? Number(lengthHeader) : undefined
    const bytes = Buffer.from(await c.req.arrayBuffer())
    if (bytes.byteLength === 0) throw badRequest('Upload body is missing.')

    await writeLocalUpload(token, bytes, contentLength)
    return c.body(null, 204)
  },
)

admissionRoutes.get('/apply/documents/file/:token', async (c) => {
  const { stream, fileKey } = openLocalFile(c.req.param('token'))
  const fileName = fileKey.split('/').pop() ?? 'document'
  c.header('Content-Type', 'application/octet-stream')
  c.header('Content-Disposition', `attachment; filename="${fileName}"`)
  c.header('Cache-Control', 'private, no-store')
  return c.body(stream as unknown as ReadableStream)
})

const applicantOnly = [requireAuth, requireRole('Applicant')] as const
const verifiedApplicantOnly = [...applicantOnly, requireEmailVerified()] as const
const academicOnly = [requireAuth, requireRole('AcademicAdmin')] as const

admissionRoutes.post('/apply/verify-email', async (c) => {
  const parsed = verifyApplicantEmailSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))

  const institution = await resolvePublicInstitution(c.req.header('host'))
  await verifyApplicantEmailByEmail({
    institutionId: institution.id,
    email: parsed.data.email,
    code: parsed.data.code,
  })

  const session = await login({
    identifier: parsed.data.email,
    password: parsed.data.password,
    ipAddress: c.req.header('x-forwarded-for')?.split(',')[0]?.trim(),
    userAgent: c.req.header('user-agent'),
  })

  if (session.status !== 'session') {
    throw new Error('Applicant verification did not return a session.')
  }

  setCookie(c, SESSION_COOKIE, session.cookieValue, sessionCookieOptions(env(), session.expiresAt))

  return c.json<SessionResponse>({ user: session.user })
})

admissionRoutes.post('/apply/resend-verification', async (c) => {
  const parsed = resendApplicantVerificationSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))

  const institution = await resolvePublicInstitution(c.req.header('host'))
  await resendApplicantEmailVerificationByEmail(institution.id, parsed.data.email)
  return c.body(null, 204)
})

admissionRoutes.get('/apply/application', ...verifiedApplicantOnly, async (c) => {
  const user = c.get('user')!
  const application = await getApplicationFor(user.institution.id, user.id)
  return c.json<ApplicationResponse>({ application })
})

admissionRoutes.patch('/apply/application', ...verifiedApplicantOnly, async (c) => {
  const parsed = saveApplicationSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))

  const user = c.get('user')!
  const application = await saveApplication(user.institution.id, user.id, parsed.data)
  return c.json<ApplicationResponse>({ application })
})

admissionRoutes.get('/apply/documents', ...verifiedApplicantOnly, async (c) => {
  const user = c.get('user')!
  const documents = await listApplicantDocuments(user.institution.id, user.id)
  return c.json<DocumentsResponse>({ documents })
})

admissionRoutes.post('/apply/documents/presign', ...verifiedApplicantOnly, async (c) => {
  const parsed = presignDocumentSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))

  const user = c.get('user')!
  const result = await presignDocument(user.institution.id, user.id, parsed.data)
  return c.json<PresignDocumentResponse>(result, 201)
})

admissionRoutes.post('/apply/documents/confirm', ...verifiedApplicantOnly, async (c) => {
  const parsed = confirmDocumentSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))

  const user = c.get('user')!
  const documents = await confirmDocument(user.institution.id, user.id, parsed.data.documentId)
  return c.json<DocumentsResponse>({ documents })
})

admissionRoutes.delete('/apply/documents/:documentId', ...verifiedApplicantOnly, async (c) => {
  const user = c.get('user')!
  const documents = await deleteDocument(user.institution.id, user.id, c.req.param('documentId'))
  return c.json<DocumentsResponse>({ documents })
})

admissionRoutes.post('/apply/documents/submit-response', ...verifiedApplicantOnly, async (c) => {
  const user = c.get('user')!
  const application = await submitDocumentResponse(user.institution.id, user.id)
  return c.json<ApplicationResponse>({ application })
})

admissionRoutes.post('/apply/accept-admission', ...verifiedApplicantOnly, async (c) => {
  const user = c.get('user')!
  const result = await acceptAdmissionOffer(user.institution.id, user.id)
  return c.json(result)
})

admissionRoutes.post('/apply/decline-admission', ...verifiedApplicantOnly, async (c) => {
  const user = c.get('user')!
  const result = await declineAdmissionOffer(user.institution.id, user.id)
  return c.json(result)
})

admissionRoutes.get('/apply/documents/:documentId/url', ...verifiedApplicantOnly, async (c) => {
  const user = c.get('user')!
  const result = await getDocumentDownloadForApplicant(
    user.institution.id,
    user.id,
    c.req.param('documentId'),
  )
  return c.json<DocumentDownloadUrl>(result)
})

admissionRoutes.post('/apply/payment', ...verifiedApplicantOnly, async (c) => {
  const parsed = initiatePaymentSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))

  const user = c.get('user')!
  const payment = await initiatePayment(user.institution.id, user.id, parsed.data)
  c.get('logger').info('Application payment initiated', {
    reference: payment.reference,
    status: payment.status,
    method: payment.method,
  })
  return c.json<PaymentResponse>({ payment }, 201)
})

admissionRoutes.post('/apply/payment/acknowledge-bank', ...verifiedApplicantOnly, async (c) => {
  const user = c.get('user')!
  const payment = await acknowledgeBankTransfer(user.institution.id, user.id)
  return c.json<PaymentResponse>({ payment })
})

admissionRoutes.post('/apply/application/submit', ...verifiedApplicantOnly, async (c) => {
  const user = c.get('user')!
  const application = await submitApplication(user.institution.id, user.id)
  c.get('logger').info('Application submitted', { reference: application.reference })
  return c.json<ApplicationResponse>({ application })
})

/** Academic admissions inbox — never lists Draft applications. */
admissionRoutes.get('/academic/applications', ...academicOnly, async (c) => {
  const user = c.get('user')!
  const applications = await listApplicationsForReview(user.institution.id, {
    status: c.req.query('status') ?? undefined,
    q: c.req.query('q') ?? undefined,
  })
  return c.json<AcademicApplicationsResponse>({ applications })
})

admissionRoutes.get('/academic/applications/:id', ...academicOnly, async (c) => {
  const user = c.get('user')!
  const application = await getApplicationForReview(user.institution.id, c.req.param('id'))
  return c.json<AcademicApplicationDetailResponse>({ application })
})

admissionRoutes.post('/academic/applications/:id/decision', ...academicOnly, async (c) => {
  const parsed = reviewApplicationSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))

  const user = c.get('user')!
  const application = await reviewApplication(
    user.institution.id,
    c.req.param('id'),
    user.id,
    parsed.data,
  )
  c.get('logger').info('Application reviewed', {
    reference: application.reference,
    decision: parsed.data.decision,
  })
  return c.json<AcademicApplicationDetailResponse>({ application })
})

admissionRoutes.post('/academic/applications/:id/confirm-payment', ...academicOnly, async (c) => {
  const user = c.get('user')!
  const application = await confirmApplicationPayment(
    user.institution.id,
    c.req.param('id'),
    user.id,
  )
  return c.json<AcademicApplicationDetailResponse>({ application })
})

admissionRoutes.get(
  '/academic/applications/:id/documents/:documentId/url',
  ...academicOnly,
  async (c) => {
    const user = c.get('user')!
    const result = await getDocumentDownloadForReview(
      user.institution.id,
      c.req.param('id'),
      c.req.param('documentId'),
    )
    return c.json<DocumentDownloadUrl>(result)
  },
)
