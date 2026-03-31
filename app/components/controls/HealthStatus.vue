<script setup lang="ts">
import type { HealthStatus } from '~/types'

defineProps<{
  healthStatus?: HealthStatus
  healthText?: string
  processing?: boolean
}>()

const emit = defineEmits<{
  'refresh-health': []
  'refresh-metrics': []
}>()
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-center gap-2">
      <UButton
        color="neutral"
        variant="ghost"
        size="sm"
        icon="i-lucide-heart-pulse"
        label="Health"
        :disabled="processing"
        @click="emit('refresh-health')"
      />
      <UButton
        color="neutral"
        variant="ghost"
        size="sm"
        icon="i-lucide-chart-column"
        label="Métricas"
        :disabled="processing"
        @click="emit('refresh-metrics')"
      />
    </div>
    <p v-if="healthText" class="text-[11px] text-slate-400">
      {{ healthText }}
    </p>
  </div>
</template>
