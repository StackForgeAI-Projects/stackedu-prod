export const TIMETABLE_TIMEZONE = 'Africa/Kigali'

export const TIMETABLE_REMINDER_OFFSETS = [0, 10, 30, 60, 1440] as const
export type TimetableReminderOffset = (typeof TIMETABLE_REMINDER_OFFSETS)[number]

export const TIMETABLE_REMINDER_OFFSET_LABELS: Record<TimetableReminderOffset, string> = {
  0: 'At class start',
  10: '10 minutes before',
  30: '30 minutes before',
  60: '1 hour before',
  1440: '1 day before',
}

export const TIMETABLE_WEEKDAYS = [
  { iso: 1, label: 'Monday', short: 'Mon', ics: 'MO' },
  { iso: 2, label: 'Tuesday', short: 'Tue', ics: 'TU' },
  { iso: 3, label: 'Wednesday', short: 'Wed', ics: 'WE' },
  { iso: 4, label: 'Thursday', short: 'Thu', ics: 'TH' },
  { iso: 5, label: 'Friday', short: 'Fri', ics: 'FR' },
  { iso: 6, label: 'Saturday', short: 'Sat', ics: 'SA' },
  { iso: 7, label: 'Sunday', short: 'Sun', ics: 'SU' },
] as const

/** Teaching week shown on the student grid (Monday–Friday). */
export const TIMETABLE_GRID_DAYS = TIMETABLE_WEEKDAYS.filter((day) => day.iso <= 5)

export const TIMETABLE_AVAILABILITY_STATUSES = ['Pending', 'Confirmed', 'ChangeRequested'] as const
export type TimetableAvailabilityStatus = (typeof TIMETABLE_AVAILABILITY_STATUSES)[number]

export function timetableAvailabilityStatus(value: string): TimetableAvailabilityStatus {
  return (TIMETABLE_AVAILABILITY_STATUSES as readonly string[]).includes(value)
    ? (value as TimetableAvailabilityStatus)
    : 'Pending'
}

const TIMETABLE_AVAILABILITY_LABELS: Record<TimetableAvailabilityStatus, string> = {
  Pending: 'Waiting for lecturer',
  Confirmed: 'Live for students',
  ChangeRequested: 'Change requested',
}

export function timetableAvailabilityLabel(status: TimetableAvailabilityStatus): string {
  return TIMETABLE_AVAILABILITY_LABELS[status]
}

export function jsWeekdayToIso(jsDay: number): number {
  return jsDay === 0 ? 7 : jsDay
}

export function timetableWeekdayLabel(isoDay: number): string {
  return TIMETABLE_WEEKDAYS.find((row) => row.iso === isoDay)?.label ?? 'Class day'
}

export function timetableIcsByDay(isoDay: number): string {
  return TIMETABLE_WEEKDAYS.find((row) => row.iso === isoDay)?.ics ?? 'MO'
}

export function isTimetableReminderOffset(value: number): value is TimetableReminderOffset {
  return (TIMETABLE_REMINDER_OFFSETS as readonly number[]).includes(value)
}

export function clockToMinutes(clock: string): number {
  const [hours, minutes] = String(clock).split(':').map((part) => Number(part))
  return (hours || 0) * 60 + (minutes || 0)
}

/** True when two class times overlap. Back-to-back (10:00–12:00 then 12:00–14:00) is allowed. */
export function timetableTimesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  return clockToMinutes(startA) < clockToMinutes(endB) && clockToMinutes(startB) < clockToMinutes(endA)
}

export type TimetableClashKind = 'room' | 'lecturer' | 'course'

export function describeTimetableClash(input: {
  kind: TimetableClashKind
  dayLabel: string
  startTime: string
  endTime: string
  left: string
  right: string
  room?: string | null
  lecturer?: string | null
}): string {
  const when = `${input.dayLabel} ${input.startTime}–${input.endTime}`
  if (input.kind === 'room') {
    return `${input.room ?? 'This room'} is not available. It is already booked on ${when} for ${input.right}.`
  }
  if (input.kind === 'lecturer') {
    const who = input.lecturer ?? 'This lecturer'
    const verb = who === 'You' ? 'are' : 'is'
    return `${who} ${verb} already teaching on ${when} (${input.left} and ${input.right}).`
  }
  return `${input.left} already has a class on ${when}.`
}

export function findTimetableClashes<T extends {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  courseCode: string
  room?: string | null
  lecturer?: string | null
  lecturerId?: string | null
}>(slots: T[]): Array<{ kind: TimetableClashKind; message: string; slotIds: [string, string] }> {
  const out: Array<{ kind: TimetableClashKind; message: string; slotIds: [string, string] }> = []
  const seen = new Set<string>()
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i]!
      const b = slots[j]!
      if (a.dayOfWeek !== b.dayOfWeek) continue
      if (!timetableTimesOverlap(a.startTime, a.endTime, b.startTime, b.endTime)) continue
      const base = {
        dayLabel: timetableWeekdayLabel(a.dayOfWeek),
        startTime: a.startTime,
        endTime: a.endTime,
        left: a.courseCode,
        right: b.courseCode,
      }
      const push = (kind: TimetableClashKind, extra: { room?: string | null; lecturer?: string | null } = {}) => {
        const message = describeTimetableClash({ kind, ...base, ...extra })
        if (seen.has(message)) return
        seen.add(message)
        out.push({ kind, message, slotIds: [a.id, b.id] })
      }
      if (a.room && b.room && a.room === b.room) push('room', { room: a.room })
      const sameLecturer = a.lecturerId && b.lecturerId
        ? a.lecturerId === b.lecturerId
        : Boolean(a.lecturer && b.lecturer && a.lecturer === b.lecturer)
      if (sameLecturer) push('lecturer', { lecturer: a.lecturer ?? b.lecturer })
      if (a.courseCode === b.courseCode) push('course')
    }
  }
  return out
}
