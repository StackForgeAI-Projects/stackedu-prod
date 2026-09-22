import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { AccountLiveCursor } from '@stackedu/shared'
import { accountLiveQueryKey, getAccountLiveCursor } from '@/lib/api/account'
import { academicDashboardQueryKey } from '@/lib/api/academic'
import { academicApplicationsQueryKey, applicationQueryKey } from '@/lib/api/admissions'

const POLL_MS = 2_000

function stampChanged(previous: string | null, next: string | null): boolean {
  return previous !== next
}

/**
 * Polls cheap timestamps and refreshes the open screens that depend on them.
 * React Query otherwise keeps admissions and timetable data for five minutes,
 * so an upload or a confirmed class would stay hidden until something else
 * replaced the cache.
 */
export function useLiveRefresh(enabled = true): void {
  const queryClient = useQueryClient()
  const primed = useRef(false)
  const previous = useRef<AccountLiveCursor | null>(null)

  const { data } = useQuery({
    queryKey: accountLiveQueryKey,
    queryFn: getAccountLiveCursor,
    enabled,
    refetchInterval: POLL_MS,
    staleTime: 0,
  })

  useEffect(() => {
    if (!data) return
    if (!primed.current) {
      primed.current = true
      previous.current = data
      return
    }

    const last = previous.current
    previous.current = data
    if (!last) return

    if (stampChanged(last.notificationsAt, data.notificationsAt)) {
      void queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.some((part) => part === 'notifications' || part === 'me'),
      })
    }

    if (stampChanged(last.admissionsAt, data.admissionsAt)) {
      void queryClient.invalidateQueries({ queryKey: academicApplicationsQueryKey })
      void queryClient.invalidateQueries({ queryKey: applicationQueryKey })
      void queryClient.invalidateQueries({ queryKey: academicDashboardQueryKey })
    }

    if (stampChanged(last.timetableAt, data.timetableAt)) {
      void queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.some((part) => part === 'timetable' || part === 'dashboard'),
      })
    }
  }, [data, queryClient])
}
