<script setup lang="ts">
const config = useRuntimeConfig()
const search = ref('')
const category = ref('all')
const condition = ref('all')
const district = ref('all')
const visibleCount = ref(0)
const { data: meta } = await useFetch(useApiUrl('/api/locations/meta'))
</script>

<template>
  <div class="public-shell">
    <header class="public-header">
      <div class="public-brand">
        <span class="brand-mark">GIS</span>
        <span><strong>{{ config.public.appName }}</strong><small>Peta Infrastruktur Transportasi</small></span>
      </div>
      <div class="public-filters">
        <input v-model="search" class="filter-input" placeholder="Cari lokasi atau kecamatan…">
        <select v-model="category" class="filter-select">
          <option value="all">Semua kategori</option>
          <option v-for="c in meta?.categories || []" :key="c.id" :value="c.slug">{{ c.name }}</option>
        </select>
        <select v-model="condition" class="filter-select">
          <option value="all">Semua kondisi</option>
          <option value="good">Baik / Sesuai</option>
          <option value="bad">Tidak Baik</option>
          <option value="unassessed">Belum Dinilai</option>
        </select>
        <select v-model="district" class="filter-select">
          <option value="all">Semua kecamatan</option>
          <option v-for="d in meta?.districts || []" :key="d" :value="d">{{ d }}</option>
        </select>
      </div>
      <div class="public-actions"><NuxtLink class="map-admin-link" to="/admin">Admin GIS</NuxtLink></div>
    </header>
    <div style="position:relative;min-height:0">
      <PublicMap :search="search" :category="category" :condition="condition" :district="district" @count="visibleCount = $event" />
      <div class="map-summary">
        <div class="map-summary-card"><strong>{{ visibleCount }}</strong><span>Terlihat</span></div>
        <div class="map-summary-card"><strong>{{ meta?.stats?.total || 0 }}</strong><span>Total titik</span></div>
        <div class="map-summary-card"><strong>{{ meta?.stats?.good || 0 }}</strong><span>Baik</span></div>
        <div class="map-summary-card"><strong>{{ meta?.stats?.unassessed || 0 }}</strong><span>Belum dinilai</span></div>
      </div>
    </div>
  </div>
</template>
