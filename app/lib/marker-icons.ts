export type MarkerIconOption = {
  key: string
  label: string
  body: string
}

export const markerIconOptions: MarkerIconOption[] = [
  {
    key: 'map-pin',
    label: 'Pin Lokasi',
    body: '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/>'
  },
  {
    key: 'speed-bump',
    label: 'Speed Bump',
    body: '<path d="M3 17h3c1.4 0 2.1-7 6-7s4.6 7 6 7h3"/><path d="M3 20h18"/><path d="M9 14h6"/>'
  },
  {
    key: 'camera',
    label: 'Kamera / CCTV',
    body: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="12" cy="13" r="3"/>'
  },
  {
    key: 'traffic-cone',
    label: 'Kerucut Lalu Lintas',
    body: '<path d="M10.83 2.38a2 2 0 0 1 2.34 0L19 20H5L10.83 2.38Z"/><path d="M8.5 8h7M7 13h10M3 20h18"/>'
  },
  {
    key: 'signpost',
    label: 'Rambu',
    body: '<path d="M12 3v18M5 6h14l2 3-2 3H5L3 9l2-3Z"/>'
  },
  {
    key: 'lightbulb',
    label: 'Lampu / PJU',
    body: '<path d="M9 18h6M10 22h4M8.5 14.5A7 7 0 1 1 15.5 14.5C14.6 15.2 14 16.2 14 17H10c0-.8-.6-1.8-1.5-2.5Z"/>'
  },
  {
    key: 'bus-front',
    label: 'Bus / Halte',
    body: '<path d="M6 17h12M6 17v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2m6 0v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2M5 17V6a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v11H5Z"/><path d="M5 9h14M8 13h.01M16 13h.01"/>'
  },
  {
    key: 'construction',
    label: 'Konstruksi / Pekerjaan',
    body: '<rect x="3" y="6" width="18" height="8" rx="1"/><path d="m7 6 4 8m2-8 4 8M6 14v5m12-5v5M4 19h4m8 0h4"/>'
  },
  {
    key: 'triangle-alert',
    label: 'Peringatan',
    body: '<path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>'
  }
]

const bodyByKey = new Map(markerIconOptions.map((icon) => [icon.key, icon.body]))

export function normalizeMarkerIconKey(value?: string | null) {
  return bodyByKey.has(String(value || '')) ? String(value) : 'map-pin'
}

function safeSvgColor(value?: string) {
  const color = String(value || 'currentColor')
  return color === 'currentColor' || /^#[0-9A-Fa-f]{3,8}$/.test(color) ? color : 'currentColor'
}

export function markerIconSvg(key?: string | null, options: { size?: number; color?: string; strokeWidth?: number } = {}) {
  const size = options.size ?? 18
  const color = safeSvgColor(options.color)
  const strokeWidth = options.strokeWidth ?? 2
  const body = bodyByKey.get(normalizeMarkerIconKey(key)) || bodyByKey.get('map-pin')!
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`
}
