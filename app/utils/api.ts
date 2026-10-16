import { useRuntimeConfig } from '#imports'
export function apiPath(path: string) {
  const config = useRuntimeConfig()
  const base = String(config.public.baseURL || '/')
  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  return `${normalizedBase}${path.replace(/^\//, '')}`
}

export function mediaPath(url: string | null | undefined) {
  const value = String(url || '')
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  if (value.startsWith('/api/')) return apiPath(value)
  return value
}
