import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { LecturerNotification } from '@stackedu/shared'
import {
  Bell, FileText, GraduationCap, AlertTriangle, ChevronRight, CalendarDays,
} from 'lucide-react'
import { LecturerShell } from '@/components/LecturerShell'
import { PagedList } from '@/components/ListPagination'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { apiErrorMessage } from '@/lib/api/client'
import {
  lecturerNotificationsQueryKey,
  lecturerProfileQueryKey,
  listLecturerNotifications,
  markAllLecturerNotificationsRead,
  markLecturerNotificationRead,
} from '@/lib/api/lecturer'

export const Route = createFileRoute('/_auth/lecturer/notifications')({
  component: LecturerNotificationsPage,
})

const TYPE_CONFIG: Record<string, { icon: React.ElementType; iconBg: string; iconColor: string }> = {
  Results: { icon: GraduationCap, iconBg: 'var(--success-bg)', iconColor: 'var(--success)' },
  Assignments: { icon: FileText, iconBg: 'var(--info-bg)', iconColor: 'var(--info)' },
  'At-Risk': { icon: AlertTriangle, iconBg: 'var(--error-bg)', iconColor: 'var(--error)' },
  Registration: { icon: FileText, iconBg: 'var(--info-bg)', iconColor: 'var(--info)' },
  Calendar: { icon: CalendarDays, iconBg: 'var(--info-bg)', iconColor: 'var(--info)' },
  Timetable: { icon: CalendarDays, iconBg: 'var(--warning-bg)', iconColor: 'var(--warning)' },
  System: { icon: Bell, iconBg: 'var(--muted)', iconColor: 'var(--muted-foreground)' },
}

function LecturerNotificationsPage() {
  const queryClient = useQueryClient()
  const { data = [], isPending, error } = useQuery({
    queryKey: lecturerNotificationsQueryKey,
    queryFn: listLecturerNotifications,
  })
  const [tab, setTab] = useState('all')
  const [active, setActive] = useState<LecturerNotification | null>(null)

  const markRead = useMutation({
    mutationFn: markLecturerNotificationRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: lecturerNotificationsQueryKey })
      await queryClient.invalidateQueries({ queryKey: lecturerProfileQueryKey })
    },
  })
  const markAll = useMutation({
    mutationFn: markAllLecturerNotificationsRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: lecturerNotificationsQueryKey })
      await queryClient.invalidateQueries({ queryKey: lecturerProfileQueryKey })
    },
  })

  const filtered = data.filter((n) => {
    if (tab === 'all') return true
    if (tab === 'unread') return !n.read
    return n.type === tab
  })

  const openNotif = (n: LecturerNotification) => {
    setActive(n)
    if (!n.read) markRead.mutate(n.id)
  }

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  return (
    <LecturerShell pageTitle="Notifications">
      <div className="animate-fade-up px-4 sm:px-8 py-8 pb-14" style={{ maxWidth: 820, margin: '0 auto' }}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Notifications</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>{data.filter((n) => !n.read).length} unread</p>
          </div>
          <Button variant="outline" onClick={() => markAll.mutate()} disabled={markAll.isPending}>Mark all read</Button>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-5 flex-wrap h-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="Results">Results</TabsTrigger>
            <TabsTrigger value="Assignments">Assignments</TabsTrigger>
            <TabsTrigger value="At-Risk">At-Risk</TabsTrigger>
            <TabsTrigger value="System">System</TabsTrigger>
          </TabsList>
        </Tabs>

        {isPending ? <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading…</p> : null}
        {error ? <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load notifications.')}</p> : null}

        <div>
          <PagedList
            items={filtered}
            getKey={(n) => n.id}
            defaultPageSize={10}
            resetKey={tab}
            itemLabel="notifications"
            gap={8}
            empty={!isPending ? <p className="t-body text-center py-12" style={{ color: 'var(--muted-foreground)' }}>No notifications yet.</p> : null}
            renderItem={(n) => {
              const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.System
              const Icon = cfg.icon
              return (
                <button
                  type="button"
                  onClick={() => openNotif(n)}
                  className="flex items-start gap-3 text-left w-full"
                  style={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '14px 16px',
                    opacity: n.read ? 0.7 : 1,
                    cursor: 'pointer',
                  }}
                >
                  <div className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 36, height: 36, backgroundColor: cfg.iconBg }}>
                    <Icon style={{ width: 16, height: 16, color: cfg.iconColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{n.title}</p>
                    <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{n.body}</p>
                    <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>{n.time}</p>
                  </div>
                  <ChevronRight style={{ width: 14, height: 14, color: 'var(--muted-foreground)', marginTop: 4 }} />
                </button>
              )
            }}
          />
        </div>
      </div>

      {isMobile ? (
        <Sheet open={active !== null} onOpenChange={(open) => { if (!open) setActive(null) }}>
          <SheetContent side="right" className="p-0 overflow-y-auto sheet-md">
            {active ? <NotifBody n={active} /> : null}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={active !== null} onOpenChange={(open) => { if (!open) setActive(null) }}>
          <DialogContent>
            <DialogTitle className="sr-only">{active?.title}</DialogTitle>
            {active ? <NotifBody n={active} /> : null}
          </DialogContent>
        </Dialog>
      )}
    </LecturerShell>
  )
}

function NotifBody({ n }: { n: LecturerNotification }) {
  return (
    <div style={{ padding: 24 }}>
      <p className="t-label mb-2" style={{ color: 'var(--muted-foreground)' }}>{n.type} · {n.time}</p>
      <h3 className="t-h3 mb-3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>{n.title}</h3>
      <p className="t-body" style={{ color: 'var(--foreground)' }}>{n.body}</p>
    </div>
  )
}
