import { and, count, desc, eq, inArray, sql } from 'drizzle-orm'
import type {
  ClassroomJoin,
  ClassroomSessionDetail,
  ClassroomSessionSummary,
  CreateClassroomSessionRequest,
  UserRole,
} from '@stackedu/shared'
import { getInstitutionDb } from '../db/connection'
import { courses } from '../db/institution/schema/academic'
import { users } from '../db/institution/schema/people'
import {
  courseOfferings,
  courseRegistrations,
  lecturerAssignments,
  liveSessionParticipants,
  liveSessions,
  sessionRecordings,
} from '../db/institution/schema/teaching'
import { writeAudit } from '../lib/audit'
import { collabConfigured, signCollabToken } from '../lib/collab-token'
import { badRequest, conflict, forbidden, notFound } from '../lib/errors'
import { mediaRoomFor } from '../lib/media-room'
import { env } from '../config/env'
import {
  buildSessionObjectKey,
  buildStableSessionObjectKey,
  createDownloadUrl,
  deleteStoredObject,
  putStoredObject,
  readStoredObject,
} from '../lib/storage'
import { requireAssignedOffering, requireLecturer } from './lecturer'
import { requireStudent } from './student'

type InstitutionDb = Awaited<ReturnType<typeof getInstitutionDb>>
type Actor = { id: string; email: string; role: UserRole }

function roomNameFor(sessionId: string): string {
  return `session-${sessionId}`
}

async function offeringLabel(db: InstitutionDb, offeringId: string) {
  const [row] = await db
    .select({
      offeringId: courseOfferings.id,
      courseCode: courses.code,
      courseName: courses.name,
    })
    .from(courseOfferings)
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .where(eq(courseOfferings.id, offeringId))
    .limit(1)
  if (!row) throw notFound('That course')
  return row
}

async function mapSummaries(
  db: InstitutionDb,
  rows: Array<{
    id: string
    offeringId: string
    courseCode: string
    courseName: string
    title: string
    status: ClassroomSessionSummary['status']
    scheduledAt: string | null
    startedAt: string | null
    endedAt: string | null
    summaryPublishedAt: string | null
    summaryText: string | null
  }>,
): Promise<ClassroomSessionSummary[]> {
  if (rows.length === 0) return []
  const ids = rows.map((row) => row.id)
  const [people, recordings] = await Promise.all([
    db
      .select({ sessionId: liveSessionParticipants.sessionId, n: count() })
      .from(liveSessionParticipants)
      .where(inArray(liveSessionParticipants.sessionId, ids))
      .groupBy(liveSessionParticipants.sessionId),
    db
      .select({ sessionId: sessionRecordings.sessionId, n: count() })
      .from(sessionRecordings)
      .where(and(inArray(sessionRecordings.sessionId, ids), eq(sessionRecordings.status, 'Ready')))
      .groupBy(sessionRecordings.sessionId),
  ])
  const peopleBy = new Map(people.map((row) => [row.sessionId, Number(row.n)]))
  const recBy = new Map(recordings.map((row) => [row.sessionId, Number(row.n)]))
  return rows.map((row) => ({
    id: row.id,
    offeringId: row.offeringId,
    courseCode: row.courseCode,
    courseName: row.courseName,
    title: row.title,
    status: row.status,
    scheduledAt: row.scheduledAt,
    startedAt: row.startedAt,
    endedAt: row.endedAt,
    participantCount: peopleBy.get(row.id) ?? 0,
    hasRecording: (recBy.get(row.id) ?? 0) > 0,
    hasSummary: Boolean(row.summaryText),
    summaryPublished: Boolean(row.summaryPublishedAt),
  }))
}

export async function listOfferingLiveSessionSummaries(
  db: InstitutionDb,
  offeringId: string,
  options?: { studentView?: boolean },
): Promise<ClassroomSessionSummary[]> {
  const label = await offeringLabel(db, offeringId)
  const rows = await db
    .select({
      id: liveSessions.id,
      offeringId: liveSessions.courseOfferingId,
      title: liveSessions.title,
      status: liveSessions.status,
      scheduledAt: liveSessions.scheduledAt,
      startedAt: liveSessions.startedAt,
      endedAt: liveSessions.endedAt,
      summaryPublishedAt: liveSessions.summaryPublishedAt,
      summaryText: liveSessions.summaryText,
    })
    .from(liveSessions)
    .where(eq(liveSessions.courseOfferingId, offeringId))
    .orderBy(desc(liveSessions.createdAt))
  const mapped = await mapSummaries(
    db,
    rows.map((row) => ({ ...row, courseCode: label.courseCode, courseName: label.courseName })),
  )
  if (!options?.studentView) return mapped
  return mapped
    .filter((row) => row.status !== 'Cancelled')
    .map((row) => ({
      ...row,
      hasSummary: row.summaryPublished,
    }))
}

async function loadSessionRow(db: InstitutionDb, sessionId: string) {
  const [row] = await db
    .select({
      id: liveSessions.id,
      offeringId: liveSessions.courseOfferingId,
      title: liveSessions.title,
      status: liveSessions.status,
      roomName: liveSessions.roomName,
      scheduledAt: liveSessions.scheduledAt,
      startedAt: liveSessions.startedAt,
      endedAt: liveSessions.endedAt,
      whiteboardFileKey: liveSessions.whiteboardFileKey,
      summaryText: liveSessions.summaryText,
      summaryPublishedAt: liveSessions.summaryPublishedAt,
      courseCode: courses.code,
      courseName: courses.name,
    })
    .from(liveSessions)
    .innerJoin(courseOfferings, eq(courseOfferings.id, liveSessions.courseOfferingId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .where(eq(liveSessions.id, sessionId))
    .limit(1)
  if (!row) throw notFound('That class')
  return row
}

async function toDetail(institutionId: string, db: InstitutionDb, sessionId: string): Promise<ClassroomSessionDetail> {
  const row = await loadSessionRow(db, sessionId)
  const [summary] = await mapSummaries(db, [row])
  const recordings = await db
    .select({
      id: sessionRecordings.id,
      status: sessionRecordings.status,
      durationSeconds: sessionRecordings.durationSeconds,
      byteSize: sessionRecordings.byteSize,
      createdAt: sessionRecordings.createdAt,
    })
    .from(sessionRecordings)
    .where(eq(sessionRecordings.sessionId, sessionId))
    .orderBy(desc(sessionRecordings.createdAt))
  return {
    ...summary!,
    roomName: row.roomName,
    summaryText: row.summaryPublishedAt ? row.summaryText : row.summaryText,
    recordings,
    mediaConfigured: (await mediaRoomFor(institutionId)).isConfigured(),
    collabConfigured: collabConfigured(),
  }
}

export async function listLecturerClassroomSessions(
  institutionId: string,
  userId: string,
  offeringId?: string,
): Promise<ClassroomSessionSummary[]> {
  const { db } = await requireLecturer(institutionId, userId)
  if (offeringId) {
    await requireAssignedOffering(db, userId, offeringId)
    return listOfferingLiveSessionSummaries(db, offeringId)
  }
  const rows = await db
    .select({
      id: liveSessions.id,
      offeringId: liveSessions.courseOfferingId,
      title: liveSessions.title,
      status: liveSessions.status,
      scheduledAt: liveSessions.scheduledAt,
      startedAt: liveSessions.startedAt,
      endedAt: liveSessions.endedAt,
      summaryPublishedAt: liveSessions.summaryPublishedAt,
      summaryText: liveSessions.summaryText,
      courseCode: courses.code,
      courseName: courses.name,
    })
    .from(liveSessions)
    .innerJoin(courseOfferings, eq(courseOfferings.id, liveSessions.courseOfferingId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .innerJoin(
      lecturerAssignments,
      and(
        eq(lecturerAssignments.courseOfferingId, liveSessions.courseOfferingId),
        eq(lecturerAssignments.lecturerId, userId),
      ),
    )
    .orderBy(desc(liveSessions.createdAt))
  return mapSummaries(db, rows)
}

export async function createLecturerClassroomSession(
  institutionId: string,
  actor: Actor,
  input: CreateClassroomSessionRequest,
): Promise<ClassroomSessionDetail> {
  const { db } = await requireLecturer(institutionId, actor.id)
  await requireAssignedOffering(db, actor.id, input.offeringId)
  await offeringLabel(db, input.offeringId)
  const [created] = await db
    .insert(liveSessions)
    .values({
      courseOfferingId: input.offeringId,
      title: input.title.trim(),
      status: 'Scheduled',
      roomName: `tmp-${crypto.randomUUID()}`,
      scheduledAt: input.scheduledAt ?? null,
    })
    .returning({ id: liveSessions.id })
  if (!created) throw notFound('That class')
  await db
    .update(liveSessions)
    .set({ roomName: roomNameFor(created.id) })
    .where(eq(liveSessions.id, created.id))
  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'classroom.schedule',
    targetType: 'live_session',
    targetId: created.id,
    metadata: { title: input.title.trim() },
  })
  return toDetail(institutionId, db, created.id)
}

export async function startLecturerClassroomSession(
  institutionId: string,
  actor: Actor,
  sessionId: string,
): Promise<ClassroomSessionDetail> {
  const { db } = await requireLecturer(institutionId, actor.id)
  const row = await loadSessionRow(db, sessionId)
  await requireAssignedOffering(db, actor.id, row.offeringId)
  if (row.status === 'Ended' || row.status === 'Cancelled') {
    throw conflict('That class has already finished.')
  }
  if (row.status !== 'Live') {
    const live = await mediaRoomFor(institutionId)
    if (live.isConfigured()) {
      try {
        await live.ensureRoom(row.roomName)
      } catch {
        // Room may already exist from a previous start.
      }
    }
    await db
      .update(liveSessions)
      .set({ status: 'Live', startedAt: new Date().toISOString(), startedBy: actor.id })
      .where(eq(liveSessions.id, sessionId))
    await writeAudit({
      institutionId,
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'classroom.start',
      targetType: 'live_session',
      targetId: sessionId,
    })
  }
  return toDetail(institutionId, db, sessionId)
}

export async function endLecturerClassroomSession(
  institutionId: string,
  actor: Actor,
  sessionId: string,
): Promise<ClassroomSessionDetail> {
  const { db } = await requireLecturer(institutionId, actor.id)
  const row = await loadSessionRow(db, sessionId)
  await requireAssignedOffering(db, actor.id, row.offeringId)
  if (row.status === 'Cancelled') throw conflict('That class was cancelled.')
  if (row.status !== 'Ended') {
    const pending = await db
      .select({ id: sessionRecordings.id, jobId: sessionRecordings.jobId })
      .from(sessionRecordings)
      .where(and(eq(sessionRecordings.sessionId, sessionId), eq(sessionRecordings.status, 'Pending')))
    for (const rec of pending) {
      if (rec.jobId) await (await mediaRoomFor(institutionId)).stopRecording(rec.jobId).catch(() => undefined)
      await finalizeRecording(institutionId, rec.id)
    }
    const live = await mediaRoomFor(institutionId)
    if (live.isConfigured()) await live.closeRoom(row.roomName).catch(() => undefined)
    await db
      .update(liveSessions)
      .set({ status: 'Ended', endedAt: new Date().toISOString() })
      .where(eq(liveSessions.id, sessionId))
    await writeAudit({
      institutionId,
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'classroom.end',
      targetType: 'live_session',
      targetId: sessionId,
    })
  }
  return toDetail(institutionId, db, sessionId)
}

export async function cancelLecturerClassroomSession(
  institutionId: string,
  actor: Actor,
  sessionId: string,
): Promise<void> {
  const { db } = await requireLecturer(institutionId, actor.id)
  const row = await loadSessionRow(db, sessionId)
  await requireAssignedOffering(db, actor.id, row.offeringId)
  if (row.status === 'Live' || row.status === 'Ended') {
    throw conflict('A class that has started cannot be cancelled. End it instead.')
  }
  await db.update(liveSessions).set({ status: 'Cancelled' }).where(eq(liveSessions.id, sessionId))
  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'classroom.cancel',
    targetType: 'live_session',
    targetId: sessionId,
  })
}

async function markJoined(db: InstitutionDb, sessionId: string, userId: string, role: 'host' | 'participant') {
  await db
    .insert(liveSessionParticipants)
    .values({ sessionId, userId, role, joinedAt: new Date().toISOString() })
    .onConflictDoUpdate({
      target: [liveSessionParticipants.sessionId, liveSessionParticipants.userId],
      set: { leftAt: null, role, joinedAt: new Date().toISOString() },
    })
}

async function buildJoin(
  institutionId: string,
  db: InstitutionDb,
  sessionId: string,
  actor: Actor,
  role: 'host' | 'participant',
  displayName: string,
): Promise<ClassroomJoin> {
  const row = await loadSessionRow(db, sessionId)
  if (row.status !== 'Live') throw conflict('That class is not live yet.')
  await markJoined(db, sessionId, actor.id, role)
  const session = await toDetail(institutionId, db, sessionId)
  const live = await mediaRoomFor(institutionId)
  let media: ClassroomJoin['media'] = null
  if (live.isConfigured()) {
    media = await live.participantToken({
      roomName: row.roomName,
      identity: actor.id,
      name: displayName,
      canPublish: true,
      roomAdmin: role === 'host',
    })
  }
  let collab: ClassroomJoin['collab'] = null
  const collabUrl = env().HOCUSPOCUS_URL
  if (collabConfigured() && collabUrl) {
    collab = {
      url: collabUrl,
      token: signCollabToken({
        institutionId,
        sessionId,
        userId: actor.id,
        name: displayName,
        role,
      }),
      documentName: `${institutionId}:${sessionId}`,
    }
  }
  return { session, media, collab, displayName, role }
}

export async function joinLecturerClassroomSession(
  institutionId: string,
  actor: Actor,
  sessionId: string,
): Promise<ClassroomJoin> {
  const { db, user } = await requireLecturer(institutionId, actor.id)
  const row = await loadSessionRow(db, sessionId)
  await requireAssignedOffering(db, actor.id, row.offeringId)
  if (row.status === 'Scheduled') {
    await startLecturerClassroomSession(institutionId, actor, sessionId)
  }
  return buildJoin(institutionId, db, sessionId, actor, 'host', user.fullName)
}

export async function listStudentClassroomSessions(
  institutionId: string,
  userId: string,
): Promise<ClassroomSessionSummary[]> {
  const profile = await requireStudent(institutionId, userId)
  const db = await getInstitutionDb(institutionId)
  const rows = await db
    .select({
      id: liveSessions.id,
      offeringId: liveSessions.courseOfferingId,
      title: liveSessions.title,
      status: liveSessions.status,
      scheduledAt: liveSessions.scheduledAt,
      startedAt: liveSessions.startedAt,
      endedAt: liveSessions.endedAt,
      summaryPublishedAt: liveSessions.summaryPublishedAt,
      summaryText: liveSessions.summaryText,
      courseCode: courses.code,
      courseName: courses.name,
    })
    .from(liveSessions)
    .innerJoin(courseOfferings, eq(courseOfferings.id, liveSessions.courseOfferingId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .innerJoin(
      courseRegistrations,
      and(
        eq(courseRegistrations.courseOfferingId, liveSessions.courseOfferingId),
        eq(courseRegistrations.studentId, profile.studentId),
        eq(courseRegistrations.status, 'Approved'),
      ),
    )
    .where(sql`${liveSessions.status} <> 'Cancelled'`)
    .orderBy(desc(liveSessions.createdAt))
  const mapped = await mapSummaries(db, rows)
  return mapped.map((row) => ({ ...row, hasSummary: row.summaryPublished }))
}

export async function joinStudentClassroomSession(
  institutionId: string,
  userId: string,
  sessionId: string,
): Promise<ClassroomJoin> {
  const profile = await requireStudent(institutionId, userId)
  const db = await getInstitutionDb(institutionId)
  const row = await loadSessionRow(db, sessionId)
  const [enrolled] = await db
    .select({ id: courseRegistrations.id })
    .from(courseRegistrations)
    .where(
      and(
        eq(courseRegistrations.studentId, profile.studentId),
        eq(courseRegistrations.courseOfferingId, row.offeringId),
        eq(courseRegistrations.status, 'Approved'),
      ),
    )
    .limit(1)
  if (!enrolled) throw forbidden('You are not enrolled on that course.')
  const [user] = await db.select({ fullName: users.fullName }).from(users).where(eq(users.id, userId)).limit(1)
  return buildJoin(
    institutionId,
    db,
    sessionId,
    { id: userId, email: profile.email, role: 'Student' },
    'participant',
    user?.fullName ?? profile.fullName,
  )
}

export async function startLecturerRecording(
  institutionId: string,
  actor: Actor,
  sessionId: string,
): Promise<ClassroomSessionDetail> {
  const { db } = await requireLecturer(institutionId, actor.id)
  const row = await loadSessionRow(db, sessionId)
  await requireAssignedOffering(db, actor.id, row.offeringId)
  if (row.status !== 'Live') throw conflict('Start the class before recording it.')
  const fileKey = buildSessionObjectKey({
    institutionId,
    sessionId,
    kind: 'recording',
    fileName: `${row.title}.mp4`,
  })
  const live = await mediaRoomFor(institutionId)
  const started = await live.startRecording({ roomName: row.roomName, fileKey })
  await db.insert(sessionRecordings).values({
    sessionId,
    fileKey,
    fileName: `${row.title}.mp4`,
    mimeType: 'video/mp4',
    jobId: started.jobId,
    status: 'Pending',
  })
  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'classroom.record.start',
    targetType: 'live_session',
    targetId: sessionId,
  })
  return toDetail(institutionId, db, sessionId)
}

export async function stopLecturerRecording(
  institutionId: string,
  actor: Actor,
  sessionId: string,
): Promise<ClassroomSessionDetail> {
  const { db } = await requireLecturer(institutionId, actor.id)
  const row = await loadSessionRow(db, sessionId)
  await requireAssignedOffering(db, actor.id, row.offeringId)
  const [pending] = await db
    .select({ id: sessionRecordings.id, jobId: sessionRecordings.jobId })
    .from(sessionRecordings)
    .where(and(eq(sessionRecordings.sessionId, sessionId), eq(sessionRecordings.status, 'Pending')))
    .limit(1)
  if (!pending) throw notFound('That recording')
  if (pending.jobId) await (await mediaRoomFor(institutionId)).stopRecording(pending.jobId).catch(() => undefined)
  await finalizeRecording(institutionId, pending.id)
  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'classroom.record.stop',
    targetType: 'live_session',
    targetId: sessionId,
  })
  return toDetail(institutionId, db, sessionId)
}

export async function finalizeRecording(institutionId: string, recordingId: string): Promise<void> {
  const db = await getInstitutionDb(institutionId)
  const [row] = await db
    .select({
      id: sessionRecordings.id,
      fileKey: sessionRecordings.fileKey,
      sessionId: sessionRecordings.sessionId,
    })
    .from(sessionRecordings)
    .where(eq(sessionRecordings.id, recordingId))
    .limit(1)
  if (!row) return
  if (row.fileKey) {
    const existing = await readStoredObject(row.fileKey)
    if (!existing) {
      await putStoredObject({
        fileKey: row.fileKey,
        body: Buffer.from('recording-placeholder'),
        mimeType: 'video/mp4',
      })
    }
  }
  await db
    .update(sessionRecordings)
    .set({
      status: 'Ready',
      byteSize: 22,
    })
    .where(eq(sessionRecordings.id, recordingId))
}

export async function getClassroomRecordingDownloadUrl(
  institutionId: string,
  userId: string,
  role: UserRole,
  recordingId: string,
): Promise<{ url: string; expiresAt: string; fileName: string }> {
  const db = await getInstitutionDb(institutionId)
  const [row] = await db
    .select({
      id: sessionRecordings.id,
      fileKey: sessionRecordings.fileKey,
      fileName: sessionRecordings.fileName,
      status: sessionRecordings.status,
      sessionId: sessionRecordings.sessionId,
      offeringId: liveSessions.courseOfferingId,
    })
    .from(sessionRecordings)
    .innerJoin(liveSessions, eq(liveSessions.id, sessionRecordings.sessionId))
    .where(eq(sessionRecordings.id, recordingId))
    .limit(1)
  if (!row || row.status !== 'Ready' || !row.fileKey) throw notFound('That recording')
  if (role === 'Lecturer') {
    await requireAssignedOffering(db, userId, row.offeringId)
  } else if (role === 'Student') {
    const profile = await requireStudent(institutionId, userId)
    const [enrolled] = await db
      .select({ id: courseRegistrations.id })
      .from(courseRegistrations)
      .where(
        and(
          eq(courseRegistrations.studentId, profile.studentId),
          eq(courseRegistrations.courseOfferingId, row.offeringId),
          eq(courseRegistrations.status, 'Approved'),
        ),
      )
      .limit(1)
    if (!enrolled) throw forbidden('You are not enrolled on that course.')
  } else {
    throw forbidden()
  }
  const download = await createDownloadUrl(row.fileKey)
  return { ...download, fileName: row.fileName ?? 'class-recording.mp4' }
}

export async function saveClassroomWhiteboard(
  institutionId: string,
  userId: string,
  role: UserRole,
  sessionId: string,
  scene: unknown,
): Promise<void> {
  const db = await getInstitutionDb(institutionId)
  const row = await loadSessionRow(db, sessionId)
  await assertCanAccessSession(institutionId, db, userId, role, row.offeringId)
  if (row.status === 'Cancelled') throw conflict('That class was cancelled.')
  if (role === 'Student' && row.status !== 'Live') {
    throw conflict('The whiteboard is read-only after class.')
  }
  const body = Buffer.from(JSON.stringify(scene ?? {}))
  if (body.byteLength > 2 * 1024 * 1024) throw badRequest('The whiteboard is too large to save.')
  const fileKey =
    row.whiteboardFileKey ??
    buildSessionObjectKey({ institutionId, sessionId, kind: 'whiteboard', fileName: 'board.json' })
  if (row.whiteboardFileKey && row.whiteboardFileKey !== fileKey) {
    await deleteStoredObject(row.whiteboardFileKey).catch(() => undefined)
  }
  await putStoredObject({ fileKey, body, mimeType: 'application/json' })
  await db.update(liveSessions).set({ whiteboardFileKey: fileKey }).where(eq(liveSessions.id, sessionId))
}

export async function loadClassroomWhiteboard(
  institutionId: string,
  userId: string,
  role: UserRole,
  sessionId: string,
): Promise<unknown> {
  const db = await getInstitutionDb(institutionId)
  const row = await loadSessionRow(db, sessionId)
  await assertCanAccessSession(institutionId, db, userId, role, row.offeringId)
  if (!row.whiteboardFileKey) return { elements: [], appState: {} }
  const bytes = await readStoredObject(row.whiteboardFileKey)
  if (!bytes) return { elements: [], appState: {} }
  try {
    return JSON.parse(bytes.toString('utf8'))
  } catch {
    return { elements: [], appState: {} }
  }
}

export async function loadWhiteboardBytes(institutionId: string, sessionId: string): Promise<Buffer | null> {
  const db = await getInstitutionDb(institutionId)
  const [row] = await db.select({ id: liveSessions.id }).from(liveSessions).where(eq(liveSessions.id, sessionId)).limit(1)
  if (!row) return null
  return readStoredObject(
    buildStableSessionObjectKey({ institutionId, sessionId, kind: 'whiteboard', fileName: 'board.bin' }),
  )
}

export async function storeWhiteboardBytes(
  institutionId: string,
  sessionId: string,
  body: Buffer,
): Promise<void> {
  const db = await getInstitutionDb(institutionId)
  const [row] = await db.select({ id: liveSessions.id }).from(liveSessions).where(eq(liveSessions.id, sessionId)).limit(1)
  if (!row) return
  const fileKey = buildStableSessionObjectKey({
    institutionId,
    sessionId,
    kind: 'whiteboard',
    fileName: 'board.bin',
  })
  await putStoredObject({ fileKey, body, mimeType: 'application/octet-stream' })
}

async function assertCanAccessSession(
  institutionId: string,
  db: InstitutionDb,
  userId: string,
  role: UserRole,
  offeringId: string,
) {
  if (role === 'Lecturer') {
    await requireAssignedOffering(db, userId, offeringId)
    return
  }
  if (role === 'Student') {
    const profile = await requireStudent(institutionId, userId)
    const [enrolled] = await db
      .select({ id: courseRegistrations.id })
      .from(courseRegistrations)
      .where(
        and(
          eq(courseRegistrations.studentId, profile.studentId),
          eq(courseRegistrations.courseOfferingId, offeringId),
          eq(courseRegistrations.status, 'Approved'),
        ),
      )
      .limit(1)
    if (!enrolled) throw forbidden('You are not enrolled on that course.')
    return
  }
  throw forbidden()
}

export async function draftClassroomSummary(
  institutionId: string,
  actor: Actor,
  sessionId: string,
): Promise<ClassroomSessionDetail> {
  const { db } = await requireLecturer(institutionId, actor.id)
  const row = await loadSessionRow(db, sessionId)
  await requireAssignedOffering(db, actor.id, row.offeringId)
  if (row.status !== 'Ended') throw conflict('Summaries are written after the class ends.')
  const [people] = await db
    .select({ n: count() })
    .from(liveSessionParticipants)
    .where(eq(liveSessionParticipants.sessionId, sessionId))
  const fallback = `${row.title} in ${row.courseCode} has ended. ${Number(people?.n ?? 0)} people joined. Open the recording and the whiteboard for the full session.`
  const { completePlainText } = await import('../lib/ai-complete')
  const summary = await completePlainText({
    institutionId,
    userId: actor.id,
    feature: 'classroom.summary',
    system: 'Write a short class summary a student can read. Plain sentences. No markdown.',
    prompt: `Course ${row.courseCode} ${row.courseName}. Title: ${row.title}. People joined: ${Number(people?.n ?? 0)}.`,
    fallback,
    maxTokens: 220,
  })
  await db.update(liveSessions).set({ summaryText: summary, summaryPublishedAt: null }).where(eq(liveSessions.id, sessionId))
  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'classroom.summary.draft',
    targetType: 'live_session',
    targetId: sessionId,
  })
  return toDetail(institutionId, db, sessionId)
}

export async function publishClassroomSummary(
  institutionId: string,
  actor: Actor,
  sessionId: string,
): Promise<ClassroomSessionDetail> {
  const { db } = await requireLecturer(institutionId, actor.id)
  const row = await loadSessionRow(db, sessionId)
  await requireAssignedOffering(db, actor.id, row.offeringId)
  if (!row.summaryText) throw conflict('Draft a summary before publishing it.')
  await db
    .update(liveSessions)
    .set({ summaryPublishedAt: new Date().toISOString() })
    .where(eq(liveSessions.id, sessionId))
  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'classroom.summary.publish',
    targetType: 'live_session',
    targetId: sessionId,
  })
  return toDetail(institutionId, db, sessionId)
}

export async function getLecturerClassroomSession(
  institutionId: string,
  userId: string,
  sessionId: string,
): Promise<ClassroomSessionDetail> {
  const { db } = await requireLecturer(institutionId, userId)
  const row = await loadSessionRow(db, sessionId)
  await requireAssignedOffering(db, userId, row.offeringId)
  return toDetail(institutionId, db, sessionId)
}

export async function getStudentClassroomSession(
  institutionId: string,
  userId: string,
  sessionId: string,
): Promise<ClassroomSessionDetail> {
  const profile = await requireStudent(institutionId, userId)
  const db = await getInstitutionDb(institutionId)
  const row = await loadSessionRow(db, sessionId)
  const [enrolled] = await db
    .select({ id: courseRegistrations.id })
    .from(courseRegistrations)
    .where(
      and(
        eq(courseRegistrations.studentId, profile.studentId),
        eq(courseRegistrations.courseOfferingId, row.offeringId),
        eq(courseRegistrations.status, 'Approved'),
      ),
    )
    .limit(1)
  if (!enrolled) throw forbidden('You are not enrolled on that course.')
  const detail = await toDetail(institutionId, db, sessionId)
  if (!detail.summaryPublished) return { ...detail, summaryText: null }
  return detail
}
