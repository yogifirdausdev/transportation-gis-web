import { db } from '../../../utils/db'
import { requireUser } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireUser(event, ['admin','gis_manager','gis_editor'])
  const q = getQuery(event)
  const page = Math.max(Number(q.page || 1), 1)
  const perPage = Math.min(Math.max(Number(q.perPage || 25), 1), 100)
  const offset = (page - 1) * perPage
  const values: any[] = []
  const where: string[] = []
  const add = (value: any) => { values.push(value); return `$${values.length}` }
  if (q.search) {
    const p = add(`%${String(q.search)}%`)
    where.push(`(l.name ILIKE ${p} OR coalesce(l.district,'') ILIKE ${p})`)
  }
  if (q.category && q.category !== 'all') where.push(`c.slug = ${add(String(q.category))}`)
  if (q.condition && q.condition !== 'all') where.push(`l.condition = ${add(String(q.condition))}`)
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

  const [rows, count] = await Promise.all([
    db.query(`
      SELECT l.*, c.name AS category_name, c.slug AS category_slug, c.marker_color
      FROM locations l JOIN categories c ON c.id=l.category_id
      ${whereSql}
      ORDER BY l.created_at DESC
      LIMIT ${perPage} OFFSET ${offset}
    `, values),
    db.query(`SELECT count(*)::int AS count FROM locations l JOIN categories c ON c.id=l.category_id ${whereSql}`, values)
  ])
  return { locations: rows.rows, total: count.rows[0].count, page, perPage }
})
