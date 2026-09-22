import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  LayoutDashboard, BookOpen, ClipboardList, BarChart2, FileText, TrendingUp, Bell,
  Mail, Phone, Building2, Calendar, IdCard, Pencil,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { toast } from 'sonner'
import { LECTURER } from '@/data/lecturer'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/lecturer/profile')({
  component: LecturerProfilePage,
})

const LECTURER_NAV = [
  { label: 'Dashboard',     to: '/lecturer/dashboard',     icon: LayoutDashboard },
  { label: 'My Courses',    to: '/lecturer/courses',       icon: BookOpen        },
  { label: 'Attendance',    to: '/lecturer/attendance',    icon: ClipboardList   },
  { label: 'Results',       to: '/lecturer/results',       icon: BarChart2       },
  { label: 'Assignments',   to: '/lecturer/assignments',   icon: FileText        },
  { label: 'Analytics',     to: '/lecturer/analytics',     icon: TrendingUp      },
  { label: 'Notifications', to: '/lecturer/notifications', icon: Bell            },
]

// ─────────────────────────────────────────────────────────────────────────────

function LecturerProfilePage() {
  const [profile, setProfile] = useState({
    fullName: LECTURER.fullName,
    email:    LECTURER.email,
    phone:    LECTURER.phone,
  })
  const [sheetOpen, setSheetOpen] = useState(false)

  const handleSave = (data: typeof profile) => {
    setProfile(data)
    toast.success('Profile updated.')
    setSheetOpen(false)
  }

  return (
    <AppShell
      navItems={LECTURER_NAV}
      pageTitle="My Profile"
      userName={profile.fullName}
      userRole="Lecturer"
      userInitials={LECTURER.initials}
      unreadCount={3}
      infoCardLabel="LECTURER ID"
      infoCardValue={LECTURER.id}
      infoCardSubtext={LECTURER.department}
    >
      <div className="animate-fade-up" style={{ padding: '32px 32px 48px', maxWidth: 760, margin: '0 auto' }}>

        <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--muted-foreground)', fontSize: '0.8125rem' }}>
          <span>Lecturer</span>
          <span>›</span>
          <span style={{ color: 'var(--foreground)' }}>My Profile</span>
        </div>
        <h1 className="t-h1 mb-6" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>
          My Profile
        </h1>

        <div
          className="flex items-center gap-5 mb-6"
          style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 28 }}
        >
          <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 72, height: 72, backgroundColor: 'var(--ink)' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--brand)' }}>
              {LECTURER.initials}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="t-h2" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.01em' }}>
              {profile.fullName}
            </h2>
            <p className="t-body mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Lecturer · {LECTURER.department}</p>
            <p className="t-caption mt-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted-foreground)' }}>{LECTURER.id}</p>
          </div>
          <Button variant="outline" className="gap-2 flex-shrink-0" onClick={() => setSheetOpen(true)}>
            <Pencil size={14} />
            Edit profile
          </Button>
        </div>

        <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 28 }}>
          <h3 className="t-h3 mb-5" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Personal Information</h3>
          <div className="flex flex-col" style={{ gap: 0 }}>
            <InfoRow icon={IdCard}    label="Employee ID" value={LECTURER.id} mono />
            <InfoRow icon={Mail}      label="Email"       value={profile.email} />
            <InfoRow icon={Phone}     label="Phone"       value={profile.phone} />
            <InfoRow icon={Building2} label="Department"  value={LECTURER.department} />
            <InfoRow icon={Calendar}  label="Date Joined" value={LECTURER.joinedDate} isLast />
          </div>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="p-0 border-l overflow-hidden flex flex-col" style={{ width: 'min(860px, 55vw)' }}>
          <EditProfileForm profile={profile} onSave={handleSave} onClose={() => setSheetOpen(false)} />
        </SheetContent>
      </Sheet>
    </AppShell>
  )
}

function InfoRow({ icon: Icon, label, value, mono, isLast }: { icon: React.ElementType; label: string; value: string; mono?: boolean; isLast?: boolean }) {
  return (
    <div className="flex items-center gap-4 py-3.5" style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
      <div className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 34, height: 34, backgroundColor: 'var(--muted)' }}>
        <Icon size={15} style={{ color: 'var(--muted-foreground)' }} />
      </div>
      <span className="t-label flex-shrink-0" style={{ color: 'var(--muted-foreground)', width: 120 }}>{label}</span>
      <span className="text-sm flex-1" style={{ color: 'var(--foreground)', fontFamily: mono ? 'var(--font-mono)' : undefined }}>{value}</span>
    </div>
  )
}

function EditProfileForm({
  profile, onSave, onClose,
}: {
  profile: { fullName: string; email: string; phone: string }
  onSave: (data: { fullName: string; email: string; phone: string }) => void
  onClose: () => void
}) {
  const [fullName, setFullName] = useState(profile.fullName)
  const [email,    setEmail]    = useState(profile.email)
  const [phone,    setPhone]    = useState(profile.phone)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600, color: 'var(--foreground)', letterSpacing: '-0.01em' }}>Edit Profile</h2>
        <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>Update your personal contact details.</p>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label style={{ fontSize: '0.8125rem', color: 'var(--foreground)' }}>Full Name</Label>
            <Input value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label style={{ fontSize: '0.8125rem', color: 'var(--foreground)' }}>Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label style={{ fontSize: '0.8125rem', color: 'var(--foreground)' }}>Phone</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
        </div>
      </div>
      <div className="flex-shrink-0 flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid var(--border)' }}>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }} onClick={() => onSave({ fullName, email, phone })}>Save changes</Button>
      </div>
    </div>
  )
}
