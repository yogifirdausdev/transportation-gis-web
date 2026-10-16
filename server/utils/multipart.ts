export function partText(parts: any[], name: string) {
  const p = parts.find(x => x.name === name)
  return p?.data ? p.data.toString('utf8') : ''
}
export function partFile(parts: any[], name: string) { return parts.find(x => x.name === name && x.filename) }
