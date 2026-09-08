import { describe, expect, it } from 'vitest'
import { formatDisplayName, isBillingSemesterName } from '@stackedu/shared'
import {
  feeDescriptionForPayment,
  feeDescriptionFromLineItems,
  paymentDescriptionsById,
} from '../src/lib/fee-description'

describe('fee descriptions', () => {
  it('lists every line item name when building an invoice description', () => {
    expect(
      feeDescriptionFromLineItems([
        { name: 'Department fees', amount: 100_000, dueDate: '2026-09-30' },
        { name: 'Laboratory Fees', amount: 10_000, dueDate: '2026-11-30' },
      ]),
    ).toBe('Department fees, Laboratory Fees')
  })

  it('maps each payment to the fee line item it covers', () => {
    const lineItems = [
      { name: 'Tuition', amount: 3_000_000, dueDate: '2026-09-09' },
      { name: 'Department fees', amount: 100_000, dueDate: '2026-09-30' },
    ]

    expect(feeDescriptionForPayment(lineItems, 100_000, 3_000_000)).toBe('Department fees')
    expect(feeDescriptionForPayment(lineItems, 3_000_000, 0)).toBe('Tuition')
  })

  it('builds payment descriptions chronologically within an invoice', () => {
    const descriptions = paymentDescriptionsById([
      {
        id: 'pay-1',
        invoiceId: 'inv-1',
        amount: 3_000_000,
        paidAt: '2026-09-08T10:00:00.000Z',
        lineItems: [
          { name: 'Tuition', amount: 3_000_000, dueDate: '2026-09-09' },
          { name: 'Department fees', amount: 100_000, dueDate: '2026-09-30' },
        ],
      },
      {
        id: 'pay-2',
        invoiceId: 'inv-1',
        amount: 100_000,
        paidAt: '2026-09-08T11:00:00.000Z',
        lineItems: [
          { name: 'Tuition', amount: 3_000_000, dueDate: '2026-09-09' },
          { name: 'Department fees', amount: 100_000, dueDate: '2026-09-30' },
        ],
      },
    ])

    expect(descriptions.get('pay-1')).toBe('Tuition')
    expect(descriptions.get('pay-2')).toBe('Department fees')
  })
})

describe('display helpers', () => {
  it('title-cases person names', () => {
    expect(formatDisplayName('doris arusei')).toBe('Doris Arusei')
    expect(formatDisplayName('jean-paul mugisha')).toBe('Jean-Paul Mugisha')
  })

  it('excludes orientation and career day records from billing semesters', () => {
    expect(isBillingSemesterName('First Semester')).toBe(true)
    expect(isBillingSemesterName('Second Semester')).toBe(true)
    expect(isBillingSemesterName('Orientation day')).toBe(false)
    expect(isBillingSemesterName('Career Day')).toBe(false)
  })
})
