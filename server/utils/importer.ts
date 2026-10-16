import ExcelJS from 'exceljs'
import { q } from './db'

type ParsedRow = {
  rowNumber: number
  fiscalYear: number | null
  districtName: string
  locationName: string
  latitude: number | null
  longitude: number | null
  categoryName: string
  condition: string | null
  photo?: { buffer: Buffer; extension: string }
}

export type PreviewRow = ParsedRow & {
  status: 'valid' | 'warning' | 'skip'
  reasons: string[]
  districtId?: string
  districtRaw?: string | null
  categoryId?: string
  normalizedCondition?: string | null
}

const conditionMap: Record<string, string> = {
  'baik / sesuai': 'Baik / Sesuai',
  'baik/sesuai': 'Baik / Sesuai',
  'baik': 'Baik / Sesuai',
  'tidak baik / tidak sesuai': 'Tidak Baik / Tidak Sesuai',
  'tidak baik/tidak sesuai': 'Tidak Baik / Tidak Sesuai',
  'tidak baik': 'Tidak Baik / Tidak Sesuai',
  'belum dinilai': 'Belum Dinilai'
}

function text(v: any) {
  if (v == null) return ''
  if (typeof v === 'object' && v.text) return String(v.text).trim()
  if (typeof v === 'object' && Array.isArray(v.richText)) return v.richText.map((x: any) => x.text).join('').trim()
  return String(v).trim()
}

function num(v: any): number | null {
  if (v == null || v === '') return null
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  const n = Number(String(v).trim().replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

function rowForImage(image: any): number | null {
  const tl = image?.range?.tl
  if (!tl) return null
  if (typeof tl.nativeRow === 'number') return tl.nativeRow + 1
  if (typeof tl.row === 'number') return Math.floor(tl.row) + 1
  return null
}

export async function parseWorkbook(buffer: Buffer) {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buffer as any)
  const ws = wb.getWorksheet('Template Import') || wb.worksheets[0]
  if (!ws) throw new Error('Worksheet tidak ditemukan')

  const headers = new Map<string, number>()
  ws.getRow(1).eachCell((cell, col) => headers.set(text(cell.value).toLowerCase(), col))
  const required = ['tahun anggaran','kecamatan','lokasi kegiatan','latitude','longitude','kategori']
  for (const h of required) if (!headers.has(h)) throw new Error(`Kolom wajib tidak ditemukan: ${h}`)

  const imageByRow = new Map<number, { buffer: Buffer; extension: string }>()
  for (const img of ws.getImages()) {
    const row = rowForImage(img)
    if (!row) continue
    const image = wb.getImage(Number(img.imageId)) as any
    if (!image) continue
    const bufferValue = image.buffer ? Buffer.from(image.buffer) : image.base64 ? Buffer.from(String(image.base64).split(',').pop() || '', 'base64') : null
    if (bufferValue) imageByRow.set(row, { buffer: bufferValue, extension: image.extension || 'jpeg' })
  }

  const rows: ParsedRow[] = []
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r)
    const location = text(row.getCell(headers.get('lokasi kegiatan')!).value)
    const district = text(row.getCell(headers.get('kecamatan')!).value)
    const lat = num(row.getCell(headers.get('latitude')!).value)
    const lng = num(row.getCell(headers.get('longitude')!).value)
    const year = num(row.getCell(headers.get('tahun anggaran')!).value)
    const category = text(row.getCell(headers.get('kategori')!).value)
    const condition = headers.get('kondisi') ? text(row.getCell(headers.get('kondisi')!).value) : ''
    const anyData = location || district || lat !== null || lng !== null || year !== null || category
    if (!anyData) continue
    rows.push({
      rowNumber: r,
      fiscalYear: year ? Math.trunc(year) : null,
      districtName: district,
      locationName: location,
      latitude: lat,
      longitude: lng,
      categoryName: category,
      condition: condition || null,
      photo: imageByRow.get(r)
    })
  }
  return rows
}

export async function validateRows(rows: ParsedRow[], skipDuplicates = true): Promise<PreviewRow[]> {
  const districts = await q('SELECT id,name FROM districts ORDER BY name')
  const categories = await q('SELECT id,name FROM categories ORDER BY name')
  const districtMap = new Map(districts.rows.map((d:any) => [String(d.name).trim().toLowerCase(), d]))
  const categoryMap = new Map(categories.rows.map((c:any) => [String(c.name).trim().toLowerCase(), c]))
  const out: PreviewRow[] = []

  for (const row of rows) {
    const reasons: string[] = []
    let status: PreviewRow['status'] = 'valid'
    const district = districtMap.get(row.districtName.trim().toLowerCase()) as any
    const category = categoryMap.get(row.categoryName.trim().toLowerCase()) as any

    if (!row.fiscalYear || row.fiscalYear < 2000 || row.fiscalYear > 2100) { status='skip'; reasons.push('Tahun Anggaran tidak valid') }
    if (!row.districtName) { status='skip'; reasons.push('Kecamatan kosong') }
    else if (!district && status !== 'skip') { status='warning'; reasons.push(`Kecamatan "${row.districtName}" tidak dikenali. Data tetap diimport sebagai draft internal dan tidak tampil di peta publik sampai diperbaiki dari Edit Location.`) }
    if (!row.locationName) { status='skip'; reasons.push('Lokasi Kegiatan kosong') }
    if (row.latitude == null || row.latitude < -90 || row.latitude > 90) { status='skip'; reasons.push('Latitude tidak valid') }
    if (row.longitude == null || row.longitude < -180 || row.longitude > 180) { status='skip'; reasons.push('Longitude tidak valid') }
    if (!category) { status='skip'; reasons.push(`Kategori "${row.categoryName || '-'}" tidak dikenali`) }

    let normalizedCondition: string | null = 'Belum Dinilai'
    if (row.condition) {
      const mapped = conditionMap[row.condition.toLowerCase()]
      if (mapped) normalizedCondition = mapped
      else if (status !== 'skip') { status='warning'; reasons.push('Kondisi tidak dikenali dan akan disimpan sebagai Belum Dinilai') }
    } else if (status !== 'skip') { status='warning'; reasons.push('Kondisi kosong dan akan disimpan sebagai Belum Dinilai') }
    if (!row.photo && status !== 'skip') { status='warning'; reasons.push('Foto tidak ditemukan') }

    if (status !== 'skip' && category && row.latitude != null && row.longitude != null) {
      const dup = await q(`SELECT id, location_name FROM locations WHERE deleted_at IS NULL AND category_id=$1 AND ABS(latitude-$2)<0.0000001 AND ABS(longitude-$3)<0.0000001 LIMIT 1`, [category.id, row.latitude, row.longitude])
      if (dup.rows[0]) {
        if (skipDuplicates) { status='skip'; reasons.push(`Duplikat potensial dengan "${dup.rows[0].location_name}"`) }
        else { status='warning'; reasons.push(`Duplikat potensial dengan "${dup.rows[0].location_name}"`) }
      }
    }

    out.push({ ...row, status, reasons, districtId: district?.id, districtRaw: district ? null : (row.districtName || null), categoryId: category?.id, normalizedCondition })
  }
  return out
}
