import path from 'node:path'
import { requireUser } from '../../../utils/auth'
import { q } from '../../../utils/db'
import { partFile, partText } from '../../../utils/multipart'
import { saveUpload } from '../../../utils/files'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event, ['admin','manager','editor'])
  const parts = await readMultipartFormData(event)
  if (!parts) throw createError({ statusCode:400, statusMessage:'Form data diperlukan' })
  const locationName = partText(parts,'location_name').trim()
  const categoryId = partText(parts,'category_id')
  const districtId = partText(parts,'district_id')
  const fiscalYear = Number(partText(parts,'fiscal_year'))
  const latitude = Number(partText(parts,'latitude'))
  const longitude = Number(partText(parts,'longitude'))
  const condition = partText(parts,'condition') || 'Belum Dinilai'
  if (!locationName || !categoryId || !districtId || !Number.isFinite(fiscalYear) || !Number.isFinite(latitude) || !Number.isFinite(longitude)) throw createError({ statusCode:400, statusMessage:'Data lokasi belum lengkap' })
  let photoPath: string | null = null
  const photo = partFile(parts,'photo')
  if (photo?.data) photoPath = await saveUpload(Buffer.from(photo.data), photo.filename || `photo${path.extname(photo.type || '')}`)
  const r = await q(`
    INSERT INTO locations(location_name,category_id,district_id,fiscal_year,latitude,longitude,condition,photo_path,source_type,created_by)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,'manual',$9)
    RETURNING id
  `,[locationName,categoryId,districtId,Math.trunc(fiscalYear),latitude,longitude,condition,photoPath,user.id])
  return { id:r.rows[0].id }
})
