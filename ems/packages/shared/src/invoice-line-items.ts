import { z } from 'zod'
import { isoDateSchema } from './primitives'

export const invoiceLineItemSchema = z.object({
  name: z.string(),
  amount: z.number().int(),
  dueDate: isoDateSchema,
})

export type InvoiceLineItem = z.infer<typeof invoiceLineItemSchema>

/** Earliest due date across line items — used as the invoice-level due date. */
export function earliestInvoiceDueDate(lineItems: InvoiceLineItem[]): string | null {
  if (!lineItems.length) return null
  return [...lineItems.map((item) => item.dueDate)].sort()[0] ?? null
}
