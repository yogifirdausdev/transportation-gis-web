<script setup lang="ts">
definePageMeta({ layout: false })
const config = useRuntimeConfig()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  loading.value = true
  error.value = ''
  try {
    const data = await $fetch<{ user:any }>(useApiUrl('/api/auth/login'), { method: 'POST', body: { email: email.value, password: password.value } })
    useState('auth-user').value = data.user
    await navigateTo('/admin')
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.statusMessage || 'Login gagal'
  } finally { loading.value = false }
}
</script>

<template>
  <div class="login-shell">
    <main class="login-panel">
      <div class="login-brand"><span class="brand-mark">GIS</span><strong>{{ config.public.appName }}</strong></div>
      <div class="eyebrow">Management Console</div>
      <h1>Masuk ke GIS</h1>
      <p>Kelola titik lokasi, lakukan bulk import Excel, dan atur data peta dari satu tempat.</p>
      <div v-if="error" class="notice notice-error">{{ error }}</div>
      <form class="login-form" @submit.prevent="submit">
        <div class="form-field"><label>Email</label><input v-model="email" class="input" type="email" autocomplete="username" required></div>
        <div class="form-field"><label>Password</label><input v-model="password" class="input" type="password" autocomplete="current-password" required></div>
        <button class="btn btn-primary" :disabled="loading">{{ loading ? 'Memproses…' : 'Masuk' }}</button>
      </form>
    </main>
    <aside class="login-visual">
      <div class="login-copy"><div class="eyebrow" style="color:#f5c518">Transportation Data Platform</div><div class="big">Satu peta untuk aset transportasi yang terus berkembang.</div><p>Dimulai dari speed bump, struktur aplikasi ini sudah disiapkan untuk kategori GIS lain tanpa menempel pada lifecycle WordPress.</p></div>
    </aside>
  </div>
</template>
