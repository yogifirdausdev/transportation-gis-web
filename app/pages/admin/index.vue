<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })
const { data, refresh } = await useFetch(useApiUrl('/api/admin/stats'))
</script>

<template>
  <div>
    <div class="page-head">
      <div><div class="eyebrow">Overview</div><h1>Dashboard GIS</h1><p>Ringkasan data dan aktivitas terbaru.</p></div>
      <div style="display:flex;gap:8px"><NuxtLink class="btn" to="/">Lihat Map</NuxtLink><NuxtLink class="btn btn-primary" to="/admin/import">Bulk Import</NuxtLink></div>
    </div>
    <div class="grid-stats">
      <div class="stat-card"><span>Total titik</span><strong>{{ data?.summary?.total || 0 }}</strong></div>
      <div class="stat-card"><span>Baik</span><strong>{{ data?.summary?.good || 0 }}</strong></div>
      <div class="stat-card"><span>Tidak baik</span><strong>{{ data?.summary?.bad || 0 }}</strong></div>
      <div class="stat-card"><span>Belum dinilai</span><strong>{{ data?.summary?.unassessed || 0 }}</strong></div>
      <div class="stat-card"><span>Kecamatan</span><strong>{{ data?.summary?.districts || 0 }}</strong></div>
    </div>
    <div class="card">
      <div class="card-head"><h2>Data terbaru</h2><NuxtLink class="btn btn-sm" to="/admin/locations">Semua lokasi →</NuxtLink></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Lokasi</th><th>Kategori</th><th>Kecamatan</th><th>Kondisi</th><th>Ditambahkan</th></tr></thead>
          <tbody>
            <tr v-for="item in data?.recent || []" :key="item.id">
              <td><div class="table-title">{{ item.name }}</div></td>
              <td>{{ item.category_name }}</td><td>{{ item.district || '—' }}</td>
              <td><StatusBadge :status="item.condition" /></td>
              <td>{{ new Date(item.created_at).toLocaleDateString('id-ID') }}</td>
            </tr>
            <tr v-if="!data?.recent?.length"><td colspan="5" class="empty">Belum ada data. Mulai dari Bulk Import atau tambah lokasi manual.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
