import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { db } from '../../utils/db'
import { createSession } from '../../utils/auth'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

export default defineEventHandler(async (event) => {
  const input = schema.parse(await readBody(event))
  const result = await db.query(
    'SELECT id, name, email, role, password_hash FROM users WHERE lower(email) = lower($1) LIMIT 1',
    [input.email]
  )
  const user = result.rows[0]
  if (!user || !(await bcrypt.compare(input.password, user.password_hash))) {
    throw createError({ statusCode: 401, statusMessage: 'Email atau password salah' })
  }

  const sessionUser = { id: user.id, name: user.name, email: user.email, role: user.role }
  await createSession(event, sessionUser)
  return { user: sessionUser }
})
