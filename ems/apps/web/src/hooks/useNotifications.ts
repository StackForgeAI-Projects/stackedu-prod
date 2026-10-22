import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { accountNotificationsQueryKey, getAccountNotifications } from '@/lib/api/account'

const SEEN_KEY = 'stackedu:browser-notification-ids'

function readSeen(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SEEN_KEY)
    const parsed = raw ? JSON.parse(raw) as unknown : []
    return new Set(Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [])
  } catch {
    return new Set()
  }
}

function writeSeen(ids: Set<string>): void {
  sessionStorage.setItem(SEEN_KEY, JSON.stringify([...ids]))
}

async function showBackgroundNotification(title: string, body: string, url: string | null): Promise<void> {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  const payload = { body, icon: '/stackedu-logo.webp', data: { url: url || '/' } }
  try {
    const registration = await navigator.serviceWorker.ready
    await registration.showNotification(title, payload)
  } catch {
    new Notification(title, payload)
  }
}

/**
 * When the signed-in app is minimised on a phone browser, new in-app notices
 * also appear as a system popup — if the browser allowed notifications.
 */
export function useNotifications(): void {
  const primed = useRef(false)
  const { data = [] } = useQuery({
    queryKey: accountNotificationsQueryKey,
    queryFn: () => getAccountNotifications(8),
    refetchInterval: 30_000,
  })

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    void navigator.serviceWorker.register('/sw.js')
  }, [])

  useEffect(() => {
    if (!('Notification' in window)) return
    const ask = () => {
      if (Notification.permission === 'default') void Notification.requestPermission()
    }
    ask()
    document.addEventListener('pointerdown', ask, { once: true })
    return () => document.removeEventListener('pointerdown', ask)
  }, [])

  useEffect(() => {
    const ids = data.map((item) => item.id)
    if (!primed.current) {
      primed.current = true
      writeSeen(new Set([...readSeen(), ...ids]))
      return
    }

    const seen = readSeen()
    const fresh = data.filter((item) => !item.readAt && !seen.has(item.id))
    for (const item of ids) seen.add(item)
    writeSeen(seen)

    if (document.hidden) {
      for (const item of fresh) {
        void showBackgroundNotification(item.title, item.body, item.actionUrl)
      }
    }
  }, [data])
}
