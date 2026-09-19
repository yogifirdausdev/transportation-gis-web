<script setup lang="ts">
const props = defineProps<{ status: string }>()
const label = computed(() => ({ good: 'Baik / Sesuai', bad: 'Tidak Baik', unassessed: 'Belum Dinilai' }[props.status] || props.status))
</script>

<template>
  <span class="status-badge" :class="`status-${status}`">{{ label }}</span>
</template>
