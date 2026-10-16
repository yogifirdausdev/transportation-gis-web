<script setup lang="ts">
withDefaults(defineProps<{ variant?: 'default'|'success'|'warning'|'destructive'|'outline' }>(), { variant: 'default' })
</script>
<template>
  <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold" :class="{
    'bg-teal-100 text-teal-800': variant === 'default',
    'bg-emerald-100 text-emerald-800': variant === 'success',
    'bg-amber-100 text-amber-800': variant === 'warning',
    'bg-red-100 text-red-800': variant === 'destructive',
    'border bg-white text-slate-700': variant === 'outline'
  }"><slot /></span>
</template>
