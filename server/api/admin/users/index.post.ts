import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { db } from '../../../utils/db'
import { requireUser } from '../../../utils/auth'

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(200),
  role: z.enum(['admin','gis_manager','gis_editor'])
})

export default defineEventHandler(async (event) => {
  await requireUser(event, ['admin'])
  const input = schema.parse(await readBody(event))
  const hash = await bcrypt.hash(input.password, 12)
  try {
    const result = await db.query(`INSERT INTO users(name,email,password_hash,role) VALUES($1,lower($2),$3,$4) RETURNING id,name,email,role,created_at`, [input.name,input.email,hash,input.role])
    return { user: result.rows[0] }
  } catch (error: any) {
    if (error?.code === '23505') throw createError({ statusCode: 409, statusMessage: 'Email sudah digunakan' })
    throw error
  }
})
