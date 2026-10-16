import tailwindcss from '@tailwindcss/vite'

const baseURL = process.env.NUXT_APP_BASE_URL || '/'

export default defineNuxtConfig({
  compatibilityDate: '2026-09-01',
  devtools: { enabled: true },
  css: ['~/assets/css/tailwind.css', 'leaflet/dist/leaflet.css'],
  modules: ['shadcn-nuxt'],
  shadcn: {
    prefix: '',
    componentDir: '@/components/ui',
  },
  vite: {
    plugins: [tailwindcss()],
  },
  app: {
    baseURL,
    head: {
      title: 'Transportation GIS',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#ffffff' },
      ],
    },
  },
  runtimeConfig: {
    databaseUrl: '',
    sessionSecret: process.env.NUXT_SESSION_SECRET || 'replace-this-in-production',
    adminEmail: process.env.NUXT_ADMIN_EMAIL || 'admin@gis.local',
    adminPassword: process.env.NUXT_ADMIN_PASSWORD || 'ChangeMe123!',
    public: {
      appName: process.env.NUXT_PUBLIC_APP_NAME || 'Transportation GIS',
      baseURL,
      mapCenterLat: Number(process.env.NUXT_PUBLIC_MAP_CENTER_LAT || -6.1754),
      mapCenterLng: Number(process.env.NUXT_PUBLIC_MAP_CENTER_LNG || 106.8272),
      mapZoom: Number(process.env.NUXT_PUBLIC_MAP_ZOOM || 11),
      tileUrl: process.env.NUXT_PUBLIC_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      tileAttribution: process.env.NUXT_PUBLIC_TILE_ATTRIBUTION || '&copy; OpenStreetMap contributors',
    },
  },
  nitro: {
    compressPublicAssets: true,
  },
  typescript: {
    strict: true,
  },
})
