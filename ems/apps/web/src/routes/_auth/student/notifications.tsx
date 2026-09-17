import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { StudentShell } from '@/components/StudentShell'
import { PagedList } from '@/components/ListPagination'
import {
  getStudentNotifications,
  markStudentNotificationRead,
  studentNotificationsQueryKey,
  studentProfileQueryKey,
} from '@/lib/api/student'
import { apiErrorMessage } from '@/lib/api/client'

export const Route = createFileRoute('/_auth/student/notifications')({
  component: NotificationsPage,
})

function NotificationsPage() {
  const queryClient = useQueryClient()
  const { data, isPending, error } = useQuery({
    queryKey: studentNotificationsQueryKey,
    queryFn: getStudentNotifications,
  })
  const mutation = useMutation({
    mutationFn: markStudentNotificationRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: studentNotificationsQueryKey })
      await queryClient.invalidateQueries({ queryKey: studentProfileQueryKey })
    },
  })

  return (
    <StudentShell pageTitle="Notifications" guide="Notices about fees, results and registration. Tap an unread item to mark it read.">
      <div className="animate-fade-up" style={{ padding: '24px 16px 56px' }}>
        <h1 className="t-h1 mb-6" style={{ fontFamily: 'var(--font-display)' }}>Notifications</h1>
        {isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading…</p>
        ) : error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load notifications.')}</p>
        ) : (
          <PagedList
            items={data ?? []}
            getKey={(item) => item.id}
            defaultPageSize={10}
            itemLabel="notifications"
            empty={<p className="t-body" style={{ color: 'var(--muted-foreground)' }}>No notifications yet.</p>}
            renderItem={(item) => (
              <button
                className="w-full text-left p-4"
                style={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-xl)',
                  opacity: item.readAt ? 0.7 : 1,
                }}
                onClick={() => { if (!item.readAt) mutation.mutate(item.id) }}
              >
                <p className="t-label mb-1">{item.category}</p>
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>{item.body}</p>
                {item.actionUrl ? (
                  <a
                    href={item.actionUrl}
                    className="t-caption mt-2 inline-block"
                    style={{ color: 'var(--success)' }}
                    onClick={(event) => event.stopPropagation()}
                  >
                    Open →
                  </a>
                ) : null}
              </button>
            )}
          />
        )}
      </div>
    </StudentShell>
  )
}
