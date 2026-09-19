import { db } from '../utils/db'

export default defineEventHandler(async () => {
  const result = await db.query(`SELECT id, name, slug, marker_color, icon FROM categories ORDER BY name`)
  return { categories: result.rows }
})
