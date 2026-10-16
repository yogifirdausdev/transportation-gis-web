import { requireUser } from '../../../utils/auth'
import { q } from '../../../utils/db'
export default defineEventHandler(async (event) => { await requireUser(event); return { districts: (await q('SELECT id,name FROM districts ORDER BY name')).rows } })
