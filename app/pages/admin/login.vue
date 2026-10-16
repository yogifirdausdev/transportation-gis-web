<script setup lang="ts">
import { Map, LogIn } from 'lucide-vue-next'
const email=ref(''); const password=ref(''); const loading=ref(false); const error=ref('')
async function submit(){ loading.value=true; error.value=''; try { await $fetch('/api/auth/login',{method:'POST',body:{email:email.value,password:password.value}}); await navigateTo('/admin') } catch(e:any){ error.value=e?.data?.statusMessage || 'Login gagal' } finally{loading.value=false} }
</script>
<template>
  <div class="grid min-h-screen place-items-center bg-gradient-to-br from-slate-50 via-white to-teal-50 p-4">
    <UiCard class="w-full max-w-md overflow-hidden">
      <div class="border-b bg-gradient-to-r from-teal-800 to-teal-600 p-6 text-white">
        <div class="mb-4 inline-flex rounded-xl bg-white/15 p-2.5"><Map class="h-6 w-6"/></div>
        <h1 class="text-2xl font-bold">Transportation GIS</h1><p class="mt-1 text-sm text-teal-50">Masuk untuk mengelola data GIS.</p>
      </div>
      <form class="space-y-5 p-6" @submit.prevent="submit">
        <div v-if="error" class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{{ error }}</div>
        <div class="space-y-2"><UiLabel>Email</UiLabel><UiInput v-model="email" type="email" placeholder="admin@example.com"/></div>
        <div class="space-y-2"><UiLabel>Password</UiLabel><UiInput v-model="password" type="password"/></div>
        <UiButton type="submit" class="w-full" :disabled="loading"><LogIn class="h-4 w-4"/>{{ loading?'Signing in...':'Sign in' }}</UiButton>
        <NuxtLink to="/" class="block text-center text-sm text-teal-700 hover:underline">Kembali ke public map</NuxtLink>
      </form>
    </UiCard>
  </div>
</template>
