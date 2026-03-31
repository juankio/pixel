<script setup lang="ts">
defineProps<{
  selectedElementId?: string
  selectedElementColor?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'color-input': [event: Event]
  'set-transparent': []
}>()
</script>

<template>
  <div
    v-if="selectedElementId"
    class="flex items-center justify-between rounded-xl border border-cyan-200/80 bg-cyan-50/60 px-3 py-2.5"
  >
    <div>
      <p class="text-[10px] font-semibold uppercase tracking-wider text-cyan-500">Seleccionado</p>
      <code class="mt-0.5 block text-xs font-medium text-cyan-800">{{ selectedElementId }}</code>
    </div>
    <div class="flex items-center gap-2">
      <input
        type="color"
        class="h-8 w-10 cursor-pointer rounded-lg border border-cyan-200 bg-white p-0.5"
        :value="selectedElementColor"
        :disabled="disabled"
        @input="emit('color-input', $event)"
      >
      <UButton
        label="none"
        color="primary"
        variant="soft"
        size="xs"
        :disabled="disabled"
        @click="emit('set-transparent')"
      />
    </div>
  </div>
</template>
