import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, BookOpen, BarChart2, CreditCard, Library, Bell,
  GraduationCap, BookMarked, BellRing, ChevronRight,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/student/notifications')({
  component: NotificationsPage,
})

// ── Nav ───────────────────────────────────────────────────────────────────────

const STUDENT_NAV = [
  { label: 'Dashboard',     to: '/student/dashboard',     icon: LayoutDashboard },
  { label: 'My Courses',    to: '/student/courses',       icon: BookOpen        },
  { label: 'Results',       to: '/student/results',       icon: BarChart2       },
  { label: 'Fees',          to: '/student/fees',          icon: CreditCard      },
  { label: 'E-Library',     to: '/student/library',       icon: Library         },
  { label: 'Notifications', to: '/student/notifications', icon: Bell            },
]

// ── Types ─────────────────────────────────────────────────────────────────────

type NotifType = 'result' | 'fee' | 'registration' | 'system'

interface Notification {
  id:           number
  type:         NotifType
  title:        string
  body:         string
  detailedBody: string
  action?:      string
  timestamp:    string
  read:         boolean
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const INITIAL_NOTIFS: Notification[] = [
  {
    id: 1,
    type: 'result',
    title: 'Assignment 1 grades published',
    body: 'Your grade for CSC 101 Assignment 1 — Number Conversion has been published. You scored 18/20.',
    detailedBody: 'Your grade for CSC 101 Assignment 1 — Number Conversion has been published by Dr. Emmanuel Nkurunziza. You scored 18 out of 20 (90%), which is above the class average of 74%. Your lecturer has left personalised feedback on your submission highlighting areas of strength and suggestions for improvement. Visit the Results section to view your full graded submission and written feedback.',
    action: 'View Results',
    timestamp: '2 hours ago',
    read: false,
  },
  {
    id: 2,
    type: 'fee',
    title: 'Outstanding fee balance reminder',
    body: 'You have an outstanding fee balance of RWF 45,000 due by 31 January 2025. Please make payment to avoid a hold on your account.',
    detailedBody: 'You have an outstanding fee balance of RWF 45,000 for Semester 1 · 2024/2025, which is due by 31 January 2025. Failure to settle this balance by the deadline may result in a hold being placed on your account, preventing access to your results and next semester\'s course registration. You can pay via MTN MoMo, Airtel Money, debit/credit card, or bank transfer directly within the portal. Visit the Fees section to complete your payment now.',
    action: 'Pay Now',
    timestamp: '5 hours ago',
    read: false,
  },
  {
    id: 3,
    type: 'registration',
    title: 'Course registration is now open',
    body: 'Registration for Semester 2 · 2024/2025 is now open. Registration closes on 28 February 2025. Log in to complete your registration.',
    detailedBody: 'Registration for Semester 2 · 2024/2025 is now open and will close on 28 February 2025 — register before this deadline to secure your place in your chosen courses. You may register for up to 21 credit hours per semester; please review prerequisites for each course before adding it. Any courses added or dropped after the deadline will require written approval from the Academic Registrar. Log in to the Course Registration section to complete your enrolment now.',
    action: 'Register Now',
    timestamp: '1 day ago',
    read: false,
  },
  {
    id: 4,
    type: 'result',
    title: 'Semester 1 results are available',
    body: 'Your Semester 1 results have been published. Your GPA for this semester is 3.60. View your full result sheet in the Results section.',
    detailedBody: 'Your Semester 1 · 2024/2025 results have been officially reviewed and published by the Academic Registrar. Your GPA for this semester is 3.60, placing you in Good Academic Standing. Results for all five enrolled courses — CSC 101, CSC 102, MTH 101, ENG 101, and PHY 101 — are now available in full detail. Visit the Results section to view your complete grade sheet and download your semester statement.',
    action: 'View Results',
    timestamp: '3 days ago',
    read: true,
  },
  {
    id: 5,
    type: 'system',
    title: 'System maintenance scheduled',
    body: 'StackEDU will undergo scheduled maintenance on Saturday 25 January 2025 from 02:00 to 04:00. The portal will be unavailable during this period.',
    detailedBody: 'StackEDU will undergo scheduled maintenance on Saturday 25 January 2025 between 02:00 and 04:00 Central Africa Time (CAT). During this window the student portal, payment gateway, course registration module, and all associated services will be temporarily unavailable. Any in-progress payments or assignment submissions should be completed before 01:50 to avoid data loss. We apologise for any inconvenience and appreciate your patience.',
    timestamp: '4 days ago',
    read: true,
  },
  {
    id: 6,
    type: 'fee',
    title: 'Payment received — RWF 130,000',
    body: 'Your fee payment of RWF 130,000 via Bank Transfer has been received and applied to your account. Transaction ID: TXN-2024-004.',
    detailedBody: 'Your fee payment of RWF 130,000 submitted via Bank Transfer has been successfully verified, received, and applied to your student account for Semester 1 · 2024/2025. Your unique transaction reference is TXN-2024-004 — please retain this for your records. Your updated account balance will be reflected in the Fees section within 24 hours of this confirmation. A downloadable PDF receipt for this transaction is available from your Fee Statement page.',
    action: 'View Statement',
    timestamp: '1 week ago',
    read: true,
  },
  {
    id: 7,
    type: 'registration',
    title: 'Your course registration was approved',
    body: 'Your course registration for Semester 1 has been approved. You are enrolled in 5 courses totalling 15 credit hours.',
    detailedBody: 'Your course registration for Semester 1 · 2024/2025 has been reviewed and officially approved by the Academic Registrar\'s office. You are now enrolled in 5 courses totalling 15 credit hours: CSC 101 — Introduction to Computer Science, CSC 102 — Programming Fundamentals, MTH 101 — Calculus I, ENG 101 — English Communication Skills, and PHY 101 — Physics I. Your personalised class timetable has been generated to reflect your confirmed enrolment. Visit the Timetable section to view your full weekly schedule.',
    action: 'View Timetable',
    timestamp: '3 months ago',
    read: true,
  },
  {
    id: 8,
    type: 'system',
    title: 'Welcome to StackEDU',
    body: 'Your StackEDU student account has been activated. Complete your onboarding checklist to access all features of the platform.',
    detailedBody: 'Your StackEDU student account has been successfully created and activated for the 2024/2025 academic year. Please complete your onboarding checklist to unlock all platform features, including results access, fee payment, course registration, and the e-library. Your student ID is SFE-2024-0042 — use this to identify yourself in all official correspondence with the institution. If you need assistance at any time, contact the Student Support desk via the Help Centre.',
    timestamp: '4 months ago',
    read: true,
  },
]

// ── Icon + colour config ──────────────────────────────────────────────────────

const TYPE_CONFIG: Record<NotifType, {
  icon: React.ElementType
  iconBg: string
  iconColor: string
}> = {
  result:       { icon: GraduationCap, iconBg: 'var(--success-bg)', iconColor: 'var(--success)' },
  fee:          { icon: CreditCard,    iconBg: 'var(--warning-bg)', iconColor: 'var(--warning)' },
  registration: { icon: BookMarked,    iconBg: 'var(--info-bg)',    iconColor: 'var(--info)'    },
  system:       { icon: BellRing,      iconBg: 'var(--muted)',      iconColor: 'var(--muted-foreground)' },
}

// ── Filter tabs ───────────────────────────────────────────────────────────────

const TABS: { value: string; label: string }[] = [
  { value: 'all',          label: 'All'          },
  { value: 'unread',       label: 'Unread'       },
  { value: 'result',       label: 'Results'      },
  { value: 'fee',          label: 'Fees'         },
  { value: 'registration', label: 'Registration' },
  { value: 'system',       label: 'System'       },
]

// ── Responsive hook ───────────────────────────────────────────────────────────

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

function NotificationsPage() {
  const [tab,           setTab]           = useState('all')
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFS)
  const [activeNotif,   setActiveNotif]   = useState<Notification | null>(null)
  const [openedAsUnread, setOpenedAsUnread] = useState(false)
  const isMobile = useIsMobile()

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const markRead = (id: number) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
  }

  const openNotif = (notif: Notification) => {
    setOpenedAsUnread(!notif.read)
    setActiveNotif(notif)
    markRead(notif.id)
  }

  const closeNotif = () => setActiveNotif(null)

  const filtered = notifications.filter((n) => {
    if (tab === 'all')    return true
    if (tab === 'unread') return !n.read
    return n.type === tab
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <AppShell
      navItems={STUDENT_NAV}
      pageTitle="Notifications"
      userName="Jean-Paul Mugisha"
      userRole="Student"
      userInitials="JM"
      unreadCount={unreadCount}
      infoCardLabel="STUDENT ID"
      infoCardValue="SFE-2024-0042"
      infoCardSubtext="Year 1"
    >
      <div className="px-8 py-8 max-w-[860px] mx-auto animate-fade-up">

        {/* Section header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1
              className="t-h1 mb-1"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}
            >
              Notifications
            </h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-sm font-medium transition-opacity hover:opacity-70"
              style={{ color: 'var(--success)' }}
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="mb-6">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              {TABS.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>
                  {t.label}
                  {t.value === 'unread' && unreadCount > 0 && (
                    <span
                      className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold px-1"
                      style={{ backgroundColor: 'var(--error)', color: '#fff' }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Notification list */}
        {filtered.length === 0 ? (
          <EmptyNotificationsState tab={tab} />
        ) : (
          <div
            style={{
              backgroundColor: 'var(--card)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--border)',
              overflow: 'hidden',
            }}
          >
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

      {/* ── Sheet — desktop (≥768px) ────────────────────────────────────────── */}
      <Sheet
        open={!isMobile && activeNotif !== null}
        onOpenChange={(open) => { if (!open) closeNotif() }}
      >
        <SheetContent
          side="right"
          className="p-0 border-l overflow-hidden flex flex-col"
          style={{ width: 'min(860px, 55vw)' }}
        >
          {activeNotif && (
            <NotificationDetailContent
              notif={activeNotif}
              openedAsUnread={openedAsUnread}
              onClose={closeNotif}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* ── Dialog — mobile (<768px) ────────────────────────────────────────── */}
      <Dialog
        open={isMobile && activeNotif !== null}
        onOpenChange={(open) => { if (!open) closeNotif() }}
      >
        <DialogContent
          className="p-0 overflow-hidden"
          style={{ maxWidth: '90vw', width: '90vw' }}
        >
          <DialogTitle className="sr-only">
            {activeNotif?.title ?? 'Notification'}
          </DialogTitle>
          {activeNotif && (
            <NotificationDetailContent
              notif={activeNotif}
              openedAsUnread={openedAsUnread}
              onClose={closeNotif}
            />
          )}
        </DialogContent>
      </Dialog>

    </AppShell>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Notification row
// ─────────────────────────────────────────────────────────────────────────────

function NotificationRow({
  notif, isLast, onOpen,
}: {
  notif: Notification
  isLast: boolean
  onOpen: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const tc = TYPE_CONFIG[notif.type]

  return (
    <div
      className="flex items-start gap-4 px-6 cursor-pointer"
      style={{
        paddingTop: 16,
        paddingBottom: 16,
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        backgroundColor: hovered
          ? 'var(--muted)'
          : !notif.read ? 'rgba(32,244,78,0.025)' : 'transparent',
        transition: 'background-color 150ms ease-out',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onOpen}
    >
      {/* Unread dot */}
      <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 8, marginTop: 8 }}>
        {!notif.read && (
          <div
            style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: 'var(--brand)' }}
          />
        )}
      </div>

      {/* Icon */}
      <div
        className="flex items-center justify-center rounded-xl flex-shrink-0"
        style={{ width: 40, height: 40, backgroundColor: tc.iconBg }}
      >
        <tc.icon style={{ width: 18, height: 18, color: tc.iconColor }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm mb-1"
          style={{
            color: 'var(--foreground)',
            fontWeight: notif.read ? 400 : 600,
            lineHeight: 1.4,
          }}
        >
          {notif.title}
        </p>
        <p
          className="t-body-sm leading-relaxed"
          style={{ color: 'var(--muted-foreground)' }}
        >
          {notif.body}
        </p>
      </div>

      {/* Timestamp + chevron */}
      <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
        <span
          className="t-caption"
          style={{ color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}
        >
          {notif.timestamp}
        </span>
        <ChevronRight
          style={{ width: 14, height: 14, color: 'var(--muted-foreground)', flexShrink: 0 }}
        />
      </div>
    </div>
  )
}

// ── Action → route map ────────────────────────────────────────────────────────

const NOTIF_ACTION_ROUTES = {
  'View Results':   '/student/results',
  'Pay Now':        '/student/payment',
  'Register Now':   '/student/course-registration',
  'View Statement': '/student/fees',
  'View Timetable': '/student/timetable',
} as const

type NotifActionKey = keyof typeof NOTIF_ACTION_ROUTES

// ─────────────────────────────────────────────────────────────────────────────
// Notification detail content — shared by Sheet and Dialog
// ─────────────────────────────────────────────────────────────────────────────

function NotificationDetailContent({
  notif,
  openedAsUnread,
  onClose,
}: {
  notif: Notification
  openedAsUnread: boolean
  onClose: () => void
}) {
  const navigate = useNavigate()
  const tc = TYPE_CONFIG[notif.type]

  return (
    <div className="flex flex-col h-full overflow-y-auto">

      {/* Header — icon + title (shadcn provides X close button top-right) */}
      <div
        style={{
          padding: '20px 56px 18px 24px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        <div className="flex items-start gap-3 mb-2">
          {/* Type icon circle */}
          <div
            className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ width: 40, height: 40, backgroundColor: tc.iconBg }}
          >
            <tc.icon style={{ width: 18, height: 18, color: tc.iconColor }} />
          </div>

          {/* Title */}
          <h3
            className="flex-1 min-w-0"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.0625rem',
              fontWeight: 600,
              color: 'var(--foreground)',
              lineHeight: 1.4,
              paddingTop: 2,
            }}
          >
            {notif.title}
          </h3>
        </div>

        {/* Timestamp */}
        <p
          className="t-caption"
          style={{ color: 'var(--muted-foreground)', paddingLeft: 52 }}
        >
          {notif.timestamp}
        </p>
      </div>

      {/* Divider is the border-bottom above */}

      {/* Body */}
      <div style={{ padding: '20px 24px', flex: 1 }}>
        <p
          style={{
            fontSize: '0.9375rem',
            color: 'var(--foreground)',
            lineHeight: 1.75,
          }}
        >
          {notif.detailedBody}
        </p>
      </div>

      {/* Footer actions */}
      {(notif.action || openedAsUnread) && (
        <div
          style={{
            padding: '0 24px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            flexShrink: 0,
          }}
        >
          {notif.action && (
            <Button
              style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}
              className="w-full"
              onClick={() => {
                const route = NOTIF_ACTION_ROUTES[notif.action as NotifActionKey]
                if (route) { void navigate({ to: route }); onClose() }
              }}
            >
              {notif.action}
            </Button>
          )}
          {openedAsUnread && (
            <Button variant="outline" className="w-full" onClick={onClose}>
              Mark as read
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────

function EmptyNotificationsState({ tab }: { tab: string }) {
  const messages: Record<string, { heading: string; sub: string }> = {
    unread:       { heading: 'All caught up',           sub: 'You have no unread notifications.'               },
    result:       { heading: 'No result notifications', sub: 'Result announcements will appear here.'          },
    fee:          { heading: 'No fee notifications',    sub: 'Fee reminders and payment confirmations appear here.' },
    registration: { heading: 'No registration alerts',  sub: 'Course registration announcements appear here.'  },
    system:       { heading: 'No system messages',      sub: 'Platform announcements and maintenance alerts appear here.' },
    all:          { heading: 'No notifications yet',    sub: "You're all caught up. New notifications will appear here." },
  }
  const msg = messages[tab] ?? messages.all

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className="flex items-center justify-center rounded-2xl mb-4"
        style={{ width: 60, height: 60, backgroundColor: 'var(--muted)' }}
      >
        <Bell style={{ width: 28, height: 28, color: 'var(--muted-foreground)' }} />
      </div>
      <h3 className="t-h3 mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
        {msg.heading}
      </h3>
      <p className="t-body" style={{ color: 'var(--muted-foreground)', maxWidth: 380 }}>
        {msg.sub}
      </p>
    </div>
  )
}
