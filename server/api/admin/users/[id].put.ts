import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { requireUser } from '../../../utils/auth'
import { q } from '../../../utils/db'
export default defineEventHandler(async(event)=>{ const current=await requireUser(event,['admin']); const id=getRouterParam(event,'id')!; const body=z.object({name:z.string().min(2),email:z.string().email(),role:z.enum(['admin','manager','editor']),is_active:z.boolean(),password:z.string().optional()}).parse(await readBody(event)); if(current.id===id && !body.is_active) throw createError({statusCode:400,statusMessage:'Anda tidak dapat menonaktifkan akun sendiri'}); const params:any[]=[body.name,body.email.toLowerCase(),body.role,body.is_active,id]; let sql='UPDATE users SET name=$1,email=$2,role=$3,is_active=$4 WHERE id=$5'; if(body.password){const hash=await bcrypt.hash(body.password,12);params.push(hash);sql='UPDATE users SET name=$1,email=$2,role=$3,is_active=$4,password_hash=$6 WHERE id=$5'} await q(sql,params); return {ok:true} })
