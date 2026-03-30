<script setup lang="ts">
const props = withDefaults(defineProps<{
  svg?: string
  title?: string
  interactive?: boolean
  selectedElementIds?: string[]
}>(), {
  svg: '',
  title: 'Resultado vectorizado',
  interactive: false,
  selectedElementIds: () => []
})

const emit = defineEmits<{
  (event: 'selection-change', payload: { ids: string[], activeId: string, color: string }): void
}>()

const canvasRef = ref<HTMLElement | null>(null)
const lastHitIds = ref<string[]>([])
const lastHitIndex = ref(0)
const lastPointer = ref<{ x: number, y: number } | null>(null)

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

  if (!props.selectedElementIds.length) {
    return
  }

  for (const id of props.selectedElementIds) {
    const selected = canvasRef.value.querySelector(
      `[data-editor-id="${id}"]`
    )

    if (selected) {
      selected.classList.add('vector-selected')
    }
  }
}

watch(
  () => [props.svg, props.selectedElementIds],
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

  const canvas = canvasRef.value

  if (!canvas) {
    emit('selection-change', { ids: [], activeId: '', color: '#000000' })
    return
  }

  const hitElements = document
    .elementsFromPoint(event.clientX, event.clientY)
    .map((node) => {
      if (!(node instanceof Element)) {
        return null
      }

      const candidate = node.closest('[data-editor-id]')
      return candidate && canvas.contains(candidate) ? candidate : null
    })
    .filter((node): node is Element => Boolean(node))

  const hitIds = [...new Set(
    hitElements
      .map(element => element.getAttribute('data-editor-id') || '')
      .filter(Boolean)
  )]

  if (!hitIds.length) {
    lastHitIds.value = []
    lastHitIndex.value = 0
    lastPointer.value = null
    emit('selection-change', { ids: [], activeId: '', color: '#000000' })
    return
  }

  const isToggleMode = event.ctrlKey || event.metaKey || event.shiftKey
  let id = hitIds[0]

  if (!isToggleMode) {
    const pointer = lastPointer.value
    const isNearPrevious = pointer
      ? Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) <= 4
      : false
    const sameHitStack = hitIds.length === lastHitIds.value.length
      && hitIds.every((hitId, index) => hitId === lastHitIds.value[index])

    if (isNearPrevious && sameHitStack && hitIds.length > 1) {
      const active = props.selectedElementIds.length === 1 ? props.selectedElementIds[0] : ''
      const currentIndex = active ? hitIds.indexOf(active) : -1

      if (currentIndex >= 0) {
        lastHitIndex.value = (currentIndex + 1) % hitIds.length
      } else {
        lastHitIndex.value = (lastHitIndex.value + 1) % hitIds.length
      }

      id = hitIds[lastHitIndex.value] || hitIds[0] || ''
    } else {
      lastHitIndex.value = 0
      id = hitIds[0] || ''
    }
  }

  if (!id) {
    emit('selection-change', { ids: [], activeId: '', color: '#000000' })
    return
  }

  lastHitIds.value = hitIds
  lastPointer.value = { x: event.clientX, y: event.clientY }

  const currentIds = [...props.selectedElementIds]
  let nextIds: string[] = []

  if (isToggleMode) {
    if (currentIds.includes(id)) {
      nextIds = currentIds.filter(item => item !== id)
    } else {
      nextIds = [...currentIds, id]
    }
  } else {
    nextIds = [id]
  }

  const activeElement = canvas.querySelector(`[data-editor-id="${id}"]`)
  const activeColor = activeElement ? resolveElementColor(activeElement) : '#000000'

  emit('selection-change', {
    ids: nextIds,
    activeId: id,
    color: activeColor
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
          Click para seleccionar. Repite click para ciclar capas superpuestas. Usa Ctrl/Cmd/Shift + click para multi-selección.
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
        class="vector-canvas h-[320px] w-full overflow-auto rounded-lg p-3 md:h-[430px]"
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
.vector-canvas {
  background-color: #f8fafc;
  background-image:
    linear-gradient(45deg, #e2e8f0 25%, transparent 25%),
    linear-gradient(-45deg, #e2e8f0 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #e2e8f0 75%),
    linear-gradient(-45deg, transparent 75%, #e2e8f0 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
}

.vector-canvas :deep(svg) {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.vector-canvas :deep(.vector-selected) {
  filter: drop-shadow(0 0 2px #06b6d4);
}
</style>
