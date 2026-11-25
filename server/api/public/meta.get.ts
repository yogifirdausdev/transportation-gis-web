import { q } from '../../utils/db'
import { getSessionUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  const user = await getSessionUser(event)
  const [categories, districts, years] = await Promise.all([
    q('SELECT id,name,color,icon_key FROM categories ORDER BY name'),
    q('SELECT id,name FROM districts ORDER BY name'),
    user
      ? q('SELECT DISTINCT fiscal_year FROM locations WHERE deleted_at IS NULL AND fiscal_year IS NOT NULL ORDER BY fiscal_year DESC')
      : Promise.resolve({ rows: [] } as any)
  ])

  return {
    authenticated: Boolean(user),
    categories: categories.rows,
    districts: districts.rows,
    years: user ? years.rows.map((r:any) => r.fiscal_year) : [],
    statuses: [
      { value:'EXISTING', label:'Terpasang' },
      { value:'PLANNED', label:'Direncanakan' }
    ]
  }
})
