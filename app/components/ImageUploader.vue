<script setup lang="ts">
const props = withDefaults(defineProps<{
  disabled?: boolean
  fileName?: string
  maxSizeMb?: number
}>(), {
  disabled: false,
  fileName: '',
  maxSizeMb: 10
})

const emit = defineEmits<{
  (event: 'file-selected', file: File): void
  (event: 'clear'): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const dragActive = ref(false)
const validationError = ref('')
const maxBytes = computed(() => props.maxSizeMb * 1024 * 1024)

const validateFile = (file: File): boolean => {
  if (!file.type.startsWith('image/')) {
    validationError.value = 'Solo se permiten archivos de imagen.'
    return false
  }
  if (file.size > maxBytes.value) {
    validationError.value = `La imagen supera el límite de ${props.maxSizeMb}MB.`
    return false
  }
  validationError.value = ''
  return true
}

const handleFile = (file: File | undefined) => {
  if (!file || props.disabled) return
  if (validateFile(file)) emit('file-selected', file)
}

const onInputChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  handleFile(target.files?.[0])
  if (target) target.value = ''
}

const onDrop = (event: DragEvent) => {
  event.preventDefault()
  dragActive.value = false
  if (!props.disabled) handleFile(event.dataTransfer?.files?.[0])
}

const clearSelection = () => {
  validationError.value = ''
  emit('clear')
}
</script>

<template>
  <section class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
    <div class="border-b border-slate-100 px-5 py-4">
      <h2 class="text-sm font-semibold text-slate-900">Imagen fuente</h2>
      <p class="mt-0.5 text-xs text-slate-400">PNG, JPG, WEBP o SVG · máx {{ maxSizeMb }}MB</p>
    </div>

    <div class="p-5">
      <div
        class="group rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200"
        :class="[
          dragActive ? 'border-cyan-400 bg-cyan-50/60' : 'border-slate-200 bg-slate-50/60',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-cyan-400/70 hover:bg-cyan-50/40'
        ]"
        @dragover.prevent="dragActive = true"
        @dragleave.prevent="dragActive = false"
        @drop="onDrop"
        @click="!disabled && inputRef?.click()"
      >
        <input
          ref="inputRef"
          type="file"
          class="hidden"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          :disabled="disabled"
          @change="onInputChange"
        >
        <div class="mb-2 flex justify-center">
          <div class="rounded-full bg-slate-100 p-2.5 transition-colors group-hover:bg-cyan-100">
            <UIcon name="i-lucide-upload-cloud" class="h-5 w-5 text-slate-400 transition-colors group-hover:text-cyan-500" />
          </div>
        </div>
        <p class="text-sm font-semibold text-slate-700">Arrastra tu logo aquí</p>
        <p class="mt-1 text-xs text-slate-400">o haz click para seleccionar</p>
      </div>

      <div class="mt-3 min-h-5">
        <div v-if="fileName" class="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
          <UIcon name="i-lucide-file-image" class="h-3.5 w-3.5 shrink-0 text-cyan-500" />
          <span class="truncate text-xs font-medium text-slate-700">{{ fileName }}</span>
        </div>
        <p v-else class="text-xs text-slate-400">Ningún archivo seleccionado</p>
      </div>

      <UAlert v-if="validationError" class="mt-3" color="error" variant="soft" :description="validationError" />

      <div class="mt-4 flex items-center justify-between gap-2">
        <UButton
          label="Seleccionar"
          icon="i-lucide-upload"
          variant="soft"
          color="neutral"
          size="sm"
          :disabled="disabled"
          @click="inputRef?.click()"
        />
        <UButton
          label="Limpiar"
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          size="sm"
          :disabled="disabled || !fileName"
          @click="clearSelection"
        />
      </div>
    </div>
  </section>
</template>
