import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { bodyLimit } from 'hono/body-limit'
import { env as loadEnvOnce } from './config/env'
import { corsOrigin, expandOriginsForEnvironment } from './config/cors'
import { INSTITUTION_LOGO_UPLOAD_PATH, isPublicLogoPath } from './lib/branding'
import { createLogger } from './lib/logger'
import { errorHandler, notFoundHandler } from './middleware/error-handler'
import { requestContext, type RequestVariables } from './middleware/request-context'
import type { AuthVariables } from './middleware/auth'
import { bursarRoutes } from './routes/bursar'
import { accountRoutes } from './routes/account'
import { academicRoutes } from './routes/academic'
import { admissionRoutes } from './routes/admissions'
import { authRoutes } from './routes/auth'
import { healthRoutes } from './routes/health'
import { ictRoutes } from './routes/ict'
import { lecturerRoutes } from './routes/lecturer'
import { librarianRoutes } from './routes/librarian'
import { studentRoutes } from './routes/student'
import { publicRoutes } from './routes/public'

export type AppEnv = { Variables: RequestVariables & Partial<AuthVariables> }

export function createApp() {
  const env = expandOriginsForEnvironment(loadEnvOnce())
  const logger = createLogger(env.LOG_LEVEL, { service: 'stackedu-api' })

  const app = new Hono<AppEnv>()

  app.use('*', requestContext(logger))

  /**
   * The default resource policy is same-origin, which tells the browser to
   * refuse the response to any other origin — including the web app loading
   * the institution logo into an `<img>`. The logo is public branding, so it
   * is the one response that opts out.
   */
  const protectiveHeaders = secureHeaders()
  const embeddableHeaders = secureHeaders({ crossOriginResourcePolicy: 'cross-origin' })
  app.use('*', (c, next) =>
    isPublicLogoPath(c.req.path) ? embeddableHeaders(c, next) : protectiveHeaders(c, next),
  )

  app.use(
    '*',
    cors({
      origin: corsOrigin(env),
      // The session cookie must travel with every request, which is why the
      // allowlist above can never fall back to a wildcard.
      credentials: true,
      allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'idempotency-key'],
      exposeHeaders: ['x-request-id'],
      maxAge: 86_400,
    }),
  )

  /**
   * Files never pass through the API — they go straight to Cloudflare R2 using
   * a signed link — so any large body reaching here is a mistake or an attack.
   * The institution logo is the one exception: it is small enough to post
   * directly, and the route applies its own limit.
   */
  const generalBodyLimit = bodyLimit({ maxSize: 1024 * 1024 })
  app.use('*', (c, next) =>
    c.req.path === INSTITUTION_LOGO_UPLOAD_PATH ? next() : generalBodyLimit(c, next),
  )

  app.route('/', healthRoutes)
  app.route('/', publicRoutes)
  app.route('/', authRoutes)
  app.route('/', admissionRoutes)
  app.route('/', studentRoutes)
  app.route('/', lecturerRoutes)
  app.route('/', librarianRoutes)
  app.route('/', ictRoutes)
  app.route('/', academicRoutes)
  app.route('/', bursarRoutes)
  app.route('/', accountRoutes)

  app.notFound(notFoundHandler)
  app.onError(errorHandler)

  return { app, env, logger }
}
