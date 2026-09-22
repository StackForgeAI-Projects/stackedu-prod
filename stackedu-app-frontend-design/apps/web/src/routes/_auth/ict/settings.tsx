import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Pencil, Trash2, Plus } from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { AppShell } from '@/components/AppShell'
import {
  ICT_MANAGER, ICT_NAV, DEPARTMENTS, NOTIF_TEMPLATES, DEFAULT_GRADING_SCALE,
} from '@/data/ict'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/ict/settings')({
  component: SystemSettingsPage,
})

// ── Shared helpers ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%', fontSize: '0.875rem', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)', padding: '10px 12px',
  color: 'var(--foreground)', backgroundColor: 'var(--card)', outline: 'none',
}

function FormField({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="t-label" style={{ color: 'var(--muted-foreground)' }}>{label}</label>
      {children}
      {hint && <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{hint}</p>}
    </div>
  )
}

function SaveButton({ label = 'Save changes', onClick }: { label?: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-opacity duration-150"
      style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}>
      {label}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function SystemSettingsPage() {
  return (
    <AppShell
      navItems={ICT_NAV}
      pageTitle="System Settings"
      userName={ICT_MANAGER.fullName}
      userRole={ICT_MANAGER.role}
      userInitials={ICT_MANAGER.initials}
      unreadCount={3}
      infoCardLabel="ICT MANAGER"
      infoCardValue={ICT_MANAGER.institution}
      infoCardSubtext={ICT_MANAGER.office}
    >
      <div className="animate-fade-up" style={{ padding: '32px 32px 48px' }}>
        <div className="mb-6">
          <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>System Settings</h1>
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Configure institution-wide settings, departments, security, and integrations.</p>
        </div>

        <Tabs defaultValue="institution">
          <TabsList className="mb-6" style={{ backgroundColor: 'var(--muted)', borderRadius: 'var(--radius-md)', padding: 4 }}>
            {[
              { value: 'institution', label: 'Institution' },
              { value: 'departments', label: 'Departments & Faculties' },
              { value: 'notifications', label: 'Notifications' },
              { value: 'security', label: 'Security' },
              { value: 'academic', label: 'Academic Config' },
            ].map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}
                style={{ fontSize: '0.875rem' }}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="institution"><InstitutionTab /></TabsContent>
          <TabsContent value="departments"><DepartmentsTab /></TabsContent>
          <TabsContent value="notifications"><NotificationsTab /></TabsContent>
          <TabsContent value="security"><SecurityTab /></TabsContent>
          <TabsContent value="academic"><AcademicConfigTab /></TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}

// ── Tab 1: Institution ────────────────────────────────────────────────────────

function InstitutionTab() {
  const [form, setForm] = useState({
    name:    'StackForgeAI University',
    email:   'info@sfu.ac.rw',
    phone:   '+250 788 000 001',
    address: 'Kiyovu, Kigali, Rwanda',
    yearFmt: '2025/2026',
  })

  return (
    <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 28 }}>
      <h2 className="t-h3 mb-6" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Institution Settings</h2>
      <div className="grid grid-cols-2 gap-5 mb-6">
        <FormField label="INSTITUTION NAME">
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={inputStyle} />
        </FormField>
        <FormField label="ACADEMIC YEAR FORMAT">
          <select value={form.yearFmt} onChange={(e) => setForm((f) => ({ ...f, yearFmt: e.target.value }))} style={inputStyle}>
            <option value="2025/2026">2025/2026</option>
            <option value="2025-2026">2025-2026</option>
            <option value="AY2025">AY2025</option>
          </select>
        </FormField>
        <FormField label="PRIMARY CONTACT EMAIL">
          <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} style={inputStyle} />
        </FormField>
        <FormField label="PRIMARY CONTACT PHONE">
          <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} style={inputStyle} />
        </FormField>
        <div className="col-span-2">
          <FormField label="PHYSICAL ADDRESS">
            <textarea value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} rows={2}
              className="resize-none" style={{ ...inputStyle }} />
          </FormField>
        </div>
        <div className="col-span-2">
          <FormField label="INSTITUTION LOGO">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center rounded-xl" style={{ width: 64, height: 64, backgroundColor: 'var(--brand)', flexShrink: 0 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--brand-ink)' }}>S</span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center py-8 rounded-xl border-2 border-dashed" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--muted)', cursor: 'pointer' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Drag and drop a logo, or click to browse</p>
                <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>PNG, JPG up to 2MB · Recommended: 256×256px</p>
              </div>
            </div>
          </FormField>
        </div>
      </div>
      <SaveButton onClick={() => toast.success('Institution settings saved.')} />
    </div>
  )
}

// ── Tab 2: Departments & Faculties ────────────────────────────────────────────

function DepartmentsTab() {
  const [departments, setDepartments] = useState(DEPARTMENTS)
  const [sheetOpen, setSheetOpen]     = useState(false)
  const [editDept, setEditDept]       = useState<typeof DEPARTMENTS[0] | null>(null)
  const [form, setForm] = useState({ name: '', faculty: '', description: '' })

  const openNew  = () => { setEditDept(null); setForm({ name: '', faculty: '', description: '' }); setSheetOpen(true) }
  const openEdit = (d: typeof DEPARTMENTS[0]) => { setEditDept(d); setForm({ name: d.name, faculty: d.faculty, description: '' }); setSheetOpen(true) }

  const handleSave = () => {
    if (!form.name) return
    if (editDept) {
      setDepartments((ds) => ds.map((d) => d.id === editDept.id ? { ...d, name: form.name, faculty: form.faculty } : d))
      toast.success(`Department "${form.name}" updated.`)
    } else {
      setDepartments((ds) => [...ds, { id: `dept-${Date.now()}`, name: form.name, faculty: form.faculty, courses: 0, lecturers: 0, status: 'Active' }])
      toast.success(`Department "${form.name}" created.`)
    }
    setSheetOpen(false)
  }

  const handleDelete = (id: string, name: string) => {
    setDepartments((ds) => ds.filter((d) => d.id !== id))
    toast.success(`Department "${name}" removed.`)
  }

  return (
    <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 28 }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Departments & Faculties</h2>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity duration-150"
          style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}>
          <Plus style={{ width: 15, height: 15 }} /> Add department
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Department Name', 'Faculty/School', 'Courses', 'Lecturers', 'Status', ''].map((h) => (
                <th key={h} className="t-label text-left" style={{ color: 'var(--muted-foreground)', paddingBottom: 10, borderBottom: '1px solid var(--border)', fontWeight: 600, paddingRight: 16 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {departments.map((dept, i) => (
              <tr key={dept.id} style={{ borderBottom: i < departments.length - 1 ? '1px solid var(--border)' : 'none' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--muted)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <td className="text-sm font-medium" style={{ color: 'var(--foreground)', padding: '14px 16px 14px 0' }}>{dept.name}</td>
                <td className="text-sm" style={{ color: 'var(--muted-foreground)', padding: '14px 16px 14px 0' }}>{dept.faculty}</td>
                <td className="text-sm" style={{ color: 'var(--foreground)', padding: '14px 16px 14px 0' }}>{dept.courses}</td>
                <td className="text-sm" style={{ color: 'var(--foreground)', padding: '14px 16px 14px 0' }}>{dept.lecturers}</td>
                <td style={{ padding: '14px 16px 14px 0' }}>
                  <span className="t-label px-1.5 py-0.5" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-sm)' }}>{dept.status}</span>
                </td>
                <td style={{ padding: '14px 0' }}>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => openEdit(dept)} title="Edit"
                      className="flex items-center justify-center rounded-lg transition-colors duration-150"
                      style={{ width: 30, height: 30, border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--muted-foreground)', cursor: 'pointer' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card)' }}>
                      <Pencil style={{ width: 13, height: 13 }} />
                    </button>
                    <button onClick={() => handleDelete(dept.id, dept.name)} title="Delete"
                      className="flex items-center justify-center rounded-lg transition-colors duration-150"
                      style={{ width: 30, height: 30, border: '1px solid var(--error-bg)', backgroundColor: 'var(--error-bg)', color: 'var(--error)', cursor: 'pointer' }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8' }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}>
                      <Trash2 style={{ width: 13, height: 13 }} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 px-4 py-3 rounded-xl" style={{ backgroundColor: 'var(--info-bg)', border: '1px solid rgba(37,99,235,0.25)' }}>
        <p className="t-caption" style={{ color: 'var(--info)' }}>
          Departments added here automatically appear in all role dashboards including the course catalogue, programme management, and faculty management.
        </p>
      </div>

      {/* Add / Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="p-0" style={{ width: 'min(480px, 100vw)' }}>
          <SheetHeader className="px-8 py-6" style={{ borderBottom: '1px solid var(--border)' }}>
            <SheetTitle style={{ fontFamily: 'var(--font-display)' }}>{editDept ? 'Edit Department' : 'Add Department'}</SheetTitle>
          </SheetHeader>
          <div className="px-8 py-6 flex flex-col gap-5">
            <FormField label="DEPARTMENT NAME">
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Computer Science & IT" style={inputStyle} />
            </FormField>
            <FormField label="FACULTY / SCHOOL">
              <select value={form.faculty} onChange={(e) => setForm((f) => ({ ...f, faculty: e.target.value }))} style={inputStyle}>
                <option value="">Select faculty…</option>
                <option value="Science & Technology">Science & Technology</option>
                <option value="Business & Commerce">Business & Commerce</option>
                <option value="Arts & Humanities">Arts & Humanities</option>
                <option value="Health Sciences">Health Sciences</option>
              </select>
            </FormField>
            <FormField label="DESCRIPTION (OPTIONAL)">
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3}
                placeholder="Brief description of the department…" className="resize-none" style={inputStyle} />
            </FormField>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={!form.name}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity duration-150"
                style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer', opacity: form.name ? 1 : 0.5 }}
                onMouseEnter={(e) => { if (form.name) e.currentTarget.style.opacity = '0.9' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = form.name ? '1' : '0.5' }}>
                Save department
              </button>
              <button onClick={() => setSheetOpen(false)}
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
    </div>
  )
}

// ── Tab 3: Notifications ──────────────────────────────────────────────────────

function NotificationsTab() {
  const [templates, setTemplates] = useState(NOTIF_TEMPLATES)
  const [editTemplate, setEditTemplate] = useState<typeof NOTIF_TEMPLATES[0] | null>(null)
  const [editBody, setEditBody]         = useState('')
  const [editSubject, setEditSubject]   = useState('')

  const openEdit = (tpl: typeof NOTIF_TEMPLATES[0]) => {
    setEditTemplate(tpl); setEditBody(tpl.body); setEditSubject(tpl.subject)
  }

  const handleSave = () => {
    if (!editTemplate) return
    setTemplates((ts) => ts.map((t) => t.id === editTemplate.id ? { ...t, body: editBody, subject: editSubject } : t))
    toast.success(`Template "${editTemplate.name}" saved.`)
    setEditTemplate(null)
  }

  return (
    <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 28 }}>
      <h2 className="t-h3 mb-6" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Notification Templates</h2>
      <div className="flex flex-col gap-3">
        {templates.map((tpl) => (
          <div key={tpl.id} className="flex items-center gap-4 p-4 rounded-xl" style={{ border: '1px solid var(--border)' }}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{tpl.name}</p>
              <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Trigger: {tpl.trigger}</p>
              <div className="flex items-center gap-2 mt-2">
                {(['email', 'sms', 'inapp'] as const).map((ch) => (
                  <div key={ch} className="flex items-center gap-1.5">
                    <Switch checked={tpl.channels[ch]}
                      onCheckedChange={(v) => setTemplates((ts) => ts.map((t) => t.id === tpl.id ? { ...t, channels: { ...t.channels, [ch]: v } } : t))}
                      id={`${tpl.id}-${ch}`} />
                    <Label htmlFor={`${tpl.id}-${ch}`} className="t-label" style={{ color: 'var(--muted-foreground)', cursor: 'pointer' }}>
                      {ch === 'inapp' ? 'In-app' : ch.toUpperCase()}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => openEdit(tpl)}
              className="px-3 py-2 rounded-xl text-sm font-medium flex-shrink-0 transition-colors duration-150"
              style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card)' }}>
              Edit template
            </button>
          </div>
        ))}
      </div>

      {/* Edit template Sheet */}
      <Sheet open={!!editTemplate} onOpenChange={(o) => !o && setEditTemplate(null)}>
        <SheetContent side="right" className="p-0 overflow-y-auto" style={{ width: 'min(640px, 100vw)' }}>
          {editTemplate && (
            <>
              <SheetHeader className="px-8 py-6" style={{ borderBottom: '1px solid var(--border)' }}>
                <SheetTitle style={{ fontFamily: 'var(--font-display)' }}>Edit Template — {editTemplate.name}</SheetTitle>
              </SheetHeader>
              <div className="px-8 py-6 flex flex-col gap-5">
                <div className="px-4 py-3 rounded-xl" style={{ backgroundColor: 'var(--muted)' }}>
                  <p className="t-label mb-1" style={{ color: 'var(--muted-foreground)' }}>AVAILABLE VARIABLES</p>
                  <p className="t-caption" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-mono)' }}>
                    {'{studentName} {fullName} {institutionName} {programmeName} {semesterName} {amount} {dueDate} {maintenanceDate}'}
                  </p>
                </div>
                <FormField label="SUBJECT LINE">
                  <input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} style={inputStyle} />
                </FormField>
                <FormField label="MESSAGE BODY">
                  <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={10}
                    className="resize-none" style={inputStyle} />
                </FormField>
                <div className="flex gap-3">
                  <button onClick={handleSave}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity duration-150"
                    style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}>
                    Save template
                  </button>
                  <button onClick={() => setEditTemplate(null)}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150"
                    style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: 'pointer' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card)' }}>
                    Cancel
                  </button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

// ── Tab 4: Security ───────────────────────────────────────────────────────────

function SecurityTab() {
  const [security, setSecurity] = useState({
    minLength:        8,
    requireUppercase: true,
    requireNumbers:   true,
    requireSpecial:   true,
    sessionTimeout:   '4 hours',
    enforce2faAdmins: true,
    enforce2faAll:    false,
    lockoutAttempts:  5,
    lockoutDuration:  30,
  })

  return (
    <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 28 }}>
      <h2 className="t-h3 mb-6" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Security Settings</h2>

      <div className="flex flex-col gap-6">
        {/* Password policy */}
        <div>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Password Policy</h3>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <label className="t-label flex-1" style={{ color: 'var(--muted-foreground)' }}>MINIMUM PASSWORD LENGTH</label>
              <input type="number" min={6} max={32} value={security.minLength}
                onChange={(e) => setSecurity((s) => ({ ...s, minLength: Number(e.target.value) }))}
                style={{ width: 72, fontSize: '0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '8px 12px', color: 'var(--foreground)', backgroundColor: 'var(--card)', textAlign: 'center' }} />
            </div>
            {([
              { key: 'requireUppercase', label: 'Require uppercase letters' },
              { key: 'requireNumbers',   label: 'Require numbers' },
              { key: 'requireSpecial',   label: 'Require special characters' },
            ] as const).map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <Switch checked={security[key]} onCheckedChange={(v) => setSecurity((s) => ({ ...s, [key]: v }))} id={key} />
                <Label htmlFor={key} className="text-sm" style={{ color: 'var(--foreground)', cursor: 'pointer' }}>{label}</Label>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Session Management</h3>
          <div className="flex items-center gap-4">
            <label className="t-label flex-1" style={{ color: 'var(--muted-foreground)' }}>SESSION TIMEOUT</label>
            <select value={security.sessionTimeout}
              onChange={(e) => setSecurity((s) => ({ ...s, sessionTimeout: e.target.value }))}
              style={{ fontSize: '0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '8px 12px', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: 'pointer' }}>
              {['30 minutes', '1 hour', '4 hours', '8 hours'].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Two-Factor Authentication</h3>
          <div className="flex flex-col gap-3">
            {([
              { key: 'enforce2faAdmins', label: 'Enforce 2FA for all admin users' },
              { key: 'enforce2faAll',    label: 'Enforce 2FA for all users (including students)' },
            ] as const).map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <Switch checked={security[key]} onCheckedChange={(v) => setSecurity((s) => ({ ...s, [key]: v }))} id={key} />
                <Label htmlFor={key} className="text-sm" style={{ color: 'var(--foreground)', cursor: 'pointer' }}>{label}</Label>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Login Lockout</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="t-label" style={{ color: 'var(--muted-foreground)' }}>FAILED ATTEMPTS BEFORE LOCKOUT</label>
              <input type="number" min={3} max={10} value={security.lockoutAttempts}
                onChange={(e) => setSecurity((s) => ({ ...s, lockoutAttempts: Number(e.target.value) }))}
                style={{ fontSize: '0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px', color: 'var(--foreground)', backgroundColor: 'var(--card)' }} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="t-label" style={{ color: 'var(--muted-foreground)' }}>LOCKOUT DURATION (MINUTES)</label>
              <input type="number" min={5} max={1440} value={security.lockoutDuration}
                onChange={(e) => setSecurity((s) => ({ ...s, lockoutDuration: Number(e.target.value) }))}
                style={{ fontSize: '0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px', color: 'var(--foreground)', backgroundColor: 'var(--card)' }} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <SaveButton label="Save security settings" onClick={() => toast.success('Security settings saved.')} />
      </div>
    </div>
  )
}

// ── Tab 5: Academic Configuration ─────────────────────────────────────────────

function AcademicConfigTab() {
  const [scale, setScale] = useState(DEFAULT_GRADING_SCALE)
  const [config, setConfig] = useState({
    passMark:         50,
    maxCredits:       21,
    gpaScale:         '4.0',
    maxRetakes:       2,
    retakeFee:        true,
    minCgpa:          2.0,
    minCredits:       120,
  })

  return (
    <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 28 }}>
      <h2 className="t-h3 mb-6" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Academic Configuration</h2>

      {/* Grading scale */}
      <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Grading Scale</h3>
      <div style={{ overflowX: 'auto', marginBottom: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Grade', 'Min Mark (%)', 'Max Mark (%)', 'GPA Points'].map((h) => (
                <th key={h} className="t-label text-left" style={{ color: 'var(--muted-foreground)', paddingBottom: 10, borderBottom: '1px solid var(--border)', paddingRight: 16 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scale.map((row, i) => (
              <tr key={row.grade} style={{ borderBottom: i < scale.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <td style={{ padding: '10px 16px 10px 0' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 700, color: 'var(--foreground)' }}>{row.grade}</span>
                </td>
                {(['minMark', 'maxMark', 'gpaPoints'] as const).map((key) => (
                  <td key={key} style={{ padding: '10px 16px 10px 0' }}>
                    <input type="number" value={row[key]}
                      onChange={(e) => setScale((s) => s.map((r, idx) => idx === i ? { ...r, [key]: Number(e.target.value) } : r))}
                      style={{ width: 80, fontSize: '0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '6px 10px', color: 'var(--foreground)', backgroundColor: 'var(--card)', textAlign: 'center' }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginBottom: 24 }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--foreground)' }}>General Settings</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'PASS MARK THRESHOLD (%)',         key: 'passMark',   min: 0,  max: 100 },
            { label: 'MAX CREDIT UNITS PER SEMESTER',   key: 'maxCredits', min: 1,  max: 40  },
            { label: 'MAX RETAKE ATTEMPTS',             key: 'maxRetakes', min: 0,  max: 5   },
          ].map(({ label, key, min, max }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="t-label" style={{ color: 'var(--muted-foreground)' }}>{label}</label>
              <input type="number" min={min} max={max} value={(config as any)[key]}
                onChange={(e) => setConfig((c) => ({ ...c, [key]: Number(e.target.value) }))}
                style={{ fontSize: '0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px', color: 'var(--foreground)', backgroundColor: 'var(--card)' }} />
            </div>
          ))}
          <div className="flex flex-col gap-1.5">
            <label className="t-label" style={{ color: 'var(--muted-foreground)' }}>GPA SCALE</label>
            <select value={config.gpaScale} onChange={(e) => setConfig((c) => ({ ...c, gpaScale: e.target.value }))}
              style={{ fontSize: '0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: 'pointer' }}>
              <option value="4.0">4.0 Scale</option>
              <option value="5.0">5.0 Scale</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <Switch checked={config.retakeFee} onCheckedChange={(v) => setConfig((c) => ({ ...c, retakeFee: v }))} id="retake-fee" />
          <Label htmlFor="retake-fee" className="text-sm" style={{ color: 'var(--foreground)', cursor: 'pointer' }}>Charge retake fee for each retake attempt</Label>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginBottom: 24 }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Graduation Requirements</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="t-label" style={{ color: 'var(--muted-foreground)' }}>MINIMUM CGPA TO GRADUATE</label>
            <input type="number" min={0} max={4} step={0.1} value={config.minCgpa}
              onChange={(e) => setConfig((c) => ({ ...c, minCgpa: Number(e.target.value) }))}
              style={{ fontSize: '0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px', color: 'var(--foreground)', backgroundColor: 'var(--card)' }} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="t-label" style={{ color: 'var(--muted-foreground)' }}>MINIMUM CREDITS TO GRADUATE</label>
            <input type="number" min={60} max={240} value={config.minCredits}
              onChange={(e) => setConfig((c) => ({ ...c, minCredits: Number(e.target.value) }))}
              style={{ fontSize: '0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px', color: 'var(--foreground)', backgroundColor: 'var(--card)' }} />
          </div>
        </div>
      </div>

      <SaveButton label="Save academic settings" onClick={() => toast.success('Academic configuration saved.')} />
    </div>
  )
}
