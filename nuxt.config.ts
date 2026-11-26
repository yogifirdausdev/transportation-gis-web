export default defineNuxtConfig({
  compatibilityDate: "2026-01-01",

  devtools: { enabled: false },

  modules: ["@nuxtjs/tailwindcss"],

  css: ["~/assets/css/main.css", "leaflet/dist/leaflet.css"],

  runtimeConfig: {
    databaseUrl: "",
    sessionSecret: "",
    adminEmail: "",
    adminPassword: "",
    storageDir: "/app/storage",

    public: {
      appName: "Peta Perlengkapan Jalan",
    },
  },

  nitro: {
    preset: "node-server",
  },

  app: {
    baseURL: "/",

    head: {
      title: "Peta Perlengkapan Jalan",
      meta: [
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1",
        },
        {
          name: "theme-color",
          content: "#0f766e",
        },
      ],
    },
  },
});
