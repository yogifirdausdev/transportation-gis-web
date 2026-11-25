<script setup lang="ts">
import { ChevronDown, ChevronUp, Phone } from 'lucide-vue-next'

const expanded = ref(false)
const baseURL = useRuntimeConfig().app.baseURL.replace(/\/+$/, '')
const logoUrl = `${baseURL}/images/siap-1500813.webp`
</script>

<template>
  <div class="pointer-events-auto w-fit max-w-full">
    <button
      type="button"
      class="flex max-w-full items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-soft md:hidden"
      :aria-expanded="expanded"
      aria-controls="public-help-details"
      :aria-label="expanded ? 'Ringkas informasi call center' : 'Tampilkan informasi call center'"
      @click="expanded = !expanded"
    >
      <img :src="logoUrl" alt="" class="h-8 w-11 shrink-0 object-contain" width="44" height="32" />
      <span>Call Center <strong class="text-teal-800">1500813</strong></span>
      <ChevronDown v-if="expanded" class="h-4 w-4 shrink-0 text-slate-500" />
      <ChevronUp v-else class="h-4 w-4 shrink-0 text-slate-500" />
    </button>
    <section
      id="public-help-details"
      aria-label="Informasi publik"
      class="w-[340px] max-w-full items-center gap-3 rounded-2xl border bg-white p-3 shadow-soft md:flex"
      :class="expanded ? 'mt-2 flex md:mt-0' : 'hidden'"
    >
      <img :src="logoUrl" alt="Call Center SIAP" class="h-auto w-16 shrink-0 object-contain sm:w-20" width="80" height="61" />
      <div class="min-w-0">
        <h2 class="text-xs font-semibold text-slate-900">Informasi publik</h2>
        <p class="mt-1 text-xs leading-relaxed text-slate-600">Jika menemukan permasalahan di jalan, hubungi Call Center</p>
        <a href="tel:1500813" class="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-teal-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600" aria-label="Hubungi Call Center 1500813">
          <Phone class="h-3.5 w-3.5" aria-hidden="true" />1500813
        </a>
      </div>
    </section>
  </div>
</template>
