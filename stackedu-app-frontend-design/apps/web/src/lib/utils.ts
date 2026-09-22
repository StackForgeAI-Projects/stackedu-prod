import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Compose Tailwind class names with conflict resolution.
 * Import this from @/lib/utils — never from individual components.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format an integer monetary amount using the globally selected currency.
 * Currency is persisted in localStorage key 'stackedu_currency'.
 * RWF (default): "RWF 45,000"  |  USD: "$45.00" (1000 RWF = $1 mock rate)
 */
export function formatCurrency(amount: number): string {
  let currency = 'RWF'
  try { currency = localStorage.getItem('stackedu_currency') ?? 'RWF' } catch { /* SSR */ }
  if (currency === 'USD') {
    const usd = amount / 1000
    return `$${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return `RWF ${amount.toLocaleString('en-RW')}`
}

/** Read the active currency code from localStorage. */
export function getActiveCurrency(): string {
  try { return localStorage.getItem('stackedu_currency') ?? 'RWF' } catch { return 'RWF' }
}

/** Persist the selected currency to localStorage. */
export function setActiveCurrency(code: string): void {
  try { localStorage.setItem('stackedu_currency', code) } catch { /* SSR */ }
}

/**
 * Format a date for dense UI (tables, badges).
 * e.g. 2026-06-30 → "30 Jun 2026"
 */
export function formatDateShort(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Format a date for confirmations and full views.
 * e.g. 2026-06-30 → "Tuesday, 30 June 2026"
 */
export function formatDateLong(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Format a time in 24-hour clock per StackEDU conventions.
 * e.g. 14:30, not 2:30 PM
 */
export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}
