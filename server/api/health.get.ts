import { db } from '../utils/db'

export default defineEventHandler(async () => {
  await db.query('SELECT 1')
  return { ok: true, service: 'transportation-gis' }
})
