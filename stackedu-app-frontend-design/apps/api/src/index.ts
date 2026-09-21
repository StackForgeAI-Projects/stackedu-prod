import { Hono } from 'hono'

// TODO: import and mount route files from ./routes/*
const app = new Hono()

app.get('/health', (c) => c.json({ status: 'ok', service: 'stackedu-api' }))

export default app
