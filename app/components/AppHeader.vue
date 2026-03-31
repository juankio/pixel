<script setup lang="ts">
import type { HealthStatus } from '~/types'

defineProps<{
  healthStatus?: HealthStatus
  healthText?: string
}>()
</script>

<template>
  <header class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
    <div class="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
      <div>
        <div class="flex items-center gap-2">
          <AppLogo class="h-7 w-7" />
          <span class="text-xs font-bold uppercase tracking-[0.2em] text-cyan-600">PixelTrace Studio</span>
        </div>
        <h1 class="mt-3 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
          Vectorización profesional
          <span class="text-slate-400"> de logos</span>
        </h1>
        <p class="mt-1.5 max-w-xl text-sm text-slate-500">
          Sube una imagen, elige el modo de vectorización, ajusta colores en tiempo real y descarga el SVG.
        </p>
      </div>

      <div class="shrink-0">
        <div
          class="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-colors"
          :class="{
            'border-emerald-200 bg-emerald-50 text-emerald-700': healthStatus === 'online',
            'border-rose-200 bg-rose-50 text-rose-700': healthStatus === 'offline',
            'border-amber-200 bg-amber-50 text-amber-700': healthStatus === 'checking' || !healthStatus
          }"
        >
          <span
            class="h-2 w-2 rounded-full"
            :class="{
              'bg-emerald-500': healthStatus === 'online',
              'bg-rose-500': healthStatus === 'offline',
              'bg-amber-500 animate-pulse': healthStatus === 'checking' || !healthStatus
            }"
          />
          {{ healthText || 'Conectando...' }}
        </div>
      </div>
    </div>
  </header>
</template>
