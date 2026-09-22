import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import type { LecturerTimetableSlot } from '@stackedu/shared'
import { findTimetableClashes, timetableAvailabilityLabel, timetableWeekdayLabel } from '@stackedu/shared'
import { LecturerShell } from '@/components/LecturerShell'
import { CourseCodePill } from '@/components/CourseCodePill'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { PagedList } from '@/components/ListPagination'
import { TimetableClashBanner } from '@/components/timetable/TimetableClashBanner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { apiErrorMessage } from '@/lib/api/client'
import { academicTimetableQueryKey } from '@/lib/api/academic'
import {
  confirmLecturerTimetableSlot,
  lecturerDashboardQueryKey,
  lecturerTimetableQueryKey,
  listLecturerTimetableSlots,
  requestLecturerTimetableChange,
} from '@/lib/api/lecturer'
import { studentDashboardQueryKey } from '@/lib/api/student'
import { notifyError, notifySuccess } from '@/lib/notify'

export const Route = createFileRoute('/_auth/lecturer/timetable')({
  component: LecturerTimetablePage,
})

function dayLabel(dayOfWeek: number): string {
  return timetableWeekdayLabel(dayOfWeek)
}

function LecturerTimetablePage() {
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [changeOpen, setChangeOpen] = useState(false)
  const [confirmChange, setConfirmChange] = useState(false)
  const [reason, setReason] = useState('')

  const { data: slots = [], isPending, error } = useQuery({
    queryKey: lecturerTimetableQueryKey,
    queryFn: listLecturerTimetableSlots,
  })

  const selected = slots.find((slot) => slot.id === selectedId) ?? null
  const sortedSlots = useMemo(
    () => [...slots].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)),
    [slots],
  )
  const clashes = useMemo(
    () => findTimetableClashes(sortedSlots.map((slot) => ({
      id: slot.id,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      courseCode: slot.courseCode,
      room: slot.room,
      lecturer: 'You',
    }))),
    [sortedSlots],
  )
  const clashIds = useMemo(() => new Set(clashes.flatMap((clash) => clash.slotIds)), [clashes])

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: lecturerTimetableQueryKey })
    await queryClient.invalidateQueries({ queryKey: lecturerDashboardQueryKey })
    await queryClient.invalidateQueries({ queryKey: academicTimetableQueryKey })
    await queryClient.invalidateQueries({ queryKey: studentDashboardQueryKey })
  }

  const confirmMutation = useMutation({
    mutationFn: (slotId: string) => confirmLecturerTimetableSlot(slotId),
    onSuccess: async () => {
      notifySuccess('Availability confirmed. Students can see this class.')
      setConfirmOpen(false)
      setSelectedId(null)
      await refresh()
    },
    onError: (err) => notifyError(apiErrorMessage(err, 'Could not confirm that class.')),
  })

  const changeMutation = useMutation({
    mutationFn: () => {
      if (!selected) throw new Error('No class selected.')
      return requestLecturerTimetableChange(selected.id, { reason: reason.trim() })
    },
    onSuccess: async () => {
      notifySuccess('Change request sent to Academic Admin.')
      setConfirmChange(false)
      setChangeOpen(false)
      setReason('')
      setSelectedId(null)
      await refresh()
    },
    onError: (err) => notifyError(apiErrorMessage(err, 'Could not send that request.')),
  })

  const openSlot = (slot: LecturerTimetableSlot) => {
    setSelectedId(slot.id)
    setReason(slot.changeReason ?? '')
  }

  return (
    <LecturerShell
      pageTitle="Timetable"
      guide="Academic Admin sets your class times. Confirm you are free, or ask for a different time and say why. Students see the class only after you confirm."
    >
      <div className="page-body animate-fade-up">
        <div className="mb-6">
          <h1
            className="t-h1 mb-1"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}
          >
            Timetable
          </h1>
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
            Confirm the times Academic Admin assigned, or ask for a change.
          </p>
        </div>

        {error ? (
          <p className="t-body mb-4" style={{ color: 'var(--error)' }}>
            {apiErrorMessage(error, 'Could not load timetable.')}
          </p>
        ) : null}

        <TimetableClashBanner
          clashes={clashes}
          uniqueCount={clashIds.size}
          hint="Ask Academic Admin to move one class. A taken room cannot be booked again."
        />

        {isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading timetable…</p>
        ) : sortedSlots.length === 0 ? (
          <div
            className="p-6 rounded-xl text-center"
            style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <CalendarDays style={{ width: 28, height: 28, color: 'var(--muted-foreground)', margin: '0 auto 12px' }} />
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
              No classes yet. Academic Admin adds them on the Timetable page.
            </p>
          </div>
        ) : (
          <PagedList
            items={sortedSlots}
            getKey={(slot) => slot.id}
            defaultPageSize={5}
            itemLabel="classes"
            renderItem={(slot) => (
              <button
                type="button"
                onClick={() => openSlot(slot)}
                className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl w-full text-left"
                style={{
                  backgroundColor: clashIds.has(slot.id) ? 'var(--error-bg)' : 'var(--card)',
                  border: `1px solid ${clashIds.has(slot.id) ? 'var(--error)' : 'var(--border)'}`,
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <CourseCodePill code={slot.courseCode} color={slot.color} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>{slot.courseName}</p>
                  <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                    {dayLabel(slot.dayOfWeek)} · {slot.startTime} – {slot.endTime}
                    {slot.room ? ` · ${slot.room}` : ''}
                  </p>
                  <span
                    className="t-label inline-block mt-1.5 px-2 py-0.5"
                    style={{
                      backgroundColor: `${slot.color}18`,
                      color: slot.color,
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 10,
                    }}
                  >
                    {timetableAvailabilityLabel(slot.availabilityStatus)}
                  </span>
                </div>
              </button>
            )}
          />
        )}

        <p className="t-caption mt-6" style={{ color: 'var(--muted-foreground)' }}>
          Confirmed classes appear on the student timetable.
          {' '}
          <Link to="/lecturer/courses" className="underline hover:opacity-80">View courses →</Link>
        </p>
      </div>

      <Dialog open={selected !== null && !changeOpen} onOpenChange={(open) => { if (!open) setSelectedId(null) }}>
        <DialogContent className="max-w-md w-[calc(100%-2rem)]">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle className="pr-8" style={{ fontFamily: 'var(--font-display)' }}>{selected.courseName}</DialogTitle>
              </DialogHeader>
              <div className="rounded-xl px-4 py-3" style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}>
                <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                  {dayLabel(selected.dayOfWeek)} · {selected.startTime}–{selected.endTime}
                </p>
                <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
                  {selected.room ?? 'No location'} · {selected.sessionType}
                </p>
                <p className="text-sm mt-2" style={{ color: 'var(--foreground)' }}>
                  {timetableAvailabilityLabel(selected.availabilityStatus)}
                </p>
                {selected.changeReason ? (
                  <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
                    Your reason: {selected.changeReason}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedId(null)}>Close</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setReason(selected.changeReason ?? '')
                    setChangeOpen(true)
                  }}
                >
                  Request a change
                </Button>
                {selected.availabilityStatus !== 'Confirmed' ? (
                  <Button onClick={() => setConfirmOpen(true)}>Confirm availability</Button>
                ) : null}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={changeOpen} onOpenChange={(open) => { if (!open) setChangeOpen(false) }}>
        <DialogContent className="max-w-md w-[calc(100%-2rem)]">
          <DialogHeader>
            <DialogTitle>Request a time change</DialogTitle>
          </DialogHeader>
          <div>
            <Label htmlFor="change-reason" className="mb-1.5 block">Reason</Label>
            <Textarea
              id="change-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Say which day or time does not work."
              rows={4}
            />
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setChangeOpen(false)}>Cancel</Button>
            <Button disabled={reason.trim().length < 4} onClick={() => setConfirmChange(true)}>
              Send request
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmAlertDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirm you are free?"
        tone="success"
        headline="This class goes live for students"
        summary={selected
          ? `${selected.courseCode} · ${dayLabel(selected.dayOfWeek)} ${selected.startTime}–${selected.endTime}${selected.room ? ` · ${selected.room}` : ''}.`
          : ''}
        notices={[
          { icon: 'bell', label: 'Registered students are notified and the class appears on their timetable.' },
        ]}
        confirmLabel={confirmMutation.isPending ? 'Confirming…' : 'Confirm availability'}
        confirmVariant="brand"
        loading={confirmMutation.isPending}
        onConfirm={() => { if (selected) confirmMutation.mutate(selected.id) }}
      />

      <ConfirmAlertDialog
        open={confirmChange}
        onOpenChange={setConfirmChange}
        title="Send this change request?"
        tone="warning"
        headline="Academic Admin will see your reason"
        summary={selected
          ? `${selected.courseCode} · ${dayLabel(selected.dayOfWeek)} ${selected.startTime}–${selected.endTime}. ${reason.trim()}`
          : ''}
        notices={[
          { icon: 'bell', label: 'Students do not see this class until you confirm a time.' },
        ]}
        confirmLabel={changeMutation.isPending ? 'Sending…' : 'Send request'}
        confirmVariant="brand"
        loading={changeMutation.isPending}
        onConfirm={() => changeMutation.mutate()}
      />
    </LecturerShell>
  )
}
