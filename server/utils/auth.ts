import { SignJWT, jwtVerify } from 'jose'
import { db } from './db'

export type GisRole = 'admin' | 'gis_manager' | 'gis_editor'
export interface SessionUser {
  id: string
  name: string
  email: string
  role: GisRole
}

const cookieName = 'gis_session'

function secret() {
  return new TextEncoder().encode(useRuntimeConfig().sessionSecret)
}

export async function createSession(event: any, user: SessionUser) {
  const token = await new SignJWT({ name: user.name, email: user.email, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secret())

  setCookie(event, cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8
  })
}

export function clearSession(event: any) {
  deleteCookie(event, cookieName, { path: '/' })
}

export async function getSessionUser(event: any): Promise<SessionUser | null> {
  const token = getCookie(event, cookieName)
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, secret())
    if (!payload.sub) return null
    const result = await db.query(
      'SELECT id, name, email, role FROM users WHERE id = $1 LIMIT 1',
      [payload.sub]
    )
    return result.rows[0] || null
  } catch {
    return null
  }
}

export async function requireUser(event: any, roles?: GisRole[]) {
  const user = await getSessionUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  if (roles && !roles.includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Insufficient permission' })
  }
  return user
}
