import './config/load-dotenv'
import { serve } from '@hono/node-server'
import { createApp } from './app'
import { closeAllConnections, getInstitutionDb, getPlatformDb } from './db/connection'
import { migrateAllInstitutions, migratePlatform } from './db/migrate'
import { institutions } from './db/platform/schema'
import { processFeeDueReminders } from './lib/fee-due-reminders'
import { processTimetableReminders } from './services/timetable-reminders'

const { app, env, logger } = createApp()

async function runPendingMigrations(): Promise<void> {
  if (env.NODE_ENV !== 'production') return

  const platform = await migratePlatform(logger)
  if (!platform.succeeded) {
    logger.error('Refusing to start: platform migration failed', { error: platform.error })
    process.exit(1)
  }

  const outcomes = await migrateAllInstitutions({ logger })
  const failed = outcomes.find((outcome) => !outcome.succeeded)
  if (failed) {
    logger.error('Refusing to start: institution migration failed', {
      institution: failed.target,
      error: failed.error,
    })
    process.exit(1)
  }
}

async function runFeeDueReminders() {
  try {
    const platform = getPlatformDb()
    const rows = await platform.select({ id: institutions.id }).from(institutions)
    for (const row of rows) {
      const db = await getInstitutionDb(row.id)
      const sent = await processFeeDueReminders(db)
      if (sent > 0) logger.info('Fee due reminders sent', { institutionId: row.id, sent })
    }
  } catch (error) {
    logger.error('Fee due reminder job failed', { error })
  }
}

async function runTimetableReminders() {
  try {
    const platform = getPlatformDb()
    const rows = await platform.select({ id: institutions.id }).from(institutions)
    for (const row of rows) {
      const db = await getInstitutionDb(row.id)
      const sent = await processTimetableReminders(row.id, db)
      if (sent > 0) logger.info('Timetable reminders sent', { institutionId: row.id, sent })
    }
  } catch (error) {
    logger.error('Timetable reminder job failed', { error })
  }
}

async function start() {
  await runPendingMigrations()

  if (env.NODE_ENV !== 'test') {
    void runFeeDueReminders()
    void runTimetableReminders()
    setInterval(() => void runFeeDueReminders(), 60 * 60 * 1000).unref()
    setInterval(() => void runTimetableReminders(), 60 * 1000).unref()
  }

  const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
    logger.info('API listening', {
      port: info.port,
      environment: env.NODE_ENV,
      allowedOrigins: env.ALLOWED_ORIGINS,
    })
  })

  /**
   * Render sends SIGTERM before replacing a container. Finishing in-flight
   * requests and closing pools cleanly is what makes a deploy invisible to
   * someone who happens to be submitting a form at that moment.
   */
  let shuttingDown = false

  async function shutdown(signal: string) {
    if (shuttingDown) return
    shuttingDown = true
    logger.info('Shutting down', { signal })

    const forceExit = setTimeout(() => {
      logger.error('Shutdown timed out, exiting immediately')
      process.exit(1)
    }, 15_000)
    forceExit.unref()

    server.close(async () => {
      await closeAllConnections()
      clearTimeout(forceExit)
      logger.info('Shutdown complete')
      process.exit(0)
    })
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'))
  process.on('SIGINT', () => void shutdown('SIGINT'))
}

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { error: reason })
})

void start()
