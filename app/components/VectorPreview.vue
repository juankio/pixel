<script setup lang="ts">
const props = withDefaults(defineProps<{
  svg?: string
  title?: string
  interactive?: boolean
  selectedElementId?: string
}>(), {
  svg: '',
  title: 'Resultado vectorizado',
  interactive: false,
  selectedElementId: ''
})

const emit = defineEmits<{
  (event: 'element-select', payload: { id: string, color: string } | null): void
}>()

const canvasRef = ref<HTMLElement | null>(null)

const getStyleColor = (styleText: string, property: 'fill' | 'stroke') => {
  const pattern = new RegExp(`(^|;)\\s*${property}\\s*:\\s*([^;]+)`, 'i')
  const match = styleText.match(pattern)
  return match?.[2]?.trim() ?? null
}

const resolveElementColor = (element: Element) => {
  const fill = element.getAttribute('fill')?.trim()

  if (fill && fill !== 'none' && fill !== 'transparent') {
    return fill
  }

  const stroke = element.getAttribute('stroke')?.trim()

  if (stroke && stroke !== 'none' && stroke !== 'transparent') {
    return stroke
  }

  const style = element.getAttribute('style')

  if (!style) {
    return '#000000'
  }

  const fillStyle = getStyleColor(style, 'fill')

  if (fillStyle && fillStyle !== 'none' && fillStyle !== 'transparent') {
    return fillStyle
  }

  const strokeStyle = getStyleColor(style, 'stroke')

  if (strokeStyle && strokeStyle !== 'none' && strokeStyle !== 'transparent') {
    return strokeStyle
  }

  return '#000000'
}

const applySelectionHighlight = () => {
  if (!canvasRef.value) {
    return
  }

  const selectedNodes = canvasRef.value.querySelectorAll('.vector-selected')

  for (const selectedNode of selectedNodes) {
    selectedNode.classList.remove('vector-selected')
  }

  if (!props.selectedElementId) {
    return
  }

  const selected = canvasRef.value.querySelector(
    `[data-editor-id="${props.selectedElementId}"]`
  )

  if (selected) {
    selected.classList.add('vector-selected')
  }
}

watch(
  () => [props.svg, props.selectedElementId],
  async () => {
    await nextTick()
    applySelectionHighlight()
  },
  { immediate: true }
)

const onCanvasClick = (event: MouseEvent) => {
  if (!props.interactive) {
    return
  }

  const target = event.target as Element | null
  const selected = target?.closest('[data-editor-id]')

  if (!selected) {
    emit('element-select', null)
    return
  }

  const id = selected.getAttribute('data-editor-id')

  if (!id) {
    emit('element-select', null)
    return
  }

  emit('element-select', {
    id,
    color: resolveElementColor(selected)
  })
}
</script>

<template>
  <article class="flex h-full min-h-72 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <header class="mb-3 flex items-center justify-between">
      <div>
        <h3 class="text-sm font-semibold text-slate-800">
          {{ title }}
        </h3>
        <p v-if="interactive && svg" class="text-[11px] text-slate-500">
          Click en una parte para editar ese elemento.
        </p>
      </div>
      <span class="rounded-full bg-cyan-50 px-2 py-1 text-[11px] font-medium text-cyan-700">
        SVG
      </span>
    </header>

    <div class="grid grow place-items-center rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div
        v-if="svg"
        ref="canvasRef"
        class="vector-canvas max-h-80 w-full overflow-auto rounded-lg bg-white p-4"
        v-html="svg"
        @click="onCanvasClick"
      />
      <p v-else class="text-sm text-slate-400">
        Ejecuta una vectorización para ver aquí tu SVG.
      </p>
    </div>
  </article>
</template>

<style scoped>
.vector-canvas :deep(svg) {
  width: 100%;
  height: 100%;
  max-height: 18rem;
  object-fit: contain;
}

.vector-canvas :deep(.vector-selected) {
  filter: drop-shadow(0 0 2px #06b6d4);
}
</style>
