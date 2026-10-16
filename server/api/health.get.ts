import { db, ensureSchema } from '../utils/db'

export default defineEventHandler(async () => {
  await ensureSchema()
  await db().query('SELECT 1')
  return { ok: true, service: 'transportation-gis', time: new Date().toISOString() }
})
