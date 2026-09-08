import './config/load-dotenv'
import { serve } from '@hono/node-server'
import { createApp } from './app'
import { closeAllConnections, getInstitutionDb, getPlatformDb } from './db/connection'
import { institutions } from './db/platform/schema'
import { processFeeDueReminders } from './lib/fee-due-reminders'

const { app, env, logger } = createApp()

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

if (env.NODE_ENV !== 'test') {
  void runFeeDueReminders()
  setInterval(() => void runFeeDueReminders(), 60 * 60 * 1000).unref()
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

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { error: reason })
})
