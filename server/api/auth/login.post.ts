import bcrypt from 'bcryptjs'
import { readBody, createError } from 'h3'
import { db, ensureSchema } from '../../utils/db'
import { setSession } from '../../utils/auth'
export default defineEventHandler(async(event)=>{await ensureSchema();const body=await readBody<{email?:string;password?:string}>(event);const email=String(body.email||'').trim().toLowerCase();const password=String(body.password||'');if(!email||!password)throw createError({statusCode:400,statusMessage:'Email dan password wajib diisi.'});const result=await db().query('SELECT id,name,email,password_hash,role,active FROM users WHERE email=$1',[email]);const row=result.rows[0];if(!row?.active||!(await bcrypt.compare(password,row.password_hash)))throw createError({statusCode:401,statusMessage:'Email atau password tidak valid.'});const user={id:Number(row.id),name:row.name,email:row.email,role:row.role};await setSession(event,user);return {user}})
