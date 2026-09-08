import { and, eq } from 'drizzle-orm'
import type { InvoiceLineItem } from '@stackedu/shared'
import { earliestInvoiceDueDate } from '@stackedu/shared'
import type { InstitutionDb } from '../db/connection'
import { invoices, studentFeeAccounts } from '../db/institution/schema/finance'
import { students } from '../db/institution/schema/students'

export type ApplicableFeeItemRow = {
  itemId: string
  name: string
  amount: number
  dueDate: string | null
  programmeId: string | null
  yearOfStudy: number | null
}

export type InvoiceLineItemWithFee = InvoiceLineItem & { feeItemId?: string }

export function feeItemsApplyToStudent(
  items: ApplicableFeeItemRow[],
  student: { programmeId: string; yearOfStudy: number | null },
): ApplicableFeeItemRow[] {
  return items.filter(
    (item) =>
      (!item.programmeId || item.programmeId === student.programmeId) &&
      (item.yearOfStudy == null || item.yearOfStudy === student.yearOfStudy),
  )
}

export function buildInvoiceLineItems(items: ApplicableFeeItemRow[]): InvoiceLineItemWithFee[] {
  const missingDue = items.filter((item) => !item.dueDate)
  if (missingDue.length) {
    throw new Error(`Set a due date on every active fee item before issuing invoices (${missingDue[0]!.name}).`)
  }
  return items.map((item) => ({
    name: item.name,
    amount: item.amount,
    dueDate: item.dueDate!,
    feeItemId: item.itemId,
  }))
}

export function invoiceAmountDue(lineItems: InvoiceLineItemWithFee[]): number {
  return lineItems.reduce((sum, item) => sum + item.amount, 0)
}

export function invoicePayloadFromFeeItems(items: ApplicableFeeItemRow[]) {
  const lineItems = buildInvoiceLineItems(items)
  return {
    lineItems,
    amountDue: invoiceAmountDue(lineItems),
    dueDate: earliestInvoiceDueDate(lineItems),
  }
}

function lineItemAlreadyBilled(lineItems: unknown, item: ApplicableFeeItemRow): boolean {
  if (!Array.isArray(lineItems)) return false
  return lineItems.some((row) => {
    if (typeof row !== 'object' || !row) return false
    const line = row as InvoiceLineItemWithFee
    if (line.feeItemId) return line.feeItemId === item.itemId
    return line.name === item.name
  })
}

async function chargeStudentAccount(db: InstitutionDb, studentId: string, amount: number): Promise<void> {
  const [account] = await db
    .select()
    .from(studentFeeAccounts)
    .where(eq(studentFeeAccounts.studentId, studentId))
    .limit(1)

  if (account) {
    await db
      .update(studentFeeAccounts)
      .set({
        totalCharged: account.totalCharged + amount,
        balance: account.balance + amount,
      })
      .where(eq(studentFeeAccounts.id, account.id))
    return
  }

  await db.insert(studentFeeAccounts).values({
    studentId,
    totalCharged: amount,
    totalPaid: 0,
    balance: amount,
  })
}

async function adjustStudentAccountCharge(db: InstitutionDb, studentId: string, amountDelta: number): Promise<void> {
  if (amountDelta === 0) return

  const [account] = await db
    .select()
    .from(studentFeeAccounts)
    .where(eq(studentFeeAccounts.studentId, studentId))
    .limit(1)

  if (!account) return

  const totalCharged = Math.max(account.totalPaid, account.totalCharged + amountDelta)
  await db
    .update(studentFeeAccounts)
    .set({
      totalCharged,
      balance: totalCharged - account.totalPaid,
    })
    .where(eq(studentFeeAccounts.id, account.id))
}

export function allocateInvoicePaymentsToLineItems(
  lineItems: InvoiceLineItemWithFee[],
  amountPaid: number,
): number[] {
  let remaining = amountPaid
  return lineItems.map((item) => {
    const applied = Math.min(remaining, item.amount)
    remaining -= applied
    return applied
  })
}

function findLineItemIndex(
  lineItems: InvoiceLineItemWithFee[],
  feeItemId: string,
  feeName: string,
): number {
  const byId = lineItems.findIndex((line) => line.feeItemId === feeItemId)
  if (byId >= 0) return byId
  return lineItems.findIndex((line) => !line.feeItemId && line.name === feeName)
}

function invoiceStatusFromAmounts(
  amountDue: number,
  amountPaid: number,
): 'Issued' | 'PartiallyPaid' | 'Paid' | 'Draft' {
  if (amountDue <= 0) return amountPaid > 0 ? 'Paid' : 'Issued'
  if (amountPaid >= amountDue) return 'Paid'
  if (amountPaid > 0) return 'PartiallyPaid'
  return 'Issued'
}

export async function revokeUnpaidFeeItemFromInvoices(
  db: InstitutionDb,
  input: { feeItemId: string; feeName: string; semesterId: string | null },
): Promise<{ removedCount: number; keptCount: number }> {
  const invoiceRows = await db
    .select()
    .from(invoices)
    .where(input.semesterId ? eq(invoices.semesterId, input.semesterId) : undefined)

  let removedCount = 0
  let keptCount = 0

  for (const invoice of invoiceRows) {
    const lineItems = (invoice.lineItems ?? []) as InvoiceLineItemWithFee[]
    const index = findLineItemIndex(lineItems, input.feeItemId, input.feeName)
    if (index < 0) continue

    const allocations = allocateInvoicePaymentsToLineItems(lineItems, invoice.amountPaid)
    if (allocations[index]! > 0) {
      keptCount += 1
      continue
    }

    const removedAmount = lineItems[index]!.amount
    const newLineItems = lineItems.filter((_, itemIndex) => itemIndex !== index)

    if (!newLineItems.length && invoice.amountPaid === 0) {
      await db.delete(invoices).where(eq(invoices.id, invoice.id))
    } else {
      const amountDue = invoiceAmountDue(newLineItems)
      await db
        .update(invoices)
        .set({
          lineItems: newLineItems,
          amountDue,
          dueDate: newLineItems.length ? earliestInvoiceDueDate(newLineItems) : null,
          status: invoiceStatusFromAmounts(amountDue, invoice.amountPaid),
        })
        .where(eq(invoices.id, invoice.id))
    }

    await adjustStudentAccountCharge(db, invoice.studentId, -removedAmount)
    removedCount += 1
  }

  return { removedCount, keptCount }
}

export async function applyFeeItemsToStudents(
  db: InstitutionDb,
  semesterId: string,
  semesterName: string,
  items: ApplicableFeeItemRow[],
): Promise<{ issuedCount: number; updatedCount: number; skippedCount: number }> {
  if (!items.length) {
    return { issuedCount: 0, updatedCount: 0, skippedCount: 0 }
  }

  invoicePayloadFromFeeItems(items)

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
  let updatedCount = 0
  let skippedCount = 0
  const now = new Date().toISOString()

  for (const student of studentRows) {
    const matching = feeItemsApplyToStudent(items, student)
    if (!matching.length) {
      skippedCount += 1
      continue
    }

    const [invoice] = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.studentId, student.id), eq(invoices.semesterId, semesterId)))
      .limit(1)

    if (!invoice) {
      const { lineItems, amountDue, dueDate } = invoicePayloadFromFeeItems(matching)
      await db.insert(invoices).values({
        invoiceNumber: `INV-${student.studentNumber}-${semesterName.replace(/\s+/g, '-').toUpperCase()}`,
        studentId: student.id,
        semesterId,
        amountDue,
        amountPaid: 0,
        status: 'Issued',
        issuedAt: now,
        dueDate,
        lineItems,
      })
      await chargeStudentAccount(db, student.id, amountDue)
      issuedCount += 1
      continue
    }

    const existingLineItems = (invoice.lineItems ?? []) as InvoiceLineItemWithFee[]
    const newItems = matching.filter((item) => !lineItemAlreadyBilled(existingLineItems, item))
    if (!newItems.length) {
      skippedCount += 1
      continue
    }

    const addedAmount = newItems.reduce((sum, item) => sum + item.amount, 0)
    const mergedLineItems = [...existingLineItems, ...buildInvoiceLineItems(newItems)]
    const amountDue = invoice.amountDue + addedAmount
    const amountPaid = invoice.amountPaid
    const status =
      amountPaid >= amountDue ? 'Paid' : amountPaid > 0 ? 'PartiallyPaid' : invoice.status === 'Draft' ? 'Issued' : invoice.status

    await db
      .update(invoices)
      .set({
        lineItems: mergedLineItems,
        amountDue,
        dueDate: earliestInvoiceDueDate(mergedLineItems),
        status,
      })
      .where(eq(invoices.id, invoice.id))

    await chargeStudentAccount(db, student.id, addedAmount)
    updatedCount += 1
  }

  return { issuedCount, updatedCount, skippedCount }
}
