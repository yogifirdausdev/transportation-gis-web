import { requireUser } from '../../../utils/auth'
import { q } from '../../../utils/db'
import { partFile, partText } from '../../../utils/multipart'
import { saveUpload } from '../../../utils/files'

function parseFiscalYear(value: string) {
  if (!value.trim()) return null
  const year = Number(value)
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw createError({ statusCode:400, statusMessage:'Tahun Anggaran tidak valid' })
  }
  return year
}

function parseImplementationStatus(value: string) {
  const status = (value || 'EXISTING').trim().toUpperCase()
  if (!['EXISTING','PLANNED'].includes(status)) {
    throw createError({ statusCode:400, statusMessage:'Status implementasi tidak valid' })
  }
  return status
}

export default defineEventHandler(async (event) => {
  await requireUser(event, ['admin','manager','editor'])
  const id = getRouterParam(event,'id')!
  const existing = await q('SELECT id,photo_path,source_type FROM locations WHERE id=$1 AND deleted_at IS NULL',[id])
  if (!existing.rows[0]) throw createError({statusCode:404})
  const parts = await readMultipartFormData(event)
  if (!parts) throw createError({ statusCode:400 })
  const locationName = partText(parts,'location_name').trim()
  const categoryId = partText(parts,'category_id')
  const districtId = partText(parts,'district_id')
  const fiscalYear = parseFiscalYear(partText(parts,'fiscal_year'))
  const implementationStatus = parseImplementationStatus(partText(parts,'implementation_status'))
  const latitude = Number(partText(parts,'latitude'))
  const longitude = Number(partText(parts,'longitude'))
  const condition = partText(parts,'condition') || 'Belum Dinilai'
  if (!locationName || !categoryId || !districtId || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw createError({ statusCode:400, statusMessage:'Data lokasi belum lengkap. Pilih kecamatan yang valid.' })
  }
  let photoPath = existing.rows[0].photo_path as string | null
  const photo = partFile(parts,'photo')
  if (photo?.data) photoPath = await saveUpload(Buffer.from(photo.data), photo.filename || 'photo.jpg')
  await q(`UPDATE locations
    SET location_name=$1,category_id=$2,district_id=$3,district_raw=NULL,fiscal_year=$4,implementation_status=$5,
        latitude=$6,longitude=$7,condition=$8,photo_path=$9,
        modified_after_import=CASE WHEN source_type='excel' THEN true ELSE modified_after_import END,updated_at=now()
    WHERE id=$10`,[locationName,categoryId,districtId,fiscalYear,implementationStatus,latitude,longitude,condition,photoPath,id])
  return { ok:true }
})
