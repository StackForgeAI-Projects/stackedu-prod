import type { QueryClient } from '@tanstack/react-query'
import type { AccountNotification } from '@stackedu/shared'
import { accountNotificationsQueryKey } from '@/lib/api/account'

/** Same tuples as each role API file — listed here so this helper stays import-cycle free. */
const ROLE_PROFILE_KEYS = [
  ['academic', 'me'],
  ['bursar', 'me'],
  ['ict', 'me'],
  ['lecturer', 'me'],
  ['librarian', 'me'],
  ['student', 'me'],
] as const

const ROLE_NOTIFICATION_LIST_KEYS = [
  ['academic', 'notifications'],
  ['bursar', 'notifications'],
  ['ict', 'notifications'],
  ['lecturer', 'notifications'],
  ['librarian', 'notifications'],
  ['student', 'notifications'],
] as const

type UnreadProfile = { unreadCount: number }

function isUnreadProfile(value: unknown): value is UnreadProfile {
  return (
    typeof value === 'object'
    && value !== null
    && 'unreadCount' in value
    && typeof (value as { unreadCount: unknown }).unreadCount === 'number'
  )
}

function decrementUnread(value: unknown): unknown {
  if (!isUnreadProfile(value)) return value
  return { ...value, unreadCount: Math.max(0, value.unreadCount - 1) }
}

function zeroUnread(value: unknown): unknown {
  if (!isUnreadProfile(value)) return value
  return { ...value, unreadCount: 0 }
}

function markListItemRead(item: unknown, id: string, readAt: string): unknown {
  if (!item || typeof item !== 'object' || !('id' in item) || item.id !== id) return item
  const record = item as Record<string, unknown>
  return {
    ...record,
    ...('readAt' in record ? { readAt } : {}),
    ...('read' in record ? { read: true } : {}),
  }
}

function markAllListItemsRead(item: unknown, readAt: string): unknown {
  if (!item || typeof item !== 'object') return item
  const record = item as Record<string, unknown>
  return {
    ...record,
    ...('readAt' in record ? { readAt } : {}),
    ...('read' in record ? { read: true } : {}),
  }
}

function wasUnreadInList(item: unknown, id: string): boolean {
  if (!item || typeof item !== 'object' || !('id' in item) || item.id !== id) return false
  const record = item as Record<string, unknown>
  if ('readAt' in record) return record.readAt == null
  if ('read' in record) return record.read !== true
  return false
}

/**
 * Marks one notice read in every cached list and drops the header bell count
 * in the same tick. The caller still posts the read to the API.
 */
export function applyNotificationReadLocally(queryClient: QueryClient, id: string): boolean {
  const headerList = queryClient.getQueryData<AccountNotification[]>(accountNotificationsQueryKey)
  const headerTarget = headerList?.find((item) => item.id === id)
  if (headerTarget?.readAt) return false

  const roleUnread = ROLE_NOTIFICATION_LIST_KEYS.some((key) => {
    const list = queryClient.getQueryData(key)
    return Array.isArray(list) && list.some((item) => wasUnreadInList(item, id))
  })
  if (!headerTarget && !roleUnread && headerList) {
    const knownInRole = ROLE_NOTIFICATION_LIST_KEYS.some((key) => {
      const list = queryClient.getQueryData(key)
      return Array.isArray(list) && list.some((item) => (
        item
        && typeof item === 'object'
        && 'id' in item
        && item.id === id
      ))
    })
    if (knownInRole) return false
  }

  const readAt = new Date().toISOString()
  if (headerList) {
    queryClient.setQueryData(
      accountNotificationsQueryKey,
      headerList.map((item) => (item.id === id ? { ...item, readAt } : item)),
    )
  }

  for (const key of ROLE_NOTIFICATION_LIST_KEYS) {
    queryClient.setQueryData(key, (current: unknown) => {
      if (!Array.isArray(current)) return current
      return current.map((item) => markListItemRead(item, id, readAt))
    })
  }

  for (const key of ROLE_PROFILE_KEYS) {
    queryClient.setQueryData(key, decrementUnread)
  }
  return true
}

/** Marks every cached notice read and clears the header bell count. */
export function applyAllNotificationsReadLocally(queryClient: QueryClient): void {
  const readAt = new Date().toISOString()
  const headerList = queryClient.getQueryData<AccountNotification[]>(accountNotificationsQueryKey)
  if (headerList) {
    queryClient.setQueryData(
      accountNotificationsQueryKey,
      headerList.map((item) => (item.readAt ? item : { ...item, readAt })),
    )
  }

  for (const key of ROLE_NOTIFICATION_LIST_KEYS) {
    queryClient.setQueryData(key, (current: unknown) => {
      if (!Array.isArray(current)) return current
      return current.map((item) => markAllListItemsRead(item, readAt))
    })
  }

  for (const key of ROLE_PROFILE_KEYS) {
    queryClient.setQueryData(key, zeroUnread)
  }
}

export async function invalidateNotificationReadCaches(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: accountNotificationsQueryKey }),
    ...ROLE_PROFILE_KEYS.map((key) => queryClient.invalidateQueries({ queryKey: key })),
    ...ROLE_NOTIFICATION_LIST_KEYS.map((key) => queryClient.invalidateQueries({ queryKey: key })),
  ])
}
