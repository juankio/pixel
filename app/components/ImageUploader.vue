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

const validateFile = (file: File) => {
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
  if (!file || props.disabled) {
    return
  }

  if (validateFile(file)) {
    emit('file-selected', file)
  }
}

const onInputChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  handleFile(target.files?.[0])

  if (target) {
    target.value = ''
  }
}

const onDrop = (event: DragEvent) => {
  event.preventDefault()
  dragActive.value = false

  if (props.disabled) {
    return
  }

  const file = event.dataTransfer?.files?.[0]
  handleFile(file)
}

const clearSelection = () => {
  validationError.value = ''
  emit('clear')
}
</script>

<template>
  <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div
      class="rounded-xl border-2 border-dashed p-6 text-center transition"
      :class="[
        dragActive ? 'border-cyan-500 bg-cyan-50' : 'border-slate-300 bg-slate-50',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-cyan-400 hover:bg-cyan-50/50'
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

      <p class="text-sm font-semibold text-slate-800">
        Arrastra tu logo aquí o haz click para subir
      </p>
      <p class="mt-1 text-xs text-slate-500">
        PNG, JPG, WEBP, SVG • máximo {{ maxSizeMb }}MB
      </p>
    </div>

    <div class="mt-3 min-h-5">
      <p v-if="fileName" class="truncate text-xs text-slate-600">
        Archivo: <span class="font-medium text-slate-800">{{ fileName }}</span>
      </p>
      <p v-else class="text-xs text-slate-400">
        Ningún archivo seleccionado
      </p>
    </div>

    <div class="mt-3 flex items-center justify-between gap-2">
      <UButton
        label="Seleccionar imagen"
        icon="i-lucide-upload"
        variant="soft"
        color="neutral"
        :disabled="disabled"
        @click="inputRef?.click()"
      />

      <UButton
        label="Limpiar"
        icon="i-lucide-trash-2"
        color="neutral"
        variant="ghost"
        :disabled="disabled || !fileName"
        @click="clearSelection"
      />
    </div>

    <p v-if="validationError" class="mt-3 text-xs font-medium text-rose-600">
      {{ validationError }}
    </p>
  </section>
</template>
