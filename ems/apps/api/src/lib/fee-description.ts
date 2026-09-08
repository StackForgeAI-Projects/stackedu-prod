type FeeLineItem = { name?: string; amount?: number }

function allocatePayments(lineItems: FeeLineItem[], amountPaid: number): number[] {
  let remaining = amountPaid
  return lineItems.map((item) => {
    const applied = Math.min(remaining, item.amount ?? 0)
    remaining -= applied
    return applied
  })
}

/** Builds a human-readable fee label from invoice line items. */
export function feeDescriptionFromLineItems(lineItems: unknown, fallback = 'Tuition and fees'): string {
  if (!Array.isArray(lineItems) || lineItems.length === 0) return fallback
  const names = lineItems
    .map((row) => (typeof row === 'object' && row && 'name' in row ? String((row as FeeLineItem).name ?? '').trim() : ''))
    .filter(Boolean)
  if (names.length === 1) return names[0]!
  if (names.length > 1) return names.join(', ')
  return fallback
}

/** Maps a payment to the fee line item(s) it covers using FIFO allocation. */
export function feeDescriptionForPayment(
  lineItems: unknown,
  paymentAmount: number,
  invoiceAmountPaidBefore: number,
  fallback = 'Tuition and fees',
): string {
  if (!Array.isArray(lineItems) || lineItems.length === 0) return fallback
  const items = lineItems as FeeLineItem[]
  const before = allocatePayments(items, invoiceAmountPaidBefore)
  const after = allocatePayments(items, invoiceAmountPaidBefore + paymentAmount)
  const names = items
    .map((item, index) => ({
      name: item.name?.trim() ?? '',
      delta: after[index]! - before[index]!,
    }))
    .filter((row) => row.delta > 0 && row.name)
    .map((row) => row.name)
  if (names.length === 1) return names[0]!
  if (names.length > 1) return names.join(', ')
  return feeDescriptionFromLineItems(lineItems, fallback)
}

type PaymentDescriptionInput = {
  id: string
  invoiceId: string | null
  amount: number
  paidAt: string | null
  lineItems: unknown
  programmeName?: string | null
}

export function paymentDescriptionsById(
  rows: PaymentDescriptionInput[],
  fallbackFor: (row: PaymentDescriptionInput) => string = (row) =>
    row.programmeName ? `${row.programmeName} fees` : 'Tuition and fees',
): Map<string, string> {
  const descriptions = new Map<string, string>()
  const byInvoice = new Map<string, PaymentDescriptionInput[]>()

  for (const row of rows) {
    if (!row.invoiceId) {
      descriptions.set(row.id, feeDescriptionFromLineItems(row.lineItems, fallbackFor(row)))
      continue
    }
    const list = byInvoice.get(row.invoiceId) ?? []
    list.push(row)
    byInvoice.set(row.invoiceId, list)
  }

  for (const invoiceRows of byInvoice.values()) {
    const sorted = [...invoiceRows].sort((a, b) => (a.paidAt ?? a.id).localeCompare(b.paidAt ?? b.id))
    let paidBefore = 0
    for (const row of sorted) {
      descriptions.set(row.id, feeDescriptionForPayment(row.lineItems, row.amount, paidBefore, fallbackFor(row)))
      paidBefore += row.amount
    }
  }

  return descriptions
}
