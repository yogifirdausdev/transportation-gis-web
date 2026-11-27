<script setup lang="ts">
import { Plus, Save } from 'lucide-vue-next'
definePageMeta({layout:'admin',middleware:'admin'})
const me=useState<any>('auth-user'); if(me.value?.role!=='admin') await navigateTo('/admin')
const {data,refresh}=await useFetch('/api/admin/users'); const addForm=reactive({name:'',email:'',password:'',role:'editor'}); const error=ref(''); const notice=ref(''); const busy=ref('')
async function add(){
  error.value=''; notice.value=''; busy.value='add'
  try{
    const name=addForm.name.trim()
    await $fetch('/api/admin/users',{method:'POST',body:addForm})
    Object.assign(addForm,{name:'',email:'',password:'',role:'editor'})
    await refresh()
    notice.value=`User ${name} berhasil ditambahkan.`
  }catch(e:any){error.value=e?.data?.statusMessage||'Gagal menambah user'}
  finally{busy.value=''}
}
async function save(u:any){
  error.value=''; notice.value=''; busy.value=u.id
  try{
    const passwordChanged=Boolean(u.newPassword)
    await $fetch(`/api/admin/users/${u.id}`,{method:'PUT',body:{name:u.name,email:u.email,role:u.role,is_active:u.is_active,password:u.newPassword||undefined}})
    u.newPassword=''
    await refresh()
    notice.value=`Perubahan user ${u.name.trim()} disimpan${passwordChanged?', termasuk kata sandi baru':''}.`
  }catch(e:any){error.value=e?.data?.statusMessage||'Gagal menyimpan user'}
  finally{busy.value=''}
}
</script>
<template><div class="space-y-6"><UiPageHeader title="Users" description="Kelola akun dan peran Admin, GIS Manager, serta GIS Editor."/><UiAlert v-if="notice" variant="success" @close="notice=''">{{notice}}</UiAlert><UiAlert v-if="error" variant="error" @close="error=''">{{error}}</UiAlert><div class="grid gap-4 xl:grid-cols-[1fr_360px]"><UiCard class="overflow-hidden"><div class="divide-y"><div v-for="u in data?.users||[]" :key="u.id" class="grid gap-3 p-5 md:grid-cols-[1fr_1fr_160px_130px_auto]"><UiInput v-model="u.name"/><UiInput v-model="u.email"/><UiSelect v-model="u.role"><option value="admin">Admin</option><option value="manager">GIS Manager</option><option value="editor">GIS Editor</option></UiSelect><label class="flex items-center gap-2 text-sm"><input v-model="u.is_active" type="checkbox">Aktif</label><UiButton size="sm" :disabled="busy===u.id" @click="save(u)"><Save class="h-4 w-4"/>{{busy===u.id?'Menyimpan…':'Simpan'}}</UiButton><div class="md:col-span-5"><UiInput v-model="u.newPassword" type="password" placeholder="Kata sandi baru (opsional)"/></div></div></div></UiCard><UiCard class="h-fit p-5"><h2 class="mb-4 font-semibold">Tambah User</h2><div class="space-y-3"><UiInput v-model="addForm.name" placeholder="Nama"/><UiInput v-model="addForm.email" type="email" placeholder="Email"/><UiInput v-model="addForm.password" type="password" placeholder="Kata sandi min. 8 karakter"/><UiSelect v-model="addForm.role"><option value="editor">GIS Editor</option><option value="manager">GIS Manager</option><option value="admin">Admin</option></UiSelect><UiButton class="w-full" :disabled="busy==='add'" @click="add"><Plus class="h-4 w-4"/>{{busy==='add'?'Menambahkan…':'Tambah User'}}</UiButton></div></UiCard></div></div></template>
