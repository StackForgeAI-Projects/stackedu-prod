import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Bell, FileText, BarChart2, BookOpen, AlertTriangle, Settings, X } from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { AppShell } from '@/components/AppShell'
import { ACADEMIC_ADMIN, ACADEMIC_NAV, ACADEMIC_NOTIFS, type AcademicNotif, type NotifType } from '@/data/academic'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/academic/notifications')({
  component: AcademicNotificationsPage,
})

// ─────────────────────────────────────────────────────────────────────────────

type Tab = 'All' | NotifType

const TABS: { label: string; value: Tab }[] = [
  { label: 'All',          value: 'All'          },
  { label: 'Unread',       value: 'All'          }, // handled by filter
  { label: 'Applications', value: 'Applications' },
  { label: 'Results',      value: 'Results'      },
  { label: 'Registration', value: 'Registration' },
  { label: 'At-Risk',      value: 'At-Risk'      },
  { label: 'System',       value: 'System'       },
]

const TYPE_TABS: { label: string; value: 'all' | 'unread' | NotifType }[] = [
  { label: 'All',          value: 'all'          },
  { label: 'Unread',       value: 'unread'       },
  { label: 'Applications', value: 'Applications' },
  { label: 'Results',      value: 'Results'      },
  { label: 'Registration', value: 'Registration' },
  { label: 'At-Risk',      value: 'At-Risk'      },
  { label: 'System',       value: 'System'       },
]

function typeIcon(type: NotifType) {
  switch (type) {
    case 'Applications':  return FileText
    case 'Results':       return BarChart2
    case 'Registration':  return BookOpen
    case 'At-Risk':       return AlertTriangle
    case 'System':        return Settings
  }
}

function typeColors(type: NotifType) {
  switch (type) {
    case 'Applications':  return { bg: 'var(--info-bg)',    color: 'var(--info)'    }
    case 'Results':       return { bg: 'rgba(32,244,78,0.10)', color: '#16A34A'     }
    case 'Registration':  return { bg: 'var(--info-bg)',    color: 'var(--info)'    }
    case 'At-Risk':       return { bg: 'var(--error-bg)',   color: 'var(--error)'   }
    case 'System':        return { bg: 'var(--muted)',      color: 'var(--muted-foreground)' }
  }
}

function useIsMobile() { return typeof window !== 'undefined' && window.innerWidth < 768 }

// ─────────────────────────────────────────────────────────────────────────────

function AcademicNotificationsPage() {
  const isMobile = useIsMobile()
  const [notifs, setNotifs]         = useState(ACADEMIC_NOTIFS)
  const [activeTab, setActiveTab]   = useState<'all' | 'unread' | NotifType>('all')
  const [selectedNotif, setSelectedNotif] = useState<AcademicNotif | null>(null)
  const [sheetOpen, setSheetOpen]   = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const unreadCount = notifs.filter((n) => !n.read).length

  const filtered = notifs.filter((n) => {
    if (activeTab === 'all')    return true
    if (activeTab === 'unread') return !n.read
    return n.type === activeTab
  })

  const countFor = (v: typeof activeTab) => {
    if (v === 'all')    return notifs.length
    if (v === 'unread') return notifs.filter((n) => !n.read).length
    return notifs.filter((n) => n.type === v).length
  }

  const openNotif = (n: AcademicNotif) => {
    setSelectedNotif(n)
    setNotifs((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x))
    if (isMobile) setDialogOpen(true)
    else          setSheetOpen(true)
  }

  return (
    <AppShell
      navItems={ACADEMIC_NAV}
      pageTitle="Notifications"
      userName={ACADEMIC_ADMIN.fullName}
      userRole={ACADEMIC_ADMIN.role}
      userInitials={ACADEMIC_ADMIN.initials}
      unreadCount={unreadCount}
      infoCardLabel="ACADEMIC ADMIN"
      infoCardValue={ACADEMIC_ADMIN.institution}
      infoCardSubtext={ACADEMIC_ADMIN.office}
    >
      <div className="animate-fade-up" style={{ padding: '32px 32px 48px' }}>

        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Notifications</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>{unreadCount} unread</p>
          </div>
          <button onClick={() => setNotifs((prev) => prev.map((n) => ({ ...n, read: true })))}
            className="text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-150"
            style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card)' }}
          >
            Mark all as read
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 flex-wrap">
          {TYPE_TABS.map((tab) => {
            const isActive = activeTab === tab.value
            const cnt      = countFor(tab.value)
            return (
              <button key={tab.label} onClick={() => setActiveTab(tab.value)}
                className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm font-medium transition-colors duration-150"
                style={{ backgroundColor: isActive ? 'var(--foreground)' : 'transparent', color: isActive ? 'var(--ink-foreground)' : 'var(--muted-foreground)', border: isActive ? '1px solid var(--foreground)' : '1px solid var(--border)', cursor: 'pointer' }}
              >
                {tab.label}
                <span className="t-label px-1.5 py-0.5 rounded-full" style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : 'var(--muted)', color: isActive ? '#fff' : 'var(--muted-foreground)', fontSize: 10 }}>
                  {cnt}
                </span>
              </button>
            )
          })}
        </div>

        {/* Notifications list */}
        <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <Bell style={{ width: 32, height: 32, color: 'var(--muted-foreground)', margin: '0 auto 12px' }} />
              <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>No notifications in this category</p>
            </div>
          ) : filtered.map((n, i) => {
            const Icon = typeIcon(n.type)
            const tc   = typeColors(n.type)
            return (
              <button key={n.id} onClick={() => openNotif(n)} className="w-full text-left flex items-start gap-4 transition-colors duration-150"
                style={{ padding: '16px 20px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', backgroundColor: !n.read ? 'rgba(32,244,78,0.03)' : 'transparent', border: 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = !n.read ? 'rgba(32,244,78,0.03)' : 'transparent' }}
              >
                {/* Icon */}
                <div className="flex items-center justify-center rounded-xl flex-shrink-0" style={{ width: 36, height: 36, backgroundColor: tc.bg }}>
                  <Icon style={{ width: 15, height: 15, color: tc.color }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{n.title}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="t-caption" style={{ color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{n.time}</span>
                      {!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--brand)', flexShrink: 0, display: 'inline-block' }} />}
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
          })}
        </div>

      </div>

      {/* Desktop: Sheet */}
      <Sheet open={sheetOpen && !isMobile} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="p-0 overflow-y-auto" style={{ width: 'min(860px, 55vw)', maxWidth: '100vw' }}>
          {selectedNotif && (
            <>
              <SheetHeader className="px-8 py-6" style={{ borderBottom: '1px solid var(--border)' }}>
                <SheetTitle style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>{selectedNotif.title}</SheetTitle>
              </SheetHeader>
              <div className="px-8 py-6">
                <div className="flex items-center gap-3 mb-4">
                  {(() => { const tc = typeColors(selectedNotif.type); const Icon = typeIcon(selectedNotif.type); return (
                    <>
                      <span className="t-label px-2 py-0.5" style={{ backgroundColor: tc.bg, color: tc.color, borderRadius: 'var(--radius-sm)' }}>{selectedNotif.type}</span>
                      {selectedNotif.urgent && <span className="t-label px-2 py-0.5" style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-sm)' }}>Urgent</span>}
                    </>
                  ) })()}
                  <span className="t-caption ml-auto" style={{ color: 'var(--muted-foreground)' }}>{selectedNotif.time}</span>
                </div>
                <p className="t-body-lg" style={{ color: 'var(--foreground)', lineHeight: 1.7 }}>{selectedNotif.body}</p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Mobile: Dialog */}
      <Dialog open={dialogOpen && isMobile} onOpenChange={setDialogOpen}>
        <DialogContent>
          {selectedNotif && (
            <>
              <DialogHeader>
                <DialogTitle style={{ fontFamily: 'var(--font-display)' }}>{selectedNotif.title}</DialogTitle>
              </DialogHeader>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)', lineHeight: 1.6 }}>{selectedNotif.body}</p>
              <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{selectedNotif.time}</p>
            </>
          )}
        </DialogContent>
      </Dialog>

    </AppShell>
  )
}
