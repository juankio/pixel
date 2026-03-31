<script setup lang="ts">
import type { SvgColorEntry } from '~/types'
import { isSkippableColor, normalizeColorOrNull } from '~/utils/color'

const props = withDefaults(defineProps<{
  svg?: string
  disabled?: boolean
  selectedElementId?: string
  selectedElementColor?: string
}>(), {
  svg: '',
  disabled: false,
  selectedElementId: '',
  selectedElementColor: '#000000'
})

const emit = defineEmits<{
  (event: 'color-change', payload: { from: string, to: string, kind: 'fill' | 'stroke' }): void
  (event: 'selected-color-change', color: string): void
}>()

const colors = ref<SvgColorEntry[]>([])

const fillPattern = /fill\s*:\s*([^;"']+)/i
const strokePattern = /stroke\s*:\s*([^;"']+)/i

const collectColors = (svg: string): SvgColorEntry[] => {
  if (!svg || !import.meta.client) return []
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
  const found = new Map<string, SvgColorEntry>()

  const register = (kind: 'fill' | 'stroke', raw: string) => {
    const hex = normalizeColorOrNull(raw)
    if (hex) found.set(`${kind}:${raw}`, { key: `${kind}:${raw}`, kind, raw, hex })
  }

  for (const el of doc.querySelectorAll('[fill]')) {
    const v = el.getAttribute('fill')?.trim()
    if (v && !isSkippableColor(v)) register('fill', v)
  }
  for (const el of doc.querySelectorAll('[stroke]')) {
    const v = el.getAttribute('stroke')?.trim()
    if (v && !isSkippableColor(v)) register('stroke', v)
  }
  for (const el of doc.querySelectorAll('[style*="fill:"]')) {
    const m = el.getAttribute('style')?.match(fillPattern)
    const v = m?.[1]?.trim()
    if (v && !isSkippableColor(v)) register('fill', v)
  }
  for (const el of doc.querySelectorAll('[style*="stroke:"]')) {
    const m = el.getAttribute('style')?.match(strokePattern)
    const v = m?.[1]?.trim()
    if (v && !isSkippableColor(v)) register('stroke', v)
  }

  return [...found.values()]
}

watch(() => props.svg, svg => { colors.value = collectColors(svg) }, { immediate: true })

const onColorInput = (entry: SvgColorEntry, event: Event) => {
  const color = (event.target as HTMLInputElement).value?.toLowerCase()
  if (!color || color === entry.hex || props.disabled) return
  emit('color-change', { from: entry.raw, to: color, kind: entry.kind })
}

const onSelectedColorInput = (event: Event) => {
  const color = (event.target as HTMLInputElement).value?.toLowerCase()
  if (!color || props.disabled) return
  emit('selected-color-change', color)
}
</script>

<template>
  <section class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
    <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
      <div>
        <h3 class="text-sm font-semibold text-slate-900">Editor de colores</h3>
        <p class="mt-0.5 text-xs text-slate-400">Paleta extraída del SVG</p>
      </div>
      <UBadge v-if="colors.length" :label="`${colors.length} colores`" color="neutral" variant="subtle" />
    </div>

    <div class="space-y-3 p-5">
      <div v-if="!svg" class="rounded-xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-400">
        Cuando tengas un SVG, aquí podrás editar su paleta en tiempo real.
      </div>

      <template v-if="svg">
        <ColorSelectedColorEditor
          :selected-element-id="selectedElementId"
          :selected-element-color="selectedElementColor"
          :disabled="disabled"
          @color-input="onSelectedColorInput"
          @set-transparent="emit('selected-color-change', 'none')"
        />
        <ColorList
          :colors="colors"
          :disabled="disabled"
          @color-input="onColorInput"
          @set-transparent="entry => emit('color-change', { from: entry.raw, to: 'none', kind: entry.kind })"
        />
      </template>
    </div>
  </section>
</template>
