import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { ShieldCheck, ShieldOff } from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { AppShell } from '@/components/AppShell'
import {
  ICT_MANAGER, ICT_NAV, MODULES_LIST, DEFAULT_PERMISSIONS,
  roleBadgeColors,
  type UserRole, type RolePermissions, type PermissionKey,
} from '@/data/ict'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/ict/access-levels')({
  component: AccessLevelsPage,
})

// ─────────────────────────────────────────────────────────────────────────────

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  'Student':       'Enrolled students — access to own academic record, fees, courses, and e-library.',
  'Lecturer':      'Teaching staff — access to assigned courses, results entry, materials, and attendance.',
  'Bursar':        'Finance officer — access to fee management, payment ledger, and financial reports only.',
  'Academic Admin':'Registrar — access to admissions, student registry, courses, results, and academic reports.',
  'Librarian':     'Library manager — full access to e-library resources, collections, and usage analytics.',
  'ICT Manager':   'Platform administrator — full read/write/delete access to all modules. Cannot be reduced.',
}

const ROLES: UserRole[] = ['Student', 'Lecturer', 'Bursar', 'Academic Admin', 'Librarian', 'ICT Manager']

// ─────────────────────────────────────────────────────────────────────────────

function AccessLevelsPage() {
  const [configRole, setConfigRole]   = useState<UserRole | null>(null)
  const [permissions, setPermissions] = useState<Record<UserRole, RolePermissions>>(DEFAULT_PERMISSIONS)

  const sheetOpen    = configRole !== null
  const isIct        = configRole === 'ICT Manager'
  const activePerms  = configRole ? permissions[configRole] : null

  const togglePerm = (module: typeof MODULES_LIST[number], key: PermissionKey) => {
    if (!configRole || isIct) return
    setPermissions((prev) => ({
      ...prev,
      [configRole]: {
        ...prev[configRole],
        [module]: {
          ...prev[configRole][module],
          [key]: !prev[configRole][module][key],
        },
      },
    }))
  }

  const handleSave = () => {
    toast.success(`Permissions saved for ${configRole}.`)
    setConfigRole(null)
  }

  const moduleCountFor = (role: UserRole) =>
    MODULES_LIST.filter((m) => permissions[role][m].read || permissions[role][m].write || permissions[role][m].delete).length

  return (
    <AppShell
      navItems={ICT_NAV}
      pageTitle="Access Levels"
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
        <div className="mb-6">
          <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Access Levels</h1>
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Configure module-level permissions for each role.</p>
        </div>

        {/* Role cards */}
        <div className="flex flex-col gap-4">
          {ROLES.map((role) => {
            const rc = roleBadgeColors(role)
            const count = moduleCountFor(role)
            return (
              <div key={role} className="flex items-center gap-4 p-5"
                style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>

                {/* Icon */}
                <div className="flex items-center justify-center rounded-xl flex-shrink-0"
                  style={{ width: 44, height: 44, backgroundColor: rc.bg }}>
                  {role === 'ICT Manager'
                    ? <ShieldCheck style={{ width: 20, height: 20, color: rc.color }} />
                    : <ShieldOff  style={{ width: 20, height: 20, color: rc.color }} />
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '0.9375rem' }}>{role}</h3>
                    <span className="t-label px-1.5 py-0.5" style={{ backgroundColor: rc.bg, color: rc.color, borderRadius: 'var(--radius-sm)', fontSize: 10 }}>{role}</span>
                  </div>
                  <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>{ROLE_DESCRIPTIONS[role]}</p>
                  <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
                    {role === 'ICT Manager' ? 'All 12 modules — locked at full access' : `${count} of ${MODULES_LIST.length} modules accessible`}
                  </p>
                </div>

                {/* Configure button */}
                <button onClick={() => setConfigRole(role)}
                  className="px-4 py-2 rounded-xl text-sm font-medium flex-shrink-0 transition-colors duration-150"
                  style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card)' }}>
                  Configure
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Permissions Sheet */}
      <Sheet open={sheetOpen} onOpenChange={(o) => !o && setConfigRole(null)}>
        <SheetContent side="right" className="p-0 overflow-y-auto" style={{ width: 'min(860px, 55vw)', maxWidth: '100vw' }}>
          {configRole && activePerms && (
            <>
              <SheetHeader className="px-8 py-6" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3">
                  <SheetTitle style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
                    Permissions — {configRole}
                  </SheetTitle>
                  {isIct && (
                    <span className="t-label px-2 py-0.5" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)', borderRadius: 'var(--radius-sm)' }}>LOCKED</span>
                  )}
                </div>
                <p className="t-body-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>{ROLE_DESCRIPTIONS[configRole]}</p>
              </SheetHeader>
              <div className="px-8 py-6">
                {isIct && (
                  <div className="mb-5 px-4 py-3 rounded-xl" style={{ backgroundColor: 'var(--info-bg)', border: '1px solid var(--info)' }}>
                    <p className="text-sm" style={{ color: 'var(--info)' }}>ICT Manager permissions are locked at full access. This role cannot be restricted.</p>
                  </div>
                )}

                {/* Header row */}
                <div className="grid mb-3" style={{ gridTemplateColumns: '1fr 80px 80px 80px', gap: '0 8px' }}>
                  <span className="t-label" style={{ color: 'var(--muted-foreground)' }}>MODULE</span>
                  {(['read', 'write', 'delete'] as PermissionKey[]).map((k) => (
                    <span key={k} className="t-label text-center" style={{ color: 'var(--muted-foreground)' }}>{k.toUpperCase()}</span>
                  ))}
                </div>

                <div className="flex flex-col" style={{ gap: 0 }}>
                  {MODULES_LIST.map((module, i) => (
                    <div key={module} className="grid items-center py-3.5"
                      style={{ gridTemplateColumns: '1fr 80px 80px 80px', gap: '0 8px', borderBottom: i < MODULES_LIST.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <span className="text-sm" style={{ color: 'var(--foreground)', fontWeight: 500 }}>{module}</span>
                      {(['read', 'write', 'delete'] as PermissionKey[]).map((key) => (
                        <div key={key} className="flex items-center justify-center">
                          <Switch
                            checked={activePerms[module][key]}
                            onCheckedChange={() => togglePerm(module, key)}
                            disabled={isIct}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {!isIct && (
                  <div className="flex gap-3 mt-6">
                    <button onClick={handleSave}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity duration-150"
                      style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}>
                      Save permissions
                    </button>
                    <button onClick={() => setConfigRole(null)}
                      className="px-5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150"
                      style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: 'pointer' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card)' }}>
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

    </AppShell>
  )
}
