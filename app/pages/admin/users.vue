<script setup lang="ts">
definePageMeta({ layout:'admin', middleware:'auth' })
const { data, refresh } = await useFetch(useApiUrl('/api/admin/users'))
const show = ref(false); const saving=ref(false); const error=ref('')
const form=reactive({name:'',email:'',password:'',role:'gis_editor'})
async function createUser(){ saving.value=true;error.value='';try{await $fetch(useApiUrl('/api/admin/users'),{method:'POST',body:form});show.value=false;Object.assign(form,{name:'',email:'',password:'',role:'gis_editor'});await refresh()}catch(e:any){error.value=e?.data?.statusMessage||'Gagal membuat user'}finally{saving.value=false}}
async function save(u:any){try{await $fetch(useApiUrl(`/api/admin/users/${u.id}`),{method:'PATCH',body:{name:u.name,role:u.role,password:''}});await refresh()}catch(e:any){alert(e?.data?.statusMessage||'Gagal menyimpan')}}
</script>
<template><div>
  <div class="page-head"><div><div class="eyebrow">Access Control</div><h1>Users</h1><p>GIS Editor hanya mengelola data GIS. GIS Manager juga dapat mengatur kategori dan menghapus data.</p></div><button class="btn btn-primary" @click="show=true">＋ User</button></div>
  <div class="card"><div class="table-wrap"><table><thead><tr><th>Nama</th><th>Email</th><th>Role</th><th>Dibuat</th><th></th></tr></thead><tbody>
    <tr v-for="u in data?.users || []" :key="u.id"><td><input v-model="u.name" class="input"></td><td>{{ u.email }}</td><td><select v-model="u.role" class="select" style="width:160px"><option value="admin">Admin</option><option value="gis_manager">GIS Manager</option><option value="gis_editor">GIS Editor</option></select></td><td>{{ new Date(u.created_at).toLocaleDateString('id-ID') }}</td><td><button class="btn btn-sm" @click="save(u)">Save</button></td></tr>
  </tbody></table></div></div>
  <div v-if="show" class="modal-backdrop" @click.self="show=false"><form class="modal" @submit.prevent="createUser"><div class="modal-head"><h2>Tambah User GIS</h2><button type="button" class="close-btn" @click="show=false">×</button></div><div class="modal-body"><div v-if="error" class="notice notice-error">{{ error }}</div><div class="form-grid">
    <div class="form-field"><label>Nama</label><input v-model="form.name" class="input" required></div><div class="form-field"><label>Email</label><input v-model="form.email" type="email" class="input" required></div><div class="form-field"><label>Password awal</label><input v-model="form.password" type="password" class="input" minlength="8" required></div><div class="form-field"><label>Role</label><select v-model="form.role" class="select"><option value="gis_editor">GIS Editor</option><option value="gis_manager">GIS Manager</option><option value="admin">Admin</option></select></div>
  </div></div><div class="modal-actions"><button type="button" class="btn" @click="show=false">Batal</button><button class="btn btn-primary" :disabled="saving">Buat User</button></div></form></div>
</div></template>
