import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Plus, Trash2, Mail, MessageSquare, Bell, Calendar, Megaphone } from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { AppShell } from '@/components/AppShell'
import { ICT_MANAGER, ICT_NAV, ANNOUNCEMENTS, announcementStatusColors, type Announcement } from '@/data/ict'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/ict/announcements')({
  component: AnnouncementsPage,
})

// ── Channel icon mapping ──────────────────────────────────────────────────────

function ChannelIcon({ channel }: { channel: 'Email' | 'SMS' | 'In-app' }) {
  const map = { Email: Mail, SMS: MessageSquare, 'In-app': Bell }
  const Icon = map[channel]
  return <Icon style={{ width: 13, height: 13 }} />
}

// ── Audience badge colors ─────────────────────────────────────────────────────

function audienceColor(aud: string) {
  if (aud === 'All Users')   return { bg: 'var(--ink)', color: 'var(--ink-foreground)' }
  if (aud === 'Students')    return { bg: 'var(--info-bg)', color: 'var(--info)' }
  if (aud === 'Lecturers')   return { bg: 'var(--success-bg)', color: 'var(--success)' }
  if (aud === 'Admins')      return { bg: 'var(--warning-bg)', color: 'var(--warning)' }
  return { bg: 'var(--muted)', color: 'var(--muted-foreground)' }
}

// ─────────────────────────────────────────────────────────────────────────────

const AUDIENCE_OPTIONS = ['All Users', 'Students', 'Lecturers', 'All Admins', 'Specific role']
const CHANNEL_OPTIONS: ('Email' | 'SMS' | 'In-app')[] = ['In-app', 'Email', 'SMS']

function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(ANNOUNCEMENTS)
  const [createOpen, setCreateOpen]       = useState(false)
  const [viewTarget, setViewTarget]       = useState<Announcement | null>(null)
  const [deleteTarget, setDeleteTarget]   = useState<Announcement | null>(null)

  // Create form state
  const [form, setForm] = useState({
    title:          '',
    body:           '',
    audience:       [] as string[],
    channels:       ['In-app'] as ('Email' | 'SMS' | 'In-app')[],
    scheduleLater:  false,
    scheduledDate:  '',
    priority:       'Normal' as 'Normal' | 'Urgent',
  })

  const toggleAudience = (aud: string) =>
    setForm((f) => ({ ...f, audience: f.audience.includes(aud) ? f.audience.filter(a => a !== aud) : [...f.audience, aud] }))

  const toggleChannel = (ch: 'Email' | 'SMS' | 'In-app') =>
    setForm((f) => ({ ...f, channels: f.channels.includes(ch) ? f.channels.filter(c => c !== ch) : [...f.channels, ch] }))

  const handleCreate = (asDraft = false) => {
    if (!form.title || !form.body) return
    const newAnn: Announcement = {
      id:             `ann-${Date.now()}`,
      title:          form.title,
      body:           form.body,
      targetAudience: form.audience.length ? form.audience : ['All Users'],
      channels:       form.channels,
      status:         asDraft ? 'Draft' : form.scheduleLater ? 'Scheduled' : 'Sent',
      priority:       form.priority,
      sentDate:       !asDraft && !form.scheduleLater ? new Date().toLocaleString('en-GB') : undefined,
      scheduledDate:  form.scheduleLater ? form.scheduledDate : undefined,
    }
    setAnnouncements((as) => [newAnn, ...as])
    setCreateOpen(false)
    setForm({ title: '', body: '', audience: [], channels: ['In-app'], scheduleLater: false, scheduledDate: '', priority: 'Normal' })
    toast.success(asDraft ? `Draft saved: "${newAnn.title}".` : form.scheduleLater ? `Announcement scheduled.` : `Announcement sent to ${newAnn.targetAudience.join(', ')}.`)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    setAnnouncements((as) => as.filter((a) => a.id !== deleteTarget.id))
    toast.success('Announcement deleted.')
    setDeleteTarget(null)
  }

  return (
    <AppShell
      navItems={ICT_NAV}
      pageTitle="Announcement Centre"
      userName={ICT_MANAGER.fullName}
      userRole={ICT_MANAGER.role}
      userInitials={ICT_MANAGER.initials}
      unreadCount={3}
      infoCardLabel="ICT MANAGER"
      infoCardValue={ICT_MANAGER.institution}
      infoCardSubtext={ICT_MANAGER.office}
    >
      <div className="animate-fade-up" style={{ padding: '32px 32px 48px' }}>

        {/* Section header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Announcement Centre</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>{announcements.filter(a => a.status === 'Sent').length} sent · {announcements.filter(a => a.status === 'Scheduled').length} scheduled · {announcements.filter(a => a.status === 'Draft').length} drafts</p>
          </div>
          <button onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity duration-150"
            style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}>
            <Plus style={{ width: 16, height: 16 }} />
            Create announcement
          </button>
        </div>

        {/* Announcements list */}
        <div className="flex flex-col gap-4">
          {announcements.map((ann) => {
            const sc = announcementStatusColors(ann.status)
            return (
              <div key={ann.id} style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: ann.priority === 'Urgent' ? '1px solid var(--error)' : '1px solid var(--border)', padding: 24 }}>
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center rounded-xl flex-shrink-0"
                    style={{ width: 42, height: 42, backgroundColor: ann.priority === 'Urgent' ? 'var(--error-bg)' : 'var(--muted)' }}>
                    <Megaphone style={{ width: 18, height: 18, color: ann.priority === 'Urgent' ? 'var(--error)' : 'var(--muted-foreground)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-display)' }}>{ann.title}</h3>
                      <span className="t-label px-1.5 py-0.5" style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)', fontSize: 10 }}>{ann.status}</span>
                      {ann.priority === 'Urgent' && <span className="t-label px-1.5 py-0.5" style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-sm)', fontSize: 10 }}>Urgent</span>}
                    </div>
                    <p className="text-sm mb-3" style={{ color: 'var(--muted-foreground)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>
                      {ann.body}
                    </p>
                    {/* Audience + channels + date */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {ann.targetAudience.map((aud) => {
                        const ac = audienceColor(aud)
                        return <span key={aud} className="t-label px-1.5 py-0.5" style={{ backgroundColor: ac.bg, color: ac.color, borderRadius: 'var(--radius-sm)', fontSize: 10 }}>{aud}</span>
                      })}
                      <div className="flex items-center gap-1.5 ml-1">
                        {ann.channels.map((ch) => (
                          <div key={ch} title={ch} className="flex items-center justify-center rounded-md"
                            style={{ width: 22, height: 22, backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                            <ChannelIcon channel={ch} />
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-1 ml-1">
                        <Calendar style={{ width: 12, height: 12, color: 'var(--muted-foreground)' }} />
                        <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
                          {ann.status === 'Scheduled' ? `Scheduled: ${ann.scheduledDate}` : ann.sentDate ?? '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => setViewTarget(ann)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150"
                      style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: 'pointer' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card)' }}>
                      View
                    </button>
                    <button onClick={() => setDeleteTarget(ann)}
                      className="flex items-center justify-center rounded-lg transition-all duration-150"
                      style={{ width: 30, height: 30, border: '1px solid var(--error-bg)', backgroundColor: 'var(--error-bg)', color: 'var(--error)', cursor: 'pointer' }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8' }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}>
                      <Trash2 style={{ width: 13, height: 13 }} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* View announcement Sheet */}
      <Sheet open={!!viewTarget} onOpenChange={(o) => !o && setViewTarget(null)}>
        <SheetContent side="right" className="p-0 overflow-y-auto" style={{ width: 'min(640px, 100vw)' }}>
          {viewTarget && (
            <>
              <SheetHeader className="px-8 py-6" style={{ borderBottom: '1px solid var(--border)' }}>
                <SheetTitle style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>{viewTarget.title}</SheetTitle>
              </SheetHeader>
              <div className="px-8 py-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {(() => { const sc = announcementStatusColors(viewTarget.status); return <span className="t-label px-2 py-0.5" style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)' }}>{viewTarget.status}</span> })()}
                  {viewTarget.priority === 'Urgent' && <span className="t-label px-2 py-0.5" style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-sm)' }}>Urgent</span>}
                </div>
                <p className="t-body-lg" style={{ color: 'var(--foreground)', lineHeight: 1.7 }}>{viewTarget.body}</p>
                <div className="flex flex-col gap-2 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2">
                    <span className="t-label" style={{ color: 'var(--muted-foreground)', minWidth: 100 }}>TARGET</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {viewTarget.targetAudience.map(aud => {
                        const ac = audienceColor(aud)
                        return <span key={aud} className="t-label px-1.5 py-0.5" style={{ backgroundColor: ac.bg, color: ac.color, borderRadius: 'var(--radius-sm)' }}>{aud}</span>
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="t-label" style={{ color: 'var(--muted-foreground)', minWidth: 100 }}>CHANNELS</span>
                    <div className="flex gap-1.5">
                      {viewTarget.channels.map(ch => (
                        <div key={ch} className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
                          <ChannelIcon channel={ch} />
                          <span className="t-caption" style={{ color: 'var(--foreground)' }}>{ch}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {viewTarget.sentDate && (
                    <div className="flex items-center gap-2">
                      <span className="t-label" style={{ color: 'var(--muted-foreground)', minWidth: 100 }}>SENT</span>
                      <span className="text-sm" style={{ color: 'var(--foreground)' }}>{viewTarget.sentDate}</span>
                    </div>
                  )}
                  {viewTarget.scheduledDate && (
                    <div className="flex items-center gap-2">
                      <span className="t-label" style={{ color: 'var(--muted-foreground)', minWidth: 100 }}>SCHEDULED</span>
                      <span className="text-sm" style={{ color: 'var(--foreground)' }}>{viewTarget.scheduledDate}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Create announcement Sheet */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="right" className="p-0 overflow-y-auto" style={{ width: 'min(860px, 55vw)', maxWidth: '100vw' }}>
          <SheetHeader className="px-8 py-6" style={{ borderBottom: '1px solid var(--border)' }}>
            <SheetTitle style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Create Announcement</SheetTitle>
          </SheetHeader>
          <div className="px-8 py-6 flex flex-col gap-5">

            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label className="t-label" style={{ color: 'var(--muted-foreground)' }}>TITLE</label>
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Announcement title…"
                style={{ fontSize: '0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px', color: 'var(--foreground)', backgroundColor: 'var(--card)', outline: 'none' }} />
            </div>

            {/* Body */}
            <div className="flex flex-col gap-1.5">
              <label className="t-label" style={{ color: 'var(--muted-foreground)' }}>MESSAGE BODY</label>
              <textarea value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                rows={5} placeholder="Write your announcement message…"
                className="resize-none"
                style={{ fontSize: '0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px', color: 'var(--foreground)', backgroundColor: 'var(--card)', outline: 'none', lineHeight: 1.6 }} />
            </div>

            {/* Target audience */}
            <div className="flex flex-col gap-2">
              <label className="t-label" style={{ color: 'var(--muted-foreground)' }}>TARGET AUDIENCE</label>
              <div className="flex gap-2 flex-wrap">
                {AUDIENCE_OPTIONS.map((aud) => (
                  <button key={aud} onClick={() => toggleAudience(aud)}
                    className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-150"
                    style={{ border: form.audience.includes(aud) ? '2px solid var(--brand)' : '1px solid var(--border)', backgroundColor: form.audience.includes(aud) ? 'rgba(32,244,78,0.08)' : 'var(--card)', color: 'var(--foreground)', cursor: 'pointer' }}>
                    {aud}
                  </button>
                ))}
              </div>
            </div>

            {/* Channels */}
            <div className="flex flex-col gap-2">
              <label className="t-label" style={{ color: 'var(--muted-foreground)' }}>DELIVERY CHANNELS</label>
              <div className="flex gap-2 flex-wrap">
                {CHANNEL_OPTIONS.map((ch) => (
                  <button key={ch} onClick={() => toggleChannel(ch)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-150"
                    style={{ border: form.channels.includes(ch) ? '2px solid var(--brand)' : '1px solid var(--border)', backgroundColor: form.channels.includes(ch) ? 'rgba(32,244,78,0.08)' : 'var(--card)', color: 'var(--foreground)', cursor: 'pointer' }}>
                    <ChannelIcon channel={ch} />
                    {ch}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div className="flex flex-col gap-2">
              <label className="t-label" style={{ color: 'var(--muted-foreground)' }}>PRIORITY</label>
              <div className="flex gap-3">
                {(['Normal', 'Urgent'] as const).map((p) => (
                  <button key={p} onClick={() => setForm((f) => ({ ...f, priority: p }))}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                    style={{ border: form.priority === p ? (p === 'Urgent' ? '2px solid var(--error)' : '2px solid var(--brand)') : '1px solid var(--border)', backgroundColor: form.priority === p ? (p === 'Urgent' ? 'var(--error-bg)' : 'rgba(32,244,78,0.08)') : 'var(--card)', color: form.priority === p && p === 'Urgent' ? 'var(--error)' : 'var(--foreground)', cursor: 'pointer' }}>
                    {p}
                  </button>
                ))}
              </div>
              {form.priority === 'Urgent' && (
                <p className="t-caption" style={{ color: 'var(--error)' }}>Urgent announcements are highlighted with a red banner in in-app notifications.</p>
              )}
            </div>

            {/* Schedule toggle */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Switch checked={form.scheduleLater} onCheckedChange={(v) => setForm((f) => ({ ...f, scheduleLater: v }))} id="schedule-toggle" />
                <Label htmlFor="schedule-toggle" className="text-sm" style={{ color: 'var(--foreground)', cursor: 'pointer' }}>Schedule for later</Label>
              </div>
              {form.scheduleLater && (
                <input type="datetime-local" value={form.scheduledDate}
                  onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))}
                  style={{ fontSize: '0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px', color: 'var(--foreground)', backgroundColor: 'var(--card)' }} />
              )}
            </div>

            {/* Preview */}
            {form.title && (
              <div className="flex flex-col gap-2">
                <label className="t-label" style={{ color: 'var(--muted-foreground)' }}>IN-APP NOTIFICATION PREVIEW</label>
                <div className="flex items-start gap-3 p-4 rounded-xl" style={{ backgroundColor: form.priority === 'Urgent' ? 'var(--error-bg)' : 'var(--muted)', border: `1px solid ${form.priority === 'Urgent' ? 'var(--error)' : 'var(--border)'}` }}>
                  <div className="flex items-center justify-center rounded-xl flex-shrink-0"
                    style={{ width: 32, height: 32, backgroundColor: form.priority === 'Urgent' ? 'var(--error)' : 'var(--ink)' }}>
                    <Megaphone style={{ width: 14, height: 14, color: '#fff' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{form.title}</p>
                    {form.body && <p className="t-caption mt-0.5 line-clamp-2" style={{ color: 'var(--muted-foreground)' }}>{form.body}</p>}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>Just now</span>
                      {form.priority === 'Urgent' && <span className="t-label px-1.5 py-0.5" style={{ backgroundColor: 'var(--error)', color: '#fff', borderRadius: 'var(--radius-sm)', fontSize: 9 }}>URGENT</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              {form.scheduleLater ? (
                <button onClick={() => handleCreate(false)} disabled={!form.title || !form.body}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity duration-150"
                  style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer', opacity: form.title && form.body ? 1 : 0.5 }}
                  onMouseEnter={(e) => { if (form.title && form.body) e.currentTarget.style.opacity = '0.9' }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = form.title && form.body ? '1' : '0.5' }}>
                  Schedule announcement
                </button>
              ) : (
                <button onClick={() => handleCreate(false)} disabled={!form.title || !form.body}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity duration-150"
                  style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer', opacity: form.title && form.body ? 1 : 0.5 }}
                  onMouseEnter={(e) => { if (form.title && form.body) e.currentTarget.style.opacity = '0.9' }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = form.title && form.body ? '1' : '0.5' }}>
                  Send now
                </button>
              )}
              <button onClick={() => handleCreate(true)} disabled={!form.title || !form.body}
                className="px-5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150"
                style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: 'pointer', opacity: form.title && form.body ? 1 : 0.5 }}
                onMouseEnter={(e) => { if (form.title && form.body) e.currentTarget.style.backgroundColor = 'var(--muted)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card)' }}>
                Save as draft
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: 'var(--font-display)' }}>Delete announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.title}" will be permanently removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} style={{ backgroundColor: 'var(--error)', color: '#fff' }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </AppShell>
  )
}
