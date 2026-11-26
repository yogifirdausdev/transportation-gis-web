import { mkdir, writeFile, readFile, stat, readdir, unlink } from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'

export function storageRoot() {
  return String(useRuntimeConfig().storageDir || '/app/storage')
}

export async function ensureStorage() {
  await mkdir(path.join(storageRoot(), 'uploads'), { recursive: true })
  await mkdir(path.join(storageRoot(), 'imports', 'tmp'), { recursive: true })
}

export function safeBaseName(name: string) {
  return path.basename(name).replace(/[^a-zA-Z0-9._-]+/g, '_')
}

export const MAX_PHOTO_BYTES = 10 * 1024 * 1024
export const MAX_IMPORT_BYTES = 30 * 1024 * 1024

// Identify the image type from the file's first bytes, never from its name.
export function detectImageExtension(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return '.jpg'
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return '.png'
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return '.webp'
  if (buffer.length >= 6 && /^GIF8[79]a$/.test(buffer.toString('ascii', 0, 6))) return '.gif'
  return null
}

export async function saveUpload(buffer: Buffer, prefix = 'photo') {
  if (buffer.length > MAX_PHOTO_BYTES) throw createError({ statusCode: 413, statusMessage: 'Foto terlalu besar. Maksimal 10 MB.' })
  const ext = detectImageExtension(buffer)
  if (!ext) throw createError({ statusCode: 400, statusMessage: 'Format foto tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.' })
  await ensureStorage()
  const fileName = `${prefix}-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`
  await writeFile(path.join(storageRoot(), 'uploads', fileName), buffer)
  return `/api/media/${encodeURIComponent(fileName)}`
}

export async function saveTempImport(buffer: Buffer, originalName: string) {
  await ensureStorage()
  const token = crypto.randomBytes(18).toString('hex')
  const filename = `${token}-${safeBaseName(originalName)}`
  const full = path.join(storageRoot(), 'imports', 'tmp', filename)
  await writeFile(full, buffer)
  return { token, filename, full }
}

export async function findTempImport(token: string) {
  const dir = path.join(storageRoot(), 'imports', 'tmp')
  const files = await readdir(dir)
  const filename = files.find(f => f.startsWith(`${token}-`))
  if (!filename) return null
  const full = path.join(dir, filename)
  const info = await stat(full)
  return { filename, full, info, buffer: await readFile(full) }
}


export async function deleteTempImport(token: string) {
  const dir = path.join(storageRoot(), 'imports', 'tmp')
  const files = await readdir(dir)
  const filename = files.find(f => f.startsWith(`${token}-`))
  if (filename) await unlink(path.join(dir, filename)).catch(() => {})
}

export async function cleanupTempImports(maxAgeMs = 24 * 60 * 60 * 1000) {
  await ensureStorage()
  const dir = path.join(storageRoot(), 'imports', 'tmp')
  const files = await readdir(dir)
  const now = Date.now()
  for (const filename of files) {
    if (filename === '.gitkeep') continue
    const full = path.join(dir, filename)
    try {
      const info = await stat(full)
      if (now - info.mtimeMs > maxAgeMs) await unlink(full)
    } catch {}
  }
}
