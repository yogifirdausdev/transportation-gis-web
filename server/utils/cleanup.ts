import { readdir, stat, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { ensureDataDirs } from './uploads'

export async function cleanupOldImports(maxAgeMs = 24 * 60 * 60 * 1000) {
  const base = await ensureDataDirs()
  const dir = join(base, 'imports')
  const now = Date.now()
  const files = await readdir(dir).catch(() => [])
  await Promise.allSettled(files.map(async (file) => {
    const full = join(dir, file)
    const info = await stat(full)
    if (now - info.mtimeMs > maxAgeMs) await unlink(full)
  }))
}
