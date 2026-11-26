export function partText(parts: any[], name: string) {
  const p = parts.find(x => x.name === name)
  return p?.data ? p.data.toString('utf8') : ''
}
export function partFile(parts: any[], name: string) { return parts.find(x => x.name === name && x.filename) }

// Reject bodies over maxBytes before buffering them in memory.
export async function readLimitedMultipart(event: any, maxBytes: number) {
  const length = Number(getRequestHeader(event, 'content-length') || 0)
  if (length > maxBytes) {
    throw createError({ statusCode: 413, statusMessage: `Ukuran upload terlalu besar. Maksimal ${Math.round(maxBytes / 1024 / 1024)} MB.` })
  }
  return readMultipartFormData(event)
}
