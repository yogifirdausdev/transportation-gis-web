import { mkdir, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { randomUUID } from 'node:crypto'

export const DATA_ROOT=process.env.GIS_DATA_DIR||'/data'
export const UPLOAD_ROOT=join(DATA_ROOT,'uploads')
export const IMPORT_ROOT=join(DATA_ROOT,'imports')
export async function ensureDataDirs(){await Promise.all([mkdir(UPLOAD_ROOT,{recursive:true}),mkdir(IMPORT_ROOT,{recursive:true})])}
export async function saveImage(buffer:Buffer,extension='jpg',prefix='image'){
  await ensureDataDirs();const ext=extension.replace(/^\./,'').toLowerCase()||'jpg';const month=new Date().toISOString().slice(0,7);const dir=join(UPLOAD_ROOT,month);await mkdir(dir,{recursive:true});const name=`${prefix}-${randomUUID()}.${ext}`;await writeFile(join(dir,name),buffer);return `/api/media/${month}/${name}`
}
export function safeExtension(filename:string){const ext=extname(filename).replace('.','').toLowerCase();return ['jpg','jpeg','png','webp','gif'].includes(ext)?ext:'jpg'}
