<script setup lang="ts">
import { cn } from '@/lib/utils'
const model = defineModel<string | number | undefined>()
const props = defineProps<{ class?: string; type?: string; placeholder?: string; disabled?: boolean; min?: string|number; max?: string|number; step?: string|number }>()
</script>
<template><input v-model="model" :type="type || 'text'" :placeholder="placeholder" :disabled="disabled" :min="min" :max="max" :step="step" :class="cn('flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50', $props.class)" /></template>
