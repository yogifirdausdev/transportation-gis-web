import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

export async function ensureDataDirs() {
  const base = String(useRuntimeConfig().dataDir)
  await mkdir(join(base, 'uploads'), { recursive: true })
  await mkdir(join(base, 'imports'), { recursive: true })
  return base
}

export async function saveImage(buffer: Buffer, extension = 'jpg') {
  const base = await ensureDataDirs()
  const ext = extension.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'jpg'
  const filename = `${randomUUID()}.${ext}`
  await writeFile(join(base, 'uploads', filename), buffer)
  const baseUrl = String(useRuntimeConfig().app.baseURL || '/').replace(/\/$/, '')
  return `${baseUrl}/uploads/${filename}`
}
