import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Search, Pencil, Archive, X } from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { AppShell } from '@/components/AppShell'
import { ACADEMIC_ADMIN, ACADEMIC_NAV, COURSES, LECTURERS, type Course, type CourseType } from '@/data/academic'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/academic/courses')({
  component: CoursesCataloguePage,
})

// ─────────────────────────────────────────────────────────────────────────────

const DEPARTMENTS  = ['All Departments', 'Computer Science', 'Mathematics', 'Languages', 'Business']
const STATUSES     = ['All Statuses', 'Active', 'Archived']
const PAGE_SIZE_OPTIONS = [5, 10, 25, 50]

type CourseFormData = {
  code: string; name: string; department: string; credits: number
  type: CourseType; description: string; prerequisites: string[]
  lecturer: string; status: 'Active' | 'Inactive'
}

const BLANK: CourseFormData = { code: '', name: '', department: 'Computer Science', credits: 3, type: 'Compulsory', description: '', prerequisites: [], lecturer: '', status: 'Active' }

// ─────────────────────────────────────────────────────────────────────────────

function CoursesCataloguePage() {
  const [courses, setCourses]   = useState(COURSES)
  const [search, setSearch]     = useState('')
  const [dept, setDept]         = useState('All Departments')
  const [status, setStatus]     = useState('All Statuses')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage]         = useState(1)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing]     = useState<Course | null>(null)
  const [form, setForm]           = useState<CourseFormData>(BLANK)

  const openAdd  = () => { setEditing(null); setForm(BLANK); setSheetOpen(true) }
  const openEdit = (c: Course) => {
    setEditing(c)
    setForm({ code: c.code, name: c.name, department: c.department, credits: c.credits, type: c.type, description: c.description, prerequisites: c.prerequisites, lecturer: c.lecturer, status: c.status === 'Active' ? 'Active' : 'Inactive' })
    setSheetOpen(true)
  }

  const filtered = courses.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase())
    const matchDept   = dept === 'All Departments' || c.department === dept
    const matchStatus = status === 'All Statuses' || c.status === status
    return matchSearch && matchDept && matchStatus
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <AppShell
      navItems={ACADEMIC_NAV}
      pageTitle="Courses"
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Course Catalogue</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>{courses.filter((c) => c.status === 'Active').length} active courses</p>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150"
            style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
          >
            Add course
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-2 rounded-lg px-3 h-9 flex-1 min-w-52 max-w-xs" style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}>
            <Search className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--muted-foreground)' }} />
            <input type="text" placeholder="Search course name or code…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="flex-1 bg-transparent text-sm outline-none" style={{ color: 'var(--foreground)' }} />
          </div>
          {[
            { val: dept,   set: (v: string) => { setDept(v);   setPage(1) }, opts: DEPARTMENTS },
            { val: status, set: (v: string) => { setStatus(v); setPage(1) }, opts: STATUSES    },
          ].map((f, i) => (
            <select key={i} value={f.val} onChange={(e) => f.set(e.target.value)}
              className="text-sm rounded-lg px-3 h-9 outline-none"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', cursor: 'pointer' }}
            >
              {f.opts.map((o) => <option key={o}>{o}</option>)}
            </select>
          ))}
        </div>

        {/* Table */}
        <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Code', 'Course Name', 'Department', 'Credits', 'Type', 'Assigned Lecturer', 'Enrolled', 'Status', ''].map((h) => (
                    <th key={h} className="t-label text-left" style={{ color: 'var(--muted-foreground)', padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((c, i) => {
                  const typeColors = c.type === 'Compulsory'
                    ? { bg: 'var(--info-bg)',  color: 'var(--info)'             }
                    : { bg: 'var(--muted)',    color: 'var(--muted-foreground)' }
                  const statusColors = c.status === 'Active'
                    ? { bg: 'var(--success-bg)', color: 'var(--success)' }
                    : { bg: 'var(--muted)',       color: 'var(--muted-foreground)' }
                  return (
                    <tr key={c.id} style={{ borderBottom: i < paginated.length - 1 ? '1px solid var(--border)' : 'none' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--muted)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '14px 16px' }}><span className="t-mono" style={{ color: 'var(--muted-foreground)' }}>{c.code}</span></td>
                      <td className="text-sm font-medium" style={{ color: 'var(--foreground)', padding: '14px 16px', minWidth: 200 }}>{c.name}</td>
                      <td className="text-sm" style={{ color: 'var(--muted-foreground)', padding: '14px 16px', whiteSpace: 'nowrap' }}>{c.department}</td>
                      <td className="text-sm" style={{ color: 'var(--muted-foreground)', padding: '14px 16px' }}>{c.credits}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span className="t-label px-2 py-0.5" style={{ backgroundColor: typeColors.bg, color: typeColors.color, borderRadius: 'var(--radius-sm)' }}>{c.type}</span>
                      </td>
                      <td className="text-sm" style={{ color: 'var(--muted-foreground)', padding: '14px 16px', whiteSpace: 'nowrap' }}>{c.lecturer}</td>
                      <td className="text-sm" style={{ color: 'var(--foreground)', padding: '14px 16px', fontWeight: 500 }}>{c.enrolled}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span className="t-label px-2 py-0.5" style={{ backgroundColor: statusColors.bg, color: statusColors.color, borderRadius: 'var(--radius-sm)' }}>{c.status}</span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(c)} title="Edit" className="flex items-center justify-center h-7 w-7 rounded-lg transition-colors duration-150"
                            style={{ border: '1px solid var(--border)', color: 'var(--muted-foreground)', backgroundColor: 'transparent', cursor: 'pointer' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)'; e.currentTarget.style.color = 'var(--foreground)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--muted-foreground)' }}
                          >
                            <Pencil style={{ width: 12, height: 12 }} />
                          </button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button title="Archive" className="flex items-center justify-center h-7 w-7 rounded-lg transition-colors duration-150"
                                style={{ border: '1px solid var(--border)', color: 'var(--muted-foreground)', backgroundColor: 'transparent', cursor: 'pointer' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--error-bg)'; e.currentTarget.style.color = 'var(--error)' }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--muted-foreground)' }}
                              >
                                <Archive style={{ width: 12, height: 12 }} />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Archive course?</AlertDialogTitle>
                                <AlertDialogDescription>Archive <strong>{c.name}</strong>? It will be hidden from active listings but preserved for historical records.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => setCourses((prev) => prev.map((x) => x.id === c.id ? { ...x, status: 'Archived' as const } : x))}>Archive</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2">
              <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>Show</span>
              <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
                className="text-sm rounded-lg px-2 h-8 outline-none"
                style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', cursor: 'pointer' }}
              >
                {PAGE_SIZE_OPTIONS.map((n) => <option key={n}>{n}</option>)}
              </select>
              <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>per page · {filtered.length} total</span>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)} className="h-8 w-8 rounded-lg text-sm transition-colors duration-150"
                  style={{ backgroundColor: p === page ? 'var(--foreground)' : 'transparent', color: p === page ? 'var(--ink-foreground)' : 'var(--muted-foreground)', border: 'none', cursor: 'pointer' }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ── Add/Edit Sheet ──────────────────────────────────────────────────── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="p-0 overflow-y-auto"
          style={{ width: 'min(860px, 55vw)', maxWidth: '100vw' }}
        >
          <SheetHeader className="px-8 py-6" style={{ borderBottom: '1px solid var(--border)' }}>
            <SheetTitle style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
              {editing ? `Edit Course — ${editing.code}` : 'Add Course'}
            </SheetTitle>
          </SheetHeader>
          <div className="px-8 py-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <FormField label="Course Code">
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. CSC 105"
                  className="w-full text-sm rounded-lg px-3 h-9 outline-none" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)' }} />
              </FormField>
              <FormField label="Credit Units">
                <input type="number" value={form.credits} onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })} min={1} max={9}
                  className="w-full text-sm rounded-lg px-3 h-9 outline-none" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)' }} />
              </FormField>
            </div>
            <FormField label="Course Name" className="mb-4">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Course title"
                className="w-full text-sm rounded-lg px-3 h-9 outline-none" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)' }} />
            </FormField>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <FormField label="Department">
                <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full text-sm rounded-lg px-3 h-9 outline-none" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)', cursor: 'pointer' }}>
                  {['Computer Science', 'Mathematics', 'Languages', 'Business'].map((d) => <option key={d}>{d}</option>)}
                </select>
              </FormField>
              <FormField label="Course Type">
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as CourseType })}
                  className="w-full text-sm rounded-lg px-3 h-9 outline-none" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)', cursor: 'pointer' }}>
                  <option value="Compulsory">Compulsory</option>
                  <option value="Elective">Elective</option>
                </select>
              </FormField>
            </div>
            <FormField label="Description" className="mb-4">
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Brief description of the course"
                className="w-full text-sm rounded-lg px-3 py-2 outline-none resize-none" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)' }} />
            </FormField>
            <FormField label="Assigned Lecturer" className="mb-4">
              <select value={form.lecturer} onChange={(e) => setForm({ ...form, lecturer: e.target.value })}
                className="w-full text-sm rounded-lg px-3 h-9 outline-none" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)', cursor: 'pointer' }}>
                <option value="">Select lecturer</option>
                {LECTURERS.map((l) => <option key={l.id} value={l.name}>{l.name}</option>)}
              </select>
            </FormField>
            <FormField label="Status" className="mb-8">
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'Active' | 'Inactive' })}
                className="w-full text-sm rounded-lg px-3 h-9 outline-none" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)', cursor: 'pointer' }}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </FormField>
            <div className="flex gap-3">
              <button onClick={() => setSheetOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150"
                style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'transparent', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                Cancel
              </button>
              <button onClick={() => setSheetOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
                style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
              >
                Save
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

    </AppShell>
  )
}

function FormField({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="t-label mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>{label}</label>
      {children}
    </div>
  )
}
