import { readFile, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { z } from 'zod'
import { db } from '../../../utils/db'
import { requireUser } from '../../../utils/auth'
import { parseDishubWorkbook } from '../../../utils/xlsx'
import { ensureDataDirs, saveImage } from '../../../utils/uploads'

const schema = z.object({
  token: z.string().uuid(),
  skipDuplicates: z.boolean().default(true),
  fixPositiveJakartaLatitude: z.boolean().default(true)
})

export default defineEventHandler(async (event) => {
  const user = await requireUser(event, ['admin','gis_manager','gis_editor'])
  const input = schema.parse(await readBody(event))
  const base = await ensureDataDirs()
  const filePath = join(base, 'imports', `${input.token}.xlsx`)
  const metaPath = join(base, 'imports', `${input.token}.json`)

  let sourceFile = 'import.xlsx'
  try {
    const meta = JSON.parse(await readFile(metaPath, 'utf8'))
    sourceFile = String(meta.filename || sourceFile)
  } catch {}

  let parsed
  try {
    parsed = await parseDishubWorkbook(filePath, {
      fixPositiveJakartaLatitude: input.fixPositiveJakartaLatitude,
      includePhotos: true
    })
  } catch (error) {
    throw createError({ statusCode: 422, statusMessage: error instanceof Error ? error.message : 'Gagal membaca file import' })
  }

  const category = await db.query(`SELECT id FROM categories WHERE slug='speed-bump' LIMIT 1`)
  if (!category.rowCount) throw createError({ statusCode: 500, statusMessage: 'Category speed-bump tidak tersedia' })
  const categoryId = category.rows[0].id

  let imported = 0
  let skipped = 0
  const seen = new Set<string>()
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    for (const row of parsed.rows) {
      const key = `${row.latitude.toFixed(6)},${row.longitude.toFixed(6)}`
      let duplicate = seen.has(key)
      if (!duplicate && input.skipDuplicates) {
        const existing = await client.query(`
          SELECT id FROM locations
          WHERE round(latitude::numeric, 6)=round($1::numeric, 6)
            AND round(longitude::numeric, 6)=round($2::numeric, 6)
          LIMIT 1
        `, [row.latitude, row.longitude])
        duplicate = Boolean(existing.rowCount)
      }
      if (duplicate && input.skipDuplicates) {
        skipped++
        continue
      }
      seen.add(key)

      const beforeUrl = row.beforePhoto ? await saveImage(row.beforePhoto.buffer, row.beforePhoto.extension) : null
      const afterUrl = row.afterPhoto ? await saveImage(row.afterPhoto.buffer, row.afterPhoto.extension) : null
      const details = {
        sequence: row.sequence,
        roadWidth: row.roadWidth,
        speedBumpUnits: row.speedBumpUnits,
        speedBumpMeters: row.speedBumpMeters,
        endcapUnits: row.endcapUnits,
        sourceRow: row.rowNumber
      }
      await client.query(`
        INSERT INTO locations(
          category_id,name,district,condition,latitude,longitude,geom,details,
          before_photo_url,after_photo_url,source_file,created_by,updated_by
        ) VALUES(
          $1,$2,$3,$4,$5,$6,ST_SetSRID(ST_MakePoint($6,$5),4326),$7::jsonb,
          $8,$9,$10,$11,$11
        )
      `, [categoryId,row.name,row.district,row.condition,row.latitude,row.longitude,JSON.stringify(details),beforeUrl,afterUrl,sourceFile,user.id])
      imported++
    }
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
    await Promise.allSettled([unlink(filePath), unlink(metaPath)])
  }

  return {
    ok: true,
    imported,
    skipped,
    detected: parsed.rows.length,
    photos: parsed.photoCount,
    correctedLatitudes: parsed.correctedLatitudeCount
  }
})
