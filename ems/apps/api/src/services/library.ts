import { and, desc, eq, gte, ilike, or, sql } from 'drizzle-orm'
import type {
  AttachLibraryFileRequest,
  CreateLibraryCollectionRequest,
  CreateLibraryRequest,
  CreateLibraryResourceRequest,
  DeclineLibraryRequest,
  DescribeLibraryResourceRequest,
  FulfilLibraryRequest,
  LibrarianDashboard,
  LibrarianNotification,
  LibrarianProfile,
  LibraryAccessOptions,
  LibraryAccessRule,
  LibraryAnalytics,
  LibraryCatalogueItem,
  LibraryCollection,
  LibraryCollectionDetail,
  LibraryFile,
  LibraryRequest,
  LibraryResource,
  ReserveLibraryUploadRequest,
  UpdateLibraryAccessRequest,
  UpdateLibraryCollectionRequest,
  UpdateLibraryResourceRequest,
  UserRole,
} from '@stackedu/shared'
import {
  formatFromLibraryFile,
  LIBRARY_RESOURCE_MAX_BYTES,
  LIBRARY_RESOURCE_MIME_TYPES,
  titleAndFirstName,
  uploadLimitMessage,
} from '@stackedu/shared'
import { completeLibraryDescription } from '../lib/ai-complete'
import { writeAudit } from '../lib/audit'
import { badRequest, conflict, forbidden, notFound } from '../lib/errors'
import {
  chunkLibraryText,
  hashedEmbedding,
  heuristicLibraryDescription,
  heuristicSubjectTags,
  LIBRARY_EMBEDDING_MODEL,
  vectorLiteral,
} from '../lib/library-embed'
import {
  buildLibraryFileKey,
  createDownloadUrl,
  createUploadTarget,
  deleteStoredObject,
  libraryFileKeyPrefix,
  readStoredObjectSample,
  type UploadTarget,
} from '../lib/storage'
import { extractTextSample } from '../lib/text-sample'
import { getInstitutionDb, getPlatformDb } from '../db/connection'
import { departments, programmes } from '../db/institution/schema/academic'
import { notifications } from '../db/institution/schema/communication'
import {
  collectionItems,
  collections,
  libraryResources,
  resourceAccessLogs,
  resourceAccessRules,
  resourceEmbeddings,
  resourceFiles,
  resourceRequests,
} from '../db/institution/schema/library'
import { users } from '../db/institution/schema/people'
import { students } from '../db/institution/schema/students'
import { institutions } from '../db/platform/schema'
import { unreadCount } from './academic'
import { activeUserIdsByRole, notifyUserIds } from './role-notifications'

type InstitutionDb = Awaited<ReturnType<typeof getInstitutionDb>>
type Actor = { id: string; email: string; role: UserRole }

const EMPTY_ACCESS: LibraryAccessRule = {
  programmeIds: [],
  departmentIds: [],
  yearGroups: [],
  roles: [],
  requiresFeeClearance: false,
}

const READER_ROLES: UserRole[] = ['Student', 'Lecturer', 'Librarian', 'AcademicAdmin']

function libraryPortalPath(role: UserRole): string {
  if (role === 'Lecturer') return '/lecturer/library'
  if (role === 'AcademicAdmin') return '/academic/library'
  return '/student/library'
}

async function notifyLibraryRequester(
  db: InstitutionDb,
  requestedBy: string,
  payload: { title: string; body: string },
): Promise<void> {
  const [requester] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, requestedBy))
    .limit(1)
  await notifyUserIds(db, [requestedBy], {
    title: payload.title,
    body: payload.body,
    category: 'Library',
    actionUrl: libraryPortalPath(requester?.role ?? 'Student'),
  })
}

export async function requireLibrarian(institutionId: string, userId: string) {
  const db = await getInstitutionDb(institutionId)
  const [user] = await db
    .select({ id: users.id, fullName: users.fullName, email: users.email, role: users.role, isActive: users.isActive })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  if (!user || user.role !== 'Librarian' || !user.isActive) {
    throw forbidden('This account is not a librarian.')
  }
  return { db, user }
}

export async function getLibrarianProfile(institutionId: string, userId: string): Promise<LibrarianProfile> {
  const { user } = await requireLibrarian(institutionId, userId)
  const platform = getPlatformDb()
  const [institution] = await platform
    .select({ name: institutions.name, shortName: institutions.shortName })
    .from(institutions)
    .where(eq(institutions.id, institutionId))
    .limit(1)
  return {
    userId: user.id,
    fullName: user.fullName,
    firstName: titleAndFirstName(user.fullName),
    email: user.email,
    role: user.role,
    institutionName: institution?.name ?? 'Institution',
    institutionShortName: institution?.shortName ?? 'INS',
    unreadCount: await unreadCount(institutionId, userId),
  }
}

export async function getLibrarianDashboard(institutionId: string, userId: string): Promise<LibrarianDashboard> {
  const profile = await getLibrarianProfile(institutionId, userId)
  const analytics = await getLibraryAnalytics(institutionId, userId)
  const recent = await listLibraryResources(institutionId, userId)
  const requests = await listLibraryRequests(institutionId, userId)
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const db = await getInstitutionDb(institutionId)
  const [today] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(resourceAccessLogs)
    .where(and(eq(resourceAccessLogs.action, 'download'), gte(resourceAccessLogs.createdAt, startOfDay.toISOString())))
  return {
    profile,
    totalResources: analytics.totalResources,
    publishedResources: analytics.publishedResources,
    pendingRequests: analytics.pendingRequests,
    downloadsToday: today?.count ?? 0,
    recentResources: recent.slice(0, 6),
    pendingRequestRows: requests.filter((row) => row.status === 'Pending').slice(0, 6),
  }
}

export async function listLibrarianNotifications(
  institutionId: string,
  userId: string,
): Promise<LibrarianNotification[]> {
  await requireLibrarian(institutionId, userId)
  const db = await getInstitutionDb(institutionId)
  return db
    .select({
      id: notifications.id,
      title: notifications.title,
      body: notifications.body,
      category: notifications.category,
      actionUrl: notifications.actionUrl,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
}

export async function markLibrarianNotificationRead(
  institutionId: string,
  userId: string,
  id: string,
): Promise<LibrarianNotification[]> {
  await requireLibrarian(institutionId, userId)
  const db = await getInstitutionDb(institutionId)
  const [updated] = await db
    .update(notifications)
    .set({ readAt: new Date().toISOString() })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
    .returning({ id: notifications.id })
  if (!updated) throw notFound('That notification')
  return listLibrarianNotifications(institutionId, userId)
}

export async function listLibraryAccessOptions(institutionId: string, userId: string): Promise<LibraryAccessOptions> {
  await requireLibrarian(institutionId, userId)
  const db = await getInstitutionDb(institutionId)
  const programmeRows = await db
    .select({ id: programmes.id, code: programmes.code, name: programmes.name })
    .from(programmes)
    .orderBy(programmes.code)
  const departmentRows = await db
    .select({ id: departments.id, code: departments.code, name: departments.name })
    .from(departments)
    .orderBy(departments.code)
  return { programmes: programmeRows, departments: departmentRows }
}

export async function listLibraryResources(institutionId: string, userId: string, query?: string): Promise<LibraryResource[]> {
  await requireLibrarian(institutionId, userId)
  const db = await getInstitutionDb(institutionId)
  const ids = query?.trim() ? await searchResourceIds(db, query.trim()) : null
  const rows = await db.select().from(libraryResources).orderBy(desc(libraryResources.createdAt))
  const filtered = ids
    ? rows.filter((row) => ids.has(row.id) || matchesQuery(row.title, row.author, row.subjectTags, query!))
    : rows
  return Promise.all(filtered.map((row) => mapResource(db, row)))
}

export async function getLibraryResource(institutionId: string, userId: string, resourceId: string): Promise<LibraryResource> {
  await requireLibrarian(institutionId, userId)
  const db = await getInstitutionDb(institutionId)
  return loadResource(db, resourceId)
}

export async function createLibraryResource(
  institutionId: string,
  actor: Actor,
  input: CreateLibraryResourceRequest,
): Promise<LibraryResource> {
  await requireLibrarian(institutionId, actor.id)
  const db = await getInstitutionDb(institutionId)
  const isbn = normaliseIsbn(input.isbn)
  await assertIsbnFree(db, isbn)
  const [row] = await db
    .insert(libraryResources)
    .values({
      title: input.title.trim(),
      author: input.author?.trim() || null,
      publisher: input.publisher?.trim() || null,
      isbn,
      type: input.type,
      description: input.description?.trim() || null,
      subjectTags: input.subjectTags ?? [],
      publicationYear: input.publicationYear ?? null,
      language: input.language?.trim() || 'en',
      isPublished: input.publish ?? false,
      uploadedBy: actor.id,
    })
    .returning()
  if (!row) throw notFound('That resource')
  await db.insert(resourceAccessRules).values({ resourceId: row.id })
  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'library.resource.create',
    targetType: 'library_resource',
    targetId: row.id,
    metadata: { title: row.title, type: row.type },
  })
  return loadResource(db, row.id)
}

export async function updateLibraryResource(
  institutionId: string,
  actor: Actor,
  resourceId: string,
  input: UpdateLibraryResourceRequest,
): Promise<LibraryResource> {
  await requireLibrarian(institutionId, actor.id)
  const db = await getInstitutionDb(institutionId)
  const existing = await loadResource(db, resourceId)
  const isbn = input.isbn === undefined ? undefined : normaliseIsbn(input.isbn)
  if (isbn !== undefined) await assertIsbnFree(db, isbn, resourceId)
  const [row] = await db
    .update(libraryResources)
    .set({
      title: input.title?.trim() ?? existing.title,
      author: input.author === undefined ? existing.author : input.author.trim() || null,
      publisher: input.publisher === undefined ? existing.publisher : input.publisher.trim() || null,
      isbn: isbn === undefined ? existing.isbn : isbn,
      type: input.type ?? existing.type,
      description: input.description === undefined ? existing.description : input.description.trim() || null,
      subjectTags: input.subjectTags ?? existing.subjectTags,
      publicationYear: input.publicationYear === undefined ? existing.publicationYear : input.publicationYear,
      language: input.language?.trim() ?? existing.language,
      isPublished: input.isPublished ?? existing.isPublished,
    })
    .where(eq(libraryResources.id, resourceId))
    .returning({ id: libraryResources.id })
  if (!row) throw notFound('That resource')
  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'library.resource.update',
    targetType: 'library_resource',
    targetId: resourceId,
    metadata: { title: input.title ?? existing.title },
  })
  return loadResource(db, resourceId)
}

export async function reserveLibraryUpload(
  institutionId: string,
  userId: string,
  resourceId: string,
  input: ReserveLibraryUploadRequest,
): Promise<{ fileKey: string } & UploadTarget> {
  await requireLibrarian(institutionId, userId)
  const db = await getInstitutionDb(institutionId)
  await requireResourceRow(db, resourceId)
  if (!LIBRARY_RESOURCE_MIME_TYPES.has(input.mimeType)) {
    throw badRequest('Upload a PDF, Word, EPUB, office, text or video file.')
  }
  if (input.fileSizeBytes > LIBRARY_RESOURCE_MAX_BYTES) {
    throw badRequest(uploadLimitMessage())
  }
  const fileKey = buildLibraryFileKey({ institutionId, resourceId, fileName: input.fileName })
  const target = await createUploadTarget({
    fileKey,
    mimeType: input.mimeType,
    fileSizeBytes: input.fileSizeBytes,
  })
  return { fileKey, ...target }
}

export async function attachLibraryFile(
  institutionId: string,
  actor: Actor,
  resourceId: string,
  input: AttachLibraryFileRequest,
): Promise<LibraryResource> {
  await requireLibrarian(institutionId, actor.id)
  const db = await getInstitutionDb(institutionId)
  const resource = await requireResourceRow(db, resourceId)
  const prefix = libraryFileKeyPrefix(institutionId, resourceId)
  if (!input.fileKey.startsWith(prefix)) throw badRequest('That upload is not valid for this resource.')
  if (!LIBRARY_RESOURCE_MIME_TYPES.has(input.mimeType)) {
    throw badRequest('Upload a PDF, Word, EPUB, office, text or video file.')
  }

  const existingFiles = await db
    .select({ id: resourceFiles.id })
    .from(resourceFiles)
    .where(eq(resourceFiles.resourceId, resourceId))
  const isPrimary = input.isPrimary ?? existingFiles.length === 0
  if (isPrimary && existingFiles.length > 0) {
    await db.update(resourceFiles).set({ isPrimary: false }).where(eq(resourceFiles.resourceId, resourceId))
  }

  await db.insert(resourceFiles).values({
    resourceId,
    fileName: input.fileName.trim(),
    fileKey: input.fileKey,
    fileSizeBytes: input.fileSizeBytes,
    mimeType: input.mimeType,
    format: formatFromLibraryFile(input.fileName, input.mimeType),
    isPrimary,
  })

  await ingestLibraryFile(institutionId, actor, {
    resourceId,
    title: resource.title,
    description: resource.description,
    subjectTags: resource.subjectTags,
    fileKey: input.fileKey,
    fileName: input.fileName,
    mimeType: input.mimeType,
  })

  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'library.file.attach',
    targetType: 'library_resource',
    targetId: resourceId,
    metadata: { fileName: input.fileName },
  })
  return loadResource(db, resourceId)
}

export async function deleteLibraryFile(
  institutionId: string,
  actor: Actor,
  resourceId: string,
  fileId: string,
): Promise<LibraryResource> {
  await requireLibrarian(institutionId, actor.id)
  const db = await getInstitutionDb(institutionId)
  await requireResourceRow(db, resourceId)
  const [file] = await db
    .select({ id: resourceFiles.id, fileKey: resourceFiles.fileKey, isPrimary: resourceFiles.isPrimary })
    .from(resourceFiles)
    .where(and(eq(resourceFiles.id, fileId), eq(resourceFiles.resourceId, resourceId)))
    .limit(1)
  if (!file) throw notFound('That file')
  await db.delete(resourceFiles).where(eq(resourceFiles.id, fileId))
  await deleteStoredObject(file.fileKey).catch(() => undefined)
  if (file.isPrimary) {
    const [next] = await db
      .select({ id: resourceFiles.id })
      .from(resourceFiles)
      .where(eq(resourceFiles.resourceId, resourceId))
      .limit(1)
    if (next) {
      await db.update(resourceFiles).set({ isPrimary: true }).where(eq(resourceFiles.id, next.id))
    }
  }
  const resource = await requireResourceRow(db, resourceId)
  await refreshResourceEmbeddings(db, resourceId, resource.title)
  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'library.file.delete',
    targetType: 'library_resource',
    targetId: resourceId,
  })
  return loadResource(db, resourceId)
}

export async function describeLibraryResource(
  institutionId: string,
  actor: Actor,
  input: DescribeLibraryResourceRequest,
): Promise<{ description: string; subjectTags: string[] }> {
  await requireLibrarian(institutionId, actor.id)
  const fileKey = input.fileKey?.trim()
  if (fileKey && !fileKey.startsWith(`institutions/${institutionId}/`)) {
    throw badRequest('That file does not belong to this institution.')
  }
  let excerpt = ''
  if (fileKey) {
    const bytes = await readStoredObjectSample(fileKey)
    excerpt = extractTextSample(bytes, input.mimeType ?? '')
  }
  const fallback = heuristicLibraryDescription({
    title: input.title,
    fileName: input.fileName,
    excerpt,
  })
  const description = await completeLibraryDescription({
    institutionId,
    userId: actor.id,
    fallback,
    prompt: [
      input.title ? `Title: ${input.title}` : null,
      input.fileName ? `File: ${input.fileName}` : null,
      excerpt ? `Extract:\n${excerpt.slice(0, 2500)}` : null,
    ]
      .filter(Boolean)
      .join('\n'),
  })
  return { description, subjectTags: heuristicSubjectTags(input.title ?? '', excerpt) }
}

export async function updateLibraryAccess(
  institutionId: string,
  actor: Actor,
  resourceId: string,
  input: UpdateLibraryAccessRequest,
): Promise<LibraryResource> {
  await requireLibrarian(institutionId, actor.id)
  const db = await getInstitutionDb(institutionId)
  await requireResourceRow(db, resourceId)
  const [existing] = await db
    .select({ id: resourceAccessRules.id })
    .from(resourceAccessRules)
    .where(eq(resourceAccessRules.resourceId, resourceId))
    .limit(1)
  if (existing) {
    await db
      .update(resourceAccessRules)
      .set({
        programmeIds: input.programmeIds,
        departmentIds: input.departmentIds,
        yearGroups: input.yearGroups,
        roles: input.roles,
        requiresFeeClearance: input.requiresFeeClearance,
      })
      .where(eq(resourceAccessRules.id, existing.id))
  } else {
    await db.insert(resourceAccessRules).values({ resourceId, ...input })
  }
  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'library.access.update',
    targetType: 'library_resource',
    targetId: resourceId,
  })
  return loadResource(db, resourceId)
}

export async function listLibraryCollections(institutionId: string, userId: string): Promise<LibraryCollection[]> {
  await requireLibrarian(institutionId, userId)
  const db = await getInstitutionDb(institutionId)
  const rows = await db.select().from(collections).orderBy(collections.name)
  const counts = await db
    .select({ collectionId: collectionItems.collectionId, count: sql<number>`count(*)::int` })
    .from(collectionItems)
    .groupBy(collectionItems.collectionId)
  const countById = new Map(counts.map((row) => [row.collectionId, row.count]))
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    isPublic: row.isPublic,
    resourceCount: countById.get(row.id) ?? 0,
    updatedAt: row.updatedAt,
  }))
}

export async function getLibraryCollection(
  institutionId: string,
  userId: string,
  collectionId: string,
): Promise<LibraryCollectionDetail> {
  await requireLibrarian(institutionId, userId)
  const db = await getInstitutionDb(institutionId)
  const [row] = await db.select().from(collections).where(eq(collections.id, collectionId)).limit(1)
  if (!row) throw notFound('That collection')
  const items = await db
    .select({ resourceId: collectionItems.resourceId })
    .from(collectionItems)
    .where(eq(collectionItems.collectionId, collectionId))
    .orderBy(collectionItems.sequence)
  const resources = await Promise.all(items.map((item) => loadResource(db, item.resourceId)))
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    isPublic: row.isPublic,
    resourceCount: resources.length,
    updatedAt: row.updatedAt,
    resources,
  }
}

export async function createLibraryCollection(
  institutionId: string,
  actor: Actor,
  input: CreateLibraryCollectionRequest,
): Promise<LibraryCollection> {
  await requireLibrarian(institutionId, actor.id)
  const db = await getInstitutionDb(institutionId)
  try {
    const [row] = await db
      .insert(collections)
      .values({
        name: input.name.trim(),
        description: input.description?.trim() || null,
        isPublic: input.isPublic ?? true,
        createdBy: actor.id,
      })
      .returning()
    if (!row) throw notFound('That collection')
    await writeAudit({
      institutionId,
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'library.collection.create',
      targetType: 'library_collection',
      targetId: row.id,
      metadata: { name: row.name },
    })
    return { ...row, resourceCount: 0 }
  } catch (error) {
    if (isUniqueViolation(error)) throw conflict('A collection with that name already exists.')
    throw error
  }
}

export async function updateLibraryCollection(
  institutionId: string,
  actor: Actor,
  collectionId: string,
  input: UpdateLibraryCollectionRequest,
): Promise<LibraryCollection> {
  await requireLibrarian(institutionId, actor.id)
  const db = await getInstitutionDb(institutionId)
  const [existing] = await db.select().from(collections).where(eq(collections.id, collectionId)).limit(1)
  if (!existing) throw notFound('That collection')
  try {
    await db
      .update(collections)
      .set({
        name: input.name?.trim() ?? existing.name,
        description: input.description === undefined ? existing.description : input.description.trim() || null,
        isPublic: input.isPublic ?? existing.isPublic,
      })
      .where(eq(collections.id, collectionId))
    const listed = await listLibraryCollections(institutionId, actor.id)
    const updated = listed.find((item) => item.id === collectionId)
    if (!updated) throw notFound('That collection')
    return updated
  } catch (error) {
    if (isUniqueViolation(error)) throw conflict('A collection with that name already exists.')
    throw error
  }
}

export async function deleteLibraryCollection(institutionId: string, actor: Actor, collectionId: string): Promise<void> {
  await requireLibrarian(institutionId, actor.id)
  const db = await getInstitutionDb(institutionId)
  const [existing] = await db
    .select({ id: collections.id, name: collections.name })
    .from(collections)
    .where(eq(collections.id, collectionId))
    .limit(1)
  if (!existing) throw notFound('That collection')
  await db.delete(collections).where(eq(collections.id, collectionId))
  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'library.collection.delete',
    targetType: 'library_collection',
    targetId: collectionId,
    metadata: { name: existing.name },
  })
}

export async function addCollectionItem(
  institutionId: string,
  actor: Actor,
  collectionId: string,
  resourceId: string,
): Promise<LibraryCollectionDetail> {
  await requireLibrarian(institutionId, actor.id)
  const db = await getInstitutionDb(institutionId)
  await requireResourceRow(db, resourceId)
  const [collection] = await db.select({ id: collections.id }).from(collections).where(eq(collections.id, collectionId)).limit(1)
  if (!collection) throw notFound('That collection')
  const existing = await db
    .select({ id: collectionItems.id })
    .from(collectionItems)
    .where(and(eq(collectionItems.collectionId, collectionId), eq(collectionItems.resourceId, resourceId)))
    .limit(1)
  if (existing.length === 0) {
    const [seqRow] = await db
      .select({ maxSeq: sql<number>`coalesce(max(${collectionItems.sequence}), -1)::int` })
      .from(collectionItems)
      .where(eq(collectionItems.collectionId, collectionId))
    await db.insert(collectionItems).values({
      collectionId,
      resourceId,
      sequence: (seqRow?.maxSeq ?? -1) + 1,
    })
  }
  return getLibraryCollection(institutionId, actor.id, collectionId)
}

export async function removeCollectionItem(
  institutionId: string,
  actor: Actor,
  collectionId: string,
  resourceId: string,
): Promise<LibraryCollectionDetail> {
  await requireLibrarian(institutionId, actor.id)
  const db = await getInstitutionDb(institutionId)
  await db
    .delete(collectionItems)
    .where(and(eq(collectionItems.collectionId, collectionId), eq(collectionItems.resourceId, resourceId)))
  return getLibraryCollection(institutionId, actor.id, collectionId)
}

export async function listLibraryRequests(institutionId: string, userId: string): Promise<LibraryRequest[]> {
  await requireLibrarian(institutionId, userId)
  return loadRequests(await getInstitutionDb(institutionId))
}

export async function fulfilLibraryRequest(
  institutionId: string,
  actor: Actor,
  requestId: string,
  input: FulfilLibraryRequest,
): Promise<LibraryRequest[]> {
  await requireLibrarian(institutionId, actor.id)
  const db = await getInstitutionDb(institutionId)
  const [row] = await db.select().from(resourceRequests).where(eq(resourceRequests.id, requestId)).limit(1)
  if (!row) throw notFound('That request')
  if (row.status !== 'Pending') throw badRequest('That request has already been reviewed.')
  const fulfilledResourceId = input.resourceId ?? null
  if (fulfilledResourceId) await requireResourceRow(db, fulfilledResourceId)
  await db
    .update(resourceRequests)
    .set({
      status: 'Fulfilled',
      reviewedBy: actor.id,
      reviewedAt: new Date().toISOString(),
      fulfilledResourceId,
    })
    .where(eq(resourceRequests.id, requestId))
  await notifyLibraryRequester(db, row.requestedBy, {
    title: 'Library request fulfilled',
    body: fulfilledResourceId
      ? `"${row.title}" is now in the e-library.`
      : `"${row.title}" has been marked as fulfilled.`,
  })
  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'library.request.fulfil',
    targetType: 'library_request',
    targetId: requestId,
  })
  return loadRequests(db)
}

export async function declineLibraryRequest(
  institutionId: string,
  actor: Actor,
  requestId: string,
  input: DeclineLibraryRequest,
): Promise<LibraryRequest[]> {
  await requireLibrarian(institutionId, actor.id)
  const db = await getInstitutionDb(institutionId)
  const [row] = await db.select().from(resourceRequests).where(eq(resourceRequests.id, requestId)).limit(1)
  if (!row) throw notFound('That request')
  if (row.status !== 'Pending') throw badRequest('That request has already been reviewed.')
  await db
    .update(resourceRequests)
    .set({
      status: 'Declined',
      reviewedBy: actor.id,
      reviewedAt: new Date().toISOString(),
      reason: input.reason,
    })
    .where(eq(resourceRequests.id, requestId))
  await notifyLibraryRequester(db, row.requestedBy, {
    title: 'Library request declined',
    body: `"${row.title}" could not be added. ${input.reason}`,
  })
  await writeAudit({
    institutionId,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: 'library.request.decline',
    targetType: 'library_request',
    targetId: requestId,
  })
  return loadRequests(db)
}

export async function getLibraryAnalytics(institutionId: string, userId: string): Promise<LibraryAnalytics> {
  await requireLibrarian(institutionId, userId)
  const db = await getInstitutionDb(institutionId)
  const resourceRows = await db
    .select({
      id: libraryResources.id,
      title: libraryResources.title,
      type: libraryResources.type,
      isPublished: libraryResources.isPublished,
      downloadCount: libraryResources.downloadCount,
      viewCount: libraryResources.viewCount,
    })
    .from(libraryResources)
  const [pending] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(resourceRequests)
    .where(eq(resourceRequests.status, 'Pending'))
  const byTypeMap = new Map<LibraryResource['type'], number>()
  for (const row of resourceRows) {
    byTypeMap.set(row.type, (byTypeMap.get(row.type) ?? 0) + 1)
  }
  const since = new Date()
  since.setDate(since.getDate() - 13)
  since.setHours(0, 0, 0, 0)
  const logs = await db
    .select({ action: resourceAccessLogs.action, createdAt: resourceAccessLogs.createdAt })
    .from(resourceAccessLogs)
    .where(gte(resourceAccessLogs.createdAt, since.toISOString()))
  const dailyMap = new Map<string, { downloads: number; views: number }>()
  for (let day = 0; day < 14; day += 1) {
    const date = new Date(since)
    date.setDate(since.getDate() + day)
    dailyMap.set(date.toISOString().slice(0, 10), { downloads: 0, views: 0 })
  }
  for (const log of logs) {
    const date = log.createdAt.slice(0, 10)
    const bucket = dailyMap.get(date)
    if (!bucket) continue
    if (log.action === 'download') bucket.downloads += 1
    if (log.action === 'view') bucket.views += 1
  }
  return {
    totalResources: resourceRows.length,
    publishedResources: resourceRows.filter((row) => row.isPublished).length,
    totalDownloads: resourceRows.reduce((sum, row) => sum + row.downloadCount, 0),
    totalViews: resourceRows.reduce((sum, row) => sum + row.viewCount, 0),
    pendingRequests: pending?.count ?? 0,
    byType: [...byTypeMap.entries()].map(([type, count]) => ({ type, count })),
    topResources: [...resourceRows]
      .sort((a, b) => b.downloadCount - a.downloadCount || b.viewCount - a.viewCount)
      .slice(0, 8)
      .map((row) => ({
        id: row.id,
        title: row.title,
        type: row.type,
        downloadCount: row.downloadCount,
        viewCount: row.viewCount,
      })),
    daily: [...dailyMap.entries()].map(([date, counts]) => ({ date, ...counts })),
  }
}

export async function listReadableLibrary(
  institutionId: string,
  userId: string,
  query?: string,
): Promise<LibraryCatalogueItem[]> {
  const db = await getInstitutionDb(institutionId)
  const actor = await requireLibraryReader(db, userId)
  const ctx = await readerContext(db, actor)
  const rows = await db.select().from(libraryResources).where(eq(libraryResources.isPublished, true)).orderBy(libraryResources.title)
  const rules = await db.select().from(resourceAccessRules)
  const ruleByResource = new Map(rules.map((row) => [row.resourceId, row]))
  const ranked = query?.trim() ? await searchResourceIds(db, query.trim()) : null
  const visible = rows.filter((row) => {
    if (!canReadPublished(actor.role, ctx, toAccess(ruleByResource.get(row.id)))) return false
    if (!ranked) return true
    return ranked.has(row.id) || matchesQuery(row.title, row.author, row.subjectTags, query!)
  })
  return Promise.all(visible.map((row) => mapCatalogueItem(db, row)))
}

export async function createReaderLibraryRequest(
  institutionId: string,
  userId: string,
  input: CreateLibraryRequest,
): Promise<LibraryRequest[]> {
  const db = await getInstitutionDb(institutionId)
  const actor = await requireLibraryReader(db, userId)
  await db.insert(resourceRequests).values({
    requestedBy: actor.id,
    title: input.title.trim(),
    author: input.author?.trim() || null,
    reason: input.reason?.trim() || null,
    status: 'Pending',
  })
  const librarianIds = await activeUserIdsByRole(db, 'Librarian')
  await notifyUserIds(db, librarianIds, {
    title: 'New library request',
    body: `${actor.fullName} asked for "${input.title.trim()}".`,
    category: 'Library',
    actionUrl: '/librarian/requests',
  })
  return listMyLibraryRequests(institutionId, userId)
}

export async function listMyLibraryRequests(institutionId: string, userId: string): Promise<LibraryRequest[]> {
  const db = await getInstitutionDb(institutionId)
  await requireLibraryReader(db, userId)
  return loadRequests(db, userId)
}

export async function getLibraryDownload(
  institutionId: string,
  userId: string,
  resourceId: string,
  fileId?: string,
): Promise<{ url: string; expiresAt: string; fileName: string }> {
  const db = await getInstitutionDb(institutionId)
  const actor = await requireLibraryReader(db, userId)
  const resource = await requireResourceRow(db, resourceId)
  if (!resource.isPublished && actor.role !== 'Librarian') throw notFound('That resource')
  const ctx = await readerContext(db, actor)
  const [rule] = await db.select().from(resourceAccessRules).where(eq(resourceAccessRules.resourceId, resourceId)).limit(1)
  if (actor.role !== 'Librarian' && !canReadPublished(actor.role, ctx, toAccess(rule))) {
    throw forbidden('This resource is not available to your account.')
  }
  const files = await db
    .select()
    .from(resourceFiles)
    .where(eq(resourceFiles.resourceId, resourceId))
    .orderBy(desc(resourceFiles.isPrimary))
  const file = fileId ? files.find((item) => item.id === fileId) : files[0]
  if (!file) throw notFound('That file')
  await db.insert(resourceAccessLogs).values({
    resourceId,
    userId: actor.id,
    studentId: ctx.studentId,
    action: 'download',
  })
  await db
    .update(libraryResources)
    .set({ downloadCount: sql`${libraryResources.downloadCount} + 1` })
    .where(eq(libraryResources.id, resourceId))
  const download = await createDownloadUrl(file.fileKey)
  return { ...download, fileName: file.fileName }
}

async function ingestLibraryFile(
  institutionId: string,
  actor: Actor,
  input: {
    resourceId: string
    title: string
    description: string | null
    subjectTags: string[]
    fileKey: string
    fileName: string
    mimeType: string
  },
): Promise<void> {
  const bytes = await readStoredObjectSample(input.fileKey)
  const excerpt = extractTextSample(bytes, input.mimeType)
  const db = await getInstitutionDb(institutionId)
  if (!input.description?.trim() || input.subjectTags.length === 0) {
    const fallback = heuristicLibraryDescription({ title: input.title, fileName: input.fileName, excerpt })
    const description = input.description?.trim()
      ? input.description
      : await completeLibraryDescription({
          institutionId,
          userId: actor.id,
          fallback,
          prompt: [`Title: ${input.title}`, `File: ${input.fileName}`, excerpt ? `Extract:\n${excerpt.slice(0, 2500)}` : null]
            .filter(Boolean)
            .join('\n'),
        })
    const subjectTags = input.subjectTags.length ? input.subjectTags : heuristicSubjectTags(input.title, excerpt)
    await db
      .update(libraryResources)
      .set({ description, subjectTags })
      .where(eq(libraryResources.id, input.resourceId))
  }
  await refreshResourceEmbeddings(db, input.resourceId, input.title)
}

async function refreshResourceEmbeddings(
  db: InstitutionDb,
  resourceId: string,
  title: string,
): Promise<void> {
  const files = await db
    .select({ fileKey: resourceFiles.fileKey, mimeType: resourceFiles.mimeType })
    .from(resourceFiles)
    .where(eq(resourceFiles.resourceId, resourceId))
  await db.delete(resourceEmbeddings).where(eq(resourceEmbeddings.resourceId, resourceId))
  const parts = [title]
  for (const file of files) {
    const bytes = await readStoredObjectSample(file.fileKey)
    const excerpt = extractTextSample(bytes, file.mimeType ?? '')
    if (excerpt.trim()) parts.push(excerpt)
  }
  const chunks = chunkLibraryText(parts.filter(Boolean).join('\n'))
  if (chunks.length === 0) return
  await db.insert(resourceEmbeddings).values(
    chunks.map((chunkText, chunkIndex) => ({
      resourceId,
      chunkIndex,
      chunkText,
      embedding: sql.raw(`'${vectorLiteral(hashedEmbedding(chunkText))}'::vector`),
      model: LIBRARY_EMBEDDING_MODEL,
    })),
  )
}

async function searchResourceIds(db: InstitutionDb, query: string): Promise<Set<string>> {
  const like = `%${query}%`
  const keyword = await db
    .select({ id: libraryResources.id })
    .from(libraryResources)
    .where(
      or(
        ilike(libraryResources.title, like),
        ilike(libraryResources.author, like),
        ilike(libraryResources.description, like),
        sql`array_to_string(${libraryResources.subjectTags}, ' ') ilike ${like}`,
      ),
    )
  const ids = new Set(keyword.map((row) => row.id))
  const tokens = query.toLowerCase().match(/[a-z0-9]{4,}/g) ?? []
  if (tokens.length === 0) return ids

  const literal = vectorLiteral(hashedEmbedding(query))
  const tokenClause = sql.join(
    tokens.map((token) => sql`chunk_text ilike ${`%${token}%`}`),
    sql` or `,
  )
  try {
    const ranked = await db.execute<{ resource_id: string }>(sql`
      SELECT resource_id
      FROM resource_embeddings
      WHERE (${tokenClause})
      ORDER BY embedding <=> ${sql.raw(`'${literal}'::vector`)}
      LIMIT 24
    `)
    const rows = Array.isArray(ranked) ? ranked : ((ranked as { rows?: { resource_id: string }[] }).rows ?? [])
    for (const row of rows) ids.add(row.resource_id)
  } catch {
    // Keyword results are enough when embeddings are empty.
  }
  return ids
}

async function requireLibraryReader(db: InstitutionDb, userId: string) {
  const [user] = await db
    .select({ id: users.id, fullName: users.fullName, email: users.email, role: users.role, isActive: users.isActive })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  if (!user || !user.isActive || !READER_ROLES.includes(user.role)) {
    throw forbidden('This account cannot use the e-library.')
  }
  return user
}

async function readerContext(db: InstitutionDb, actor: { id: string; role: UserRole }) {
  if (actor.role !== 'Student') {
    return {
      studentId: null as string | null,
      programmeId: null as string | null,
      departmentId: null as string | null,
      yearOfStudy: null as number | null,
      feeHold: false,
    }
  }
  const [row] = await db
    .select({
      studentId: students.id,
      programmeId: students.programmeId,
      yearOfStudy: students.yearOfStudy,
      feeHold: students.feeHold,
      departmentId: programmes.departmentId,
    })
    .from(students)
    .innerJoin(programmes, eq(programmes.id, students.programmeId))
    .where(eq(students.userId, actor.id))
    .limit(1)
  if (!row) throw forbidden('This account is not a student.')
  return {
    studentId: row.studentId,
    programmeId: row.programmeId,
    departmentId: row.departmentId,
    yearOfStudy: row.yearOfStudy,
    feeHold: row.feeHold,
  }
}

function canReadPublished(
  role: UserRole,
  ctx: { programmeId: string | null; departmentId: string | null; yearOfStudy: number | null; feeHold: boolean },
  rule: LibraryAccessRule,
): boolean {
  if (rule.roles.length > 0 && !rule.roles.includes(role)) return false
  if (role !== 'Student') return true
  if (rule.requiresFeeClearance && ctx.feeHold) return false
  if (rule.programmeIds.length > 0 && (!ctx.programmeId || !rule.programmeIds.includes(ctx.programmeId))) return false
  if (rule.departmentIds.length > 0 && (!ctx.departmentId || !rule.departmentIds.includes(ctx.departmentId))) return false
  if (rule.yearGroups.length > 0 && (ctx.yearOfStudy == null || !rule.yearGroups.includes(ctx.yearOfStudy))) return false
  return true
}

function toAccess(row?: {
  programmeIds: string[]
  departmentIds: string[]
  yearGroups: number[]
  roles: string[]
  requiresFeeClearance: boolean
} | null): LibraryAccessRule {
  if (!row) return EMPTY_ACCESS
  return {
    programmeIds: row.programmeIds,
    departmentIds: row.departmentIds,
    yearGroups: row.yearGroups,
    roles: row.roles as UserRole[],
    requiresFeeClearance: row.requiresFeeClearance,
  }
}

async function requireResourceRow(db: InstitutionDb, resourceId: string) {
  const [row] = await db.select().from(libraryResources).where(eq(libraryResources.id, resourceId)).limit(1)
  if (!row) throw notFound('That resource')
  return row
}

async function loadResource(db: InstitutionDb, resourceId: string): Promise<LibraryResource> {
  const row = await requireResourceRow(db, resourceId)
  return mapResource(db, row)
}

async function mapResource(
  db: InstitutionDb,
  row: typeof libraryResources.$inferSelect,
): Promise<LibraryResource> {
  const files = await loadFiles(db, row.id)
  const [rule] = await db.select().from(resourceAccessRules).where(eq(resourceAccessRules.resourceId, row.id)).limit(1)
  const collectionRows = await db
    .select({ collectionId: collectionItems.collectionId })
    .from(collectionItems)
    .where(eq(collectionItems.resourceId, row.id))
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    publisher: row.publisher,
    isbn: row.isbn,
    type: row.type,
    description: row.description,
    subjectTags: row.subjectTags,
    publicationYear: row.publicationYear,
    language: row.language,
    isPublished: row.isPublished,
    downloadCount: row.downloadCount,
    viewCount: row.viewCount,
    files,
    access: toAccess(rule),
    collectionIds: collectionRows.map((item) => item.collectionId),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

async function mapCatalogueItem(
  db: InstitutionDb,
  row: typeof libraryResources.$inferSelect,
): Promise<LibraryCatalogueItem> {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    publisher: row.publisher,
    type: row.type,
    description: row.description,
    subjectTags: row.subjectTags,
    publicationYear: row.publicationYear,
    language: row.language,
    files: await loadFiles(db, row.id),
  }
}

async function loadFiles(db: InstitutionDb, resourceId: string): Promise<LibraryFile[]> {
  const rows = await db
    .select()
    .from(resourceFiles)
    .where(eq(resourceFiles.resourceId, resourceId))
    .orderBy(desc(resourceFiles.isPrimary), resourceFiles.createdAt)
  return rows.map((row) => ({
    id: row.id,
    fileName: row.fileName,
    format: row.format,
    mimeType: row.mimeType,
    fileSizeBytes: row.fileSizeBytes,
    isPrimary: row.isPrimary,
    createdAt: row.createdAt,
  }))
}

async function loadRequests(db: InstitutionDb, requestedBy?: string): Promise<LibraryRequest[]> {
  const rows = requestedBy
    ? await db
        .select({
          id: resourceRequests.id,
          title: resourceRequests.title,
          author: resourceRequests.author,
          reason: resourceRequests.reason,
          status: resourceRequests.status,
          requestedBy: resourceRequests.requestedBy,
          fulfilledResourceId: resourceRequests.fulfilledResourceId,
          createdAt: resourceRequests.createdAt,
          reviewedAt: resourceRequests.reviewedAt,
          requesterName: users.fullName,
          requesterRole: users.role,
        })
        .from(resourceRequests)
        .innerJoin(users, eq(users.id, resourceRequests.requestedBy))
        .where(eq(resourceRequests.requestedBy, requestedBy))
        .orderBy(desc(resourceRequests.createdAt))
    : await db
        .select({
          id: resourceRequests.id,
          title: resourceRequests.title,
          author: resourceRequests.author,
          reason: resourceRequests.reason,
          status: resourceRequests.status,
          requestedBy: resourceRequests.requestedBy,
          fulfilledResourceId: resourceRequests.fulfilledResourceId,
          createdAt: resourceRequests.createdAt,
          reviewedAt: resourceRequests.reviewedAt,
          requesterName: users.fullName,
          requesterRole: users.role,
        })
        .from(resourceRequests)
        .innerJoin(users, eq(users.id, resourceRequests.requestedBy))
        .orderBy(desc(resourceRequests.createdAt))
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    author: row.author,
    reason: row.reason,
    status: row.status === 'Fulfilled' || row.status === 'Declined' ? row.status : 'Pending',
    requesterName: row.requesterName,
    requesterRole: row.requesterRole,
    fulfilledResourceId: row.fulfilledResourceId,
    createdAt: row.createdAt,
    reviewedAt: row.reviewedAt,
  }))
}

function matchesQuery(title: string, author: string | null, tags: string[], query: string): boolean {
  const haystack = `${title} ${author ?? ''} ${tags.join(' ')}`.toLowerCase()
  return haystack.includes(query.trim().toLowerCase())
}

function normaliseIsbn(value?: string | null): string | null {
  const isbn = value?.trim()
  return isbn ? isbn : null
}

async function assertIsbnFree(db: InstitutionDb, isbn: string | null, exceptId?: string): Promise<void> {
  if (!isbn) return
  const [existing] = await db
    .select({ id: libraryResources.id })
    .from(libraryResources)
    .where(eq(libraryResources.isbn, isbn))
    .limit(1)
  if (existing && existing.id !== exceptId) throw conflict('A resource with that ISBN is already in the catalogue.')
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === '23505'
}
