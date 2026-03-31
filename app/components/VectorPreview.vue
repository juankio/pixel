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

const resolveElementColor = (el: Element): string => {
  const fill = el.getAttribute('fill')?.trim()
  if (fill && fill !== 'none' && fill !== 'transparent') return fill

  const stroke = el.getAttribute('stroke')?.trim()
  if (stroke && stroke !== 'none' && stroke !== 'transparent') return stroke

  const style = el.getAttribute('style') || ''
  const fillMatch = style.match(/(^|;)\s*fill\s*:\s*([^;]+)/i)?.[2]?.trim()
  if (fillMatch && fillMatch !== 'none' && fillMatch !== 'transparent') return fillMatch

  const strokeMatch = style.match(/(^|;)\s*stroke\s*:\s*([^;]+)/i)?.[2]?.trim()
  if (strokeMatch && strokeMatch !== 'none' && strokeMatch !== 'transparent') return strokeMatch

  return '#000000'
}

const applySelectionHighlight = () => {
  if (!canvasRef.value) return
  for (const node of canvasRef.value.querySelectorAll('.vector-selected')) {
    node.classList.remove('vector-selected')
  }
  for (const id of props.selectedElementIds) {
    canvasRef.value.querySelector(`[data-editor-id="${id}"]`)?.classList.add('vector-selected')
  }
}

watch(() => [props.svg, props.selectedElementIds], async () => {
  await nextTick()
  applySelectionHighlight()
}, { immediate: true })

const onCanvasClick = (event: MouseEvent) => {
  if (!props.interactive) return
  const canvas = canvasRef.value
  if (!canvas) { emit('selection-change', { ids: [], activeId: '', color: '#000000' }); return }

  const hitIds = [...new Set(
    document.elementsFromPoint(event.clientX, event.clientY)
      .map(node => node.closest('[data-editor-id]'))
      .filter((n): n is Element => Boolean(n) && canvas.contains(n!))
      .map(n => n.getAttribute('data-editor-id') || '')
      .filter(Boolean)
  )]

  if (!hitIds.length) {
    lastHitIds.value = []; lastHitIndex.value = 0; lastPointer.value = null
    emit('selection-change', { ids: [], activeId: '', color: '#000000' }); return
  }

  const isToggle = event.ctrlKey || event.metaKey || event.shiftKey
  let id = hitIds[0]!

  if (!isToggle) {
    const ptr = lastPointer.value
    const sameSpot = ptr ? Math.hypot(event.clientX - ptr.x, event.clientY - ptr.y) <= 4 : false
    const sameStack = hitIds.length === lastHitIds.value.length && hitIds.every((h, i) => h === lastHitIds.value[i])

    if (sameSpot && sameStack && hitIds.length > 1) {
      const active = props.selectedElementIds.length === 1 ? props.selectedElementIds[0] : ''
      const ci = active ? hitIds.indexOf(active) : -1
      lastHitIndex.value = ci >= 0 ? (ci + 1) % hitIds.length : (lastHitIndex.value + 1) % hitIds.length
      id = hitIds[lastHitIndex.value] || hitIds[0]!
    } else {
      lastHitIndex.value = 0; id = hitIds[0]!
    }
  }

  lastHitIds.value = hitIds
  lastPointer.value = { x: event.clientX, y: event.clientY }

  const current = [...props.selectedElementIds]
  const nextIds = isToggle
    ? current.includes(id) ? current.filter(i => i !== id) : [...current, id]
    : [id]

  const activeEl = canvas.querySelector(`[data-editor-id="${id}"]`)
  emit('selection-change', { ids: nextIds, activeId: id, color: activeEl ? resolveElementColor(activeEl) : '#000000' })
}
</script>

<template>
  <article class="flex h-full min-h-72 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
    <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
      <div>
        <h3 class="text-sm font-semibold text-slate-900">{{ title }}</h3>
        <p v-if="interactive && svg" class="mt-0.5 text-[11px] text-slate-400">
          Click para seleccionar · Click repetido para ciclar capas
        </p>
      </div>
      <UBadge label="SVG" color="primary" variant="subtle" size="sm" />
    </div>

    <div class="grid grow place-items-center bg-slate-50/50 p-4">
      <div
        v-if="svg"
        ref="canvasRef"
        class="vector-canvas h-[320px] w-full overflow-auto rounded-xl p-3 md:h-[430px]"
        v-html="svg"
        @click="onCanvasClick"
      />
      <p v-else class="text-sm text-slate-400">
        Ejecuta una vectorización para ver tu SVG aquí.
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
.vector-canvas :deep(svg) { width: 100%; height: 100%; object-fit: contain; display: block; }
.vector-canvas :deep(.vector-selected) { filter: drop-shadow(0 0 3px #06b6d4) drop-shadow(0 0 1px #0891b2); }
</style>
