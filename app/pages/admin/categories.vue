<script setup lang="ts">
import { apiPath } from '@/utils/api'
import { Plus, Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Category } from '@/types/gis'
definePageMeta({middleware:'admin',layout:'admin'})
const {data,refresh}=await useFetch<{items:Category[]}>(apiPath('/api/admin/categories'),{default:()=>({items:[]})})
const name=ref('');const color=ref('#1d4ed8')
async function add(){if(!name.value.trim())return;await $fetch(apiPath('/api/admin/categories'),{method:'POST',body:{name:name.value,color:color.value}});name.value='';await refresh()}
async function remove(id:number){if(!confirm('Hapus kategori? Kategori yang masih dipakai tidak dapat dihapus.'))return;try{await $fetch(apiPath(`/api/admin/categories/${id}`),{method:'DELETE'});await refresh()}catch(e:any){alert(e?.data?.statusMessage||'Kategori gagal dihapus.')}}
</script>
<template><div class="space-y-6"><div><h1 class="text-2xl font-bold tracking-tight">Categories</h1><p class="mt-1 text-sm text-muted-foreground">Tambahkan layer/jenis aset baru tanpa mengubah struktur database.</p></div><div class="grid gap-6 lg:grid-cols-[360px_1fr]"><Card><CardHeader><CardTitle class="text-base">Kategori Baru</CardTitle><CardDescription>Contoh: CCTV, APILL, Halte, Rambu.</CardDescription></CardHeader><CardContent class="space-y-4"><div class="space-y-2"><Label>Nama</Label><Input v-model="name" placeholder="CCTV" /></div><div class="space-y-2"><Label>Warna marker</Label><div class="flex gap-2"><input v-model="color" type="color" class="h-10 w-14 rounded-md border bg-background p-1" /><Input v-model="color" /></div></div><Button class="w-full" @click="add"><Plus class="size-4" />Tambah kategori</Button></CardContent></Card><Card><CardHeader><CardTitle class="text-base">Daftar Kategori</CardTitle></CardHeader><CardContent><div class="divide-y"><div v-for="cat in data.items" :key="cat.id" class="flex items-center justify-between py-3"><div class="flex items-center gap-3"><span class="size-3 rounded-full" :style="{backgroundColor:cat.color}" /><div><div class="text-sm font-medium">{{cat.name}}</div><div class="text-xs text-muted-foreground">{{cat.slug}}</div></div></div><Button variant="ghost" size="icon" @click="remove(cat.id)"><Trash2 class="size-4 text-destructive" /></Button></div></div></CardContent></Card></div></div></template>
