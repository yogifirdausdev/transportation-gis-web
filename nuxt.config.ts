export default defineNuxtConfig({
  compatibilityDate: '2026-09-01',
  devtools: { enabled: true },
  app: { baseURL: process.env.NUXT_APP_BASE_URL || '/' },
  css: ['~/assets/css/main.css', 'leaflet/dist/leaflet.css'],
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || 'postgresql://gis:gis@localhost:5432/gis',
    sessionSecret: process.env.NUXT_SESSION_SECRET || 'change-this-in-production-min-32-characters',
    dataDir: process.env.NUXT_DATA_DIR || './data',
    adminEmail: process.env.NUXT_ADMIN_EMAIL || 'admin@example.com',
    adminPassword: process.env.NUXT_ADMIN_PASSWORD || 'ChangeMe123!',
    public: {
      appName: process.env.NUXT_PUBLIC_APP_NAME || 'Transportation GIS',
      mapCenterLat: Number(process.env.NUXT_PUBLIC_MAP_CENTER_LAT || -6.1754),
      mapCenterLng: Number(process.env.NUXT_PUBLIC_MAP_CENTER_LNG || 106.8272),
      mapZoom: Number(process.env.NUXT_PUBLIC_MAP_ZOOM || 12)
    }
  },
  nitro: {
    compressPublicAssets: true
  },
  typescript: {
    strict: true,
    typeCheck: false
  }
})
