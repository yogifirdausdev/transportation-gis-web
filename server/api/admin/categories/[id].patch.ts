import { z } from 'zod'
import { db } from '../../../utils/db'
import { requireUser } from '../../../utils/auth'

const schema = z.object({
  name: z.string().min(2).max(100),
  markerColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  icon: z.string().min(1).max(50).default('pin')
})

export default defineEventHandler(async (event) => {
  await requireUser(event, ['admin','gis_manager'])
  const id = getRouterParam(event, 'id')
  const input = schema.parse(await readBody(event))
  const result = await db.query(`UPDATE categories SET name=$1,marker_color=$2,icon=$3,updated_at=now() WHERE id=$4 RETURNING *`, [input.name,input.markerColor,input.icon,id])
  if (!result.rowCount) throw createError({ statusCode: 404, statusMessage: 'Category not found' })
  return { category: result.rows[0] }
})
