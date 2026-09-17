import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Pencil, Plus, Trash2 } from 'lucide-react'
import type { LecturerTimetableSlot, SaveLecturerTimetableSlotRequest } from '@stackedu/shared'
import { TIMETABLE_WEEKDAYS, findTimetableClashes, timetableWeekdayLabel } from '@stackedu/shared'
import { LecturerShell } from '@/components/LecturerShell'
import { CourseCodePill } from '@/components/CourseCodePill'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { PagedList } from '@/components/ListPagination'
import { TimetableClashBanner } from '@/components/timetable/TimetableClashBanner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { apiErrorMessage } from '@/lib/api/client'
import {
  createLecturerTimetableSlot,
  deleteLecturerTimetableSlot,
  lecturerCoursesQueryKey,
  lecturerDashboardQueryKey,
  lecturerRoomsQueryKey,
  lecturerTimetableQueryKey,
  listLecturerCourses,
  listLecturerRooms,
  listLecturerTimetableSlots,
  updateLecturerTimetableSlot,
} from '@/lib/api/lecturer'

export const Route = createFileRoute('/_auth/lecturer/timetable')({
  component: LecturerTimetablePage,
})

const SESSION_TYPES = ['Lecture', 'Tutorial', 'Lab', 'Practical'] as const

type SlotForm = {
  offeringId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  sessionType: (typeof SESSION_TYPES)[number]
  roomId: string
}

const EMPTY_FORM: SlotForm = {
  offeringId: '',
  dayOfWeek: 1,
  startTime: '08:00',
  endTime: '10:00',
  sessionType: 'Lecture',
  roomId: '',
}

function dayLabel(dayOfWeek: number): string {
  return timetableWeekdayLabel(dayOfWeek)
}

function LecturerTimetablePage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [confirmSave, setConfirmSave] = useState(false)
  const [editingSlot, setEditingSlot] = useState<LecturerTimetableSlot | null>(null)
  const [deleteSlot, setDeleteSlot] = useState<LecturerTimetableSlot | null>(null)
  const [form, setForm] = useState<SlotForm>(EMPTY_FORM)

  const { data: courses = [] } = useQuery({
    queryKey: lecturerCoursesQueryKey,
    queryFn: listLecturerCourses,
  })
  const { data: rooms = [] } = useQuery({
    queryKey: lecturerRoomsQueryKey,
    queryFn: listLecturerRooms,
  })
  const { data: slots = [], isPending, error } = useQuery({
    queryKey: lecturerTimetableQueryKey,
    queryFn: listLecturerTimetableSlots,
  })

  useEffect(() => {
    if (!form.offeringId && courses[0]) {
      setForm((current) => ({ ...current, offeringId: courses[0]!.offeringId }))
    }
  }, [courses, form.offeringId])

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: lecturerTimetableQueryKey })
    void queryClient.invalidateQueries({ queryKey: lecturerCoursesQueryKey })
    void queryClient.invalidateQueries({ queryKey: lecturerDashboardQueryKey })
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: SaveLecturerTimetableSlotRequest = {
        offeringId: form.offeringId,
        dayOfWeek: form.dayOfWeek,
        startTime: form.startTime,
        endTime: form.endTime,
        sessionType: form.sessionType,
        roomId: form.roomId || null,
      }
      if (editingSlot) {
        return updateLecturerTimetableSlot(editingSlot.id, {
          dayOfWeek: payload.dayOfWeek,
          startTime: payload.startTime,
          endTime: payload.endTime,
          sessionType: payload.sessionType,
          roomId: payload.roomId,
        })
      }
      return createLecturerTimetableSlot(payload)
    },
    onSuccess: () => {
      toast.success(editingSlot ? 'Timetable slot updated.' : 'Timetable slot added.')
      setConfirmSave(false)
      setDialogOpen(false)
      setEditingSlot(null)
      setForm(EMPTY_FORM)
      invalidate()
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not save timetable slot.')),
  })

  const deleteMutation = useMutation({
    mutationFn: (slotId: string) => deleteLecturerTimetableSlot(slotId),
    onSuccess: () => {
      toast.success('Timetable slot removed.')
      setDeleteSlot(null)
      invalidate()
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not delete timetable slot.')),
  })

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
  const selectedCourse = courses.find((course) => course.offeringId === form.offeringId)
  const selectedRoom = rooms.find((room) => room.id === form.roomId)

  const openCreate = () => {
    setEditingSlot(null)
    setForm({
      ...EMPTY_FORM,
      offeringId: courses[0]?.offeringId ?? '',
    })
    setDialogOpen(true)
  }

  const openEdit = (slot: LecturerTimetableSlot) => {
    setEditingSlot(slot)
    const roomMatch = rooms.find((room) => room.name === slot.room)
    setForm({
      offeringId: slot.offeringId,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      sessionType: SESSION_TYPES.includes(slot.sessionType as (typeof SESSION_TYPES)[number])
        ? slot.sessionType as (typeof SESSION_TYPES)[number]
        : 'Lecture',
      roomId: roomMatch?.id ?? '',
    })
    setDialogOpen(true)
  }

  return (
    <LecturerShell
      pageTitle="Timetable"
      guide="Add class times for your assigned courses. A room or lecturer cannot be booked twice at the same time. Students and Academic Admin see the live week as soon as you save."
    >
      <div className="page-body animate-fade-up">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1
              className="t-h1 mb-1"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}
            >
              Timetable
            </h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
              Add and manage weekly class slots. A taken room cannot be booked again.
            </p>
          </div>
          <Button onClick={openCreate} disabled={courses.length === 0} className="self-start sm:self-auto">
            <Plus style={{ width: 16, height: 16, marginRight: 6 }} />
            Add slot
          </Button>
        </div>

        {error ? (
          <p className="t-body mb-4" style={{ color: 'var(--error)' }}>
            {apiErrorMessage(error, 'Could not load timetable.')}
          </p>
        ) : null}

        <TimetableClashBanner
          clashes={clashes}
          uniqueCount={clashIds.size}
          hint="Move one class. A taken room cannot be booked again."
        />

        {courses.length === 0 ? (
          <div
            className="p-6 rounded-xl text-center"
            style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <CalendarDays style={{ width: 28, height: 28, color: 'var(--muted-foreground)', margin: '0 auto 12px' }} />
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
              No courses assigned this semester. Contact Academic Admin to get course assignments first.
            </p>
          </div>
        ) : isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading timetable…</p>
        ) : sortedSlots.length === 0 ? (
          <div
            className="p-6 rounded-xl"
            style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <p className="t-body mb-4" style={{ color: 'var(--muted-foreground)' }}>
              No timetable slots yet. Add your first class time so students and Academic Admin can see your schedule.
            </p>
            <Button onClick={openCreate}>
              <Plus style={{ width: 16, height: 16, marginRight: 6 }} />
              Add first slot
            </Button>
          </div>
        ) : (
          <PagedList
            items={sortedSlots}
            getKey={(slot) => slot.id}
            defaultPageSize={5}
            itemLabel="slots"
            renderItem={(slot) => (
              <div
                className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl"
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
                    {slot.room ? ` · ${slot.room}` : ' · TBA'}
                  </p>
                  <span
                    className="t-label inline-block mt-1.5 px-2 py-0.5"
                    style={{
                      backgroundColor: `${slot.color}18`,
                      color: slot.color,
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 10,
                      textTransform: 'uppercase',
                    }}
                  >
                    {slot.sessionType}
                  </span>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Button variant="outline" size="sm" onClick={() => openEdit(slot)}>
                    <Pencil style={{ width: 14, height: 14, marginRight: 4 }} />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDeleteSlot(slot)}>
                    <Trash2 style={{ width: 14, height: 14, marginRight: 4 }} />
                    Remove
                  </Button>
                </div>
              </div>
            )}
          />
        )}

        <p className="t-caption mt-6" style={{ color: 'var(--muted-foreground)' }}>
          Slots appear on your dashboard, in My Courses, and in the Academic Admin timetable view.
          {' '}
          <Link to="/lecturer/courses" className="underline hover:opacity-80">View courses →</Link>
        </p>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>{editingSlot ? 'Edit timetable slot' : 'Add timetable slot'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-2">
            <div>
              <Label className="mb-1.5 block">Course</Label>
              <Select
                value={form.offeringId}
                onValueChange={(value) => setForm((current) => ({ ...current, offeringId: value }))}
                disabled={Boolean(editingSlot)}
              >
                <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.offeringId} value={course.offeringId}>
                      {course.code} — {course.name}
                    </SelectItem>
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
                  {TIMETABLE_WEEKDAYS.map((day) => (
                    <SelectItem key={day.iso} value={String(day.iso)}>{day.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block">Start</Label>
                <Input type="time" value={form.startTime} onChange={(e) => setForm((c) => ({ ...c, startTime: e.target.value }))} />
              </div>
              <div>
                <Label className="mb-1.5 block">End</Label>
                <Input type="time" value={form.endTime} onChange={(e) => setForm((c) => ({ ...c, endTime: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Session type</Label>
              <Select
                value={form.sessionType}
                onValueChange={(value) => setForm((current) => ({
                  ...current,
                  sessionType: value as (typeof SESSION_TYPES)[number],
                }))}
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
              <Label className="mb-1.5 block">Room (optional)</Label>
              <Select
                value={form.roomId || '__none__'}
                onValueChange={(value) => setForm((current) => ({
                  ...current,
                  roomId: value === '__none__' ? '' : value,
                }))}
              >
                <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No room / TBA</SelectItem>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}{room.building ? ` (${room.building})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={() => setConfirmSave(true)}
                disabled={!form.offeringId || saveMutation.isPending}
              >
                {editingSlot ? 'Save changes' : 'Add slot'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmAlertDialog
        open={confirmSave}
        onOpenChange={setConfirmSave}
        title={editingSlot ? 'Save this class time?' : 'Add this class time?'}
        tone="success"
        headline={editingSlot ? 'Update timetable' : 'Add to timetable'}
        summary={`${selectedCourse?.code ?? 'Course'} · ${dayLabel(form.dayOfWeek)} ${form.startTime}–${form.endTime}${selectedRoom ? ` · ${selectedRoom.name}` : ''}.`}
        notices={[
          { icon: 'clock', label: 'Students and Academic Admin see this on the live timetable as soon as you confirm.' },
          { icon: 'shield', label: 'If this room is already booked in that time, the save is refused. The room is not available.' },
        ]}
        confirmLabel={saveMutation.isPending ? 'Saving…' : editingSlot ? 'Save changes' : 'Add slot'}
        confirmVariant="brand"
        loading={saveMutation.isPending}
        onConfirm={() => saveMutation.mutate()}
      />

      <ConfirmAlertDialog
        open={Boolean(deleteSlot)}
        onOpenChange={(open) => { if (!open) setDeleteSlot(null) }}
        title="Remove timetable slot?"
        tone="destructive"
        headline="This cannot be undone"
        summary={deleteSlot
          ? `${deleteSlot.courseCode} on ${dayLabel(deleteSlot.dayOfWeek)} ${deleteSlot.startTime}–${deleteSlot.endTime} will be removed.`
          : ''}
        confirmLabel="Remove"
        confirmVariant="destructive"
        onConfirm={() => { if (deleteSlot) void deleteMutation.mutate(deleteSlot.id) }}
        loading={deleteMutation.isPending}
      />
    </LecturerShell>
  )
}
