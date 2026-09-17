import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import type { AcademicTimetableSlot } from '@stackedu/shared'
import { TIMETABLE_GRID_DAYS, findTimetableClashes, timetableWeekdayLabel } from '@stackedu/shared'
import { AcademicShell } from '@/components/AcademicShell'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { TimetableClashBanner } from '@/components/timetable/TimetableClashBanner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  academicTimetableQueryKey,
  askLecturerToFreeTimetableSlot,
  listAcademicTimetableSlots,
} from '@/lib/api/academic'
import { apiErrorMessage } from '@/lib/api/client'
import { notifyError, notifySuccess } from '@/lib/notify'

export const Route = createFileRoute('/_auth/academic/timetable')({
  component: TimetableManagerPage,
})

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17]

function fmt(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`
}

function TimetableManagerPage() {
  const { data, isPending, error } = useQuery({
    queryKey: academicTimetableQueryKey,
    queryFn: listAcademicTimetableSlots,
  })
  const [selected, setSelected] = useState<AcademicTimetableSlot | null>(null)
  const [message, setMessage] = useState('')
  const [confirmAsk, setConfirmAsk] = useState(false)

  const slots = data ?? []
  const clashes = useMemo(
    () => findTimetableClashes(slots.map((slot) => ({
      id: slot.id,
      dayOfWeek: slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
      courseCode: slot.courseCode,
      room: slot.room,
      lecturer: slot.lecturer,
      lecturerId: slot.lecturerId,
    }))),
    [slots],
  )
  const clashIds = useMemo(() => new Set(clashes.flatMap((clash) => clash.slotIds)), [clashes])

  const openSlot = (slot: AcademicTimetableSlot) => {
    setSelected(slot)
    setMessage('')
    setConfirmAsk(false)
  }

  const askMutation = useMutation({
    mutationFn: () => {
      if (!selected) throw new Error('No class selected.')
      return askLecturerToFreeTimetableSlot(selected.id, { message })
    },
    onSuccess: ({ lecturerName }) => {
      notifySuccess(`Message sent to ${lecturerName}.`)
      setConfirmAsk(false)
      setMessage('')
      setSelected(null)
    },
    onError: (err) => notifyError(apiErrorMessage(err, 'Could not send that message.')),
  })

  return (
    <AcademicShell pageTitle="Timetable" guideKey="academic:Timetable:lifecycle">
      <div className="page-body animate-fade-up">
        <div className="mb-6">
          <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>
            Timetable
          </h1>
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
            Live class times for this semester. Lecturers add or change a slot on their Timetable page.
          </p>
        </div>

        {error ? (
          <p className="t-body mb-4" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load timetable.')}</p>
        ) : null}

        <TimetableClashBanner
          clashes={clashes}
          uniqueCount={clashIds.size}
          hint="Open a class and message the lecturer if you need that room. A taken room cannot be booked again."
        />

        {isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading timetable…</p>
        ) : slots.length === 0 ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
            No class times yet. Lecturers add them from Timetable after you assign them to a course.
          </p>
        ) : (
          <>
            <div className="hidden md:block" style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div className="overflow-x-auto">
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                  <thead>
                    <tr>
                      <th className="t-label" style={{ padding: '12px 16px', width: 72, borderBottom: '1px solid var(--border)', textAlign: 'left' }}>Time</th>
                      {TIMETABLE_GRID_DAYS.map((day) => (
                        <th key={day.iso} className="t-label text-center" style={{ padding: '12px 8px', borderBottom: '1px solid var(--border)' }}>{day.short}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {HOURS.map((hour) => (
                      <tr key={hour} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="t-mono" style={{ color: 'var(--muted-foreground)', padding: '8px 16px', fontSize: 11, verticalAlign: 'top' }}>{fmt(hour)}</td>
                        {TIMETABLE_GRID_DAYS.map((day) => {
                          const cellSlots = slots.filter((slot) => slot.day === day.iso && slot.hour === hour)
                          return (
                            <td key={day.iso} style={{ padding: 4, verticalAlign: 'top' }}>
                              {cellSlots.length === 0 ? (
                                <div style={{ height: 64 }} />
                              ) : (
                                <div className="flex flex-col gap-1">
                                  {cellSlots.map((slot) => (
                                    <SlotCard
                                      key={slot.id}
                                      slot={slot}
                                      clashing={clashIds.has(slot.id)}
                                      onOpen={() => openSlot(slot)}
                                    />
                                  ))}
                                </div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="md:hidden flex flex-col gap-4">
              {TIMETABLE_GRID_DAYS.map((day) => {
                const daySlots = slots
                  .filter((slot) => slot.day === day.iso)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                return (
                  <div
                    key={day.iso}
                    style={{
                      backgroundColor: 'var(--card)',
                      borderRadius: 'var(--radius-xl)',
                      border: '1px solid var(--border)',
                      overflow: 'hidden',
                    }}
                  >
                    <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
                      <p className="t-h3" style={{ fontFamily: 'var(--font-display)' }}>{day.label}</p>
                    </div>
                    {daySlots.length === 0 ? (
                      <p className="text-sm px-4 py-4" style={{ color: 'var(--muted-foreground)' }}>No classes</p>
                    ) : (
                      daySlots.map((slot) => (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => openSlot(slot)}
                          className="flex items-start gap-3 px-4 py-3 w-full text-left"
                          style={{
                            borderTop: '1px solid var(--border)',
                            backgroundColor: clashIds.has(slot.id) ? 'var(--error-bg)' : 'transparent',
                          }}
                        >
                          <div className="shrink-0 rounded-lg" style={{ width: 4, height: 40, backgroundColor: clashIds.has(slot.id) ? 'var(--error)' : slot.color }} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{slot.courseName}</p>
                            <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                              {slot.startTime}–{slot.endTime}{slot.room ? ` · ${slot.room}` : ''}
                              {slot.lecturer ? ` · ${slot.lecturer}` : ''}
                            </p>
                          </div>
                          <span className="t-label px-2 py-0.5 shrink-0" style={{ color: slot.color, fontFamily: 'var(--font-mono)', fontSize: 10 }}>{slot.courseCode}</span>
                        </button>
                      ))
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) { setSelected(null); setMessage('') } }}>
        <DialogContent className="max-w-md w-[calc(100%-2rem)]">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle className="pr-8" style={{ fontFamily: 'var(--font-display)' }}>{selected.courseName}</DialogTitle>
              </DialogHeader>
              <div
                className="rounded-xl px-4 py-3"
                style={{ backgroundColor: `${selected.color}14`, border: `1px solid ${clashIds.has(selected.id) ? 'var(--error)' : `${selected.color}40`}` }}
              >
                <p className="t-label" style={{ color: selected.color, fontFamily: 'var(--font-mono)' }}>{selected.courseCode}</p>
                <p className="text-sm mt-1" style={{ color: 'var(--foreground)' }}>
                  {timetableWeekdayLabel(selected.day)} · {selected.startTime}–{selected.endTime}
                </p>
                <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  {selected.room ?? 'No room yet'} · {selected.type}
                </p>
                <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  {selected.lecturer ?? 'No lecturer assigned'}
                </p>
              </div>
              {clashIds.has(selected.id) ? (
                <p className="text-sm" style={{ color: 'var(--error)' }}>
                  This class overlaps another. A room cannot be booked twice. Message the lecturer if you need this hall.
                </p>
              ) : (
                <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
                  To change the time or room, the lecturer edits it on their Timetable page. Message them if you need this hall for something else.
                </p>
              )}
              {selected.lecturerId ? (
                <div>
                  <Label htmlFor="room-message" className="mb-1.5 block">Message to {selected.lecturer}</Label>
                  <Textarea
                    id="room-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Why this room is needed, and by when."
                    rows={3}
                  />
                </div>
              ) : (
                <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>Assign a lecturer to this course before you can send a message.</p>
              )}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                <Button variant="outline" onClick={() => { setSelected(null); setMessage('') }}>Close</Button>
                <Button
                  disabled={!selected.lecturerId || !message.trim() || askMutation.isPending}
                  onClick={() => setConfirmAsk(true)}
                >
                  Message lecturer
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmAlertDialog
        open={confirmAsk}
        onOpenChange={setConfirmAsk}
        title="Send this message?"
        tone="info"
        headline="Ask the lecturer to free the room"
        summary={selected
          ? `${selected.lecturer} · ${selected.room ?? 'This room'} · ${timetableWeekdayLabel(selected.day)} ${selected.startTime}–${selected.endTime}.`
          : ''}
        notices={[
          { icon: 'bell', label: 'The lecturer gets this in Notifications. If their phone browser is open but minimised, a popup can appear too.' },
        ]}
        confirmLabel={askMutation.isPending ? 'Sending…' : 'Send message'}
        confirmVariant="brand"
        loading={askMutation.isPending}
        onConfirm={() => askMutation.mutate()}
      />
    </AcademicShell>
  )
}

function SlotCard({
  slot,
  clashing,
  onOpen,
}: {
  slot: AcademicTimetableSlot
  clashing: boolean
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left p-2.5 rounded-lg"
      style={{
        backgroundColor: clashing ? 'var(--error-bg)' : `${slot.color}18`,
        border: `1px solid ${clashing ? 'var(--error)' : `${slot.color}40`}`,
        minHeight: 64,
      }}
    >
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: clashing ? 'var(--error)' : slot.color, marginBottom: 2 }}>{slot.courseCode}</p>
      <p className="text-xs truncate" style={{ fontWeight: 500, marginBottom: 2 }}>{slot.courseName}</p>
      <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{slot.room ?? 'No room yet'}</p>
      <span style={{ fontSize: 9, fontWeight: 600, color: clashing ? 'var(--error)' : slot.color, textTransform: 'uppercase' }}>{slot.type}</span>
    </button>
  )
}
