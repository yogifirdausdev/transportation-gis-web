import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { requireUser } from '../../../utils/auth'
import { q } from '../../../utils/db'
import { parseInput, rethrowUnique } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  await requireUser(event, ['admin'])
  const body = parseInput(z.object({
    name: z.string().trim().min(2),
    email: z.string().trim().email(),
    password: z.string().min(8),
    role: z.enum(['admin', 'manager', 'editor'])
  }), await readBody(event))
  const hash = await bcrypt.hash(body.password, 12)
  const r = await q(
    'INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id,name,email,role,is_active',
    [body.name, body.email.toLowerCase(), hash, body.role]
  ).catch(err => rethrowUnique(err, 'Email sudah digunakan oleh user lain'))
  return { user: r.rows[0] }
})
