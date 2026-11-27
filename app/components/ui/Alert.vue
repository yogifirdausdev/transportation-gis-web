<script setup lang="ts">
import { CheckCircle2, CircleAlert, X } from 'lucide-vue-next'

const props = withDefaults(defineProps<{ variant?: 'success' | 'error' }>(), { variant: 'error' })
defineEmits<{ close: [] }>()

const styles = computed(() => props.variant === 'success'
  ? { box: 'border-emerald-200 bg-emerald-50 text-emerald-800', close: 'hover:bg-emerald-100', icon: CheckCircle2 }
  : { box: 'border-red-200 bg-red-50 text-red-700', close: 'hover:bg-red-100', icon: CircleAlert })
</script>

<template>
  <div :role="variant === 'error' ? 'alert' : 'status'" class="flex items-start gap-2 rounded-lg border p-3 text-sm" :class="styles.box">
    <component :is="styles.icon" class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
    <div class="min-w-0 flex-1"><slot /></div>
    <button type="button" class="-m-1 rounded p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" :class="styles.close" aria-label="Tutup notifikasi" @click="$emit('close')">
      <X class="h-4 w-4" aria-hidden="true" />
    </button>
  </div>
</template>
