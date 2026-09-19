import { db } from '../../../utils/db'
import { requireUser } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireUser(event, ['admin'])
  const result = await db.query(`SELECT id,name,email,role,created_at FROM users ORDER BY created_at DESC`)
  return { users: result.rows }
})
