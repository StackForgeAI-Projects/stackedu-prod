import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import type { AcademicTimetableSlot } from '@stackedu/shared'
import {
  TIMETABLE_GRID_DAYS,
  findTimetableClashes,
  timetableAvailabilityLabel,
  timetableWeekdayLabel,
} from '@stackedu/shared'
import { AcademicShell } from '@/components/AcademicShell'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { FormInfoBox } from '@/components/FormInfoBox'
import { TimetableClashBanner } from '@/components/timetable/TimetableClashBanner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { formInfo } from '@/lib/form-info-copy'
import {
  academicCoursesQueryKey,
  academicLecturersQueryKey,
  academicRoomsQueryKey,
  academicTimetableQueryKey,
  createAcademicTimetableSlot,
  deleteAcademicTimetableSlot,
  listAcademicCourses,
  listAcademicLecturers,
  listAcademicRooms,
  listAcademicTimetableSlots,
  updateAcademicTimetableSlot,
} from '@/lib/api/academic'
import { lecturerDashboardQueryKey, lecturerTimetableQueryKey } from '@/lib/api/lecturer'
import { studentDashboardQueryKey } from '@/lib/api/student'
import { apiErrorMessage } from '@/lib/api/client'
import { notifyError, notifySuccess } from '@/lib/notify'

export const Route = createFileRoute('/_auth/academic/timetable')({
  component: TimetableManagerPage,
})

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
const SESSION_TYPES = ['Lecture', 'Tutorial', 'Lab', 'Practical'] as const
type SessionType = (typeof SESSION_TYPES)[number]

type ClassForm = {
  courseId: string
  lecturerId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  sessionType: SessionType
  roomId: string
}

const EMPTY_FORM: ClassForm = {
  courseId: '',
  lecturerId: '',
  dayOfWeek: 1,
  startTime: '08:00',
  endTime: '10:00',
  sessionType: 'Lecture',
  roomId: '',
}

function fmt(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`
}

function clock(value: string) {
  return value.slice(0, 5)
}

function sessionTypeOf(value: string): SessionType {
  return SESSION_TYPES.includes(value as SessionType) ? (value as SessionType) : 'Lecture'
}

function TimetableManagerPage() {
  const queryClient = useQueryClient()
  const { data, isPending, error } = useQuery({
    queryKey: academicTimetableQueryKey,
    queryFn: listAcademicTimetableSlots,
  })
  const { data: courses = [] } = useQuery({
    queryKey: academicCoursesQueryKey,
    queryFn: listAcademicCourses,
  })
  const { data: lecturers = [] } = useQuery({
    queryKey: academicLecturersQueryKey,
    queryFn: listAcademicLecturers,
  })
  const { data: rooms = [] } = useQuery({
    queryKey: academicRoomsQueryKey,
    queryFn: listAcademicRooms,
  })

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ClassForm>(EMPTY_FORM)
  const [confirmSave, setConfirmSave] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const slots = data ?? []
  const selected = slots.find((slot) => slot.id === selectedId) ?? null
  const editing = slots.find((slot) => slot.id === editingId) ?? null
  const deleting = slots.find((slot) => slot.id === deleteId) ?? null
  const activeCourses = courses.filter((course) => course.status === 'Active')
  const lecturerOptions = lecturers.filter((row) => row.status === 'Active' || row.id === form.lecturerId)
  const selectedCourse = activeCourses.find((course) => course.id === form.courseId)
  const selectedLecturer = lecturerOptions.find((row) => row.id === form.lecturerId)
  const selectedRoom = rooms.find((room) => room.id === form.roomId)

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

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: academicTimetableQueryKey })
    await queryClient.invalidateQueries({ queryKey: academicCoursesQueryKey })
    await queryClient.invalidateQueries({ queryKey: lecturerTimetableQueryKey })
    await queryClient.invalidateQueries({ queryKey: lecturerDashboardQueryKey })
    await queryClient.invalidateQueries({ queryKey: studentDashboardQueryKey })
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        lecturerId: form.lecturerId,
        dayOfWeek: form.dayOfWeek,
        startTime: clock(form.startTime),
        endTime: clock(form.endTime),
        sessionType: form.sessionType,
        roomId: form.roomId,
      }
      return editing
        ? updateAcademicTimetableSlot(editing.id, payload)
        : createAcademicTimetableSlot({ ...payload, courseId: form.courseId })
    },
    onSuccess: async () => {
      notifySuccess(editing ? 'Class updated. The lecturer needs to confirm again.' : 'Class saved. The lecturer has been asked to confirm.')
      setConfirmSave(false)
      setFormOpen(false)
      setEditingId(null)
      setForm(EMPTY_FORM)
      await refresh()
    },
    onError: (err) => notifyError(apiErrorMessage(err, 'Could not save that class.')),
  })

  const deleteMutation = useMutation({
    mutationFn: (slotId: string) => deleteAcademicTimetableSlot(slotId),
    onSuccess: async () => {
      notifySuccess('Class removed from the timetable.')
      setDeleteId(null)
      setSelectedId(null)
      await refresh()
    },
    onError: (err) => notifyError(apiErrorMessage(err, 'Could not remove that class.')),
  })

  const openCreate = () => {
    const course = activeCourses[0]
    setEditingId(null)
    setForm({
      ...EMPTY_FORM,
      courseId: course?.id ?? '',
      lecturerId: course?.lecturerId ?? '',
    })
    setFormOpen(true)
  }

  const openEdit = (slot: AcademicTimetableSlot) => {
    setSelectedId(null)
    setEditingId(slot.id)
    setForm({
      courseId: slot.courseId,
      lecturerId: slot.lecturerId ?? '',
      dayOfWeek: slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
      sessionType: sessionTypeOf(slot.type),
      roomId: slot.roomId ?? '',
    })
    setFormOpen(true)
  }

  const formReady = Boolean(form.courseId && form.lecturerId && form.roomId && form.startTime && form.endTime)

  return (
    <AcademicShell pageTitle="Timetable" guideKey="academic:Timetable:lifecycle">
      <div className="page-body animate-fade-up">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>
              Timetable
            </h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
              Add the week here. Students see a class only after the lecturer confirms they are free.
            </p>
          </div>
          <Button onClick={openCreate} disabled={activeCourses.length === 0} className="self-start sm:self-auto">
            <Plus style={{ width: 16, height: 16, marginRight: 6 }} />
            Add class
          </Button>
        </div>

        {error ? (
          <p className="t-body mb-4" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load timetable.')}</p>
        ) : null}

        <TimetableClashBanner
          clashes={clashes}
          uniqueCount={clashIds.size}
          hint="A taken room or lecturer cannot be booked again. Edit one of the classes."
        />

        {isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading timetable…</p>
        ) : slots.length === 0 ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
            No classes yet. Add one with a course, lecturer, day, time, and location.
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
                                <div style={{ height: 72 }} />
                              ) : (
                                <div className="flex flex-col gap-1">
                                  {cellSlots.map((slot) => (
                                    <SlotCard
                                      key={slot.id}
                                      slot={slot}
                                      clashing={clashIds.has(slot.id)}
                                      onOpen={() => setSelectedId(slot.id)}
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
                          onClick={() => setSelectedId(slot.id)}
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
                              {slot.startTime}–{slot.endTime} · {slot.room ?? 'No location'}
                              {slot.lecturer ? ` · ${slot.lecturer}` : ''}
                            </p>
                            <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                              {timetableAvailabilityLabel(slot.availabilityStatus)}
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

      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelectedId(null) }}>
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
                  {selected.room ?? 'No location'} · {selected.type}
                </p>
                <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  {selected.lecturer ?? 'No lecturer assigned'}
                </p>
                <p className="text-sm mt-2" style={{ color: 'var(--foreground)' }}>
                  {timetableAvailabilityLabel(selected.availabilityStatus)}
                </p>
                {selected.changeReason ? (
                  <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
                    Lecturer’s reason: {selected.changeReason}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedId(null)}>Close</Button>
                <Button variant="outline" onClick={() => setDeleteId(selected.id)}>Remove</Button>
                <Button onClick={() => openEdit(selected)}>Edit</Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={formOpen} onOpenChange={(open) => { if (!open) { setFormOpen(false); setEditingId(null) } }}>
        <DialogContent className="max-w-md w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit class' : 'Add class'}</DialogTitle>
            <FormInfoBox lines={editing ? formInfo.editTimetableSlot : formInfo.addTimetableSlot} />
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <Label className="mb-1.5 block">Course</Label>
              <Select
                value={form.courseId || undefined}
                onValueChange={(courseId) => {
                  const course = activeCourses.find((row) => row.id === courseId)
                  setForm((current) => ({
                    ...current,
                    courseId,
                    lecturerId: course?.lecturerId ?? '',
                  }))
                }}
                disabled={Boolean(editing)}
              >
                <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>
                  {activeCourses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>{course.code} — {course.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Lecturer</Label>
              <Select
                value={form.lecturerId || undefined}
                onValueChange={(lecturerId) => setForm((current) => ({ ...current, lecturerId }))}
              >
                <SelectTrigger><SelectValue placeholder="Select lecturer" /></SelectTrigger>
                <SelectContent>
                  {lecturerOptions.map((row) => (
                    <SelectItem key={row.id} value={row.id}>{row.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Day</Label>
              <Select
                value={String(form.dayOfWeek)}
                onValueChange={(value) => setForm((current) => ({ ...current, dayOfWeek: Number(value) }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIMETABLE_GRID_DAYS.map((day) => (
                    <SelectItem key={day.iso} value={String(day.iso)}>{day.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block">From</Label>
                <Input type="time" value={form.startTime} onChange={(e) => setForm((current) => ({ ...current, startTime: e.target.value }))} />
              </div>
              <div>
                <Label className="mb-1.5 block">To</Label>
                <Input type="time" value={form.endTime} onChange={(e) => setForm((current) => ({ ...current, endTime: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Session type</Label>
              <Select
                value={form.sessionType}
                onValueChange={(value) => setForm((current) => ({ ...current, sessionType: sessionTypeOf(value) }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SESSION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Location</Label>
              <Select
                value={form.roomId || undefined}
                onValueChange={(roomId) => setForm((current) => ({ ...current, roomId }))}
              >
                <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}{room.building ? ` (${room.building})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {rooms.length === 0 ? (
                <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
                  No locations yet. Ask ICT to add a room first.
                </p>
              ) : null}
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
              <Button variant="outline" onClick={() => { setFormOpen(false); setEditingId(null) }}>Cancel</Button>
              <Button disabled={!formReady || saveMutation.isPending} onClick={() => setConfirmSave(true)}>
                {editing ? 'Save changes' : 'Save class'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmAlertDialog
        open={confirmSave}
        onOpenChange={setConfirmSave}
        title={editing ? 'Save this class?' : 'Add this class?'}
        tone="success"
        headline={editing ? 'Update the timetable' : 'Add to the timetable'}
        summary={`${selectedCourse?.code ?? editing?.courseCode ?? 'Course'} · ${selectedLecturer?.name ?? 'Lecturer'} · ${timetableWeekdayLabel(form.dayOfWeek)} ${clock(form.startTime)}–${clock(form.endTime)}${selectedRoom ? ` · ${selectedRoom.name}` : ''}.`}
        notices={[
          { icon: 'bell', label: 'The lecturer is notified and must confirm they are free before students see this class.' },
          { icon: 'shield', label: 'If this room or lecturer is already booked in that time, the save is refused.' },
        ]}
        confirmLabel={saveMutation.isPending ? 'Saving…' : editing ? 'Save changes' : 'Save class'}
        confirmVariant="brand"
        loading={saveMutation.isPending}
        onConfirm={() => saveMutation.mutate()}
      />

      <ConfirmAlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => { if (!open) setDeleteId(null) }}
        title="Remove this class?"
        tone="destructive"
        headline="This cannot be undone"
        summary={deleting
          ? `${deleting.courseCode} on ${timetableWeekdayLabel(deleting.day)} ${deleting.startTime}–${deleting.endTime} will leave the timetable.`
          : ''}
        confirmLabel={deleteMutation.isPending ? 'Removing…' : 'Remove'}
        confirmVariant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={() => { if (deleting) deleteMutation.mutate(deleting.id) }}
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
        minHeight: 72,
      }}
    >
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: clashing ? 'var(--error)' : slot.color, marginBottom: 2 }}>{slot.courseCode}</p>
      <p className="text-xs truncate" style={{ fontWeight: 500, marginBottom: 2 }}>{slot.courseName}</p>
      <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{slot.room ?? 'No location'}</p>
      <span style={{ fontSize: 9, fontWeight: 600, color: clashing ? 'var(--error)' : slot.color, textTransform: 'uppercase' }}>
        {timetableAvailabilityLabel(slot.availabilityStatus)}
      </span>
    </button>
  )
}
