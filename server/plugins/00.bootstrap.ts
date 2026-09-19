import { ensureSchema } from '../utils/schema'
import { cleanupOldImports } from '../utils/cleanup'

export default defineNitroPlugin(async () => {
  let lastError: unknown
  for (let attempt = 1; attempt <= 20; attempt++) {
    try {
      await ensureSchema()
      await cleanupOldImports().catch(() => {})
      console.log('[GIS] Database schema ready')
      return
    } catch (error) {
      lastError = error
      console.error(`[GIS] Database bootstrap attempt ${attempt}/20 failed`)
      await new Promise(resolve => setTimeout(resolve, 2500))
    }
  }
  throw lastError
})
