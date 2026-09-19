<script setup lang="ts">
definePageMeta({ layout:'admin', middleware:'auth' })
const { data, refresh } = await useFetch(useApiUrl('/api/admin/categories'))
const form = reactive({ name:'', slug:'', markerColor:'#eab308', icon:'pin' })
const error = ref('')
const saving = ref(false)
function slugify() { if (!form.slug) form.slug = form.name.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') }
async function add() {
  saving.value=true; error.value=''; slugify()
  try { await $fetch(useApiUrl('/api/admin/categories'),{method:'POST',body:form}); Object.assign(form,{name:'',slug:'',markerColor:'#eab308',icon:'pin'}); await refresh() }
  catch(e:any){ error.value=e?.data?.statusMessage||'Gagal menambah kategori' } finally{ saving.value=false }
}
async function update(c:any){
  try{ await $fetch(useApiUrl(`/api/admin/categories/${c.id}`),{method:'PATCH',body:{name:c.name,markerColor:c.marker_color,icon:c.icon}}); await refresh() }
  catch(e:any){ alert(e?.data?.statusMessage||'Gagal menyimpan') }
}
</script>
<template>
  <div>
    <div class="page-head"><div><div class="eyebrow">Configuration</div><h1>Categories</h1><p>Siapkan layer baru seperti CCTV, APILL, halte, rambu, atau aset lainnya.</p></div></div>
    <div class="card" style="margin-bottom:16px"><div class="card-head"><h2>Tambah Category</h2></div><form class="card-body" @submit.prevent="add">
      <div v-if="error" class="notice notice-error">{{ error }}</div><div class="form-grid">
        <div class="form-field"><label>Nama</label><input v-model="form.name" class="input" required @blur="slugify"></div>
        <div class="form-field"><label>Slug</label><input v-model="form.slug" class="input" required placeholder="traffic-light"></div>
        <div class="form-field"><label>Marker color</label><input v-model="form.markerColor" type="color" class="input" style="height:42px;padding:5px"></div>
        <div class="form-field"><label>Icon key</label><input v-model="form.icon" class="input"></div>
      </div><button class="btn btn-primary" style="margin-top:14px" :disabled="saving">Tambah</button>
    </form></div>
    <div class="card"><div class="table-wrap"><table><thead><tr><th>Category</th><th>Slug</th><th>Marker</th><th>Icon</th><th></th></tr></thead><tbody>
      <tr v-for="c in data?.categories || []" :key="c.id"><td><input v-model="c.name" class="input"></td><td>{{ c.slug }}</td><td><input v-model="c.marker_color" type="color" style="width:46px;height:32px;border:0;background:transparent"></td><td><input v-model="c.icon" class="input" style="width:120px"></td><td><button class="btn btn-sm" @click="update(c)">Save</button></td></tr>
    </tbody></table></div></div>
  </div>
</template>
