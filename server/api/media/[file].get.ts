import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { storageRoot } from '../../utils/files'

export default defineEventHandler(async (event) => {
  const name = decodeURIComponent(getRouterParam(event, 'file') || '')
  if (!name || name.includes('/') || name.includes('..')) throw createError({ statusCode: 404 })
  const full = path.join(storageRoot(), 'uploads', name)
  try {
    const data = await readFile(full)
    const ext = path.extname(name).toLowerCase()
    const types: Record<string,string> = { '.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.gif':'image/gif' }
    setHeader(event, 'Content-Type', types[ext] || 'application/octet-stream')
    setHeader(event, 'Cache-Control', 'public, max-age=86400')
    return data
  } catch { throw createError({ statusCode: 404, statusMessage: 'File tidak ditemukan' }) }
})
