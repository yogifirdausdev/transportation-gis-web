import { requireUser } from '../../../utils/auth'
import { q } from '../../../utils/db'
export default defineEventHandler(async (event)=>{ await requireUser(event,['admin']); return { users:(await q('SELECT id,email,name,role,is_active,created_at FROM users ORDER BY created_at DESC')).rows } })
