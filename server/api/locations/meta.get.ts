import { db } from '../../utils/db'

export default defineEventHandler(async () => {
  const [cats, districts, stats] = await Promise.all([
    db.query(`SELECT id, name, slug, marker_color FROM categories ORDER BY name`),
    db.query(`SELECT DISTINCT district FROM locations WHERE district IS NOT NULL AND district <> '' ORDER BY district`),
    db.query(`SELECT count(*)::int AS total,
      count(*) FILTER (WHERE condition='good')::int AS good,
      count(*) FILTER (WHERE condition='bad')::int AS bad,
      count(*) FILTER (WHERE condition='unassessed')::int AS unassessed
      FROM locations`)
  ])
  return {
    categories: cats.rows,
    districts: districts.rows.map(r => r.district),
    stats: stats.rows[0]
  }
})
