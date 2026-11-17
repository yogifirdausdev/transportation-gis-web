import { requireUser } from '../../../utils/auth'
import { q } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  const id = getRouterParam(event,'id')!
  const r = await q(`
    SELECT l.*,c.name category,c.color category_color,c.icon_key category_icon_key,COALESCE(d.name,l.district_raw) district
    FROM locations l
    JOIN categories c ON c.id=l.category_id
    LEFT JOIN districts d ON d.id=l.district_id
    WHERE l.id=$1 AND l.deleted_at IS NULL
  `,[id])
  if (!r.rows[0]) throw createError({statusCode:404})
  return { location:r.rows[0] }
})
