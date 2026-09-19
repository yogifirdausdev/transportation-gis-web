import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

export default defineEventHandler(async (event) => {
  const pathParam = getRouterParam(event, 'path') || ''
  const safe = normalize(pathParam).replace(/^(\.\.(\/|\\|$))+/, '')
  const base = join(String(useRuntimeConfig().dataDir), 'uploads')
  const full = join(base, safe)
  if (!full.startsWith(base)) throw createError({ statusCode: 400 })
  try {
    const data = await readFile(full)
    const ext = extname(full).toLowerCase()
    const types: Record<string, string> = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif'
    }
    setHeader(event, 'content-type', types[ext] || 'application/octet-stream')
    setHeader(event, 'cache-control', 'public, max-age=31536000, immutable')
    return data
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'File not found' })
  }
})
