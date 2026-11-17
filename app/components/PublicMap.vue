<script setup lang="ts">
import { AlertCircle, Loader2 } from 'lucide-vue-next'
import { markerIconSvg } from '~/lib/marker-icons'

const props = defineProps<{
  category?: string
  district?: string
  status?: string
  year?: string | number
  search?: string
}>()

const mapEl = ref<HTMLElement | null>(null)
const loading = ref(true)
const error = ref('')
const markerCount = ref(0)
let map: any = null
let L: any = null
let layer: any = null
let observer: ResizeObserver | null = null
let aborter: AbortController | null = null
let moveTimer: ReturnType<typeof setTimeout> | null = null

function escapeHtml(value: any) {
  return String(value ?? '').replace(/[&<>'"]/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' })[c] as string)
}

function safeColor(value: any) {
  const color = String(value || '')
  return /^#[0-9A-Fa-f]{6}$/.test(color) ? color : '#0F766E'
}

function statusLabel(value: any) {
  return value === 'PLANNED' ? 'Direncanakan' : 'Eksisting'
}

function popupHtml(item: any) {
  const photo = item.photo_path
    ? `<img src="${escapeHtml(item.photo_path)}" alt="Foto" style="width:100%;height:150px;object-fit:cover;border-radius:10px;margin-bottom:10px" loading="lazy">`
    : ''
  const year = item.fiscal_year ? `<div><strong>Tahun Anggaran:</strong> ${escapeHtml(item.fiscal_year)}</div>` : ''
  return `<div style="min-width:220px;max-width:280px">${photo}<div style="font-weight:700;margin-bottom:8px;color:#0f172a">${escapeHtml(item.category)}</div><div style="font-size:13px;line-height:1.75;color:#475569"><div><strong>Status:</strong> ${statusLabel(item.implementation_status)}</div><div><strong>Kecamatan:</strong> ${escapeHtml(item.district)}</div>${year}<div><strong>Koordinat:</strong> ${Number(item.latitude).toFixed(7)}, ${Number(item.longitude).toFixed(7)}</div></div></div>`
}

function markerHtml(item: any) {
  const color = safeColor(item.category_color)
  const planned = item.implementation_status === 'PLANNED'
  const iconColor = planned ? color : '#ffffff'
  return `<div class="gis-marker ${planned ? 'gis-marker--planned' : 'gis-marker--existing'}" style="--marker-color:${color}">${markerIconSvg(item.category_icon_key, { size: 18, color: iconColor, strokeWidth: 2.2 })}</div>`
}

async function loadMarkers() {
  if (!map || !L) return
  aborter?.abort()
  const controller = new AbortController()
  aborter = controller
  loading.value = true
  error.value = ''
  const b = map.getBounds()
  const params = new URLSearchParams({
    west: String(b.getWest()), south: String(b.getSouth()), east: String(b.getEast()), north: String(b.getNorth())
  })
  if (props.category) params.set('category', String(props.category))
  if (props.district) params.set('district', String(props.district))
  if (props.status) params.set('status', String(props.status))
  if (props.year) params.set('year', String(props.year))
  if (props.search?.trim()) params.set('search', props.search.trim())

  try {
    const data: any = await $fetch(`/api/public/locations?${params}`, { signal: controller.signal })
    if (controller.signal.aborted) return
    layer.clearLayers()
    for (const item of data.locations || []) {
      const marker = L.marker([item.latitude, item.longitude], {
        icon: L.divIcon({
          className: 'gis-marker-host',
          html: markerHtml(item),
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -22]
        })
      })
      marker.bindPopup(popupHtml(item), { maxWidth: 300 })
      marker.addTo(layer)
    }
    markerCount.value = data.locations?.length || 0
  } catch (e: any) {
    if (e?.name !== 'AbortError') error.value = 'Data peta gagal dimuat. Coba geser/zoom peta atau refresh halaman.'
  } finally {
    if (aborter === controller) loading.value = false
  }
}

function scheduleLoad() {
  if (moveTimer) clearTimeout(moveTimer)
  moveTimer = setTimeout(loadMarkers, 180)
}

async function init() {
  if (!mapEl.value || !import.meta.client) return
  for (let i = 0; i < 20; i++) {
    const rect = mapEl.value.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) break
    await new Promise((r) => setTimeout(r, 50))
  }
  L = await import('leaflet')
  if (!mapEl.value || map) return
  map = L.map(mapEl.value, { zoomControl: false, preferCanvas: true, minZoom: 10 }).setView([-6.2, 106.82], 11)
  L.control.zoom({ position: 'bottomright' }).addTo(map)
  layer = L.layerGroup().addTo(map)
  const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map)
  tiles.on('tileerror', () => { error.value = 'Basemap sedang gagal dimuat. Marker/data masih dapat tersedia.' })
  map.on('moveend', scheduleLoad)
  observer = new ResizeObserver(() => {
    if (map) requestAnimationFrame(() => map.invalidateSize({ animate: false }))
  })
  observer.observe(mapEl.value)
  requestAnimationFrame(() => {
    map.invalidateSize({ animate: false })
    loadMarkers()
  })
}

function recoverMap() {
  if (document.visibilityState === 'visible' && map) {
    setTimeout(() => {
      map.invalidateSize({ animate: false })
      scheduleLoad()
    }, 100)
  }
}

watch(() => [props.category, props.district, props.status, props.year, props.search], scheduleLoad)
onMounted(() => {
  init()
  window.addEventListener('focus', recoverMap)
  document.addEventListener('visibilitychange', recoverMap)
})
onBeforeUnmount(() => {
  aborter?.abort()
  if (moveTimer) clearTimeout(moveTimer)
  observer?.disconnect()
  window.removeEventListener('focus', recoverMap)
  document.removeEventListener('visibilitychange', recoverMap)
  if (map) {
    map.off()
    map.remove()
    map = null
  }
})
</script>

<template>
  <div class="relative h-full min-h-[420px] w-full overflow-hidden bg-slate-200">
    <div ref="mapEl" class="absolute inset-0" />
    <div class="pointer-events-none absolute bottom-4 left-4 z-[500] flex items-center gap-2 rounded-full border bg-white/95 px-3 py-2 text-xs font-medium text-slate-600 shadow-soft backdrop-blur">
      <Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin text-teal-700" />
      <span>{{ loading ? 'Memuat data...' : `${markerCount} titik pada viewport` }}</span>
    </div>
    <div v-if="error" class="absolute right-4 top-4 z-[500] flex max-w-sm gap-2 rounded-xl border border-amber-200 bg-amber-50/95 p-3 text-sm text-amber-900 shadow-soft">
      <AlertCircle class="mt-0.5 h-4 w-4 shrink-0" /><span>{{ error }}</span>
    </div>
  </div>
</template>
