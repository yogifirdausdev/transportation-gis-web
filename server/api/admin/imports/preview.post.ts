import { requireUser } from '../../../utils/auth'
import { saveTempImport } from '../../../utils/files'
import { parseWorkbook, validateRows } from '../../../utils/importer'
import { partFile, partText } from '../../../utils/multipart'

export default defineEventHandler(async (event) => {
  await requireUser(event, ['admin','manager','editor'])
  const parts = await readMultipartFormData(event)
  if (!parts) throw createError({ statusCode:400, statusMessage:'File diperlukan' })
  const file = partFile(parts,'file')
  if (!file?.data || !file.filename) throw createError({ statusCode:400, statusMessage:'Pilih file .xlsx' })
  if (!file.filename.toLowerCase().endsWith('.xlsx')) throw createError({ statusCode:400, statusMessage:'Hanya file .xlsx yang didukung' })
  const skipDuplicates = partText(parts,'skip_duplicates') !== 'false'
  const buffer = Buffer.from(file.data)
  const temp = await saveTempImport(buffer, file.filename)
  let parsed
  try { parsed = await parseWorkbook(buffer) }
  catch (e:any) { throw createError({ statusCode:400, statusMessage:e?.message || 'Format Excel tidak dikenali' }) }
  const rows = await validateRows(parsed, skipDuplicates)
  return {
    token: temp.token,
    fileName: file.filename,
    skipDuplicates,
    summary: {
      total: rows.length,
      valid: rows.filter(r=>r.status==='valid').length,
      warning: rows.filter(r=>r.status==='warning').length,
      skipped: rows.filter(r=>r.status==='skip').length,
      ready: rows.filter(r=>r.status!=='skip').length
    },
    rows: rows.map(r => ({
      rowNumber:r.rowNumber,
      fiscalYear:r.fiscalYear,
      districtName:r.districtName,
      locationName:r.locationName,
      latitude:r.latitude,
      longitude:r.longitude,
      categoryName:r.categoryName,
      condition:r.normalizedCondition,
      implementationStatus:r.normalizedImplementationStatus,
      hasPhoto:!!r.photo,
      status:r.status,
      reasons:r.reasons
    }))
  }
})
