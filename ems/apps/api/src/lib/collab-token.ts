import { createHmac, timingSafeEqual } from 'node:crypto'
import { env } from '../config/env'
import { unauthenticated } from './errors'

export interface CollabTokenClaims {
  institutionId: string
  sessionId: string
  userId: string
  name: string
  role: 'host' | 'participant'
}

function collabSecret(): string {
  const configured = env().COLLAB_SECRET
  if (configured) return configured
  if (env().NODE_ENV === 'production') {
    throw unauthenticated('Whiteboard sync is not configured.')
  }
  return 'stackedu-local-collab-secret'
}

export function collabConfigured(): boolean {
  return Boolean(env().HOCUSPOCUS_URL)
}

export function signCollabToken(claims: CollabTokenClaims): string {
  const body = Buffer.from(JSON.stringify({ ...claims, exp: Date.now() + 2 * 60 * 60 * 1000 })).toString('base64url')
  const sig = createHmac('sha256', collabSecret()).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function verifyCollabToken(token: string): CollabTokenClaims {
  const [body, sig] = token.split('.')
  if (!body || !sig) throw unauthenticated('That whiteboard link is not valid.')
  const expected = createHmac('sha256', collabSecret()).update(body).digest('base64url')
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw unauthenticated('That whiteboard link is not valid.')
  }
  const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as CollabTokenClaims & { exp?: number }
  if (parsed.exp && parsed.exp < Date.now()) throw unauthenticated('That whiteboard link has expired.')
  if (!parsed.institutionId || !parsed.sessionId || !parsed.userId) {
    throw unauthenticated('That whiteboard link is not valid.')
  }
  return parsed
}
