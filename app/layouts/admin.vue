<script setup lang="ts">
const route = useRoute()
const user = useState<any>('auth-user')

async function logout() {
  await $fetch(useApiUrl('/api/auth/logout'), { method: 'POST' })
  user.value = null
  await navigateTo('/admin/login')
}

const menus = computed(() => [
  { to: '/admin', label: 'Dashboard', icon: '▦' },
  { to: '/admin/locations', label: 'Locations', icon: '⌖' },
  { to: '/admin/import', label: 'Bulk Import', icon: '⇧' },
  { to: '/admin/categories', label: 'Categories', icon: '◈', roles: ['admin','gis_manager'] },
  { to: '/admin/users', label: 'Users', icon: '◎', roles: ['admin'] }
].filter(item => !item.roles || item.roles.includes(user.value?.role)))
</script>

<template>
  <div class="admin-shell">
    <aside class="admin-sidebar">
      <NuxtLink to="/" class="admin-brand">
        <span class="brand-mark">GIS</span>
        <span><strong>Transportation GIS</strong><small>Management Console</small></span>
      </NuxtLink>
      <nav class="admin-nav">
        <NuxtLink v-for="item in menus" :key="item.to" :to="item.to" :class="{ active: route.path === item.to }">
          <span class="nav-icon">{{ item.icon }}</span><span>{{ item.label }}</span>
        </NuxtLink>
      </nav>
      <div class="sidebar-bottom">
        <NuxtLink to="/" class="view-map-link">↗ View public map</NuxtLink>
        <div class="user-card">
          <div class="avatar">{{ user?.name?.slice(0,1)?.toUpperCase() || 'U' }}</div>
          <div class="user-meta"><strong>{{ user?.name }}</strong><small>{{ user?.role?.replace('_',' ') }}</small></div>
          <button class="icon-button" title="Logout" @click="logout">↪</button>
        </div>
      </div>
    </aside>
    <main class="admin-main"><slot /></main>
  </div>
</template>
