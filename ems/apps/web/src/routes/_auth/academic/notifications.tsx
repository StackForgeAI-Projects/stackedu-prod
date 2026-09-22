import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import type { AcademicNotification } from '@stackedu/shared'
import { Bell, FileText, BarChart2, BookOpen, AlertTriangle, Settings } from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { AcademicShell } from '@/components/AcademicShell'
import { PagedList } from '@/components/ListPagination'
import {
  academicNotificationsQueryKey,
  listAcademicNotifications,
  markAcademicNotificationRead,
} from '@/lib/api/academic'
import {
  applyAllNotificationsReadLocally,
  applyNotificationReadLocally,
  invalidateNotificationReadCaches,
} from '@/lib/notification-read-sync'
import { apiErrorMessage } from '@/lib/api/client'

export const Route = createFileRoute('/_auth/academic/notifications')({
  component: AcademicNotificationsPage,
})

type TabFilter = 'all' | 'unread' | string

const TYPE_TABS: { label: string; value: TabFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Unread', value: 'unread' },
  { label: 'Applications', value: 'Applications' },
  { label: 'Results', value: 'Results' },
  { label: 'Registration', value: 'Registration' },
  { label: 'At-Risk', value: 'At-Risk' },
  { label: 'System', value: 'System' },
]

function typeIcon(type: string) {
  switch (type) {
    case 'Applications': return FileText
    case 'Results': return BarChart2
    case 'Registration': return BookOpen
    case 'At-Risk': return AlertTriangle
    default: return Settings
  }
}

function typeColors(type: string) {
  switch (type) {
    case 'Applications': return { bg: 'var(--info-bg)', color: 'var(--info)' }
    case 'Results': return { bg: 'rgba(var(--brand-rgb),0.10)', color: '#16A34A' }
    case 'Registration': return { bg: 'var(--info-bg)', color: 'var(--info)' }
    case 'At-Risk': return { bg: 'var(--error-bg)', color: 'var(--error)' }
    default: return { bg: 'var(--muted)', color: 'var(--muted-foreground)' }
  }
}

function useIsMobile() {
  return typeof window !== 'undefined' && window.innerWidth < 768
}

function AcademicNotificationsPage() {
  const queryClient = useQueryClient()
  const isMobile = useIsMobile()
  const { data, isPending, error } = useQuery({
    queryKey: academicNotificationsQueryKey,
    queryFn: listAcademicNotifications,
  })

  const notifs = data ?? []
  const [activeTab, setActiveTab] = useState<TabFilter>('all')
  const [selectedNotif, setSelectedNotif] = useState<AcademicNotification | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const markRead = useMutation({
    mutationFn: markAcademicNotificationRead,
    onMutate: (id) => {
      applyNotificationReadLocally(queryClient, id)
    },
    onError: () => {
      void invalidateNotificationReadCaches(queryClient)
    },
  })

  const unreadCount = notifs.filter((n) => !n.read).length

  const filtered = useMemo(() => notifs.filter((n) => {
    if (activeTab === 'all') return true
    if (activeTab === 'unread') return !n.read
    return n.type === activeTab
  }), [notifs, activeTab])

  const countFor = (v: TabFilter) => {
    if (v === 'all') return notifs.length
    if (v === 'unread') return unreadCount
    return notifs.filter((n) => n.type === v).length
  }

  const openNotif = (n: AcademicNotification) => {
    setSelectedNotif(n)
    if (!n.read) markRead.mutate(n.id)
    if (isMobile) setDialogOpen(true)
    else setSheetOpen(true)
  }

  const markAllRead = async () => {
    const unread = notifs.filter((n) => !n.read)
    applyAllNotificationsReadLocally(queryClient)
    const results = await Promise.allSettled(unread.map((n) => markAcademicNotificationRead(n.id)))
    if (results.some((result) => result.status === 'rejected')) {
      await invalidateNotificationReadCaches(queryClient)
    }
  }

  return (
    <AcademicShell pageTitle="Notifications">
      <div className="page-body animate-fade-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Notifications</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>{unreadCount} unread</p>
          </div>
          <button type="button" onClick={() => { void markAllRead() }} disabled={unreadCount === 0}
            className="text-sm font-medium px-4 py-2 rounded-lg" style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: unreadCount ? 'pointer' : 'not-allowed', opacity: unreadCount ? 1 : 0.5 }}>
            Mark all as read
          </button>
        </div>

        {error ? (
          <p className="t-body mb-4" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load notifications.')}</p>
        ) : null}

        <div className="flex gap-1 mb-6 flex-wrap">
          {TYPE_TABS.map((tab) => {
            const isActive = activeTab === tab.value
            return (
              <button key={tab.label} type="button" onClick={() => setActiveTab(tab.value)}
                className={`filter-tab ${isActive ? 'filter-tab--active' : ''}`}>
                {tab.label}
                <span className="t-label filter-tab__badge">{countFor(tab.value)}</span>
              </button>
            )
          })}
        </div>

        <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
          {isPending ? (
            <p className="t-body text-center py-16" style={{ color: 'var(--muted-foreground)' }}>Loading notifications…</p>
          ) : (
            <PagedList
              items={filtered}
              getKey={(n) => n.id}
              defaultPageSize={10}
              resetKey={String(activeTab)}
              itemLabel="notifications"
              gap={0}
              empty={
                <div className="text-center py-16">
                  <Bell style={{ width: 32, height: 32, color: 'var(--muted-foreground)', margin: '0 auto 12px' }} />
                  <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>No notifications in this category</p>
                </div>
              }
              renderItem={(n, i) => {
                const Icon = typeIcon(n.type)
                const tc = typeColors(n.type)
                return (
                  <button type="button" onClick={() => openNotif(n)} className="w-full text-left flex items-start gap-4"
                    style={{ padding: '16px 20px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', backgroundColor: !n.read ? 'rgba(var(--brand-rgb),0.03)' : 'transparent', border: 'none', cursor: 'pointer' }}>
                    <div className="flex items-center justify-center rounded-xl flex-shrink-0" style={{ width: 36, height: 36, backgroundColor: tc.bg }}>
                      <Icon style={{ width: 15, height: 15, color: tc.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-sm font-semibold">{n.title}</p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="t-caption" style={{ whiteSpace: 'nowrap' }}>{n.time}</span>
                          {!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--brand)', display: 'inline-block' }} />}
                        </div>
                      </div>
                      <p className="t-body-sm mt-1 line-clamp-2" style={{ color: 'var(--muted-foreground)' }}>{n.body}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="t-label px-1.5 py-0.5" style={{ backgroundColor: tc.bg, color: tc.color, borderRadius: 'var(--radius-sm)', fontSize: 10 }}>{n.type}</span>
                        {n.urgent && <span className="t-label px-1.5 py-0.5" style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-sm)', fontSize: 10 }}>Urgent</span>}
                      </div>
                    </div>
                  </button>
                )
              }}
            />
          )}
        </div>
      </div>

      <Sheet open={sheetOpen && !isMobile} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="p-0 overflow-y-auto sheet-lg">
          {selectedNotif && (
            <>
              <SheetHeader className="px-8 py-6" style={{ borderBottom: '1px solid var(--border)' }}>
                <SheetTitle style={{ fontFamily: 'var(--font-display)' }}>{selectedNotif.title}</SheetTitle>
              </SheetHeader>
              <div className="px-8 py-6">
                <p className="t-body-lg" style={{ lineHeight: 1.7 }}>{selectedNotif.body}</p>
                <p className="t-caption mt-4" style={{ color: 'var(--muted-foreground)' }}>{selectedNotif.time}</p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={dialogOpen && isMobile} onOpenChange={setDialogOpen}>
        <DialogContent>
          {selectedNotif && (
            <>
              <DialogHeader><DialogTitle>{selectedNotif.title}</DialogTitle></DialogHeader>
              <p className="text-sm" style={{ lineHeight: 1.6 }}>{selectedNotif.body}</p>
              <p className="t-caption">{selectedNotif.time}</p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AcademicShell>
  )
}
