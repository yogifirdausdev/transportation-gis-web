<script setup lang="ts">
import { ChevronDown, ChevronUp, Map, RotateCcw, Search, Shield, SlidersHorizontal } from 'lucide-vue-next'
import { markerIconSvg } from '~/lib/marker-icons'

// Session-specific metadata is also embedded in the SSR page payload.
if (import.meta.server) useResponseHeader('Cache-Control').value = 'private, no-store'

const { data: meta, refresh: refreshMeta } = await useFetch('/api/public/meta')
const category = ref('')
const district = ref('')
const status = ref('')
const year = ref('')
const search = ref('')
const isAuthenticated = computed(() => Boolean(meta.value?.authenticated))
const filtersExpanded = ref(false)
const activeFilterCount = computed(() => [
  search.value.trim(), category.value, district.value, status.value,
  isAuthenticated.value ? year.value : ''
].filter(Boolean).length)

function resetFilters() {
  search.value = ''
  category.value = ''
  district.value = ''
  status.value = ''
  year.value = ''
}

function refreshSession() {
  if (document.visibilityState === 'visible') void refreshMeta()
}

onMounted(() => {
  filtersExpanded.value = window.matchMedia('(min-width: 768px)').matches
  window.addEventListener('focus', refreshSession)
  document.addEventListener('visibilitychange', refreshSession)
})
onBeforeUnmount(() => {
  window.removeEventListener('focus', refreshSession)
  document.removeEventListener('visibilitychange', refreshSession)
})

watch(isAuthenticated, (loggedIn) => {
  if (!loggedIn) year.value = ''
})
</script>

<template>
  <div class="flex h-screen flex-col overflow-hidden bg-slate-50" style="height:100dvh">
    <header class="z-20 flex h-16 shrink-0 items-center justify-between border-b bg-white px-4 md:px-6">
      <div class="flex min-w-0 items-center gap-3">
        <div class="shrink-0 rounded-xl bg-teal-700 p-2 text-white"><Map class="h-5 w-5" /></div>
        <div><h1 class="text-sm font-bold leading-tight tracking-tight text-slate-950 sm:text-base">Peta Perlengkapan Jalan</h1><p class="hidden text-xs text-slate-500 sm:block">Peta fasilitas transportasi</p></div>
      </div>
      <NuxtLink v-if="isAuthenticated" to="/admin" class="ml-2 inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"><Shield class="h-4 w-4 text-teal-700" />Admin</NuxtLink>
    </header>
    <div class="relative min-h-0 flex-1">
      <PublicMap :category="category" :district="district" :status="status" :year="isAuthenticated ? year : ''" :search="search" :authenticated="isAuthenticated">
        <template #filters>
          <div class="pointer-events-auto max-w-full rounded-2xl border bg-white/95 shadow-soft backdrop-blur" :class="filtersExpanded ? 'w-full max-w-sm p-4' : 'w-fit p-2'">
            <button
              type="button"
              class="flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-left text-sm font-semibold text-slate-800 hover:text-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600"
              :aria-expanded="filtersExpanded"
              aria-controls="public-map-filters"
              @click="filtersExpanded = !filtersExpanded"
            >
              <SlidersHorizontal class="h-4 w-4 shrink-0 text-teal-700" aria-hidden="true" />
              <span>Filter<span v-if="activeFilterCount" class="ml-1 font-normal text-teal-700"> · {{ activeFilterCount }} aktif</span></span>
              <ChevronUp v-if="filtersExpanded" class="ml-auto h-4 w-4 shrink-0" aria-hidden="true" />
              <ChevronDown v-else class="ml-auto h-4 w-4 shrink-0" aria-hidden="true" />
            </button>
            <div v-show="filtersExpanded" id="public-map-filters" class="mt-3">
              <div class="mb-4">
                <h2 class="font-semibold text-slate-950">Jelajahi Peta Perlengkapan Jalan</h2>
                <p class="mt-1 text-xs text-slate-500">Filter titik berdasarkan kategori, kecamatan, status<span v-if="isAuthenticated">, atau tahun anggaran</span>.</p>
              </div>
              <div class="space-y-3">
                <div class="relative"><Search class="absolute left-3 top-3 h-4 w-4 text-slate-400" /><UiInput v-model="search" class="pl-9" placeholder="Cari lokasi..." /></div>
                <div class="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
                  <UiSelect v-model="category"><option value="">Semua kategori</option><option v-for="c in meta?.categories || []" :key="c.id" :value="c.id">{{ c.name }}</option></UiSelect>
                  <UiSelect v-model="district"><option value="">Semua kecamatan</option><option v-for="d in meta?.districts || []" :key="d.id" :value="d.id">{{ d.name }}</option></UiSelect>
                </div>
                <div class="grid gap-2" :class="isAuthenticated ? 'grid-cols-1 min-[380px]:grid-cols-2' : 'grid-cols-1'">
                  <UiSelect v-model="status"><option value="">Semua status</option><option value="EXISTING">Terpasang</option><option value="PLANNED">Direncanakan</option></UiSelect>
                  <UiSelect v-if="isAuthenticated" v-model="year"><option value="">Semua tahun</option><option v-for="y in meta?.years || []" :key="y" :value="y">{{ y }}</option></UiSelect>
                </div>
                <button v-if="activeFilterCount" type="button" class="inline-flex items-center gap-1.5 rounded text-xs font-medium text-teal-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600" @click="resetFilters">
                  <RotateCcw class="h-3.5 w-3.5" aria-hidden="true" />Reset Filter
                </button>
              </div>
              <div class="mt-4 border-t pt-3">
                <div class="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Legenda status</div>
                <div class="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600">
                  <div class="flex items-center gap-2"><span class="h-4 w-4 rounded-full border-2 border-white bg-teal-700 shadow"></span>Terpasang</div>
                  <div class="flex items-center gap-2"><span class="h-4 w-4 rounded-full border-2 border-dashed border-teal-700 bg-white"></span>Direncanakan</div>
                </div>
                <div v-if="meta?.categories?.length" class="mt-3 flex flex-wrap gap-2">
                  <span v-for="c in meta.categories" :key="c.id" class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">
                    <span class="inline-flex" :style="{ color: c.color }" v-html="markerIconSvg(c.icon_key,{size:13,color:c.color,strokeWidth:2.2})"></span>{{ c.name }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </PublicMap>
    </div>
  </div>
</template>
