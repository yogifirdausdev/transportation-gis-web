<script setup lang="ts">
const props = withDefaults(defineProps<{
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}>(), { variant: 'default', size: 'md', type: 'button' })

const variantClass = computed(() => ({
  default: 'bg-primary text-primary-foreground hover:bg-teal-800 shadow-sm',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-teal-100',
  outline: 'border bg-white hover:bg-slate-50 text-slate-800',
  ghost: 'hover:bg-slate-100 text-slate-700',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-red-700'
}[props.variant]))

const sizeClass = computed(() => ({ sm: 'h-9 px-3 text-sm', md: 'h-10 px-4 text-sm', lg: 'h-11 px-5 text-base' }[props.size]))
</script>

<template>
  <button :type="type" :disabled="disabled" class="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" :class="[variantClass, sizeClass]">
    <slot />
  </button>
</template>
