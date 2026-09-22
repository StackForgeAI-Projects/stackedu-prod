import { useEffect, useState } from 'react'
import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import type { SaveTimetableReminderRequest, StudentDashboard } from '@stackedu/shared'
import {
  TIMETABLE_REMINDER_OFFSETS,
  TIMETABLE_REMINDER_OFFSET_LABELS,
  TIMETABLE_TIMEZONE,
  formatAppDateDdMmYyyy,
  timetableWeekdayLabel,
} from '@stackedu/shared'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { FormInfoBox } from '@/components/FormInfoBox'
import { formInfo } from '@/lib/form-info-copy'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { accountNotificationsQueryKey } from '@/lib/api/account'
import { apiErrorMessage } from '@/lib/api/client'
import {
  cancelStudentTimetableReminder,
  saveStudentTimetableReminder,
  studentDashboardQueryKey,
  studentNotificationsQueryKey,
  studentProfileQueryKey,
} from '@/lib/api/student'
import { toast } from 'sonner'

async function refreshAfterTimetableReminder(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: studentDashboardQueryKey }),
    queryClient.invalidateQueries({ queryKey: studentNotificationsQueryKey }),
    queryClient.invalidateQueries({ queryKey: accountNotificationsQueryKey }),
    queryClient.invalidateQueries({ queryKey: studentProfileQueryKey }),
  ])
}

export type StudentTimetableSlot = StudentDashboard['schedule'][number]

function defaultTitle(slot: StudentTimetableSlot): string {
  return `${slot.courseCode} · ${slot.courseName}`
}

function formatNextFire(iso: string): string {
  const date = new Date(iso)
  const clock = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMETABLE_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date)
  return `${formatAppDateDdMmYyyy(date)} · ${clock}`
}

export function TimetableEventDialog({
  slot,
  open,
  onOpenChange,
}: {
  slot: StudentTimetableSlot | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [minutesBefore, setMinutesBefore] = useState<string>('10')
  const [notes, setNotes] = useState('')
  const [confirmSave, setConfirmSave] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)

  useEffect(() => {
    if (!slot) return
    setTitle(slot.reminder?.title ?? defaultTitle(slot))
    setMinutesBefore(String(slot.reminder?.minutesBefore ?? 10))
    setNotes(slot.reminder?.notes ?? '')
    setConfirmSave(false)
    setConfirmRemove(false)
  }, [slot])

  const saveMutation = useMutation({
    mutationFn: saveStudentTimetableReminder,
    onSuccess: async () => {
      toast.success('Reminder saved. Check your email for the StackEDU invite.')
      setConfirmSave(false)
      onOpenChange(false)
      await refreshAfterTimetableReminder(queryClient)
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not save that reminder.')),
  })

  const removeMutation = useMutation({
    mutationFn: (slotId: string) => cancelStudentTimetableReminder(slotId),
    onSuccess: async () => {
      toast.success('Reminder removed.')
      setConfirmRemove(false)
      onOpenChange(false)
      await refreshAfterTimetableReminder(queryClient)
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not remove that reminder.')),
  })

  if (!slot) return null

  const payload: SaveTimetableReminderRequest = {
    slotId: slot.id,
    title: title.trim() || defaultTitle(slot),
    minutesBefore: Number(minutesBefore) as SaveTimetableReminderRequest['minutesBefore'],
    notes: notes.trim() || undefined,
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md w-[calc(100%-2rem)]">
          <DialogHeader>
            <DialogTitle className="pr-8" style={{ fontFamily: 'var(--font-display)' }}>
              {slot.courseName}
            </DialogTitle>
            <FormInfoBox lines={formInfo.timetableReminder} />
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div
              className="rounded-xl px-4 py-3"
              style={{ backgroundColor: `${slot.color}14`, border: `1px solid ${slot.color}40` }}
            >
              <p className="t-label" style={{ color: slot.color, fontFamily: 'var(--font-mono)' }}>{slot.courseCode}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--foreground)' }}>
                {timetableWeekdayLabel(slot.dayOfWeek)} · {slot.startTime}–{slot.endTime}
              </p>
              <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                {slot.room ?? 'Campus'} · {slot.sessionType}
              </p>
              {slot.reminder ? (
                <p className="t-caption mt-2 flex items-center gap-1.5" style={{ color: 'var(--foreground)' }}>
                  <Bell className="h-3.5 w-3.5" />
                  {TIMETABLE_REMINDER_OFFSET_LABELS[slot.reminder.minutesBefore]} · next {formatNextFire(slot.reminder.nextFireAt)}
                </p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="tt-reminder-title">Reminder title</Label>
              <Input
                id="tt-reminder-title"
                className="mt-1"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={120}
              />
            </div>
            <div>
              <Label htmlFor="tt-reminder-when">Send reminder</Label>
              <Select value={minutesBefore} onValueChange={setMinutesBefore}>
                <SelectTrigger id="tt-reminder-when" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMETABLE_REMINDER_OFFSETS.map((offset) => (
                    <SelectItem key={offset} value={String(offset)}>
                      {TIMETABLE_REMINDER_OFFSET_LABELS[offset]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tt-reminder-notes">Notes (optional)</Label>
              <Textarea
                id="tt-reminder-notes"
                className="mt-1"
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={500}
                placeholder="Bring lab coat, sit in Hall A…"
              />
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              {slot.reminder ? (
                <Button variant="outline" className="sm:mr-auto" onClick={() => setConfirmRemove(true)}>
                  Remove reminder
                </Button>
              ) : null}
              <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
              <Button onClick={() => setConfirmSave(true)} disabled={!title.trim()}>
                Save reminder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmAlertDialog
        open={confirmSave}
        onOpenChange={setConfirmSave}
        title="Save this reminder?"
        tone="success"
        headline="Set class reminder"
        summary={`${payload.title} · ${TIMETABLE_REMINDER_OFFSET_LABELS[payload.minutesBefore]}.`}
        notices={[
          { icon: 'email', label: 'A StackEDU email with the class details and a calendar file goes to your student inbox.' },
          { icon: 'bell', label: 'You also get an in-app notification now, and again when the reminder is due.' },
        ]}
        confirmLabel={saveMutation.isPending ? 'Saving…' : 'Save reminder'}
        confirmVariant="brand"
        loading={saveMutation.isPending}
        onConfirm={() => saveMutation.mutate(payload)}
      />

      <ConfirmAlertDialog
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        title="Remove this reminder?"
        tone="destructive"
        headline="Remove reminder"
        summary={`${slot.courseCode} will no longer send a class reminder.`}
        notices={[{ icon: 'trash', label: 'The class stays on your timetable. You can set a new reminder any time.' }]}
        confirmLabel={removeMutation.isPending ? 'Removing…' : 'Remove reminder'}
        confirmVariant="destructive"
        loading={removeMutation.isPending}
        onConfirm={() => removeMutation.mutate(slot.id)}
      />
    </>
  )
}
