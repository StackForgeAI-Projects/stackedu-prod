import type { Env } from './env'

/**
 * The web app is served from app.stackedu.rw and app.stackedu.africa while the
 * API answers on api.stackedu.rw. That is a cross-origin setup, so this
 * allowlist is what makes the whole thing work — and the one place a mistake
 * would either break login or open the API to any website.
 */
export function isOriginAllowed(origin: string, env: Env): boolean {
  if (!env.ALLOWED_ORIGINS.includes(origin)) return false

  // Credentials are sent with every request, so a wildcard is never acceptable.
  return origin !== '*'
}

export function corsOrigin(env: Env) {
  return (origin: string): string | undefined =>
    isOriginAllowed(origin, env) ? origin : undefined
}

/**
 * Vercel gives every preview deployment its own hostname, which cannot be
 * listed ahead of time. Outside production we therefore also accept Vercel
 * preview URLs and localhost so a preview build can talk to a preview API.
 */
export function expandOriginsForEnvironment(env: Env): Env {
  if (env.NODE_ENV === 'production') return env

  const extras = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
  ]
  const merged = new Set([...env.ALLOWED_ORIGINS, ...extras])
  return { ...env, ALLOWED_ORIGINS: [...merged] }
}
