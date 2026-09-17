import { and, asc, desc, eq, isNotNull, sql } from 'drizzle-orm'
import type {
  CreateDiscussionPostRequest,
  CreateLecturerDiscussionRequest,
  DiscussionThreadDetail,
  DiscussionThreadSummary,
  UpdateLecturerDiscussionRequest,
  UserRole,
} from '@stackedu/shared'
import { getInstitutionDb } from '../db/connection'
import { discussionPosts, discussionThreads } from '../db/institution/schema/communication'
import { users } from '../db/institution/schema/people'
import { writeAudit } from '../lib/audit'
import { conflict, notFound } from '../lib/errors'
import { notifyEnrolledStudentsOfAnnouncement } from './role-notifications'
import { createLecturerAssessment, requireAssignedOffering, requireLecturer } from './lecturer'

type InstitutionDb = Awaited<ReturnType<typeof getInstitutionDb>>

export async function listOfferingDiscussionSummaries(
  db: InstitutionDb,
  offeringId: string,
  options?: { publishedOnly?: boolean },
): Promise<DiscussionThreadSummary[]> {
  const rows = await db
    .select({
      id: discussionThreads.id,
      offeringId: discussionThreads.courseOfferingId,
      title: discussionThreads.title,
      prompt: discussionThreads.prompt,
      isPublished: discussionThreads.isPublished,
      publishedAt: discussionThreads.publishedAt,
      closedAt: discussionThreads.closedAt,
      assessmentId: discussionThreads.assessmentId,
      createdAt: discussionThreads.createdAt,
      postCount: sql<number>`coalesce(count(${discussionPosts.id}), 0)::int`,
    })
    .from(discussionThreads)
    .leftJoin(discussionPosts, eq(discussionPosts.threadId, discussionThreads.id))
    .where(
      options?.publishedOnly
        ? and(eq(discussionThreads.courseOfferingId, offeringId), eq(discussionThreads.isPublished, true), isNotNull(discussionThreads.publishedAt))
        : eq(discussionThreads.courseOfferingId, offeringId),
    )
    .groupBy(discussionThreads.id)
    .orderBy(desc(discussionThreads.createdAt))

  return rows.map((row) => ({
    id: row.id,
    offeringId: row.offeringId,
    title: row.title,
    prompt: row.prompt,
    isPublished: row.isPublished,
    publishedAt: row.publishedAt,
    closedAt: row.closedAt,
    assessmentId: row.assessmentId,
    graded: Boolean(row.assessmentId),
    postCount: Number(row.postCount),
    createdAt: row.createdAt,
  }))
}

async function mapThreadDetail(db: InstitutionDb, threadId: string): Promise<DiscussionThreadDetail> {
  const [thread] = await db
    .select({
      id: discussionThreads.id,
      offeringId: discussionThreads.courseOfferingId,
      title: discussionThreads.title,
      prompt: discussionThreads.prompt,
      isPublished: discussionThreads.isPublished,
      publishedAt: discussionThreads.publishedAt,
      closedAt: discussionThreads.closedAt,
      assessmentId: discussionThreads.assessmentId,
      createdAt: discussionThreads.createdAt,
    })
    .from(discussionThreads)
    .where(eq(discussionThreads.id, threadId))
    .limit(1)
  if (!thread) throw notFound('That discussion')

  const posts = await db
    .select({
      id: discussionPosts.id,
      threadId: discussionPosts.threadId,
      parentPostId: discussionPosts.parentPostId,
      authorId: discussionPosts.authorId,
      authorName: users.fullName,
      authorRole: users.role,
      body: discussionPosts.body,
      createdAt: discussionPosts.createdAt,
    })
    .from(discussionPosts)
    .innerJoin(users, eq(users.id, discussionPosts.authorId))
    .where(eq(discussionPosts.threadId, threadId))
    .orderBy(asc(discussionPosts.createdAt))

  return {
    ...thread,
    graded: Boolean(thread.assessmentId),
    postCount: posts.length,
    posts,
  }
}

export async function createLecturerDiscussion(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  input: CreateLecturerDiscussionRequest,
): Promise<DiscussionThreadSummary> {
  const { db } = await requireLecturer(institutionId, actor.id)
  await requireAssignedOffering(db, actor.id, input.offeringId)

  let assessmentId: string | null = null
  if (input.graded) {
    const paper = await createLecturerAssessment(institutionId, actor, {
      offeringId: input.offeringId,
      title: input.title,
      description: input.prompt,
      type: 'Coursework',
      weight: input.weight ?? 10,
      totalMarks: 10,
      acceptsSubmissions: false,
      publish: input.publish ?? true,
    })
    assessmentId = paper.id
  }

  const publish = input.publish ?? true
  const [created] = await db
    .insert(discussionThreads)
    .values({
      courseOfferingId: input.offeringId,
      assessmentId,
      title: input.title,
      prompt: input.prompt,
      isPublished: publish,
      publishedAt: publish ? new Date().toISOString() : null,
      createdBy: actor.id,
    })
    .returning({ id: discussionThreads.id })

  if (publish) {
    await notifyEnrolledStudentsOfAnnouncement(db, input.offeringId, {
      title: `Discussion: ${input.title}`,
      body: input.prompt,
    })
  }

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: publish ? 'course.discussion.publish' : 'course.discussion.draft',
    targetType: 'discussion_thread',
    targetId: created!.id,
    metadata: { title: input.title, offeringId: input.offeringId, graded: Boolean(assessmentId) },
  })

  const list = await listOfferingDiscussionSummaries(db, input.offeringId)
  return list.find((row) => row.id === created!.id)!
}

export async function updateLecturerDiscussion(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  threadId: string,
  input: UpdateLecturerDiscussionRequest,
): Promise<DiscussionThreadSummary> {
  const { db } = await requireLecturer(institutionId, actor.id)
  const current = await mapThreadDetail(db, threadId)
  await requireAssignedOffering(db, actor.id, current.offeringId)

  const publish = input.publish
  const wasPublished = current.isPublished
  await db
    .update(discussionThreads)
    .set({
      title: input.title ?? current.title,
      prompt: input.prompt ?? current.prompt,
      isPublished: publish ?? current.isPublished,
      publishedAt: publish === true && !wasPublished ? new Date().toISOString() : current.publishedAt,
      closedAt: input.close === true ? new Date().toISOString() : input.close === false ? null : current.closedAt,
    })
    .where(eq(discussionThreads.id, threadId))

  if (publish === true && !wasPublished) {
    await notifyEnrolledStudentsOfAnnouncement(db, current.offeringId, {
      title: `Discussion: ${input.title ?? current.title}`,
      body: input.prompt ?? current.prompt,
    })
  }

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: input.close ? 'course.discussion.close' : 'course.discussion.update',
    targetType: 'discussion_thread',
    targetId: threadId,
    metadata: { title: input.title ?? current.title, offeringId: current.offeringId },
  })

  const list = await listOfferingDiscussionSummaries(db, current.offeringId)
  return list.find((row) => row.id === threadId)!
}

export async function deleteLecturerDiscussion(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  threadId: string,
): Promise<void> {
  const { db } = await requireLecturer(institutionId, actor.id)
  const current = await mapThreadDetail(db, threadId)
  await requireAssignedOffering(db, actor.id, current.offeringId)

  const [studentPost] = await db
    .select({ id: discussionPosts.id })
    .from(discussionPosts)
    .innerJoin(users, eq(users.id, discussionPosts.authorId))
    .where(and(eq(discussionPosts.threadId, threadId), eq(users.role, 'Student')))
    .limit(1)
  if (studentPost) {
    throw conflict('Students have already posted. Close the discussion instead of deleting it.')
  }

  await db.delete(discussionThreads).where(eq(discussionThreads.id, threadId))
  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'course.discussion.delete',
    targetType: 'discussion_thread',
    targetId: threadId,
    metadata: { title: current.title, offeringId: current.offeringId },
  })
}

export async function getLecturerDiscussion(
  institutionId: string,
  userId: string,
  threadId: string,
): Promise<DiscussionThreadDetail> {
  const { db } = await requireLecturer(institutionId, userId)
  const thread = await mapThreadDetail(db, threadId)
  await requireAssignedOffering(db, userId, thread.offeringId)
  return thread
}

export async function createLecturerDiscussionPost(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  threadId: string,
  input: CreateDiscussionPostRequest,
): Promise<DiscussionThreadDetail> {
  const { db } = await requireLecturer(institutionId, actor.id)
  const thread = await mapThreadDetail(db, threadId)
  await requireAssignedOffering(db, actor.id, thread.offeringId)
  if (thread.closedAt) throw conflict('This discussion is closed.')
  await insertPost(db, threadId, actor.id, input)
  return mapThreadDetail(db, threadId)
}

async function insertPost(
  db: InstitutionDb,
  threadId: string,
  authorId: string,
  input: CreateDiscussionPostRequest,
): Promise<void> {
  if (input.parentPostId) {
    const [parent] = await db
      .select({ id: discussionPosts.id })
      .from(discussionPosts)
      .where(and(eq(discussionPosts.id, input.parentPostId), eq(discussionPosts.threadId, threadId)))
      .limit(1)
    if (!parent) throw notFound('That reply')
  }
  await db.insert(discussionPosts).values({
    threadId,
    parentPostId: input.parentPostId ?? null,
    authorId,
    body: input.body,
  })
}

export { mapThreadDetail, insertPost }
