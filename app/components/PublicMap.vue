<script setup lang="ts">
import { AlertCircle, Loader2 } from "lucide-vue-next";
import { markerIconSvg } from "~/lib/marker-icons";
import PublicHelpNotice from "./PublicHelpNotice.vue";

const router = useRouter();
const appPath = useAppPath();

const props = defineProps<{
  category?: string;
  district?: string;
  status?: string;
  year?: string | number;
  search?: string;
  authenticated?: boolean;
}>();

const mapEl = ref<HTMLElement | null>(null);
const loading = ref(true);
const error = ref("");
const markerCount = ref(0);
let map: any = null;
let L: any = null;
let layer: any = null;
const markersById = new Map<string, { marker: any; fingerprint: string }>();
let observer: ResizeObserver | null = null;
let aborter: AbortController | null = null;
let moveTimer: ReturnType<typeof setTimeout> | null = null;

function escapeHtml(value: any) {
  return String(value ?? "").replace(
    /[&<>'"]/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        c
      ] as string,
  );
}

function safeColor(value: any) {
  const color = String(value || "");
  return /^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#0F766E";
}

function statusLabel(value: any) {
  return value === "PLANNED" ? "Direncanakan" : "Terpasang";
}

function popupHtml(item: any, authenticated: boolean, canEdit: boolean) {
  const photo = item.photo_path
    ? `<img src="${escapeHtml(appPath(item.photo_path))}" alt="Foto" style="width:100%;height:150px;object-fit:cover;border-radius:10px;margin-bottom:10px" loading="lazy">`
    : "";
  const year =
    authenticated && item.fiscal_year != null
      ? `<div><strong>Tahun Anggaran:</strong> ${escapeHtml(item.fiscal_year)}</div>`
      : "";
  const editHref =
    authenticated && canEdit && item.id != null
      ? router.resolve({
          path: `/admin/locations/${encodeURIComponent(String(item.id))}`,
        }).href
      : "";
  const edit = editHref
    ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid #e2e8f0"><a class="gis-popup-edit" href="${escapeHtml(editHref)}">Edit Lokasi</a></div>`
    : "";
  return `<div style="min-width:220px;max-width:280px">${photo}<div style="font-weight:700;margin-bottom:8px;color:#0f172a">${escapeHtml(item.category)}</div><div style="font-size:13px;line-height:1.75;color:#475569"><div><strong>Status:</strong> ${statusLabel(item.implementation_status)}</div><div><strong>Lokasi:</strong> ${escapeHtml(item.location_name)}</div><div><strong>Kecamatan:</strong> ${escapeHtml(item.district)}</div>${year}<div><strong>Koordinat:</strong> ${Number(item.latitude).toFixed(7)}, ${Number(item.longitude).toFixed(7)}</div></div>${edit}</div>`;
}

function markerHtml(item: any) {
  const color = safeColor(item.category_color);
  const planned = item.implementation_status === "PLANNED";
  const iconColor = planned ? color : "#ffffff";
  return `<div class="gis-marker ${planned ? "gis-marker--planned" : "gis-marker--existing"}" style="--marker-color:${color}">${markerIconSvg(item.category_icon_key, { size: item.category_icon_key === "speed-bump" ? 22 : 18, color: iconColor, strokeWidth: 2.2 })}</div>`;
}

async function loadMarkers() {
  if (!map || !L) return;
  aborter?.abort();
  const controller = new AbortController();
  aborter = controller;
  loading.value = true;
  error.value = "";
  const b = map.getBounds();
  const params = new URLSearchParams({
    west: String(b.getWest()),
    south: String(b.getSouth()),
    east: String(b.getEast()),
    north: String(b.getNorth()),
  });
  if (props.category) params.set("category", String(props.category));
  if (props.district) params.set("district", String(props.district));
  if (props.status) params.set("status", String(props.status));
  if (props.authenticated && props.year) params.set("year", String(props.year));
  if (props.search?.trim()) params.set("search", props.search.trim());

  try {
    const data: any = await $fetch(`/api/public/locations?${params}`, {
      signal: controller.signal,
    });
    if (controller.signal.aborted || !map || !layer) return;
    const authenticated = data.authenticated === true;
    const canEdit = authenticated && data.canEdit === true;
    const visibleIds = new Set<string>();
    for (const item of data.locations || []) {
      const id = String(item.id);
      visibleIds.add(id);
      const fingerprint = JSON.stringify([item, authenticated, canEdit]);
      const previous = markersById.get(id);
      // Keep unchanged markers (and their open popups) during viewport refreshes.
      if (previous?.fingerprint === fingerprint) continue;
      if (previous) layer.removeLayer(previous.marker);
      const marker = L.marker([item.latitude, item.longitude], {
        icon: L.divIcon({
          className: "gis-marker-host",
          html: markerHtml(item),
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -20],
        }),
      });
      marker.bindPopup(() => popupHtml(item, authenticated, canEdit), {
        maxWidth: 300,
      });
      marker.addTo(layer);
      markersById.set(id, { marker, fingerprint });
    }
    for (const [id, entry] of markersById) {
      if (!visibleIds.has(id)) {
        layer.removeLayer(entry.marker);
        markersById.delete(id);
      }
    }
    markerCount.value = data.locations?.length || 0;
  } catch (e: any) {
    if (!controller.signal.aborted && e?.name !== "AbortError")
      error.value =
        "Data peta gagal dimuat. Coba geser/zoom peta atau muat ulang halaman.";
  } finally {
    if (aborter === controller) loading.value = false;
  }
}

function scheduleLoad() {
  if (moveTimer) clearTimeout(moveTimer);
  moveTimer = setTimeout(loadMarkers, 180);
}

async function init() {
  if (!mapEl.value || !import.meta.client) return;
  for (let i = 0; i < 20; i++) {
    const rect = mapEl.value.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) break;
    await new Promise((r) => setTimeout(r, 50));
  }
  L = await import("leaflet");
  if (!mapEl.value || map) return;
  map = L.map(mapEl.value, {
    zoomControl: false,
    preferCanvas: true,
    minZoom: 10,
  }).setView([-6.2, 106.82], 11);
  L.control.zoom({ position: "bottomright" }).addTo(map);
  layer = L.layerGroup().addTo(map);
  const tiles = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    },
  ).addTo(map);
  tiles.on("tileerror", () => {
    error.value =
      "Peta dasar sedang gagal dimuat. Marker dan data masih dapat tersedia.";
  });
  map.on("moveend", scheduleLoad);
  observer = new ResizeObserver(() => {
    if (map)
      requestAnimationFrame(() => map.invalidateSize({ animate: false }));
  });
  observer.observe(mapEl.value);
  requestAnimationFrame(() => {
    if (!map) return;
    map.invalidateSize({ animate: false });
    loadMarkers();
  });
}

function recoverMap() {
  if (document.visibilityState === "visible" && map) {
    setTimeout(() => {
      if (!map) return;
      map.invalidateSize({ animate: false });
      scheduleLoad();
    }, 100);
  }
}

watch(
  () => [
    props.category,
    props.district,
    props.status,
    props.year,
    props.search,
  ],
  scheduleLoad,
);
watch(
  () => props.authenticated,
  () => {
    // Discard popups and in-flight data from the previous session.
    aborter?.abort();
    layer?.clearLayers();
    markersById.clear();
    markerCount.value = 0;
    scheduleLoad();
  },
);
onMounted(() => {
  init();
  window.addEventListener("focus", recoverMap);
  document.addEventListener("visibilitychange", recoverMap);
});
onBeforeUnmount(() => {
  aborter?.abort();
  if (moveTimer) clearTimeout(moveTimer);
  observer?.disconnect();
  markersById.clear();
  window.removeEventListener("focus", recoverMap);
  document.removeEventListener("visibilitychange", recoverMap);
  if (map) {
    map.off();
    map.remove();
    map = null;
  }
});
</script>

<template>
  <div
    class="relative isolate h-full min-h-0 w-full overflow-hidden bg-slate-200"
  >
    <div ref="mapEl" class="absolute inset-0" />
    <div
      class="pointer-events-none absolute inset-y-0 left-0 z-[650] flex w-full max-w-[420px] flex-col justify-between gap-3 pb-7 pl-3 pr-3 pt-3 md:pb-8 md:pl-6 md:pr-4 md:pt-6"
    >
      <div
        class="min-h-0 shrink overflow-y-auto overscroll-contain rounded-2xl"
      >
        <slot name="filters" />
      </div>
      <div class="flex shrink-0 flex-col items-start gap-2 pr-12 md:pr-0">
        <PublicHelpNotice />
        <div
          class="flex max-w-full items-center gap-2 rounded-full border bg-white/95 px-3 py-2 text-xs font-medium text-slate-600 shadow-soft backdrop-blur"
          aria-live="polite"
        >
          <Loader2
            v-if="loading"
            class="h-3.5 w-3.5 shrink-0 animate-spin text-teal-700"
          />
          <span>{{
            loading ? "Memuat data..." : `${markerCount} titik pada area peta`
          }}</span>
        </div>
      </div>
    </div>
    <div
      v-if="error"
      class="absolute right-4 top-4 z-[750] flex max-w-sm gap-2 rounded-xl border border-amber-200 bg-amber-50/95 p-3 text-sm text-amber-900 shadow-soft"
    >
      <AlertCircle class="mt-0.5 h-4 w-4 shrink-0" /><span>{{ error }}</span>
    </div>
  </div>
</template>
