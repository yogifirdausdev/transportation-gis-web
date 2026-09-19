import { db } from '../../../utils/db'
import { requireUser } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireUser(event, ['admin','gis_manager','gis_editor'])
  const result = await db.query('SELECT id,name,slug,marker_color,icon,created_at FROM categories ORDER BY name')
  return { categories: result.rows }
})
