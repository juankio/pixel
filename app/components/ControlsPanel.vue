<script setup lang="ts">
import type { AdvancedOptions, HealthStatus, UpscaleOptions } from '~/types'

const props = withDefaults(defineProps<{
  processing?: boolean
  hasFile?: boolean
  hasSvg?: boolean
  healthStatus?: HealthStatus
  healthText?: string
  metrics?: Record<string, unknown> | null
}>(), {
  processing: false,
  hasFile: false,
  hasSvg: false,
  healthStatus: 'checking',
  healthText: '',
  metrics: null
})

const emit = defineEmits<{
  'vectorize-basic': []
  'vectorize-advanced': [options: AdvancedOptions]
  'upscale': [options: UpscaleOptions]
  'download-svg': []
  'download-png': []
  'refresh-health': []
  'refresh-metrics': []
}>()

const threshold = ref(128)
const turdSize = ref(2)
const optCurve = ref(true)
const scale = ref<2 | 4>(4)
const mode = ref<'fast' | 'quality'>('quality')
</script>

<template>
  <section class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
    <div class="border-b border-slate-100 px-5 py-4">
      <h2 class="text-sm font-semibold text-slate-900">Controles</h2>
      <p class="mt-0.5 text-xs text-slate-400">Vectorización y opciones de exportación</p>
    </div>

    <div class="space-y-5 p-5">
      <ControlsVectorizeActions
        :processing="processing"
        :has-file="hasFile"
        :threshold="threshold"
        :turd-size="turdSize"
        :opt-curve="optCurve"
        :scale="scale"
        :mode="mode"
        @vectorize-basic="emit('vectorize-basic')"
        @vectorize-advanced="emit('vectorize-advanced', $event)"
        @upscale="emit('upscale', $event)"
      />

      <ControlsAdvancedOptionsPanel
        v-model:threshold="threshold"
        v-model:turd-size="turdSize"
        v-model:opt-curve="optCurve"
        v-model:scale="scale"
        v-model:mode="mode"
      />

      <div class="border-t border-slate-100 pt-4">
        <p class="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Exportar</p>
        <ControlsDownloadActions
          :has-svg="hasSvg"
          :processing="processing"
          @download-svg="emit('download-svg')"
          @download-png="emit('download-png')"
        />
      </div>

      <div class="border-t border-slate-100 pt-4">
        <ControlsHealthStatus
          :health-status="healthStatus"
          :health-text="healthText"
          :processing="processing"
          @refresh-health="emit('refresh-health')"
          @refresh-metrics="emit('refresh-metrics')"
        />
        <ControlsMetricsGrid :metrics="metrics" class="mt-3" />
      </div>
    </div>
  </section>
</template>
