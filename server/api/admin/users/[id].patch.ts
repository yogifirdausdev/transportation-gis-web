import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { db } from '../../../utils/db'
import { requireUser } from '../../../utils/auth'

const schema = z.object({
  name: z.string().min(2).max(100),
  role: z.enum(['admin','gis_manager','gis_editor']),
  password: z.string().min(8).max(200).optional().or(z.literal(''))
})

export default defineEventHandler(async (event) => {
  const current = await requireUser(event, ['admin'])
  const id = getRouterParam(event, 'id')
  const input = schema.parse(await readBody(event))
  if (id === current.id && input.role !== 'admin') {
    throw createError({ statusCode: 400, statusMessage: 'Tidak bisa menurunkan role akun yang sedang digunakan' })
  }
  const hash = input.password ? await bcrypt.hash(input.password, 12) : null
  const result = await db.query(`UPDATE users SET name=$1,role=$2,password_hash=COALESCE($3,password_hash),updated_at=now() WHERE id=$4 RETURNING id,name,email,role,created_at`, [input.name,input.role,hash,id])
  if (!result.rowCount) throw createError({ statusCode: 404, statusMessage: 'User not found' })
  return { user: result.rows[0] }
})
