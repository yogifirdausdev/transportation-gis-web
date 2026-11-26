import { requireUser } from '../../../utils/auth'
import { q } from '../../../utils/db'
import { partFile, partText, readLimitedMultipart } from '../../../utils/multipart'
import { saveUpload, MAX_PHOTO_BYTES } from '../../../utils/files'

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
  const user = await requireUser(event, ['admin','manager','editor'])
  const parts = await readLimitedMultipart(event, MAX_PHOTO_BYTES + 1024 * 1024)
  if (!parts) throw createError({ statusCode:400, statusMessage:'Form data diperlukan' })
  const locationName = partText(parts,'location_name').trim()
  const categoryId = partText(parts,'category_id')
  const districtId = partText(parts,'district_id')
  const fiscalYear = parseFiscalYear(partText(parts,'fiscal_year'))
  const implementationStatus = parseImplementationStatus(partText(parts,'implementation_status'))
  const latitude = Number(partText(parts,'latitude'))
  const longitude = Number(partText(parts,'longitude'))
  const condition = partText(parts,'condition') || 'Belum Dinilai'
  if (!locationName || !categoryId || !districtId || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw createError({ statusCode:400, statusMessage:'Data lokasi belum lengkap' })
  }
  let photoPath: string | null = null
  const photo = partFile(parts,'photo')
  if (photo?.data) photoPath = await saveUpload(Buffer.from(photo.data))
  const r = await q(`
    INSERT INTO locations(location_name,category_id,district_id,fiscal_year,implementation_status,latitude,longitude,condition,photo_path,source_type,created_by)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'manual',$10)
    RETURNING id
  `,[locationName,categoryId,districtId,fiscalYear,implementationStatus,latitude,longitude,condition,photoPath,user.id])
  return { id:r.rows[0].id }
})
