import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  LayoutDashboard, BookOpen, BarChart2, Bell, ClipboardList,
  FileText, TrendingUp, Upload, Plus, Trash2, Pin,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  LECTURER, LECTURER_COURSES, COURSE_MATERIALS, ANNOUNCEMENTS,
  type CourseMaterial, type CourseAnnouncement,
} from '@/data/lecturer'

export const Route = createFileRoute('/_auth/lecturer/course-management')({
  component: CourseManagementPage,
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

const TYPE_BADGE: Record<CourseMaterial['type'], { bg: string; color: string }> = {
  PDF:  { bg: 'var(--error-bg)',   color: 'var(--error)'   },
  PPTX: { bg: 'var(--warning-bg)', color: 'var(--warning)' },
  DOCX: { bg: 'var(--info-bg)',    color: 'var(--info)'    },
  ZIP:  { bg: 'var(--muted)',      color: 'var(--muted-foreground)' },
}

// ─────────────────────────────────────────────────────────────────────────────

function CourseManagementPage() {
  const [courseId,       setCourseId]       = useState(LECTURER_COURSES[0].id)
  const [uploadOpen,     setUploadOpen]     = useState(false)
  const [announceOpen,   setAnnounceOpen]   = useState(false)
  const [materials,      setMaterials]      = useState<CourseMaterial[]>(COURSE_MATERIALS)
  const [announcements,  setAnnouncements]  = useState<CourseAnnouncement[]>(ANNOUNCEMENTS)

  const filteredMaterials = materials.filter(m => m.courseId === courseId)
  const filteredAnnouncements = announcements.filter(a => a.courseId === courseId)

  const deleteMaterial = (id: number) => {
    setMaterials(prev => prev.filter(m => m.id !== id))
    toast.success('Material deleted')
  }

  return (
    <AppShell
      navItems={LECTURER_NAV}
      pageTitle="Course Management"
      userName={LECTURER.fullName}
      userRole="Lecturer"
      userInitials={LECTURER.initials}
      unreadCount={3}
      infoCardLabel="LECTURER ID"
      infoCardValue={LECTURER.id}
      infoCardSubtext={LECTURER.department}
    >
      <div className="animate-fade-up" style={{ padding: '32px 32px 56px', maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Course Management</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Manage materials and announcements for your courses.</p>
          </div>
          <Select value={courseId} onValueChange={setCourseId}>
            <SelectTrigger className="w-60"><SelectValue /></SelectTrigger>
            <SelectContent>
              {LECTURER_COURSES.map(c => <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* ── Materials section ────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Materials</h2>
            <Button onClick={() => setUploadOpen(true)} style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', gap: 6 }}>
              <Upload style={{ width: 14, height: 14 }} /> Upload material
            </Button>
          </div>

          <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            {filteredMaterials.length === 0 && (
              <div className="py-12 text-center">
                <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>No materials uploaded for this course.</p>
              </div>
            )}
            {filteredMaterials.map((m, i) => {
              const tb = TYPE_BADGE[m.type] ?? { bg: 'var(--muted)', color: 'var(--muted-foreground)' }
              return (
                <div key={m.id} className="flex items-center gap-4 px-5" style={{ paddingTop: 14, paddingBottom: 14, borderBottom: i < filteredMaterials.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span className="t-label px-2 py-0.5 flex-shrink-0" style={{ backgroundColor: tb.bg, color: tb.color, borderRadius: 'var(--radius-sm)' }}>{m.type}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{m.title}</p>
                    <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                      {m.uploadDate} · {m.fileSize} · {m.downloads} downloads
                    </p>
                  </div>
                  <Button
                    variant="outline" size="sm"
                    className="gap-1 flex-shrink-0"
                    style={{ fontSize: '0.8125rem', color: 'var(--error)', borderColor: 'var(--error)' }}
                    onClick={() => deleteMaterial(m.id)}
                  >
                    <Trash2 style={{ width: 12, height: 12 }} /> Delete
                  </Button>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Announcements section ───────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Announcements</h2>
            <Button onClick={() => setAnnounceOpen(true)} style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', gap: 6 }}>
              <Plus style={{ width: 14, height: 14 }} /> Post announcement
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredAnnouncements.length === 0 && (
              <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24, textAlign: 'center' }}>
                <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>No announcements for this course.</p>
              </div>
            )}
            {filteredAnnouncements.map(a => (
              <AnnouncementCard key={a.id} announcement={a} />
            ))}
          </div>
        </div>
      </div>

      {/* Upload material Sheet */}
      <Sheet open={uploadOpen} onOpenChange={setUploadOpen}>
        <SheetContent side="right" className="p-0 border-l overflow-hidden flex flex-col" style={{ width: 'min(720px, 45vw)' }}>
          <UploadMaterialForm courseId={courseId} onClose={() => setUploadOpen(false)} onUploaded={(m) => { setMaterials(prev => [...prev, m]); setUploadOpen(false) }} />
        </SheetContent>
      </Sheet>

      {/* Post announcement Sheet */}
      <Sheet open={announceOpen} onOpenChange={setAnnounceOpen}>
        <SheetContent side="right" className="p-0 border-l overflow-hidden flex flex-col" style={{ width: 'min(720px, 45vw)' }}>
          <PostAnnouncementForm courseId={courseId} onClose={() => setAnnounceOpen(false)} onPosted={(a) => { setAnnouncements(prev => [a, ...prev]); setAnnounceOpen(false) }} />
        </SheetContent>
      </Sheet>
    </AppShell>
  )
}

// ── Announcement card ─────────────────────────────────────────────────────────

function AnnouncementCard({ announcement: a }: { announcement: CourseAnnouncement }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)', border: '1px solid var(--border)', padding: '18px 20px', transition: 'box-shadow 150ms ease-out' }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{a.title}</p>
            {a.pinned && (
              <Pin style={{ width: 13, height: 13, color: 'var(--brand)' }} />
            )}
          </div>
          <p className="t-body-sm mb-2" style={{ color: 'var(--muted-foreground)' }}>{a.body}</p>
          <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{a.date}</p>
        </div>
      </div>
    </div>
  )
}

// ── Upload material form ──────────────────────────────────────────────────────

function UploadMaterialForm({
  courseId, onClose, onUploaded,
}: {
  courseId: string
  onClose: () => void
  onUploaded: (m: CourseMaterial) => void
}) {
  const [title,    setTitle]    = useState('')
  const [selected, setSelected] = useState(courseId)
  const [desc,     setDesc]     = useState('')
  const [type,     setType]     = useState<CourseMaterial['type']>('PDF')

  const handleUpload = () => {
    if (!title.trim()) return
    const newMaterial: CourseMaterial = {
      id: Date.now(), courseId: selected, title, type,
      uploadDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      fileSize: '—', downloads: 0,
    }
    toast.success(`"${title}" uploaded`)
    onUploaded(newMaterial)
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div style={{ padding: '20px 56px 18px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 600, color: 'var(--foreground)', lineHeight: 1.4 }}>Upload Material</h3>
      </div>

      <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Title</label>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Week 1 — Lecture Slides" />
        </div>
        <div>
          <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Course</label>
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {LECTURER_COURSES.map(c => <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>File type</label>
          <Select value={type} onValueChange={v => setType(v as CourseMaterial['type'])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(['PDF', 'PPTX', 'DOCX', 'ZIP'] as const).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Description (optional)</label>
          <Textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Brief description of this material…" rows={3} />
        </div>
        {/* Drop zone */}
        <div
          style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: 32, textAlign: 'center', backgroundColor: 'var(--muted)', cursor: 'pointer' }}
          onClick={() => toast.info('File picker not connected in prototype')}
        >
          <Upload style={{ width: 24, height: 24, color: 'var(--muted-foreground)', margin: '0 auto 8px' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Click to select a file</p>
          <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>PDF, PPTX, DOCX, ZIP · Max 50 MB</p>
        </div>
      </div>

      <div style={{ padding: '0 24px 28px', display: 'flex', gap: 10, flexShrink: 0 }}>
        <Button onClick={handleUpload} className="flex-1" style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}>Upload</Button>
        <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  )
}

// ── Post announcement form ────────────────────────────────────────────────────

function PostAnnouncementForm({
  courseId, onClose, onPosted,
}: {
  courseId: string
  onClose: () => void
  onPosted: (a: CourseAnnouncement) => void
}) {
  const [title,    setTitle]    = useState('')
  const [body,     setBody]     = useState('')
  const [selected, setSelected] = useState(courseId)
  const [pinned,   setPinned]   = useState(false)

  const handlePost = () => {
    if (!title.trim()) return
    const a: CourseAnnouncement = {
      id: Date.now(), courseId: selected, title, body, pinned,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    }
    toast.success(`Announcement "${title}" posted`)
    onPosted(a)
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div style={{ padding: '20px 56px 18px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 600, color: 'var(--foreground)', lineHeight: 1.4 }}>Post Announcement</h3>
      </div>

      <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Title</label>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Announcement title" />
        </div>
        <div>
          <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Course</label>
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {LECTURER_COURSES.map(c => <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Message</label>
          <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your announcement…" rows={5} />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPinned(v => !v)}
            style={{ width: 40, height: 22, borderRadius: 11, backgroundColor: pinned ? 'var(--brand)' : 'var(--border)', transition: 'background-color 150ms', border: 'none', cursor: 'pointer', position: 'relative' }}
          >
            <span style={{ position: 'absolute', top: 2, left: pinned ? 20 : 2, width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 150ms' }} />
          </button>
          <span className="text-sm" style={{ color: 'var(--foreground)' }}>Pin this announcement</span>
        </div>
      </div>

      <div style={{ padding: '0 24px 28px', display: 'flex', gap: 10, flexShrink: 0 }}>
        <Button onClick={handlePost} className="flex-1" style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}>Post</Button>
        <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  )
}
