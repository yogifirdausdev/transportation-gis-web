<script setup lang="ts">
import { apiPath } from '@/utils/api'
import { MapPin, Tags, CircleCheck, CircleAlert, Upload, Plus } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
definePageMeta({middleware:'admin',layout:'admin'})
const {data}=await useFetch<any>(apiPath('/api/admin/dashboard'))
const cards=computed(()=>[
 {label:'Total Locations',value:data.value?.total||0,icon:MapPin},
 {label:'Categories',value:data.value?.categories||0,icon:Tags},
 {label:'Baik / Sesuai',value:data.value?.good||0,icon:CircleCheck},
 {label:'Perlu Tindak Lanjut',value:data.value?.bad||0,icon:CircleAlert},
])
</script>
<template><div class="space-y-6"><div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 class="text-2xl font-bold tracking-tight">Dashboard</h1><p class="mt-1 text-sm text-muted-foreground">Ringkasan data Transportation GIS.</p></div><div class="flex gap-2"><NuxtLink to="/admin/import"><Button variant="outline"><Upload class="size-4" />Import Excel</Button></NuxtLink><NuxtLink to="/admin/locations/new"><Button><Plus class="size-4" />Tambah lokasi</Button></NuxtLink></div></div><div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Card v-for="item in cards" :key="item.label"><CardHeader class="flex-row items-center justify-between space-y-0 pb-2"><CardTitle class="text-sm font-medium">{{item.label}}</CardTitle><component :is="item.icon" class="size-4 text-muted-foreground" /></CardHeader><CardContent><div class="text-2xl font-bold">{{Number(item.value).toLocaleString('id-ID')}}</div></CardContent></Card></div><Card><CardHeader><CardTitle class="text-base">Data per Kecamatan</CardTitle><CardDescription>Distribusi record yang sudah tersimpan.</CardDescription></CardHeader><CardContent><div class="grid gap-2 md:grid-cols-2 xl:grid-cols-3"><div v-for="row in data?.districts||[]" :key="row.district" class="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"><span>{{row.district||'Tanpa kecamatan'}}</span><strong>{{row.count}}</strong></div></div></CardContent></Card></div></template>
