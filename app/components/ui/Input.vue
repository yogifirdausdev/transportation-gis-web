<script setup lang="ts">
const model = defineModel<string | number | null>()
defineProps<{ type?: string; placeholder?: string; min?: string | number; max?: string | number; step?: string | number; disabled?: boolean }>()
</script>
<template>
  <input v-model="model" :type="type || 'text'" :placeholder="placeholder" :min="min" :max="max" :step="step" :disabled="disabled" class="flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 disabled:cursor-not-allowed disabled:opacity-50" />
</template>
