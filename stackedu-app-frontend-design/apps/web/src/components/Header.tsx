import { useState } from 'react'
import { Bell, Menu, Search, LogOut, ChevronDown, User, Settings } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Link, useRouterState } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────────────────────

interface HeaderProps {
  pageTitle: string
  userName: string
  userRole: string
  userInitials: string
  unreadCount?: number
  onMenuClick?: () => void
  onLogout?: () => void
}

// ─────────────────────────────────────────────────────────────────────────────

export function Header({
  pageTitle,
  userName,
  userRole,
  userInitials,
  unreadCount = 0,
  onMenuClick,
  onLogout,
}: HeaderProps) {
  const [searchValue, setSearchValue] = useState('')
  const currentPath = useRouterState({ select: (s) => s.location.pathname })
  const roleSegment = currentPath.split('/').filter(Boolean)[0] || 'student'
  // /ict/settings is already System Settings — personal account settings live at a different path
  const settingsPath = roleSegment === 'ict' ? '/ict/account-settings' : `/${roleSegment}/settings`

  return (
    <header
      className="flex items-center gap-4 px-6 flex-shrink-0 z-20"
      style={{
        height: 'var(--header-height)',
        backgroundColor: 'var(--card)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* ── Left — hamburger (mobile) + page title ─────────────────────────── */}
      <div className="flex items-center gap-3 min-w-0" style={{ alignSelf: 'center' }}>
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="lg:hidden flex-shrink-0 p-1.5 rounded-lg transition-colors duration-150"
          style={{ color: 'var(--muted-foreground)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--muted)'
            e.currentTarget.style.color = 'var(--foreground)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = 'var(--muted-foreground)'
          }}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Page title */}
        <h1
          className="t-h3 truncate"
          style={{ color: 'var(--foreground)' }}
        >
          {pageTitle}
        </h1>
      </div>

      {/* ── Right — search + notifications + user ──────────────────────────── */}
      <div className="flex items-center gap-2 ml-auto flex-shrink-0">

        {/* Search input */}
        <div
          className="hidden sm:flex items-center gap-2 rounded-lg px-3 h-9 w-52 transition-all duration-150 focus-within:w-64"
          style={{
            backgroundColor: 'var(--muted)',
            border: '1px solid var(--border)',
            transition: 'border-color 150ms ease-out, box-shadow 150ms ease-out, width 150ms ease-out',
          }}
          onFocusCapture={(e) => {
            e.currentTarget.style.borderColor = 'rgba(32, 244, 78, 0.4)'
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(32, 244, 78, 0.08)'
          }}
          onBlurCapture={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <Search
            className="h-3.5 w-3.5 flex-shrink-0"
            style={{ color: 'var(--muted-foreground)' }}
          />
          <input
            type="text"
            placeholder="Search…"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground min-w-0"
            style={{
              color: 'var(--foreground)',
              fontSize: '0.875rem',
            }}
          />
        </div>

        {/* Notifications bell */}
        <div className="relative">
          <button
            className="flex items-center justify-center h-9 w-9 rounded-lg transition-colors duration-150"
            style={{ color: 'var(--muted-foreground)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--muted)'
              e.currentTarget.style.color = 'var(--foreground)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'var(--muted-foreground)'
            }}
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          >
            <Bell className="h-4.5 w-4.5" />
          </button>
          {unreadCount > 0 && (
            <span
              className={cn(
                'absolute -top-0.5 -right-0.5 flex items-center justify-center',
                'min-w-[16px] h-4 rounded-full px-1',
                'text-[10px] font-bold leading-none'
              )}
              style={{
                backgroundColor: 'var(--error)',
                color: '#fff',
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>

        {/* User avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors duration-150 outline-none"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--muted)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              {/* Avatar circle */}
              <div
                className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold"
                style={{
                  backgroundColor: 'var(--ink)',
                  color: 'var(--brand)',
                }}
              >
                {userInitials}
              </div>
              {/* Name + role — hidden on small screens */}
              <div className="hidden md:flex flex-col items-start leading-none">
                <span
                  className="text-sm font-medium"
                  style={{ color: 'var(--foreground)' }}
                >
                  {userName}
                </span>
                <span
                  className="text-[11px] mt-0.5"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {userRole}
                </span>
              </div>
              <ChevronDown
                className="h-3.5 w-3.5"
                style={{ color: 'var(--muted-foreground)' }}
              />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                  {userName}
                </span>
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {userRole}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="gap-2 cursor-pointer">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Link to={`/${roleSegment}/profile` as any}>
                <User className="h-4 w-4" />
                View Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="gap-2 cursor-pointer">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Link to={settingsPath as any}>
                <Settings className="h-4 w-4" />
                Account Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onLogout}
              className="gap-2 cursor-pointer"
              style={{ color: 'var(--error)' }}
            >
              <LogOut className="h-4 w-4" style={{ color: 'var(--error)' }} />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header>
  )
}
