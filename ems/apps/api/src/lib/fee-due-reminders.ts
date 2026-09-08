import { and, eq, inArray, isNotNull, gt, sql } from 'drizzle-orm'
import type { InvoiceLineItem } from '@stackedu/shared'
import type { InstitutionDb } from '../db/connection'
import { invoices } from '../db/institution/schema/finance'
import { notifications } from '../db/institution/schema/communication'
import { students } from '../db/institution/schema/students'
import { notifyUsers } from '../services/role-notifications'

export const FEE_DUE_REMINDER_WINDOWS = [
  { key: '7d', label: '1 week', msBefore: 7 * 24 * 60 * 60 * 1000 },
  { key: '72h', label: '72 hours', msBefore: 72 * 60 * 60 * 1000 },
  { key: '48h', label: '48 hours', msBefore: 48 * 60 * 60 * 1000 },
  { key: '24h', label: '24 hours', msBefore: 24 * 60 * 60 * 1000 },
] as const

export type FeeDueReminderKey = (typeof FEE_DUE_REMINDER_WINDOWS)[number]['key']

function dueDateEndMs(dueDate: string): number {
  return new Date(`${dueDate}T23:59:59.999Z`).getTime()
}

/** Returns reminder keys that should fire at `now` for a given due date. */
export function feeDueRemindersDueNow(now: Date, dueDate: string): FeeDueReminderKey[] {
  const dueMs = dueDateEndMs(dueDate)
  const nowMs = now.getTime()
  if (nowMs >= dueMs) return []

  const keys: FeeDueReminderKey[] = []
  for (const window of FEE_DUE_REMINDER_WINDOWS) {
    const triggerAt = dueMs - window.msBefore
    // Fire once during the hour after the reminder threshold is reached.
    if (nowMs >= triggerAt && nowMs < triggerAt + 60 * 60 * 1000) {
      keys.push(window.key)
    }
  }
  return keys
}

function reminderKey(invoiceId: string, lineName: string, windowKey: FeeDueReminderKey): string {
  return `${invoiceId}:${lineName}:${windowKey}`
}

function reminderLabel(windowKey: FeeDueReminderKey): string {
  return FEE_DUE_REMINDER_WINDOWS.find((row) => row.key === windowKey)?.label ?? windowKey
}

export async function processFeeDueReminders(db: InstitutionDb, now = new Date()): Promise<number> {
  const rows = await db
    .select({
      invoiceId: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      studentId: invoices.studentId,
      userId: students.userId,
      amountDue: invoices.amountDue,
      amountPaid: invoices.amountPaid,
      lineItems: invoices.lineItems,
    })
    .from(invoices)
    .innerJoin(students, eq(students.id, invoices.studentId))
    .where(
      and(
        inArray(invoices.status, ['Issued', 'PartiallyPaid']),
        isNotNull(invoices.dueDate),
        gt(invoices.amountDue, invoices.amountPaid),
      ),
    )

  const pending: Array<{
    userId: string
    title: string
    body: string
    metadata: { feeReminderKey: string }
  }> = []

  for (const row of rows) {
    const lineItems = (row.lineItems ?? []) as InvoiceLineItem[]
    const targets = lineItems.length ? lineItems : [{ name: 'Fees', amount: row.amountDue - row.amountPaid, dueDate: '' }]
    for (const line of targets) {
      if (!line.dueDate) continue
      const keys = feeDueRemindersDueNow(now, line.dueDate)
      for (const windowKey of keys) {
        const key = reminderKey(row.invoiceId, line.name, windowKey)
        pending.push({
          userId: row.userId,
          title: `Fee due in ${reminderLabel(windowKey)}`,
          body: `${line.name} (${row.invoiceNumber}) is due on ${line.dueDate}. Pay from your Fees page to avoid a hold.`,
          metadata: { feeReminderKey: key },
        })
      }
    }
  }

  if (!pending.length) return 0

  const fresh: typeof pending = []
  for (const item of pending) {
    const [existing] = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(sql`${notifications.metadata}->>'feeReminderKey' = ${item.metadata.feeReminderKey}`)
      .limit(1)
    if (!existing) fresh.push(item)
  }
  if (!fresh.length) return 0

  await notifyUsers(
    db,
    fresh.map((item) => ({
      userId: item.userId,
      title: item.title,
      body: item.body,
      category: 'Fees',
      actionUrl: '/student/fees',
      metadata: item.metadata,
    })),
  )

  return fresh.length
}
