import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, Pencil, Trash2, X } from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { AppShell } from '@/components/AppShell'
import { ACADEMIC_ADMIN, ACADEMIC_NAV, CAL_EVENTS, calEventColors, type CalEvent, type CalEventType } from '@/data/academic'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/academic/calendar')({
  component: CalendarPage,
})

// ─────────────────────────────────────────────────────────────────────────────

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_FULL   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const YEARS      = ['2024/2025', '2025/2026']
const EVENT_TYPES: CalEventType[] = ['Semester','Registration','Exam','Holiday','Deadline','Results']

function getMonthDays(ref: Date): (Date | null)[] {
  const year = ref.getFullYear(), month = ref.getMonth()
  const first = new Date(year, month, 1)
  const last  = new Date(year, month + 1, 0)
  const result: (Date | null)[] = []
  for (let i = 0; i < first.getDay(); i++) result.push(null)
  for (let d = 1; d <= last.getDate(); d++) result.push(new Date(year, month, d))
  while (result.length % 7 !== 0) result.push(null)
  return result
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

// ─────────────────────────────────────────────────────────────────────────────

function CalendarPage() {
  const today = new Date()
  const [navDate, setNavDate]   = useState(new Date(2025, 0, 1))
  const [selDate, setSelDate]   = useState(today)
  const [year, setYear]         = useState(YEARS[0])
  const [events, setEvents]     = useState(CAL_EVENTS)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editEvt, setEditEvt]   = useState<CalEvent | null>(null)
  const [form, setForm]         = useState({ title: '', type: 'Semester' as CalEventType, startDate: '', endDate: '', description: '', affectsAll: true })

  const navigate = (dir: -1 | 1) => {
    const d = new Date(navDate); d.setMonth(d.getMonth() + dir); setNavDate(d)
  }

  const monthDays = getMonthDays(navDate)
  const heading   = `${MONTH_NAMES[navDate.getMonth()]} ${navDate.getFullYear()}`

  const eventsOnDay = (d: Date) => events.filter((e) => {
    const start = new Date(e.startDate), end = new Date(e.endDate)
    return d >= start && d <= end
  })

  const selEvents = eventsOnDay(selDate)

  const openAdd = () => { setEditEvt(null); setForm({ title: '', type: 'Semester', startDate: toDateStr(selDate), endDate: toDateStr(selDate), description: '', affectsAll: true }); setSheetOpen(true) }

  return (
    <AppShell
      navItems={ACADEMIC_NAV}
      pageTitle="Calendar"
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
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Academic Calendar</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>{events.length} events scheduled</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={year} onChange={(e) => setYear(e.target.value)}
              className="text-sm rounded-lg px-3 h-9 outline-none"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', cursor: 'pointer' }}
            >
              {YEARS.map((y) => <option key={y}>{y}</option>)}
            </select>
            <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150"
              style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
            >
              Add event
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150"
              style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card)' }}
            >
              Publish calendar
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* ── Left: Calendar (60%) ──────────────────────────────────────── */}
          <div style={{ flex: '0 0 60%', maxWidth: '60%' }}>
            <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24 }}>
              {/* Month nav */}
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => navigate(-1)} className="flex items-center justify-center rounded-lg transition-colors duration-150"
                  style={{ width: 32, height: 32, color: 'var(--muted-foreground)', border: 'none', background: 'none', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <ChevronLeft style={{ width: 16, height: 16 }} />
                </button>
                <h3 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>{heading}</h3>
                <button onClick={() => navigate(1)} className="flex items-center justify-center rounded-lg transition-colors duration-150"
                  style={{ width: 32, height: 32, color: 'var(--muted-foreground)', border: 'none', background: 'none', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <ChevronRight style={{ width: 16, height: 16 }} />
                </button>
              </div>
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAY_FULL.map((d) => (
                  <span key={d} className="t-label text-center" style={{ color: 'var(--muted-foreground)', fontSize: 10 }}>{d}</span>
                ))}
              </div>
              {/* Day grid */}
              <div className="grid grid-cols-7 gap-y-0.5">
                {monthDays.map((day, i) => {
                  if (!day) return <div key={`null-${i}`} />
                  const isToday    = isSameDay(day, today)
                  const isSelected = isSameDay(day, selDate)
                  const dayEvents  = eventsOnDay(day)
                  const colors     = dayEvents.map((e) => calEventColors(e.type).color).filter((v, i, a) => a.indexOf(v) === i).slice(0, 3)
                  return (
                    <button key={day.toISOString()} onClick={() => setSelDate(day)}
                      className="flex flex-col items-center py-1 gap-0.5"
                      style={{ borderRadius: 'var(--radius-md)', backgroundColor: isSelected ? 'rgba(32,244,78,0.08)' : 'transparent', border: 'none', cursor: 'pointer' }}
                    >
                      <span className="flex items-center justify-center text-xs"
                        style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: isToday ? 'var(--brand)' : 'transparent', color: isToday ? 'var(--brand-ink)' : 'var(--foreground)', fontWeight: isToday || isSelected ? 700 : 400 }}
                      >
                        {day.getDate()}
                      </span>
                      {colors.length > 0 && (
                        <div className="flex gap-0.5">
                          {colors.map((c, ci) => (
                            <span key={ci} style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: c, flexShrink: 0 }} />
                          ))}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── Right: Events list (40%) ──────────────────────────────────── */}
          <div style={{ flex: '0 0 40%', maxWidth: '40%' }}>
            <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 20, maxHeight: 420, overflowY: 'auto' }}>
              <h3 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '0.9375rem' }}>
                {selDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              {selEvents.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: 'var(--muted-foreground)' }}>No events on this day</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {selEvents.map((ev) => {
                    const { bg, color } = calEventColors(ev.type)
                    return (
                      <div key={ev.id} className="p-3 rounded-xl" style={{ backgroundColor: bg, border: `1px solid ${color}20` }}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{ev.title}</p>
                            <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                              {ev.startDate === ev.endDate ? ev.startDate : `${ev.startDate} – ${ev.endDate}`}
                            </p>
                            {ev.description && <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>{ev.description}</p>}
                          </div>
                          <span className="t-label px-1.5 py-0.5 flex-shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.5)', color, borderRadius: 'var(--radius-sm)', fontSize: 10 }}>{ev.type}</span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors duration-150"
                            style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: 'pointer' }}
                          >
                            <Pencil style={{ width: 11, height: 11 }} />Edit
                          </button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors duration-150"
                                style={{ border: '1px solid var(--error)', color: 'var(--error)', backgroundColor: 'transparent', cursor: 'pointer' }}
                              >
                                <Trash2 style={{ width: 11, height: 11 }} />Delete
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete event?</AlertDialogTitle>
                                <AlertDialogDescription>Delete <strong>{ev.title}</strong>? This cannot be undone.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => setEvents((prev) => prev.filter((x) => x.id !== ev.id))}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* All upcoming events */}
            <div className="mt-4" style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 20 }}>
              <h3 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '0.9375rem' }}>All Events</h3>
              <div className="flex flex-col gap-2" style={{ maxHeight: 280, overflowY: 'auto' }}>
                {events.map((ev) => {
                  const { bg, color } = calEventColors(ev.type)
                  return (
                    <div key={ev.id} className="flex items-start gap-3 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
                      <span className="t-label px-1.5 py-0.5 flex-shrink-0 mt-0.5" style={{ backgroundColor: bg, color, borderRadius: 'var(--radius-sm)', fontSize: 10 }}>{ev.type}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{ev.title}</p>
                        <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{ev.startDate}{ev.startDate !== ev.endDate ? ` – ${ev.endDate}` : ''}</p>
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button
                          onClick={() => { setEditEvt(ev); setForm({ title: ev.title, type: ev.type, startDate: ev.startDate, endDate: ev.endDate, description: ev.description ?? '', affectsAll: ev.affectsAll }); setSheetOpen(true) }}
                          className="flex items-center justify-center rounded-lg transition-colors duration-150"
                          style={{ width: 26, height: 26, color: 'var(--muted-foreground)', border: 'none', background: 'none', cursor: 'pointer' }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)'; e.currentTarget.style.color = 'var(--foreground)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--muted-foreground)' }}
                          title="Edit"
                        ><Pencil style={{ width: 11, height: 11 }} /></button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              className="flex items-center justify-center rounded-lg transition-colors duration-150"
                              style={{ width: 26, height: 26, color: 'var(--muted-foreground)', border: 'none', background: 'none', cursor: 'pointer' }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--error-bg)'; e.currentTarget.style.color = 'var(--error)' }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--muted-foreground)' }}
                              title="Delete"
                            ><Trash2 style={{ width: 11, height: 11 }} /></button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete event?</AlertDialogTitle>
                              <AlertDialogDescription>Delete <strong>{ev.title}</strong>? This cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => setEvents((prev) => prev.filter((x) => x.id !== ev.id))}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Event Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="p-0 overflow-y-auto" style={{ width: 'min(860px, 55vw)', maxWidth: '100vw' }}>
          <SheetHeader className="px-8 py-6" style={{ borderBottom: '1px solid var(--border)' }}>
            <SheetTitle style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Add Event</SheetTitle>
          </SheetHeader>
          <div className="px-8 py-6">
            {[
              { label: 'Event Name', node: <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Event title"
                  className="w-full text-sm rounded-lg px-3 h-9 outline-none" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)' }} /> },
              { label: 'Event Type', node: <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as CalEventType })}
                  className="w-full text-sm rounded-lg px-3 h-9 outline-none" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)', cursor: 'pointer' }}>
                  {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select> },
              { label: 'Start Date', node: <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full text-sm rounded-lg px-3 h-9 outline-none" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)' }} /> },
              { label: 'End Date', node: <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full text-sm rounded-lg px-3 h-9 outline-none" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)' }} /> },
              { label: 'Description', node: <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Optional description"
                  className="w-full text-sm rounded-lg px-3 py-2 outline-none resize-none" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)' }} /> },
            ].map((f) => (
              <div key={f.label} className="mb-4">
                <label className="t-label mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>{f.label}</label>
                {f.node}
              </div>
            ))}
            <div className="flex gap-3 mt-6">
              <button onClick={() => setSheetOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150"
                style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'transparent', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => setSheetOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
                style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

    </AppShell>
  )
}
