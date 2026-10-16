<script setup lang="ts">
import { apiPath } from '@/utils/api'
import { UserPlus, Shield } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
definePageMeta({middleware:'admin',layout:'admin'})
const {data,refresh}=await useFetch<any>(apiPath('/api/admin/users'),{default:()=>({items:[],me:null})})
const form=reactive({name:'',email:'',password:'',role:'gis_editor'})
const error=ref('')
async function add(){error.value='';try{await $fetch(apiPath('/api/admin/users'),{method:'POST',body:form});Object.assign(form,{name:'',email:'',password:'',role:'gis_editor'});await refresh()}catch(e:any){error.value=e?.data?.statusMessage||'User gagal dibuat.'}}
</script>
<template><div class="space-y-6"><div><h1 class="text-2xl font-bold tracking-tight">Users</h1><p class="mt-1 text-sm text-muted-foreground">Akses admin GIS terpisah dari WordPress.</p></div><div class="grid gap-6 lg:grid-cols-[380px_1fr]"><Card><CardHeader><CardTitle class="text-base">Tambah User</CardTitle><CardDescription>GIS Editor hanya mengelola data GIS. GIS Manager juga mengelola kategori dan operator.</CardDescription></CardHeader><CardContent class="space-y-4"><div v-if="error" class="text-sm text-destructive">{{error}}</div><div class="space-y-2"><Label>Nama</Label><Input v-model="form.name" /></div><div class="space-y-2"><Label>Email</Label><Input v-model="form.email" type="email" /></div><div class="space-y-2"><Label>Password</Label><Input v-model="form.password" type="password" /></div><div class="space-y-2"><Label>Role</Label><Select v-model="form.role"><option value="gis_editor">GIS Editor</option><option value="gis_manager">GIS Manager</option><option value="admin">Administrator</option></Select></div><Button class="w-full" @click="add"><UserPlus class="size-4" />Tambah user</Button></CardContent></Card><Card><CardHeader><CardTitle class="flex items-center gap-2 text-base"><Shield class="size-4" />User Aktif</CardTitle></CardHeader><CardContent><div class="divide-y"><div v-for="user in data.items" :key="user.id" class="flex items-center justify-between py-3"><div><div class="text-sm font-medium">{{user.name}}</div><div class="text-xs text-muted-foreground">{{user.email}}</div></div><div class="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">{{user.role}}</div></div></div></CardContent></Card></div></div></template>
