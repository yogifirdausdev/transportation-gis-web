import { q } from '../../utils/db'
import { getSessionUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  const user = await getSessionUser(event)
  const query = getQuery(event)
  const west = Number(query.west ?? 106.65)
  const south = Number(query.south ?? -6.4)
  const east = Number(query.east ?? 107.05)
  const north = Number(query.north ?? -5.95)
  const params: any[] = [west,south,east,north]
  const where = [
    'l.deleted_at IS NULL',
    'l.district_id IS NOT NULL',
    'ST_Intersects(l.geom, ST_MakeEnvelope($1,$2,$3,$4,4326))'
  ]
  if (query.category) { params.push(String(query.category)); where.push(`l.category_id=$${params.length}`) }
  if (query.district) { params.push(String(query.district)); where.push(`l.district_id=$${params.length}`) }
  if (user && query.year) { params.push(Number(query.year)); where.push(`l.fiscal_year=$${params.length}`) }
  if (query.status) { params.push(String(query.status)); where.push(`l.implementation_status=$${params.length}`) }
  if (query.search) { params.push(`%${String(query.search)}%`); where.push(`l.location_name ILIKE $${params.length}`) }

  const fiscalYearSelect = user ? 'l.fiscal_year' : 'NULL::integer AS fiscal_year'
  const result = await q(`
    SELECT l.id,l.location_name,l.latitude,l.longitude,l.photo_path,${fiscalYearSelect},l.implementation_status,
           c.name category,c.color category_color,c.icon_key category_icon_key,
           COALESCE(d.name,l.district_raw) district
    FROM locations l
    JOIN categories c ON c.id=l.category_id
    LEFT JOIN districts d ON d.id=l.district_id
    WHERE ${where.join(' AND ')}
    ORDER BY l.id
    LIMIT 5000
  `, params)
  return {
    authenticated: Boolean(user),
    canEdit: Boolean(user && ['admin', 'manager', 'editor'].includes(user.role)),
    locations: result.rows
  }
})
