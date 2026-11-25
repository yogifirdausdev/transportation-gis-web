import { z } from 'zod'
import { requireUser } from '../../../utils/auth'
import { q } from '../../../utils/db'

const iconKeys = ['map-pin','speed-bump','camera','traffic-cone','signpost','lightbulb','bus-front','construction','triangle-alert'] as const

export default defineEventHandler(async (event) => {
  await requireUser(event, ['admin','manager'])
  const body = z.object({
    name: z.string().min(2),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    icon_key: z.enum(iconKeys).default('map-pin')
  }).parse(await readBody(event))
  const r = await q(
    'INSERT INTO categories(name,color,icon_key) VALUES($1,$2,$3) RETURNING id,name,color,icon_key',
    [body.name.trim(), body.color, body.icon_key]
  )
  return { category: r.rows[0] }
})
