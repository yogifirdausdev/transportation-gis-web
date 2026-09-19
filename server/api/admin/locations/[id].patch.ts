import { z } from 'zod'
import { db } from '../../../utils/db'
import { requireUser } from '../../../utils/auth'

const schema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(2).max(500),
  district: z.string().max(255).nullable().optional(),
  address: z.string().max(1000).nullable().optional(),
  condition: z.enum(['good','bad','unassessed']),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  details: z.record(z.string(), z.any()).default({})
})

export default defineEventHandler(async (event) => {
  const user = await requireUser(event, ['admin','gis_manager','gis_editor'])
  const id = getRouterParam(event, 'id')
  const input = schema.parse(await readBody(event))
  const result = await db.query(`
    UPDATE locations SET category_id=$1,name=$2,district=$3,address=$4,condition=$5,
      latitude=$6,longitude=$7,geom=ST_SetSRID(ST_MakePoint($7,$6),4326),details=$8::jsonb,
      updated_by=$9,updated_at=now()
    WHERE id=$10 RETURNING *
  `, [input.categoryId,input.name,input.district || null,input.address || null,input.condition,input.latitude,input.longitude,JSON.stringify(input.details),user.id,id])
  if (!result.rowCount) throw createError({ statusCode: 404, statusMessage: 'Location not found' })
  return { location: result.rows[0] }
})
