import type { Hono, MiddlewareHandler } from 'hono'
import { createLibraryRequestSchema } from '@stackedu/shared'
import { validationFailed } from '../lib/errors'
import type { AuthVariables } from '../middleware/auth'
import type { RequestVariables } from '../middleware/request-context'
import {
  createReaderLibraryRequest,
  getLibraryDownload,
  listMyLibraryRequests,
  listReadableLibrary,
} from '../services/library'

type LibraryReaderApp = Hono<{ Variables: RequestVariables & Partial<AuthVariables> }>

function fieldErrors(error: { flatten: () => { fieldErrors: unknown } }): Record<string, string[]> {
  return error.flatten().fieldErrors as Record<string, string[]>
}

/**
 * Student, lecturer, and academic admin share the same catalogue, download,
 * and request cycle. Each portal still authenticates as its own role.
 */
export function registerLibraryReaderRoutes(
  app: LibraryReaderApp,
  prefix: '/student' | '/lecturer' | '/academic',
  guards: readonly MiddlewareHandler[],
) {
  app.get(`${prefix}/library`, ...guards, async (c) => {
    const user = c.get('user')!
    return c.json({ resources: await listReadableLibrary(user.institution.id, user.id, c.req.query('q')) })
  })

  app.get(`${prefix}/library/requests`, ...guards, async (c) => {
    const user = c.get('user')!
    return c.json({ requests: await listMyLibraryRequests(user.institution.id, user.id) })
  })

  app.post(`${prefix}/library/requests`, ...guards, async (c) => {
    const parsed = createLibraryRequestSchema.safeParse(await c.req.json().catch(() => ({})))
    if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
    const user = c.get('user')!
    return c.json(
      { requests: await createReaderLibraryRequest(user.institution.id, user.id, parsed.data) },
      201,
    )
  })

  app.get(`${prefix}/library/:id/download`, ...guards, async (c) => {
    const user = c.get('user')!
    return c.json({
      download: await getLibraryDownload(user.institution.id, user.id, c.req.param('id'), c.req.query('fileId')),
    })
  })
}
