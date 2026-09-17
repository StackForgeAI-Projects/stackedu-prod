import { useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { LogOut, PanelLeftClose, PanelLeftOpen, type LucideIcon } from 'lucide-react'
import { BrandMark } from './BrandMark'

// ─────────────────────────────────────────────────────────────────────────────

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
}

export interface SidebarProps {
  navItems: NavItem[]
  /** Optional identity chip — shown above logout when expanded */
  infoCardLabel?: string
  infoCardValue?: string
  infoCardSubtext?: string
  /** Controlled collapse state — owned by AppShell */
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  onLogout?: () => void
}

// ─────────────────────────────────────────────────────────────────────────────

export function Sidebar({
  navItems,
  infoCardLabel,
  infoCardValue,
  infoCardSubtext,
  isCollapsed = false,
  onToggleCollapse,
  onLogout,
}: SidebarProps) {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  /** Index routes (end with /) — exact match only. All others — exact or sub-route. */
  const isNavActive = (to: string) => {
    if (to.endsWith('/')) return currentPath === to
    return currentPath === to || currentPath.startsWith(to + '/')
  }

  return (
    <aside
      className="flex flex-col h-full w-full overflow-hidden select-none"
      style={{ backgroundColor: 'var(--ink)', borderRight: '1px solid var(--ink-border)' }}
    >

      {/* ── Logo area ──────────────────────────────────────────────────────── */}
      <div
        className="flex items-center flex-shrink-0"
        style={{
          height: 'var(--header-height)',
          borderBottom: '1px solid var(--ink-border)',
          padding: isCollapsed ? '0 12px' : '0 16px 0 20px',
          justifyContent: isCollapsed ? 'center' : 'space-between',
        }}
      >
        {!isCollapsed && (
          // Signed in, so the mark returns to this role's dashboard, which is
          // always the first item in its navigation.
          <BrandMark
            to={navItems[0]?.to ?? '/'}
            ariaLabel="Go to dashboard"
            className="min-w-0 flex-1"
          />
        )}

        {/* Collapse toggle */}
        <CollapseToggle isCollapsed={isCollapsed} onToggle={onToggleCollapse} />
      </div>

      {/* ── Nav links ──────────────────────────────────────────────────────── */}
      <nav className="sidebar-nav-scroll flex-1 overflow-y-auto py-4" style={{ padding: isCollapsed ? '16px 8px' : '16px 12px' }}>
        <ul className="flex flex-col" style={{ gap: 4 }}>
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                icon={item.icon}
                label={item.label}
                active={isNavActive(item.to)}
                isCollapsed={isCollapsed}
              />
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Bottom: info card + logout ─────────────────────────────────────── */}
      <div
        className="flex-shrink-0"
        style={{
          borderTop: '1px solid var(--ink-border)',
          padding: isCollapsed ? '12px 8px' : '12px',
        }}
      >
        {/* Info card — expanded only */}
        {!isCollapsed && infoCardLabel && infoCardValue && infoCardSubtext && (
          <div
            className="mb-2 px-4 py-3"
            style={{ backgroundColor: 'var(--ink-surface)', borderRadius: 'var(--radius-md)' }}
          >
            <p className="t-label mb-1" style={{ color: 'var(--ink-muted)' }}>
              {infoCardLabel}
            </p>
            <p
              className="font-semibold"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: '#FFFFFF', lineHeight: 1.4 }}
            >
              {infoCardValue}
            </p>
            <p className="t-caption mt-0.5" style={{ color: 'var(--brand)' }}>
              {infoCardSubtext}
            </p>
          </div>
        )}

        <LogoutRow onLogout={onLogout} isCollapsed={isCollapsed} />
      </div>

      {/* ── Branding footer — expanded only ───────────────────────────────── */}
      {!isCollapsed && (
        <div
          className="flex-shrink-0 py-2.5"
          style={{ borderTop: '1px solid var(--ink-border)', textAlign: 'center' }}
        >
          <span style={{ fontSize: 11, color: 'var(--ink-muted)', lineHeight: 1.4 }}>
            StackEDU by StackForgeAI
          </span>
        </div>
      )}

    </aside>
  )
}

// ── Collapse toggle button ────────────────────────────────────────────────────

function CollapseToggle({
  isCollapsed,
  onToggle,
}: {
  isCollapsed: boolean
  onToggle?: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const Icon = isCollapsed ? PanelLeftOpen : PanelLeftClose

  return (
    <button
      onClick={onToggle}
      className="flex items-center justify-center rounded-lg flex-shrink-0"
      style={{
        width: 28,
        height: 28,
        color: hovered ? '#FFFFFF' : 'var(--ink-muted)',
        backgroundColor: hovered ? 'rgba(255,255,255,0.06)' : 'transparent',
        border: 'none',
        transition: 'color 150ms ease-out, background-color 150ms ease-out',
        cursor: 'pointer',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      <Icon style={{ width: 15, height: 15 }} />
    </button>
  )
}

// ── NavLink pill ──────────────────────────────────────────────────────────────

function NavLink({
  to,
  icon: Icon,
  label,
  active,
  isCollapsed,
}: {
  to: string
  icon: LucideIcon
  label: string
  active: boolean
  isCollapsed: boolean
}) {
  const [hovered, setHovered] = useState(false)

  const bg = active
    ? 'rgba(var(--brand-rgb), 0.15)'
    : hovered ? 'rgba(255, 255, 255, 0.06)' : 'transparent'

  const border = active
    ? '1px solid rgba(var(--brand-rgb), 0.25)'
    : '1px solid transparent'

  const iconColor = active ? 'var(--brand)' : hovered ? '#FFFFFF' : 'var(--ink-muted)'
  const labelColor = active ? 'var(--brand)' : hovered ? '#FFFFFF' : 'rgba(248, 250, 252, 0.8)'

  return (
    <Link
      to={to}
      className="flex items-center w-full outline-none"
      style={{
        padding: isCollapsed ? '10px 0' : '10px 14px',
        justifyContent: isCollapsed ? 'center' : 'flex-start',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: bg,
        border,
        transition: 'background-color 150ms ease-out, border-color 150ms ease-out',
        textDecoration: 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={isCollapsed ? label : undefined}
    >
      <Icon
        style={{
          width: 18,
          height: 18,
          flexShrink: 0,
          marginRight: isCollapsed ? 0 : 12,
          color: iconColor,
          transition: 'color 150ms ease-out',
        }}
      />
      {!isCollapsed && (
        <span
          style={{
            fontSize: '0.875rem',
            fontWeight: active ? 600 : 400,
            color: labelColor,
            transition: 'color 150ms ease-out',
            lineHeight: 1.4,
          }}
        >
          {label}
        </span>
      )}
    </Link>
  )
}

// ── Logout row ────────────────────────────────────────────────────────────────

function LogoutRow({ onLogout, isCollapsed }: { onLogout?: () => void; isCollapsed: boolean }) {
  const [hovered, setHovered] = useState(false)
  const color = hovered ? '#FFFFFF' : 'var(--ink-muted)'

  return (
    <button
      onClick={onLogout}
      className="flex items-center w-full outline-none"
      style={{
        padding: isCollapsed ? '10px 0' : '10px 14px',
        justifyContent: isCollapsed ? 'center' : 'flex-start',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid transparent',
        backgroundColor: hovered ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
        transition: 'background-color 150ms ease-out',
        cursor: 'pointer',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Sign out"
      title={isCollapsed ? 'Log out' : undefined}
    >
      <LogOut
        style={{
          width: 18,
          height: 18,
          flexShrink: 0,
          marginRight: isCollapsed ? 0 : 12,
          color,
          transition: 'color 150ms ease-out',
        }}
      />
      {!isCollapsed && (
        <span style={{ fontSize: '0.875rem', fontWeight: 400, color, transition: 'color 150ms ease-out', lineHeight: 1.4 }}>
          Log out
        </span>
      )}
    </button>
  )
}
