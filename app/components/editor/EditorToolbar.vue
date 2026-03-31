<script setup lang="ts">
defineProps<{
  processing?: boolean
  selectedElementCount?: number
  hasHistory?: boolean
  hasSvg?: boolean
  autoFitEnabled?: boolean
}>()

const emit = defineEmits<{
  'remove-selected': []
  'reset-selection': []
  'undo': []
  'auto-fit': []
  'update:autoFitEnabled': [value: boolean]
}>()
</script>

<template>
  <div class="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 p-3 backdrop-blur-sm">
    <UButton
      icon="i-lucide-trash-2"
      color="error"
      variant="soft"
      size="sm"
      :label="selectedElementCount ? `Eliminar (${selectedElementCount})` : 'Eliminar'"
      :disabled="processing || !selectedElementCount"
      @click="emit('remove-selected')"
    />
    <UButton
      icon="i-lucide-mouse-pointer-click"
      color="neutral"
      variant="ghost"
      size="sm"
      label="Deseleccionar"
      :disabled="processing || !selectedElementCount"
      @click="emit('reset-selection')"
    />
    <UButton
      icon="i-lucide-undo-2"
      color="neutral"
      variant="ghost"
      size="sm"
      label="Deshacer"
      :disabled="processing || !hasHistory"
      @click="emit('undo')"
    />
    <UButton
      icon="i-lucide-frame"
      color="neutral"
      variant="soft"
      size="sm"
      label="Ajustar"
      :disabled="processing || !hasSvg"
      @click="emit('auto-fit')"
    />
    <label class="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50">
      <input
        type="checkbox"
        class="h-3.5 w-3.5 rounded accent-cyan-500"
        :checked="autoFitEnabled"
        @change="emit('update:autoFitEnabled', ($event.target as HTMLInputElement).checked)"
      >
      Auto-encuadre
    </label>
    <p class="ml-auto hidden text-[11px] text-slate-400 lg:block">
      Ctrl/Cmd/Shift + click para multi-selección
    </p>
  </div>
</template>
