import type {
  BursarAudienceOptions,
  BursarDashboard,
  BursarFeeItem,
  BursarFeeMessage,
  BursarNotification,
  BursarPaymentRow,
  BursarProfile,
  BursarReceiptRow,
  BursarReconciliationRow,
  BursarReports,
  BursarStudentAccountDetail,
  BursarStudentAccountRow,
  CreateBursarAnnouncementRequest,
  CreateBursarAnnouncementResult,
  CreateBursarFeeItemRequest,
  IssueSemesterFeesResult,
  PaymentMethod,
  PaymentStatus,
  RecordBursarManualPaymentRequest,
  ResolveBursarReconciliationRequest,
  SetBursarFeeHoldRequest,
  UpdateBursarFeeItemRequest,
} from '@stackedu/shared'
import { api } from './client'

export const bursarProfileQueryKey = ['bursar', 'me'] as const
export const bursarDashboardQueryKey = ['bursar', 'dashboard'] as const
export const bursarPaymentsQueryKey = (filters?: Record<string, string | undefined>) =>
  ['bursar', 'payments', filters ?? {}] as const
export const bursarFeeItemsQueryKey = ['bursar', 'fee-items'] as const
export const bursarProgrammesQueryKey = ['bursar', 'programmes'] as const
export const bursarAcademicYearsQueryKey = ['bursar', 'academic-years'] as const
export const bursarSemestersQueryKey = (academicYearId: string) => ['bursar', 'semesters', academicYearId] as const
export const bursarStudentAccountsQueryKey = ['bursar', 'student-accounts'] as const
export const bursarStudentAccountQueryKey = (id: string) => ['bursar', 'student-account', id] as const
export const bursarReceiptsQueryKey = (filters?: Record<string, string | undefined>) =>
  ['bursar', 'receipts', filters ?? {}] as const
export const bursarReconciliationQueryKey = ['bursar', 'reconciliation'] as const
export const bursarReportsQueryKey = (type: string) => ['bursar', 'reports', type] as const
export const bursarNotificationsQueryKey = ['bursar', 'notifications'] as const
export const bursarAudienceOptionsQueryKey = ['bursar', 'audience-options'] as const
export const bursarFeeMessagesQueryKey = ['bursar', 'fee-messages'] as const

export async function getBursarProfile(): Promise<BursarProfile> {
  const { profile } = await api.get<{ profile: BursarProfile }>('/bursar/me')
  return profile
}

export async function getBursarDashboard(): Promise<BursarDashboard> {
  const { dashboard } = await api.get<{ dashboard: BursarDashboard }>('/bursar/dashboard')
  return dashboard
}

export async function listBursarPayments(filters?: {
  method?: PaymentMethod
  status?: PaymentStatus
  from?: string
  to?: string
}): Promise<BursarPaymentRow[]> {
  const params = new URLSearchParams()
  if (filters?.method) params.set('method', filters.method)
  if (filters?.status) params.set('status', filters.status)
  if (filters?.from) params.set('from', filters.from)
  if (filters?.to) params.set('to', filters.to)
  const query = params.toString()
  const { payments } = await api.get<{ payments: BursarPaymentRow[] }>(`/bursar/payments${query ? `?${query}` : ''}`)
  return payments
}

export async function listBursarProgrammes(): Promise<Array<{ id: string; name: string }>> {
  const { programmes } = await api.get<{ programmes: Array<{ id: string; name: string }> }>('/bursar/programmes')
  return programmes
}

export async function listBursarAcademicYears(): Promise<Array<{ id: string; name: string; isCurrent: boolean }>> {
  const { academicYears } = await api.get<{ academicYears: Array<{ id: string; name: string; isCurrent: boolean }> }>(
    '/bursar/academic-years',
  )
  return academicYears
}

export async function listBursarSemesters(
  academicYearId: string,
): Promise<Array<{ id: string; name: string; isCurrent: boolean }>> {
  const { semesters } = await api.get<{ semesters: Array<{ id: string; name: string; isCurrent: boolean }> }>(
    `/bursar/semesters?academicYearId=${encodeURIComponent(academicYearId)}`,
  )
  return semesters
}

export async function listBursarFeeItems(): Promise<BursarFeeItem[]> {
  const { items } = await api.get<{ items: BursarFeeItem[] }>('/bursar/fee-items')
  return items
}

export async function createBursarFeeItem(input: CreateBursarFeeItemRequest): Promise<BursarFeeItem> {
  const { item } = await api.post<{ item: BursarFeeItem }>('/bursar/fee-items', input)
  return item
}

export async function updateBursarFeeItem(itemId: string, input: UpdateBursarFeeItemRequest): Promise<BursarFeeItem> {
  const { item } = await api.patch<{ item: BursarFeeItem }>(`/bursar/fee-items/${itemId}`, input)
  return item
}

export async function deleteBursarFeeItem(itemId: string): Promise<void> {
  await api.delete(`/bursar/fee-items/${itemId}`)
}

export async function listBursarStudentAccounts(): Promise<BursarStudentAccountRow[]> {
  const { accounts } = await api.get<{ accounts: BursarStudentAccountRow[] }>('/bursar/student-accounts')
  return accounts
}

export async function getBursarStudentAccount(studentId: string): Promise<BursarStudentAccountDetail> {
  const { account } = await api.get<{ account: BursarStudentAccountDetail }>(`/bursar/student-accounts/${studentId}`)
  return account
}

export async function recordBursarManualPayment(
  studentId: string,
  input: RecordBursarManualPaymentRequest,
): Promise<BursarStudentAccountDetail> {
  const { account } = await api.post<{ account: BursarStudentAccountDetail }>(
    `/bursar/student-accounts/${studentId}/payments`,
    input,
  )
  return account
}

export async function setBursarFeeHold(
  studentId: string,
  input: SetBursarFeeHoldRequest,
): Promise<BursarStudentAccountDetail> {
  const { account } = await api.post<{ account: BursarStudentAccountDetail }>(
    `/bursar/student-accounts/${studentId}/hold`,
    input,
  )
  return account
}

export async function releaseBursarFeeHold(studentId: string, reason: string): Promise<BursarStudentAccountDetail> {
  const { account } = await api.delete<{ account: BursarStudentAccountDetail }>(
    `/bursar/student-accounts/${studentId}/hold`,
    { query: { reason } },
  )
  return account
}

export async function listBursarReceipts(filters?: { from?: string; to?: string }): Promise<BursarReceiptRow[]> {
  const params = new URLSearchParams()
  if (filters?.from) params.set('from', filters.from)
  if (filters?.to) params.set('to', filters.to)
  const query = params.toString()
  const { receipts } = await api.get<{ receipts: BursarReceiptRow[] }>(`/bursar/receipts${query ? `?${query}` : ''}`)
  return receipts
}

export async function voidBursarReceipt(receiptId: string, reason: string): Promise<BursarReceiptRow> {
  const { receipt } = await api.post<{ receipt: BursarReceiptRow }>(`/bursar/receipts/${receiptId}/void`, { reason })
  return receipt
}

export async function listBursarReconciliation(): Promise<{
  pending: BursarReconciliationRow[]
  resolved: BursarReconciliationRow[]
}> {
  return api.get<{ pending: BursarReconciliationRow[]; resolved: BursarReconciliationRow[] }>('/bursar/reconciliation')
}

export async function resolveBursarReconciliation(
  recordId: string,
  input: ResolveBursarReconciliationRequest,
): Promise<BursarReconciliationRow> {
  const { record } = await api.post<{ record: BursarReconciliationRow }>(
    `/bursar/reconciliation/${recordId}/resolve`,
    input,
  )
  return record
}

export async function getBursarReports(type: BursarReports['type']): Promise<BursarReports> {
  const { reports } = await api.get<{ reports: BursarReports }>(`/bursar/reports?type=${type}`)
  return reports
}

export async function listBursarNotifications(): Promise<BursarNotification[]> {
  const { notifications } = await api.get<{ notifications: BursarNotification[] }>('/bursar/notifications')
  return notifications
}

export async function markBursarNotificationRead(id: string): Promise<BursarNotification[]> {
  const { notifications } = await api.post<{ notifications: BursarNotification[] }>(`/bursar/notifications/${id}/read`)
  return notifications
}

export async function markAllBursarNotificationsRead(): Promise<BursarNotification[]> {
  const { notifications } = await api.post<{ notifications: BursarNotification[] }>('/bursar/notifications/read-all')
  return notifications
}

export async function getBursarAudienceOptions(): Promise<BursarAudienceOptions> {
  const { options } = await api.get<{ options: BursarAudienceOptions }>('/bursar/audience-options')
  return options
}

export async function listBursarFeeMessages(): Promise<BursarFeeMessage[]> {
  const { messages } = await api.get<{ messages: BursarFeeMessage[] }>('/bursar/announcements')
  return messages
}

export async function createBursarAnnouncement(
  input: CreateBursarAnnouncementRequest,
): Promise<CreateBursarAnnouncementResult> {
  const { result } = await api.post<{ result: CreateBursarAnnouncementResult }>(
    '/bursar/announcements',
    input,
  )
  return result
}

export async function issueSemesterFeeInvoices(): Promise<IssueSemesterFeesResult> {
  const { result } = await api.post<{ result: IssueSemesterFeesResult }>('/bursar/fee-structure/issue-invoices')
  return result
}
