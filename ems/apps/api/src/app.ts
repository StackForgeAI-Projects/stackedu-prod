import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { bodyLimit } from 'hono/body-limit'
import { env as loadEnvOnce } from './config/env'
import { corsOrigin, expandOriginsForEnvironment } from './config/cors'
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
import { studentRoutes } from './routes/student'
import { publicRoutes } from './routes/public'

export type AppEnv = { Variables: RequestVariables & Partial<AuthVariables> }

export function createApp() {
  const env = expandOriginsForEnvironment(loadEnvOnce())
  const logger = createLogger(env.LOG_LEVEL, { service: 'stackedu-api' })

  const app = new Hono<AppEnv>()

  app.use('*', requestContext(logger))
  app.use('*', secureHeaders())

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
   */
  app.use('*', bodyLimit({ maxSize: 1024 * 1024 }))

  app.route('/', healthRoutes)
  app.route('/', publicRoutes)
  app.route('/', authRoutes)
  app.route('/', admissionRoutes)
  app.route('/', studentRoutes)
  app.route('/', lecturerRoutes)
  app.route('/', ictRoutes)
  app.route('/', academicRoutes)
  app.route('/', bursarRoutes)
  app.route('/', accountRoutes)

  app.notFound(notFoundHandler)
  app.onError(errorHandler)

  return { app, env, logger }
}
