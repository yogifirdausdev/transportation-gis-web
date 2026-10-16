<script setup lang="ts">defineProps<{ title: string; description?: string }>()</script>
<template>
  <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-slate-950">{{ title }}</h1>
      <p v-if="description" class="mt-1 text-sm text-slate-500">{{ description }}</p>
    </div>
    <div class="flex items-center gap-2"><slot /></div>
  </div>
</template>
