import { Hono } from 'hono'
import {
  createBursarAnnouncementRequestSchema,
  createBursarFeeItemRequestSchema,
  paymentMethodSchema,
  paymentStatusSchema,
  recordBursarManualPaymentRequestSchema,
  resolveBursarReconciliationRequestSchema,
  setBursarFeeHoldRequestSchema,
  updateBursarFeeItemRequestSchema,
  voidBursarReceiptRequestSchema,
} from '@stackedu/shared'
import { validationFailed } from '../lib/errors'
import { requireAuth, requireRole, type AuthVariables } from '../middleware/auth'
import type { RequestVariables } from '../middleware/request-context'
import {
  createBursarAnnouncement,
  createBursarFeeItem,
  deleteBursarFeeItem,
  getBursarDashboard,
  getBursarProfile,
  getBursarReports,
  getBursarStudentAccount,
  issueSemesterFeeInvoices,
  listBursarAudienceOptions,
  listBursarFeeItems,
  listBursarFeeMessages,
  listBursarNotifications,
  listBursarPayments,
  listBursarProgrammes,
  listBursarReceipts,
  listBursarReconciliation,
  listBursarStudentAccounts,
  markAllBursarNotificationsRead,
  markBursarNotificationRead,
  recordBursarManualPayment,
  releaseBursarFeeHold,
  resolveBursarReconciliation,
  setBursarFeeHold,
  updateBursarFeeItem,
  voidBursarReceipt,
} from '../services/bursar'

type Variables = RequestVariables & Partial<AuthVariables>

export const bursarRoutes = new Hono<{ Variables: Variables }>()

const bursarOnly = [requireAuth, requireRole('Bursar')] as const

function fieldErrors(error: { flatten: () => { fieldErrors: unknown } }): Record<string, string[]> {
  return error.flatten().fieldErrors as Record<string, string[]>
}

function actor(c: { get: (key: 'user') => AuthVariables['user'] | undefined }) {
  const user = c.get('user')!
  return { id: user.id, email: user.email, role: user.role }
}

bursarRoutes.get('/bursar/me', ...bursarOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ profile: await getBursarProfile(user.institution.id, user.id) })
})

bursarRoutes.get('/bursar/dashboard', ...bursarOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ dashboard: await getBursarDashboard(user.institution.id, user.id) })
})

bursarRoutes.get('/bursar/payments', ...bursarOnly, async (c) => {
  const user = c.get('user')!
  const method = c.req.query('method')
  const status = c.req.query('status')
  const parsedMethod = method ? paymentMethodSchema.safeParse(method) : null
  const parsedStatus = status ? paymentStatusSchema.safeParse(status) : null
  if (method && parsedMethod && !parsedMethod.success) throw validationFailed(fieldErrors(parsedMethod.error))
  if (status && parsedStatus && !parsedStatus.success) throw validationFailed(fieldErrors(parsedStatus.error))

  return c.json({
    payments: await listBursarPayments(user.institution.id, user.id, {
      method: parsedMethod?.success ? parsedMethod.data : undefined,
      status: parsedStatus?.success ? parsedStatus.data : undefined,
      from: c.req.query('from') || undefined,
      to: c.req.query('to') || undefined,
    }),
  })
})

bursarRoutes.get('/bursar/programmes', ...bursarOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ programmes: await listBursarProgrammes(user.institution.id, user.id) })
})

bursarRoutes.get('/bursar/fee-items', ...bursarOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ items: await listBursarFeeItems(user.institution.id, user.id) })
})

bursarRoutes.post('/bursar/fee-items', ...bursarOnly, async (c) => {
  const user = c.get('user')!
  const body = createBursarFeeItemRequestSchema.safeParse(await c.req.json())
  if (!body.success) throw validationFailed(fieldErrors(body.error))
  return c.json({
    item: await createBursarFeeItem(user.institution.id, user.id, actor(c), body.data),
  })
})

bursarRoutes.patch('/bursar/fee-items/:itemId', ...bursarOnly, async (c) => {
  const user = c.get('user')!
  const body = updateBursarFeeItemRequestSchema.safeParse(await c.req.json())
  if (!body.success) throw validationFailed(fieldErrors(body.error))
  return c.json({
    item: await updateBursarFeeItem(user.institution.id, user.id, actor(c), c.req.param('itemId'), body.data),
  })
})

bursarRoutes.delete('/bursar/fee-items/:itemId', ...bursarOnly, async (c) => {
  const user = c.get('user')!
  await deleteBursarFeeItem(user.institution.id, user.id, actor(c), c.req.param('itemId'))
  return c.body(null, 204)
})

bursarRoutes.get('/bursar/student-accounts', ...bursarOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ accounts: await listBursarStudentAccounts(user.institution.id, user.id) })
})

bursarRoutes.get('/bursar/student-accounts/:studentId', ...bursarOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    account: await getBursarStudentAccount(user.institution.id, user.id, c.req.param('studentId')),
  })
})

bursarRoutes.post('/bursar/student-accounts/:studentId/payments', ...bursarOnly, async (c) => {
  const user = c.get('user')!
  const body = recordBursarManualPaymentRequestSchema.safeParse(await c.req.json())
  if (!body.success) throw validationFailed(fieldErrors(body.error))
  return c.json({
    account: await recordBursarManualPayment(
      user.institution.id,
      user.id,
      actor(c),
      c.req.param('studentId'),
      body.data,
    ),
  })
})

bursarRoutes.post('/bursar/student-accounts/:studentId/hold', ...bursarOnly, async (c) => {
  const user = c.get('user')!
  const body = setBursarFeeHoldRequestSchema.safeParse(await c.req.json())
  if (!body.success) throw validationFailed(fieldErrors(body.error))
  return c.json({
    account: await setBursarFeeHold(user.institution.id, user.id, actor(c), c.req.param('studentId'), body.data),
  })
})

bursarRoutes.delete('/bursar/student-accounts/:studentId/hold', ...bursarOnly, async (c) => {
  const user = c.get('user')!
  const reason = c.req.query('reason')?.trim()
  if (!reason) throw validationFailed({ reason: ['Provide a reason for releasing the hold.'] })
  return c.json({
    account: await releaseBursarFeeHold(user.institution.id, user.id, actor(c), c.req.param('studentId'), reason),
  })
})

bursarRoutes.get('/bursar/receipts', ...bursarOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    receipts: await listBursarReceipts(user.institution.id, user.id, {
      from: c.req.query('from') || undefined,
      to: c.req.query('to') || undefined,
    }),
  })
})

bursarRoutes.post('/bursar/receipts/:receiptId/void', ...bursarOnly, async (c) => {
  const user = c.get('user')!
  const body = voidBursarReceiptRequestSchema.safeParse(await c.req.json())
  if (!body.success) throw validationFailed(fieldErrors(body.error))
  return c.json({
    receipt: await voidBursarReceipt(user.institution.id, user.id, actor(c), c.req.param('receiptId'), body.data.reason),
  })
})

bursarRoutes.get('/bursar/reconciliation', ...bursarOnly, async (c) => {
  const user = c.get('user')!
  return c.json(await listBursarReconciliation(user.institution.id, user.id))
})

bursarRoutes.post('/bursar/reconciliation/:recordId/resolve', ...bursarOnly, async (c) => {
  const user = c.get('user')!
  const body = resolveBursarReconciliationRequestSchema.safeParse(await c.req.json())
  if (!body.success) throw validationFailed(fieldErrors(body.error))
  return c.json({
    record: await resolveBursarReconciliation(
      user.institution.id,
      user.id,
      actor(c),
      c.req.param('recordId'),
      body.data,
    ),
  })
})

bursarRoutes.get('/bursar/reports', ...bursarOnly, async (c) => {
  const user = c.get('user')!
  const type = c.req.query('type') ?? 'daily'
  if (!['daily', 'monthly', 'semester', 'annual'].includes(type)) {
    throw validationFailed({ type: ['Choose daily, monthly, semester, or annual.'] })
  }
  return c.json({
    reports: await getBursarReports(user.institution.id, user.id, type as 'daily' | 'monthly' | 'semester' | 'annual'),
  })
})

bursarRoutes.get('/bursar/notifications', ...bursarOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ notifications: await listBursarNotifications(user.institution.id, user.id) })
})

bursarRoutes.post('/bursar/notifications/read-all', ...bursarOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ notifications: await markAllBursarNotificationsRead(user.institution.id, user.id) })
})

bursarRoutes.post('/bursar/notifications/:id/read', ...bursarOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    notifications: await markBursarNotificationRead(user.institution.id, user.id, c.req.param('id')),
  })
})

bursarRoutes.get('/bursar/audience-options', ...bursarOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ options: await listBursarAudienceOptions(user.institution.id, user.id) })
})

bursarRoutes.get('/bursar/announcements', ...bursarOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ messages: await listBursarFeeMessages(user.institution.id, user.id) })
})

bursarRoutes.post('/bursar/announcements', ...bursarOnly, async (c) => {
  const user = c.get('user')!
  const body = createBursarAnnouncementRequestSchema.safeParse(await c.req.json())
  if (!body.success) throw validationFailed(fieldErrors(body.error))
  return c.json({
    result: await createBursarAnnouncement(user.institution.id, user.id, actor(c), body.data),
  })
})

bursarRoutes.post('/bursar/fee-structure/issue-invoices', ...bursarOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    result: await issueSemesterFeeInvoices(user.institution.id, user.id, actor(c)),
  })
})
