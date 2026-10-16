<script setup lang="ts">import { MapPin } from 'lucide-vue-next'; defineProps<{ title: string; description?: string }>()</script>
<template>
  <div class="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white px-6 py-14 text-center">
    <div class="mb-4 rounded-full bg-teal-50 p-3 text-teal-700"><MapPin class="h-6 w-6" /></div>
    <h3 class="font-semibold text-slate-900">{{ title }}</h3>
    <p v-if="description" class="mt-1 max-w-md text-sm text-slate-500">{{ description }}</p>
    <div class="mt-5"><slot /></div>
  </div>
</template>
