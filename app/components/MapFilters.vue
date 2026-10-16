<script setup lang="ts">
import { Search, RotateCcw } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import type { Category } from '@/types/gis'

const props = defineProps<{ categories: Category[]; districts: string[]; loading?: boolean }>()
const model = defineModel<{ q:string; category:string; condition:string; district:string }>({ required: true })
const emit = defineEmits<{ reset: [] }>()
</script>
<template>
  <div class="space-y-5">
    <div class="space-y-2">
      <Label>Pencarian</Label>
      <div class="relative"><Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input v-model="model.q" class="pl-9" placeholder="Nama jalan atau lokasi..." /></div>
    </div>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
      <div class="space-y-2"><Label>Kategori</Label><Select v-model="model.category"><option value="">Semua kategori</option><option v-for="cat in props.categories" :key="cat.id" :value="cat.slug">{{ cat.name }}</option></Select></div>
      <div class="space-y-2"><Label>Kondisi</Label><Select v-model="model.condition"><option value="">Semua kondisi</option><option value="good">Baik / Sesuai</option><option value="bad">Tidak Baik / Tidak Sesuai</option><option value="unassessed">Belum Dinilai</option></Select></div>
      <div class="space-y-2 sm:col-span-2 lg:col-span-1"><Label>Kecamatan</Label><Select v-model="model.district"><option value="">Semua kecamatan</option><option v-for="district in props.districts" :key="district" :value="district">{{ district }}</option></Select></div>
    </div>
    <Button variant="outline" class="w-full" :disabled="props.loading" @click="emit('reset')"><RotateCcw class="size-4" />Reset filter</Button>
  </div>
</template>
