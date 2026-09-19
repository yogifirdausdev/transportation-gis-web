import ExcelJS from 'exceljs'
import JSZip from 'jszip'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

export type ImportCondition = 'good' | 'bad' | 'unassessed'

export interface ParsedPhoto {
  extension: string
  buffer: Buffer
}

export interface ParsedDishubRow {
  rowNumber: number
  sequence: number | null
  name: string
  district: string | null
  roadWidth: number | null
  speedBumpUnits: number | null
  speedBumpMeters: number | null
  endcapUnits: number | null
  latitude: number
  longitude: number
  condition: ImportCondition
  latitudeCorrected: boolean
  beforePhoto?: ParsedPhoto
  afterPhoto?: ParsedPhoto
}

export interface DishubParseResult {
  worksheet: string
  rows: ParsedDishubRow[]
  photoCount: number
  correctedLatitudeCount: number
  unassessedCount: number
  duplicateCoordinateCount: number
  warnings: string[]
}

const norm = (value: unknown) => String(value ?? '')
  .normalize('NFKD')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase()

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const raw = String(value ?? '').trim()
  if (!raw) return null
  const cleaned = raw.replace(/\s/g, '').replace(',', '.').replace(/[^0-9+\-.]/g, '')
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

function isMarked(value: unknown) {
  const s = norm(value)
  return Boolean(s && s !== '-' && s !== '0' && s !== 'false')
}

function headerColumns(ws: ExcelJS.Worksheet) {
  const out: Record<string, number> = {}
  const maxRow = Math.min(ws.rowCount, 20)
  for (let r = 1; r <= maxRow; r++) {
    const row = ws.getRow(r)
    row.eachCell({ includeEmpty: false }, (cell, col) => {
      const v = norm(cell.value)
      if (!v) return
      if (v.includes('lokasi kegiatan')) out.location = col
      if (v === 'latitude') out.latitude = col
      if (v.includes('longtitude') || v === 'longitude') out.longitude = col
      if (v.includes('sebelum')) out.before = col
      if (v.includes('sesudah')) out.after = col
      if (v.includes('baik / sesuai') || v === 'baik/sesuai') out.good = col
      if (v.includes('tidak baik')) out.bad = col
      if (v.includes('speed bump (unit)')) out.speedBumpUnits = col
      if (v.includes('speed bump (m)')) out.speedBumpMeters = col
      if (v.includes('endcap')) out.endcapUnits = col
      if (v.includes('lebar jalan')) out.roadWidth = col
      if (v === 'no') out.sequence = col
    })
  }
  return out
}

function chooseWorksheet(workbook: ExcelJS.Workbook) {
  let best: { ws: ExcelJS.Worksheet, score: number } | null = null
  workbook.eachSheet((ws) => {
    const cols = headerColumns(ws)
    let score = 0
    if (cols.location) score += 4
    if (cols.latitude) score += 4
    if (cols.longitude) score += 4
    if (cols.before) score += 1
    if (cols.after) score += 1
    if (!best || score > best.score) best = { ws, score }
  })
  if (!best || best.score < 8) throw new Error('Template Excel tidak dikenali: kolom Lokasi/Latitude/Longitude tidak ditemukan.')
  return best.ws
}

function decodeXml(v: string) {
  return v.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
}
function attrMap(xml: string) {
  const map = new Map<string,string>()
  for (const m of xml.matchAll(/<Relationship\b[^>]*\bId="([^"]+)"[^>]*\bTarget="([^"]+)"[^>]*\/?\s*>/g)) map.set(m[1], decodeXml(m[2]))
  return map
}
function resolveZipPath(baseFile: string, target: string) {
  return path.posix.normalize(path.posix.join(path.posix.dirname(baseFile), target)).replace(/^\//, '')
}

/**
 * Extract drawing images directly from the XLSX zip rather than relying on ExcelJS getImages().
 * This works with ordinary Microsoft Excel drawing anchors and preserves row/column placement.
 */
async function extractAnchoredImages(buffer: Buffer, sheetName: string) {
  const out = new Map<number, Array<{ col: number, photo: ParsedPhoto }>>()
  const zip = await JSZip.loadAsync(buffer)
  const workbookXml = await zip.file('xl/workbook.xml')?.async('string')
  const workbookRels = await zip.file('xl/_rels/workbook.xml.rels')?.async('string')
  if (!workbookXml || !workbookRels) return out

  let sheetRid: string | null = null
  for (const m of workbookXml.matchAll(/<sheet\b([^>]*)\/?\s*>/g)) {
    const attrs = m[1]
    const name = attrs.match(/\bname="([^"]*)"/)?.[1]
    const rid = attrs.match(/\br:id="([^"]+)"/)?.[1]
    if (name && rid && decodeXml(name) === sheetName) { sheetRid = rid; break }
  }
  if (!sheetRid) return out
  const sheetTarget = attrMap(workbookRels).get(sheetRid)
  if (!sheetTarget) return out
  const sheetPath = resolveZipPath('xl/workbook.xml', sheetTarget)
  const sheetXml = await zip.file(sheetPath)?.async('string')
  const sheetRelsPath = path.posix.join(path.posix.dirname(sheetPath), '_rels', `${path.posix.basename(sheetPath)}.rels`)
  const sheetRelsXml = await zip.file(sheetRelsPath)?.async('string')
  if (!sheetXml || !sheetRelsXml) return out

  const drawingRid = sheetXml.match(/<drawing\b[^>]*\br:id="([^"]+)"/)?.[1]
  if (!drawingRid) return out
  const drawingTarget = attrMap(sheetRelsXml).get(drawingRid)
  if (!drawingTarget) return out
  const drawingPath = resolveZipPath(sheetPath, drawingTarget)
  const drawingXml = await zip.file(drawingPath)?.async('string')
  const drawingRelsPath = path.posix.join(path.posix.dirname(drawingPath), '_rels', `${path.posix.basename(drawingPath)}.rels`)
  const drawingRelsXml = await zip.file(drawingRelsPath)?.async('string')
  if (!drawingXml || !drawingRelsXml) return out
  const drawingRels = attrMap(drawingRelsXml)

  const anchorRegex = /<xdr:(?:twoCellAnchor|oneCellAnchor)\b[\s\S]*?<\/xdr:(?:twoCellAnchor|oneCellAnchor)>/g
  for (const anchorMatch of drawingXml.matchAll(anchorRegex)) {
    const anchor = anchorMatch[0]
    const from = anchor.match(/<xdr:from>[\s\S]*?<xdr:col>(\d+)<\/xdr:col>[\s\S]*?<xdr:row>(\d+)<\/xdr:row>[\s\S]*?<\/xdr:from>/)
    const embed = anchor.match(/<a:blip\b[^>]*\br:embed="([^"]+)"/)
    if (!from || !embed) continue
    const col = Number(from[1]) + 1
    const row = Number(from[2]) + 1
    const mediaTarget = drawingRels.get(embed[1])
    if (!mediaTarget) continue
    const mediaPath = resolveZipPath(drawingPath, mediaTarget)
    const media = zip.file(mediaPath)
    if (!media) continue
    const photo: ParsedPhoto = {
      extension: path.posix.extname(mediaPath).replace('.', '').toLowerCase() || 'jpg',
      buffer: Buffer.from(await media.async('uint8array'))
    }
    const list = out.get(row) || []
    list.push({ col, photo })
    out.set(row, list)
  }
  return out
}

export async function parseDishubWorkbook(filePath: string, opts: { fixPositiveJakartaLatitude?: boolean, includePhotos?: boolean } = {}): Promise<DishubParseResult> {
  const buffer = await readFile(filePath)
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer as any)
  const ws = chooseWorksheet(workbook)
  const cols = headerColumns(ws)
  for (const key of ['location', 'latitude', 'longitude']) if (!cols[key]) throw new Error(`Kolom ${key} tidak ditemukan.`)

  const anchoredImages = opts.includePhotos === false ? new Map() : await extractAnchoredImages(buffer, ws.name)
  const rows: ParsedDishubRow[] = []
  const warnings: string[] = []
  let currentDistrict: string | null = null

  for (let r = 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r)
    let districtFound: string | null = null
    row.eachCell({ includeEmpty: false }, (cell) => {
      const s = String(cell.value ?? '').trim()
      const m = s.match(/^Kecamatan\s+(.+)$/i)
      if (m) districtFound = m[1].trim()
    })
    if (districtFound) { currentDistrict = districtFound; continue }

    const name = String(row.getCell(cols.location).value ?? '').trim()
    let latitude = parseNumber(row.getCell(cols.latitude).value)
    const longitude = parseNumber(row.getCell(cols.longitude).value)
    if (!name || latitude === null || longitude === null) continue

    let latitudeCorrected = false
    if (opts.fixPositiveJakartaLatitude !== false && latitude > 0 && latitude >= 5 && latitude <= 7.5 && longitude >= 106 && longitude <= 108) {
      latitude = -latitude
      latitudeCorrected = true
    }
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      warnings.push(`Baris ${r}: koordinat tidak valid dan dilewati.`)
      continue
    }

    let condition: ImportCondition = 'unassessed'
    if (cols.good && isMarked(row.getCell(cols.good).value)) condition = 'good'
    else if (cols.bad && isMarked(row.getCell(cols.bad).value)) condition = 'bad'

    let beforePhoto: ParsedPhoto | undefined
    let afterPhoto: ParsedPhoto | undefined
    for (const image of (anchoredImages.get(r) || []) as Array<{col:number, photo:ParsedPhoto}>) {
      if (cols.before && Math.abs(image.col - cols.before) <= 1 && !beforePhoto) beforePhoto = image.photo
      else if (cols.after && Math.abs(image.col - cols.after) <= 1 && !afterPhoto) afterPhoto = image.photo
      else if (!beforePhoto) beforePhoto = image.photo
      else if (!afterPhoto) afterPhoto = image.photo
    }

    rows.push({
      rowNumber: r,
      sequence: cols.sequence ? parseNumber(row.getCell(cols.sequence).value) : null,
      name,
      district: currentDistrict,
      roadWidth: cols.roadWidth ? parseNumber(row.getCell(cols.roadWidth).value) : null,
      speedBumpUnits: cols.speedBumpUnits ? parseNumber(row.getCell(cols.speedBumpUnits).value) : null,
      speedBumpMeters: cols.speedBumpMeters ? parseNumber(row.getCell(cols.speedBumpMeters).value) : null,
      endcapUnits: cols.endcapUnits ? parseNumber(row.getCell(cols.endcapUnits).value) : null,
      latitude,
      longitude,
      condition,
      latitudeCorrected,
      beforePhoto,
      afterPhoto
    })
  }

  const seen = new Set<string>()
  let duplicateCoordinateCount = 0
  for (const row of rows) {
    const key = `${row.latitude.toFixed(6)},${row.longitude.toFixed(6)}`
    if (seen.has(key)) duplicateCoordinateCount++
    seen.add(key)
  }

  return {
    worksheet: ws.name,
    rows,
    photoCount: rows.reduce((n, r) => n + (r.beforePhoto ? 1 : 0) + (r.afterPhoto ? 1 : 0), 0),
    correctedLatitudeCount: rows.filter(r => r.latitudeCorrected).length,
    unassessedCount: rows.filter(r => r.condition === 'unassessed').length,
    duplicateCoordinateCount,
    warnings
  }
}
