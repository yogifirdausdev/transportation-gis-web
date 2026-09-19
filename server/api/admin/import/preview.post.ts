import { randomUUID } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { requireUser } from '../../../utils/auth'
import { ensureDataDirs } from '../../../utils/uploads'
import { parseDishubWorkbook } from '../../../utils/xlsx'

export default defineEventHandler(async (event) => {
  await requireUser(event, ['admin','gis_manager','gis_editor'])
  const parts = await readMultipartFormData(event)
  const file = parts?.find(p => p.name === 'file' && p.data)
  if (!file?.data) throw createError({ statusCode: 400, statusMessage: 'File XLSX belum dipilih' })
  if (!String(file.filename || '').toLowerCase().endsWith('.xlsx')) {
    throw createError({ statusCode: 400, statusMessage: 'Gunakan file .xlsx' })
  }
  if (file.data.length > 50 * 1024 * 1024) throw createError({ statusCode: 413, statusMessage: 'File terlalu besar (maks. 50 MB)' })

  const base = await ensureDataDirs()
  const token = randomUUID()
  const filePath = join(base, 'imports', `${token}.xlsx`)
  const metaPath = join(base, 'imports', `${token}.json`)
  await writeFile(filePath, file.data)
  await writeFile(metaPath, JSON.stringify({ filename: file.filename || 'import.xlsx', createdAt: new Date().toISOString() }))

  try {
    const parsed = await parseDishubWorkbook(filePath, { fixPositiveJakartaLatitude: true, includePhotos: true })
    return {
      token,
      filename: file.filename,
      worksheet: parsed.worksheet,
      summary: {
        rows: parsed.rows.length,
        photos: parsed.photoCount,
        correctedLatitudes: parsed.correctedLatitudeCount,
        unassessed: parsed.unassessedCount,
        duplicateCoordinates: parsed.duplicateCoordinateCount
      },
      warnings: parsed.warnings,
      rows: parsed.rows.map(r => ({
        rowNumber: r.rowNumber,
        sequence: r.sequence,
        name: r.name,
        district: r.district,
        latitude: r.latitude,
        longitude: r.longitude,
        condition: r.condition,
        speedBumpUnits: r.speedBumpUnits,
        speedBumpMeters: r.speedBumpMeters,
        endcapUnits: r.endcapUnits,
        hasBeforePhoto: Boolean(r.beforePhoto),
        hasAfterPhoto: Boolean(r.afterPhoto),
        latitudeCorrected: r.latitudeCorrected
      }))
    }
  } catch (error) {
    throw createError({ statusCode: 422, statusMessage: error instanceof Error ? error.message : 'Gagal membaca Excel' })
  }
})
