export default defineNuxtConfig({
  compatibilityDate: '2026-01-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css', 'leaflet/dist/leaflet.css'],
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    sessionSecret: process.env.NUXT_SESSION_SECRET,
    adminEmail: process.env.NUXT_ADMIN_EMAIL,
    adminPassword: process.env.NUXT_ADMIN_PASSWORD,
    storageDir: process.env.STORAGE_DIR || '/app/storage',
    public: {
      appName: process.env.NUXT_PUBLIC_APP_NAME || 'Peta Perlengkapan Jalan'
    }
  },
  nitro: {
    preset: 'node-server'
  },
  app: {
    head: {
      title: 'Peta Perlengkapan Jalan',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#0f766e' }
      ]
    }
  }
})
