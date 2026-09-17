import { and, eq, inArray } from 'drizzle-orm'
import {
  describeTimetableClash,
  timetableTimesOverlap,
  timetableWeekdayLabel,
} from '@stackedu/shared'
import type { InstitutionDb } from '../db/connection'
import { courses } from '../db/institution/schema/academic'
import { users } from '../db/institution/schema/people'
import { courseOfferings, lecturerAssignments, rooms, timetableSlots } from '../db/institution/schema/teaching'
import { formatClock } from './course-color'
import { conflict } from './errors'

export async function assertTimetableSlotFree(
  db: InstitutionDb,
  input: {
    offeringId: string
    dayOfWeek: number
    startTime: string
    endTime: string
    roomId: string | null
    exceptSlotId?: string
  },
): Promise<void> {
  const [offering] = await db
    .select({
      semesterId: courseOfferings.semesterId,
      courseCode: courses.code,
    })
    .from(courseOfferings)
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .where(eq(courseOfferings.id, input.offeringId))
    .limit(1)
  if (!offering) throw conflict('That course could not be found on the timetable.')

  const start = formatClock(input.startTime)
  const end = formatClock(input.endTime)
  const dayLabel = timetableWeekdayLabel(input.dayOfWeek)

  const rows = await db
    .select({
      id: timetableSlots.id,
      offeringId: timetableSlots.courseOfferingId,
      courseCode: courses.code,
      startTime: timetableSlots.startTime,
      endTime: timetableSlots.endTime,
      roomId: timetableSlots.roomId,
      roomName: rooms.name,
    })
    .from(timetableSlots)
    .innerJoin(courseOfferings, eq(courseOfferings.id, timetableSlots.courseOfferingId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .leftJoin(rooms, eq(rooms.id, timetableSlots.roomId))
    .where(and(eq(courseOfferings.semesterId, offering.semesterId), eq(timetableSlots.dayOfWeek, input.dayOfWeek)))

  const offeringIds = [...new Set([input.offeringId, ...rows.map((row) => row.offeringId)])]
  const assignmentRows = offeringIds.length === 0
    ? []
    : await db
      .select({
        offeringId: lecturerAssignments.courseOfferingId,
        lecturerId: lecturerAssignments.lecturerId,
        name: users.fullName,
      })
      .from(lecturerAssignments)
      .innerJoin(users, eq(users.id, lecturerAssignments.lecturerId))
      .where(inArray(lecturerAssignments.courseOfferingId, offeringIds))

  const lecturersByOffering = new Map<string, Array<{ lecturerId: string; name: string }>>()
  for (const row of assignmentRows) {
    const list = lecturersByOffering.get(row.offeringId) ?? []
    list.push({ lecturerId: row.lecturerId, name: row.name })
    lecturersByOffering.set(row.offeringId, list)
  }

  const inputLecturers = lecturersByOffering.get(input.offeringId) ?? []
  const inputLecturerIds = new Set(inputLecturers.map((row) => row.lecturerId))

  for (const row of rows) {
    if (input.exceptSlotId && row.id === input.exceptSlotId) continue
    const otherStart = formatClock(row.startTime)
    const otherEnd = formatClock(row.endTime)
    if (!timetableTimesOverlap(start, end, otherStart, otherEnd)) continue

    const left = offering.courseCode
    const right = row.courseCode
    const when = { dayLabel, startTime: start, endTime: end, left, right }

    if (row.offeringId === input.offeringId) {
      throw conflict(describeTimetableClash({ kind: 'course', ...when }))
    }

    if (input.roomId && row.roomId && input.roomId === row.roomId) {
      throw conflict(describeTimetableClash({
        kind: 'room',
        ...when,
        room: row.roomName ?? 'This room',
      }))
    }

    const otherLecturers = lecturersByOffering.get(row.offeringId) ?? []
    const shared = otherLecturers.find((person) => inputLecturerIds.has(person.lecturerId))
    if (shared) {
      throw conflict(describeTimetableClash({
        kind: 'lecturer',
        ...when,
        lecturer: shared.name,
      }))
    }
  }
}
