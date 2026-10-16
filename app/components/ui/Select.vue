<script setup lang="ts">
const model = defineModel<string | number | null>()
defineProps<{ disabled?: boolean }>()
</script>
<template>
  <select v-model="model" :disabled="disabled" class="flex h-10 w-full rounded-lg border border-input bg-white px-3 text-sm shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 disabled:opacity-50">
    <slot />
  </select>
</template>
