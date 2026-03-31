<script setup lang="ts">
defineProps<{
  hasSvg?: boolean
  processing?: boolean
}>()

const emit = defineEmits<{
  'download-svg': []
  'download-png': []
}>()
</script>

<template>
  <div class="grid grid-cols-2 gap-2">
    <UButton
      color="neutral"
      variant="soft"
      icon="i-lucide-download"
      label="SVG"
      :disabled="!hasSvg || processing"
      @click="emit('download-svg')"
    />
    <UButton
      color="neutral"
      variant="outline"
      icon="i-lucide-image-down"
      label="PNG"
      :disabled="!hasSvg || processing"
      @click="emit('download-png')"
    />
  </div>
</template>
