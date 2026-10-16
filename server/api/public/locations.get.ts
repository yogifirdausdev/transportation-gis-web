import { q } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const west = Number(query.west ?? 106.65), south = Number(query.south ?? -6.4), east = Number(query.east ?? 107.05), north = Number(query.north ?? -5.95)
  const params: any[] = [west,south,east,north]
  const where = ['l.deleted_at IS NULL', 'l.district_id IS NOT NULL', 'ST_Intersects(l.geom, ST_MakeEnvelope($1,$2,$3,$4,4326))']
  if (query.category) { params.push(String(query.category)); where.push(`l.category_id=$${params.length}`) }
  if (query.district) { params.push(String(query.district)); where.push(`l.district_id=$${params.length}`) }
  if (query.year) { params.push(Number(query.year)); where.push(`l.fiscal_year=$${params.length}`) }
  if (query.search) { params.push(`%${String(query.search)}%`); where.push(`l.location_name ILIKE $${params.length}`) }

  const result = await q(`
    SELECT l.id,l.latitude,l.longitude,l.photo_path,l.fiscal_year,
           c.name category,c.color category_color,COALESCE(d.name,l.district_raw) district
    FROM locations l
    JOIN categories c ON c.id=l.category_id
    LEFT JOIN districts d ON d.id=l.district_id
    WHERE ${where.join(' AND ')}
    ORDER BY l.id
    LIMIT 5000
  `, params)
  return { locations: result.rows }
})
