import { requireUser } from '../../utils/auth'
import { q } from '../../utils/db'
export default defineEventHandler(async (event) => {
  await requireUser(event)
  const [loc,dist,batch,cat] = await Promise.all([
    q('SELECT count(*)::int count FROM locations WHERE deleted_at IS NULL'),
    q('SELECT count(DISTINCT district_id)::int count FROM locations WHERE deleted_at IS NULL'),
    q('SELECT count(*)::int count FROM import_batches'),
    q('SELECT count(*)::int count FROM categories')
  ])
  return { locations:Number(loc.rows[0].count), districts:Number(dist.rows[0].count), imports:Number(batch.rows[0].count), categories:Number(cat.rows[0].count) }
})
