<script setup lang="ts">
import { markerIconOptions, markerIconSvg } from '~/lib/marker-icons'

const model = defineModel<string>({ default: 'map-pin' })
const props = withDefaults(defineProps<{ color?: string }>(), { color: '#0F766E' })
</script>

<template>
  <div class="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Pilih ikon marker">
    <button
      v-for="icon in markerIconOptions"
      :key="icon.key"
      type="button"
      role="radio"
      :aria-checked="model === icon.key"
      :aria-label="icon.label"
      :title="icon.label"
      class="inline-flex h-10 w-10 items-center justify-center rounded-lg border bg-white transition hover:border-teal-400 hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
      :class="model === icon.key ? 'border-teal-600 bg-teal-50 ring-2 ring-teal-500/20' : 'border-slate-200'"
      @click="model = icon.key"
    >
      <span class="inline-flex" v-html="markerIconSvg(icon.key, { size: 19, color: props.color, strokeWidth: 2.2 })" />
    </button>
  </div>
</template>
