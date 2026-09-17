import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  accountNotificationsQueryKey,
  getAccountNotifications,
  markAccountNotificationRead,
} from '@/lib/api/account'
import { academicProfileQueryKey } from '@/lib/api/academic'
import { ictProfileQueryKey } from '@/lib/api/ict'
import { librarianProfileQueryKey } from '@/lib/api/library'
import { studentProfileQueryKey } from '@/lib/api/student'
import { cn, formatDateShort, parseAppDateTime } from '@/lib/utils'

interface NotificationMenuProps {
  unreadCount?: number
  notificationsHref: string
}

function formatWhen(iso: string): string {
  const date = parseAppDateTime(iso)
  if (!date) return iso
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return formatDateShort(date)
}

export function NotificationMenu({ unreadCount = 0, notificationsHref }: NotificationMenuProps) {
  const queryClient = useQueryClient()
  const { data, isPending } = useQuery({
    queryKey: accountNotificationsQueryKey,
    queryFn: () => getAccountNotifications(8),
  })

  const notifications = data ?? []

  async function markRead(id: string) {
    const updated = await markAccountNotificationRead(id)
    queryClient.setQueryData(accountNotificationsQueryKey, updated)
    await queryClient.invalidateQueries({ queryKey: ictProfileQueryKey })
    await queryClient.invalidateQueries({ queryKey: academicProfileQueryKey })
    await queryClient.invalidateQueries({ queryKey: studentProfileQueryKey })
    await queryClient.invalidateQueries({ queryKey: librarianProfileQueryKey })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative flex items-center justify-center h-9 w-9 rounded-lg transition-colors duration-150 outline-none"
          style={{ color: 'var(--muted-foreground)' }}
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        >
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 && (
            <span
              className={cn(
                'absolute -top-0.5 -right-0.5 flex items-center justify-center',
                'min-w-[16px] h-4 rounded-full px-1 text-[10px] font-bold leading-none',
              )}
              style={{ backgroundColor: 'var(--error)', color: '#fff' }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-2rem)] p-0">
        <DropdownMenuLabel className="px-4 py-3">Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator className="m-0" />

        {isPending ? (
          <p className="px-4 py-6 text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading…</p>
        ) : notifications.length === 0 ? (
          <p className="px-4 py-6 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            No notifications yet.
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((item) => (
              <DropdownMenuItem
                key={item.id}
                className="flex flex-col items-start gap-1 rounded-none px-4 py-3 cursor-pointer whitespace-normal"
                onClick={() => {
                  if (!item.readAt) void markRead(item.id)
                }}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    {item.title}
                  </span>
                  {!item.readAt ? (
                    <span className="mt-1 h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--brand)' }} />
                  ) : null}
                </div>
                <span className="text-xs line-clamp-2" style={{ color: 'var(--muted-foreground)' }}>
                  {item.body}
                </span>
                <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                  {formatWhen(item.createdAt)}
                </span>
              </DropdownMenuItem>
            ))}
          </div>
        )}

        <DropdownMenuSeparator className="m-0" />
        <DropdownMenuItem asChild className="justify-center py-3 cursor-pointer">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Link to={notificationsHref as any} className="w-full text-center text-sm font-medium">
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
