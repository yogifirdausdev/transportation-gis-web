import { z } from 'zod'
import { db } from '../../../utils/db'
import { requireUser } from '../../../utils/auth'

const schema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(2).max(500),
  district: z.string().max(255).nullable().optional(),
  address: z.string().max(1000).nullable().optional(),
  condition: z.enum(['good','bad','unassessed']).default('unassessed'),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  details: z.record(z.string(), z.any()).default({})
})

export default defineEventHandler(async (event) => {
  const user = await requireUser(event, ['admin','gis_manager','gis_editor'])
  const input = schema.parse(await readBody(event))
  const result = await db.query(`
    INSERT INTO locations (
      category_id,name,district,address,condition,latitude,longitude,geom,details,created_by,updated_by
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,ST_SetSRID(ST_MakePoint($7,$6),4326),$8::jsonb,$9,$9)
    RETURNING *
  `, [input.categoryId,input.name,input.district || null,input.address || null,input.condition,input.latitude,input.longitude,JSON.stringify(input.details),user.id])
  return { location: result.rows[0] }
})
