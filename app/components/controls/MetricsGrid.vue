<script setup lang="ts">
const props = defineProps<{
  metrics?: Record<string, unknown> | null
}>()

type StatCard = { label: string, value: string, icon: string, sub?: string }

const cards = computed((): StatCard[] => {
  const m = props.metrics
  if (!m) return []

  const stats = m.metrics as Record<string, number> | undefined
  const queue = m.queue as Record<string, number> | undefined
  const cache = m.cache as Record<string, number> | undefined

  const result: StatCard[] = []

  if (stats) {
    result.push({
      label: 'Solicitudes',
      value: String(stats.totalRequests ?? 0),
      icon: 'i-lucide-activity',
      sub: `${stats.successRequests ?? 0} exitosas · ${stats.failedRequests ?? 0} fallidas`
    })

    if ((stats.totalRequests ?? 0) > 0) {
      result.push({
        label: 'Tiempo promedio',
        value: `${Math.round(stats.averageProcessingMs ?? 0)} ms`,
        icon: 'i-lucide-timer'
      })

      const rate = Math.round((stats.cacheHitRate ?? 0) * 100)
      result.push({
        label: 'Caché',
        value: `${rate}%`,
        icon: 'i-lucide-database',
        sub: `${stats.cacheHits ?? 0} aciertos`
      })
    }
  }

  if (queue) {
    const pending = (queue.pending ?? 0) + (queue.size ?? 0)
    result.push({
      label: 'Cola',
      value: pending === 0 ? 'Libre' : `${pending} pendiente${pending !== 1 ? 's' : ''}`,
      icon: 'i-lucide-list',
      sub: `Concurrencia: ${queue.concurrency ?? 1}`
    })
  }

  if (cache && typeof cache.size === 'number') {
    result.push({
      label: 'En caché',
      value: String(cache.size),
      icon: 'i-lucide-layers',
      sub: cache.maxSize ? `máx. ${cache.maxSize}` : undefined
    })
  }

  return result
})
</script>

<template>
  <div v-if="cards.length" class="grid grid-cols-2 gap-2">
    <div
      v-for="card in cards"
      :key="card.label"
      class="rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2.5"
    >
      <div class="mb-1 flex items-center gap-1.5">
        <UIcon :name="card.icon" class="size-3 text-slate-400" />
        <span class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{{ card.label }}</span>
      </div>
      <p class="text-sm font-bold text-slate-800">{{ card.value }}</p>
      <p v-if="card.sub" class="mt-0.5 truncate text-[10px] text-slate-400">{{ card.sub }}</p>
    </div>
  </div>
</template>
