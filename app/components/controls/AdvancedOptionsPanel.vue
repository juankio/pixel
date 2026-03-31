<script setup lang="ts">
const threshold = defineModel<number>('threshold', { default: 128 })
const turdSize = defineModel<number>('turdSize', { default: 2 })
const optCurve = defineModel<boolean>('optCurve', { default: true })
const scale = defineModel<2 | 4>('scale', { default: 4 })
const mode = defineModel<'fast' | 'quality'>('mode', { default: 'quality' })

const scaleOptions = [{ label: '2x', value: 2 }, { label: '4x', value: 4 }]
const modeOptions = [{ label: 'Rápido', value: 'fast' }, { label: 'Calidad', value: 'quality' }]
</script>

<template>
  <div class="space-y-4 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4">
    <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
      Parámetros avanzados
    </p>

    <div>
      <div class="mb-1.5 flex items-center justify-between">
        <span class="text-xs font-medium text-slate-600">Threshold</span>
        <span class="rounded-md bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">{{ threshold }}</span>
      </div>
      <input v-model.number="threshold" type="range" min="0" max="255" step="1" class="w-full accent-cyan-500">
    </div>

    <div>
      <div class="mb-1.5 flex items-center justify-between">
        <span class="text-xs font-medium text-slate-600">Turd Size</span>
        <span class="rounded-md bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">{{ turdSize }}</span>
      </div>
      <input v-model.number="turdSize" type="range" min="1" max="20" step="1" class="w-full accent-cyan-500">
    </div>

    <label class="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
      <span class="text-xs font-medium text-slate-600">Optimizar curvas</span>
      <input v-model="optCurve" type="checkbox" class="h-4 w-4 rounded border-slate-300 accent-cyan-500">
    </label>

    <div class="grid grid-cols-2 gap-2">
      <div>
        <p class="mb-1 text-[11px] font-medium text-slate-500">Scale</p>
        <select v-model.number="scale" class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30">
          <option v-for="o in scaleOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </div>
      <div>
        <p class="mb-1 text-[11px] font-medium text-slate-500">Mode</p>
        <select v-model="mode" class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30">
          <option v-for="o in modeOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </div>
    </div>
  </div>
</template>
