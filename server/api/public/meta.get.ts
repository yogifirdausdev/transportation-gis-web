import { q } from '../../utils/db'
export default defineEventHandler(async () => {
  const [c,d,y] = await Promise.all([
    q('SELECT id,name,color FROM categories ORDER BY name'),
    q('SELECT id,name FROM districts ORDER BY name'),
    q('SELECT DISTINCT fiscal_year FROM locations WHERE deleted_at IS NULL ORDER BY fiscal_year DESC')
  ])
  return { categories: c.rows, districts: d.rows, years: y.rows.map((r:any)=>r.fiscal_year) }
})
