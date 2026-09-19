import { db } from '../../../utils/db'
import { requireUser } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireUser(event, ['admin','gis_manager'])
  const id = getRouterParam(event, 'id')
  const result = await db.query('DELETE FROM locations WHERE id=$1 RETURNING id', [id])
  if (!result.rowCount) throw createError({ statusCode: 404, statusMessage: 'Location not found' })
  return { ok: true }
})
