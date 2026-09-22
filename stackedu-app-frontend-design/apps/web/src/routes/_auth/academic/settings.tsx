import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { ACADEMIC_ADMIN, ACADEMIC_NAV } from '@/data/academic'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/academic/settings')({
  component: AcademicSettingsPage,
})

const NOTIF_PREFS_DEFAULT = [
  { key: 'applications', label: 'New student applications',    email: true,  sms: false, inapp: true  },
  { key: 'atrisk',       label: 'At-risk student alerts',      email: true,  sms: false, inapp: true  },
  { key: 'results',      label: 'Result approval requests',    email: true,  sms: false, inapp: true  },
  { key: 'system',       label: 'System announcements',        email: true,  sms: false, inapp: false },
]

// ─────────────────────────────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 28, marginBottom: 24 }}>
      <h2 className="t-h3 mb-5" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>{title}</h2>
      {children}
    </div>
  )
}

function AcademicSettingsPage() {
  return (
    <AppShell
      navItems={ACADEMIC_NAV}
      pageTitle="Account Settings"
      userName={ACADEMIC_ADMIN.fullName}
      userRole={ACADEMIC_ADMIN.role}
      userInitials={ACADEMIC_ADMIN.initials}
      unreadCount={4}
      infoCardLabel="ACADEMIC ADMIN"
      infoCardValue={ACADEMIC_ADMIN.institution}
      infoCardSubtext={ACADEMIC_ADMIN.office}
    >
      <div className="animate-fade-up" style={{ padding: '32px 32px 48px', maxWidth: 760, margin: '0 auto' }}>
        <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--muted-foreground)', fontSize: '0.8125rem' }}>
          <span>Academic Admin</span>
          <span>›</span>
          <span style={{ color: 'var(--foreground)' }}>Account Settings</span>
        </div>
        <h1 className="t-h1 mb-6" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>
          Account Settings
        </h1>

        <PasswordCard />
        <NotificationsCard />
        <TwoFactorCard />
      </div>
    </AppShell>
  )
}

function PasswordCard() {
  const [current, setCurrent] = useState('')
  const [next,    setNext]    = useState('')
  const [confirm, setConfirm] = useState('')

  const handleUpdate = () => {
    if (!current || !next || !confirm) { toast.error('Please fill in all password fields.'); return }
    if (next.length < 8) { toast.error('New password must be at least 8 characters.'); return }
    if (next !== confirm) { toast.error('New password and confirmation do not match.'); return }
    toast.success('Password updated.')
    setCurrent(''); setNext(''); setConfirm('')
  }

  return (
    <Card title="Change Password">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label style={{ fontSize: '0.8125rem', color: 'var(--foreground)' }}>Current Password</Label>
          <Input type="password" value={current} onChange={e => setCurrent(e.target.value)} placeholder="••••••••" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label style={{ fontSize: '0.8125rem', color: 'var(--foreground)' }}>New Password</Label>
            <Input type="password" value={next} onChange={e => setNext(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label style={{ fontSize: '0.8125rem', color: 'var(--foreground)' }}>Confirm New Password</Label>
            <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" />
          </div>
        </div>
        <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>Minimum 8 characters.</p>
        <div>
          <Button style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }} onClick={handleUpdate}>Update password</Button>
        </div>
      </div>
    </Card>
  )
}

function NotificationsCard() {
  const [prefs, setPrefs] = useState(NOTIF_PREFS_DEFAULT)
  const toggle = (key: string, channel: 'email' | 'sms' | 'inapp', value: boolean) => {
    setPrefs(prev => prev.map(p => p.key === key ? { ...p, [channel]: value } : p))
  }

  return (
    <Card title="Notification Preferences">
      <div className="flex flex-col gap-4">
        {prefs.map(p => (
          <div key={p.key} className="flex items-center gap-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="text-sm flex-1" style={{ color: 'var(--foreground)' }}>{p.label}</span>
            {(['email', 'sms', 'inapp'] as const).map(ch => (
              <div key={ch} className="flex items-center gap-1.5 flex-shrink-0" style={{ width: 70 }}>
                <Switch checked={p[ch]} onCheckedChange={v => toggle(p.key, ch, v)} id={`${p.key}-${ch}`} />
                <Label htmlFor={`${p.key}-${ch}`} className="t-label" style={{ color: 'var(--muted-foreground)', cursor: 'pointer' }}>
                  {ch === 'inapp' ? 'In-app' : ch.toUpperCase()}
                </Label>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-5">
        <Button variant="outline" onClick={() => toast.success('Notification preferences saved.')}>Save preferences</Button>
      </div>
    </Card>
  )
}

function TwoFactorCard() {
  const [enabled, setEnabled] = useState(false)
  return (
    <Card title="Two-Factor Authentication">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 40, height: 40, backgroundColor: enabled ? 'var(--success-bg)' : 'var(--muted)' }}>
          <ShieldCheck size={18} style={{ color: enabled ? 'var(--success)' : 'var(--muted-foreground)' }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Require a one-time code at sign-in</p>
          <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            {enabled ? 'Two-factor authentication is enabled.' : 'Two-factor authentication is currently disabled.'}
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={v => { setEnabled(v); toast.success(v ? '2FA enabled.' : '2FA disabled.') }} />
      </div>
    </Card>
  )
}
