import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import type { AcademicCalendarEvent } from '@stackedu/shared'
import { formatAppDateDdMmYyyy } from '@stackedu/shared'
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { FormInfoBox } from '@/components/FormInfoBox'
import { formInfo } from '@/lib/form-info-copy'
import { IconActionButton } from '@/components/IconActionButton'
import { AcademicShell } from '@/components/AcademicShell'
import { calEventColors } from '@/data/academic'
import {
  academicCalendarQueryKey,
  academicSemestersQueryKey,
  createAcademicCalendarEvent,
  deleteAcademicCalendarEvent,
  listAcademicCalendarEvents,
  updateAcademicCalendarEvent,
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
  const [editing, setEditing] = useState<AcademicCalendarEvent | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AcademicCalendarEvent | null>(null)
  const [confirmSave, setConfirmSave] = useState(false)
  const [form, setForm] = useState<EventForm>(BLANK_EVENT)

  const { data, isPending, error } = useQuery({
    queryKey: academicCalendarQueryKey,
    queryFn: listAcademicCalendarEvents,
  })
  const events = data ?? []

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!form.title.trim()) throw new Error('Event title is required.')
      if (!form.startDate) throw new Error('Start date is required.')
      const input = {
        title: form.title.trim(),
        category: form.category,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        description: form.description.trim() || undefined,
      }
      return editing
        ? updateAcademicCalendarEvent(editing.id, input)
        : createAcademicCalendarEvent(input)
    },
    onSuccess: async () => {
      toast.success(editing ? 'Event updated.' : 'Event added to the calendar.')
      setSheetOpen(false)
      setConfirmSave(false)
      setEditing(null)
      setForm(BLANK_EVENT)
      await queryClient.invalidateQueries({ queryKey: academicCalendarQueryKey })
      await queryClient.invalidateQueries({ queryKey: academicSemestersQueryKey })
    },
    onError: (err) => toast.error(apiErrorMessage(err, editing ? 'Could not update event.' : 'Could not create event.')),
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
    setEditing(null)
    setForm({
      ...BLANK_EVENT,
      startDate: toIsoDate(selDate),
      endDate: toIsoDate(selDate),
    })
    setSheetOpen(true)
  }

  const openEdit = (event: AcademicCalendarEvent) => {
    setEditing(event)
    setForm({
      title: event.title,
      category: (EVENT_TYPES as readonly string[]).includes(event.type)
        ? (event.type as typeof EVENT_TYPES[number])
        : 'Semester',
      startDate: event.startDate,
      endDate: event.endDate ?? event.startDate,
      description: event.description ?? '',
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
                <IconActionButton
                  label="Previous month"
                  icon={ChevronLeft}
                  onClick={() => { const d = new Date(navDate); d.setMonth(d.getMonth() - 1); setNavDate(d) }}
                  style={{ border: 'none' }}
                />
                <h3 className="t-h3">{heading}</h3>
                <IconActionButton
                  label="Next month"
                  icon={ChevronRight}
                  onClick={() => { const d = new Date(navDate); d.setMonth(d.getMonth() + 1); setNavDate(d) }}
                  style={{ border: 'none' }}
                />
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
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
            <div className="mt-4">
              <EventList title="All Events" events={allEvents} scroll onEdit={openEdit} onDelete={setDeleteTarget} />
            </div>
          </div>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={(open) => { setSheetOpen(open); if (!open) setEditing(null) }}>
        <SheetContent side="right" className="p-0 overflow-y-auto sheet-lg">
          <SheetHeader className="px-6 sm:px-8 py-6" style={{ borderBottom: '1px solid var(--border)' }}>
            <SheetTitle style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
              {editing ? 'Edit calendar event' : 'Add calendar event'}
            </SheetTitle>
            <FormInfoBox lines={editing ? formInfo.editCalendarEvent : formInfo.addCalendarEvent} />
          </SheetHeader>
          <div className="px-6 sm:px-8 py-6 flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="calendar-event-title" style={{ color: 'var(--muted-foreground)' }}>Title</Label>
              <Input
                id="calendar-event-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. First Semester begins"
                style={inputStyle}
              />
            </div>
            <div className="space-y-2">
              <Label style={{ color: 'var(--muted-foreground)' }}>Category</Label>
              <Select
                value={form.category}
                onValueChange={(value) => setForm((f) => ({ ...f, category: value as typeof EVENT_TYPES[number] }))}
              >
                <SelectTrigger style={inputStyle}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
                {form.category === 'Semester'
                  ? 'A Semester event whose dates include today opens course registration for that semester.'
                  : 'This is a calendar notice. Only a Semester event opens student registration.'}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="calendar-event-start" style={{ color: 'var(--muted-foreground)' }}>Start date</Label>
                <Input
                  id="calendar-event-start"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  style={inputStyle}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="calendar-event-end" style={{ color: 'var(--muted-foreground)' }}>End date</Label>
                <Input
                  id="calendar-event-end"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="calendar-event-description" style={{ color: 'var(--muted-foreground)' }}>Description</Label>
              <Textarea
                id="calendar-event-description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="Optional details"
                style={inputStyle}
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-3 mt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setSheetOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={saveMutation.isPending}
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
                style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}
              >
                {saveMutation.isPending ? 'Saving…' : editing ? 'Save changes' : 'Save event'}
              </Button>
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
        title={editing ? 'Save these calendar changes?' : 'Add this calendar event?'}
        tone="success"
        headlineLabel="Action"
        headline={editing ? 'Update event' : 'Create event'}
        summary={`${form.title.trim()} will be saved on the academic calendar.`}
        notices={[
          { icon: 'info', label: 'Students and lecturers will be notified and can see this event.' },
          ...(form.category === 'Semester'
            ? [
                { icon: 'info' as const, label: 'If the dates include today, this semester opens for course registration.' },
              ]
            : []),
        ]}
        confirmLabel={saveMutation.isPending ? 'Saving…' : 'Confirm'}
        confirmVariant="brand"
        loading={saveMutation.isPending}
        onCancel={() => setConfirmSave(false)}
        onConfirm={() => saveMutation.mutate()}
      />
    </AcademicShell>
  )
}

function EventList({
  title,
  events,
  scroll,
  onEdit,
  onDelete,
}: {
  title: string
  events: AcademicCalendarEvent[]
  scroll?: boolean
  onEdit: (event: AcademicCalendarEvent) => void
  onDelete: (event: AcademicCalendarEvent) => void
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
                <div
                  key={ev.id}
                  className="p-3 rounded-xl w-full"
                  style={{ backgroundColor: bg, border: `1px solid ${color}20` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(ev)}
                      className="text-left min-w-0 flex-1"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      <p className="text-sm font-semibold">{ev.title}</p>
                      <p className="t-caption mt-0.5">{formatEventRange(ev.startDate, ev.endDate)}</p>
                      {ev.description ? <p className="t-caption mt-1">{ev.description}</p> : null}
                    </button>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="t-label px-1.5 py-0.5" style={{ backgroundColor: 'rgba(255,255,255,0.5)', color, fontSize: 10 }}>{ev.type}</span>
                      <IconActionButton label="Edit event" icon={Pencil} onClick={() => onEdit(ev)} />
                      <IconActionButton label="Delete event" icon={Trash2} danger onClick={() => onDelete(ev)} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
