<script setup lang="ts">
import L from 'leaflet'

const props = defineProps<{
  search: string
  category: string
  condition: string
  district: string
}>()
const emit = defineEmits<{ (e: 'count', value: number): void }>()
const config = useRuntimeConfig()
const el = ref<HTMLElement | null>(null)
const loading = ref(false)
let map: L.Map | null = null
let markers = L.layerGroup()
let requestSeq = 0

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;')
}

function conditionLabel(status: string) {
  return ({ good: 'Baik / Sesuai', bad: 'Tidak Baik / Tidak Sesuai', unassessed: 'Belum Dinilai' } as Record<string,string>)[status] || status
}

function popupHtml(item: any) {
  const d = item.details || {}
  const photos = item.before_photo_url || item.after_photo_url
    ? `<div class="popup-photos">
        ${item.before_photo_url ? `<div><img src="${escapeHtml(item.before_photo_url)}" alt="Sebelum"><small>Sebelum</small></div>` : '<div></div>'}
        ${item.after_photo_url ? `<div><img src="${escapeHtml(item.after_photo_url)}" alt="Sesudah"><small>Sesudah</small></div>` : ''}
      </div>` : ''
  return `
    <div class="popup-title">${escapeHtml(item.name)}</div>
    <div class="popup-meta">${escapeHtml(item.category_name)} · ${escapeHtml(item.district || 'Tanpa kecamatan')}</div>
    <div class="popup-grid">
      <div><b>Kondisi</b>${escapeHtml(conditionLabel(item.condition))}</div>
      <div><b>Koordinat</b>${Number(item.latitude).toFixed(6)}, ${Number(item.longitude).toFixed(6)}</div>
      ${d.speedBumpMeters != null ? `<div><b>Speed bump</b>${escapeHtml(d.speedBumpMeters)} m</div>` : ''}
      ${d.endcapUnits != null ? `<div><b>Endcap</b>${escapeHtml(d.endcapUnits)} pasang</div>` : ''}
    </div>
    ${photos}
  `
}

async function loadLocations() {
  if (!map) return
  const seq = ++requestSeq
  const b = map.getBounds()
  loading.value = true
  try {
    const data = await $fetch<{ locations: any[] }>(useApiUrl('/api/locations'), {
      query: {
        bbox: [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()].join(','),
        search: props.search || undefined,
        category: props.category,
        condition: props.condition,
        district: props.district,
        limit: 5000
      }
    })
    if (seq !== requestSeq) return
    markers.clearLayers()
    for (const item of data.locations) {
      const color = item.marker_color || '#eab308'
      const icon = L.divIcon({
        className: '',
        html: `<div class="marker-dot" style="background:${escapeHtml(color)}"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      })
      L.marker([Number(item.latitude), Number(item.longitude)], { icon })
        .bindPopup(popupHtml(item), { maxWidth: 320 })
        .addTo(markers)
    }
    emit('count', data.locations.length)
  } finally {
    if (seq === requestSeq) loading.value = false
  }
}

let debounce: ReturnType<typeof setTimeout> | undefined
function debouncedLoad() {
  clearTimeout(debounce)
  debounce = setTimeout(loadLocations, 220)
}

watch(() => [props.search, props.category, props.condition, props.district], debouncedLoad)

onMounted(() => {
  if (!el.value) return
  map = L.map(el.value, { zoomControl: true, preferCanvas: true })
    .setView([Number(config.public.mapCenterLat), Number(config.public.mapCenterLng)], Number(config.public.mapZoom))
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map)
  markers.addTo(map)
  map.on('moveend', debouncedLoad)
  loadLocations()
})

onBeforeUnmount(() => {
  clearTimeout(debounce)
  map?.remove()
  map = null
})
</script>

<template>
  <div class="map-wrap">
    <div ref="el" class="map-canvas" />
    <div v-if="loading" class="map-loading">Memuat titik…</div>
  </div>
</template>
