import { randomInt } from 'node:crypto'
import { and, desc, eq, gte, isNull, lte, sql } from 'drizzle-orm'
import type {
  BursarAudienceOptions,
  BursarDashboard,
  BursarFeeItem,
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
  BursarFeeMessage,
  CreateBursarFeeItemRequest,
  IssueSemesterFeesResult,
  PaymentMethod,
  RecordBursarManualPaymentRequest,
  ResolveBursarReconciliationRequest,
  SetBursarFeeHoldRequest,
  UpdateBursarFeeItemRequest,
  UserRole,
} from '@stackedu/shared'
import { titleAndFirstName } from '@stackedu/shared'
import { getInstitutionDb, getPlatformDb } from '../db/connection'
import { institutions } from '../db/platform/schema'
import { departments, programmes, semesters, courses } from '../db/institution/schema/academic'
import { notifications } from '../db/institution/schema/communication'
import {
  announcements,
  courseOfferings,
  courseRegistrations,
} from '../db/institution/schema/teaching'
import {
  feeHolds,
  feeItems,
  feeStructures,
  invoices,
  payments,
  receipts,
  reconciliationRecords,
  studentFeeAccounts,
} from '../db/institution/schema/finance'
import { users } from '../db/institution/schema/people'
import { studentProfiles, students } from '../db/institution/schema/students'
import { writeAudit } from '../lib/audit'
import { feeDescriptionFromLineItems } from '../lib/fee-description'
import { badRequest, forbidden, notFound } from '../lib/errors'
import {
  feeItemsApplyToStudent,
  invoicePayloadFromFeeItems,
  type ApplicableFeeItemRow,
} from '../lib/fee-invoice'
import { audienceLabel, encodeAudience, resolveAudienceUserIds } from './announcement-audience'
import { currentSemester, relativeTime } from './academic'
import { notifyUserIds } from './role-notifications'

type Actor = { id: string; email: string; role: UserRole }

function staffIdFrom(userId: string): string {
  return `BUR-${userId.slice(0, 8).toUpperCase()}`
}

function firstName(fullName: string): string {
  return titleAndFirstName(fullName)
}

function accountStatus(balance: number, hasHold: boolean): BursarStudentAccountRow['status'] {
  if (hasHold) return 'On Hold'
  if (balance <= 0) return 'Paid'
  return 'Outstanding'
}

async function unreadCount(institutionId: string, userId: string): Promise<number> {
  const db = await getInstitutionDb(institutionId)
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
  return row?.count ?? 0
}

async function requireBursar(institutionId: string, userId: string) {
  const db = await getInstitutionDb(institutionId)
  const [user] = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  if (!user || user.role !== 'Bursar') throw forbidden('This account is not a bursar.')
  return { db, user }
}

function startOfDayIso(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString()
}

function endOfDayIso(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999).toISOString()
}

async function studentDisplayName(
  db: Awaited<ReturnType<typeof getInstitutionDb>>,
  studentId: string,
): Promise<{ name: string; studentNumber: string; email: string }> {
  const [row] = await db
    .select({
      studentNumber: students.studentNumber,
      fullName: users.fullName,
      firstName: studentProfiles.firstName,
      lastName: studentProfiles.lastName,
      email: users.email,
    })
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .leftJoin(studentProfiles, eq(studentProfiles.studentId, students.id))
    .where(eq(students.id, studentId))
    .limit(1)
  if (!row) throw notFound('That student')
  const name = row.firstName && row.lastName ? `${row.firstName} ${row.lastName}` : row.fullName
  return { name, studentNumber: row.studentNumber, email: row.email }
}

async function mapPaymentRow(
  db: Awaited<ReturnType<typeof getInstitutionDb>>,
  row: {
    id: string
    reference: string
    studentId: string
    amount: number
    method: PaymentMethod
    status: BursarPaymentRow['status']
    paidAt: string | null
    createdAt: string
    gatewayReference: string | null
    receiptNumber: string | null
    verificationCode?: string | null
    lineItems?: unknown
    programmeName?: string | null
    customDescription?: string
  },
): Promise<BursarPaymentRow> {
  const student = await studentDisplayName(db, row.studentId)
  const fallback = row.programmeName ? `${row.programmeName} fees` : 'Tuition and fees'
  return {
    id: row.id,
    reference: row.reference,
    studentId: row.studentId,
    studentNumber: student.studentNumber,
    studentName: student.name,
    amount: row.amount,
    method: row.method,
    status: row.status,
    description: row.customDescription ?? feeDescriptionFromLineItems(row.lineItems, fallback),
    paidAt: row.paidAt,
    createdAt: row.createdAt,
    receiptNumber: row.receiptNumber,
    verificationCode: row.verificationCode ?? null,
    gatewayReference: row.gatewayReference,
  }
}

export async function getBursarProfile(institutionId: string, userId: string): Promise<BursarProfile> {
  const { user } = await requireBursar(institutionId, userId)
  const platform = getPlatformDb()
  const [institution] = await platform
    .select({ name: institutions.name, shortName: institutions.shortName })
    .from(institutions)
    .where(eq(institutions.id, institutionId))
    .limit(1)

  return {
    userId: user.id,
    fullName: user.fullName,
    firstName: firstName(user.fullName),
    email: user.email,
    role: user.role,
    staffId: staffIdFrom(user.id),
    institutionName: institution?.name ?? 'Institution',
    institutionShortName: institution?.shortName ?? 'INS',
    unreadCount: await unreadCount(institutionId, userId),
  }
}

export async function getBursarDashboard(institutionId: string, userId: string): Promise<BursarDashboard> {
  const profile = await getBursarProfile(institutionId, userId)
  const { db } = await requireBursar(institutionId, userId)
  const semester = await currentSemester(institutionId)

  const now = new Date()
  const todayStart = startOfDayIso(now)
  const todayEnd = endOfDayIso(now)
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStart = startOfDayIso(yesterday)
  const yesterdayEnd = endOfDayIso(yesterday)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [todayRow] = await db
    .select({ total: sql<number>`coalesce(sum(${payments.amount}), 0)::int` })
    .from(payments)
    .where(
      and(
        eq(payments.status, 'Completed'),
        gte(payments.paidAt, todayStart),
        lte(payments.paidAt, todayEnd),
      ),
    )

  const [yesterdayRow] = await db
    .select({ total: sql<number>`coalesce(sum(${payments.amount}), 0)::int` })
    .from(payments)
    .where(
      and(
        eq(payments.status, 'Completed'),
        gte(payments.paidAt, yesterdayStart),
        lte(payments.paidAt, yesterdayEnd),
      ),
    )

  const [monthRow] = await db
    .select({ total: sql<number>`coalesce(sum(${payments.amount}), 0)::int` })
    .from(payments)
    .where(and(eq(payments.status, 'Completed'), gte(payments.paidAt, monthStart)))

  const [outstandingRow] = await db
    .select({
      total: sql<number>`coalesce(sum(${studentFeeAccounts.balance}), 0)::int`,
      count: sql<number>`count(*) filter (where ${studentFeeAccounts.balance} > 0)::int`,
    })
    .from(studentFeeAccounts)

  const [holdRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(students)
    .where(eq(students.feeHold, true))

  const paymentRows = await db
    .select({
      id: payments.id,
      reference: payments.reference,
      studentId: payments.studentId,
      amount: payments.amount,
      method: payments.method,
      status: payments.status,
      paidAt: payments.paidAt,
      createdAt: payments.createdAt,
      gatewayReference: payments.gatewayReference,
      receiptNumber: receipts.receiptNumber,
      verificationCode: receipts.verificationCode,
      lineItems: invoices.lineItems,
      programmeName: programmes.name,
    })
    .from(payments)
    .leftJoin(receipts, eq(receipts.paymentId, payments.id))
    .leftJoin(invoices, eq(invoices.id, payments.invoiceId))
    .innerJoin(students, eq(students.id, payments.studentId))
    .innerJoin(programmes, eq(programmes.id, students.programmeId))
    .orderBy(desc(payments.createdAt))
    .limit(5)

  const methodRows = await db
    .select({
      method: payments.method,
      total: sql<number>`coalesce(sum(${payments.amount}), 0)::int`,
    })
    .from(payments)
    .where(eq(payments.status, 'Completed'))
    .groupBy(payments.method)

  const recentPayments = await Promise.all(paymentRows.map((row) => mapPaymentRow(db, row)))

  return {
    profile,
    stats: {
      collectedToday: todayRow?.total ?? 0,
      collectedYesterday: yesterdayRow?.total ?? 0,
      outstandingBalances: outstandingRow?.total ?? 0,
      studentsWithBalance: outstandingRow?.count ?? 0,
      collectedThisMonth: monthRow?.total ?? 0,
      semesterLabel: semester?.name ?? 'Current semester',
      activeFeeHolds: holdRow?.count ?? 0,
    },
    recentPayments,
    paymentsByMethod: methodRows.map((row) => ({ method: row.method, total: row.total })),
  }
}

export async function listBursarPayments(
  institutionId: string,
  userId: string,
  filters?: { method?: PaymentMethod; status?: BursarPaymentRow['status']; from?: string; to?: string },
): Promise<BursarPaymentRow[]> {
  const { db } = await requireBursar(institutionId, userId)
  const conditions = []
  if (filters?.method) conditions.push(eq(payments.method, filters.method))
  if (filters?.status) conditions.push(eq(payments.status, filters.status))
  if (filters?.from) conditions.push(gte(payments.createdAt, filters.from))
  if (filters?.to) conditions.push(lte(payments.createdAt, filters.to))

  const rows = await db
    .select({
      id: payments.id,
      reference: payments.reference,
      studentId: payments.studentId,
      amount: payments.amount,
      method: payments.method,
      status: payments.status,
      paidAt: payments.paidAt,
      createdAt: payments.createdAt,
      gatewayReference: payments.gatewayReference,
      receiptNumber: receipts.receiptNumber,
      verificationCode: receipts.verificationCode,
      lineItems: invoices.lineItems,
      programmeName: programmes.name,
    })
    .from(payments)
    .leftJoin(receipts, eq(receipts.paymentId, payments.id))
    .leftJoin(invoices, eq(invoices.id, payments.invoiceId))
    .innerJoin(students, eq(students.id, payments.studentId))
    .innerJoin(programmes, eq(programmes.id, students.programmeId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(payments.createdAt))

  return Promise.all(rows.map((row) => mapPaymentRow(db, row)))
}

async function ensureFeeStructure(
  institutionId: string,
  db: Awaited<ReturnType<typeof getInstitutionDb>>,
  actor: Actor,
  input: { programmeId?: string; yearOfStudy?: number | null },
): Promise<string> {
  const semester = await currentSemester(institutionId)
  const [existing] = await db
    .select({ id: feeStructures.id })
    .from(feeStructures)
    .where(
      and(
        input.programmeId ? eq(feeStructures.programmeId, input.programmeId) : isNull(feeStructures.programmeId),
        input.yearOfStudy != null
          ? eq(feeStructures.yearOfStudy, input.yearOfStudy)
          : isNull(feeStructures.yearOfStudy),
        semester?.id ? eq(feeStructures.semesterId, semester.id) : isNull(feeStructures.semesterId),
      ),
    )
    .limit(1)
  if (existing) return existing.id

  const [programme] = input.programmeId
    ? await db.select({ name: programmes.name }).from(programmes).where(eq(programmes.id, input.programmeId)).limit(1)
    : [null]

  const [created] = await db
    .insert(feeStructures)
    .values({
      name: programme?.name ? `${programme.name} fees` : 'General fees',
      programmeId: input.programmeId ?? null,
      yearOfStudy: input.yearOfStudy ?? null,
      semesterId: semester?.id ?? null,
      createdBy: actor.id,
      isActive: true,
    })
    .returning({ id: feeStructures.id })
  return created!.id
}

export async function listBursarProgrammes(
  institutionId: string,
  userId: string,
): Promise<Array<{ id: string; name: string }>> {
  const { db } = await requireBursar(institutionId, userId)
  return db.select({ id: programmes.id, name: programmes.name }).from(programmes).orderBy(programmes.name)
}

export async function listBursarFeeItems(institutionId: string, userId: string): Promise<BursarFeeItem[]> {
  const { db } = await requireBursar(institutionId, userId)
  const rows = await db
    .select({
      id: feeItems.id,
      feeStructureId: feeItems.feeStructureId,
      name: feeItems.name,
      category: feeItems.category,
      amount: feeItems.amount,
      isMandatory: feeItems.isMandatory,
      programmeId: feeStructures.programmeId,
      programmeName: programmes.name,
      yearOfStudy: feeStructures.yearOfStudy,
      isActive: feeStructures.isActive,
      createdAt: feeItems.createdAt,
      dueDate: feeItems.dueDate,
    })
    .from(feeItems)
    .innerJoin(feeStructures, eq(feeItems.feeStructureId, feeStructures.id))
    .leftJoin(programmes, eq(feeStructures.programmeId, programmes.id))
    .orderBy(desc(feeItems.createdAt))

  return rows.map((row) => ({
    id: row.id,
    feeStructureId: row.feeStructureId,
    name: row.name,
    category: row.category,
    amount: row.amount,
    programmeId: row.programmeId,
    programmeName: row.programmeName ?? 'All programmes',
    yearOfStudy: row.yearOfStudy,
    isMandatory: row.isMandatory,
    isActive: row.isActive,
    createdAt: row.createdAt,
    dueDate: row.dueDate,
  }))
}

export async function createBursarFeeItem(
  institutionId: string,
  userId: string,
  actor: Actor,
  input: CreateBursarFeeItemRequest,
): Promise<BursarFeeItem> {
  const { db } = await requireBursar(institutionId, userId)
  const structureId = await ensureFeeStructure(institutionId, db, actor, {
    programmeId: input.programmeId,
    yearOfStudy: input.yearOfStudy ?? null,
  })

  const [created] = await db
    .insert(feeItems)
    .values({
      feeStructureId: structureId,
      name: input.name,
      category: input.category,
      amount: input.amount,
      isMandatory: input.isMandatory ?? true,
      dueDate: input.dueDate,
    })
    .returning({ id: feeItems.id })

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'fee_item.create',
    targetType: 'fee_item',
    targetId: created!.id,
    metadata: { name: input.name, amount: input.amount },
  })

  const items = await listBursarFeeItems(institutionId, userId)
  return items.find((item) => item.id === created!.id)!
}

export async function updateBursarFeeItem(
  institutionId: string,
  userId: string,
  actor: Actor,
  itemId: string,
  input: UpdateBursarFeeItemRequest,
): Promise<BursarFeeItem> {
  const { db } = await requireBursar(institutionId, userId)
  const [existing] = await db.select().from(feeItems).where(eq(feeItems.id, itemId)).limit(1)
  if (!existing) throw notFound('That fee item')

  await db
    .update(feeItems)
    .set({
      name: input.name ?? existing.name,
      category: input.category ?? existing.category,
      amount: input.amount ?? existing.amount,
      isMandatory: input.isMandatory ?? existing.isMandatory,
      dueDate: input.dueDate ?? existing.dueDate,
    })
    .where(eq(feeItems.id, itemId))

  if (input.isActive != null) {
    await db.update(feeStructures).set({ isActive: input.isActive }).where(eq(feeStructures.id, existing.feeStructureId))
  }

  const items = await listBursarFeeItems(institutionId, userId)
  return items.find((item) => item.id === itemId)!
}

export async function deleteBursarFeeItem(
  institutionId: string,
  userId: string,
  actor: Actor,
  itemId: string,
): Promise<void> {
  const { db } = await requireBursar(institutionId, userId)
  const [existing] = await db.select({ id: feeItems.id }).from(feeItems).where(eq(feeItems.id, itemId)).limit(1)
  if (!existing) throw notFound('That fee item')
  await db.delete(feeItems).where(eq(feeItems.id, itemId))
  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'fee_item.delete',
    targetType: 'fee_item',
    targetId: itemId,
  })
}

export async function listBursarStudentAccounts(
  institutionId: string,
  userId: string,
): Promise<BursarStudentAccountRow[]> {
  const { db } = await requireBursar(institutionId, userId)
  const rows = await db
    .select({
      studentId: students.id,
      studentNumber: students.studentNumber,
      fullName: users.fullName,
      firstName: studentProfiles.firstName,
      lastName: studentProfiles.lastName,
      programme: programmes.name,
      yearOfStudy: students.yearOfStudy,
      totalCharged: studentFeeAccounts.totalCharged,
      totalPaid: studentFeeAccounts.totalPaid,
      balance: studentFeeAccounts.balance,
      hasHold: students.feeHold,
      lastPaymentAt: studentFeeAccounts.lastPaymentAt,
    })
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .leftJoin(studentProfiles, eq(studentProfiles.studentId, students.id))
    .innerJoin(programmes, eq(students.programmeId, programmes.id))
    .leftJoin(studentFeeAccounts, eq(studentFeeAccounts.studentId, students.id))
    .orderBy(desc(studentFeeAccounts.balance))

  return rows.map((row) => {
    const outstanding = row.balance ?? 0
    const hasHold = row.hasHold ?? false
    return {
      studentId: row.studentId,
      studentNumber: row.studentNumber,
      name: row.firstName && row.lastName ? `${row.firstName} ${row.lastName}` : row.fullName,
      programme: row.programme,
      yearOfStudy: row.yearOfStudy,
      totalCharged: row.totalCharged ?? 0,
      totalPaid: row.totalPaid ?? 0,
      outstanding,
      hasHold,
      status: accountStatus(outstanding, hasHold),
      lastPaymentAt: row.lastPaymentAt,
    }
  })
}

export async function getBursarStudentAccount(
  institutionId: string,
  userId: string,
  studentId: string,
): Promise<BursarStudentAccountDetail> {
  const accounts = await listBursarStudentAccounts(institutionId, userId)
  const base = accounts.find((row) => row.studentId === studentId)
  if (!base) throw notFound('That student')

  const { db } = await requireBursar(institutionId, userId)
  const student = await studentDisplayName(db, studentId)

  const invoiceRows = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      amountDue: invoices.amountDue,
      amountPaid: invoices.amountPaid,
      status: invoices.status,
      dueDate: invoices.dueDate,
    })
    .from(invoices)
    .where(eq(invoices.studentId, studentId))
    .orderBy(desc(invoices.createdAt))

  const paymentRows = await db
    .select({
      id: payments.id,
      reference: payments.reference,
      amount: payments.amount,
      method: payments.method,
      status: payments.status,
      paidAt: payments.paidAt,
      receiptNumber: receipts.receiptNumber,
      verificationCode: receipts.verificationCode,
      lineItems: invoices.lineItems,
      programmeName: programmes.name,
    })
    .from(payments)
    .leftJoin(receipts, eq(receipts.paymentId, payments.id))
    .leftJoin(invoices, eq(invoices.id, payments.invoiceId))
    .innerJoin(students, eq(students.id, payments.studentId))
    .innerJoin(programmes, eq(programmes.id, students.programmeId))
    .where(eq(payments.studentId, studentId))
    .orderBy(desc(payments.createdAt))

  const [activeHold] = await db
    .select({ reason: feeHolds.reason })
    .from(feeHolds)
    .where(and(eq(feeHolds.studentId, studentId), isNull(feeHolds.releasedAt)))
    .orderBy(desc(feeHolds.placedAt))
    .limit(1)

  return {
    ...base,
    email: student.email,
    holdReason: activeHold?.reason ?? null,
    invoices: invoiceRows,
    payments: paymentRows.map((row) => ({
      id: row.id,
      reference: row.reference,
      amount: row.amount,
      method: row.method,
      status: row.status,
      paidAt: row.paidAt,
      receiptNumber: row.receiptNumber,
      verificationCode: row.verificationCode,
      description: feeDescriptionFromLineItems(
        row.lineItems,
        row.programmeName ? `${row.programmeName} fees` : 'Tuition and fees',
      ),
    })),
  }
}

async function applyCompletedPayment(
  db: Awaited<ReturnType<typeof getInstitutionDb>>,
  input: {
    studentId: string
    invoiceId: string
    amount: number
    paymentId: string
    paidAt: string
  },
) {
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, input.invoiceId)).limit(1)
  if (!invoice) return

  await db
    .update(invoices)
    .set({
      amountPaid: invoice.amountPaid + input.amount,
      status: invoice.amountPaid + input.amount >= invoice.amountDue ? 'Paid' : 'PartiallyPaid',
    })
    .where(eq(invoices.id, input.invoiceId))

  const [account] = await db
    .select()
    .from(studentFeeAccounts)
    .where(eq(studentFeeAccounts.studentId, input.studentId))
    .limit(1)

  if (account) {
    const totalPaid = account.totalPaid + input.amount
    await db
      .update(studentFeeAccounts)
      .set({
        totalPaid,
        balance: account.totalCharged - totalPaid,
        lastPaymentAt: input.paidAt,
      })
      .where(eq(studentFeeAccounts.id, account.id))
  }
}

export async function recordBursarManualPayment(
  institutionId: string,
  userId: string,
  actor: Actor,
  studentId: string,
  input: RecordBursarManualPaymentRequest,
): Promise<BursarStudentAccountDetail> {
  const { db } = await requireBursar(institutionId, userId)
  const student = await studentDisplayName(db, studentId)

  const invoiceRows = await db
    .select()
    .from(invoices)
    .where(eq(invoices.studentId, studentId))
    .orderBy(desc(invoices.createdAt))

  const invoice = input.invoiceId
    ? invoiceRows.find((row) => row.id === input.invoiceId)
    : invoiceRows.find((row) => row.amountDue - row.amountPaid > 0)

  if (!invoice) throw badRequest('There is no invoice to pay.')
  const outstanding = invoice.amountDue - invoice.amountPaid
  if (input.amount > outstanding) throw badRequest('That amount is more than the outstanding balance.')

  const now = new Date().toISOString()
  const reference = `PAY-${student.studentNumber}-${randomInt(1000, 9999)}`

  const [payment] = await db
    .insert(payments)
    .values({
      reference,
      studentId,
      invoiceId: invoice.id,
      amount: input.amount,
      method: input.method,
      status: 'Completed',
      paidAt: now,
      gatewayReference: `manual-${reference}`,
    })
    .returning({ id: payments.id })

  await db.insert(receipts).values({
    receiptNumber: `RCT-${randomInt(100000, 999999)}`,
    paymentId: payment!.id,
    studentId,
    amount: input.amount,
    issuedAt: now,
    verificationCode: `VR-${randomInt(100000, 999999)}`,
  })

  await applyCompletedPayment(db, {
    studentId,
    invoiceId: invoice.id,
    amount: input.amount,
    paymentId: payment!.id,
    paidAt: now,
  })

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'payment.record_manual',
    targetType: 'student',
    targetId: studentId,
    metadata: { amount: input.amount, method: input.method, notes: input.notes, description: input.description },
  })

  return getBursarStudentAccount(institutionId, userId, studentId)
}

export async function setBursarFeeHold(
  institutionId: string,
  userId: string,
  actor: Actor,
  studentId: string,
  input: SetBursarFeeHoldRequest,
): Promise<BursarStudentAccountDetail> {
  const { db } = await requireBursar(institutionId, userId)
  await studentDisplayName(db, studentId)

  const [account] = await db
    .select({ balance: studentFeeAccounts.balance })
    .from(studentFeeAccounts)
    .where(eq(studentFeeAccounts.studentId, studentId))
    .limit(1)

  const now = new Date().toISOString()
  await db.insert(feeHolds).values({
    studentId,
    reason: input.reason,
    amountOutstanding: account?.balance ?? 0,
    blocks: input.blocks ?? ['Registration', 'Results'],
    placedBy: actor.id,
    placedAt: now,
  })

  await db.update(students).set({ feeHold: true }).where(eq(students.id, studentId))

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'fee_hold.place',
    targetType: 'student',
    targetId: studentId,
    metadata: { reason: input.reason },
  })

  return getBursarStudentAccount(institutionId, userId, studentId)
}

export async function releaseBursarFeeHold(
  institutionId: string,
  userId: string,
  actor: Actor,
  studentId: string,
  reason: string,
): Promise<BursarStudentAccountDetail> {
  const { db } = await requireBursar(institutionId, userId)
  await studentDisplayName(db, studentId)

  const now = new Date().toISOString()
  await db
    .update(feeHolds)
    .set({ releasedBy: actor.id, releasedAt: now, releaseReason: reason })
    .where(and(eq(feeHolds.studentId, studentId), isNull(feeHolds.releasedAt)))

  await db.update(students).set({ feeHold: false }).where(eq(students.id, studentId))

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'fee_hold.release',
    targetType: 'student',
    targetId: studentId,
    metadata: { reason },
  })

  return getBursarStudentAccount(institutionId, userId, studentId)
}

export async function listBursarReceipts(
  institutionId: string,
  userId: string,
  filters?: { from?: string; to?: string },
): Promise<BursarReceiptRow[]> {
  const { db } = await requireBursar(institutionId, userId)
  const platform = getPlatformDb()
  const [institution] = await platform
    .select({ name: institutions.name })
    .from(institutions)
    .where(eq(institutions.id, institutionId))
    .limit(1)
  const institutionName = institution?.name ?? 'Institution'

  const conditions = []
  if (filters?.from) conditions.push(gte(receipts.issuedAt, filters.from))
  if (filters?.to) conditions.push(lte(receipts.issuedAt, filters.to))

  const rows = await db
    .select({
      id: receipts.id,
      receiptNumber: receipts.receiptNumber,
      paymentId: receipts.paymentId,
      studentId: receipts.studentId,
      issueDate: receipts.issuedAt,
      amount: receipts.amount,
      method: payments.method,
      reference: payments.reference,
      paidAt: payments.paidAt,
      voidedAt: payments.voidedAt,
      voidReason: payments.voidReason,
      paymentStatus: payments.status,
      verificationCode: receipts.verificationCode,
      lineItems: invoices.lineItems,
      programmeName: programmes.name,
    })
    .from(receipts)
    .innerJoin(payments, eq(receipts.paymentId, payments.id))
    .leftJoin(invoices, eq(invoices.id, payments.invoiceId))
    .innerJoin(students, eq(students.id, receipts.studentId))
    .innerJoin(programmes, eq(programmes.id, students.programmeId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(receipts.issuedAt))

  return Promise.all(
    rows.map(async (row) => {
      const student = await studentDisplayName(db, row.studentId)
      const fallback = row.programmeName ? `${row.programmeName} fees` : 'Tuition and fees'
      return {
        id: row.id,
        receiptNumber: row.receiptNumber,
        paymentId: row.paymentId,
        studentId: row.studentId,
        studentNumber: student.studentNumber,
        studentName: student.name,
        issueDate: row.issueDate,
        description: feeDescriptionFromLineItems(row.lineItems, fallback),
        amount: row.amount,
        method: row.method,
        reference: row.reference,
        paidAt: row.paidAt,
        verificationCode: row.verificationCode,
        institutionName,
        status: row.paymentStatus === 'Voided' ? 'Voided' : 'Valid',
        voidedAt: row.voidedAt,
        voidReason: row.voidReason,
      } satisfies BursarReceiptRow
    }),
  )
}

export async function voidBursarReceipt(
  institutionId: string,
  userId: string,
  actor: Actor,
  receiptId: string,
  reason: string,
): Promise<BursarReceiptRow> {
  const { db } = await requireBursar(institutionId, userId)
  const [row] = await db
    .select({
      receiptId: receipts.id,
      paymentId: payments.id,
      studentId: payments.studentId,
      invoiceId: payments.invoiceId,
      amount: payments.amount,
      status: payments.status,
    })
    .from(receipts)
    .innerJoin(payments, eq(receipts.paymentId, payments.id))
    .where(eq(receipts.id, receiptId))
    .limit(1)

  if (!row) throw notFound('That receipt')
  if (row.status === 'Voided') throw badRequest('That receipt is already voided.')
  if (row.status !== 'Completed') throw badRequest('Only completed payments can be voided.')

  const now = new Date().toISOString()
  await db
    .update(payments)
    .set({ status: 'Voided', voidedAt: now, voidedBy: actor.id, voidReason: reason })
    .where(eq(payments.id, row.paymentId))

  if (row.invoiceId) {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, row.invoiceId)).limit(1)
    if (invoice) {
      const amountPaid = Math.max(0, invoice.amountPaid - row.amount)
      await db
        .update(invoices)
        .set({
          amountPaid,
          status: amountPaid <= 0 ? 'Issued' : amountPaid >= invoice.amountDue ? 'Paid' : 'PartiallyPaid',
        })
        .where(eq(invoices.id, row.invoiceId))
    }
  }

  const [account] = await db
    .select()
    .from(studentFeeAccounts)
    .where(eq(studentFeeAccounts.studentId, row.studentId))
    .limit(1)

  if (account) {
    const totalPaid = Math.max(0, account.totalPaid - row.amount)
    await db
      .update(studentFeeAccounts)
      .set({ totalPaid, balance: account.totalCharged - totalPaid })
      .where(eq(studentFeeAccounts.id, account.id))
  }

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'receipt.void',
    targetType: 'receipt',
    targetId: receiptId,
    metadata: { reason },
  })

  const receiptsList = await listBursarReceipts(institutionId, userId)
  return receiptsList.find((item) => item.id === receiptId)!
}

export async function listBursarReconciliation(
  institutionId: string,
  userId: string,
): Promise<{ pending: BursarReconciliationRow[]; resolved: BursarReconciliationRow[] }> {
  const { db } = await requireBursar(institutionId, userId)
  const rows = await db
    .select()
    .from(reconciliationRecords)
    .orderBy(desc(reconciliationRecords.transactionDate))

  const mapped = await Promise.all(
    rows.map(async (row) => {
      let studentNumber: string | null = null
      let studentName: string | null = null
      if (row.matchedStudentId) {
        const student = await studentDisplayName(db, row.matchedStudentId)
        studentNumber = student.studentNumber
        studentName = student.name
      }
      return {
        id: row.id,
        externalReference: row.externalReference,
        studentId: row.matchedStudentId,
        studentNumber,
        studentName,
        amount: row.amount,
        source: row.source,
        status: row.status,
        transactionDate: row.transactionDate,
        payerName: row.payerName,
        payerPhone: row.payerPhone,
        narration: row.narration,
        notes: row.notes,
      } satisfies BursarReconciliationRow
    }),
  )

  return {
    pending: mapped.filter((row) => row.status === 'Pending'),
    resolved: mapped.filter((row) => row.status !== 'Pending'),
  }
}

export async function resolveBursarReconciliation(
  institutionId: string,
  userId: string,
  actor: Actor,
  recordId: string,
  input: ResolveBursarReconciliationRequest,
): Promise<BursarReconciliationRow> {
  const { db } = await requireBursar(institutionId, userId)
  const [row] = await db.select().from(reconciliationRecords).where(eq(reconciliationRecords.id, recordId)).limit(1)
  if (!row) throw notFound('That reconciliation record')
  if (row.status !== 'Pending') throw badRequest('That record is already resolved.')

  const now = new Date().toISOString()
  await db
    .update(reconciliationRecords)
    .set({
      status: input.resolution,
      resolvedBy: actor.id,
      resolvedAt: now,
      notes: input.notes ?? row.notes,
      matchedStudentId: input.studentId ?? row.matchedStudentId,
    })
    .where(eq(reconciliationRecords.id, recordId))

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'reconciliation.resolve',
    targetType: 'reconciliation_record',
    targetId: recordId,
    metadata: { resolution: input.resolution },
  })

  const { pending, resolved } = await listBursarReconciliation(institutionId, userId)
  return [...pending, ...resolved].find((item) => item.id === recordId)!
}

export async function getBursarReports(
  institutionId: string,
  userId: string,
  type: BursarReports['type'],
): Promise<BursarReports> {
  const { db } = await requireBursar(institutionId, userId)
  const now = new Date()
  let from = startOfDayIso(now)
  let label = 'Today'

  if (type === 'monthly') {
    from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    label = now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  } else if (type === 'semester') {
    const semester = await currentSemester(institutionId)
    label = semester?.name ?? 'Current semester'
  } else if (type === 'annual') {
    from = new Date(now.getFullYear(), 0, 1).toISOString()
    label = String(now.getFullYear())
  }

  const [collectedRow] = await db
    .select({ total: sql<number>`coalesce(sum(${payments.amount}), 0)::int`, count: sql<number>`count(*)::int` })
    .from(payments)
    .where(and(eq(payments.status, 'Completed'), gte(payments.paidAt, from)))

  const [outstandingRow] = await db
    .select({ total: sql<number>`coalesce(sum(${studentFeeAccounts.balance}), 0)::int` })
    .from(studentFeeAccounts)

  const [attemptRow] = await db
    .select({
      total: sql<number>`count(*)::int`,
      completed: sql<number>`count(*) filter (where ${payments.status} = 'Completed')::int`,
    })
    .from(payments)
    .where(gte(payments.createdAt, from))

  const trendRows = await db
    .select({
      day: sql<string>`to_char(${payments.paidAt}, 'DD Mon')`,
      amount: sql<number>`coalesce(sum(${payments.amount}), 0)::int`,
    })
    .from(payments)
    .where(and(eq(payments.status, 'Completed'), gte(payments.paidAt, from)))
    .groupBy(sql`to_char(${payments.paidAt}, 'DD Mon')`)
    .orderBy(sql`min(${payments.paidAt})`)

  const programmeRows = await db
    .select({
      programme: programmes.name,
      collected: sql<number>`coalesce(sum(${payments.amount}), 0)::int`,
      outstanding: sql<number>`coalesce(sum(${studentFeeAccounts.balance}), 0)::int`,
      students: sql<number>`count(distinct ${students.id})::int`,
    })
    .from(students)
    .innerJoin(programmes, eq(students.programmeId, programmes.id))
    .leftJoin(studentFeeAccounts, eq(studentFeeAccounts.studentId, students.id))
    .leftJoin(
      payments,
      and(eq(payments.studentId, students.id), eq(payments.status, 'Completed'), gte(payments.paidAt, from)),
    )
    .groupBy(programmes.name)

  const totalAttempts = attemptRow?.total ?? 0
  const completed = attemptRow?.completed ?? 0

  return {
    type,
    label,
    totalCollected: collectedRow?.total ?? 0,
    totalOutstanding: outstandingRow?.total ?? 0,
    paymentCount: collectedRow?.count ?? 0,
    successRate: totalAttempts > 0 ? Math.round((completed / totalAttempts) * 100) : 0,
    trend: trendRows.map((row) => ({ label: row.day, amount: row.amount })),
    programmeBreakdown: programmeRows.map((row) => ({
      programme: row.programme,
      collected: row.collected,
      outstanding: row.outstanding,
      students: row.students,
    })),
  }
}

export async function listBursarNotifications(
  institutionId: string,
  userId: string,
): Promise<BursarNotification[]> {
  await requireBursar(institutionId, userId)
  const db = await getInstitutionDb(institutionId)
  const rows = await db
    .select({
      id: notifications.id,
      category: notifications.category,
      title: notifications.title,
      body: notifications.body,
      createdAt: notifications.createdAt,
      readAt: notifications.readAt,
    })
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))

  return rows.map((row) => ({
    id: row.id,
    type: row.category,
    title: row.title,
    body: row.body,
    time: relativeTime(row.createdAt),
    read: Boolean(row.readAt),
    urgent: ['Fees', 'Reconciliation'].includes(row.category),
  }))
}

export async function markBursarNotificationRead(
  institutionId: string,
  userId: string,
  id: string,
): Promise<BursarNotification[]> {
  await requireBursar(institutionId, userId)
  const db = await getInstitutionDb(institutionId)
  const [updated] = await db
    .update(notifications)
    .set({ readAt: new Date().toISOString() })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
    .returning({ id: notifications.id })
  if (!updated) throw notFound('That notification')
  return listBursarNotifications(institutionId, userId)
}

export async function markAllBursarNotificationsRead(
  institutionId: string,
  userId: string,
): Promise<BursarNotification[]> {
  await requireBursar(institutionId, userId)
  const db = await getInstitutionDb(institutionId)
  await db
    .update(notifications)
    .set({ readAt: new Date().toISOString() })
    .where(eq(notifications.userId, userId))
  return listBursarNotifications(institutionId, userId)
}

export async function listBursarAudienceOptions(
  institutionId: string,
  userId: string,
): Promise<BursarAudienceOptions> {
  const { db } = await requireBursar(institutionId, userId)

  const departmentRows = await db
    .select({
      id: departments.id,
      name: departments.name,
      studentCount: sql<number>`count(${students.id})::int`,
    })
    .from(departments)
    .leftJoin(programmes, eq(programmes.departmentId, departments.id))
    .leftJoin(students, eq(students.programmeId, programmes.id))
    .groupBy(departments.id, departments.name)
    .orderBy(departments.name)

  const yearRows = await db
    .select({
      year: students.yearOfStudy,
      studentCount: sql<number>`count(*)::int`,
    })
    .from(students)
    .groupBy(students.yearOfStudy)
    .orderBy(students.yearOfStudy)

  const studentRows = await db
    .select({
      id: students.id,
      studentNumber: students.studentNumber,
      firstName: studentProfiles.firstName,
      lastName: studentProfiles.lastName,
      fullName: users.fullName,
    })
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .leftJoin(studentProfiles, eq(studentProfiles.studentId, students.id))
    .where(eq(students.enrolmentStatus, 'Active'))
    .orderBy(students.studentNumber)
    .limit(200)

  const courseRows = await db
    .select({
      offeringId: courseOfferings.id,
      courseCode: courses.code,
      courseName: courses.name,
      enrolledCount: sql<number>`count(${courseRegistrations.id})::int`,
    })
    .from(courseOfferings)
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .leftJoin(
      courseRegistrations,
      and(eq(courseRegistrations.courseOfferingId, courseOfferings.id), eq(courseRegistrations.status, 'Approved')),
    )
    .groupBy(courseOfferings.id, courses.code, courses.name)
    .orderBy(courses.code)

  const [studentCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(students)
    .where(eq(students.enrolmentStatus, 'Active'))

  return {
    enrolledStudentCount: studentCount?.count ?? 0,
    departments: departmentRows,
    years: yearRows,
    students: studentRows.map((row) => ({
      id: row.id,
      studentNumber: row.studentNumber,
      name: row.firstName && row.lastName ? `${row.firstName} ${row.lastName}` : row.fullName,
    })),
    courses: courseRows.map((row) => ({
      offeringId: row.offeringId,
      label: `${row.courseCode} · ${row.courseName}`,
      enrolledCount: row.enrolledCount,
    })),
  }
}

export async function createBursarAnnouncement(
  institutionId: string,
  userId: string,
  actor: Actor,
  input: CreateBursarAnnouncementRequest,
): Promise<CreateBursarAnnouncementResult> {
  const { db } = await requireBursar(institutionId, userId)
  const recipientIds = await resolveAudienceUserIds(institutionId, input.audience)
  if (!recipientIds.length) throw badRequest('Choose at least one recipient.')

  const audienceTokens = encodeAudience(input.audience)
  const audienceRoles = ['bursar:fee', `recipients:${recipientIds.length}`, ...audienceTokens]
  const sentAt = new Date().toISOString()

  const [row] = await db
    .insert(announcements)
    .values({
      title: input.title,
      body: input.body,
      audienceRoles,
      publishedAt: sentAt,
      createdBy: userId,
    })
    .returning({
      id: announcements.id,
      createdAt: announcements.createdAt,
      publishedAt: announcements.publishedAt,
    })

  await notifyUserIds(db, recipientIds, {
    title: input.title,
    body: input.body,
    category: 'Fees',
    actionUrl: '/student/fees',
  })

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'bursar.announcement.send',
    targetType: 'announcement',
    targetId: row!.id,
    metadata: { title: input.title, recipientCount: recipientIds.length },
  })

  return {
    id: row!.id,
    recipientCount: recipientIds.length,
    audienceLabel: await audienceLabel(institutionId, audienceTokens),
    sentAt: row!.publishedAt ?? row!.createdAt ?? sentAt,
  }
}

const BURSAR_FEE_MESSAGE_MARKER = 'bursar:fee'

function feeMessageTokens(tokens: string[]): string[] {
  return tokens.filter((token) => token !== BURSAR_FEE_MESSAGE_MARKER && !token.startsWith('recipients:'))
}

function storedRecipientCount(tokens: string[]): number {
  const token = tokens.find((entry) => entry.startsWith('recipients:'))
  if (!token) return 0
  const count = Number(token.slice('recipients:'.length))
  return Number.isInteger(count) && count >= 0 ? count : 0
}

export async function listBursarFeeMessages(
  institutionId: string,
  userId: string,
): Promise<BursarFeeMessage[]> {
  const { db } = await requireBursar(institutionId, userId)
  const rows = await db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      audienceRoles: announcements.audienceRoles,
      publishedAt: announcements.publishedAt,
      createdAt: announcements.createdAt,
    })
    .from(announcements)
    .where(sql`${BURSAR_FEE_MESSAGE_MARKER} = ANY(${announcements.audienceRoles})`)
    .orderBy(desc(announcements.createdAt))
    .limit(100)

  return Promise.all(
    rows.map(async (row) => {
      const tokens = feeMessageTokens(row.audienceRoles)
      return {
        id: row.id,
        title: row.title,
        body: row.body,
        audienceLabel: await audienceLabel(institutionId, tokens),
        recipientCount: storedRecipientCount(row.audienceRoles),
        sentAt: row.publishedAt ?? row.createdAt,
      }
    }),
  )
}

export async function issueSemesterFeeInvoices(
  institutionId: string,
  userId: string,
  actor: Actor,
): Promise<IssueSemesterFeesResult> {
  const { db } = await requireBursar(institutionId, userId)
  const semester = await currentSemester(institutionId)
  if (!semester) throw badRequest('Set a current semester before issuing fees.')

  const feeRows = await db
    .select({
      itemId: feeItems.id,
      name: feeItems.name,
      amount: feeItems.amount,
      dueDate: feeItems.dueDate,
      programmeId: feeStructures.programmeId,
      yearOfStudy: feeStructures.yearOfStudy,
      semesterId: feeStructures.semesterId,
      isActive: feeStructures.isActive,
    })
    .from(feeItems)
    .innerJoin(feeStructures, eq(feeItems.feeStructureId, feeStructures.id))
    .where(eq(feeStructures.isActive, true))

  const applicableItems: ApplicableFeeItemRow[] = feeRows
    .filter((row) => !row.semesterId || row.semesterId === semester.id)
    .map((row) => ({
      itemId: row.itemId,
      name: row.name,
      amount: row.amount,
      dueDate: row.dueDate,
      programmeId: row.programmeId,
      yearOfStudy: row.yearOfStudy,
    }))

  if (!applicableItems.length) throw badRequest('Add active fee items before issuing semester fees.')

  try {
    invoicePayloadFromFeeItems(applicableItems)
  } catch (error) {
    throw badRequest(error instanceof Error ? error.message : 'Set due dates on all active fee items.')
  }

  const studentRows = await db
    .select({
      id: students.id,
      studentNumber: students.studentNumber,
      programmeId: students.programmeId,
      yearOfStudy: students.yearOfStudy,
    })
    .from(students)
    .where(eq(students.enrolmentStatus, 'Active'))

  let issuedCount = 0
  let skippedCount = 0
  const now = new Date().toISOString()

  for (const student of studentRows) {
    const [existing] = await db
      .select({ id: invoices.id })
      .from(invoices)
      .where(and(eq(invoices.studentId, student.id), eq(invoices.semesterId, semester.id)))
      .limit(1)
    if (existing) {
      skippedCount += 1
      continue
    }

    const items = feeItemsApplyToStudent(applicableItems, student)
    if (!items.length) {
      skippedCount += 1
      continue
    }

    const { lineItems, amountDue, dueDate } = invoicePayloadFromFeeItems(items)

    await db.insert(invoices).values({
      invoiceNumber: `INV-${student.studentNumber}-${semester.name.replace(/\s+/g, '-').toUpperCase()}`,
      studentId: student.id,
      semesterId: semester.id,
      amountDue,
      amountPaid: 0,
      status: 'Issued',
      issuedAt: now,
      dueDate,
      lineItems,
    })

    const [account] = await db
      .select()
      .from(studentFeeAccounts)
      .where(eq(studentFeeAccounts.studentId, student.id))
      .limit(1)

    if (account) {
      await db
        .update(studentFeeAccounts)
        .set({
          totalCharged: account.totalCharged + amountDue,
          balance: account.balance + amountDue,
        })
        .where(eq(studentFeeAccounts.id, account.id))
    } else {
      await db.insert(studentFeeAccounts).values({
        studentId: student.id,
        totalCharged: amountDue,
        totalPaid: 0,
        balance: amountDue,
      })
    }

    issuedCount += 1
  }

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'fee_structure.issue_semester',
    targetType: 'semester',
    targetId: semester.id,
    metadata: { issuedCount, skippedCount },
  })

  return {
    issuedCount,
    skippedCount,
    semesterLabel: semester.name,
  }
}

