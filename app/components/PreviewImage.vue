<script setup lang="ts">
withDefaults(defineProps<{
  src?: string
  title?: string
}>(), {
  src: '',
  title: 'Imagen original'
})
</script>

<template>
  <article class="flex h-full min-h-72 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
    <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
      <div>
        <h3 class="text-sm font-semibold text-slate-900">{{ title }}</h3>
        <p class="mt-0.5 text-[11px] text-slate-400">Imagen fuente sin procesar</p>
      </div>
      <UBadge label="Raster" color="neutral" variant="subtle" size="sm" />
    </div>

    <div class="grid grow place-items-center bg-slate-50/50 p-4">
      <img
        v-if="src"
        :src="src"
        alt="Preview de la imagen original"
        class="max-h-80 w-full rounded-xl object-contain"
      >
      <div v-else class="flex flex-col items-center gap-2 text-center">
        <div class="rounded-full bg-slate-100 p-3">
          <UIcon name="i-lucide-image" class="h-5 w-5 text-slate-300" />
        </div>
        <p class="text-xs text-slate-400">Sube una imagen para ver el preview</p>
      </div>
    </div>
  </article>
</template>
