<script setup lang="ts">
type SvgColorEntry = {
  key: string
  kind: 'fill' | 'stroke'
  raw: string
  hex: string
}

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

const rgbToHex = (value: string) => {
  const parts = value
    .replace(/rgba?\(/, '')
    .replace(')', '')
    .split(',')
    .slice(0, 3)
    .map(part => Number.parseInt(part.trim(), 10))

  if (parts.length !== 3 || parts.some(part => Number.isNaN(part))) {
    return null
  }

  return `#${parts.map(part => part.toString(16).padStart(2, '0')).join('')}`
}

const normalizeHex = (value: string) => {
  const trimmed = value.trim().toLowerCase()

  if (/^#[0-9a-f]{6}$/.test(trimmed)) {
    return trimmed
  }

  if (/^#[0-9a-f]{3}$/.test(trimmed)) {
    return `#${trimmed.slice(1).split('').map(char => `${char}${char}`).join('')}`
  }

  if (trimmed.startsWith('rgb')) {
    return rgbToHex(trimmed)
  }

  if (!import.meta.client) {
    return null
  }

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    return null
  }

  context.fillStyle = '#000'
  context.fillStyle = trimmed

  const computed = context.fillStyle.toLowerCase()

  if (computed.startsWith('#')) {
    return normalizeHex(computed)
  }

  if (computed.startsWith('rgb')) {
    return rgbToHex(computed)
  }

  return null
}

const isSkippableColor = (value: string) => {
  const normalized = value.trim().toLowerCase()
  return normalized === 'none' || normalized === 'transparent' || normalized.startsWith('url(')
}

const collectColors = (svg: string) => {
  if (!svg || !import.meta.client) {
    return []
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(svg, 'image/svg+xml')
  const found = new Map<string, SvgColorEntry>()

  const registerColor = (kind: 'fill' | 'stroke', raw: string) => {
    const hex = normalizeHex(raw)

    if (!hex) {
      return
    }

    const key = `${kind}:${raw}`
    found.set(key, { key, kind, raw, hex })
  }

  for (const element of doc.querySelectorAll('[fill]')) {
    const fill = element.getAttribute('fill')?.trim()

    if (!fill || isSkippableColor(fill)) {
      continue
    }

    registerColor('fill', fill)
  }

  for (const element of doc.querySelectorAll('[stroke]')) {
    const stroke = element.getAttribute('stroke')?.trim()

    if (!stroke || isSkippableColor(stroke)) {
      continue
    }

    registerColor('stroke', stroke)
  }

  for (const element of doc.querySelectorAll('[style*="fill:"]')) {
    const style = element.getAttribute('style')

    if (!style) {
      continue
    }

    const match = style.match(fillPattern)
    const fill = match?.[1]?.trim()

    if (!fill || isSkippableColor(fill)) {
      continue
    }

    registerColor('fill', fill)
  }

  for (const element of doc.querySelectorAll('[style*="stroke:"]')) {
    const style = element.getAttribute('style')

    if (!style) {
      continue
    }

    const match = style.match(strokePattern)
    const stroke = match?.[1]?.trim()

    if (!stroke || isSkippableColor(stroke)) {
      continue
    }

    registerColor('stroke', stroke)
  }

  return [...found.values()]
}

watch(
  () => props.svg,
  (value) => {
    colors.value = collectColors(value)
  },
  { immediate: true }
)

const onColorInput = (entry: SvgColorEntry, event: Event) => {
  const target = event.target as HTMLInputElement
  const nextColor = target.value?.toLowerCase()

  if (!nextColor || nextColor === entry.hex || props.disabled) {
    return
  }

  emit('color-change', { from: entry.raw, to: nextColor, kind: entry.kind })
}

const onSelectedColorInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const nextColor = target.value?.toLowerCase()

  if (!nextColor || props.disabled) {
    return
  }

  emit('selected-color-change', nextColor)
}
</script>

<template>
  <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div class="mb-3 flex items-center justify-between">
      <h3 class="text-sm font-semibold text-slate-800">
        Editor de colores
      </h3>
      <span class="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
        {{ colors.length }} colores
      </span>
    </div>

    <div v-if="!svg" class="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-400">
      Cuando tengas un SVG vectorizado, aquí podrás editar su paleta en tiempo real.
    </div>

    <div
      v-if="svg && selectedElementId"
      class="mb-3 flex items-center justify-between rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2"
    >
      <p class="text-xs font-medium text-cyan-800">
        Elemento seleccionado: <code>{{ selectedElementId }}</code>
      </p>

      <input
        type="color"
        class="h-8 w-10 cursor-pointer rounded border border-cyan-300 bg-white"
        :value="selectedElementColor"
        :disabled="disabled"
        @input="onSelectedColorInput"
      >
    </div>

    <div v-if="svg && colors.length === 0" class="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-400">
      No se detectaron colores editables (`fill` o `stroke`) en este SVG.
    </div>

    <div v-if="svg && colors.length > 0" class="space-y-2">
      <div
        v-for="entry in colors"
        :key="entry.key"
        class="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
      >
        <div class="flex min-w-0 items-center gap-2">
          <span
            class="h-5 w-5 shrink-0 rounded-md border border-slate-300"
            :style="{ backgroundColor: entry.hex }"
          />
          <code class="truncate text-xs text-slate-700">{{ entry.raw }}</code>
          <span class="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
            {{ entry.kind }}
          </span>
        </div>

        <input
          type="color"
          class="h-8 w-10 cursor-pointer rounded border border-slate-300 bg-white"
          :value="entry.hex"
          :disabled="disabled"
          @input="onColorInput(entry, $event)"
        >
      </div>
    </div>
  </section>
</template>
