import { requireUser } from '../../../../utils/auth'
import { q } from '../../../../utils/db'
export default defineEventHandler(async (event) => {
  await requireUser(event, ['admin','manager'])
  const id=getRouterParam(event,'id')!
  const batch=await q('SELECT * FROM import_batches WHERE id=$1',[id])
  if(!batch.rows[0]) throw createError({statusCode:404})
  if(batch.rows[0].rolled_back_at) throw createError({statusCode:400,statusMessage:'Impor ini sudah di-rollback'})
  const modified=await q('SELECT count(*)::int count FROM locations WHERE import_batch_id=$1 AND deleted_at IS NULL AND modified_after_import=true',[id])
  const rollbackable=await q('SELECT count(*)::int count FROM locations WHERE import_batch_id=$1 AND deleted_at IS NULL AND modified_after_import=false',[id])
  await q('UPDATE locations SET deleted_at=now(),updated_at=now() WHERE import_batch_id=$1 AND deleted_at IS NULL AND modified_after_import=false',[id])
  await q('UPDATE import_batches SET rolled_back_at=now() WHERE id=$1',[id])
  return { rolledBack:Number(rollbackable.rows[0].count), retainedModified:Number(modified.rows[0].count) }
})
