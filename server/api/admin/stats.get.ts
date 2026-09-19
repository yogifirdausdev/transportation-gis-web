import { db } from '../../utils/db'
import { requireUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireUser(event, ['admin','gis_manager','gis_editor'])
  const [summary, recent] = await Promise.all([
    db.query(`SELECT count(*)::int total,
      count(*) FILTER (WHERE condition='good')::int good,
      count(*) FILTER (WHERE condition='bad')::int bad,
      count(*) FILTER (WHERE condition='unassessed')::int unassessed,
      count(DISTINCT district)::int districts
      FROM locations`),
    db.query(`SELECT l.id,l.name,l.district,l.condition,l.created_at,c.name category_name
      FROM locations l JOIN categories c ON c.id=l.category_id ORDER BY l.created_at DESC LIMIT 8`)
  ])
  return { summary: summary.rows[0], recent: recent.rows }
})
