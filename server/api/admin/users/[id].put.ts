import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { requireUser } from '../../../utils/auth'
import { q } from '../../../utils/db'
import { parseInput, rethrowUnique } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const current = await requireUser(event, ['admin'])
  const id = getRouterParam(event, 'id')!
  const body = parseInput(z.object({
    name: z.string().trim().min(2),
    email: z.string().trim().email(),
    role: z.enum(['admin', 'manager', 'editor']),
    is_active: z.boolean(),
    password: z.string().min(8).optional()
  }), await readBody(event))
  if (current.id === id && !body.is_active) throw createError({ statusCode: 400, statusMessage: 'Anda tidak dapat menonaktifkan akun sendiri' })
  const params: any[] = [body.name, body.email.toLowerCase(), body.role, body.is_active, id]
  let sql = 'UPDATE users SET name=$1,email=$2,role=$3,is_active=$4 WHERE id=$5'
  if (body.password) {
    params.push(await bcrypt.hash(body.password, 12))
    sql = 'UPDATE users SET name=$1,email=$2,role=$3,is_active=$4,password_hash=$6 WHERE id=$5'
  }
  await q(sql, params).catch(err => rethrowUnique(err, 'Email sudah digunakan oleh user lain'))
  return { ok: true }
})
