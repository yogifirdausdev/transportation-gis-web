<script setup lang="ts">
import { cn } from '@/lib/utils'
const model = defineModel<string | number | undefined>()
defineProps<{ class?: string; disabled?: boolean }>()
</script>
<template><select v-model="model" :disabled="disabled" :class="cn('flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50', $props.class)"><slot /></select></template>
