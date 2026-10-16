import { readFile, stat } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { createError, getRouterParam, setHeader } from 'h3'
import { UPLOAD_ROOT } from '../../utils/files'
export default defineEventHandler(async(event)=>{const raw=decodeURIComponent(getRouterParam(event,'path')||'');const full=resolve(UPLOAD_ROOT,raw);const root=resolve(UPLOAD_ROOT)+sep;if(!full.startsWith(root))throw createError({statusCode:400,statusMessage:'Invalid path'});try{await stat(full);const ext=extname(full).toLowerCase();const mime:Record<string,string>={'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.gif':'image/gif'};setHeader(event,'content-type',mime[ext]||'application/octet-stream');setHeader(event,'cache-control','public, max-age=86400');return await readFile(full)}catch{throw createError({statusCode:404,statusMessage:'File not found'})}})
