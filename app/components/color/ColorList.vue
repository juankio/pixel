<script setup lang="ts">
import type { SvgColorEntry } from '~/types'

defineProps<{
  colors: SvgColorEntry[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  'color-input': [entry: SvgColorEntry, event: Event]
  'set-transparent': [entry: SvgColorEntry]
}>()
</script>

<template>
  <div v-if="colors.length > 0" class="space-y-1.5">
    <div
      v-for="entry in colors"
      :key="entry.key"
      class="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2 transition-colors hover:bg-slate-100/60"
    >
      <div class="flex min-w-0 items-center gap-2.5">
        <span
          class="h-5 w-5 shrink-0 rounded-md border border-slate-300 shadow-sm"
          :style="{ backgroundColor: entry.hex }"
        />
        <code class="truncate text-[11px] text-slate-600">{{ entry.raw }}</code>
        <UBadge :label="entry.kind" size="xs" color="neutral" variant="subtle" />
      </div>
      <div class="flex items-center gap-1.5">
        <input
          type="color"
          class="h-7 w-9 cursor-pointer rounded-md border border-slate-200 bg-white p-0.5"
          :value="entry.hex"
          :disabled="disabled"
          @input="emit('color-input', entry, $event)"
        >
        <UButton
          label="none"
          color="neutral"
          variant="ghost"
          size="xs"
          :disabled="disabled"
          @click="emit('set-transparent', entry)"
        />
      </div>
    </div>
  </div>
  <p v-else class="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
    No se detectaron colores editables en este SVG.
  </p>
</template>
