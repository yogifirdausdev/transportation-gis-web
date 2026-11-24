import { requireUser } from '../../../utils/auth'
import { findTempImport, saveUpload, deleteTempImport } from '../../../utils/files'
import { parseWorkbook, validateRows } from '../../../utils/importer'
import { q, db } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event, ['admin','manager','editor'])
  const body = await readBody(event)
  const token = String(body?.token || '')
  const skipDuplicates = body?.skipDuplicates !== false
  if (!token) throw createError({ statusCode:400, statusMessage:'Token pratinjau tidak valid' })
  const temp = await findTempImport(token)
  if (!temp) throw createError({ statusCode:400, statusMessage:'File pratinjau sudah tidak tersedia. Unggah ulang file.' })
  const originalName = temp.filename.replace(`${token}-`, '')
  const parsed = await parseWorkbook(temp.buffer)
  const rows = await validateRows(parsed, skipDuplicates)
  const ready = rows.filter(r=>r.status!=='skip')
  const batchRes = await q(`INSERT INTO import_batches(file_name,imported_by,total_rows,imported_rows,skipped_rows,warning_rows) VALUES($1,$2,$3,0,$4,$5) RETURNING id`,[
    originalName,user.id,rows.length,rows.filter(r=>r.status==='skip').length,rows.filter(r=>r.status==='warning').length
  ])
  const batchId = batchRes.rows[0].id
  const client = await db().connect()
  let imported = 0
  try {
    await client.query('BEGIN')
    for (const row of ready) {
      let photoPath: string | null = null
      if (row.photo) {
        const ext = row.photo.extension === 'jpeg' ? 'jpg' : row.photo.extension
        photoPath = await saveUpload(row.photo.buffer, `excel-row-${row.rowNumber}.${ext}`, `batch-${batchId}`)
      }
      await client.query(`
        INSERT INTO locations(location_name,category_id,district_id,district_raw,fiscal_year,implementation_status,latitude,longitude,condition,photo_path,source_type,source_file_name,source_row,import_batch_id,created_by)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'excel',$11,$12,$13,$14)
      `,[row.locationName,row.categoryId,row.districtId || null,row.districtRaw || null,row.fiscalYear,row.normalizedImplementationStatus,row.latitude,row.longitude,row.normalizedCondition || 'Belum Dinilai',photoPath,originalName,row.rowNumber,batchId,user.id])
      imported++
    }
    await client.query('UPDATE import_batches SET imported_rows=$1 WHERE id=$2',[imported,batchId])
    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    await q('DELETE FROM import_batches WHERE id=$1',[batchId])
    throw e
  } finally { client.release() }
  await deleteTempImport(token)
  return { batchId, imported, skipped: rows.length-imported }
})
