<script setup lang="ts">
import { MapPin, Building2, Upload, Tags } from 'lucide-vue-next'
definePageMeta({layout:'admin',middleware:'admin'})
const {data}=await useFetch('/api/admin/dashboard')
const cards=computed(()=>[
  {label:'Total Lokasi',value:data.value?.locations||0,icon:MapPin},
  {label:'Kecamatan Terisi',value:data.value?.districts||0,icon:Building2},
  {label:'Batch Impor',value:data.value?.imports||0,icon:Upload},
  {label:'Kategori',value:data.value?.categories||0,icon:Tags}
])
</script>
<template>
  <div class="space-y-6">
    <UiPageHeader title="Dashboard" description="Ringkasan data Peta Perlengkapan Jalan."/>
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <UiCard v-for="c in cards" :key="c.label" class="p-5"><div class="flex items-start justify-between"><div><div class="text-sm text-slate-500">{{c.label}}</div><div class="mt-2 text-3xl font-bold tracking-tight">{{c.value}}</div></div><div class="rounded-xl bg-teal-50 p-2.5 text-teal-700"><component :is="c.icon" class="h-5 w-5"/></div></div></UiCard>
    </div>
    <UiCard class="overflow-hidden"><div class="border-b px-5 py-4"><h2 class="font-semibold">Aksi cepat</h2></div><div class="grid gap-3 p-5 md:grid-cols-3"><NuxtLink to="/admin/locations/new" class="rounded-xl border p-4 transition hover:border-teal-300 hover:bg-teal-50"><div class="font-medium">Tambah Lokasi</div><p class="mt-1 text-sm text-slate-500">Input satu titik secara manual.</p></NuxtLink><NuxtLink to="/admin/imports" class="rounded-xl border p-4 transition hover:border-teal-300 hover:bg-teal-50"><div class="font-medium">Impor Massal</div><p class="mt-1 text-sm text-slate-500">Pratinjau dan impor template Excel standar.</p></NuxtLink><NuxtLink to="/admin/categories" class="rounded-xl border p-4 transition hover:border-teal-300 hover:bg-teal-50"><div class="font-medium">Atur Marker</div><p class="mt-1 text-sm text-slate-500">Atur warna dan ikon setiap kategori.</p></NuxtLink></div></UiCard>
  </div>
</template>
