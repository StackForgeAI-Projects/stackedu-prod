import { and, eq, isNull, lte } from 'drizzle-orm'
import type { SaveTimetableReminderRequest, StudentTimetableReminder, TimetableReminderOffset } from '@stackedu/shared'
import {
  TIMETABLE_REMINDER_OFFSET_LABELS,
  isTimetableReminderOffset,
  splitFullName,
} from '@stackedu/shared'
import type { InstitutionDb } from '../db/connection'
import { courses } from '../db/institution/schema/academic'
import { users } from '../db/institution/schema/people'
import { students } from '../db/institution/schema/students'
import {
  courseOfferings,
  courseRegistrations,
  rooms,
  timetableReminders,
  timetableSlots,
} from '../db/institution/schema/teaching'
import { env } from '../config/env'
import { badRequest, forbidden, notFound } from '../lib/errors'
import { escapeHtml, sendEmail } from '../lib/email'
import { buildBrandedEmail, getInstitutionEmailBranding } from '../lib/email-layout'
import { formatClock } from '../lib/course-color'
import {
  advanceWeekly,
  buildTimetableIcs,
  classStartUtc,
  formatTimetableWhen,
  nextTimetableReminderAt,
} from '../lib/timetable-calendar'
import { notifyUsers } from './role-notifications'
import { requireStudent } from './student'

type SlotRow = {
  slotId: string
  offeringId: string
  courseCode: string
  courseName: string
  sessionType: string
  startTime: string
  endTime: string
  room: string | null
  dayOfWeek: number
}

function mapReminder(row: {
  id: string
  title: string
  notes: string | null
  minutesBefore: number
  nextFireAt: string
}): StudentTimetableReminder {
  if (!isTimetableReminderOffset(row.minutesBefore)) {
    throw badRequest('That reminder time is not valid.')
  }
  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    minutesBefore: row.minutesBefore,
    nextFireAt: new Date(row.nextFireAt).toISOString(),
  }
}

function greetingName(fullName: string, firstName?: string | null): string {
  return firstName?.trim() || splitFullName(fullName).firstName || 'there'
}

function classEndUtc(slot: SlotRow, start: Date): Date {
  const startMins = Number(slot.startTime.slice(0, 2)) * 60 + Number(slot.startTime.slice(3, 5))
  const endMins = Number(slot.endTime.slice(0, 2)) * 60 + Number(slot.endTime.slice(3, 5))
  const delta = Math.max(endMins - startMins, 60) * 60 * 1000
  return new Date(start.getTime() + delta)
}

async function enrolledSlot(db: InstitutionDb, studentId: string, slotId: string): Promise<SlotRow> {
  const [row] = await db
    .select({
      slotId: timetableSlots.id,
      offeringId: courseOfferings.id,
      courseCode: courses.code,
      courseName: courses.name,
      sessionType: timetableSlots.sessionType,
      startTime: timetableSlots.startTime,
      endTime: timetableSlots.endTime,
      room: rooms.name,
      dayOfWeek: timetableSlots.dayOfWeek,
      status: courseRegistrations.status,
      availabilityStatus: timetableSlots.availabilityStatus,
    })
    .from(timetableSlots)
    .innerJoin(courseOfferings, eq(courseOfferings.id, timetableSlots.courseOfferingId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .leftJoin(rooms, eq(rooms.id, timetableSlots.roomId))
    .innerJoin(
      courseRegistrations,
      and(
        eq(courseRegistrations.courseOfferingId, courseOfferings.id),
        eq(courseRegistrations.studentId, studentId),
      ),
    )
    .where(eq(timetableSlots.id, slotId))
    .limit(1)

  if (!row) throw notFound('That class')
  if (row.availabilityStatus !== 'Confirmed') {
    throw badRequest('That class is not on the timetable until the lecturer confirms it.')
  }
  if (row.status !== 'Approved') throw forbidden('Register for that course before setting a reminder.')
  return {
    slotId: row.slotId,
    offeringId: row.offeringId,
    courseCode: row.courseCode,
    courseName: row.courseName,
    sessionType: row.sessionType,
    startTime: formatClock(row.startTime),
    endTime: formatClock(row.endTime),
    room: row.room,
    dayOfWeek: row.dayOfWeek,
  }
}

function classDescription(slot: SlotRow, notes?: string | null): string {
  const base = `${slot.courseCode} · ${slot.courseName} (${slot.sessionType})`
  const extra = notes?.trim()
  return extra ? `${base}\n${extra}` : base
}

function eventDetailsHtml(slot: SlotRow, when: string, notes?: string | null): string {
  const rows: Array<[string, string]> = [
    ['When', when],
    ['Where', slot.room ?? 'Campus'],
    ['Course', `${slot.courseCode} · ${slot.courseName}`],
    ['Type', slot.sessionType],
  ]
  if (notes?.trim()) rows.push(['Notes', notes.trim()])
  const cells = rows
    .map(
      ([label, value]) =>
        `<tr>
          <td style="padding:8px 0;width:88px;color:#6b7280;font-size:13px;vertical-align:top">${escapeHtml(label)}</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join('')
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:8px 0 4px;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb">${cells}</table>`
}

function icsFor(
  slot: SlotRow,
  title: string,
  minutesBefore: TimetableReminderOffset,
  institutionName: string,
  from: Date,
  notes?: string | null,
) {
  const start = classStartUtc(slot.dayOfWeek, slot.startTime, from)
  return {
    start,
    ics: buildTimetableIcs({
      uid: `timetable-${slot.slotId}@stackedu.rw`,
      title,
      description: classDescription(slot, notes),
      location: slot.room,
      dayOfWeek: slot.dayOfWeek,
      start,
      end: classEndUtc(slot, start),
      minutesBefore,
      institutionName,
    }),
  }
}

async function sendTimetableEmail(input: {
  institutionId: string
  to: string
  firstName: string
  kind: 'invite' | 'reminder'
  title: string
  minutesBefore: TimetableReminderOffset
  slot: SlotRow
  classStart: Date
  ics: string
  notes?: string | null
}): Promise<void> {
  const branding = await getInstitutionEmailBranding(input.institutionId)
  const when = formatTimetableWhen(input.slot.dayOfWeek, input.slot.startTime, input.slot.endTime, input.classStart)
  const offsetLabel = TIMETABLE_REMINDER_OFFSET_LABELS[input.minutesBefore]
  const subject = input.kind === 'invite' ? `Invitation: ${input.title}` : `Reminder: ${input.title}`
  const paragraphs =
    input.kind === 'invite'
      ? [
          `This class is on your StackEDU timetable. A reminder is set for ${offsetLabel.toLowerCase()}.`,
          'Open the attached calendar file to keep the class in your mailbox, the same way a calendar invite works.',
        ]
      : [
          `${input.slot.courseCode} is coming up. This is your StackEDU reminder (${offsetLabel.toLowerCase()}).`,
          'Open your timetable in StackEDU if you need to change or remove this reminder.',
        ]

  const { text, html } = buildBrandedEmail({
    branding,
    title: input.title,
    greeting: `Hi ${input.firstName},`,
    paragraphs,
    bodyHtmlExtra: eventDetailsHtml(input.slot, when, input.notes),
    officeLabel: 'Timetable',
    ctaLabel: 'Open timetable',
    trackUrl: `${env().WEB_APP_URL.replace(/\/$/, '')}/student/timetable`,
  })

  await sendEmail({
    to: input.to,
    subject,
    text,
    html,
    institutionId: input.institutionId,
    attachments: [
      {
        filename: `${input.slot.courseCode.replace(/\s+/g, '-')}.ics`,
        content: input.ics,
        contentType: 'text/calendar; charset=utf-8; method=PUBLISH',
      },
    ],
  })
}

export async function saveStudentTimetableReminder(
  institutionId: string,
  userId: string,
  input: SaveTimetableReminderRequest,
): Promise<StudentTimetableReminder> {
  const profile = await requireStudent(institutionId, userId)
  const slot = await enrolledSlot(profile.db, profile.studentId, input.slotId)
  const now = new Date()
  const nextFireAt = nextTimetableReminderAt({
    dayOfWeek: slot.dayOfWeek,
    startTime: slot.startTime,
    minutesBefore: input.minutesBefore,
    from: now,
  }).toISOString()
  const notes = input.notes?.trim() ? input.notes.trim() : null

  const [existing] = await profile.db
    .select({ id: timetableReminders.id })
    .from(timetableReminders)
    .where(
      and(eq(timetableReminders.studentId, profile.studentId), eq(timetableReminders.timetableSlotId, slot.slotId)),
    )
    .limit(1)

  const saved = existing
    ? (
        await profile.db
          .update(timetableReminders)
          .set({
            title: input.title,
            notes,
            minutesBefore: input.minutesBefore,
            nextFireAt,
            cancelledAt: null,
          })
          .where(eq(timetableReminders.id, existing.id))
          .returning()
      )[0]
    : (
        await profile.db
          .insert(timetableReminders)
          .values({
            studentId: profile.studentId,
            timetableSlotId: slot.slotId,
            title: input.title,
            notes,
            minutesBefore: input.minutesBefore,
            nextFireAt,
          })
          .returning()
      )[0]

  if (!saved) throw badRequest('Could not save that reminder.')

  const branding = await getInstitutionEmailBranding(institutionId)
  const { start, ics } = icsFor(slot, input.title, input.minutesBefore, branding.name, now, notes)
  await sendTimetableEmail({
    institutionId,
    to: profile.email,
    firstName: greetingName(profile.fullName, profile.firstName),
    kind: 'invite',
    title: input.title,
    minutesBefore: input.minutesBefore,
    slot,
    classStart: start,
    ics,
    notes,
  })

  await notifyUsers(profile.db, [
    {
      userId,
      title: `Reminder set: ${slot.courseCode}`,
      body: `${input.title} · ${TIMETABLE_REMINDER_OFFSET_LABELS[input.minutesBefore]}. ${formatTimetableWhen(slot.dayOfWeek, slot.startTime, slot.endTime, start)}${slot.room ? ` · ${slot.room}` : ''}.`,
      category: 'Calendar',
      actionUrl: '/student/timetable',
      metadata: { timetableReminderId: saved.id, slotId: slot.slotId },
    },
  ])

  return mapReminder(saved)
}

export async function cancelStudentTimetableReminder(
  institutionId: string,
  userId: string,
  slotId: string,
): Promise<void> {
  const profile = await requireStudent(institutionId, userId)
  const [row] = await profile.db
    .select({ id: timetableReminders.id })
    .from(timetableReminders)
    .where(
      and(
        eq(timetableReminders.studentId, profile.studentId),
        eq(timetableReminders.timetableSlotId, slotId),
        isNull(timetableReminders.cancelledAt),
      ),
    )
    .limit(1)
  if (!row) throw notFound('That reminder')

  await profile.db
    .update(timetableReminders)
    .set({ cancelledAt: new Date().toISOString() })
    .where(eq(timetableReminders.id, row.id))
}

export async function processTimetableReminders(
  institutionId: string,
  db: InstitutionDb,
  now = new Date(),
): Promise<number> {
  const due = await db
    .select({
      reminderId: timetableReminders.id,
      title: timetableReminders.title,
      notes: timetableReminders.notes,
      minutesBefore: timetableReminders.minutesBefore,
      nextFireAt: timetableReminders.nextFireAt,
      userId: users.id,
      email: users.email,
      fullName: users.fullName,
      slotId: timetableSlots.id,
      offeringId: courseOfferings.id,
      courseCode: courses.code,
      courseName: courses.name,
      sessionType: timetableSlots.sessionType,
      startTime: timetableSlots.startTime,
      endTime: timetableSlots.endTime,
      room: rooms.name,
      dayOfWeek: timetableSlots.dayOfWeek,
    })
    .from(timetableReminders)
    .innerJoin(students, eq(students.id, timetableReminders.studentId))
    .innerJoin(users, eq(users.id, students.userId))
    .innerJoin(timetableSlots, eq(timetableSlots.id, timetableReminders.timetableSlotId))
    .innerJoin(courseOfferings, eq(courseOfferings.id, timetableSlots.courseOfferingId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .leftJoin(rooms, eq(rooms.id, timetableSlots.roomId))
    .where(and(isNull(timetableReminders.cancelledAt), lte(timetableReminders.nextFireAt, now.toISOString())))

  if (!due.length) return 0

  const branding = await getInstitutionEmailBranding(institutionId)
  let sent = 0

  for (const row of due) {
    if (!isTimetableReminderOffset(row.minutesBefore)) continue
    const slot: SlotRow = {
      slotId: row.slotId,
      offeringId: row.offeringId,
      courseCode: row.courseCode,
      courseName: row.courseName,
      sessionType: row.sessionType,
      startTime: formatClock(row.startTime),
      endTime: formatClock(row.endTime),
      room: row.room,
      dayOfWeek: row.dayOfWeek,
    }
    const fireAt = new Date(row.nextFireAt)
    const classAt = new Date(fireAt.getTime() + row.minutesBefore * 60 * 1000)
    const missed = classAt.getTime() < now.getTime() - 5 * 60 * 1000
    if (!missed) {
      const ics = buildTimetableIcs({
        uid: `timetable-${slot.slotId}@stackedu.rw`,
        title: row.title,
        description: classDescription(slot, row.notes),
        location: slot.room,
        dayOfWeek: slot.dayOfWeek,
        start: classAt,
        end: classEndUtc(slot, classAt),
        minutesBefore: row.minutesBefore,
        institutionName: branding.name,
      })
      await sendTimetableEmail({
        institutionId,
        to: row.email,
        firstName: greetingName(row.fullName),
        kind: 'reminder',
        title: row.title,
        minutesBefore: row.minutesBefore,
        slot,
        classStart: classAt,
        ics,
        notes: row.notes,
      })
      await notifyUsers(db, [
        {
          userId: row.userId,
          title: `Class reminder: ${slot.courseCode}`,
          body: `${row.title} · ${formatTimetableWhen(slot.dayOfWeek, slot.startTime, slot.endTime, classAt)}${slot.room ? ` · ${slot.room}` : ''}.`,
          category: 'Calendar',
          actionUrl: '/student/timetable',
          metadata: { timetableReminderId: row.reminderId, slotId: slot.slotId, kind: 'fire' },
        },
      ])
      sent += 1
    }

    await db
      .update(timetableReminders)
      .set({
        lastSentAt: now.toISOString(),
        nextFireAt: advanceWeekly(fireAt, now).toISOString(),
      })
      .where(eq(timetableReminders.id, row.reminderId))
  }

  return sent
}
