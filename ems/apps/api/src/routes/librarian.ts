import { Hono } from 'hono'
import {
  addCollectionItemRequestSchema,
  attachLibraryFileRequestSchema,
  createLibraryCollectionRequestSchema,
  createLibraryResourceRequestSchema,
  declineLibraryRequestSchema,
  describeLibraryResourceRequestSchema,
  fulfilLibraryRequestSchema,
  reserveLibraryUploadRequestSchema,
  updateLibraryAccessRequestSchema,
  updateLibraryCollectionRequestSchema,
  updateLibraryResourceRequestSchema,
} from '@stackedu/shared'
import { validationFailed } from '../lib/errors'
import { requireAuth, requireRole, type AuthVariables } from '../middleware/auth'
import type { RequestVariables } from '../middleware/request-context'
import {
  addCollectionItem,
  attachLibraryFile,
  createLibraryCollection,
  createLibraryResource,
  declineLibraryRequest,
  deleteLibraryCollection,
  deleteLibraryFile,
  describeLibraryResource,
  fulfilLibraryRequest,
  getLibrarianDashboard,
  getLibrarianProfile,
  getLibraryAnalytics,
  getLibraryCollection,
  getLibraryDownload,
  getLibraryResource,
  listLibrarianNotifications,
  listLibraryAccessOptions,
  listLibraryCollections,
  listLibraryRequests,
  listLibraryResources,
  markLibrarianNotificationRead,
  removeCollectionItem,
  reserveLibraryUpload,
  updateLibraryAccess,
  updateLibraryCollection,
  updateLibraryResource,
} from '../services/library'

type Variables = RequestVariables & Partial<AuthVariables>

export const librarianRoutes = new Hono<{ Variables: Variables }>()

const librarianOnly = [requireAuth, requireRole('Librarian')] as const

function fieldErrors(error: { flatten: () => { fieldErrors: unknown } }): Record<string, string[]> {
  return error.flatten().fieldErrors as Record<string, string[]>
}

function actor(c: { get: (key: 'user') => AuthVariables['user'] | undefined }) {
  const user = c.get('user')!
  return { id: user.id, email: user.email, role: user.role }
}

librarianRoutes.get('/librarian/me', ...librarianOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ profile: await getLibrarianProfile(user.institution.id, user.id) })
})

librarianRoutes.get('/librarian/dashboard', ...librarianOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ dashboard: await getLibrarianDashboard(user.institution.id, user.id) })
})

librarianRoutes.get('/librarian/notifications', ...librarianOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ notifications: await listLibrarianNotifications(user.institution.id, user.id) })
})

librarianRoutes.post('/librarian/notifications/:id/read', ...librarianOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    notifications: await markLibrarianNotificationRead(user.institution.id, user.id, c.req.param('id')),
  })
})

librarianRoutes.get('/librarian/analytics', ...librarianOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ analytics: await getLibraryAnalytics(user.institution.id, user.id) })
})

librarianRoutes.get('/librarian/access-options', ...librarianOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ options: await listLibraryAccessOptions(user.institution.id, user.id) })
})

librarianRoutes.get('/librarian/resources', ...librarianOnly, async (c) => {
  const user = c.get('user')!
  const query = c.req.query('q') ?? undefined
  return c.json({ resources: await listLibraryResources(user.institution.id, user.id, query) })
})

librarianRoutes.post('/librarian/resources', ...librarianOnly, async (c) => {
  const parsed = createLibraryResourceRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  return c.json(
    { resource: await createLibraryResource(c.get('user')!.institution.id, actor(c), parsed.data) },
    201,
  )
})

librarianRoutes.post('/librarian/resources/describe', ...librarianOnly, async (c) => {
  const parsed = describeLibraryResourceRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  return c.json(await describeLibraryResource(c.get('user')!.institution.id, actor(c), parsed.data))
})

librarianRoutes.get('/librarian/resources/:id', ...librarianOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ resource: await getLibraryResource(user.institution.id, user.id, c.req.param('id')) })
})

librarianRoutes.patch('/librarian/resources/:id', ...librarianOnly, async (c) => {
  const parsed = updateLibraryResourceRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  return c.json({
    resource: await updateLibraryResource(c.get('user')!.institution.id, actor(c), c.req.param('id'), parsed.data),
  })
})

librarianRoutes.put('/librarian/resources/:id/access', ...librarianOnly, async (c) => {
  const parsed = updateLibraryAccessRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  return c.json({
    resource: await updateLibraryAccess(c.get('user')!.institution.id, actor(c), c.req.param('id'), parsed.data),
  })
})

librarianRoutes.post('/librarian/resources/:id/upload-target', ...librarianOnly, async (c) => {
  const parsed = reserveLibraryUploadRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  return c.json({
    upload: await reserveLibraryUpload(user.institution.id, user.id, c.req.param('id'), parsed.data),
  })
})

librarianRoutes.post('/librarian/resources/:id/files', ...librarianOnly, async (c) => {
  const parsed = attachLibraryFileRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  return c.json({
    resource: await attachLibraryFile(c.get('user')!.institution.id, actor(c), c.req.param('id'), parsed.data),
  })
})

librarianRoutes.delete('/librarian/resources/:id/files/:fileId', ...librarianOnly, async (c) => {
  return c.json({
    resource: await deleteLibraryFile(
      c.get('user')!.institution.id,
      actor(c),
      c.req.param('id'),
      c.req.param('fileId'),
    ),
  })
})

librarianRoutes.get('/librarian/resources/:id/download', ...librarianOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    download: await getLibraryDownload(user.institution.id, user.id, c.req.param('id'), c.req.query('fileId')),
  })
})

librarianRoutes.get('/librarian/collections', ...librarianOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ collections: await listLibraryCollections(user.institution.id, user.id) })
})

librarianRoutes.post('/librarian/collections', ...librarianOnly, async (c) => {
  const parsed = createLibraryCollectionRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  return c.json(
    { collection: await createLibraryCollection(c.get('user')!.institution.id, actor(c), parsed.data) },
    201,
  )
})

librarianRoutes.get('/librarian/collections/:id', ...librarianOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ collection: await getLibraryCollection(user.institution.id, user.id, c.req.param('id')) })
})

librarianRoutes.patch('/librarian/collections/:id', ...librarianOnly, async (c) => {
  const parsed = updateLibraryCollectionRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  return c.json({
    collection: await updateLibraryCollection(
      c.get('user')!.institution.id,
      actor(c),
      c.req.param('id'),
      parsed.data,
    ),
  })
})

librarianRoutes.delete('/librarian/collections/:id', ...librarianOnly, async (c) => {
  await deleteLibraryCollection(c.get('user')!.institution.id, actor(c), c.req.param('id'))
  return c.body(null, 204)
})

librarianRoutes.post('/librarian/collections/:id/items', ...librarianOnly, async (c) => {
  const parsed = addCollectionItemRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  return c.json({
    collection: await addCollectionItem(
      c.get('user')!.institution.id,
      actor(c),
      c.req.param('id'),
      parsed.data.resourceId,
    ),
  })
})

librarianRoutes.delete('/librarian/collections/:id/items/:resourceId', ...librarianOnly, async (c) => {
  return c.json({
    collection: await removeCollectionItem(
      c.get('user')!.institution.id,
      actor(c),
      c.req.param('id'),
      c.req.param('resourceId'),
    ),
  })
})

librarianRoutes.get('/librarian/requests', ...librarianOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ requests: await listLibraryRequests(user.institution.id, user.id) })
})

librarianRoutes.post('/librarian/requests/:id/fulfil', ...librarianOnly, async (c) => {
  const parsed = fulfilLibraryRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  return c.json({
    requests: await fulfilLibraryRequest(c.get('user')!.institution.id, actor(c), c.req.param('id'), parsed.data),
  })
})

librarianRoutes.post('/librarian/requests/:id/decline', ...librarianOnly, async (c) => {
  const parsed = declineLibraryRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  return c.json({
    requests: await declineLibraryRequest(c.get('user')!.institution.id, actor(c), c.req.param('id'), parsed.data),
  })
})
