import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, BookOpen, BarChart2, Bell, ClipboardList,
  FileText, TrendingUp, GraduationCap, AlertTriangle, ChevronRight,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import {
  LECTURER, LECTURER_NOTIFS, type LecturerNotif, type LecturerNotifType,
} from '@/data/lecturer'

export const Route = createFileRoute('/_auth/lecturer/notifications')({
  component: LecturerNotificationsPage,
})

const LECTURER_NAV = [
  { label: 'Dashboard',     to: '/lecturer/dashboard',     icon: LayoutDashboard },
  { label: 'My Courses',    to: '/lecturer/courses',       icon: BookOpen        },
  { label: 'Attendance',    to: '/lecturer/attendance',    icon: ClipboardList   },
  { label: 'Results',       to: '/lecturer/results',       icon: BarChart2       },
  { label: 'Assignments',   to: '/lecturer/assignments',   icon: FileText        },
  { label: 'Analytics',     to: '/lecturer/analytics',     icon: TrendingUp      },
  { label: 'Notifications', to: '/lecturer/notifications', icon: Bell            },
]

const TYPE_CONFIG: Record<LecturerNotifType, { icon: React.ElementType; iconBg: string; iconColor: string }> = {
  result:     { icon: GraduationCap, iconBg: 'var(--success-bg)', iconColor: 'var(--success)' },
  assignment: { icon: FileText,      iconBg: 'var(--info-bg)',    iconColor: 'var(--info)'    },
  atrisk:     { icon: AlertTriangle, iconBg: 'var(--error-bg)',   iconColor: 'var(--error)'   },
  system:     { icon: Bell,          iconBg: 'var(--muted)',      iconColor: 'var(--muted-foreground)' },
}

const TABS = [
  { value: 'all',        label: 'All'        },
  { value: 'unread',     label: 'Unread'     },
  { value: 'result',     label: 'Results'    },
  { value: 'assignment', label: 'Assignments'},
  { value: 'atrisk',     label: 'At-Risk'    },
  { value: 'system',     label: 'System'     },
]

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)')
    setIsMobile(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])
  return isMobile
}

// ─────────────────────────────────────────────────────────────────────────────

function LecturerNotificationsPage() {
  const [tab,           setTab]           = useState('all')
  const [notifications, setNotifications] = useState<LecturerNotif[]>(LECTURER_NOTIFS)
  const [activeNotif,   setActiveNotif]   = useState<LecturerNotif | null>(null)
  const [openedAsUnread, setOpenedAsUnread] = useState(false)
  const isMobile = useIsMobile()

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  const markRead    = (id: number) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))

  const openNotif = (notif: LecturerNotif) => {
    setOpenedAsUnread(!notif.read)
    setActiveNotif(notif)
    markRead(notif.id)
  }

  const filtered = notifications.filter(n => {
    if (tab === 'all')    return true
    if (tab === 'unread') return !n.read
    return n.type === tab
  })

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <AppShell
      navItems={LECTURER_NAV}
      pageTitle="Notifications"
      userName={LECTURER.fullName}
      userRole="Lecturer"
      userInitials={LECTURER.initials}
      unreadCount={unreadCount}
      infoCardLabel="LECTURER ID"
      infoCardValue={LECTURER.id}
      infoCardSubtext={LECTURER.department}
    >
      <div className="px-8 py-8 max-w-[860px] mx-auto animate-fade-up">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Notifications</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--success)' }}>
              Mark all as read
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              {TABS.map(t => (
                <TabsTrigger key={t.value} value={t.value}>
                  {t.label}
                  {t.value === 'unread' && unreadCount > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold px-1" style={{ backgroundColor: 'var(--error)', color: '#fff' }}>
                      {unreadCount}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            {filtered.map((notif, i) => (
              <NotificationRow
                key={notif.id}
                notif={notif}
                isLast={i === filtered.length - 1}
                onOpen={() => openNotif(notif)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sheet — desktop */}
      <Sheet open={!isMobile && activeNotif !== null} onOpenChange={open => { if (!open) setActiveNotif(null) }}>
        <SheetContent side="right" className="p-0 border-l overflow-hidden flex flex-col" style={{ width: 'min(720px, 45vw)' }}>
          {activeNotif && (
            <NotifDetailContent notif={activeNotif} openedAsUnread={openedAsUnread} onClose={() => setActiveNotif(null)} />
          )}
        </SheetContent>
      </Sheet>

      {/* Dialog — mobile */}
      <Dialog open={isMobile && activeNotif !== null} onOpenChange={open => { if (!open) setActiveNotif(null) }}>
        <DialogContent className="p-0 overflow-hidden" style={{ maxWidth: '90vw', width: '90vw' }}>
          <DialogTitle className="sr-only">{activeNotif?.title ?? 'Notification'}</DialogTitle>
          {activeNotif && (
            <NotifDetailContent notif={activeNotif} openedAsUnread={openedAsUnread} onClose={() => setActiveNotif(null)} />
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}

// ── Notification row ──────────────────────────────────────────────────────────

function NotificationRow({ notif, isLast, onOpen }: { notif: LecturerNotif; isLast: boolean; onOpen: () => void }) {
  const [hovered, setHovered] = useState(false)
  const tc = TYPE_CONFIG[notif.type]

  return (
    <div
      className="flex items-start gap-4 px-6 cursor-pointer"
      style={{
        paddingTop: 16, paddingBottom: 16,
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        backgroundColor: hovered ? 'var(--muted)' : !notif.read ? 'rgba(32,244,78,0.025)' : 'transparent',
        transition: 'background-color 150ms ease-out',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onOpen}
    >
      <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 8, marginTop: 8 }}>
        {!notif.read && <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: 'var(--brand)' }} />}
      </div>
      <div className="flex items-center justify-center rounded-xl flex-shrink-0" style={{ width: 40, height: 40, backgroundColor: tc.iconBg }}>
        <tc.icon style={{ width: 18, height: 18, color: tc.iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm mb-1" style={{ color: 'var(--foreground)', fontWeight: notif.read ? 400 : 600, lineHeight: 1.4 }}>{notif.title}</p>
        <p className="t-body-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{notif.body}</p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
        <span className="t-caption" style={{ color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{notif.timestamp}</span>
        <ChevronRight style={{ width: 14, height: 14, color: 'var(--muted-foreground)', flexShrink: 0 }} />
      </div>
    </div>
  )
}

// ── Notification detail content ───────────────────────────────────────────────

function NotifDetailContent({ notif, openedAsUnread, onClose }: { notif: LecturerNotif; openedAsUnread: boolean; onClose: () => void }) {
  const tc = TYPE_CONFIG[notif.type]

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div style={{ padding: '20px 56px 18px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div className="flex items-start gap-3 mb-2">
          <div className="flex items-center justify-center rounded-xl flex-shrink-0" style={{ width: 40, height: 40, backgroundColor: tc.iconBg }}>
            <tc.icon style={{ width: 18, height: 18, color: tc.iconColor }} />
          </div>
          <h3 className="flex-1 min-w-0" style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 600, color: 'var(--foreground)', lineHeight: 1.4, paddingTop: 2 }}>
            {notif.title}
          </h3>
        </div>
        <p className="t-caption" style={{ color: 'var(--muted-foreground)', paddingLeft: 52 }}>{notif.timestamp}</p>
      </div>

      <div style={{ padding: '20px 24px', flex: 1 }}>
        <p style={{ fontSize: '0.9375rem', color: 'var(--foreground)', lineHeight: 1.75 }}>{notif.detailedBody}</p>
      </div>

      {(notif.action || openedAsUnread) && (
        <div style={{ padding: '0 24px 28px', display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
          {notif.action && (
            <Button style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }} className="w-full">{notif.action}</Button>
          )}
          {openedAsUnread && (
            <Button variant="outline" className="w-full" onClick={onClose}>Mark as read</Button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: string }) {
  const messages: Record<string, { heading: string; sub: string }> = {
    unread:     { heading: 'All caught up',           sub: 'You have no unread notifications.'              },
    result:     { heading: 'No result alerts',        sub: 'Result submission reminders appear here.'       },
    assignment: { heading: 'No assignment alerts',    sub: 'Assignment submission updates appear here.'     },
    atrisk:     { heading: 'No at-risk alerts',       sub: 'Student at-risk flags will appear here.'       },
    system:     { heading: 'No system messages',      sub: 'Platform announcements appear here.'           },
    all:        { heading: 'No notifications yet',    sub: "New notifications will appear here."           },
  }
  const msg = messages[tab] ?? messages.all

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex items-center justify-center rounded-2xl mb-4" style={{ width: 60, height: 60, backgroundColor: 'var(--muted)' }}>
        <Bell style={{ width: 28, height: 28, color: 'var(--muted-foreground)' }} />
      </div>
      <h3 className="t-h3 mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>{msg.heading}</h3>
      <p className="t-body" style={{ color: 'var(--muted-foreground)', maxWidth: 380 }}>{msg.sub}</p>
    </div>
  )
}
