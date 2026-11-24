import crypto from 'node:crypto'
import type { H3Event } from 'h3'
import { createError, deleteCookie, getCookie, getHeader, getRequestURL, setCookie } from 'h3'
import { q } from './db'

const COOKIE = 'gis_session'
const SESSION_DAYS = 7

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function isHttps(event: H3Event) {
  const forwarded = getHeader(event, 'x-forwarded-proto')
  if (forwarded) return forwarded.split(',')[0]?.trim() === 'https'
  return getRequestURL(event).protocol === 'https:'
}

export async function createSession(event: H3Event, userId: string) {
  const token = crypto.randomBytes(32).toString('hex')
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  await q('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1,$2,$3)', [tokenHash, userId, expiresAt])
  setCookie(event, COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttps(event),
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60
  })
}

export async function destroySession(event: H3Event) {
  const token = getCookie(event, COOKIE)
  if (token) await q('DELETE FROM sessions WHERE token_hash=$1', [hashToken(token)])
  deleteCookie(event, COOKIE, { path: '/' })
}

export async function getSessionUser(event: H3Event) {
  const token = getCookie(event, COOKIE)
  if (!token) return null
  const result = await q(`
    SELECT u.id, u.email, u.name, u.role
    FROM sessions s JOIN users u ON u.id=s.user_id
    WHERE s.token_hash=$1 AND s.expires_at > NOW() AND u.is_active=true
  `, [hashToken(token)])
  return result.rows[0] || null
}

export async function requireUser(event: H3Event, roles?: string[]) {
  const user = await getSessionUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Autentikasi diperlukan' })
  if (roles && !roles.includes(user.role)) throw createError({ statusCode: 403, statusMessage: 'Hak akses tidak mencukupi' })
  return user
}
