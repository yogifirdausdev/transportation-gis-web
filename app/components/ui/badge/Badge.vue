<script setup lang="ts">
import { cn } from '@/lib/utils'
const props=withDefaults(defineProps<{variant?:'default'|'secondary'|'outline'|'destructive'; class?:string}>(),{variant:'default'})
</script><template><span :class="cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', variant==='default'&&'bg-primary text-primary-foreground', variant==='secondary'&&'bg-secondary text-secondary-foreground', variant==='outline'&&'border text-foreground', variant==='destructive'&&'bg-destructive text-white', $props.class)"><slot /></span></template>