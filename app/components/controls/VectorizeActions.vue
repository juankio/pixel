<script setup lang="ts">
import type { AdvancedOptions, UpscaleOptions } from '~/types'

const props = withDefaults(defineProps<{
  processing?: boolean
  hasFile?: boolean
  threshold?: number
  turdSize?: number
  optCurve?: boolean
  scale?: 2 | 4
  mode?: 'fast' | 'quality'
}>(), {
  processing: false,
  hasFile: false,
  threshold: 128,
  turdSize: 2,
  optCurve: true,
  scale: 4,
  mode: 'quality'
})

const emit = defineEmits<{
  'vectorize-basic': []
  'vectorize-advanced': [options: AdvancedOptions]
  'upscale': [options: UpscaleOptions]
}>()
</script>

<template>
  <div class="space-y-2.5">
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
      @click="emit('vectorize-advanced', { threshold, turdSize, optCurve })"
    />
    <UButton
      block
      color="neutral"
      variant="outline"
      icon="i-lucide-sparkles"
      label="Alta calidad"
      :loading="processing"
      :disabled="processing || !hasFile"
      @click="emit('upscale', { scale, mode })"
    />
  </div>
</template>
