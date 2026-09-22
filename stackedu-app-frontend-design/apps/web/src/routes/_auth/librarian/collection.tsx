import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  LayoutDashboard, Library, BookMarked, Inbox, BarChart2, Bell,
  Eye, Pencil, Minus, BookOpen, Plus,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import {
  LIBRARIAN, CATALOGUE_RESOURCES, LIBRARY_COLLECTIONS,
  type CatalogueResource, type ResourceType, type ResourceStatus,
} from '@/data/librarian'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/librarian/collection')({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === 'string' ? search.id : 'ebooks',
  }),
  component: CollectionDetailPage,
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

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50]

// ─────────────────────────────────────────────────────────────────────────────

function CollectionDetailPage() {
  const { id } = Route.useSearch()

  const collection = LIBRARY_COLLECTIONS.find(c => c.id === id)
  const allResources = CATALOGUE_RESOURCES.filter(r => r.collection === id)

  const [resources,     setResources]     = useState<CatalogueResource[]>(allResources)
  const [selectedRow,   setSelectedRow]   = useState<CatalogueResource | null>(null)
  const [removeTarget,  setRemoveTarget]  = useState<CatalogueResource | null>(null)
  const [page,          setPage]          = useState(1)
  const [pageSize,      setPageSize]      = useState(10)

  const totalPages = Math.max(1, Math.ceil(resources.length / pageSize))
  const paginated  = resources.slice((page - 1) * pageSize, page * pageSize)

  const handleRemove = () => {
    if (!removeTarget) return
    setResources(prev => prev.filter(r => r.id !== removeTarget.id))
    toast.success(`"${removeTarget.title}" removed from collection.`)
    if (selectedRow?.id === removeTarget.id) setSelectedRow(null)
    setRemoveTarget(null)
  }

  if (!collection) {
    return (
      <AppShell
        navItems={LIBRARIAN_NAV}
        pageTitle="Collection"
        userName={LIBRARIAN.fullName}
        userRole="Librarian"
        userInitials={LIBRARIAN.initials}
        infoCardLabel="LIBRARIAN"
        infoCardValue="StackForgeAI University"
        infoCardSubtext="Library Services"
      >
        <div className="flex items-center justify-center h-full">
          <p style={{ color: 'var(--muted-foreground)' }}>Collection not found.</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell
      navItems={LIBRARIAN_NAV}
      pageTitle={collection.name}
      userName={LIBRARIAN.fullName}
      userRole="Librarian"
      userInitials={LIBRARIAN.initials}
      unreadCount={3}
      infoCardLabel="LIBRARIAN"
      infoCardValue="StackForgeAI University"
      infoCardSubtext="Library Services"
    >
      <div style={{ height: 'calc(100vh - var(--header-height))', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Page header */}
        <div className="flex-shrink-0 animate-fade-up" style={{ padding: '24px 32px 0' }}>
          <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--muted-foreground)', fontSize: '0.8125rem' }}>
            <span>Librarian</span><span>›</span>
            <Link to="/librarian/collections" style={{ color: 'var(--muted-foreground)' }} className="hover:opacity-70 transition-opacity">Collections</Link>
            <span>›</span>
            <span style={{ color: 'var(--foreground)' }}>{collection.name}</span>
          </div>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 40, height: 40, backgroundColor: collection.iconColor + '20' }}>
                <BookMarked size={18} style={{ color: collection.iconColor }} />
              </div>
              <h1 className="t-h1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>{collection.name}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">Edit collection</Button>
              <Button style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }} size="sm">
                <Plus size={14} style={{ marginRight: 6 }} />
                Add resources
              </Button>
            </div>
          </div>
        </div>

        {/* Two-column split */}
        <div className="flex flex-1 min-h-0">

          {/* Left — management table (60%) */}
          <div className="overflow-y-auto animate-fade-up" style={{ width: '60%', padding: '0 0 32px 32px' }}>
            <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              {/* Table header */}
              <div className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
                <span className="t-label flex-shrink-0" style={{ color: 'var(--muted-foreground)', width: 88 }}>TYPE</span>
                <span className="t-label flex-1" style={{ color: 'var(--muted-foreground)' }}>TITLE</span>
                <span className="t-label flex-shrink-0" style={{ color: 'var(--muted-foreground)', width: 48, textAlign: 'right' }}>VIEWS</span>
                <span className="t-label flex-shrink-0" style={{ color: 'var(--muted-foreground)', width: 80, textAlign: 'center' }}>STATUS</span>
                <span className="t-label flex-shrink-0" style={{ color: 'var(--muted-foreground)', width: 72, textAlign: 'center' }}>ACTIONS</span>
              </div>

              {paginated.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <BookOpen size={32} style={{ color: 'var(--muted-foreground)', marginBottom: 12 }} />
                  <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>No resources in this collection yet.</p>
                </div>
              ) : (
                paginated.map((r, i) => {
                  const ts = TYPE_STYLE[r.type] ?? { bg: 'var(--muted)', color: 'var(--muted-foreground)' }
                  const ss = STATUS_CONFIG[r.status]
                  const isSelected = selectedRow?.id === r.id
                  return (
                    <CollectionResourceRow
                      key={r.id}
                      resource={r}
                      isSelected={isSelected}
                      isLast={i === paginated.length - 1}
                      ts={ts}
                      ss={ss}
                      onSelect={() => setSelectedRow(isSelected ? null : r)}
                      onRemove={() => setRemoveTarget(r)}
                    />
                  )
                })
              )}

              {/* Pagination */}
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
                  <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>per page · {resources.length} total</span>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>← Prev</button>
                  <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{page} / {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}>Next →</button>
                </div>
              </div>
            </div>
          </div>

          {/* Right — student preview panel (40%) */}
          <div className="overflow-y-auto flex-1 animate-fade-up" style={{ borderLeft: '1px solid var(--border)', padding: '0 32px 32px 24px', animationDelay: '60ms' }}>
            {!selectedRow ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                <div className="flex items-center justify-center rounded-2xl mb-4" style={{ width: 60, height: 60, backgroundColor: 'var(--muted)' }}>
                  <BookOpen size={28} style={{ color: 'var(--muted-foreground)' }} />
                </div>
                <h3 className="t-h3 mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Select a resource</h3>
                <p className="t-body" style={{ color: 'var(--muted-foreground)', maxWidth: 280 }}>Click any row to preview how it appears to students.</p>
              </div>
            ) : (
              <div className="py-4">
                <div className="flex items-center gap-2 mb-4">
                  <Eye size={13} style={{ color: 'var(--muted-foreground)' }} />
                  <span className="t-label uppercase" style={{ color: 'var(--muted-foreground)', letterSpacing: '0.06em' }}>Student View Preview</span>
                </div>

                <div className="mb-5 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info)', borderRadius: 'var(--radius-md)' }}>
                  This is how students see this resource in the E-Library.
                </div>

                <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24 }}>
                  <span className="t-label px-2.5 py-1 inline-flex mb-4" style={{ backgroundColor: TYPE_STYLE[selectedRow.type]?.bg ?? 'var(--muted)', color: TYPE_STYLE[selectedRow.type]?.color ?? 'var(--muted-foreground)', borderRadius: 'var(--radius-sm)' }}>
                    {TYPE_BADGE_LABELS[selectedRow.type]}
                  </span>
                  <h3 className="mb-2" style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 600, color: 'var(--foreground)', lineHeight: 1.4 }}>
                    {selectedRow.title}
                  </h3>
                  <p className="t-body-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>{selectedRow.author}</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {selectedRow.subjects.map(s => (
                      <span key={s} className="t-label px-2 py-0.5" style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', borderRadius: 'var(--radius-sm)' }}>{s}</span>
                    ))}
                    <span className="t-label px-2 py-0.5" style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', borderRadius: 'var(--radius-sm)' }}>{selectedRow.year}</span>
                  </div>
                  <p className="text-sm mb-6" style={{ color: 'var(--foreground)', lineHeight: 1.65 }}>{selectedRow.description}</p>
                  <div className="flex gap-3">
                    <Button variant="outline" size="sm" className="flex-1" style={{ pointerEvents: 'none', opacity: 0.7 }}>Learn more</Button>
                    <Button size="sm" className="flex-1" style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', pointerEvents: 'none', opacity: 0.7 }}>Download</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Remove AlertDialog */}
      <AlertDialog open={removeTarget !== null} onOpenChange={open => { if (!open) setRemoveTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogTitle style={{ fontFamily: 'var(--font-display)' }}>
            Remove from collection?
          </AlertDialogTitle>
          <AlertDialogDescription>
            "{removeTarget?.title}" will be removed from {collection.name}. The resource will remain in the catalogue.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              style={{ backgroundColor: 'var(--error)', color: '#fff' }}
              onClick={handleRemove}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  )
}

// ── Collection resource row ───────────────────────────────────────────────────

function CollectionResourceRow({
  resource, isSelected, isLast, ts, ss, onSelect, onRemove,
}: {
  resource: CatalogueResource
  isSelected: boolean
  isLast: boolean
  ts: { bg: string; color: string }
  ss: { bg: string; color: string; label: string }
  onSelect: () => void
  onRemove: () => void
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
        <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{resource.title}</p>
        <p className="t-caption mt-0.5 truncate" style={{ color: 'var(--muted-foreground)' }}>{resource.author}</p>
      </div>
      <span className="t-caption flex-shrink-0" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted-foreground)', width: 48, textAlign: 'right' }}>{resource.accessCount}</span>
      <span className="t-label px-1.5 py-0.5 flex-shrink-0" style={{ backgroundColor: ss.bg, color: ss.color, borderRadius: 'var(--radius-sm)', fontSize: 9, width: 76, textAlign: 'center' }}>
        {ss.label}
      </span>
      <div className="flex items-center gap-0.5 flex-shrink-0" style={{ width: 72, justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
        <ColBtn icon={Eye}    title="Preview"           onClick={onSelect} />
        <ColBtn icon={Pencil} title="Edit"              onClick={() => {}} />
        <ColBtn icon={Minus}  title="Remove from collection" onClick={onRemove} danger />
      </div>
    </div>
  )
}

function ColBtn({ icon: Icon, title, onClick, danger }: { icon: React.ElementType; title: string; onClick: () => void; danger?: boolean }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="flex items-center justify-center rounded-md transition-colors"
      style={{ width: 24, height: 24, border: 'none', cursor: 'pointer', backgroundColor: hov ? (danger ? 'var(--error-bg)' : 'var(--muted)') : 'transparent', color: hov && danger ? 'var(--error)' : 'var(--muted-foreground)' }}
    >
      <Icon size={13} />
    </button>
  )
}
