import './config/load-dotenv'
import { Server } from '@hocuspocus/server'
import * as Y from 'yjs'
import { env } from './config/env'
import { createLogger } from './lib/logger'
import { verifyCollabToken } from './lib/collab-token'
import { loadWhiteboardBytes, storeWhiteboardBytes } from './services/live-sessions'

const logger = createLogger(env().LOG_LEVEL, { service: 'stackedu-collab' })

function parseDocumentName(name: string): { institutionId: string; sessionId: string } | null {
  const [institutionId, sessionId] = name.split(':')
  if (!institutionId || !sessionId) return null
  return { institutionId, sessionId }
}

const port = Number(process.env.PORT) || env().COLLAB_PORT

const server = new Server({
  port,
  async onRequest({ request, response }) {
    const path = new URL(request.url ?? '/', 'http://localhost').pathname
    if (request.method === 'GET' && (path === '/' || path === '/health')) {
      response.writeHead(200, { 'Content-Type': 'text/plain' })
      response.end('ok')
    }
  },
  async onAuthenticate({ token, documentName }) {
    const claims = verifyCollabToken(token)
    const parsed = parseDocumentName(documentName)
    if (!parsed || parsed.sessionId !== claims.sessionId || parsed.institutionId !== claims.institutionId) {
      throw new Error('That whiteboard does not match this class.')
    }
    return { user: claims }
  },
  async onLoadDocument({ documentName, document }) {
    const parsed = parseDocumentName(documentName)
    if (!parsed) return document
    const bytes = await loadWhiteboardBytes(parsed.institutionId, parsed.sessionId)
    if (bytes && bytes.byteLength > 0) {
      try {
        Y.applyUpdate(document, new Uint8Array(bytes))
      } catch {
        // A JSON scene from the REST fallback is not a Yjs update; start empty.
      }
    }
    return document
  },
  async onStoreDocument({ documentName, document }) {
    const parsed = parseDocumentName(documentName)
    if (!parsed) return
    const update = Y.encodeStateAsUpdate(document)
    await storeWhiteboardBytes(parsed.institutionId, parsed.sessionId, Buffer.from(update))
  },
})

void server.listen().then(() => {
  logger.info('Collab listening', { port })
})
