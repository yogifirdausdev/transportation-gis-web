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

export async function saveUpload(buffer: Buffer, originalName: string, prefix = 'photo') {
  await ensureStorage()
  const ext = path.extname(originalName).toLowerCase() || '.jpg'
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
