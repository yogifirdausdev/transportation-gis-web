<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })
const file = ref<File | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)
const preview = ref<any>(null)
const loading = ref(false)
const importing = ref(false)
const error = ref('')
const success = ref('')
const skipDuplicates = ref(true)
const fixLatitude = ref(true)

function pickFile(e: Event) {
  file.value = (e.target as HTMLInputElement).files?.[0] || null
  preview.value = null; error.value=''; success.value=''
}
async function previewFile() {
  if (!file.value) return
  loading.value=true; error.value=''; success.value=''
  const fd = new FormData(); fd.append('file', file.value)
  try { preview.value = await $fetch(useApiUrl('/api/admin/import/preview'), { method:'POST', body:fd }) }
  catch (e:any) { error.value = e?.data?.statusMessage || e?.statusMessage || 'Gagal membaca Excel' }
  finally { loading.value=false }
}
async function commitImport() {
  if (!preview.value?.token) return
  importing.value=true; error.value=''; success.value=''
  try {
    const r:any = await $fetch(useApiUrl('/api/admin/import/commit'), { method:'POST', body:{ token:preview.value.token, skipDuplicates:skipDuplicates.value, fixPositiveJakartaLatitude:fixLatitude.value } })
    success.value = `Import selesai: ${r.imported} lokasi masuk, ${r.skipped} dilewati.`
    preview.value=null; file.value=null
    if (inputEl.value) inputEl.value.value=''
  } catch (e:any) { error.value = e?.data?.statusMessage || e?.statusMessage || 'Import gagal' }
  finally { importing.value=false }
}
function labelCondition(v:string) { return ({good:'Baik / Sesuai',bad:'Tidak Baik',unassessed:'Belum Dinilai'} as any)[v] || v }
</script>

<template>
  <div>
    <div class="page-head"><div><div class="eyebrow">Data Ingestion</div><h1>Bulk Import Excel</h1><p>Upload langsung laporan Dishub .xlsx. Foto embedded, koordinat, status, dan kecamatan akan dibaca otomatis.</p></div></div>
    <div v-if="error" class="notice notice-error">{{ error }}</div>
    <div v-if="success" class="notice notice-success">{{ success }}</div>
    <div class="card">
      <div class="card-body">
        <div class="dropzone">
          <strong>{{ file ? file.name : 'Pilih file laporan .xlsx' }}</strong>
          <p>Template seperti “Bobot Pemasangan Speedbump” didukung langsung. Maksimum 50 MB.</p>
          <input ref="inputEl" type="file" accept=".xlsx" style="display:none" @change="pickFile">
          <button class="btn" type="button" @click="inputEl?.click()">Pilih File</button>
          <button v-if="file" class="btn btn-primary" style="margin-left:8px" :disabled="loading" @click="previewFile">{{ loading ? 'Membaca…' : 'Preview Import' }}</button>
        </div>
      </div>
    </div>

    <template v-if="preview">
      <div class="import-summary">
        <div><b>{{ preview.summary.rows }}</b><span>Lokasi</span></div>
        <div><b>{{ preview.summary.photos }}</b><span>Foto</span></div>
        <div><b>{{ preview.summary.correctedLatitudes }}</b><span>Latitude diperbaiki</span></div>
        <div><b>{{ preview.summary.unassessed }}</b><span>Belum dinilai</span></div>
        <div><b>{{ preview.summary.duplicateCoordinates }}</b><span>Duplikat internal</span></div>
      </div>
      <div class="card" style="margin-bottom:16px">
        <div class="card-head"><h2>Import Options · Sheet: {{ preview.worksheet }}</h2></div>
        <div class="card-body">
          <label class="check-row"><input v-model="fixLatitude" type="checkbox"><span><strong>Perbaiki latitude Jakarta yang positif</strong><br>Contoh 6.1178029 → -6.1178029 bila longitude berada di rentang Jakarta.</span></label>
          <label class="check-row"><input v-model="skipDuplicates" type="checkbox"><span><strong>Lewati koordinat duplikat</strong><br>Mencegah titik yang sama masuk dua kali dari file yang sama atau data yang sudah ada.</span></label>
          <div v-for="w in preview.warnings" :key="w" class="notice notice-warn">{{ w }}</div>
          <button class="btn btn-yellow" :disabled="importing" @click="commitImport">{{ importing ? 'Mengimport…' : `Import ${preview.summary.rows} Locations` }}</button>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><h2>Preview Data</h2><span style="font-size:10px;color:#6c7688">{{ preview.filename }}</span></div>
        <div class="table-wrap">
          <table><thead><tr><th>No</th><th>Lokasi</th><th>Kecamatan</th><th>Koordinat</th><th>Kondisi</th><th>Speed Bump</th><th>Foto</th></tr></thead>
          <tbody><tr v-for="r in preview.rows" :key="r.rowNumber">
            <td>{{ r.sequence ?? '—' }}</td><td><div class="table-title">{{ r.name }}</div><div v-if="r.latitudeCorrected" class="table-sub">Latitude akan dikoreksi</div></td>
            <td>{{ r.district || '—' }}</td><td style="white-space:nowrap">{{ r.latitude }}, {{ r.longitude }}</td>
            <td><StatusBadge :status="r.condition" /></td><td>{{ r.speedBumpMeters ?? '—' }} m</td><td>{{ (r.hasBeforePhoto?1:0)+(r.hasAfterPhoto?1:0) }}/2</td>
          </tr></tbody></table>
        </div>
      </div>
    </template>
  </div>
</template>
