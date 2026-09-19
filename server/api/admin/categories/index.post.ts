import { z } from 'zod'
import { db } from '../../../utils/db'
import { requireUser } from '../../../utils/auth'

const schema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  markerColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  icon: z.string().min(1).max(50).default('pin')
})

export default defineEventHandler(async (event) => {
  await requireUser(event, ['admin','gis_manager'])
  const input = schema.parse(await readBody(event))
  try {
    const result = await db.query(`INSERT INTO categories(name,slug,marker_color,icon) VALUES($1,$2,$3,$4) RETURNING *`, [input.name,input.slug,input.markerColor,input.icon])
    return { category: result.rows[0] }
  } catch (error: any) {
    if (error?.code === '23505') throw createError({ statusCode: 409, statusMessage: 'Slug category sudah digunakan' })
    throw error
  }
})
