import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { notifySuccess } from '@/lib/notify'
import { consumeWelcomeName, isDashboardPath } from '@/lib/welcome'
import { performInactivityLogout } from '@/lib/session-logout'
import { logout } from '@/lib/api/auth'
import { queryClient } from '@/lib/query-client'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { PageContent } from '@/components/PageContent'
import { InactivityDialog } from '@/components/InactivityDialog'
import { LogoutDialog, useLogoutDialog } from '@/components/LogoutDialog'
import { useInactivityLogout } from '@/hooks/useInactivityLogout'
import { roleLabel } from '@/lib/auth/portals'
import { initialsFrom } from '@/lib/utils'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useLiveRefresh } from '@/hooks/useLiveRefresh'
import { useNotifications } from '@/hooks/useNotifications'
import { Sidebar, type NavItem } from './Sidebar'
import { Header } from './Header'
import { AppVersion } from './AppVersion'

// ─────────────────────────────────────────────────────────────────────────────

interface AppShellProps {
  navItems: NavItem[]
  pageTitle: string
  userName: string
  userRole: string
  userInitials: string
  unreadCount?: number
  infoCardLabel?: string
  infoCardValue?: string
  infoCardSubtext?: string
  onLogout?: () => void
  children: React.ReactNode
}

// ─────────────────────────────────────────────────────────────────────────────

const SIDEBAR_EXPANDED_WIDTH = 'var(--sidebar-width)'
const SIDEBAR_COLLAPSED_WIDTH = '64px'

export function AppShell({
  navItems,
  pageTitle,
  userName,
  userRole,
  userInitials,
  unreadCount = 0,
  infoCardLabel,
  infoCardValue,
  infoCardSubtext,
  onLogout,
  children,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const { user } = useCurrentUser()
  useNotifications()
  useLiveRefresh()
  const logoutDialog = useLogoutDialog()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  const forcedLogout = useCallback(async () => {
    await logout().catch(() => undefined)
    queryClient.clear()
    await navigate({ to: '/login', replace: true })
  }, [navigate])

  const inactivityLogout = useCallback(() => {
    void performInactivityLogout('/login')
  }, [])

  const inactivity = useInactivityLogout(inactivityLogout)

  useEffect(() => {
    if (!isDashboardPath(pathname)) return
    const name = consumeWelcomeName()
    if (name) notifySuccess(`Welcome back, ${name} 👋`)
  }, [pathname])

  // The signed-in user is the truth about who is looking at the screen. The
  // props remain as the fallback shown while the session is still loading.
  const identity = user
    ? { name: user.fullName, role: roleLabel(user.role), initials: initialsFrom(user.fullName) }
    : { name: userName, role: userRole, initials: userInitials }

  // Signing out is the same everywhere, so it lives here rather than being
  // passed down by each of the screens that use this shell.
  const handleLogout = onLogout ?? logoutDialog.requestLogout

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>

      {/* ── Desktop sidebar — collapsible ────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col flex-shrink-0"
        style={{
          width: sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH,
          transition: 'width 250ms ease-out',
          overflow: 'hidden',
        }}
      >
        <Sidebar
          navItems={navItems}
          infoCardLabel={infoCardLabel}
          infoCardValue={infoCardValue}
          infoCardSubtext={infoCardSubtext}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          onLogout={handleLogout}
        />
      </div>

      {/* ── Mobile sidebar — Sheet drawer (always full-width, no collapse) ── */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="p-0 border-0"
          style={{ width: 'var(--sidebar-width)', backgroundColor: 'var(--ink)' }}
        >
          <Sidebar
            navItems={navItems}
            infoCardLabel={infoCardLabel}
            infoCardValue={infoCardValue}
            infoCardSubtext={infoCardSubtext}
            isCollapsed={false}
            onToggleCollapse={() => setMobileOpen(false)}
            onLogout={() => { setMobileOpen(false); handleLogout() }}
          />
        </SheetContent>
      </Sheet>

      {/* ── Right column — header + scrollable content ───────────────────── */}
      <div className="relative flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          pageTitle={pageTitle}
          userName={identity.name}
          userRole={identity.role}
          userInitials={identity.initials}
          unreadCount={unreadCount}
          onMenuClick={() => setMobileOpen(true)}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-y-auto pb-10" style={{ backgroundColor: 'var(--background)' }}>
          <PageContent>{children}</PageContent>
        </main>
        <AppVersion />
      </div>

      <LogoutDialog open={logoutDialog.open} onOpenChange={logoutDialog.setOpen} />
      <InactivityDialog
        open={inactivity.open}
        secondsLeft={inactivity.secondsLeft}
        onStay={inactivity.staySignedIn}
        onLogout={inactivityLogout}
      />

    </div>
  )
}
