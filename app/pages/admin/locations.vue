<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })
const user = useState<any>('auth-user')
const search = ref('')
const categoryFilter = ref('all')
const conditionFilter = ref('all')
const page = ref(1)
const perPage = 25
const showModal = ref(false)
const saving = ref(false)
const error = ref('')
const editingId = ref<string | null>(null)
const { data: catData } = await useFetch(useApiUrl('/api/admin/categories'))
const categories = computed<any[]>(() => catData.value?.categories || [])

const form = reactive({
  categoryId: '', name: '', district: '', address: '', condition: 'unassessed',
  latitude: '' as string | number, longitude: '' as string | number,
  roadWidth: '' as string | number, speedBumpUnits: '' as string | number,
  speedBumpMeters: '' as string | number, endcapUnits: '' as string | number
})

const query = computed(() => ({ page: page.value, perPage, search: search.value || undefined, category: categoryFilter.value, condition: conditionFilter.value }))
const { data, refresh, pending } = await useFetch(useApiUrl('/api/admin/locations'), { query, watch: [query] })
const totalPages = computed(() => Math.max(1, Math.ceil((data.value?.total || 0) / perPage)))

watch([search, categoryFilter, conditionFilter], () => { page.value = 1 })

function resetForm() {
  editingId.value = null
  Object.assign(form, { categoryId: categories.value[0]?.id || '', name:'', district:'', address:'', condition:'unassessed', latitude:'', longitude:'', roadWidth:'', speedBumpUnits:'', speedBumpMeters:'', endcapUnits:'' })
  error.value = ''
}
function openCreate() { resetForm(); showModal.value = true }
function openEdit(item: any) {
  editingId.value = item.id
  Object.assign(form, {
    categoryId:item.category_id, name:item.name, district:item.district || '', address:item.address || '', condition:item.condition,
    latitude:item.latitude, longitude:item.longitude, roadWidth:item.details?.roadWidth ?? '', speedBumpUnits:item.details?.speedBumpUnits ?? '',
    speedBumpMeters:item.details?.speedBumpMeters ?? '', endcapUnits:item.details?.endcapUnits ?? ''
  })
  error.value=''; showModal.value=true
}
function numOrNull(v: any) { return v === '' || v == null ? null : Number(v) }
async function save() {
  saving.value = true; error.value = ''
  const body = {
    categoryId: form.categoryId, name: form.name, district: form.district || null, address: form.address || null,
    condition: form.condition, latitude: Number(form.latitude), longitude: Number(form.longitude),
    details: { roadWidth:numOrNull(form.roadWidth), speedBumpUnits:numOrNull(form.speedBumpUnits), speedBumpMeters:numOrNull(form.speedBumpMeters), endcapUnits:numOrNull(form.endcapUnits) }
  }
  try {
    if (editingId.value) await $fetch(useApiUrl(`/api/admin/locations/${editingId.value}`), { method:'PATCH', body })
    else await $fetch(useApiUrl('/api/admin/locations'), { method:'POST', body })
    showModal.value=false; await refresh()
  } catch (e:any) { error.value = e?.data?.statusMessage || e?.statusMessage || 'Gagal menyimpan data' }
  finally { saving.value=false }
}
async function remove(item:any) {
  if (!confirm(`Hapus lokasi “${item.name}”?`)) return
  try { await $fetch(useApiUrl(`/api/admin/locations/${item.id}`), { method:'DELETE' }); await refresh() }
  catch (e:any) { alert(e?.data?.statusMessage || 'Gagal menghapus') }
}
</script>

<template>
  <div>
    <div class="page-head">
      <div><div class="eyebrow">Data Management</div><h1>Locations</h1><p>Kelola seluruh titik GIS yang tampil pada public map.</p></div>
      <button class="btn btn-primary" @click="openCreate">＋ Tambah Lokasi</button>
    </div>
    <div class="toolbar">
      <input v-model="search" class="input" placeholder="Cari lokasi…">
      <select v-model="categoryFilter" class="select"><option value="all">Semua kategori</option><option v-for="c in categories" :key="c.id" :value="c.slug">{{ c.name }}</option></select>
      <select v-model="conditionFilter" class="select"><option value="all">Semua kondisi</option><option value="good">Baik / Sesuai</option><option value="bad">Tidak Baik</option><option value="unassessed">Belum Dinilai</option></select>
      <span style="margin-left:auto;font-size:10px;color:#6c7688">{{ data?.total || 0 }} records</span>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Lokasi</th><th>Kategori</th><th>Kecamatan</th><th>Koordinat</th><th>Kondisi</th><th>Foto</th><th></th></tr></thead>
          <tbody>
            <tr v-for="item in data?.locations || []" :key="item.id">
              <td><div class="table-title">{{ item.name }}</div><div class="table-sub">{{ item.address || item.source_file || 'Manual entry' }}</div></td>
              <td>{{ item.category_name }}</td><td>{{ item.district || '—' }}</td>
              <td style="white-space:nowrap">{{ Number(item.latitude).toFixed(5) }}, {{ Number(item.longitude).toFixed(5) }}</td>
              <td><StatusBadge :status="item.condition" /></td><td>{{ (item.before_photo_url?1:0)+(item.after_photo_url?1:0) }}/2</td>
              <td style="white-space:nowrap"><button class="btn btn-sm" @click="openEdit(item)">Edit</button> <button v-if="user?.role !== 'gis_editor'" class="btn btn-sm btn-danger" @click="remove(item)">Hapus</button></td>
            </tr>
            <tr v-if="!pending && !data?.locations?.length"><td colspan="7" class="empty">Tidak ada data yang cocok.</td></tr>
          </tbody>
        </table>
      </div>
      <div class="pager"><button class="btn btn-sm" :disabled="page<=1" @click="page--">←</button><span>Page {{ page }} / {{ totalPages }}</span><button class="btn btn-sm" :disabled="page>=totalPages" @click="page++">→</button></div>
    </div>

    <div v-if="showModal" class="modal-backdrop" @click.self="showModal=false">
      <form class="modal" @submit.prevent="save">
        <div class="modal-head"><h2>{{ editingId ? 'Edit Location' : 'Tambah Location' }}</h2><button type="button" class="close-btn" @click="showModal=false">×</button></div>
        <div class="modal-body">
          <div v-if="error" class="notice notice-error">{{ error }}</div>
          <div class="form-grid">
            <div class="form-field full"><label>Nama / Lokasi Kegiatan</label><input v-model="form.name" class="input" required></div>
            <div class="form-field"><label>Kategori</label><select v-model="form.categoryId" class="select" required><option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option></select></div>
            <div class="form-field"><label>Kondisi</label><select v-model="form.condition" class="select"><option value="good">Baik / Sesuai</option><option value="bad">Tidak Baik</option><option value="unassessed">Belum Dinilai</option></select></div>
            <div class="form-field"><label>Kecamatan</label><input v-model="form.district" class="input"></div>
            <div class="form-field"><label>Alamat tambahan</label><input v-model="form.address" class="input"></div>
            <div class="form-field"><label>Latitude</label><input v-model="form.latitude" type="number" step="any" class="input" required></div>
            <div class="form-field"><label>Longitude</label><input v-model="form.longitude" type="number" step="any" class="input" required></div>
            <div class="form-field"><label>Lebar Jalan (m)</label><input v-model="form.roadWidth" type="number" step="any" class="input"></div>
            <div class="form-field"><label>Speed Bump (unit)</label><input v-model="form.speedBumpUnits" type="number" step="any" class="input"></div>
            <div class="form-field"><label>Speed Bump (m)</label><input v-model="form.speedBumpMeters" type="number" step="any" class="input"></div>
            <div class="form-field"><label>Endcap (pasang)</label><input v-model="form.endcapUnits" type="number" step="any" class="input"></div>
          </div>
        </div>
        <div class="modal-actions"><button type="button" class="btn" @click="showModal=false">Batal</button><button class="btn btn-primary" :disabled="saving">{{ saving ? 'Menyimpan…' : 'Simpan' }}</button></div>
      </form>
    </div>
  </div>
</template>
