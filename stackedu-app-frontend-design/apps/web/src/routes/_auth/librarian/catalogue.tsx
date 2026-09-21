import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  LayoutDashboard, Library, BookMarked, Inbox, BarChart2, Bell,
  Search, Eye, Pencil, Archive, BookOpen, X, Upload, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import {
  AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import {
  LIBRARIAN, CATALOGUE_RESOURCES, type CatalogueResource, type ResourceType, type ResourceStatus,
} from '@/data/librarian'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/librarian/catalogue')({
  component: CataloguePage,
})

const LIBRARIAN_NAV = [
  { label: 'Dashboard',          to: '/librarian/dashboard',    icon: LayoutDashboard },
  { label: 'Resource Catalogue', to: '/librarian/catalogue',    icon: Library         },
  { label: 'Collections',        to: '/librarian/collections',  icon: BookMarked      },
  { label: 'Resource Requests',  to: '/librarian/requests',     icon: Inbox           },
  { label: 'Analytics',          to: '/librarian/analytics',    icon: BarChart2       },
  { label: 'Notifications',      to: '/librarian/notifications', icon: Bell           },
]

const TYPE_STYLE: Record<string, { bg: string; color: string }> = {
  'E-Book':         { bg: 'var(--info-bg)',      color: 'var(--info)'             },
  'Journal':        { bg: 'var(--success-bg)',   color: 'var(--success)'          },
  'Research Paper': { bg: 'var(--warning-bg)',   color: 'var(--warning)'          },
  'Course Pack':    { bg: 'rgba(32,244,78,0.12)',color: 'var(--brand)'            },
  'Physical Book':  { bg: 'var(--muted)',        color: 'var(--muted-foreground)' },
}

const STATUS_CONFIG: Record<ResourceStatus, { bg: string; color: string; label: string }> = {
  'Active':     { bg: 'var(--success-bg)', color: 'var(--success)',          label: 'Available'  },
  'Restricted': { bg: 'var(--warning-bg)', color: 'var(--warning)',          label: 'Restricted' },
  'Archived':   { bg: 'var(--muted)',      color: 'var(--muted-foreground)', label: 'Archived'   },
  'On Loan':    { bg: 'var(--error-bg)',   color: 'var(--error)',            label: 'On Loan'    },
}

const TYPE_BADGE_LABELS: Record<ResourceType, string> = {
  'E-Book':         'E-BOOK',
  'Journal':        'JOURNAL',
  'Research Paper': 'RESEARCH PAPER',
  'Course Pack':    'COURSE PACK',
  'Physical Book':  'BOOK',
}

const DEPARTMENTS = ['All Departments', 'Computer Science', 'Mathematics', 'Physics', 'Software Engineering', 'Engineering', 'EdTech']
const PAGE_SIZE_OPTIONS = [5, 10, 25, 50]

// ─────────────────────────────────────────────────────────────────────────────

function CataloguePage() {
  const [resources,      setResources]      = useState<CatalogueResource[]>(CATALOGUE_RESOURCES)
  const [search,         setSearch]         = useState('')
  const [typeFilter,     setTypeFilter]     = useState('All Types')
  const [deptFilter,     setDeptFilter]     = useState('All Departments')
  const [statusFilter,   setStatusFilter]   = useState('All')
  const [selectedRow,    setSelectedRow]    = useState<CatalogueResource | null>(null)
  const [sheetOpen,      setSheetOpen]      = useState(false)
  const [editTarget,     setEditTarget]     = useState<CatalogueResource | null>(null)
  const [archiveTarget,  setArchiveTarget]  = useState<CatalogueResource | null>(null)
  const [page,           setPage]           = useState(1)
  const [pageSize,       setPageSize]       = useState(10)

  const filtered = resources.filter(r => {
    const q = search.toLowerCase()
    const matchQ    = !q || r.title.toLowerCase().includes(q) || r.author.toLowerCase().includes(q)
    const matchType = typeFilter === 'All Types' || r.type === typeFilter
    const matchDept = deptFilter === 'All Departments' || r.department === deptFilter
    const matchStat = statusFilter === 'All' || r.status === statusFilter
    return matchQ && matchType && matchDept && matchStat
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize)

  const openAdd  = () => { setEditTarget(null); setSheetOpen(true) }
  const openEdit = (r: CatalogueResource) => { setEditTarget(r); setSheetOpen(true) }

  const handleArchive = () => {
    if (!archiveTarget) return
    setResources(prev => prev.map(r => r.id === archiveTarget.id ? { ...r, status: 'Archived' } : r))
    toast.success(`"${archiveTarget.title}" has been archived.`)
    setArchiveTarget(null)
    if (selectedRow?.id === archiveTarget.id) setSelectedRow(null)
  }

  const handleSave = (data: Partial<CatalogueResource>) => {
    if (editTarget) {
      setResources(prev => prev.map(r => r.id === editTarget.id ? { ...r, ...data } : r))
      toast.success('Resource updated.')
    } else {
      const newResource: CatalogueResource = {
        id: Date.now(), type: 'E-Book', title: '', author: '', publisher: '',
        department: 'Computer Science', year: 2025, subjects: [], description: '',
        accessCount: 0, status: 'Active', dateAdded: 'Today', collection: 'ebooks',
        ...data,
      }
      setResources(prev => [newResource, ...prev])
      toast.success('Resource added to catalogue.')
    }
    setSheetOpen(false)
  }

  const resetPage = () => setPage(1)

  return (
    <AppShell
      navItems={LIBRARIAN_NAV}
      pageTitle="Resource Catalogue"
      userName={LIBRARIAN.fullName}
      userRole="Librarian"
      userInitials={LIBRARIAN.initials}
      unreadCount={3}
      infoCardLabel="LIBRARIAN"
      infoCardValue="StackForgeAI University"
      infoCardSubtext="Library Services"
    >
      <div style={{ height: 'calc(100vh - var(--header-height))', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* ── Page header ───────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 animate-fade-up" style={{ padding: '24px 32px 0' }}>
          <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--muted-foreground)', fontSize: '0.8125rem' }}>
            <span>Librarian</span>
            <span>›</span>
            <span style={{ color: 'var(--foreground)' }}>Resource Catalogue</span>
          </div>
          <div className="flex items-center justify-between mb-5">
            <h1 className="t-h1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Resource Catalogue</h1>
            <Button
              style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}
              onClick={openAdd}
            >
              Add resource
            </Button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <div
              className="flex items-center gap-2 flex-1"
              style={{ minWidth: 200, backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0 12px', height: 38 }}
            >
              <Search size={14} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
              <input
                type="text" placeholder="Search by title or author…"
                value={search}
                onChange={e => { setSearch(e.target.value); resetPage() }}
                className="flex-1 bg-transparent outline-none"
                style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}
              />
              {search && (
                <button onClick={() => { setSearch(''); resetPage() }} style={{ color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer', padding: 2, lineHeight: 0 }}>
                  <X size={12} />
                </button>
              )}
            </div>
            {[
              { value: typeFilter,   setter: (v: string) => { setTypeFilter(v);   resetPage() }, options: ['All Types', 'E-Book', 'Journal', 'Research Paper', 'Course Pack', 'Physical Book'] },
              { value: deptFilter,   setter: (v: string) => { setDeptFilter(v);   resetPage() }, options: DEPARTMENTS },
              { value: statusFilter, setter: (v: string) => { setStatusFilter(v); resetPage() }, options: ['All', 'Active', 'Restricted', 'Archived'] },
            ].map((f, fi) => (
              <select
                key={fi}
                value={f.value}
                onChange={e => f.setter(e.target.value)}
                style={{
                  height: 38, padding: '0 10px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)', backgroundColor: 'var(--card)',
                  color: 'var(--foreground)', fontSize: '0.875rem', cursor: 'pointer', outline: 'none',
                }}
              >
                {f.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ))}
          </div>
        </div>

        {/* ── Two-column split ──────────────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0">

          {/* Left — management table (60%) */}
          <div className="overflow-y-auto animate-fade-up" style={{ width: '60%', padding: '0 0 32px 32px' }}>
            <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              {/* Table header */}
              <div
                className="flex items-center gap-3 px-4 py-2.5"
                style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}
              >
                <span className="t-label flex-shrink-0" style={{ color: 'var(--muted-foreground)', width: 88 }}>TYPE</span>
                <span className="t-label flex-1" style={{ color: 'var(--muted-foreground)' }}>TITLE</span>
                <span className="t-label flex-shrink-0 hidden xl:block" style={{ color: 'var(--muted-foreground)', width: 80 }}>DEPT</span>
                <span className="t-label flex-shrink-0" style={{ color: 'var(--muted-foreground)', width: 48, textAlign: 'right' }}>VIEWS</span>
                <span className="t-label flex-shrink-0" style={{ color: 'var(--muted-foreground)', width: 80, textAlign: 'center' }}>STATUS</span>
                <span className="t-label flex-shrink-0" style={{ color: 'var(--muted-foreground)', width: 72, textAlign: 'center' }}>ACTIONS</span>
              </div>

              {paginated.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <BookOpen size={32} style={{ color: 'var(--muted-foreground)', marginBottom: 12 }} />
                  <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>No resources match your filters.</p>
                </div>
              ) : (
                paginated.map((r, i) => {
                  const ts = TYPE_STYLE[r.type] ?? { bg: 'var(--muted)', color: 'var(--muted-foreground)' }
                  const ss = STATUS_CONFIG[r.status]
                  const isSelected = selectedRow?.id === r.id
                  return (
                    <ResourceRow
                      key={r.id}
                      resource={r}
                      isSelected={isSelected}
                      isLast={i === paginated.length - 1}
                      ts={ts}
                      ss={ss}
                      onSelect={() => setSelectedRow(isSelected ? null : r)}
                      onEdit={() => openEdit(r)}
                      onArchive={() => setArchiveTarget(r)}
                    />
                  )
                })
              )}

              {/* Pagination footer */}
              <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
                <div className="flex items-center gap-2">
                  <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>Show</span>
                  <select
                    value={pageSize}
                    onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
                    style={{ height: 28, padding: '0 6px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', fontSize: '0.8125rem', cursor: 'pointer', outline: 'none' }}
                  >
                    {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>per page · {filtered.length} total</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="flex items-center justify-center rounded-md" style={{ width: 28, height: 28, border: '1px solid var(--border)', backgroundColor: 'var(--card)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>
                    <ChevronLeft size={13} />
                  </button>
                  <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
                    {page} / {totalPages}
                  </span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex items-center justify-center rounded-md" style={{ width: 28, height: 28, border: '1px solid var(--border)', backgroundColor: 'var(--card)', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right — student preview panel (40%) */}
          <div className="overflow-y-auto flex-1 animate-fade-up" style={{ borderLeft: '1px solid var(--border)', padding: '0 32px 32px 24px', animationDelay: '60ms' }}>
            <StudentPreviewPanel resource={selectedRow} />
          </div>
        </div>
      </div>

      {/* Add / Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="p-0 border-l overflow-hidden flex flex-col" style={{ width: 'min(860px, 55vw)' }}>
          <ResourceFormSheet
            resource={editTarget}
            onSave={handleSave}
            onClose={() => setSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Archive AlertDialog */}
      <AlertDialog open={archiveTarget !== null} onOpenChange={open => { if (!open) setArchiveTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogTitle style={{ fontFamily: 'var(--font-display)' }}>
            Archive "{archiveTarget?.title}"?
          </AlertDialogTitle>
          <AlertDialogDescription>
            It will no longer appear in the student E-Library but can be restored at any time.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              style={{ backgroundColor: 'var(--warning)', color: '#fff' }}
              onClick={handleArchive}
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  )
}

// ── Resource row ──────────────────────────────────────────────────────────────

function ResourceRow({
  resource, isSelected, isLast, ts, ss, onSelect, onEdit, onArchive,
}: {
  resource: CatalogueResource
  isSelected: boolean
  isLast: boolean
  ts: { bg: string; color: string }
  ss: { bg: string; color: string; label: string }
  onSelect: () => void
  onEdit: () => void
  onArchive: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="flex items-center gap-3 px-4 cursor-pointer"
      style={{
        paddingTop: 14, paddingBottom: 14,
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        backgroundColor: isSelected ? 'rgba(32,244,78,0.04)' : hovered ? 'var(--muted)' : 'transparent',
        borderLeft: isSelected ? '3px solid var(--brand)' : '3px solid transparent',
        transition: 'background-color 100ms ease-out',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onSelect}
    >
      <span className="t-label px-1.5 py-0.5 flex-shrink-0" style={{ backgroundColor: ts.bg, color: ts.color, borderRadius: 'var(--radius-sm)', fontSize: 9, width: 82, textAlign: 'center' }}>
        {TYPE_BADGE_LABELS[resource.type]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)', fontFamily: 'Inter, sans-serif' }}>{resource.title}</p>
        <p className="t-caption mt-0.5 truncate" style={{ color: 'var(--muted-foreground)' }}>{resource.author}</p>
      </div>
      <span className="t-caption flex-shrink-0 hidden xl:block" style={{ color: 'var(--muted-foreground)', width: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{resource.department}</span>
      <span className="t-caption flex-shrink-0" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted-foreground)', width: 48, textAlign: 'right' }}>{resource.accessCount}</span>
      <span className="t-label px-1.5 py-0.5 flex-shrink-0" style={{ backgroundColor: ss.bg, color: ss.color, borderRadius: 'var(--radius-sm)', fontSize: 9, width: 76, textAlign: 'center' }}>
        {ss.label}
      </span>
      <div className="flex items-center gap-0.5 flex-shrink-0" style={{ width: 72, justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
        <ActionBtn icon={Eye}     label="Preview" onClick={onSelect} />
        <ActionBtn icon={Pencil}  label="Edit"    onClick={onEdit}   />
        <ActionBtn icon={Archive} label="Archive" onClick={onArchive} />
      </div>
    </div>
  )
}

function ActionBtn({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="flex items-center justify-center rounded-md transition-colors hover:bg-[var(--muted)]"
      style={{ width: 24, height: 24, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}
    >
      <Icon size={13} />
    </button>
  )
}

// ── Student Preview Panel ─────────────────────────────────────────────────────

function StudentPreviewPanel({ resource }: { resource: CatalogueResource | null }) {
  if (!resource) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center">
        <div className="flex items-center justify-center rounded-2xl mb-4" style={{ width: 60, height: 60, backgroundColor: 'var(--muted)' }}>
          <BookOpen size={28} style={{ color: 'var(--muted-foreground)' }} />
        </div>
        <h3 className="t-h3 mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Select a resource</h3>
        <p className="t-body" style={{ color: 'var(--muted-foreground)', maxWidth: 280 }}>Click any row to preview how it appears to students in the E-Library.</p>
      </div>
    )
  }

  const ts = TYPE_STYLE[resource.type] ?? { bg: 'var(--muted)', color: 'var(--muted-foreground)' }

  return (
    <div className="py-4">
      {/* Label */}
      <div className="flex items-center gap-2 mb-4">
        <Eye size={13} style={{ color: 'var(--muted-foreground)' }} />
        <span className="t-label uppercase" style={{ color: 'var(--muted-foreground)', letterSpacing: '0.06em' }}>Student View Preview</span>
      </div>

      {/* Info banner */}
      <div
        className="mb-5 px-4 py-3 rounded-xl text-sm"
        style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info)', border: '1px solid var(--info)', borderRadius: 'var(--radius-md)' }}
      >
        This is how students see this resource in the E-Library.
      </div>

      {/* Resource card preview */}
      <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24 }}>
        {/* Type badge */}
        <span className="t-label px-2.5 py-1 inline-flex mb-4" style={{ backgroundColor: ts.bg, color: ts.color, borderRadius: 'var(--radius-sm)' }}>
          {TYPE_BADGE_LABELS[resource.type]}
        </span>

        {/* Title */}
        <h3
          className="mb-2"
          style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 600, color: 'var(--foreground)', lineHeight: 1.4, letterSpacing: '-0.01em' }}
        >
          {resource.title}
        </h3>

        {/* Author */}
        <p className="t-body-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>{resource.author}</p>

        {/* Subject tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {resource.subjects.map(s => (
            <span key={s} className="t-label px-2 py-0.5" style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', borderRadius: 'var(--radius-sm)' }}>{s}</span>
          ))}
          <span className="t-label px-2 py-0.5" style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', borderRadius: 'var(--radius-sm)' }}>{resource.year}</span>
        </div>

        {/* Description */}
        <p className="text-sm mb-6" style={{ color: 'var(--foreground)', lineHeight: 1.65 }}>{resource.description}</p>

        {/* Action buttons (non-functional, display only) */}
        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="flex-1" style={{ pointerEvents: 'none', opacity: 0.7 }}>Learn more</Button>
          <Button size="sm" className="flex-1" style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', pointerEvents: 'none', opacity: 0.7 }}>Download</Button>
        </div>
      </div>
    </div>
  )
}

// ── Resource form Sheet ───────────────────────────────────────────────────────

function ResourceFormSheet({
  resource, onSave, onClose,
}: {
  resource: CatalogueResource | null
  onSave: (data: Partial<CatalogueResource>) => void
  onClose: () => void
}) {
  const [type,         setType]         = useState<ResourceType>(resource?.type ?? 'E-Book')
  const [title,        setTitle]        = useState(resource?.title ?? '')
  const [author,       setAuthor]       = useState(resource?.author ?? '')
  const [publisher,    setPublisher]    = useState(resource?.publisher ?? '')
  const [year,         setYear]         = useState(resource?.year ?? new Date().getFullYear())
  const [isbn,         setIsbn]         = useState(resource?.isbn ?? '')
  const [department,   setDepartment]   = useState(resource?.department ?? 'Computer Science')
  const [subjectInput, setSubjectInput] = useState((resource?.subjects ?? []).join(', '))
  const [description,  setDescription]  = useState(resource?.description ?? '')
  const [accessLevel,  setAccessLevel]  = useState('All Students')
  const [stockCount,   setStockCount]   = useState(resource?.stockCount ?? 1)
  const [shelfLoc,     setShelfLoc]     = useState(resource?.shelfLocation ?? '')
  const [statusActive, setStatusActive] = useState(resource?.status !== 'Archived')

  const isPhysical = type === 'Physical Book'
  const showIsbn   = type === 'E-Book' || type === 'Physical Book'

  const handleSave = () => {
    onSave({
      type, title, author, publisher, year,
      isbn: showIsbn ? isbn : undefined,
      department,
      subjects: subjectInput.split(',').map(s => s.trim()).filter(Boolean),
      description,
      status: statusActive ? 'Active' : 'Archived',
      stockCount:    isPhysical ? stockCount : undefined,
      shelfLocation: isPhysical ? shelfLoc : undefined,
    })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600, color: 'var(--foreground)', letterSpacing: '-0.01em' }}>
          {resource ? 'Edit Resource' : 'Add New Resource'}
        </h2>
        <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
          {resource ? 'Update the resource details below.' : 'Fill in the details to add a resource to the catalogue.'}
        </p>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="flex flex-col gap-5">

          {/* Resource type */}
          <FormSection label="RESOURCE TYPE">
            <div className="grid grid-cols-3 gap-2">
              {(['E-Book', 'Journal', 'Research Paper', 'Course Pack', 'Physical Book'] as ResourceType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className="py-2.5 px-3 rounded-lg text-sm font-medium text-left transition-all"
                  style={{
                    border: type === t ? '2px solid var(--brand)' : '1px solid var(--border)',
                    backgroundColor: type === t ? 'rgba(32,244,78,0.06)' : 'var(--muted)',
                    color: type === t ? 'var(--brand)' : 'var(--foreground)',
                    cursor: 'pointer',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </FormSection>

          {/* Basic details */}
          <FormSection label="BASIC DETAILS">
            <div className="flex flex-col gap-3">
              <FieldRow label="Title">
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Full resource title" />
              </FieldRow>
              <FieldRow label="Author">
                <Input value={author} onChange={e => setAuthor(e.target.value)} placeholder="Author name(s)" />
              </FieldRow>
              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="Publisher">
                  <Input value={publisher} onChange={e => setPublisher(e.target.value)} />
                </FieldRow>
                <FieldRow label="Year">
                  <Input type="number" value={year} onChange={e => setYear(Number(e.target.value))} />
                </FieldRow>
              </div>
              {showIsbn && (
                <FieldRow label="ISBN">
                  <Input value={isbn} onChange={e => setIsbn(e.target.value)} placeholder="978-x-xxx-xxxxx-x" />
                </FieldRow>
              )}
            </div>
          </FormSection>

          {/* Classification */}
          <FormSection label="CLASSIFICATION">
            <div className="flex flex-col gap-3">
              <FieldRow label="Department">
                <select
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)', fontSize: '0.875rem', outline: 'none' }}
                >
                  {DEPARTMENTS.filter(d => d !== 'All Departments').map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </FieldRow>
              <FieldRow label="Subject Tags">
                <Input
                  value={subjectInput}
                  onChange={e => setSubjectInput(e.target.value)}
                  placeholder="Comma-separated, e.g. Algorithms, Computer Science"
                />
                {subjectInput && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {subjectInput.split(',').map(s => s.trim()).filter(Boolean).map(s => (
                      <span key={s} className="t-label px-2 py-0.5" style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', borderRadius: 'var(--radius-sm)' }}>{s}</span>
                    ))}
                  </div>
                )}
              </FieldRow>
              <FieldRow label="Description">
                <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Brief description of the resource content…" />
              </FieldRow>
            </div>
          </FormSection>

          {/* Access Control */}
          <FormSection label="ACCESS CONTROL">
            <select
              value={accessLevel}
              onChange={e => setAccessLevel(e.target.value)}
              style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)', fontSize: '0.875rem', outline: 'none' }}
            >
              {['All Students', 'Restricted by Programme', 'Restricted by Year', 'Restricted by Department'].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </FormSection>

          {/* Physical Book Details */}
          {isPhysical ? (
            <FormSection label="PHYSICAL BOOK DETAILS">
              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="Stock Count">
                  <Input type="number" value={stockCount} onChange={e => setStockCount(Number(e.target.value))} min={1} />
                </FieldRow>
                <FieldRow label="Shelf Location">
                  <Input value={shelfLoc} onChange={e => setShelfLoc(e.target.value)} placeholder="e.g. Shelf B4 · Floor 2" />
                </FieldRow>
              </div>
            </FormSection>
          ) : (
            <FormSection label="CONTENT">
              <div
                className="flex flex-col items-center justify-center rounded-xl py-10 gap-3 text-center"
                style={{ border: '2px dashed var(--border)', backgroundColor: 'var(--muted)' }}
              >
                <div className="flex items-center justify-center rounded-xl" style={{ width: 44, height: 44, backgroundColor: 'var(--card)' }}>
                  <Upload size={20} style={{ color: 'var(--muted-foreground)' }} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Upload file</p>
                  <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>PDF or ePub · Max 50MB</p>
                </div>
                <Button variant="outline" size="sm">Choose file</Button>
              </div>
            </FormSection>
          )}

          {/* Status */}
          <FormSection label="STATUS">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStatusActive(true)}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ border: statusActive ? '2px solid var(--brand)' : '1px solid var(--border)', backgroundColor: statusActive ? 'rgba(32,244,78,0.06)' : 'var(--muted)', color: statusActive ? 'var(--brand)' : 'var(--foreground)', cursor: 'pointer' }}
              >
                Active
              </button>
              <button
                onClick={() => setStatusActive(false)}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ border: !statusActive ? '2px solid var(--muted-foreground)' : '1px solid var(--border)', backgroundColor: !statusActive ? 'var(--muted)' : 'var(--muted)', color: 'var(--foreground)', cursor: 'pointer' }}
              >
                Archived
              </button>
            </div>
          </FormSection>
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid var(--border)' }}>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }} onClick={handleSave}>
          Save resource
        </Button>
      </div>
    </div>
  )
}

function FormSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
      <p className="t-label mb-3" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
      {children}
    </div>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label style={{ fontSize: '0.8125rem', color: 'var(--foreground)' }}>{label}</Label>
      {children}
    </div>
  )
}
