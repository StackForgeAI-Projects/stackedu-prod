import { z } from 'zod'

/**
 * Environment is validated once, at start-up.
 *
 * A missing or malformed variable stops the process immediately with a readable
 * message. The alternative — discovering it when the first request arrives —
 * turns a deployment mistake into an outage.
 */

const commaSeparated = z
  .string()
  .transform((value) =>
    value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean),
  )

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65_535).default(8080),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

    /** Connection to the small shared platform database. */
    PLATFORM_DATABASE_URL: z.string().url(),

    /**
     * Connection used only to CREATE DATABASE when provisioning an institution.
     * Defaults to the platform connection, which is correct when every database
     * lives on the same server.
     */
    ADMIN_DATABASE_URL: z.string().url().optional(),

    /**
     * Browser origins allowed to call this API. The web app is served from a
     * different host to the API, so this list is what makes login work at all.
     */
    ALLOWED_ORIGINS: commaSeparated.default(
      'https://app.stackedu.rw,https://app.stackedu.africa,http://localhost:3000',
    ),

    /**
     * Parent domain for the session cookie. A leading dot shares the cookie
     * between app.stackedu.rw and api.stackedu.rw, which is what allows a
     * cross-host login to work without third-party cookies.
     */
    COOKIE_DOMAIN: z.string().optional(),

    /** Maximum idle time before an institution's connection pool is closed. */
    DB_POOL_IDLE_TIMEOUT_SECONDS: z.coerce.number().int().min(10).default(300),
    /** Connections held per institution. Kept low because there are many pools. */
    DB_POOL_MAX_CONNECTIONS: z.coerce.number().int().min(1).default(5),

    /** Surfaced on the health endpoint to confirm which build is running. */
    APP_VERSION: z.string().default('0.1.0'),

    /**
     * Where application files live. `local` writes under STORAGE_LOCAL_ROOT
     * (development). `r2` uses Cloudflare R2 via the S3 API (production).
     */
    STORAGE_DRIVER: z.enum(['local', 'r2']).default('local'),
    STORAGE_LOCAL_ROOT: z.string().default('.data/uploads'),
    /**
     * Signs short-lived local upload tokens. Required in production when using
     * the local driver; for R2 the bucket credentials are enough.
     */
    STORAGE_SIGNING_SECRET: z.string().min(16).optional(),

    R2_ACCOUNT_ID: z.string().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_BUCKET: z.string().optional(),
    /** Public API origin used to build local upload URLs. */
    API_PUBLIC_URL: z.string().url().default('http://localhost:8080'),

    /** Application fee in whole Rwandan Francs. */
    APPLICATION_FEE_RWF: z.coerce.number().int().positive().default(10_000),
    /**
     * `sandbox` completes every payment method on first initiate (no gateway).
     * `live` records Pending and waits for a gateway webhook / staff confirm.
     */
    PAYMENT_MODE: z.enum(['sandbox', 'live']).default('sandbox'),

    /** Live card payments — Flutterwave (https://developer.flutterwave.com/docs/getting-started) */
    FLUTTERWAVE_SECRET_KEY: z.string().min(1).optional(),
    FLUTTERWAVE_PUBLIC_KEY: z.string().min(1).optional(),

    /** Live mobile money — PawaPay (https://docs.pawapay.io/v2/docs/welcome) */
    PAWAPAY_API_TOKEN: z.string().min(1).optional(),

    /** SMS — Twilio (https://www.twilio.com/docs/messaging/api) */
    TWILIO_ACCOUNT_SID: z.string().min(1).optional(),
    TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
    TWILIO_FROM_NUMBER: z.string().min(1).optional(),

    /**
     * Transactional email (admissions submit + decision). Optional — when unset,
     * notifications are skipped and the API still succeeds.
     */
    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.string().min(3).optional(),
    EMAIL_REPLY_TO: z.string().email().optional(),
    /** Public web app origin for Track links in emails. */
    WEB_APP_URL: z.string().url().default('https://app.stackedu.rw'),
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV === 'production' && !value.COOKIE_DOMAIN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['COOKIE_DOMAIN'],
        message: 'COOKIE_DOMAIN is required in production so the session cookie is shared with the web app',
      })
    }
    if (value.NODE_ENV === 'production') {
      const insecure = value.ALLOWED_ORIGINS.filter((origin) => origin.startsWith('http://'))
      if (insecure.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['ALLOWED_ORIGINS'],
          message: `Refusing to allow plain-http origins in production: ${insecure.join(', ')}`,
        })
      }
    }
    if (value.STORAGE_DRIVER === 'r2') {
      for (const key of [
        'R2_ACCOUNT_ID',
        'R2_ACCESS_KEY_ID',
        'R2_SECRET_ACCESS_KEY',
        'R2_BUCKET',
      ] as const) {
        if (!value[key]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: `${key} is required when STORAGE_DRIVER=r2`,
          })
        }
      }
    }
    if (
      value.STORAGE_DRIVER === 'local' &&
      value.NODE_ENV === 'production' &&
      !value.STORAGE_SIGNING_SECRET
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['STORAGE_SIGNING_SECRET'],
        message: 'STORAGE_SIGNING_SECRET is required for local uploads in production',
      })
    }
  })

export type Env = z.infer<typeof envSchema>

let cached: Env | undefined

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source)

  if (!parsed.success) {
    const problems = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n')
    throw new Error(`Invalid environment configuration:\n${problems}`)
  }

  return parsed.data
}

/** Validated environment, parsed on first use and reused thereafter. */
export function env(): Env {
  cached ??= loadEnv()
  return cached
}

/** Test helper — clears the memoised value so a new environment can be loaded. */
export function resetEnvCache(): void {
  cached = undefined
}
