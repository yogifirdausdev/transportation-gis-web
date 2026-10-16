import { SignJWT, jwtVerify } from 'jose'
import type { H3Event } from 'h3'
import { createError, getCookie, setCookie, deleteCookie } from 'h3'
import { db, ensureSchema } from './db'

export type UserRole = 'admin' | 'gis_manager' | 'gis_editor'
export interface SessionUser { id:number; name:string; email:string; role:UserRole }
const COOKIE='gis_session'
function key(){return new TextEncoder().encode(String(useRuntimeConfig().sessionSecret))}

export async function setSession(event:H3Event,user:SessionUser){
  const token=await new SignJWT({name:user.name,email:user.email,role:user.role}).setProtectedHeader({alg:'HS256'}).setSubject(String(user.id)).setIssuedAt().setExpirationTime('12h').sign(key())
  setCookie(event,COOKIE,token,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:60*60*12})
}
export function clearSession(event:H3Event){deleteCookie(event,COOKIE,{path:'/'})}
export async function requireUser(event:H3Event,roles?:UserRole[]):Promise<SessionUser>{
  await ensureSchema()
  const token=getCookie(event,COOKIE);if(!token)throw createError({statusCode:401,statusMessage:'Authentication required'})
  try{
    const {payload}=await jwtVerify(token,key())
    const id=Number(payload.sub);if(!id)throw new Error('invalid subject')
    const result=await db().query('SELECT id,name,email,role,active FROM users WHERE id=$1',[id])
    const row=result.rows[0];if(!row?.active)throw new Error('inactive user')
    const user={id:Number(row.id),name:row.name,email:row.email,role:row.role as UserRole}
    if(roles&&!roles.includes(user.role))throw createError({statusCode:403,statusMessage:'Insufficient permission'})
    return user
  }catch(error:any){if(error?.statusCode)throw error;clearSession(event);throw createError({statusCode:401,statusMessage:'Session expired'})}
}
