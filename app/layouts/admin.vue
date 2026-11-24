<script setup lang="ts">
import { LayoutDashboard, MapPinned, Upload, Tags, LogOut, Map, History, Users, Menu } from 'lucide-vue-next'
const route = useRoute()
const user = useState<any>('auth-user')
const items = computed(() => [
  { to:'/admin', label:'Dashboard', icon:LayoutDashboard },
  { to:'/admin/locations', label:'Lokasi', icon:MapPinned },
  { to:'/admin/imports', label:'Impor Massal', icon:Upload },
  { to:'/admin/imports/history', label:'Riwayat Impor', icon:History },
  ...(user.value?.role === 'admin' || user.value?.role === 'manager' ? [{ to:'/admin/categories', label:'Kategori', icon:Tags }] : []),
  ...(user.value?.role === 'admin' ? [{ to:'/admin/users', label:'Users', icon:Users }] : [])
])
async function logout(){ await $fetch('/api/auth/logout',{method:'POST'}); await navigateTo('/admin/login') }
</script>
<template>
  <div class="min-h-screen bg-slate-50">
    <aside class="fixed inset-y-0 left-0 hidden w-64 border-r bg-white lg:block">
      <div class="flex h-16 items-center gap-3 border-b px-5">
        <div class="rounded-xl bg-teal-700 p-2 text-white"><Map class="h-5 w-5"/></div>
        <div><div class="font-bold text-slate-950">Peta Perlengkapan Jalan</div><div class="text-xs text-slate-500">Administrasi</div></div>
      </div>
      <nav class="space-y-1 p-3">
        <NuxtLink v-for="item in items" :key="item.to" :to="item.to" class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition" :class="route.path===item.to || (item.to!='/admin' && route.path.startsWith(item.to)) ? 'bg-teal-50 text-teal-800' : 'text-slate-600 hover:bg-slate-100'">
          <component :is="item.icon" class="h-4 w-4"/> {{ item.label }}
        </NuxtLink>
      </nav>
      <div class="absolute bottom-0 w-full border-t p-4">
        <div class="mb-3 min-w-0"><div class="truncate text-sm font-medium">{{ user?.name }}</div><div class="truncate text-xs text-slate-500">{{ user?.email }}</div></div>
        <UiButton variant="ghost" class="w-full justify-start" @click="logout"><LogOut class="h-4 w-4"/> Keluar</UiButton>
      </div>
    </aside>
    <div class="lg:pl-64">
      <header class="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white/90 px-4 backdrop-blur md:px-7">
        <div class="flex items-center gap-3">
          <details class="relative lg:hidden">
            <summary class="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-lg border bg-white text-slate-700"><Menu class="h-4 w-4"/></summary>
            <div class="absolute left-0 top-11 w-56 rounded-xl border bg-white p-2 shadow-soft">
              <NuxtLink v-for="item in items" :key="item.to" :to="item.to" class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-50"><component :is="item.icon" class="h-4 w-4"/>{{item.label}}</NuxtLink>
            </div>
          </details>
          <NuxtLink to="/" class="text-sm font-medium text-teal-700 hover:text-teal-900">← Peta Publik</NuxtLink>
        </div>
        <div class="text-sm capitalize text-slate-500">{{ user?.role }}</div>
      </header>
      <main class="p-4 md:p-7"><slot/></main>
    </div>
  </div>
</template>
