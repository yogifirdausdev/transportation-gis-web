import { z } from 'zod'
import { requireUser } from '../../../utils/auth'
import { q } from '../../../utils/db'

const iconKeys = ['map-pin','speed-bump','camera','traffic-cone','signpost','lightbulb','bus-front','construction','triangle-alert'] as const

export default defineEventHandler(async (event) => {
  await requireUser(event, ['admin','manager'])
  const id = getRouterParam(event,'id')!
  const body = z.object({
    name: z.string().min(2),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    icon_key: z.enum(iconKeys).default('map-pin')
  }).parse(await readBody(event))
  const r = await q(
    'UPDATE categories SET name=$1,color=$2,icon_key=$3,updated_at=now() WHERE id=$4 RETURNING id,name,color,icon_key',
    [body.name.trim(), body.color, body.icon_key, id]
  )
  if (!r.rows[0]) throw createError({ statusCode:404 })
  return { category: r.rows[0] }
})
