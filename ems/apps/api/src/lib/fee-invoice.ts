import type { InvoiceLineItem } from '@stackedu/shared'
import { earliestInvoiceDueDate } from '@stackedu/shared'

export type ApplicableFeeItemRow = {
  itemId: string
  name: string
  amount: number
  dueDate: string | null
  programmeId: string | null
  yearOfStudy: number | null
}

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

export function buildInvoiceLineItems(items: ApplicableFeeItemRow[]): InvoiceLineItem[] {
  const missingDue = items.filter((item) => !item.dueDate)
  if (missingDue.length) {
    throw new Error(`Set a due date on every active fee item before issuing invoices (${missingDue[0]!.name}).`)
  }
  return items.map((item) => ({
    name: item.name,
    amount: item.amount,
    dueDate: item.dueDate!,
  }))
}

export function invoiceAmountDue(lineItems: InvoiceLineItem[]): number {
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
