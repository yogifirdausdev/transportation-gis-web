<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import type { Condition } from '@/types/gis'
const props=defineProps<{condition:Condition}>()
const labels:Record<Condition,string>={good:'Baik / Sesuai',bad:'Tidak Baik',unassessed:'Belum Dinilai'}
</script>
<template>
  <Badge v-if="condition==='good'" variant="outline" class="border-emerald-200 bg-emerald-50 text-emerald-700">{{ labels[condition] }}</Badge>
  <Badge v-else-if="condition==='bad'" variant="outline" class="border-red-200 bg-red-50 text-red-700">{{ labels[condition] }}</Badge>
  <Badge v-else variant="secondary">{{ labels[condition] }}</Badge>
</template>
