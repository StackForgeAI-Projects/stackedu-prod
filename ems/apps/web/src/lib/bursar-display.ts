import type { PaymentMethod, PaymentStatus } from '@stackedu/shared'

export function paymentMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case 'MoMo':
      return 'MTN MoMo'
    case 'Airtel':
      return 'Airtel Money'
    case 'BankTransfer':
      return 'Bank Transfer'
    case 'Card':
      return 'Card'
  }
}

export function paymentMethodColors(method: PaymentMethod) {
  switch (method) {
    case 'MoMo':
      return { bg: 'var(--warning-bg)', color: 'var(--warning)' }
    case 'Airtel':
      return { bg: 'var(--error-bg)', color: 'var(--error)' }
    case 'Card':
      return { bg: 'var(--info-bg)', color: 'var(--info)' }
    case 'BankTransfer':
      return { bg: 'var(--muted)', color: 'var(--muted-foreground)' }
  }
}

export function paymentStatusLabel(status: PaymentStatus): string {
  if (status === 'Completed') return 'Paid'
  return status
}

export function accountStatusColors(status: 'Paid' | 'Outstanding' | 'On Hold' | PaymentStatus | 'Valid' | 'Voided') {
  switch (status) {
    case 'Paid':
    case 'Completed':
    case 'Valid':
      return { bg: 'var(--success-bg)', color: 'var(--success)' }
    case 'Pending':
    case 'Outstanding':
      return { bg: 'var(--warning-bg)', color: 'var(--warning)' }
    case 'Failed':
    case 'On Hold':
      return { bg: 'var(--error-bg)', color: 'var(--error)' }
    case 'Voided':
      return { bg: 'var(--muted)', color: 'var(--muted-foreground)' }
    default:
      return { bg: 'var(--muted)', color: 'var(--muted-foreground)' }
  }
}

export function uiMethodToApi(value: string): PaymentMethod | undefined {
  switch (value) {
    case 'MTN MoMo':
      return 'MoMo'
    case 'Airtel Money':
      return 'Airtel'
    case 'Bank Transfer':
      return 'BankTransfer'
    case 'Card':
      return 'Card'
    case 'MoMo':
    case 'Airtel':
    case 'BankTransfer':
      return value
    default:
      return undefined
  }
}

export function uiStatusToApi(value: string): PaymentStatus | undefined {
  if (value === 'Paid') return 'Completed'
  if (value === 'Pending' || value === 'Failed' || value === 'Voided' || value === 'Completed') {
    return value as PaymentStatus
  }
  return undefined
}
