import {
  TIMETABLE_TIMEZONE,
  TIMETABLE_WEEKDAYS,
  timetableIcsByDay,
  timetableWeekdayLabel,
  type TimetableReminderOffset,
} from '@stackedu/shared'

function tzParts(date: Date) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMETABLE_TIMEZONE,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
  const bag: Record<string, string> = {}
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== 'literal') bag[part.type] = part.value
  }
  return {
    weekday: bag.weekday ?? 'Mon',
    year: Number(bag.year),
    month: Number(bag.month),
    day: Number(bag.day),
    hour: Number(bag.hour === '24' ? '0' : bag.hour),
    minute: Number(bag.minute),
  }
}

export function civilTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0)
  const asInTz = tzParts(new Date(utcGuess))
  const asUtcMs = Date.UTC(asInTz.year, asInTz.month - 1, asInTz.day, asInTz.hour, asInTz.minute)
  return new Date(utcGuess - (asUtcMs - utcGuess))
}

function parseClock(value: string): { hour: number; minute: number } {
  const [hour, minute] = value.split(':').map(Number)
  return { hour: hour ?? 0, minute: minute ?? 0 }
}

export function classStartUtc(dayOfWeek: number, startTime: string, from: Date): Date {
  const { hour, minute } = parseClock(startTime)
  const parts = tzParts(from)
  const todayIso = TIMETABLE_WEEKDAYS.find((day) => day.short === parts.weekday)?.iso ?? 1
  const delta = (dayOfWeek - todayIso + 7) % 7
  let start = civilTimeToUtc(parts.year, parts.month, parts.day + delta, hour, minute)
  if (start.getTime() <= from.getTime()) {
    start = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000)
  }
  return start
}

export function nextTimetableReminderAt(input: {
  dayOfWeek: number
  startTime: string
  minutesBefore: TimetableReminderOffset
  from: Date
}): Date {
  const start = classStartUtc(input.dayOfWeek, input.startTime, input.from)
  return new Date(start.getTime() - input.minutesBefore * 60 * 1000)
}

export function advanceWeekly(from: Date, after: Date): Date {
  let next = new Date(from.getTime())
  const week = 7 * 24 * 60 * 60 * 1000
  while (next.getTime() <= after.getTime()) next = new Date(next.getTime() + week)
  return next
}

function icsStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function icsEscape(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function buildTimetableIcs(input: {
  uid: string
  title: string
  description: string
  location: string | null
  dayOfWeek: number
  start: Date
  end: Date
  minutesBefore: TimetableReminderOffset
  institutionName: string
}): string {
  const alarm =
    input.minutesBefore === 0
      ? ''
      : [
          'BEGIN:VALARM',
          'ACTION:DISPLAY',
          `TRIGGER:-PT${input.minutesBefore}M`,
          `DESCRIPTION:${icsEscape(input.title)}`,
          'END:VALARM',
        ].join('\r\n') + '\r\n'

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//StackEDU//Timetable//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${input.uid}`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(input.start)}`,
    `DTEND:${icsStamp(input.end)}`,
    `RRULE:FREQ=WEEKLY;BYDAY=${timetableIcsByDay(input.dayOfWeek)}`,
    `SUMMARY:${icsEscape(input.title)}`,
    `DESCRIPTION:${icsEscape(input.description)}`,
    `LOCATION:${icsEscape(input.location ?? 'Campus')}`,
    `ORGANIZER;CN=${icsEscape(input.institutionName)}:MAILTO:noreply@stackedu.rw`,
    alarm.trimEnd(),
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter((line) => line !== '')
    .join('\r\n')
}

export function formatKigaliDate(date: Date): string {
  const parts = tzParts(date)
  return `${String(parts.day).padStart(2, '0')}-${String(parts.month).padStart(2, '0')}-${parts.year}`
}

export function formatTimetableWhen(dayOfWeek: number, startTime: string, endTime: string, at: Date): string {
  return `${timetableWeekdayLabel(dayOfWeek)} ${formatKigaliDate(at)} · ${startTime}–${endTime}`
}
