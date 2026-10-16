<script setup lang="ts">
import { Plus, Save, Palette } from 'lucide-vue-next'
definePageMeta({layout:'admin',middleware:'admin'})
const me=useState<any>('auth-user'); if(me.value?.role==='editor') await navigateTo('/admin')
const {data,refresh}=await useFetch('/api/admin/categories')
const newName=ref(''); const newColor=ref('#0F766E'); const message=ref(''); const error=ref('')
async function save(c:any){error.value='';message.value='';try{await $fetch(`/api/admin/categories/${c.id}`,{method:'PUT',body:{name:c.name,color:c.color}});message.value='Kategori diperbarui.';await refresh()}catch(e:any){error.value=e?.data?.statusMessage||'Gagal menyimpan'}}
async function add(){try{await $fetch('/api/admin/categories',{method:'POST',body:{name:newName.value,color:newColor.value}});newName.value='';newColor.value='#0F766E';await refresh()}catch(e:any){error.value=e?.data?.statusMessage||'Gagal menambah kategori'}}
</script>
<template><div class="space-y-6"><UiPageHeader title="Categories" description="Warna kategori langsung menentukan warna marker di peta."/>
<div v-if="message" class="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{{message}}</div><div v-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{error}}</div>
<div class="grid gap-4 lg:grid-cols-[1fr_360px]"><UiCard class="overflow-hidden"><div class="border-b px-5 py-4"><h2 class="font-semibold">Kategori tersedia</h2></div><div class="divide-y"><div v-for="c in data?.categories||[]" :key="c.id" class="flex flex-col gap-4 p-5 sm:flex-row sm:items-end"><div class="flex-1 space-y-2"><UiLabel>Nama kategori</UiLabel><UiInput v-model="c.name"/></div><div class="space-y-2"><UiLabel>Warna marker</UiLabel><div class="flex items-center gap-2"><input v-model="c.color" type="color" class="h-10 w-12 cursor-pointer rounded-lg border bg-white p-1"><UiInput v-model="c.color" class="w-28 font-mono"/></div></div><UiButton @click="save(c)"><Save class="h-4 w-4"/>Save</UiButton></div></div></UiCard>
<UiCard class="h-fit p-5"><div class="mb-4 flex items-center gap-2"><Palette class="h-5 w-5 text-teal-700"/><h2 class="font-semibold">Tambah kategori</h2></div><div class="space-y-4"><div class="space-y-2"><UiLabel>Nama</UiLabel><UiInput v-model="newName" placeholder="Contoh: CCTV"/></div><div class="space-y-2"><UiLabel>Warna</UiLabel><div class="flex gap-2"><input v-model="newColor" type="color" class="h-10 w-12 rounded-lg border p-1"><UiInput v-model="newColor"/></div></div><UiButton class="w-full" @click="add"><Plus class="h-4 w-4"/>Tambah</UiButton></div></UiCard></div></div></template>
