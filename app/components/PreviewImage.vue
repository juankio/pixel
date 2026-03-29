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
  <article class="flex h-full min-h-72 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <header class="mb-3 flex items-center justify-between">
      <h3 class="text-sm font-semibold text-slate-800">
        {{ title }}
      </h3>
      <span class="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500">
        Raster
      </span>
    </header>

    <div class="grid grow place-items-center rounded-xl border border-slate-200 bg-slate-50 p-4">
      <img
        v-if="src"
        :src="src"
        alt="Preview de la imagen original"
        class="max-h-80 w-full rounded-lg object-contain"
      >
      <p v-else class="text-sm text-slate-400">
        Sube una imagen para ver el preview.
      </p>
    </div>
  </article>
</template>
