import { requireUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  return { user: await requireUser(event) }
})
