<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
definePageMeta({layout:'admin',middleware:'admin'})
const error=ref('')
async function submit(fd:FormData){error.value='';try{await $fetch('/api/admin/locations',{method:'POST',body:fd});await navigateTo('/admin/locations')}catch(e:any){error.value=e?.data?.statusMessage||'Gagal menyimpan'}}
</script>
<template><div class="space-y-6"><UiPageHeader title="Tambah Lokasi" description="Input satu titik GIS secara manual."><NuxtLink to="/admin/locations"><UiButton variant="outline"><ArrowLeft class="h-4 w-4"/>Kembali</UiButton></NuxtLink></UiPageHeader><div v-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{error}}</div><LocationForm @submit="submit"/></div></template>
