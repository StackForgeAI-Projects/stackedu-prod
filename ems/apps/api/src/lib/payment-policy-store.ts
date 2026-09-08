import {
  DEFAULT_PAYMENT_POLICY,
  PAYMENT_POLICY_SETTING_KEY,
  paymentPolicySchema,
  type PaymentPolicy,
} from '@stackedu/shared'
import type { InstitutionDb } from '../db/connection'
import { readInstitutionSetting, upsertInstitutionSetting } from './institution-settings'

export async function readPaymentPolicy(db: InstitutionDb): Promise<PaymentPolicy> {
  return readInstitutionSetting(db, PAYMENT_POLICY_SETTING_KEY, paymentPolicySchema, DEFAULT_PAYMENT_POLICY)
}

export async function writePaymentPolicy(
  db: InstitutionDb,
  policy: PaymentPolicy,
  updatedBy?: string,
): Promise<void> {
  await upsertInstitutionSetting(
    db,
    PAYMENT_POLICY_SETTING_KEY,
    policy,
    {
      category: 'Finance',
      description: 'Whether students pay fees in full or in instalments, by fee type.',
    },
    updatedBy,
  )
}
