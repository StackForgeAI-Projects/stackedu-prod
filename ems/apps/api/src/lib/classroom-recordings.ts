import { and, eq, isNotNull, isNull, lte } from 'drizzle-orm'
import {
  DEFAULT_RECORDING_RETENTION,
  RECORDING_RETENTION_SETTING_KEY,
  recordingReminderAt,
  recordingRetentionSchema,
} from '@stackedu/shared'
import type { InstitutionDb } from '../db/connection'
import { courses } from '../db/institution/schema/academic'
import { sessionRecordings, liveSessions, courseOfferings } from '../db/institution/schema/teaching'
import { deleteStoredObject } from './storage'
import { readInstitutionSetting } from './institution-settings'
import { notifyEnrolledStudentsOfRecording } from '../services/role-notifications'
import { discardAbandonedClassroomRecordings } from '../services/live-sessions'

export async function processClassroomRecordings(
  db: InstitutionDb,
  now = new Date(),
  institutionId?: string,
): Promise<number> {
  const policy = await readInstitutionSetting(
    db,
    RECORDING_RETENTION_SETTING_KEY,
    recordingRetentionSchema,
    DEFAULT_RECORDING_RETENTION,
  )
  const nowIso = now.toISOString()
  const horizon = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()

  const due = await db
    .select({
      id: sessionRecordings.id,
      fileKey: sessionRecordings.fileKey,
      expiresAt: sessionRecordings.expiresAt,
      expiryReminderSentAt: sessionRecordings.expiryReminderSentAt,
      sessionId: sessionRecordings.sessionId,
      title: liveSessions.title,
      offeringId: liveSessions.courseOfferingId,
      courseCode: courses.code,
    })
    .from(sessionRecordings)
    .innerJoin(liveSessions, eq(liveSessions.id, sessionRecordings.sessionId))
    .innerJoin(courseOfferings, eq(courseOfferings.id, liveSessions.courseOfferingId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .where(
      and(
        eq(sessionRecordings.status, 'Ready'),
        isNull(sessionRecordings.purgedAt),
        isNotNull(sessionRecordings.expiresAt),
        lte(sessionRecordings.expiresAt, horizon),
      ),
    )

  let changed = 0
  for (const row of due) {
    if (!row.expiresAt) continue
    const expiresMs = new Date(row.expiresAt).getTime()
    if (expiresMs <= now.getTime()) {
      if (row.fileKey) await deleteStoredObject(row.fileKey).catch(() => undefined)
      await db
        .update(sessionRecordings)
        .set({ purgedAt: nowIso, fileKey: null, updatedAt: nowIso })
        .where(eq(sessionRecordings.id, row.id))
      changed += 1
      continue
    }
    if (row.expiryReminderSentAt) continue
    const reminderAt = recordingReminderAt(new Date(row.expiresAt), policy)
    if (now.getTime() < reminderAt.getTime()) continue
    await notifyEnrolledStudentsOfRecording(db, {
      offeringId: row.offeringId,
      sessionId: row.sessionId,
      title: row.title,
      courseCode: row.courseCode,
      kind: 'reminder',
      expiresAt: row.expiresAt,
      policy,
    })
    await db
      .update(sessionRecordings)
      .set({ expiryReminderSentAt: nowIso, updatedAt: nowIso })
      .where(eq(sessionRecordings.id, row.id))
    changed += 1
  }

  if (institutionId) changed += await discardAbandonedClassroomRecordings(institutionId, db)
  return changed
}
