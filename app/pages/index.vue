<script setup lang="ts">
import { apiPath } from '@/utils/api'
import { SlidersHorizontal, MapPinned, ShieldCheck } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Category } from '@/types/gis'

const filters=reactive({q:'',category:'',condition:'',district:''})
const count=ref(0)
const sidebarOpen=ref(false)
const {data:meta}=await useFetch<{categories:Category[];districts:string[];total:number}>(apiPath('/api/meta'),{default:()=>({categories:[],districts:[],total:0})})
function reset(){Object.assign(filters,{q:'',category:'',condition:'',district:''})}
</script>
<template>
<div class="flex min-h-dvh flex-col bg-background">
  <header class="z-20 flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 sm:px-6">
    <AppLogo />
    <div class="flex items-center gap-2"><Badge variant="secondary" class="hidden sm:inline-flex"><ShieldCheck class="mr-1 size-3" />Public GIS</Badge><Button variant="outline" size="sm" class="lg:hidden" @click="sidebarOpen=!sidebarOpen"><SlidersHorizontal class="size-4" />Filter</Button><NuxtLink to="/admin/login"><Button size="sm" variant="ghost">Admin</Button></NuxtLink></div>
  </header>
  <div class="relative flex h-[calc(100dvh-4rem)] min-h-0 flex-1">
    <aside :class="['absolute inset-y-0 left-0 z-[700] w-[320px] border-r bg-background p-4 shadow-xl transition-transform lg:relative lg:z-auto lg:block lg:translate-x-0 lg:shadow-none',sidebarOpen?'translate-x-0':'-translate-x-full']">
      <Card class="border-0 shadow-none"><CardHeader class="px-1 pt-1"><CardTitle class="flex items-center gap-2 text-base"><MapPinned class="size-4" />Eksplorasi Peta</CardTitle><CardDescription>Filter fasilitas transportasi yang tampil pada area peta.</CardDescription></CardHeader><CardContent class="px-1"><MapFilters v-model="filters" :categories="meta?.categories||[]" :districts="meta?.districts||[]" @reset="reset" /></CardContent></Card>
      <div class="mt-5 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground"><div class="font-medium text-foreground">{{ count.toLocaleString('id-ID') }} titik terlihat</div><div class="mt-1">Total database: {{ Number(meta?.total||0).toLocaleString('id-ID') }}</div></div>
    </aside>
    <button v-if="sidebarOpen" class="absolute inset-0 z-[650] bg-black/25 lg:hidden" aria-label="Close filters" @click="sidebarOpen=false" />
    <section class="relative min-w-0 flex-1"><ClientOnly><GisMap :filters="filters" @count="count=$event" /><template #fallback><div class="grid h-full min-h-[500px] place-items-center bg-muted text-sm text-muted-foreground">Menyiapkan peta...</div></template></ClientOnly></section>
  </div>
</div>
</template>
