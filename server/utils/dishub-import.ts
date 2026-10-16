import ExcelJS from 'exceljs'

export type ImportCondition='good'|'bad'|'unassessed'
export interface ParsedImage { buffer:Buffer; extension:string }
export interface ParsedRow {
  row:number
  name:string
  district:string
  sourceLatitude:number
  latitude:number
  longitude:number
  condition:ImportCondition
  roadWidth:number|null
  speedBumpUnits:number|null
  speedBumpM:number|null
  endcapUnits:number|null
  before?:ParsedImage
  after?:ParsedImage
}
export interface ParsedWorkbook { sheet:string; rows:ParsedRow[]; imageCount:number }

function text(value:any):string{
  if(value==null)return ''
  if(typeof value==='object'){
    if(Array.isArray(value.richText))return value.richText.map((x:any)=>x.text||'').join('')
    if('text' in value)return String(value.text||'')
    if('result' in value)return String(value.result||'')
  }
  return String(value)
}
function norm(v:any){return text(v).trim().toLowerCase().replace(/\s+/g,' ')}
function num(v:any):number|null{
  if(typeof v==='number')return Number.isFinite(v)?v:null
  const raw=text(v).trim().replace(/\s/g,'').replace(',','.')
  if(!raw)return null
  const n=Number(raw.replace(/[^0-9+\-.]/g,''));return Number.isFinite(n)?n:null
}
function checked(v:any){const s=norm(v);return ['√','✓','v','x','1','ya','yes','baik','sesuai'].some(x=>s===x||s.includes(x))}
function latNeedsJakartaFix(lat:number,lng:number){return lat>5&&lat<7.5&&lng>106&&lng<108}

function findSheet(workbook:ExcelJS.Workbook){
  let best:ExcelJS.Worksheet|undefined;let score=-1
  workbook.eachSheet(ws=>{
    let s=0
    for(let r=1;r<=Math.min(ws.rowCount,25);r++)for(let c=1;c<=Math.min(ws.columnCount,30);c++){
      const n=norm(ws.getCell(r,c).value)
      if(n.includes('lokasi kegiatan'))s+=5
      if(n.includes('latitude'))s+=4
      if(n.includes('longtitude')||n.includes('longitude'))s+=4
      if(n==='sebelum'||n==='sesudah')s+=2
      if(n.includes('speed bump'))s+=2
    }
    if(s>score){score=s;best=ws}
  })
  if(!best||score<6)throw new Error('Template Excel tidak dikenali: header lokasi/koordinat tidak ditemukan.')
  return best
}
function findColumn(ws:ExcelJS.Worksheet,predicate:(v:string)=>boolean){
  for(let r=1;r<=Math.min(ws.rowCount,20);r++)for(let c=1;c<=ws.columnCount;c++){const n=norm(ws.getCell(r,c).value);if(n&&predicate(n))return c}
  return 0
}
function findColumns(ws:ExcelJS.Worksheet){
  const loc=findColumn(ws,v=>v.includes('lokasi kegiatan'))
  const lat=findColumn(ws,v=>v==='latitude'||v.includes('latitude'))
  const lng=findColumn(ws,v=>v.includes('longitude')||v.includes('longtitude'))
  const before=findColumn(ws,v=>v==='sebelum')
  const after=findColumn(ws,v=>v==='sesudah')
  const good=findColumn(ws,v=>v.includes('baik / sesuai')||v==='baik/sesuai')
  const bad=findColumn(ws,v=>v.includes('tidak baik')||v.includes('tidak sesuai'))
  const road=findColumn(ws,v=>v.includes('lebar jalan'))
  const speedUnit=findColumn(ws,v=>v.includes('speed bump')&&v.includes('unit'))
  const speedM=findColumn(ws,v=>v.includes('speed bump')&&(/\(m\)/.test(v)||v.endsWith(' m')))
  const endcap=findColumn(ws,v=>v.includes('endcap'))
  if(!loc||!lat||!lng)throw new Error('Kolom Lokasi Kegiatan, Latitude, atau Longitude tidak ditemukan.')
  return {loc,lat,lng,before,after,good,bad,road,speedUnit,speedM,endcap}
}
function anchorPosition(range:any){
  const tl=range?.tl||range?._tl||{}
  const row=Number.isFinite(tl.nativeRow)?tl.nativeRow:Number.isFinite(tl.row)?Math.floor(tl.row):0
  const col=Number.isFinite(tl.nativeCol)?tl.nativeCol:Number.isFinite(tl.col)?Math.floor(tl.col):0
  return {row:row+1,col:col+1}
}
function imageFor(workbook:ExcelJS.Workbook,id:number):ParsedImage|undefined{
  const img:any=workbook.getImage(id)
  if(!img)return
  let buffer:Buffer|undefined
  if(Buffer.isBuffer(img.buffer))buffer=img.buffer
  else if(img.base64)buffer=Buffer.from(String(img.base64).replace(/^data:[^,]+,/,''),'base64')
  if(!buffer)return
  return {buffer,extension:String(img.extension||'jpeg').replace('jpeg','jpg')}
}

export async function parseDishubWorkbook(buffer:Buffer):Promise<ParsedWorkbook>{
  const workbook=new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer as any)
  const ws=findSheet(workbook)
  const cols=findColumns(ws)
  const imageMap=new Map<string,ParsedImage>()
  for(const item of ws.getImages()){
    const pos=anchorPosition((item as any).range)
    const img=imageFor(workbook,(item as any).imageId)
    if(img)imageMap.set(`${pos.row}:${pos.col}`,img)
  }
  let district=''
  const rows:ParsedRow[]=[]
  for(let r=1;r<=ws.rowCount;r++){
    const locText=text(ws.getCell(r,cols.loc).value).trim()
    if(/^kecamatan\s+/i.test(locText)){district=locText.replace(/^kecamatan\s+/i,'').trim();continue}
    const sourceLat=num(ws.getCell(r,cols.lat).value)
    const lng=num(ws.getCell(r,cols.lng).value)
    if(!locText||sourceLat==null||lng==null)continue
    if(Math.abs(sourceLat)>90||Math.abs(lng)>180)continue
    const lat=latNeedsJakartaFix(sourceLat,lng)?-Math.abs(sourceLat):sourceLat
    let condition:ImportCondition='unassessed'
    if(cols.good&&checked(ws.getCell(r,cols.good).value))condition='good'
    else if(cols.bad&&checked(ws.getCell(r,cols.bad).value))condition='bad'
    rows.push({
      row:r,name:locText,district,sourceLatitude:sourceLat,latitude:lat,longitude:lng,condition,
      roadWidth:cols.road?num(ws.getCell(r,cols.road).value):null,
      speedBumpUnits:cols.speedUnit?num(ws.getCell(r,cols.speedUnit).value):null,
      speedBumpM:cols.speedM?num(ws.getCell(r,cols.speedM).value):null,
      endcapUnits:cols.endcap?num(ws.getCell(r,cols.endcap).value):null,
      before:cols.before?imageMap.get(`${r}:${cols.before}`):undefined,
      after:cols.after?imageMap.get(`${r}:${cols.after}`):undefined,
    })
  }
  if(!rows.length)throw new Error('Tidak ada baris lokasi dengan koordinat valid yang ditemukan.')
  return {sheet:ws.name,rows,imageCount:[...imageMap.values()].length}
}
