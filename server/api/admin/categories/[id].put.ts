import { z } from 'zod'
import { requireUser } from '../../../utils/auth'
import { q } from '../../../utils/db'
export default defineEventHandler(async (event) => {
  await requireUser(event, ['admin','manager'])
  const id = getRouterParam(event,'id')!
  const body = z.object({ name: z.string().min(2), color: z.string().regex(/^#[0-9A-Fa-f]{6}$/) }).parse(await readBody(event))
  const r = await q('UPDATE categories SET name=$1,color=$2,updated_at=now() WHERE id=$3 RETURNING id,name,color', [body.name.trim(), body.color, id])
  if (!r.rows[0]) throw createError({ statusCode:404 })
  return { category: r.rows[0] }
})
