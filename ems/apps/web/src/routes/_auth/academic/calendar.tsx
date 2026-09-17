import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import type { AcademicCalendarEvent } from '@stackedu/shared'
import { formatAppDateDdMmYyyy } from '@stackedu/shared'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { AcademicShell } from '@/components/AcademicShell'
import { calEventColors } from '@/data/academic'
import {
  academicCalendarQueryKey,
  academicSemestersQueryKey,
  createAcademicCalendarEvent,
  deleteAcademicCalendarEvent,
  listAcademicCalendarEvents,
} from '@/lib/api/academic'
import { apiErrorMessage } from '@/lib/api/client'
import { toast } from 'sonner'

export const Route = createFileRoute('/_auth/academic/calendar')({
  component: CalendarPage,
})

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAY_FULL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const EVENT_TYPES = ['Semester', 'Registration', 'Exam', 'Holiday', 'Deadline', 'Results'] as const

type EventForm = {
  title: string
  category: typeof EVENT_TYPES[number]
  startDate: string
  endDate: string
  description: string
}

const BLANK_EVENT: EventForm = {
  title: '',
  category: 'Semester',
  startDate: '',
  endDate: '',
  description: '',
}

function getMonthDays(ref: Date): (Date | null)[] {
  const year = ref.getFullYear()
  const month = ref.getMonth()
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const result: (Date | null)[] = []
  for (let i = 0; i < first.getDay(); i++) result.push(null)
  for (let d = 1; d <= last.getDate(); d++) result.push(new Date(year, month, d))
  while (result.length % 7 !== 0) result.push(null)
  return result
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseIsoDateLocal(value: string): Date {
  const match = value.trim().slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return new Date(value)
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

function formatEventRange(startDate: string, endDate: string | null): string {
  const start = formatAppDateDdMmYyyy(startDate)
  if (!endDate || endDate === startDate) return start
  return `${start} – ${formatAppDateDdMmYyyy(endDate)}`
}

function eventColors(type: string) {
  if ((EVENT_TYPES as readonly string[]).includes(type)) {
    return calEventColors(type as typeof EVENT_TYPES[number])
  }
  return { bg: 'var(--muted)', color: 'var(--muted-foreground)' }
}

function CalendarPage() {
  const queryClient = useQueryClient()
  const today = new Date()
  const [navDate, setNavDate] = useState(new Date())
  const [selDate, setSelDate] = useState(today)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AcademicCalendarEvent | null>(null)
  const [confirmSave, setConfirmSave] = useState(false)
  const [form, setForm] = useState<EventForm>(BLANK_EVENT)

  const { data, isPending, error } = useQuery({
    queryKey: academicCalendarQueryKey,
    queryFn: listAcademicCalendarEvents,
  })

  const events = data ?? []

  const createMutation = useMutation({
    mutationFn: () => {
      if (!form.title.trim()) throw new Error('Event title is required.')
      if (!form.startDate) throw new Error('Start date is required.')
      return createAcademicCalendarEvent({
        title: form.title.trim(),
        category: form.category,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        description: form.description.trim() || undefined,
      })
    },
    onSuccess: async () => {
      toast.success('Event added to the calendar.')
      setSheetOpen(false)
      setConfirmSave(false)
      setForm(BLANK_EVENT)
      await queryClient.invalidateQueries({ queryKey: academicCalendarQueryKey })
      await queryClient.invalidateQueries({ queryKey: academicSemestersQueryKey })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not create event.')),
  })

  const deleteMutation = useMutation({
    mutationFn: (event: AcademicCalendarEvent) => deleteAcademicCalendarEvent(event.id),
    onSuccess: async () => {
      toast.success('Event removed.')
      setDeleteTarget(null)
      await queryClient.invalidateQueries({ queryKey: academicCalendarQueryKey })
      await queryClient.invalidateQueries({ queryKey: academicSemestersQueryKey })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not delete event.')),
  })

  const eventsOnDay = useMemo(() => (d: Date) => events.filter((e) => {
    const start = parseIsoDateLocal(e.startDate)
    const end = parseIsoDateLocal(e.endDate ?? e.startDate)
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const from = new Date(start.getFullYear(), start.getMonth(), start.getDate())
    const to = new Date(end.getFullYear(), end.getMonth(), end.getDate())
    return day >= from && day <= to
  }), [events])

  const todayKey = toIsoDate(today)
  const allEvents = useMemo(() => {
    const todayStart = parseIsoDateLocal(todayKey)
    return [...events].sort((a, b) => {
      const aStart = parseIsoDateLocal(a.startDate)
      const bStart = parseIsoDateLocal(b.startDate)
      const aUpcoming = parseIsoDateLocal(a.endDate ?? a.startDate) >= todayStart ? 0 : 1
      const bUpcoming = parseIsoDateLocal(b.endDate ?? b.startDate) >= todayStart ? 0 : 1
      if (aUpcoming !== bUpcoming) return aUpcoming - bUpcoming
      return aStart.getTime() - bStart.getTime()
    })
  }, [events, todayKey])

  const selEvents = eventsOnDay(selDate)
  const monthDays = getMonthDays(navDate)
  const heading = `${MONTH_NAMES[navDate.getMonth()]} ${navDate.getFullYear()}`

  const openAdd = () => {
    setForm({
      ...BLANK_EVENT,
      startDate: toIsoDate(selDate),
      endDate: toIsoDate(selDate),
    })
    setSheetOpen(true)
  }

  const inputStyle = { border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }

  return (
    <AcademicShell pageTitle="Calendar">
      <div className="page-body animate-fade-up">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Academic Calendar</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
              {isPending ? 'Loading…' : `${events.length} events scheduled`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}>
              <Plus style={{ width: 15, height: 15 }} />Add event
            </button>
            <button
              type="button"
              onClick={() => toast.success('Events are published as soon as they are created.')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ border: '1px solid var(--border)', cursor: 'pointer', background: 'transparent' }}
            >
              Publish calendar
            </button>
          </div>
        </div>

        {error ? (
          <p className="t-body mb-4" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load calendar events.')}</p>
        ) : null}

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 lg:flex-[0_0_60%] lg:max-w-[60%]">
            <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', padding: 24 }}>
              <div className="flex items-center justify-between mb-4">
                <button type="button" onClick={() => { const d = new Date(navDate); d.setMonth(d.getMonth() - 1); setNavDate(d) }} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                  <ChevronLeft style={{ width: 16, height: 16 }} />
                </button>
                <h3 className="t-h3">{heading}</h3>
                <button type="button" onClick={() => { const d = new Date(navDate); d.setMonth(d.getMonth() + 1); setNavDate(d) }} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                  <ChevronRight style={{ width: 16, height: 16 }} />
                </button>
              </div>
              <div className="grid grid-cols-7 mb-1">
                {DAY_FULL.map((d) => <span key={d} className="t-label text-center" style={{ fontSize: 10 }}>{d}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-y-0.5">
                {monthDays.map((day, i) => {
                  if (!day) return <div key={`null-${i}`} />
                  const isToday = isSameDay(day, today)
                  const isSelected = isSameDay(day, selDate)
                  const dayEvents = eventsOnDay(day)
                  const colors = dayEvents.map((e) => eventColors(e.type).color).filter((v, idx, a) => a.indexOf(v) === idx).slice(0, 3)
                  return (
                    <button key={day.toISOString()} type="button" onClick={() => setSelDate(day)} className="flex flex-col items-center py-1 gap-0.5" style={{ borderRadius: 'var(--radius-md)', backgroundColor: isSelected ? 'rgba(var(--brand-rgb),0.08)' : 'transparent', border: 'none', cursor: 'pointer' }}>
                      <span className="flex items-center justify-center text-xs" style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: isToday ? 'var(--brand)' : 'transparent', color: isToday ? 'var(--brand-ink)' : 'var(--foreground)', fontWeight: isToday || isSelected ? 700 : 400 }}>{day.getDate()}</span>
                      {colors.length > 0 && (
                        <div className="flex gap-0.5">
                          {colors.map((c, ci) => <span key={ci} style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: c }} />)}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="flex-1 lg:flex-[0_0_40%] lg:max-w-[40%]">
            <EventList
              title={selDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              events={selEvents}
              onSelect={(ev) => setDeleteTarget(ev)}
            />
            <div className="mt-4">
              <EventList title="All Events" events={allEvents} scroll onSelect={(ev) => setDeleteTarget(ev)} />
            </div>
          </div>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="p-0 overflow-y-auto sheet-lg">
          <SheetHeader className="px-8 py-6" style={{ borderBottom: '1px solid var(--border)' }}>
            <SheetTitle style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Add Calendar Event</SheetTitle>
          </SheetHeader>
          <div className="px-8 py-6 flex flex-col gap-4">
            <div>
              <label className="t-label mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full text-sm rounded-lg px-3 h-9 outline-none"
                style={inputStyle}
                placeholder="e.g. First Semester begins"
              />
            </div>
            <div>
              <label className="t-label mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as typeof EVENT_TYPES[number] }))}
                className="w-full text-sm rounded-lg px-3 h-9 outline-none"
                style={inputStyle}
              >
                {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="t-label mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  className="w-full text-sm rounded-lg px-3 h-9 outline-none"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="t-label mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>End Date</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  className="w-full text-sm rounded-lg px-3 h-9 outline-none"
                  style={inputStyle}
                />
              </div>
            </div>
            <div>
              <label className="t-label mb-1.5 block" style={{ color: 'var(--muted-foreground)' }}>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full text-sm rounded-lg px-3 py-2 outline-none resize-none"
                style={inputStyle}
                placeholder="Optional details"
              />
            </div>
            <div className="flex gap-3 mt-2">
              <button type="button" onClick={() => setSheetOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'transparent', cursor: 'pointer' }}>Cancel</button>
              <button
                type="button"
                onClick={() => {
                  if (!form.title.trim()) {
                    toast.error('Event title is required.')
                    return
                  }
                  if (!form.startDate) {
                    toast.error('Start date is required.')
                    return
                  }
                  setConfirmSave(true)
                }}
                disabled={createMutation.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: createMutation.isPending ? 'not-allowed' : 'pointer', opacity: createMutation.isPending ? 0.7 : 1 }}
              >
                {createMutation.isPending ? 'Saving…' : 'Save event'}
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmAlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title={`Delete ${deleteTarget?.title}?`}
        tone="destructive"
        headlineLabel="Action"
        headline="Delete event"
        summary="This will permanently remove the event from the academic calendar."
        notices={[{ icon: 'trash', label: 'The event will be removed for all staff and students viewing the calendar.' }]}
        caution="This cannot be undone."
        confirmLabel={deleteMutation.isPending ? 'Deleting…' : 'Delete'}
        confirmVariant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget) }}
      />

      <ConfirmAlertDialog
        open={confirmSave}
        onOpenChange={(open) => { if (!open) setConfirmSave(false) }}
        title="Add this calendar event?"
        tone="success"
        headlineLabel="Action"
        headline="Create event"
        summary={`${form.title.trim()} will be added to the academic calendar.`}
        notices={[
          { icon: 'info', label: 'Staff and students will see this event on the calendar.' },
        ]}
        confirmLabel={createMutation.isPending ? 'Saving…' : 'Confirm'}
        confirmVariant="brand"
        loading={createMutation.isPending}
        onCancel={() => setConfirmSave(false)}
        onConfirm={() => createMutation.mutate()}
      />
    </AcademicShell>
  )
}

function EventList({
  title,
  events,
  scroll,
  onSelect,
}: {
  title: string
  events: AcademicCalendarEvent[]
  scroll?: boolean
  onSelect?: (event: AcademicCalendarEvent) => void
}) {
  return (
    <div
      className="flex flex-col"
      style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', maxHeight: scroll ? 320 : 420 }}
    >
      <h3 className="t-h3 shrink-0 px-5 pt-5 pb-3" style={{ fontSize: '0.9375rem' }}>{title}</h3>
      <div className="px-5 pb-5 min-h-0" style={{ overflowY: scroll ? 'auto' : undefined }}>
        {events.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: 'var(--muted-foreground)' }}>No events</p>
        ) : (
          <div className="flex flex-col gap-3">
            {events.map((ev) => {
              const { bg, color } = eventColors(ev.type)
              return (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => onSelect?.(ev)}
                  className="p-3 rounded-xl text-left w-full transition-opacity hover:opacity-90"
                  style={{ backgroundColor: bg, border: `1px solid ${color}20`, cursor: onSelect ? 'pointer' : 'default' }}
                  title={onSelect ? 'Click to delete' : undefined}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{ev.title}</p>
                      <p className="t-caption mt-0.5">{formatEventRange(ev.startDate, ev.endDate)}</p>
                      {ev.description && <p className="t-caption mt-1">{ev.description}</p>}
                    </div>
                    <span className="t-label px-1.5 py-0.5 shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.5)', color, fontSize: 10 }}>{ev.type}</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
