import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import {
  LayoutDashboard, Library, BookMarked, Inbox, BarChart2, Bell,
  BookOpen, FileText, GraduationCap, Book, Upload, CheckCircle2, X,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { LIBRARIAN, type ResourceType } from '@/data/librarian'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/librarian/add-resource')({
  component: AddResourcePage,
})

const LIBRARIAN_NAV = [
  { label: 'Dashboard',          to: '/librarian/dashboard',    icon: LayoutDashboard },
  { label: 'Resource Catalogue', to: '/librarian/catalogue',    icon: Library         },
  { label: 'Collections',        to: '/librarian/collections',  icon: BookMarked      },
  { label: 'Resource Requests',  to: '/librarian/requests',     icon: Inbox           },
  { label: 'Analytics',          to: '/librarian/analytics',    icon: BarChart2       },
  { label: 'Notifications',      to: '/librarian/notifications', icon: Bell           },
]

const TYPE_CARDS: { type: ResourceType; icon: React.ElementType; desc: string }[] = [
  { type: 'E-Book',         icon: BookOpen,     desc: 'Digital book file (PDF or ePub)'       },
  { type: 'Journal',        icon: FileText,     desc: 'Peer-reviewed academic journal'         },
  { type: 'Research Paper', icon: GraduationCap,desc: 'Thesis, dissertation or research paper' },
  { type: 'Course Pack',    icon: BookMarked,   desc: 'Lecturer-uploaded course materials'     },
  { type: 'Physical Book',  icon: Book,         desc: 'Physical copy available in the library' },
]

const DEPARTMENTS = ['Computer Science', 'Mathematics', 'Physics', 'Software Engineering', 'Engineering', 'EdTech', 'English', 'Research']

const GUIDANCE_TIPS = [
  'Use clear, full titles — students search by title and author',
  'Add subject tags to improve discoverability',
  'Set access restrictions carefully — restricted resources won\'t appear for ineligible students',
  'For physical books, keep stock count accurate to show correct availability',
  'PDF files under 10MB load faster for students on mobile data',
]

const TYPE_STYLE: Record<string, { bg: string; color: string }> = {
  'E-Book':         { bg: 'var(--info-bg)',           color: 'var(--info)'             },
  'Journal':        { bg: 'var(--success-bg)',         color: 'var(--success)'          },
  'Research Paper': { bg: 'var(--warning-bg)',         color: 'var(--warning)'          },
  'Course Pack':    { bg: 'rgba(32,244,78,0.12)',      color: 'var(--brand)'            },
  'Physical Book':  { bg: 'var(--muted)',              color: 'var(--muted-foreground)' },
}

// ─────────────────────────────────────────────────────────────────────────────

function AddResourcePage() {
  const navigate = useNavigate()

  const [type,         setType]         = useState<ResourceType>('E-Book')
  const [title,        setTitle]        = useState('')
  const [author,       setAuthor]       = useState('')
  const [publisher,    setPublisher]    = useState('')
  const [year,         setYear]         = useState(new Date().getFullYear())
  const [isbn,         setIsbn]         = useState('')
  const [departments,  setDepartments]  = useState<Set<string>>(new Set(['Computer Science']))
  const [subjectInput, setSubjectInput] = useState('')
  const [description,  setDescription]  = useState('')
  const [accessLevel,  setAccessLevel]  = useState('All Students')
  const [useExternalUrl, setUseExternalUrl] = useState(false)
  const [externalUrl,  setExternalUrl]  = useState('')
  const [fileName,     setFileName]     = useState('')
  const [uploadPct,    setUploadPct]    = useState(0)
  const [uploading,    setUploading]    = useState(false)
  const [stockCount,   setStockCount]   = useState(1)
  const [shelfLoc,     setShelfLoc]     = useState('')
  const [dewey,        setDewey]        = useState('')
  const [saving,       setSaving]       = useState(false)

  const isPhysical = type === 'Physical Book'
  const showIsbn   = type === 'E-Book' || type === 'Physical Book'

  const subjects   = subjectInput.split(',').map(s => s.trim()).filter(Boolean)

  const toggleDept = (d: string) => setDepartments(prev => {
    const n = new Set(prev); n.has(d) ? n.delete(d) : n.add(d); return n
  })

  const simulateUpload = (name: string) => {
    setFileName(name)
    setUploading(true)
    setUploadPct(0)
    const iv = setInterval(() => {
      setUploadPct(p => {
        if (p >= 100) { clearInterval(iv); setUploading(false); return 100 }
        return p + 20
      })
    }, 200)
  }

  const handlePublish = async (draft: boolean) => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    toast.success(draft ? 'Resource saved as draft.' : 'Resource published to catalogue.')
    navigate({ to: '/librarian/catalogue' })
  }

  return (
    <AppShell
      navItems={LIBRARIAN_NAV}
      pageTitle="Add Resource"
      userName={LIBRARIAN.fullName}
      userRole="Librarian"
      userInitials={LIBRARIAN.initials}
      unreadCount={3}
      infoCardLabel="LIBRARIAN"
      infoCardValue="StackForgeAI University"
      infoCardSubtext="Library Services"
    >
      <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--header-height))', overflow: 'hidden' }}>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 32px 120px' }}>

            {/* Breadcrumb + title */}
            <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--muted-foreground)', fontSize: '0.8125rem' }}>
              <span>Librarian</span><span>›</span>
              <Link to="/librarian/catalogue" style={{ color: 'var(--muted-foreground)' }} className="hover:opacity-70 transition-opacity">Resource Catalogue</Link>
              <span>›</span>
              <span style={{ color: 'var(--foreground)' }}>Add Resource</span>
            </div>
            <div className="flex items-center gap-4 mb-8">
              <Link to="/librarian/catalogue">
                <Button variant="outline" size="sm" style={{ gap: 6 }}>← Back</Button>
              </Link>
              <h1 className="t-h1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Add New Resource</h1>
            </div>

            {/* Two-column layout */}
            <div className="flex gap-8">

              {/* Left — form (60%) */}
              <div className="flex flex-col gap-0" style={{ flex: '0 0 60%' }}>

                {/* RESOURCE TYPE */}
                <Section label="RESOURCE TYPE">
                  <div className="grid grid-cols-3 gap-3">
                    {TYPE_CARDS.map(({ type: t, icon: Icon, desc }) => (
                      <button
                        key={t}
                        onClick={() => setType(t)}
                        className="flex flex-col items-start p-4 rounded-xl text-left transition-all"
                        style={{
                          border: type === t ? '2px solid var(--brand)' : '1px solid var(--border)',
                          backgroundColor: type === t ? 'rgba(32,244,78,0.05)' : 'var(--muted)',
                          cursor: 'pointer',
                        }}
                      >
                        <div className="flex items-center justify-center rounded-lg mb-3" style={{ width: 36, height: 36, backgroundColor: type === t ? 'rgba(32,244,78,0.12)' : 'var(--card)' }}>
                          <Icon size={16} style={{ color: type === t ? 'var(--brand)' : 'var(--muted-foreground)' }} />
                        </div>
                        <p className="text-sm font-semibold mb-0.5" style={{ color: type === t ? 'var(--brand)' : 'var(--foreground)' }}>{t}</p>
                        <p style={{ fontSize: 11, color: 'var(--muted-foreground)', lineHeight: 1.4 }}>{desc}</p>
                      </button>
                    ))}
                  </div>
                </Section>

                {/* BASIC DETAILS */}
                <Section label="BASIC DETAILS">
                  <div className="flex flex-col gap-3">
                    <FieldRow label="Title (full width)">
                      <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Full resource title" />
                    </FieldRow>
                    <div className="grid grid-cols-2 gap-3">
                      <FieldRow label="Author">
                        <Input value={author} onChange={e => setAuthor(e.target.value)} placeholder="Author name(s)" />
                      </FieldRow>
                      <FieldRow label="Publisher">
                        <Input value={publisher} onChange={e => setPublisher(e.target.value)} placeholder="Publisher name" />
                      </FieldRow>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <FieldRow label="Year">
                        <Input type="number" value={year} onChange={e => setYear(Number(e.target.value))} />
                      </FieldRow>
                      {showIsbn && (
                        <FieldRow label="ISBN">
                          <Input value={isbn} onChange={e => setIsbn(e.target.value)} placeholder="978-x-xxx-xxxxx-x" />
                        </FieldRow>
                      )}
                    </div>
                  </div>
                </Section>

                {/* CLASSIFICATION */}
                <Section label="CLASSIFICATION">
                  <div className="flex flex-col gap-3">
                    <FieldRow label="Department(s)">
                      <div className="flex flex-wrap gap-2">
                        {DEPARTMENTS.map(d => (
                          <button
                            key={d}
                            onClick={() => toggleDept(d)}
                            className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                            style={{
                              backgroundColor: departments.has(d) ? 'var(--brand)' : 'var(--muted)',
                              color: departments.has(d) ? 'var(--brand-ink)' : 'var(--muted-foreground)',
                              border: 'none', cursor: 'pointer',
                            }}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </FieldRow>
                    <FieldRow label="Subject Tags (comma-separated)">
                      <Input value={subjectInput} onChange={e => setSubjectInput(e.target.value)} placeholder="e.g. Algorithms, Computer Science, AI" />
                      {subjects.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {subjects.map(s => (
                            <span key={s} className="flex items-center gap-1 t-label px-2 py-0.5" style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', borderRadius: 'var(--radius-sm)' }}>
                              {s}
                              <button onClick={() => setSubjectInput(subjects.filter(x => x !== s).join(', '))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', padding: 0, lineHeight: 0, marginLeft: 2 }}>
                                <X size={10} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </FieldRow>
                    <FieldRow label="Description">
                      <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Describe the resource content for students…" />
                    </FieldRow>
                  </div>
                </Section>

                {/* ACCESS CONTROL */}
                <Section label="ACCESS CONTROL">
                  <div className="grid grid-cols-2 gap-2">
                    {['All Students', 'Restricted by Programme', 'Restricted by Year', 'Restricted by Department'].map(l => (
                      <button
                        key={l}
                        onClick={() => setAccessLevel(l)}
                        className="py-2.5 px-3 rounded-lg text-sm font-medium text-left transition-all"
                        style={{
                          border: accessLevel === l ? '2px solid var(--brand)' : '1px solid var(--border)',
                          backgroundColor: accessLevel === l ? 'rgba(32,244,78,0.06)' : 'var(--muted)',
                          color: accessLevel === l ? 'var(--brand)' : 'var(--foreground)',
                          cursor: 'pointer',
                        }}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </Section>

                {/* CONTENT (digital) or PHYSICAL BOOK DETAILS */}
                {isPhysical ? (
                  <Section label="PHYSICAL BOOK DETAILS">
                    <div className="grid grid-cols-2 gap-3">
                      <FieldRow label="Stock Count">
                        <Input type="number" value={stockCount} onChange={e => setStockCount(Number(e.target.value))} min={1} />
                      </FieldRow>
                      <FieldRow label="Available Count">
                        <Input value={stockCount} readOnly style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                      </FieldRow>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <FieldRow label="Shelf Location">
                        <Input value={shelfLoc} onChange={e => setShelfLoc(e.target.value)} placeholder="e.g. Shelf B4 · Floor 2" />
                      </FieldRow>
                      <FieldRow label="Dewey Decimal (optional)">
                        <Input value={dewey} onChange={e => setDewey(e.target.value)} placeholder="e.g. 005.1 COR" />
                      </FieldRow>
                    </div>
                  </Section>
                ) : (
                  <Section label="CONTENT">
                    {/* External URL toggle */}
                    <label className="flex items-center gap-2 mb-4 cursor-pointer">
                      <input type="checkbox" checked={useExternalUrl} onChange={e => setUseExternalUrl(e.target.checked)} style={{ accentColor: 'var(--brand)', width: 15, height: 15 }} />
                      <span className="text-sm" style={{ color: 'var(--foreground)' }}>Link to external resource instead</span>
                    </label>

                    {useExternalUrl ? (
                      <FieldRow label="External URL">
                        <Input type="url" value={externalUrl} onChange={e => setExternalUrl(e.target.value)} placeholder="https://…" />
                      </FieldRow>
                    ) : (
                      <div>
                        <div
                          className="flex flex-col items-center justify-center rounded-xl py-10 gap-3 text-center cursor-pointer transition-all"
                          style={{
                            border: '2px dashed var(--border)',
                            backgroundColor: 'var(--muted)',
                          }}
                          onClick={() => {
                            simulateUpload('resource-file.pdf')
                          }}
                        >
                          <div className="flex items-center justify-center rounded-xl" style={{ width: 48, height: 48, backgroundColor: 'var(--card)' }}>
                            <Upload size={20} style={{ color: 'var(--muted-foreground)' }} />
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                              {fileName ? fileName : 'Drag & drop or click to upload'}
                            </p>
                            <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                              PDF, ePub, MP4 · Max 50MB
                            </p>
                          </div>
                          {!fileName && <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); simulateUpload('resource-file.pdf') }}>Choose file</Button>}
                        </div>

                        {/* Upload progress */}
                        {fileName && (
                          <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm" style={{ color: 'var(--foreground)' }}>{fileName}</span>
                              <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{uploadPct}%</span>
                            </div>
                            <div className="rounded-full overflow-hidden" style={{ height: 4, backgroundColor: 'var(--border)' }}>
                              <div
                                style={{ width: `${uploadPct}%`, height: '100%', backgroundColor: 'var(--brand)', borderRadius: 9999, transition: 'width 200ms ease-out' }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Section>
                )}
              </div>

              {/* Right — guidance panel (40%) */}
              <div style={{ flex: '0 0 36%', position: 'sticky', top: 0, height: 'fit-content' }}>
                <div style={{ backgroundColor: 'var(--muted)', borderRadius: 'var(--radius-xl)', padding: 24, border: '1px solid var(--border)' }}>
                  <h3 className="mb-4" style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 600, color: 'var(--foreground)' }}>
                    Adding resources
                  </h3>
                  <div className="flex flex-col gap-3 mb-6">
                    {GUIDANCE_TIPS.map((tip, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 size={14} style={{ color: 'var(--brand)', flexShrink: 0, marginTop: 2 }} />
                        <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', lineHeight: 1.5 }}>{tip}</p>
                      </div>
                    ))}
                  </div>

                  {/* Live student preview */}
                  <p className="t-caption mb-3" style={{ color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Student preview</p>
                  <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', padding: 20 }}>
                    {(() => {
                      const ts = TYPE_STYLE[type]
                      const typeBadge = type === 'Physical Book' ? 'BOOK' : type.toUpperCase()
                      return (
                        <>
                          <span className="t-label px-2.5 py-1 inline-flex mb-3" style={{ backgroundColor: ts.bg, color: ts.color, borderRadius: 'var(--radius-sm)', fontSize: 10 }}>
                            {typeBadge}
                          </span>
                          <h4
                            className="mb-1"
                            style={{ fontFamily: 'var(--font-display)', fontSize: '0.9375rem', fontWeight: 600, color: 'var(--foreground)', lineHeight: 1.4, minHeight: 24 }}
                          >
                            {title || <span style={{ color: 'var(--muted-foreground)', fontStyle: 'italic' }}>Resource title</span>}
                          </h4>
                          <p className="t-caption mb-3" style={{ color: 'var(--muted-foreground)', minHeight: 18 }}>
                            {author || <span style={{ fontStyle: 'italic' }}>Author name</span>}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {subjects.length > 0
                              ? subjects.map(s => <span key={s} className="t-label px-2 py-0.5" style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', borderRadius: 'var(--radius-sm)' }}>{s}</span>)
                              : <span className="t-label px-2 py-0.5" style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', borderRadius: 'var(--radius-sm)', fontStyle: 'italic' }}>Tags</span>
                            }
                            <span className="t-label px-2 py-0.5" style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', borderRadius: 'var(--radius-sm)' }}>{year}</span>
                          </div>
                          <p style={{ fontSize: '0.8125rem', color: 'var(--foreground)', lineHeight: 1.6, minHeight: 40 }}>
                            {description || <span style={{ color: 'var(--muted-foreground)', fontStyle: 'italic' }}>Resource description will appear here…</span>}
                          </p>
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky bottom action bar */}
        <div
          className="flex-shrink-0 flex items-center justify-between gap-4"
          style={{ padding: '16px 32px', borderTop: '1px solid var(--border)', backgroundColor: 'var(--background)', zIndex: 10 }}
        >
          <Link to="/librarian/catalogue" className="text-sm transition-opacity hover:opacity-70" style={{ color: 'var(--muted-foreground)' }}>
            Cancel
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => handlePublish(true)} disabled={saving}>
              Save as draft
            </Button>
            <Button
              style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}
              onClick={() => handlePublish(false)}
              disabled={saving}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving…
                </span>
              ) : 'Save and publish'}
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="pb-6 mb-6" style={{ borderBottom: '1px solid var(--border)' }}>
      <p className="t-label mb-4" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
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
