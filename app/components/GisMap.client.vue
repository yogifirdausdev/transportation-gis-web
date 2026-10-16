<script setup lang="ts">
import { apiPath, mediaPath } from '@/utils/api'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { AlertCircle, Layers3, LoaderCircle, RefreshCw } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import type { GisLocation } from '@/types/gis'

const props = defineProps<{
  filters: { q:string; category:string; condition:string; district:string }
}>()
const emit = defineEmits<{ count: [number] }>()
const container = ref<HTMLElement | null>(null)
const loading = ref(true)
const mapReady = ref(false)
const apiError = ref('')
const tileWarning = ref('')
const lastCount = ref(0)

let L: typeof import('leaflet') | null = null
let map: import('leaflet').Map | null = null
let layerGroup: import('leaflet').LayerGroup | null = null
let resizeObserver: ResizeObserver | null = null
let abortController: AbortController | null = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let tileErrors = 0
let destroyed = false
let initializing = false

const config = useRuntimeConfig()
const center = computed<[number, number]>(() => [Number(config.public.mapCenterLat), Number(config.public.mapCenterLng)])

function escapeHtml(value: unknown) {
  const entities: Record<string, string> = { '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#039;', '"':'&quot;' }
  return String(value ?? '').replace(/[&<>'"]/g, (ch) => entities[ch] || ch)
}

function conditionLabel(value: string) {
  if (value === 'good') return 'Baik / Sesuai'
  if (value === 'bad') return 'Tidak Baik / Tidak Sesuai'
  return 'Belum Dinilai'
}

async function waitForUsableContainer(maxFrames = 60) {
  await nextTick()
  for (let i=0; i<maxFrames && !destroyed; i++) {
    const el = container.value
    if (el && el.clientWidth > 40 && el.clientHeight > 40) return true
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
  }
  return false
}

function forceResize() {
  if (!map) return
  requestAnimationFrame(() => map?.invalidateSize({ pan: false }))
}

function popupHtml(item: GisLocation) {
  const photos = [
    item.before_photo_url ? `<a href="${escapeHtml(mediaPath(item.before_photo_url))}" target="_blank" rel="noreferrer"><img src="${escapeHtml(mediaPath(item.before_photo_url))}" alt="Foto sebelum" style="width:100%;height:96px;object-fit:cover;border-radius:8px" /></a>` : '',
    item.after_photo_url ? `<a href="${escapeHtml(mediaPath(item.after_photo_url))}" target="_blank" rel="noreferrer"><img src="${escapeHtml(mediaPath(item.after_photo_url))}" alt="Foto sesudah" style="width:100%;height:96px;object-fit:cover;border-radius:8px" /></a>` : '',
  ].filter(Boolean).join('')
  return `<div style="font-family:inherit"><div style="font-size:11px;color:#64748b;margin-bottom:4px">${escapeHtml(item.category_name)}</div><div style="font-weight:700;font-size:14px;line-height:1.35">${escapeHtml(item.name)}</div><div style="margin-top:8px;font-size:12px;color:#475569;line-height:1.55">${item.district ? `Kecamatan ${escapeHtml(item.district)}<br>` : ''}${escapeHtml(conditionLabel(item.condition))}<br>${item.latitude.toFixed(6)}, ${item.longitude.toFixed(6)}</div>${photos ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px">${photos}</div>`:''}</div>`
}

async function loadMarkers() {
  if (!map || !L || !layerGroup) return
  abortController?.abort()
  abortController = new AbortController()
  loading.value = true
  apiError.value = ''
  try {
    const b = map.getBounds()
    const params = new URLSearchParams({
      bbox: [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()].join(','),
      limit: '5000',
    })
    if (props.filters.q.trim()) params.set('q', props.filters.q.trim())
    if (props.filters.category) params.set('category', props.filters.category)
    if (props.filters.condition) params.set('condition', props.filters.condition)
    if (props.filters.district) params.set('district', props.filters.district)
    const response = await fetch(`${apiPath('/api/locations')}?${params}`, { signal: abortController.signal, credentials: 'same-origin' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json() as { items:GisLocation[] }
    layerGroup.clearLayers()
    for (const item of data.items) {
      const color = item.category_color || '#1d4ed8'
      L.circleMarker([item.latitude, item.longitude], {
        radius: 7,
        weight: 2,
        color: '#ffffff',
        fillColor: color,
        fillOpacity: .95,
      }).bindPopup(popupHtml(item), { className: 'gis-popup', maxWidth: 320 }).addTo(layerGroup)
    }
    lastCount.value = data.items.length
    emit('count', data.items.length)
  } catch (error: any) {
    if (error?.name !== 'AbortError') apiError.value = 'Data peta gagal dimuat. Basemap tetap dapat digunakan.'
  } finally {
    loading.value = false
  }
}

function scheduleLoad(delay = 180) {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => loadMarkers(), delay)
}

async function initMap() {
  if (map || initializing || destroyed) return
  initializing = true
  const usable = await waitForUsableContainer()
  if (!usable || destroyed || map || !container.value) {
    if (!usable) apiError.value = 'Container peta belum siap. Peta akan mencoba lagi saat ukuran halaman tersedia.'
    loading.value = false
    initializing = false
    return
  }
  try {
    L = await import('leaflet')
    if (destroyed || !container.value) return
    map = L.map(container.value, {
      center: center.value,
      zoom: Number(config.public.mapZoom),
      zoomControl: true,
      preferCanvas: true,
      attributionControl: true,
    })
    layerGroup = L.layerGroup().addTo(map)
    const tiles = L.tileLayer(String(config.public.tileUrl), {
      attribution: String(config.public.tileAttribution),
      maxZoom: 20,
      updateWhenIdle: false,
      keepBuffer: 3,
    }).addTo(map)
    tiles.on('tileerror', () => {
      tileErrors += 1
      if (tileErrors >= 4) tileWarning.value = 'Beberapa tile basemap gagal dimuat. Cek koneksi atau akses ke tile server.'
    })
    tiles.on('load', () => { tileErrors = 0; tileWarning.value = '' })
    map.on('moveend zoomend', () => scheduleLoad())
    map.whenReady(() => {
      mapReady.value = true
      forceResize()
      setTimeout(forceResize, 120)
      setTimeout(forceResize, 500)
      void loadMarkers()
    })
  } catch (error) {
    console.error('Map initialization failed', error)
    apiError.value = 'Peta gagal diinisialisasi. Muat ulang halaman untuk mencoba kembali.'
    loading.value = false
  } finally {
    initializing = false
  }
}

function handleVisibility() { if (!document.hidden) { if (!map) void initMap(); forceResize(); scheduleLoad(50) } }
function handlePageShow() { if (!map) void initMap(); forceResize(); scheduleLoad(80) }

onMounted(() => {
  destroyed = false
  if (container.value) {
    resizeObserver = new ResizeObserver(() => {
      if (map) forceResize()
      else void initMap()
    })
    resizeObserver.observe(container.value)
  }
  window.addEventListener('resize', forceResize, { passive: true })
  window.addEventListener('focus', handlePageShow, { passive: true })
  window.addEventListener('pageshow', handlePageShow, { passive: true })
  document.addEventListener('visibilitychange', handleVisibility)
  void initMap()
})

watch(() => ({ ...props.filters }), () => scheduleLoad(250), { deep: true })

onBeforeUnmount(() => {
  destroyed = true
  abortController?.abort()
  if (debounceTimer) clearTimeout(debounceTimer)
  resizeObserver?.disconnect()
  window.removeEventListener('resize', forceResize)
  window.removeEventListener('focus', handlePageShow)
  window.removeEventListener('pageshow', handlePageShow)
  document.removeEventListener('visibilitychange', handleVisibility)
  if (map) { map.off(); map.remove() }
  map = null; L = null; layerGroup = null
})
</script>

<template>
  <div class="relative h-full min-h-[420px] w-full overflow-hidden bg-muted">
    <div ref="container" class="absolute inset-0 size-full" />
    <div v-if="loading && !mapReady" class="pointer-events-none absolute inset-0 z-[500] grid place-items-center bg-background/80 backdrop-blur-sm"><div class="flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm shadow"><LoaderCircle class="size-4 animate-spin" />Menyiapkan peta...</div></div>
    <div class="pointer-events-none absolute left-3 top-3 z-[600] flex max-w-[calc(100%-1.5rem)] flex-col gap-2">
      <div v-if="loading && mapReady" class="flex w-fit items-center gap-2 rounded-md border bg-background/90 px-3 py-2 text-xs shadow-sm backdrop-blur"><LoaderCircle class="size-3.5 animate-spin" />Memuat data...</div>
      <div v-if="apiError" class="pointer-events-auto flex max-w-sm items-start gap-2 rounded-lg border border-red-200 bg-white/95 p-3 text-xs text-red-700 shadow-sm"><AlertCircle class="mt-0.5 size-4 shrink-0" /><div class="flex-1">{{ apiError }}</div><Button variant="ghost" size="sm" class="h-6 px-2" @click="loadMarkers"><RefreshCw class="size-3" /></Button></div>
      <div v-if="tileWarning" class="max-w-sm rounded-lg border border-amber-200 bg-white/95 p-3 text-xs text-amber-800 shadow-sm"><div class="flex gap-2"><Layers3 class="mt-0.5 size-4 shrink-0" /><span>{{ tileWarning }}</span></div></div>
    </div>
    <div class="pointer-events-none absolute bottom-5 left-3 z-[600] rounded-md border bg-background/90 px-2.5 py-1.5 text-[11px] text-muted-foreground shadow-sm backdrop-blur">{{ lastCount }} titik pada area tampilan</div>
  </div>
</template>
