export type MarkerIconOption = {
  key: string
  label: string
  body: string
  viewBox?: string
  filled?: boolean
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
    viewBox: '0 0 64 48',
    filled: true,
    body: '<path d="M5 17C6 10 14 0 22 7L29.2 11.6C21.2 4.6 13.2 14.6 12.2 21.6Z"/><path d="M19.4 26.2C20.4 19.2 28.4 9.2 36.4 16.2L43.6 20.8C35.6 13.8 27.6 23.8 26.6 30.8Z"/><path d="M33.8 35.4C34.8 28.4 42.8 18.4 50.8 25.4L56.6 29.1C48.6 22.1 40.6 32.1 39.6 39.1Z"/><path d="M5 17L41 40L41 43L5 20Z"/><path d="M41 40C42 33 50 23 58 30L58 33L41 43Z"/>'
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

const iconByKey = new Map(markerIconOptions.map((icon) => [icon.key, icon]))

export function normalizeMarkerIconKey(value?: string | null) {
  return iconByKey.has(String(value || '')) ? String(value) : 'map-pin'
}

function safeSvgColor(value?: string) {
  const color = String(value || 'currentColor')
  return color === 'currentColor' || /^#[0-9A-Fa-f]{3,8}$/.test(color) ? color : 'currentColor'
}

export function markerIconSvg(key?: string | null, options: { size?: number; color?: string; strokeWidth?: number } = {}) {
  const size = options.size ?? 18
  const color = safeSvgColor(options.color)
  const strokeWidth = options.strokeWidth ?? 2
  const icon = iconByKey.get(normalizeMarkerIconKey(key))!
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${icon.viewBox || '0 0 24 24'}" fill="${icon.filled ? color : 'none'}" stroke="${icon.filled ? 'none' : color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon.body}</svg>`
}
