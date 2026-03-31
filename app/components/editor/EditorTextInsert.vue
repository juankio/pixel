<script setup lang="ts">
import type { TextInsertOptions } from '~/types'
import { parseSvg, getSvgDimensions } from '~/utils/svg-dom'

const props = withDefaults(defineProps<{
  disabled?: boolean
  svgResult?: string
  selectedElementId?: string
}>(), {
  disabled: false,
  svgResult: '',
  selectedElementId: ''
})

const emit = defineEmits<{
  (event: 'insert-text', options: TextInsertOptions): void
  (event: 'update-text', id: string, options: TextInsertOptions): void
}>()

type Font = { label: string, value: string, google?: string, group: string }

const FONTS: Font[] = [
  { label: 'Arial', value: 'Arial, sans-serif', group: 'Sistema' },
  { label: 'Georgia', value: 'Georgia, serif', group: 'Sistema' },
  { label: 'Verdana', value: 'Verdana, sans-serif', group: 'Sistema' },
  { label: 'Impact', value: 'Impact, sans-serif', group: 'Sistema' },
  { label: 'Pacifico', value: 'Pacifico', google: 'Pacifico', group: 'Script' },
  { label: 'Dancing Script', value: '"Dancing Script"', google: 'Dancing+Script:wght@400;700', group: 'Script' },
  { label: 'Great Vibes', value: '"Great Vibes"', google: 'Great+Vibes', group: 'Script' },
  { label: 'Satisfy', value: 'Satisfy', google: 'Satisfy', group: 'Script' },
  { label: 'Lobster', value: 'Lobster', google: 'Lobster', group: 'Script' },
  { label: 'Parisienne', value: 'Parisienne', google: 'Parisienne', group: 'Script' },
  { label: 'Oswald', value: 'Oswald', google: 'Oswald:wght@400;700', group: 'Display' },
  { label: 'Montserrat', value: 'Montserrat', google: 'Montserrat:wght@400;700', group: 'Display' },
  { label: 'Raleway', value: 'Raleway', google: 'Raleway:wght@400;700', group: 'Display' },
  { label: 'Anton', value: 'Anton', google: 'Anton', group: 'Display' },
  { label: 'Bebas Neue', value: '"Bebas Neue"', google: 'Bebas+Neue', group: 'Display' }
]

const ANCHORS = [
  { icon: 'i-lucide-align-left', value: 'start' as const },
  { icon: 'i-lucide-align-center', value: 'middle' as const },
  { icon: 'i-lucide-align-right', value: 'end' as const }
]

const loadedFonts = new Set<string>()
const loadGoogleFont = (googleName: string) => {
  if (!import.meta.client || loadedFonts.has(googleName)) return
  loadedFonts.add(googleName)
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${googleName}&display=swap`
  document.head.appendChild(link)
}

// Form state
const content = ref('')
const selectedFont = ref<Font>(FONTS[0]!)
const fontSize = ref(48)
const fill = ref('#000000')
const fontWeight = ref<'normal' | 'bold'>('normal')
const italic = ref(false)
const x = ref(50)
const y = ref(50)
const textAnchor = ref<'start' | 'middle' | 'end'>('middle')

// Edit mode: tracks which text element is being edited
const editingId = ref('')
const isEditing = computed(() => editingId.value !== '')

// Load all Google Fonts for previews
onMounted(() => {
  FONTS.forEach(f => { if (f.google) loadGoogleFont(f.google) })
})

watch(selectedFont, (font) => {
  if (font.google) loadGoogleFont(font.google)
})

// Detect when a text element is selected → switch to edit mode
watch(() => props.selectedElementId, (id) => {
  if (!id || !props.svgResult || !import.meta.client) {
    editingId.value = ''
    return
  }

  const doc = parseSvg(props.svgResult)
  const el = doc.querySelector(`[data-editor-id="${id}"]`)

  if (!el || el.tagName.toLowerCase() !== 'text') {
    editingId.value = ''
    return
  }

  // Load element props into the form
  const dims = getSvgDimensions(props.svgResult)
  const elX = parseFloat(el.getAttribute('x') ?? '0')
  const elY = parseFloat(el.getAttribute('y') ?? '0')
  const elFontFamily = el.getAttribute('font-family') ?? 'Arial, sans-serif'

  content.value = el.textContent ?? ''
  fontSize.value = parseFloat(el.getAttribute('font-size') ?? '48')
  fill.value = el.getAttribute('fill') ?? '#000000'
  fontWeight.value = (el.getAttribute('font-weight') ?? 'normal') as 'normal' | 'bold'
  italic.value = el.getAttribute('font-style') === 'italic'
  x.value = dims.width > 0 ? Math.round((elX / dims.width) * 100) : 50
  y.value = dims.height > 0 ? Math.round((elY / dims.height) * 100) : 50
  textAnchor.value = (el.getAttribute('text-anchor') ?? 'middle') as 'start' | 'middle' | 'end'
  selectedFont.value = FONTS.find(f => f.value === elFontFamily) ?? FONTS[0]!
  editingId.value = id
})

const canSubmit = computed(() => content.value.trim().length > 0 && !props.disabled)

const buildOptions = (): TextInsertOptions => ({
  content: content.value.trim(),
  fontFamily: selectedFont.value.value,
  googleFont: selectedFont.value.google,
  fontSize: fontSize.value,
  fill: fill.value,
  fontWeight: fontWeight.value,
  italic: italic.value,
  x: x.value,
  y: y.value,
  textAnchor: textAnchor.value
})

const onSubmit = () => {
  if (!canSubmit.value) return
  if (isEditing.value) {
    emit('update-text', editingId.value, buildOptions())
  } else {
    emit('insert-text', buildOptions())
    content.value = ''
  }
}

const onCancelEdit = () => {
  editingId.value = ''
  content.value = ''
}
</script>

<template>
  <section class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
    <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
      <div>
        <h3 class="text-sm font-semibold text-slate-900">
          {{ isEditing ? 'Editar texto' : 'Agregar texto' }}
        </h3>
        <p class="mt-0.5 text-xs text-slate-400">
          {{ isEditing ? 'Modifica el texto seleccionado en el SVG' : 'Inserta texto editable en el SVG' }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <UBadge v-if="isEditing" label="Editando" color="warning" variant="subtle" size="sm" />
        <UIcon name="i-lucide-type" class="size-4 text-slate-400" />
      </div>
    </div>

    <div class="space-y-4 p-5">
      <!-- Texto -->
      <div>
        <label class="mb-1.5 block text-xs font-medium text-slate-600">Texto</label>
        <input
          v-model="content"
          type="text"
          placeholder="Escribe aquí..."
          :disabled="disabled"
          class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-50"
          @keydown.enter="onSubmit"
        />
      </div>

      <!-- Selector de fuente con preview visual -->
      <div>
        <label class="mb-1.5 block text-xs font-medium text-slate-600">Tipografía</label>
        <div class="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
          <button
            v-for="font in FONTS"
            :key="font.value"
            :disabled="disabled"
            :class="[
              'flex flex-col items-center gap-0.5 rounded-xl border px-2 py-2.5 transition-all',
              selectedFont.value === font.value
                ? 'border-cyan-400 bg-cyan-50 ring-1 ring-cyan-400/30'
                : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
            ]"
            @click="selectedFont = font"
          >
            <span class="text-xl leading-none text-slate-800" :style="{ fontFamily: font.value }">Ag</span>
            <span class="text-[9px] text-slate-500 leading-tight text-center">{{ font.label }}</span>
          </button>
        </div>
      </div>

      <!-- Tamaño y color -->
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-600">
            Tamaño
            <span class="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-500">{{ fontSize }}px</span>
          </label>
          <input
            v-model.number="fontSize"
            type="range" min="8" max="200"
            :disabled="disabled"
            class="mt-1 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-cyan-500 disabled:opacity-50"
          />
        </div>
        <div>
          <label class="mb-1.5 block text-xs font-medium text-slate-600">Color</label>
          <input
            v-model="fill"
            type="color"
            :disabled="disabled"
            class="h-9 w-full cursor-pointer rounded-lg border border-slate-200 bg-white p-0.5 disabled:opacity-50"
          />
        </div>
      </div>

      <!-- Estilo y alineación -->
      <div class="flex items-center gap-4">
        <div>
          <label class="mb-1.5 block text-xs font-medium text-slate-600">Estilo</label>
          <div class="flex gap-1.5">
            <button
              :class="['flex size-8 items-center justify-center rounded-lg border text-sm font-bold transition-all', fontWeight === 'bold' ? 'border-cyan-400 bg-cyan-50 text-cyan-700' : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300']"
              :disabled="disabled"
              @click="fontWeight = fontWeight === 'bold' ? 'normal' : 'bold'"
            >B</button>
            <button
              :class="['flex size-8 items-center justify-center rounded-lg border text-sm italic transition-all', italic ? 'border-cyan-400 bg-cyan-50 text-cyan-700' : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300']"
              :disabled="disabled"
              @click="italic = !italic"
            >I</button>
          </div>
        </div>
        <div>
          <label class="mb-1.5 block text-xs font-medium text-slate-600">Alineación</label>
          <div class="flex gap-1">
            <button
              v-for="a in ANCHORS"
              :key="a.value"
              :class="['flex size-8 items-center justify-center rounded-lg border transition-all', textAnchor === a.value ? 'border-cyan-400 bg-cyan-50 text-cyan-600' : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300']"
              :disabled="disabled"
              @click="textAnchor = a.value"
            >
              <UIcon :name="a.icon" class="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Preview en vivo -->
      <div
        v-if="content"
        class="flex min-h-14 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
      >
        <span
          :style="{ fontFamily: selectedFont.value, fontSize: `${Math.min(fontSize, 48)}px`, color: fill, fontWeight, fontStyle: italic ? 'italic' : 'normal' }"
          class="leading-tight"
        >{{ content }}</span>
      </div>

      <!-- Posición -->
      <div class="space-y-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
        <p class="text-xs font-medium text-slate-500">Posición en el SVG</p>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="mb-1 flex items-center justify-between text-xs text-slate-500">
              Horizontal <span class="font-mono">{{ x }}%</span>
            </label>
            <input v-model.number="x" type="range" min="0" max="100" :disabled="disabled"
              class="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-cyan-500 disabled:opacity-50" />
          </div>
          <div>
            <label class="mb-1 flex items-center justify-between text-xs text-slate-500">
              Vertical <span class="font-mono">{{ y }}%</span>
            </label>
            <input v-model.number="y" type="range" min="0" max="100" :disabled="disabled"
              class="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-cyan-500 disabled:opacity-50" />
          </div>
        </div>
      </div>

      <!-- Botones -->
      <div class="flex gap-2">
        <UButton
          v-if="isEditing"
          variant="ghost"
          color="neutral"
          icon="i-lucide-x"
          class="shrink-0"
          @click="onCancelEdit"
        />
        <UButton
          block
          :icon="isEditing ? 'i-lucide-check' : 'i-lucide-plus'"
          :color="isEditing ? 'success' : 'primary'"
          :disabled="!canSubmit"
          @click="onSubmit"
        >
          {{ isEditing ? 'Actualizar texto' : 'Agregar texto al SVG' }}
        </UButton>
      </div>
    </div>
  </section>
</template>
