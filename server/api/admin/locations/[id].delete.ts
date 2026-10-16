import { requireUser } from '../../../utils/auth'
import { q } from '../../../utils/db'
export default defineEventHandler(async (event) => {
  await requireUser(event, ['admin','manager'])
  const id=getRouterParam(event,'id')!
  await q('UPDATE locations SET deleted_at=now(),updated_at=now() WHERE id=$1',[id])
  return {ok:true}
})
