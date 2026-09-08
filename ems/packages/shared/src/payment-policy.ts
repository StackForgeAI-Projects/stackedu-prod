import { z } from 'zod'
import { uuidSchema } from './primitives'

export const paymentFeeKindSchema = z.enum(['ApplicationFee', 'TuitionFee', 'Levy', 'Other'])
export const paymentCollectionModeSchema = z.enum(['FullOnly', 'PartialAllowed'])

export const paymentPolicyRuleSchema = z.object({
  feeKind: paymentFeeKindSchema,
  departmentId: uuidSchema.nullable().optional(),
  yearOfStudy: z.number().int().min(1).max(8).nullable().optional(),
  mode: paymentCollectionModeSchema,
})

export const paymentPolicySchema = z.object({
  rules: z.array(paymentPolicyRuleSchema),
})

export type PaymentFeeKind = z.infer<typeof paymentFeeKindSchema>
export type PaymentCollectionMode = z.infer<typeof paymentCollectionModeSchema>
export type PaymentPolicyRule = z.infer<typeof paymentPolicyRuleSchema>
export type PaymentPolicy = z.infer<typeof paymentPolicySchema>

export const PAYMENT_POLICY_SETTING_KEY = 'payment.policy'

export const DEFAULT_PAYMENT_POLICY: PaymentPolicy = {
  rules: [
    { feeKind: 'ApplicationFee', mode: 'FullOnly' },
    { feeKind: 'TuitionFee', mode: 'PartialAllowed' },
    { feeKind: 'Levy', mode: 'PartialAllowed' },
    { feeKind: 'Other', mode: 'PartialAllowed' },
  ],
}

export interface PaymentPolicyContext {
  feeKind: PaymentFeeKind
  departmentId?: string | null
  yearOfStudy?: number | null
}

function ruleSpecificity(rule: PaymentPolicyRule): number {
  let score = 0
  if (rule.departmentId) score += 2
  if (rule.yearOfStudy != null) score += 1
  return score
}

export function resolvePaymentCollectionMode(
  policy: PaymentPolicy,
  context: PaymentPolicyContext,
): PaymentCollectionMode {
  const matches = policy.rules.filter((rule) => {
    if (rule.feeKind !== context.feeKind) return false
    if (rule.departmentId && rule.departmentId !== context.departmentId) return false
    if (rule.yearOfStudy != null && rule.yearOfStudy !== context.yearOfStudy) return false
    return true
  })

  if (!matches.length) {
    const fallback = policy.rules.find((rule) => rule.feeKind === context.feeKind)
    return fallback?.mode ?? 'PartialAllowed'
  }

  matches.sort((a, b) => ruleSpecificity(b) - ruleSpecificity(a))
  return matches[0]!.mode
}

export function allowsPartialPayment(
  policy: PaymentPolicy,
  context: PaymentPolicyContext,
): boolean {
  return resolvePaymentCollectionMode(policy, context) === 'PartialAllowed'
}

export function classifyFeeKindFromLineItems(lineItems: unknown): PaymentFeeKind {
  if (!Array.isArray(lineItems) || !lineItems.length) return 'Other'
  const names = lineItems
    .map((item) => (typeof item === 'object' && item && 'name' in item ? String((item as { name: unknown }).name) : ''))
    .join(' ')
    .toLowerCase()
  if (names.includes('application')) return 'ApplicationFee'
  if (names.includes('tuition')) return 'TuitionFee'
  if (names.includes('levy') || names.includes('library') || names.includes('administrative')) return 'Levy'
  return 'Other'
}

export function validatePaymentAmount(input: {
  amount: number
  outstanding: number
  policy: PaymentPolicy
  context: PaymentPolicyContext
}): { ok: true } | { ok: false; message: string } {
  if (input.amount <= 0) {
    return { ok: false, message: 'Enter a valid payment amount.' }
  }
  if (input.amount > input.outstanding) {
    return { ok: false, message: 'That amount is more than the outstanding balance.' }
  }
  const mode = resolvePaymentCollectionMode(input.policy, input.context)
  if (mode === 'FullOnly' && input.amount < input.outstanding) {
    return { ok: false, message: 'This fee must be paid in full.' }
  }
  return { ok: true }
}
