import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import {
  LayoutDashboard, Library, BookMarked, Inbox, BarChart2, Bell,
  Eye, Pencil, Trash2,
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
  LIBRARIAN, LIBRARY_COLLECTIONS, CATALOGUE_RESOURCES,
  type LibraryCollection, type CollectionId,
} from '@/data/librarian'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/librarian/collections')({
  component: CollectionsPage,
})

const LIBRARIAN_NAV = [
  { label: 'Dashboard',          to: '/librarian/dashboard',    icon: LayoutDashboard },
  { label: 'Resource Catalogue', to: '/librarian/catalogue',    icon: Library         },
  { label: 'Collections',        to: '/librarian/collections',  icon: BookMarked      },
  { label: 'Resource Requests',  to: '/librarian/requests',     icon: Inbox           },
  { label: 'Analytics',          to: '/librarian/analytics',    icon: BarChart2       },
  { label: 'Notifications',      to: '/librarian/notifications', icon: Bell           },
]

const COLOR_OPTIONS = ['#0D9488', '#7C3AED', '#D97706', '#2563EB', '#16A34A', '#DC2626']

// ─────────────────────────────────────────────────────────────────────────────

function CollectionsPage() {
  const navigate = useNavigate()
  const [collections,   setCollections]   = useState<LibraryCollection[]>(LIBRARY_COLLECTIONS)
  const [sheetOpen,     setSheetOpen]     = useState(false)
  const [editTarget,    setEditTarget]    = useState<LibraryCollection | null>(null)
  const [deleteTarget,  setDeleteTarget]  = useState<LibraryCollection | null>(null)

  const openCreate = () => { setEditTarget(null); setSheetOpen(true) }
  const openEdit   = (c: LibraryCollection) => { setEditTarget(c); setSheetOpen(true) }

  const handleSave = (data: { name: string; description: string; iconColor: string; accessLevel: 'All Students' | 'Restricted' }) => {
    if (editTarget) {
      setCollections(prev => prev.map(c => c.id === editTarget.id ? { ...c, ...data, lastUpdated: 'Just now' } : c))
      toast.success('Collection updated.')
    } else {
      const newCol: LibraryCollection = {
        id: `col-${Date.now()}` as CollectionId,
        resourceCount: 0,
        lastUpdated: 'Just now',
        ...data,
      }
      setCollections(prev => [...prev, newCol])
      toast.success('Collection created.')
    }
    setSheetOpen(false)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    setCollections(prev => prev.filter(c => c.id !== deleteTarget.id))
    toast.success(`"${deleteTarget.name}" has been deleted.`)
    setDeleteTarget(null)
  }

  return (
    <AppShell
      navItems={LIBRARIAN_NAV}
      pageTitle="Collections"
      userName={LIBRARIAN.fullName}
      userRole="Librarian"
      userInitials={LIBRARIAN.initials}
      unreadCount={3}
      infoCardLabel="LIBRARIAN"
      infoCardValue="StackForgeAI University"
      infoCardSubtext="Library Services"
    >
      <div className="px-8 py-8 animate-fade-up" style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Page header */}
        <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--muted-foreground)', fontSize: '0.8125rem' }}>
          <span>Librarian</span><span>›</span>
          <span style={{ color: 'var(--foreground)' }}>Collections</span>
        </div>
        <div className="flex items-center justify-between mb-8">
          <h1 className="t-h1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Collections</h1>
          <Button style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }} onClick={openCreate}>
            Create collection
          </Button>
        </div>

        {/* Collections grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {collections.map((col, i) => (
            <CollectionCard
              key={col.id}
              collection={col}
              delay={i * 40}
              onView={() => navigate({ to: '/librarian/collection', search: { id: col.id } })}
              onEdit={() => openEdit(col)}
              onDelete={() => setDeleteTarget(col)}
            />
          ))}
        </div>
      </div>

      {/* Create / Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="p-0 border-l overflow-hidden flex flex-col" style={{ width: 'min(860px, 55vw)' }}>
          <CollectionFormSheet
            collection={editTarget}
            onSave={handleSave}
            onClose={() => setSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Delete AlertDialog */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogTitle style={{ fontFamily: 'var(--font-display)' }}>
            Delete "{deleteTarget?.name}"?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Resources will not be deleted — only removed from this collection. This action cannot be undone.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              style={{ backgroundColor: 'var(--error)', color: '#fff' }}
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  )
}

// ── Collection card ───────────────────────────────────────────────────────────

function CollectionCard({
  collection, delay, onView, onEdit, onDelete,
}: {
  collection: LibraryCollection
  delay: number
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="flex flex-col"
      style={{
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        border: '1px solid var(--border)',
        padding: 24,
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'box-shadow 150ms ease-out, transform 150ms ease-out',
        animation: `fade-up 250ms ${delay}ms cubic-bezier(0.16,1,0.3,1) both`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Icon circle */}
      <div
        className="flex items-center justify-center mb-4 flex-shrink-0"
        style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: collection.iconColor + '20' }}
      >
        <BookMarked size={20} style={{ color: collection.iconColor }} />
      </div>

      {/* Name */}
      <h3
        className="mb-1"
        style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 600, color: 'var(--foreground)', lineHeight: 1.4 }}
      >
        {collection.name}
      </h3>

      {/* Description */}
      <p
        className="flex-1 mb-4 truncate"
        style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', lineHeight: 1.6 }}
        title={collection.description}
      >
        {collection.description}
      </p>

      {/* Meta row */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className="t-label px-2 py-0.5"
          style={{ backgroundColor: 'rgba(32,244,78,0.08)', color: 'var(--brand)', borderRadius: 'var(--radius-sm)' }}
        >
          {collection.resourceCount} resources
        </span>
        <span
          className="t-label px-2 py-0.5"
          style={{
            backgroundColor: collection.accessLevel === 'All Students' ? 'var(--success-bg)' : 'var(--warning-bg)',
            color: collection.accessLevel === 'All Students' ? 'var(--success)' : 'var(--warning)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          {collection.accessLevel}
        </span>
      </div>

      <p className="t-caption mb-4" style={{ color: 'var(--muted-foreground)' }}>Updated {collection.lastUpdated}</p>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-1" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <CollectionActionBtn icon={Eye}    label="View contents" onClick={onView}   />
        <CollectionActionBtn icon={Pencil} label="Edit"          onClick={onEdit}   />
        <CollectionActionBtn icon={Trash2} label="Delete"        onClick={onDelete} danger />
      </div>
    </div>
  )
}

function CollectionActionBtn({ icon: Icon, label, onClick, danger }: { icon: React.ElementType; label: string; onClick: () => void; danger?: boolean }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      title={label}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="flex items-center justify-center rounded-md transition-colors"
      style={{
        width: 30, height: 30, border: 'none', cursor: 'pointer',
        backgroundColor: hov ? (danger ? 'var(--error-bg)' : 'var(--muted)') : 'transparent',
        color: hov && danger ? 'var(--error)' : 'var(--muted-foreground)',
      }}
    >
      <Icon size={14} />
    </button>
  )
}

// ── Collection form Sheet ─────────────────────────────────────────────────────

function CollectionFormSheet({
  collection, onSave, onClose,
}: {
  collection: LibraryCollection | null
  onSave: (data: { name: string; description: string; iconColor: string; accessLevel: 'All Students' | 'Restricted' }) => void
  onClose: () => void
}) {
  const [name,        setName]        = useState(collection?.name ?? '')
  const [description, setDescription] = useState(collection?.description ?? '')
  const [iconColor,   setIconColor]   = useState(collection?.iconColor ?? COLOR_OPTIONS[0])
  const [accessLevel, setAccessLevel] = useState<'All Students' | 'Restricted'>(collection?.accessLevel ?? 'All Students')
  const [search,      setSearch]      = useState('')
  const [selected,    setSelected]    = useState<Set<number>>(new Set())

  const filtered = CATALOGUE_RESOURCES.filter(r =>
    !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.author.toLowerCase().includes(search.toLowerCase())
  )

  const toggle = (id: number) => setSelected(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n
  })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600, color: 'var(--foreground)' }}>
          {collection ? 'Edit Collection' : 'Create Collection'}
        </h2>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label>Collection name</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. E-Books, Research Papers…" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Description</Label>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Brief description…" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Icon colour</Label>
          <div className="flex gap-2">
            {COLOR_OPTIONS.map(c => (
              <button
                key={c}
                onClick={() => setIconColor(c)}
                style={{
                  width: 28, height: 28, borderRadius: '50%', backgroundColor: c, border: 'none',
                  cursor: 'pointer', outline: iconColor === c ? `3px solid ${c}` : 'none',
                  outlineOffset: 2,
                }}
                aria-label={`Colour ${c}`}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Access level</Label>
          <select
            value={accessLevel}
            onChange={e => setAccessLevel(e.target.value as 'All Students' | 'Restricted')}
            style={{ height: 38, padding: '0 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)', fontSize: '0.875rem', outline: 'none' }}
          >
            <option value="All Students">All Students</option>
            <option value="Restricted">Restricted</option>
          </select>
        </div>

        {/* Resource selector */}
        <div className="flex flex-col gap-2">
          <Label>Add resources to collection</Label>
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search resources…"
          />
          <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--muted)' }}>
            {filtered.map((r, i) => (
              <label
                key={r.id}
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-[var(--card)] transition-colors"
                style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <input
                  type="checkbox"
                  checked={selected.has(r.id)}
                  onChange={() => toggle(r.id)}
                  style={{ accentColor: 'var(--brand)' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate" style={{ color: 'var(--foreground)' }}>{r.title}</p>
                  <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{r.author}</p>
                </div>
              </label>
            ))}
          </div>
          {selected.size > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {Array.from(selected).map(id => {
                const r = CATALOGUE_RESOURCES.find(x => x.id === id)!
                return (
                  <span key={id} className="flex items-center gap-1 t-label px-2 py-0.5" style={{ backgroundColor: 'var(--muted)', color: 'var(--foreground)', borderRadius: 'var(--radius-sm)' }}>
                    {r.title.length > 30 ? r.title.slice(0, 30) + '…' : r.title}
                    <button onClick={() => toggle(id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', padding: 0, lineHeight: 0 }}>
                      ×
                    </button>
                  </span>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid var(--border)' }}>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}
          onClick={() => onSave({ name, description, iconColor, accessLevel })}
        >
          Save collection
        </Button>
      </div>
    </div>
  )
}
