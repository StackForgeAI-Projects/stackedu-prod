import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Search, Eye, Pencil, Trash2, Plus } from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Switch } from '@/components/ui/switch'
import { AppShell } from '@/components/AppShell'
import { ACADEMIC_ADMIN, ACADEMIC_NAV, PROGRAMMES, type Programme } from '@/data/academic'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/academic/programmes')({
  component: ProgrammesPage,
})

// ─────────────────────────────────────────────────────────────────────────────

const DEPT_FILTER = [
  'All Departments',
  'Computer Science & IT',
  'Mathematics & Sciences',
  'Business & Management',
  'Languages & Communication',
]

const DEPT_MAP: Record<string, string> = {
  'School of Computing': 'Computer Science & IT',
  'School of Sciences':  'Mathematics & Sciences',
  'School of Business':  'Business & Management',
  'School of Languages': 'Languages & Communication',
}

const DURATIONS = ['1 year', '2 years', '3 years', '4 years']

function deptBadgeColors(dept: string) {
  const mapped = DEPT_MAP[dept] ?? dept
  if (mapped.includes('Computer'))  return { bg: 'var(--info-bg)',          color: 'var(--info)'             }
  if (mapped.includes('Math'))      return { bg: 'rgba(32,244,78,0.10)',    color: '#16A34A'                 }
  if (mapped.includes('Business'))  return { bg: 'var(--warning-bg)',       color: 'var(--warning)'          }
  return                                   { bg: 'var(--muted)',             color: 'var(--muted-foreground)' }
}

// ─────────────────────────────────────────────────────────────────────────────

function ProgrammesPage() {
  const [search, setSearch]           = useState('')
  const [dept, setDept]               = useState('All Departments')
  const [sheetOpen, setSheetOpen]     = useState(false)
  const [editProg, setEditProg]       = useState<Programme | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Programme | null>(null)

  const [form, setForm] = useState({
    name: '', department: 'School of Computing', duration: '3 years',
    totalCredits: '', description: '', status: true,
  })

  const openAdd = () => {
    setEditProg(null)
    setForm({ name: '', department: 'School of Computing', duration: '3 years', totalCredits: '', description: '', status: true })
    setSheetOpen(true)
  }

  const openEdit = (p: Programme) => {
    setEditProg(p)
    setForm({ name: p.name, department: p.department, duration: p.duration, totalCredits: String(p.totalCredits), description: p.description, status: p.status === 'Active' })
    setSheetOpen(true)
  }

  const filtered = PROGRAMMES.filter((p) => {
    const nameMatch = p.name.toLowerCase().includes(search.toLowerCase())
    const courseMatch = search.length > 0 && p.years.some((yr) =>
      yr.semesters.some((sem) =>
        sem.courses.some((c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.code.toLowerCase().includes(search.toLowerCase())
        )
      )
    )
    const searchMatch = search === '' || nameMatch || courseMatch
    const deptMatch   = dept === 'All Departments' || DEPT_MAP[p.department] === dept
    return searchMatch && deptMatch
  })

  return (
    <AppShell
      navItems={ACADEMIC_NAV}
      pageTitle="Programmes"
      userName={ACADEMIC_ADMIN.fullName}
      userRole={ACADEMIC_ADMIN.role}
      userInitials={ACADEMIC_ADMIN.initials}
      unreadCount={4}
      infoCardLabel="ACADEMIC ADMIN"
      infoCardValue={ACADEMIC_ADMIN.institution}
      infoCardSubtext={ACADEMIC_ADMIN.office}
    >
      <div className="animate-fade-up" style={{ padding: '32px 32px 48px' }}>

        {/* Section header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Programmes</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>{PROGRAMMES.filter((p) => p.status === 'Active').length} active programmes</p>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150"
            style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
          >
            <Plus style={{ width: 15, height: 15 }} />Add programme
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2 rounded-lg px-3 h-9 flex-1 max-w-sm" style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}>
            <Search className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--muted-foreground)' }} />
            <input type="text" placeholder="Search by programme or course name…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none" style={{ color: 'var(--foreground)' }} />
          </div>
          <select value={dept} onChange={(e) => setDept(e.target.value)}
            className="text-sm rounded-lg px-3 h-9 outline-none"
            style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', cursor: 'pointer' }}
          >
            {DEPT_FILTER.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>

        {/* Table */}
        <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Programme Name', 'Department', 'Duration', 'Credits / Units', 'Enrolled', 'Status', ''].map((h) => (
                    <th key={h} className="t-label text-left" style={{ color: 'var(--muted-foreground)', padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 t-body" style={{ color: 'var(--muted-foreground)' }}>No programmes found</td>
                  </tr>
                ) : filtered.map((prog, i) => {
                  const dc = deptBadgeColors(prog.department)
                  const sc = prog.status === 'Active'
                    ? { bg: 'var(--success-bg)', color: 'var(--success)'         }
                    : { bg: 'var(--muted)',       color: 'var(--muted-foreground)' }
                  return (
                    <tr key={prog.id}
                      style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--muted)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td className="text-sm" style={{ color: 'var(--foreground)', padding: '14px 16px', fontWeight: 600, whiteSpace: 'nowrap' }}>{prog.name}</td>
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <span className="t-label px-2 py-0.5" style={{ backgroundColor: dc.bg, color: dc.color, borderRadius: 'var(--radius-sm)' }}>{prog.department}</span>
                      </td>
                      <td className="text-sm" style={{ color: 'var(--muted-foreground)', padding: '14px 16px', whiteSpace: 'nowrap' }}>{prog.duration}</td>
                      <td className="text-sm font-medium" style={{ color: 'var(--foreground)', padding: '14px 16px' }}>{prog.totalCredits} cr</td>
                      <td className="text-sm" style={{ color: 'var(--muted-foreground)', padding: '14px 16px' }}>{prog.enrolled}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span className="t-label px-2 py-0.5" style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)' }}>{prog.status}</span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div className="flex items-center gap-0.5">
                          <Link to="/academic/programme" search={{ id: String(prog.id) }}>
                            <button
                              title="View"
                              className="flex items-center justify-center rounded-lg transition-colors duration-150"
                              style={{ width: 30, height: 30, color: 'var(--muted-foreground)', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)'; e.currentTarget.style.color = 'var(--foreground)' }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--muted-foreground)' }}
                            >
                              <Eye style={{ width: 14, height: 14 }} />
                            </button>
                          </Link>
                          <button
                            onClick={() => openEdit(prog)}
                            title="Edit"
                            className="flex items-center justify-center rounded-lg transition-colors duration-150"
                            style={{ width: 30, height: 30, color: 'var(--muted-foreground)', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)'; e.currentTarget.style.color = 'var(--foreground)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--muted-foreground)' }}
                          >
                            <Pencil style={{ width: 14, height: 14 }} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(prog)}
                            title="Delete"
                            className="flex items-center justify-center rounded-lg transition-colors duration-150"
                            style={{ width: 30, height: 30, color: 'var(--muted-foreground)', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--error-bg)'; e.currentTarget.style.color = 'var(--error)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--muted-foreground)' }}
                          >
                            <Trash2 style={{ width: 14, height: 14 }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Delete AlertDialog */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will affect all enrolled students and course assignments. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => setDeleteTarget(null)}
              style={{ backgroundColor: 'var(--error)', color: '#fff' }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add / Edit Programme Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="p-0 overflow-y-auto" style={{ width: 'min(860px, 55vw)', maxWidth: '100vw' }}>
          <SheetHeader className="px-8 py-6" style={{ borderBottom: '1px solid var(--border)' }}>
            <SheetTitle style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
              {editProg ? 'Edit Programme' : 'Add Programme'}
            </SheetTitle>
          </SheetHeader>
          <div className="px-8 py-6 flex flex-col gap-4">

            <div>
              <label className="t-label mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>Programme Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Computer Science"
                className="w-full text-sm rounded-lg px-3 h-9 outline-none"
                style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)' }} />
            </div>

            <div>
              <label className="t-label mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>Department</label>
              <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full text-sm rounded-lg px-3 h-9 outline-none"
                style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)', cursor: 'pointer' }}
              >
                <option value="School of Computing">School of Computing</option>
                <option value="School of Sciences">School of Sciences</option>
                <option value="School of Business">School of Business</option>
                <option value="School of Languages">School of Languages</option>
              </select>
            </div>

            <div>
              <label className="t-label mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>Duration</label>
              <select value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}
                className="w-full text-sm rounded-lg px-3 h-9 outline-none"
                style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)', cursor: 'pointer' }}
              >
                {DURATIONS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="t-label mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>Total Credit Units</label>
              <input type="number" value={form.totalCredits} onChange={(e) => setForm({ ...form, totalCredits: e.target.value })} placeholder="e.g. 120"
                className="w-full text-sm rounded-lg px-3 h-9 outline-none"
                style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)' }} />
            </div>

            <div>
              <label className="t-label mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Brief description of the programme…"
                className="w-full text-sm rounded-lg px-3 py-2 outline-none resize-none"
                style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)' }} />
            </div>

            <div className="flex items-center justify-between py-3 px-4 rounded-xl" style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Status</p>
                <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{form.status ? 'Active — open for enrolment' : 'Inactive — hidden from students'}</p>
              </div>
              <Switch checked={form.status} onCheckedChange={(v) => setForm({ ...form, status: v })} />
            </div>

            <div className="flex gap-3 mt-2">
              <button onClick={() => setSheetOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150"
                style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'transparent', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => setSheetOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
                style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
              >Save</button>
            </div>

          </div>
        </SheetContent>
      </Sheet>

    </AppShell>
  )
}
