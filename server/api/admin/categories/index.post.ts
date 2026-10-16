import { z } from 'zod'
import { requireUser } from '../../../utils/auth'
import { q } from '../../../utils/db'
export default defineEventHandler(async (event) => {
  await requireUser(event, ['admin','manager'])
  const body = z.object({ name: z.string().min(2), color: z.string().regex(/^#[0-9A-Fa-f]{6}$/) }).parse(await readBody(event))
  const r = await q('INSERT INTO categories(name,color) VALUES($1,$2) RETURNING id,name,color', [body.name.trim(), body.color])
  return { category: r.rows[0] }
})
