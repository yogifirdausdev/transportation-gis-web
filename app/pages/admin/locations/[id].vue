<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
definePageMeta({layout:'admin',middleware:'admin'})
const route=useRoute(); const error=ref(''); const {data}=await useFetch(`/api/admin/locations/${route.params.id}`)
async function submit(fd:FormData){error.value='';try{await $fetch(`/api/admin/locations/${route.params.id}`,{method:'PUT',body:fd});await navigateTo('/admin/locations')}catch(e:any){error.value=e?.data?.statusMessage||'Gagal menyimpan'}}
</script>
<template><div class="space-y-6"><UiPageHeader title="Edit Location" description="Perubahan pada data hasil import akan ditandai agar tidak terhapus saat rollback batch."><NuxtLink to="/admin/locations"><UiButton variant="outline"><ArrowLeft class="h-4 w-4"/>Kembali</UiButton></NuxtLink></UiPageHeader><div v-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{error}}</div><LocationForm v-if="data?.location" :model="data.location" submit-label="Simpan Perubahan" @submit="submit"/></div></template>
