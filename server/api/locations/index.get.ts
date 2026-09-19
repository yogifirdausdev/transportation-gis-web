import { db } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const values: any[] = []
  const where: string[] = []
  const add = (value: any) => { values.push(value); return `$${values.length}` }

  if (q.bbox) {
    const parts = String(q.bbox).split(',').map(Number)
    if (parts.length === 4 && parts.every(Number.isFinite)) {
      const [west, south, east, north] = parts
      const p1 = add(west), p2 = add(south), p3 = add(east), p4 = add(north)
      where.push(`l.geom && ST_MakeEnvelope(${p1}, ${p2}, ${p3}, ${p4}, 4326)`)
    }
  }
  if (q.category && q.category !== 'all') where.push(`c.slug = ${add(String(q.category))}`)
  if (q.condition && q.condition !== 'all') where.push(`l.condition = ${add(String(q.condition))}`)
  if (q.district && q.district !== 'all') where.push(`l.district = ${add(String(q.district))}`)
  if (q.search) {
    const p = add(`%${String(q.search)}%`)
    where.push(`(l.name ILIKE ${p} OR coalesce(l.address,'') ILIKE ${p} OR coalesce(l.district,'') ILIKE ${p})`)
  }

  const limit = Math.min(Math.max(Number(q.limit || 3000), 1), 5000)
  const result = await db.query(`
    SELECT l.id, l.name, l.district, l.address, l.condition,
           l.latitude, l.longitude, l.details, l.before_photo_url, l.after_photo_url,
           c.name AS category_name, c.slug AS category_slug, c.marker_color
    FROM locations l
    JOIN categories c ON c.id = l.category_id
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY l.created_at DESC
    LIMIT ${limit}
  `, values)

  return { locations: result.rows }
})
