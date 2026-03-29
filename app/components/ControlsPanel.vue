<script setup lang="ts">
export type AdvancedOptions = {
  threshold: number
  turdSize: number
  optCurve: boolean
}

export type UpscaleOptions = {
  scale: 2 | 4
  mode: 'fast' | 'quality'
}

const props = withDefaults(defineProps<{
  processing?: boolean
  hasFile?: boolean
  hasSvg?: boolean
  healthStatus?: 'checking' | 'online' | 'offline'
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

const statusClass = computed(() => {
  if (props.healthStatus === 'online') {
    return 'bg-emerald-100 text-emerald-700'
  }

  if (props.healthStatus === 'offline') {
    return 'bg-rose-100 text-rose-700'
  }

  return 'bg-amber-100 text-amber-700'
})

const statusLabel = computed(() => {
  if (props.healthStatus === 'online') {
    return 'Backend activo'
  }

  if (props.healthStatus === 'offline') {
    return 'Backend inactivo'
  }

  return 'Verificando backend'
})

const metricsEntries = computed(() => {
  if (!props.metrics || typeof props.metrics !== 'object') {
    return []
  }

  return Object.entries(props.metrics).slice(0, 6)
})

const triggerAdvanced = () => {
  emit('vectorize-advanced', {
    threshold: threshold.value,
    turdSize: turdSize.value,
    optCurve: optCurve.value
  })
}

const triggerUpscale = () => {
  emit('upscale', {
    scale: scale.value,
    mode: mode.value
  })
}
</script>

<template>
  <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <header class="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 class="text-sm font-semibold text-slate-900">
          Controles de vectorización
        </h2>
        <p class="mt-1 text-xs text-slate-500">
          Ajusta parámetros y ejecuta procesos según el nivel de calidad.
        </p>
      </div>

      <span class="rounded-full px-2 py-1 text-[11px] font-semibold" :class="statusClass">
        {{ statusLabel }}
      </span>
    </header>

    <div class="space-y-3">
      <UButton
        block
        color="primary"
        icon="i-lucide-wand-sparkles"
        label="Vectorizar básico"
        :loading="processing"
        :disabled="processing || !hasFile"
        @click="emit('vectorize-basic')"
      />

      <UButton
        block
        color="neutral"
        variant="soft"
        icon="i-lucide-sliders-horizontal"
        label="Vectorizar avanzado"
        :loading="processing"
        :disabled="processing || !hasFile"
        @click="triggerAdvanced"
      />

      <UButton
        block
        color="neutral"
        variant="outline"
        icon="i-lucide-sparkles"
        label="Alta calidad"
        :loading="processing"
        :disabled="processing || !hasFile"
        @click="triggerUpscale"
      />
    </div>

    <div class="mt-5 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div>
        <div class="mb-1 flex items-center justify-between text-xs text-slate-600">
          <span>Threshold</span>
          <span>{{ threshold }}</span>
        </div>
        <input v-model.number="threshold" type="range" min="0" max="255" step="1" class="w-full accent-cyan-600">
      </div>

      <div>
        <div class="mb-1 flex items-center justify-between text-xs text-slate-600">
          <span>Turd Size</span>
          <span>{{ turdSize }}</span>
        </div>
        <input v-model.number="turdSize" type="range" min="1" max="20" step="1" class="w-full accent-cyan-600">
      </div>

      <label class="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
        <span>Optimizar curvas</span>
        <input v-model="optCurve" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500">
      </label>

      <div class="grid grid-cols-2 gap-2">
        <label class="text-xs text-slate-600">
          <span class="mb-1 block">Scale</span>
          <select v-model.number="scale" class="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm text-slate-700 outline-none focus:border-cyan-500">
            <option :value="2">
              2x
            </option>
            <option :value="4">
              4x
            </option>
          </select>
        </label>

        <label class="text-xs text-slate-600">
          <span class="mb-1 block">Mode</span>
          <select v-model="mode" class="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm text-slate-700 outline-none focus:border-cyan-500">
            <option value="fast">
              fast
            </option>
            <option value="quality">
              quality
            </option>
          </select>
        </label>
      </div>
    </div>

    <div class="mt-5 grid grid-cols-2 gap-2">
      <UButton
        color="neutral"
        variant="soft"
        icon="i-lucide-download"
        label="Descargar SVG"
        :disabled="!hasSvg || processing"
        @click="emit('download-svg')"
      />
      <UButton
        color="neutral"
        variant="outline"
        icon="i-lucide-image-down"
        label="Descargar PNG"
        :disabled="!hasSvg || processing"
        @click="emit('download-png')"
      />
    </div>

    <div class="mt-5 flex gap-2">
      <UButton
        color="neutral"
        variant="ghost"
        icon="i-lucide-heart-pulse"
        label="Health"
        :disabled="processing"
        @click="emit('refresh-health')"
      />
      <UButton
        color="neutral"
        variant="ghost"
        icon="i-lucide-chart-column"
        label="Métricas"
        :disabled="processing"
        @click="emit('refresh-metrics')"
      />
    </div>

    <p v-if="healthText" class="mt-3 text-xs text-slate-500">
      {{ healthText }}
    </p>

    <div v-if="metricsEntries.length" class="mt-3 grid grid-cols-1 gap-2">
      <div
        v-for="([key, value]) in metricsEntries"
        :key="key"
        class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
      >
        <p class="text-[11px] uppercase tracking-wide text-slate-500">
          {{ key }}
        </p>
        <p class="truncate text-sm font-semibold text-slate-800">
          {{ String(value) }}
        </p>
      </div>
    </div>
  </section>
</template>
