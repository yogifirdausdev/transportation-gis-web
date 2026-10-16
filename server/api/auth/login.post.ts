import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { q } from '../../utils/db'
import { createSession } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(await readBody(event))
  const result = await q('SELECT id,email,name,role,password_hash FROM users WHERE lower(email)=lower($1) AND is_active=true LIMIT 1', [body.email])
  const user = result.rows[0] as any
  if (!user || !(await bcrypt.compare(body.password, user.password_hash))) throw createError({ statusCode: 401, statusMessage: 'Email atau password salah' })
  await createSession(event, user.id)
  return { user: { id: user.id, email: user.email, name: user.name, role: user.role } }
})
