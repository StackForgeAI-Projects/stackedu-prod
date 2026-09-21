import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { Eye, KeyRound, UserX, Search, Plus, Copy, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { AppShell } from '@/components/AppShell'
import {
  ICT_MANAGER, ICT_NAV, PLATFORM_USERS, roleBadgeColors, userStatusColors,
  type UserRole, type UserStatus, type PlatformUser,
} from '@/data/ict'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/ict/users')({
  component: UserManagementPage,
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function PaginationBar({ page, totalPages, perPage, setPage, setPerPage, total }: {
  page: number; totalPages: number; perPage: number; total: number
  setPage: (p: number) => void; setPerPage: (n: number) => void
}) {
  const start = (page - 1) * perPage + 1
  const end   = Math.min(page * perPage, total)
  const btnStyle = (disabled: boolean) => ({
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
        <button style={btnStyle(page === 1)} disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft style={{ width: 14, height: 14 }} /></button>
        <button style={btnStyle(page >= totalPages)} disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight style={{ width: 14, height: 14 }} /></button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function UserManagementPage() {
  const [users, setUsers]               = useState(PLATFORM_USERS)
  const [search, setSearch]             = useState('')
  const [roleFilter, setRoleFilter]     = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage]                 = useState(1)
  const [perPage, setPerPage]           = useState(10)

  // Dialogs
  const [resetTarget, setResetTarget]   = useState<PlatformUser | null>(null)
  const [revokeTarget, setRevokeTarget] = useState<PlatformUser | null>(null)
  const [revokeReason, setRevokeReason] = useState('')
  const [addSheetOpen, setAddSheetOpen] = useState(false)

  // Add user form state
  const [newUser, setNewUser] = useState({
    fullName: '', email: '', phone: '',
    role: 'Student' as UserRole,
    programme: '', year: 'Year 1', department: '', faculty: '',
    sendCredentials: true,
  })

  const generatedPassword = 'Tmp@2026!'
  const generatedId       = `SFE-2025-${String(users.length + 1).padStart(4, '0')}`

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch = !search || u.fullName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || u.userId.toLowerCase().includes(search.toLowerCase())
      const matchRole   = roleFilter   === 'all' || u.role   === roleFilter
      const matchStatus = statusFilter === 'all' || u.status === statusFilter
      return matchSearch && matchRole && matchStatus
    })
  }, [users, search, roleFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginated  = filtered.slice((page - 1) * perPage, page * perPage)

  const handleAddUser = () => {
    if (!newUser.fullName || !newUser.email) return
    const created: PlatformUser = {
      id:           `user-${Date.now()}`,
      userId:       generatedId,
      fullName:     newUser.fullName,
      initials:     newUser.fullName.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase(),
      email:        newUser.email,
      phone:        newUser.phone,
      role:         newUser.role,
      status:       'Active',
      lastLogin:    '—',
      createdDate:  new Date().toISOString().split('T')[0],
      programme:    newUser.role === 'Student' ? newUser.programme : undefined,
      yearOfStudy:  newUser.role === 'Student' ? newUser.year : undefined,
      department:   ['Lecturer'].includes(newUser.role) ? newUser.department : undefined,
      faculty:      ['Lecturer'].includes(newUser.role) ? newUser.faculty : undefined,
      loginHistory: [],
    }
    setUsers((u) => [created, ...u])
    setAddSheetOpen(false)
    setNewUser({ fullName: '', email: '', phone: '', role: 'Student', programme: '', year: 'Year 1', department: '', faculty: '', sendCredentials: true })
    toast.success(`Account created for ${created.fullName}. Credentials sent via email and SMS.`)
  }

  const handleRevoke = () => {
    if (!revokeTarget) return
    setUsers((u) => u.map((x) => x.id === revokeTarget.id ? { ...x, status: 'Suspended' as UserStatus } : x))
    setRevokeTarget(null)
    setRevokeReason('')
    toast.success(`Access revoked for ${revokeTarget.fullName}.`)
  }

  const handleReset = () => {
    if (!resetTarget) return
    setResetTarget(null)
    toast.success(`Password reset for ${resetTarget.fullName}. Temporary password sent.`)
  }

  const filterSelectStyle: React.CSSProperties = {
    fontSize: '0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
    padding: '8px 12px', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: 'pointer',
  }

  return (
    <AppShell
      navItems={ICT_NAV}
      pageTitle="User Management"
      userName={ICT_MANAGER.fullName}
      userRole={ICT_MANAGER.role}
      userInitials={ICT_MANAGER.initials}
      unreadCount={3}
      infoCardLabel="ICT MANAGER"
      infoCardValue={ICT_MANAGER.institution}
      infoCardSubtext={ICT_MANAGER.office}
    >
      <div className="animate-fade-up" style={{ padding: '32px 32px 48px' }}>

        {/* Section header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>User Management</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>{users.length} total users across all roles</p>
          </div>
          <button onClick={() => setAddSheetOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity duration-150"
            style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}>
            <Plus style={{ width: 16, height: 16 }} />
            Add new user
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-2 rounded-lg px-3 h-10 flex-1 min-w-48"
            style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}>
            <Search style={{ width: 14, height: 14, color: 'var(--muted-foreground)', flexShrink: 0 }} />
            <input type="text" placeholder="Search by name, email, or ID…" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: 'var(--foreground)', fontSize: '0.875rem' }} />
          </div>
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }} style={filterSelectStyle}>
            <option value="all">All Roles</option>
            <option value="Student">Student</option>
            <option value="Lecturer">Lecturer</option>
            <option value="Bursar">Bursar</option>
            <option value="Academic Admin">Academic Admin</option>
            <option value="Librarian">Librarian</option>
            <option value="ICT Manager">ICT Manager</option>
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} style={filterSelectStyle}>
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* Table */}
        <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['User ID', 'Full Name', 'Email', 'Role', 'Status', 'Last Login', 'Actions'].map((h) => (
                    <th key={h} className="t-label text-left" style={{ color: 'var(--muted-foreground)', paddingBottom: 10, borderBottom: '1px solid var(--border)', fontWeight: 600, whiteSpace: 'nowrap', paddingRight: 16 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((user, i) => {
                  const rc = roleBadgeColors(user.role)
                  const sc = userStatusColors(user.status)
                  return (
                    <tr key={user.id} style={{ borderBottom: i < paginated.length - 1 ? '1px solid var(--border)' : 'none' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--muted)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      <td style={{ padding: '14px 16px 14px 0' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{user.userId}</span>
                      </td>
                      <td className="text-sm font-medium" style={{ color: 'var(--foreground)', padding: '14px 16px 14px 0', whiteSpace: 'nowrap' }}>{user.fullName}</td>
                      <td className="text-sm" style={{ color: 'var(--muted-foreground)', padding: '14px 16px 14px 0' }}>{user.email}</td>
                      <td style={{ padding: '14px 16px 14px 0' }}>
                        <span className="t-label px-2 py-0.5" style={{ backgroundColor: rc.bg, color: rc.color, borderRadius: 'var(--radius-sm)' }}>{user.role}</span>
                      </td>
                      <td style={{ padding: '14px 16px 14px 0' }}>
                        <span className="t-label px-2 py-0.5" style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)' }}>{user.status}</span>
                      </td>
                      <td className="t-caption" style={{ color: 'var(--muted-foreground)', padding: '14px 16px 14px 0', whiteSpace: 'nowrap' }}>{user.lastLogin}</td>
                      <td style={{ padding: '14px 0' }}>
                        <div className="flex items-center gap-1.5">
                          <Link to="/ict/user" search={{ id: user.id }}>
                            <button title="View details"
                              className="flex items-center justify-center rounded-lg transition-colors duration-150"
                              style={{ width: 30, height: 30, border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--muted-foreground)', cursor: 'pointer' }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)'; e.currentTarget.style.color = 'var(--foreground)' }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card)'; e.currentTarget.style.color = 'var(--muted-foreground)' }}>
                              <Eye style={{ width: 14, height: 14 }} />
                            </button>
                          </Link>
                          <button title="Reset password" onClick={() => setResetTarget(user)}
                            className="flex items-center justify-center rounded-lg transition-colors duration-150"
                            style={{ width: 30, height: 30, border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--muted-foreground)', cursor: 'pointer' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)'; e.currentTarget.style.color = 'var(--foreground)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card)'; e.currentTarget.style.color = 'var(--muted-foreground)' }}>
                            <KeyRound style={{ width: 14, height: 14 }} />
                          </button>
                          <button title="Revoke access" onClick={() => setRevokeTarget(user)}
                            className="flex items-center justify-center rounded-lg transition-colors duration-150"
                            style={{ width: 30, height: 30, border: '1px solid var(--error-bg)', backgroundColor: 'var(--error-bg)', color: 'var(--error)', cursor: 'pointer' }}
                            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8' }}
                            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}>
                            <UserX style={{ width: 14, height: 14 }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <PaginationBar page={page} totalPages={totalPages} perPage={perPage} setPage={setPage} setPerPage={(n) => { setPerPage(n); setPage(1) }} total={filtered.length} />
        </div>

      </div>

      {/* ── Reset Password AlertDialog ─────────────────────────────────────── */}
      <AlertDialog open={!!resetTarget} onOpenChange={(o) => !o && setResetTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: 'var(--font-display)' }}>Reset password for {resetTarget?.fullName}?</AlertDialogTitle>
            <AlertDialogDescription>
              A temporary password will be generated and sent to their email and phone number. They will be prompted to change it on next login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}>
              Reset password
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Revoke Access AlertDialog ──────────────────────────────────────── */}
      <AlertDialog open={!!revokeTarget} onOpenChange={(o) => { if (!o) { setRevokeTarget(null); setRevokeReason('') } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: 'var(--font-display)' }}>Revoke access for {revokeTarget?.fullName}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will be immediately logged out and unable to sign in. This action is recorded in the audit log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 pb-2">
            <label className="t-label mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>Reason (required)</label>
            <textarea value={revokeReason} onChange={(e) => setRevokeReason(e.target.value)} rows={3}
              placeholder="Provide a reason for revoking access…"
              className="w-full text-sm outline-none resize-none"
              style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px', color: 'var(--foreground)', backgroundColor: 'var(--card)', lineHeight: 1.5 }} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke} disabled={!revokeReason.trim()}
              style={{ backgroundColor: 'var(--error)', color: '#FFFFFF', opacity: revokeReason.trim() ? 1 : 0.5 }}>
              Revoke access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Add User Sheet ─────────────────────────────────────────────────── */}
      <Sheet open={addSheetOpen} onOpenChange={setAddSheetOpen}>
        <SheetContent side="right" className="p-0 overflow-y-auto" style={{ width: 'min(860px, 55vw)', maxWidth: '100vw' }}>
          <SheetHeader className="px-8 py-6" style={{ borderBottom: '1px solid var(--border)' }}>
            <SheetTitle style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Add New User</SheetTitle>
          </SheetHeader>
          <div className="px-8 py-6 flex flex-col gap-5">

            <FormField label="Full Name">
              <input value={newUser.fullName} onChange={(e) => setNewUser((u) => ({ ...u, fullName: e.target.value }))}
                placeholder="Enter full name" style={inputStyle} />
            </FormField>

            <FormField label="Email Address">
              <input type="email" value={newUser.email} onChange={(e) => setNewUser((u) => ({ ...u, email: e.target.value }))}
                placeholder="user@sfu.ac.rw" style={inputStyle} />
            </FormField>

            <FormField label="Phone Number">
              <input value={newUser.phone} onChange={(e) => setNewUser((u) => ({ ...u, phone: e.target.value }))}
                placeholder="+250 7XX XXX XXX" style={inputStyle} />
            </FormField>

            <FormField label="Role">
              <select value={newUser.role} onChange={(e) => setNewUser((u) => ({ ...u, role: e.target.value as UserRole }))} style={inputStyle}>
                <option value="Student">Student</option>
                <option value="Lecturer">Lecturer</option>
                <option value="Bursar">Bursar</option>
                <option value="Academic Admin">Academic Admin</option>
                <option value="Librarian">Librarian</option>
                <option value="ICT Manager">ICT Manager</option>
              </select>
            </FormField>

            {newUser.role === 'Student' && (
              <>
                <div className="px-4 py-3 rounded-xl" style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}>
                  <p className="t-label mb-1" style={{ color: 'var(--muted-foreground)' }}>STUDENT ID (AUTO-GENERATED)</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--foreground)', fontWeight: 600 }}>{generatedId}</p>
                </div>
                <FormField label="Programme">
                  <select value={newUser.programme} onChange={(e) => setNewUser((u) => ({ ...u, programme: e.target.value }))} style={inputStyle}>
                    <option value="">Select programme…</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Business Administration">Business Administration</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Languages">Languages</option>
                    <option value="Sciences">Sciences</option>
                  </select>
                </FormField>
                <FormField label="Year of Study">
                  <select value={newUser.year} onChange={(e) => setNewUser((u) => ({ ...u, year: e.target.value }))} style={inputStyle}>
                    {['Year 1', 'Year 2', 'Year 3', 'Year 4'].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </FormField>
              </>
            )}

            {newUser.role === 'Lecturer' && (
              <>
                <FormField label="Department">
                  <select value={newUser.department} onChange={(e) => setNewUser((u) => ({ ...u, department: e.target.value }))} style={inputStyle}>
                    <option value="">Select department…</option>
                    <option value="Computer Science & IT">Computer Science & IT</option>
                    <option value="Mathematics & Sciences">Mathematics & Sciences</option>
                    <option value="Business & Management">Business & Management</option>
                    <option value="Languages & Communication">Languages & Communication</option>
                    <option value="Engineering">Engineering</option>
                  </select>
                </FormField>
                <FormField label="Faculty">
                  <select value={newUser.faculty} onChange={(e) => setNewUser((u) => ({ ...u, faculty: e.target.value }))} style={inputStyle}>
                    <option value="">Select faculty…</option>
                    <option value="Science & Technology">Science & Technology</option>
                    <option value="Business & Commerce">Business & Commerce</option>
                    <option value="Arts & Humanities">Arts & Humanities</option>
                  </select>
                </FormField>
              </>
            )}

            {['Bursar', 'Academic Admin', 'Librarian'].includes(newUser.role) && (
              <div className="px-4 py-3 rounded-xl" style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}>
                <p className="t-label mb-1" style={{ color: 'var(--muted-foreground)' }}>ACCESS LEVEL</p>
                <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  {newUser.role} — automatically set from role
                </p>
              </div>
            )}

            {/* Default password */}
            <FormField label="Default Password">
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg"
                  style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--foreground)' }}>
                  {generatedPassword}
                </div>
                <button onClick={() => { navigator.clipboard.writeText(generatedPassword); toast.success('Password copied') }}
                  title="Copy password"
                  className="flex items-center justify-center rounded-lg flex-shrink-0 transition-colors duration-150"
                  style={{ width: 36, height: 36, border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--muted-foreground)', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card)' }}>
                  <Copy style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </FormField>

            {/* Send credentials toggle */}
            <div className="flex items-center gap-3">
              <Switch checked={newUser.sendCredentials} onCheckedChange={(v) => setNewUser((u) => ({ ...u, sendCredentials: v }))} id="send-creds" />
              <Label htmlFor="send-creds" className="text-sm" style={{ color: 'var(--foreground)', cursor: 'pointer' }}>
                Send credentials via email and SMS
              </Label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button onClick={handleAddUser} disabled={!newUser.fullName || !newUser.email}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity duration-150"
                style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer', opacity: newUser.fullName && newUser.email ? 1 : 0.5 }}
                onMouseEnter={(e) => { if (newUser.fullName && newUser.email) e.currentTarget.style.opacity = '0.9' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = newUser.fullName && newUser.email ? '1' : '0.5' }}>
                Create account
              </button>
              <button onClick={() => setAddSheetOpen(false)}
                className="px-6 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150"
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

// ── Shared helpers ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%', fontSize: '0.875rem', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)', padding: '10px 12px',
  color: 'var(--foreground)', backgroundColor: 'var(--card)', outline: 'none',
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="t-label" style={{ color: 'var(--muted-foreground)' }}>{label}</label>
      {children}
    </div>
  )
}
