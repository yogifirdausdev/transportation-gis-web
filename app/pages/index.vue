<script setup lang="ts">
import { Map, Search, Shield } from 'lucide-vue-next'
const { data: meta } = await useFetch('/api/public/meta')
const category=ref(''); const district=ref(''); const year=ref(''); const search=ref('')
</script>
<template>
  <div class="flex h-screen min-h-[640px] flex-col overflow-hidden bg-slate-50">
    <header class="z-20 flex h-16 shrink-0 items-center justify-between border-b bg-white px-4 md:px-6">
      <div class="flex items-center gap-3"><div class="rounded-xl bg-teal-700 p-2 text-white"><Map class="h-5 w-5"/></div><div><h1 class="font-bold tracking-tight text-slate-950">Transportation GIS</h1><p class="hidden text-xs text-slate-500 sm:block">Peta fasilitas transportasi</p></div></div>
      <NuxtLink to="/admin" class="inline-flex h-9 items-center gap-2 rounded-lg border bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"><Shield class="h-4 w-4 text-teal-700"/>Admin</NuxtLink>
    </header>
    <div class="relative min-h-0 flex-1">
      <PublicMap :category="category" :district="district" :year="year" :search="search" />
      <div class="absolute left-4 top-4 z-[500] w-[calc(100%-2rem)] max-w-sm rounded-2xl border bg-white/95 p-4 shadow-soft backdrop-blur md:left-6 md:top-6">
        <div class="mb-4"><h2 class="font-semibold text-slate-950">Jelajahi data GIS</h2><p class="mt-1 text-xs text-slate-500">Filter titik berdasarkan kategori, kecamatan, atau tahun anggaran.</p></div>
        <div class="space-y-3">
          <div class="relative"><Search class="absolute left-3 top-3 h-4 w-4 text-slate-400"/><UiInput v-model="search" class="pl-9" placeholder="Cari lokasi..."/></div>
          <div class="grid grid-cols-2 gap-2">
            <UiSelect v-model="category"><option value="">Semua kategori</option><option v-for="c in meta?.categories || []" :key="c.id" :value="c.id">{{ c.name }}</option></UiSelect>
            <UiSelect v-model="district"><option value="">Semua kecamatan</option><option v-for="d in meta?.districts || []" :key="d.id" :value="d.id">{{ d.name }}</option></UiSelect>
          </div>
          <UiSelect v-model="year"><option value="">Semua tahun anggaran</option><option v-for="y in meta?.years || []" :key="y" :value="y">{{ y }}</option></UiSelect>
        </div>
      </div>
    </div>
  </div>
</template>
