import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { requireUser } from '../../../utils/auth'
import { q } from '../../../utils/db'
export default defineEventHandler(async(event)=>{ await requireUser(event,['admin']); const body=z.object({name:z.string().min(2),email:z.string().email(),password:z.string().min(8),role:z.enum(['admin','manager','editor'])}).parse(await readBody(event)); const hash=await bcrypt.hash(body.password,12); const r=await q('INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id,name,email,role,is_active',[body.name,body.email.toLowerCase(),hash,body.role]); return {user:r.rows[0]} })
