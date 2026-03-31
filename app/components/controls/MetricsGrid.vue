<script setup lang="ts">
const props = defineProps<{
  metrics?: Record<string, unknown> | null
}>()

const entries = computed(() => {
  if (!props.metrics) return []
  return Object.entries(props.metrics).slice(0, 6)
})
</script>

<template>
  <div v-if="entries.length" class="grid grid-cols-1 gap-2">
    <div
      v-for="([key, value]) in entries"
      :key="key"
      class="rounded-lg border border-slate-200/80 bg-slate-50 px-3 py-2"
    >
      <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{{ key }}</p>
      <p class="truncate text-sm font-semibold text-slate-800">{{ String(value) }}</p>
    </div>
  </div>
</template>
