<script setup lang="ts">
import { apiPath } from '@/utils/api'
import { LayoutDashboard, MapPin, Upload, Tags, Users, ExternalLink, LogOut, Menu } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
const route=useRoute()
const mobileOpen=ref(false)
const { data: session } = await useFetch<any>(apiPath('/api/auth/me'))
const links=computed(()=>{
 const role=session.value?.user?.role
 const base=[
  {to:'/admin',label:'Dashboard',icon:LayoutDashboard},
  {to:'/admin/locations',label:'Locations',icon:MapPin},
  {to:'/admin/import',label:'Bulk Import',icon:Upload},
 ]
 if(role==='admin'||role==='gis_manager') base.push({to:'/admin/categories',label:'Categories',icon:Tags},{to:'/admin/users',label:'Users',icon:Users})
 return base
})
function active(to:string){return to==='/admin'?route.path===to:route.path.startsWith(to)}
async function logout(){await $fetch(apiPath('/api/auth/logout'),{method:'POST'});await navigateTo('/admin/login')}
watch(()=>route.path,()=>{mobileOpen.value=false})
</script>
<template>
<div class="min-h-screen bg-muted/30">
  <header class="sticky top-0 z-40 flex h-16 items-center border-b bg-background/95 px-4 backdrop-blur lg:hidden">
    <Button variant="ghost" size="icon" @click="mobileOpen=!mobileOpen"><Menu class="size-5" /></Button><div class="ml-3"><AppLogo /></div>
  </header>
  <div v-if="mobileOpen" class="fixed inset-0 z-50 bg-black/35 lg:hidden" @click="mobileOpen=false"><aside class="h-full w-72 bg-background p-4 shadow-xl" @click.stop><AppLogo /><Separator class="my-4" /><nav class="space-y-1"><NuxtLink v-for="item in links" :key="item.to" :to="item.to" :class="['flex items-center gap-3 rounded-md px-3 py-2 text-sm',active(item.to)?'bg-primary text-primary-foreground':'text-muted-foreground hover:bg-muted hover:text-foreground']"><component :is="item.icon" class="size-4" />{{item.label}}</NuxtLink></nav></aside></div>
  <aside class="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-background lg:flex lg:flex-col">
    <div class="p-5"><AppLogo /></div><Separator />
    <nav class="flex-1 space-y-1 p-3"><NuxtLink v-for="item in links" :key="item.to" :to="item.to" :class="['flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',active(item.to)?'bg-primary text-primary-foreground shadow-sm':'text-muted-foreground hover:bg-muted hover:text-foreground']"><component :is="item.icon" class="size-4" />{{item.label}}</NuxtLink></nav>
    <div class="p-3"><Separator class="mb-3" /><NuxtLink to="/" target="_blank" class="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted"><ExternalLink class="size-4" />Public map</NuxtLink><button class="mt-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground" @click="logout"><LogOut class="size-4" />Sign out</button></div>
  </aside>
  <main class="lg:pl-64"><div class="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8"><slot /></div></main>
</div>
</template>
