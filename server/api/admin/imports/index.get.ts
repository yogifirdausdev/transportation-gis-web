import { requireUser } from '../../../utils/auth'
import { q } from '../../../utils/db'
export default defineEventHandler(async (event) => {
  await requireUser(event)
  const r=await q(`SELECT b.*,u.name imported_by_name,u.email imported_by_email,(SELECT count(*) FROM locations l WHERE l.import_batch_id=b.id AND l.deleted_at IS NULL AND l.modified_after_import=true) modified_count,(SELECT count(*) FROM locations l WHERE l.import_batch_id=b.id AND l.deleted_at IS NULL AND l.modified_after_import=false) rollbackable_count FROM import_batches b LEFT JOIN users u ON u.id=b.imported_by ORDER BY b.created_at DESC LIMIT 200`)
  return { batches:r.rows }
})
