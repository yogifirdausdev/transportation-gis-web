<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  class?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}>(), { variant: 'default', size: 'default', type: 'button' })

const classes = computed(() => cn(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  props.variant === 'default' && 'bg-primary text-primary-foreground hover:opacity-90',
  props.variant === 'secondary' && 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  props.variant === 'outline' && 'border bg-background hover:bg-muted',
  props.variant === 'ghost' && 'hover:bg-muted',
  props.variant === 'destructive' && 'bg-destructive text-white hover:opacity-90',
  props.size === 'default' && 'h-10 px-4 py-2',
  props.size === 'sm' && 'h-8 rounded-md px-3 text-xs',
  props.size === 'lg' && 'h-11 rounded-md px-6',
  props.size === 'icon' && 'h-10 w-10',
  props.class,
))
</script>

<template>
  <button :type="type" :disabled="disabled" :class="classes"><slot /></button>
</template>
