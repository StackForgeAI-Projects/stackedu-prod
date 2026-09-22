import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { ChevronRight, ChevronLeft, ChevronRight as ChevRight } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { toast } from 'sonner'
import { AppShell } from '@/components/AppShell'
import {
  ICT_MANAGER, ICT_NAV, PLATFORM_USERS, roleBadgeColors, userStatusColors,
  type UserRole, type UserStatus,
} from '@/data/ict'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/ict/user')({
  component: UserDetailPage,
  validateSearch: (search: Record<string, unknown>) => ({
    id: String(search.id ?? ''),
  }),
})

// ── Pagination helper ─────────────────────────────────────────────────────────

function PaginationBar({ page, totalPages, perPage, setPage, setPerPage, total }: {
  page: number; totalPages: number; perPage: number; total: number
  setPage: (p: number) => void; setPerPage: (n: number) => void
}) {
  const start = (page - 1) * perPage + 1
  const end   = Math.min(page * perPage, total)
  const btn   = (disabled: boolean) => ({
    width: 30, height: 30, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
    backgroundColor: 'var(--card)', color: disabled ? 'var(--muted-foreground)' : 'var(--foreground)',
    cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    opacity: disabled ? 0.5 : 1,
  } as React.CSSProperties)
  return (
    <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2">
        <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>Show</span>
        <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1) }}
          style={{ fontSize: '0.8125rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '4px 8px', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: 'pointer' }}>
          {[5, 10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>per page</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{start}–{end} of {total}</span>
        <button style={btn(page === 1)} disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft style={{ width: 14, height: 14 }} /></button>
        <button style={btn(page >= totalPages)} disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevRight style={{ width: 14, height: 14 }} /></button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function UserDetailPage() {
  const { id } = Route.useSearch()
  const user   = PLATFORM_USERS.find((u) => u.id === id)

  const [status, setStatus]         = useState<UserStatus>(user?.status ?? 'Active')
  const [suspendOpen, setSuspendOpen]     = useState(false)
  const [reactivateOpen, setReactivateOpen] = useState(false)
  const [deleteOpen, setDeleteOpen]     = useState(false)
  const [resetOpen, setResetOpen]       = useState(false)
  const [suspendReason, setSuspendReason]   = useState('')
  const [deleteReason, setDeleteReason]     = useState('')
  const [roleSheetOpen, setRoleSheetOpen]   = useState(false)
  const [newRole, setNewRole]               = useState<UserRole>(user?.role ?? 'Student')

  const [loginPage, setLoginPage]     = useState(1)
  const [loginPerPage, setLoginPerPage] = useState(5)

  if (!user) {
    return (
      <AppShell navItems={ICT_NAV} pageTitle="User Detail" userName={ICT_MANAGER.fullName} userRole={ICT_MANAGER.role} userInitials={ICT_MANAGER.initials} infoCardLabel="ICT MANAGER" infoCardValue={ICT_MANAGER.institution} infoCardSubtext={ICT_MANAGER.office}>
        <div className="p-8">
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>User not found.</p>
          <Link to="/ict/users" className="text-sm font-medium mt-4 inline-block" style={{ color: 'var(--success)' }}>← Back to User Management</Link>
        </div>
      </AppShell>
    )
  }

  const rc = roleBadgeColors(user.role)
  const sc = userStatusColors(status)

  const totalLoginPages = Math.max(1, Math.ceil(user.loginHistory.length / loginPerPage))
  const paginatedLogins = user.loginHistory.slice((loginPage - 1) * loginPerPage, loginPage * loginPerPage)

  const loginThisMonth = user.loginHistory.filter((l) => l.timestamp.startsWith('2026-06') && l.status === 'Success').length
  const accountAgeDays = Math.floor((new Date().getTime() - new Date(user.createdDate).getTime()) / (1000 * 60 * 60 * 24))

  const handleSuspend = () => { setStatus('Suspended'); setSuspendOpen(false); setSuspendReason(''); toast.success(`Account suspended for ${user.fullName}.`) }
  const handleReactivate = () => { setStatus('Active'); setReactivateOpen(false); toast.success(`Account reactivated for ${user.fullName}.`) }
  const handleDelete = () => { setDeleteOpen(false); setDeleteReason(''); toast.success(`Account permanently deleted.`) }
  const handleReset  = () => { setResetOpen(false); toast.success(`Password reset for ${user.fullName}. Temporary password sent.`) }
  const handleRoleChange = () => { setRoleSheetOpen(false); toast.success(`Role updated to ${newRole} for ${user.fullName}.`) }

  return (
    <AppShell
      navItems={ICT_NAV}
      pageTitle="User Detail"
      userName={ICT_MANAGER.fullName}
      userRole={ICT_MANAGER.role}
      userInitials={ICT_MANAGER.initials}
      unreadCount={3}
      infoCardLabel="ICT MANAGER"
      infoCardValue={ICT_MANAGER.institution}
      infoCardSubtext={ICT_MANAGER.office}
    >
      <div className="animate-fade-up" style={{ padding: '32px 32px 48px' }}>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 mb-6">
          <Link to="/ict/users" className="t-caption font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--success)' }}>User Management</Link>
          <ChevronRight style={{ width: 12, height: 12, color: 'var(--muted-foreground)' }} />
          <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{user.fullName}</span>
        </div>

        {/* Page header */}
        <div className="mb-6">
          <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>{user.fullName}</h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{user.userId}</p>
        </div>

        {/* Two-column layout */}
        <div className="flex gap-6" style={{ alignItems: 'flex-start' }}>

          {/* Main (65%) */}
          <div className="flex flex-col gap-5" style={{ flex: '0 0 65%', minWidth: 0 }}>

            {/* Account Details */}
            <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24 }}>
              <h2 className="t-h3 mb-5" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Account Details</h2>
              <div className="grid grid-cols-2 gap-0">
                {[
                  { label: 'Full Name',    value: user.fullName   },
                  { label: 'Email',        value: user.email      },
                  { label: 'Phone',        value: user.phone      },
                  { label: 'User ID',      value: user.userId, mono: true },
                  { label: 'Created',      value: user.createdDate },
                  { label: 'Last Login',   value: user.lastLogin  },
                  ...(user.programme   ? [{ label: 'Programme',   value: user.programme   }] : []),
                  ...(user.yearOfStudy ? [{ label: 'Year',        value: user.yearOfStudy }] : []),
                  ...(user.department  ? [{ label: 'Department',  value: user.department  }] : []),
                  ...(user.faculty     ? [{ label: 'Faculty',     value: user.faculty     }] : []),
                ].map((row, i, arr) => (
                  <div key={row.label} className="flex flex-col gap-0.5 py-3"
                    style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', paddingRight: 16 }}>
                    <span className="t-label" style={{ color: 'var(--muted-foreground)' }}>{row.label.toUpperCase()}</span>
                    <span style={{ fontFamily: (row as any).mono ? 'var(--font-mono)' : undefined, fontSize: '0.875rem', color: 'var(--foreground)', fontWeight: 500 }}>
                      {row.value}
                    </span>
                  </div>
                ))}
                <div className="flex flex-col gap-0.5 py-3 col-span-2" style={{ borderBottom: '1px solid var(--border)', paddingRight: 16 }}>
                  <span className="t-label mb-1.5" style={{ color: 'var(--muted-foreground)' }}>ROLE</span>
                  <span className="t-label px-2 py-0.5 inline-flex w-fit" style={{ backgroundColor: rc.bg, color: rc.color, borderRadius: 'var(--radius-sm)' }}>{user.role}</span>
                </div>
                <div className="flex flex-col gap-0.5 py-3" style={{ paddingRight: 16 }}>
                  <span className="t-label mb-1.5" style={{ color: 'var(--muted-foreground)' }}>STATUS</span>
                  <span className="t-label px-2 py-0.5 inline-flex w-fit" style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)' }}>{status}</span>
                </div>
              </div>
            </div>

            {/* Activity Summary */}
            <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24 }}>
              <h2 className="t-h3 mb-5" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Activity Summary</h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Logins this month', value: loginThisMonth },
                  { label: 'Total logins recorded', value: user.loginHistory.length },
                  { label: 'Account age (days)', value: accountAgeDays },
                ].map((stat) => (
                  <div key={stat.label} className="flex flex-col gap-1 p-4 rounded-xl" style={{ backgroundColor: 'var(--muted)' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.01em' }}>{stat.value}</span>
                    <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Login History */}
            <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24 }}>
              <h2 className="t-h3 mb-5" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Login History</h2>
              {user.loginHistory.length === 0 ? (
                <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>No login history recorded.</p>
              ) : (
                <>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {['Timestamp', 'IP Address', 'Device', 'Status'].map((h) => (
                            <th key={h} className="t-label text-left" style={{ color: 'var(--muted-foreground)', paddingBottom: 10, borderBottom: '1px solid var(--border)', fontWeight: 600, paddingRight: 16 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedLogins.map((ev, i) => {
                          const esc = ev.status === 'Success'
                            ? { bg: 'var(--success-bg)', color: 'var(--success)' }
                            : { bg: 'var(--error-bg)',   color: 'var(--error)'   }
                          return (
                            <tr key={i} style={{ borderBottom: i < paginatedLogins.length - 1 ? '1px solid var(--border)' : 'none' }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--muted)')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                              <td style={{ padding: '12px 16px 12px 0' }}><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--foreground)' }}>{ev.timestamp}</span></td>
                              <td style={{ padding: '12px 16px 12px 0' }}><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{ev.ipAddress}</span></td>
                              <td className="text-sm" style={{ color: 'var(--muted-foreground)', padding: '12px 16px 12px 0' }}>{ev.deviceType}</td>
                              <td style={{ padding: '12px 0' }}>
                                <span className="t-label px-2 py-0.5" style={{ backgroundColor: esc.bg, color: esc.color, borderRadius: 'var(--radius-sm)' }}>{ev.status}</span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <PaginationBar page={loginPage} totalPages={totalLoginPages} perPage={loginPerPage}
                    setPage={setLoginPage} setPerPage={(n) => { setLoginPerPage(n); setLoginPage(1) }} total={user.loginHistory.length} />
                </>
              )}
            </div>

          </div>

          {/* Sidebar (35%) */}
          <div className="flex flex-col gap-4" style={{ flex: '0 0 calc(35% - 24px)', minWidth: 0 }}>

            {/* Account Actions */}
            <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 20 }}>
              <h3 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '0.9375rem' }}>Account Actions</h3>
              <div className="flex flex-col gap-2.5">
                <ActionButton label="Reset password" onClick={() => setResetOpen(true)} variant="outline" />
                {status !== 'Suspended' ? (
                  <ActionButton label="Suspend account" onClick={() => setSuspendOpen(true)} variant="error" />
                ) : (
                  <ActionButton label="Reactivate account" onClick={() => setReactivateOpen(true)} variant="brand" />
                )}
                <ActionButton label="Permanently delete" onClick={() => setDeleteOpen(true)} variant="error-fill" />
              </div>
            </div>

            {/* Role & Access */}
            <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 20 }}>
              <h3 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '0.9375rem' }}>Role & Access</h3>
              <div className="flex flex-col gap-3 mb-4">
                <div>
                  <p className="t-label mb-1.5" style={{ color: 'var(--muted-foreground)' }}>CURRENT ROLE</p>
                  <span className="t-label px-2 py-0.5" style={{ backgroundColor: rc.bg, color: rc.color, borderRadius: 'var(--radius-sm)' }}>{user.role}</span>
                </div>
                <div>
                  <p className="t-label mb-1.5" style={{ color: 'var(--muted-foreground)' }}>ACCESS LEVEL</p>
                  <p className="text-sm" style={{ color: 'var(--foreground)' }}>{user.role === 'ICT Manager' ? 'Full system access' : `${user.role} module access`}</p>
                </div>
              </div>
              <button onClick={() => setRoleSheetOpen(true)}
                className="w-full py-2 rounded-xl text-sm font-medium transition-colors duration-150"
                style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card)' }}>
                Change role
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Reset password dialog */}
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: 'var(--font-display)' }}>Reset password for {user.fullName}?</AlertDialogTitle>
            <AlertDialogDescription>A temporary password will be generated and sent to their email and phone. They will be prompted to change it on next login.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}>Reset password</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend dialog */}
      <AlertDialog open={suspendOpen} onOpenChange={(o) => { if (!o) { setSuspendOpen(false); setSuspendReason('') } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: 'var(--font-display)' }}>Suspend account for {user.fullName}?</AlertDialogTitle>
            <AlertDialogDescription>They will be unable to sign in until the account is reactivated.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 pb-2">
            <label className="t-label mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>Reason (required)</label>
            <textarea value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} rows={3}
              placeholder="Provide a reason…" className="w-full text-sm outline-none resize-none"
              style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px', color: 'var(--foreground)', backgroundColor: 'var(--card)', lineHeight: 1.5 }} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSuspend} disabled={!suspendReason.trim()}
              style={{ backgroundColor: 'var(--error)', color: '#fff', opacity: suspendReason.trim() ? 1 : 0.5 }}>Suspend account</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reactivate dialog */}
      <AlertDialog open={reactivateOpen} onOpenChange={setReactivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: 'var(--font-display)' }}>Reactivate account for {user.fullName}?</AlertDialogTitle>
            <AlertDialogDescription>They will be able to sign in immediately after reactivation.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReactivate} style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}>Reactivate account</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={(o) => { if (!o) { setDeleteOpen(false); setDeleteReason('') } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: 'var(--font-display)' }}>Permanently delete account for {user.fullName}?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. All data associated with this account will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 pb-2">
            <label className="t-label mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>Reason (required)</label>
            <textarea value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} rows={3}
              placeholder="Provide a reason for permanent deletion…" className="w-full text-sm outline-none resize-none"
              style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px', color: 'var(--foreground)', backgroundColor: 'var(--card)', lineHeight: 1.5 }} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={!deleteReason.trim()}
              style={{ backgroundColor: 'var(--error)', color: '#fff', opacity: deleteReason.trim() ? 1 : 0.5 }}>Permanently delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change role Sheet */}
      <Sheet open={roleSheetOpen} onOpenChange={setRoleSheetOpen}>
        <SheetContent side="right" className="p-0" style={{ width: 'min(480px, 100vw)' }}>
          <SheetHeader className="px-8 py-6" style={{ borderBottom: '1px solid var(--border)' }}>
            <SheetTitle style={{ fontFamily: 'var(--font-display)' }}>Change Role</SheetTitle>
          </SheetHeader>
          <div className="px-8 py-6 flex flex-col gap-5">
            <div>
              <p className="t-body mb-1" style={{ color: 'var(--foreground)' }}>Changing role for: <strong>{user.fullName}</strong></p>
              <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>Current role: {user.role}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="t-label" style={{ color: 'var(--muted-foreground)' }}>NEW ROLE</label>
              <select value={newRole} onChange={(e) => setNewRole(e.target.value as UserRole)}
                style={{ fontSize: '0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px', color: 'var(--foreground)', backgroundColor: 'var(--card)' }}>
                {(['Student', 'Lecturer', 'Bursar', 'Academic Admin', 'Librarian', 'ICT Manager'] as UserRole[]).map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="px-4 py-3 rounded-xl" style={{ backgroundColor: 'var(--warning-bg)', border: '1px solid var(--warning)' }}>
              <p className="text-sm" style={{ color: 'var(--warning)' }}>⚠ Changing a user's role will immediately update their module access permissions. This action is logged in the audit log.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleRoleChange}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity duration-150"
                style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}>
                Confirm role change
              </button>
              <button onClick={() => setRoleSheetOpen(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150"
                style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card)' }}>
                Cancel
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

    </AppShell>
  )
}

// ── Sub-component ─────────────────────────────────────────────────────────────

function ActionButton({ label, onClick, variant }: {
  label: string
  onClick: () => void
  variant: 'outline' | 'error' | 'brand' | 'error-fill'
}) {
  const styles: Record<string, React.CSSProperties> = {
    outline:      { border: '1px solid var(--border)',   color: 'var(--foreground)', backgroundColor: 'var(--card)'  },
    error:        { border: '1px solid var(--error)',     color: 'var(--error)',      backgroundColor: 'var(--card)'  },
    brand:        { border: '1px solid var(--brand)',     color: '#16A34A',           backgroundColor: 'rgba(32,244,78,0.08)' },
    'error-fill': { border: 'none',                       color: '#fff',              backgroundColor: 'var(--error)' },
  }
  return (
    <button onClick={onClick} className="w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
      style={{ ...styles[variant], cursor: 'pointer' }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85' }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}>
      {label}
    </button>
  )
}
