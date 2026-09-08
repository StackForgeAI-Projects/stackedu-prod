type FeeLineItem = { name?: string; amount?: number }

/** Builds a human-readable fee label from invoice line items. */
export function feeDescriptionFromLineItems(lineItems: unknown, fallback = 'Tuition and fees'): string {
  if (!Array.isArray(lineItems) || lineItems.length === 0) return fallback
  const first = lineItems[0] as FeeLineItem
  if (typeof first?.name === 'string' && first.name.trim()) return first.name.trim()
  return fallback
}
