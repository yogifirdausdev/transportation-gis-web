import { requireUser } from '../../../utils/auth'
import { q } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  const query = getQuery(event)
  const params: any[] = []
  const where = ['l.deleted_at IS NULL']
  if (query.search) { params.push(`%${String(query.search)}%`); where.push(`l.location_name ILIKE $${params.length}`) }
  if (query.category) { params.push(String(query.category)); where.push(`l.category_id=$${params.length}`) }
  if (query.district) { params.push(String(query.district)); where.push(`l.district_id=$${params.length}`) }
  if (query.year) { params.push(Number(query.year)); where.push(`l.fiscal_year=$${params.length}`) }
  const r = await q(`
    SELECT l.id,l.location_name,l.fiscal_year,l.latitude,l.longitude,l.condition,l.photo_path,
           l.source_type,l.source_file_name,l.source_row,l.import_batch_id,l.created_at,l.updated_at,
           c.id category_id,c.name category,c.color category_color,
           d.id district_id,COALESCE(d.name,l.district_raw) district
    FROM locations l
    JOIN categories c ON c.id=l.category_id
    LEFT JOIN districts d ON d.id=l.district_id
    WHERE ${where.join(' AND ')}
    ORDER BY l.updated_at DESC
    LIMIT 1000
  `, params)
  return { locations: r.rows }
})
