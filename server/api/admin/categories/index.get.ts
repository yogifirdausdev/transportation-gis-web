import { requireUser } from '../../../utils/auth'
import { q } from '../../../utils/db'
export default defineEventHandler(async (event) => { await requireUser(event); return { categories: (await q('SELECT id,name,color,created_at,updated_at FROM categories ORDER BY name')).rows } })
