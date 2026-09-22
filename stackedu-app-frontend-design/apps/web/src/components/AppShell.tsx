import { useState } from 'react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Sidebar, type NavItem } from './Sidebar'
import { Header } from './Header'

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
          onLogout={onLogout}
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
            onLogout={() => { setMobileOpen(false); onLogout?.() }}
          />
        </SheetContent>
      </Sheet>

      {/* ── Right column — header + scrollable content ───────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          pageTitle={pageTitle}
          userName={userName}
          userRole={userRole}
          userInitials={userInitials}
          unreadCount={unreadCount}
          onMenuClick={() => setMobileOpen(true)}
          onLogout={onLogout}
        />
        <main className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--background)' }}>
          {children}
        </main>
      </div>

    </div>
  )
}
