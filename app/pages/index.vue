<script setup lang="ts">
import { useVectorize } from '~/composables/useVectorize'

type AdvancedOptions = {
  threshold: number
  turdSize: number
  optCurve: boolean
}

type UpscaleOptions = {
  scale: 2 | 4
  mode: 'fast' | 'quality'
}

type HealthStatus = 'checking' | 'online' | 'offline'
type ColorChannel = 'fill' | 'stroke'
type ColorChangePayload = { from: string, to: string, kind: ColorChannel }
type VectorElementSelectPayload = { id: string, color: string }

const {
  vectorize,
  vectorizeAdvanced,
  upscaleVectorize,
  getHealth,
  getMetrics
} = useVectorize()

const selectedFile = ref<File | null>(null)
const originalPreviewUrl = ref('')
const svgResult = ref('')
const processing = ref(false)
const processingText = ref('Procesando imagen...')
const errorMessage = ref('')
const selectedElementId = ref('')
const selectedElementColor = ref('#000000')

const healthStatus = ref<HealthStatus>('checking')
const healthText = ref('Conectando con backend...')
const metrics = ref<Record<string, unknown> | null>(null)

const hasFile = computed(() => Boolean(selectedFile.value))
const hasSvg = computed(() => Boolean(svgResult.value))
const fileName = computed(() => selectedFile.value?.name ?? '')

const statusClass = computed(() => {
  if (healthStatus.value === 'online') {
    return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  }

  if (healthStatus.value === 'offline') {
    return 'bg-rose-100 text-rose-700 border-rose-200'
  }

  return 'bg-amber-100 text-amber-700 border-amber-200'
})

const normalizeError = (error: unknown) => {
  if (error instanceof Error) {
    return error.message
  }

  return 'Ocurrió un error inesperado.'
}

const summarizePayload = (payload: unknown) => {
  if (typeof payload === 'string') {
    return payload
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>

    if (typeof record.status === 'string') {
      return `status: ${record.status}`
    }

    if (typeof record.message === 'string') {
      return record.message
    }

    const compact = JSON.stringify(payload)
    return compact.length > 90 ? `${compact.slice(0, 90)}...` : compact
  }

  return 'OK'
}

const resetElementSelection = () => {
  selectedElementId.value = ''
  selectedElementColor.value = '#000000'
}

const markPaintableNodes = (svg: string) => {
  if (!svg || !import.meta.client) {
    return svg
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(svg, 'image/svg+xml')
  const attributeMap: Array<[string, string]> = [
    ['fillRule', 'fill-rule'],
    ['clipRule', 'clip-rule'],
    ['strokeWidth', 'stroke-width'],
    ['strokeLinecap', 'stroke-linecap'],
    ['strokeLinejoin', 'stroke-linejoin']
  ]

  for (const element of doc.querySelectorAll('*')) {
    for (const [from, to] of attributeMap) {
      const value = element.getAttribute(from)

      if (!value) {
        continue
      }

      element.setAttribute(to, value)
      element.removeAttribute(from)
    }
  }

  const paintable = doc.querySelectorAll('path, circle, ellipse, rect, polygon, polyline, line, text, g')
  let index = 1

  for (const node of paintable) {
    const hasFill = node.hasAttribute('fill')
    const hasStroke = node.hasAttribute('stroke')
    const style = node.getAttribute('style') || ''
    const hasStylePaint = /(^|;)\s*(fill|stroke)\s*:/.test(style)

    if (!hasFill && !hasStroke && !hasStylePaint) {
      continue
    }

    if (!node.getAttribute('data-editor-id')) {
      node.setAttribute('data-editor-id', `shape-${index}`)
      index += 1
    }
  }

  const serializer = new XMLSerializer()
  return serializer.serializeToString(doc.documentElement)
}

const setVectorSvg = (svg: string) => {
  svgResult.value = markPaintableNodes(svg)
  resetElementSelection()
}

const revokePreviewUrl = () => {
  if (originalPreviewUrl.value) {
    URL.revokeObjectURL(originalPreviewUrl.value)
    originalPreviewUrl.value = ''
  }
}

const setFile = (file: File) => {
  revokePreviewUrl()
  selectedFile.value = file
  originalPreviewUrl.value = URL.createObjectURL(file)
  svgResult.value = ''
  errorMessage.value = ''
  resetElementSelection()
}

const clearFile = () => {
  selectedFile.value = null
  svgResult.value = ''
  errorMessage.value = ''
  resetElementSelection()
  revokePreviewUrl()
}

const withLoader = async (label: string, task: () => Promise<void>) => {
  processing.value = true
  processingText.value = label
  errorMessage.value = ''

  try {
    await task()
  } catch (error) {
    errorMessage.value = normalizeError(error)
  } finally {
    processing.value = false
  }
}

const refreshHealth = async () => {
  healthStatus.value = 'checking'
  healthText.value = 'Consultando /api/health...'

  try {
    const payload = await getHealth()
    healthStatus.value = 'online'
    healthText.value = summarizePayload(payload)
  } catch (error) {
    healthStatus.value = 'offline'
    healthText.value = normalizeError(error)
  }
}

const refreshMetrics = async () => {
  try {
    const payload = await getMetrics()

    if (payload && typeof payload === 'object') {
      metrics.value = payload as Record<string, unknown>
      return
    }

    metrics.value = { value: String(payload) }
  } catch {
    metrics.value = null
  }
}

const requireFile = () => {
  const file = selectedFile.value

  if (!file) {
    throw new Error('Primero sube una imagen para vectorizar.')
  }

  return file
}

const runBasicVectorize = async () => {
  await withLoader('Vectorizando (modo básico)...', async () => {
    const file = requireFile()
    const result = await vectorize(file)
    setVectorSvg(result.svg)
    await refreshMetrics()
  })
}

const runAdvancedVectorize = async (options: AdvancedOptions) => {
  await withLoader('Vectorizando (modo avanzado)...', async () => {
    const file = requireFile()
    const result = await vectorizeAdvanced(file, options)
    setVectorSvg(result.svg)
    await refreshMetrics()
  })
}

const runUpscaleVectorize = async (options: UpscaleOptions) => {
  await withLoader('Procesando en alta calidad...', async () => {
    const file = requireFile()
    const result = await upscaleVectorize(file, options)
    setVectorSvg(result.svg)
    await refreshMetrics()
  })
}

const rgbToHex = (value: string) => {
  const parts = value
    .replace(/rgba?\(/, '')
    .replace(')', '')
    .split(',')
    .slice(0, 3)
    .map(part => Number.parseInt(part.trim(), 10))

  if (parts.length !== 3 || parts.some(part => Number.isNaN(part))) {
    return value.trim().toLowerCase()
  }

  return `#${parts.map(part => part.toString(16).padStart(2, '0')).join('')}`
}

const normalizeColor = (value: string) => {
  const input = value.trim().toLowerCase()

  if (/^#[0-9a-f]{6}$/.test(input)) {
    return input
  }

  if (/^#[0-9a-f]{3}$/.test(input)) {
    return `#${input.slice(1).split('').map(char => `${char}${char}`).join('')}`
  }

  if (input.startsWith('rgb')) {
    return rgbToHex(input)
  }

  if (!import.meta.client) {
    return input
  }

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    return input
  }

  context.fillStyle = '#000'
  context.fillStyle = input

  const computed = context.fillStyle.toLowerCase()

  if (computed.startsWith('#')) {
    return normalizeColor(computed)
  }

  if (computed.startsWith('rgb')) {
    return rgbToHex(computed)
  }

  return computed
}

const sameColor = (left: string, right: string) => {
  return normalizeColor(left) === normalizeColor(right)
}

const replaceColorInStyle = (
  style: string,
  property: ColorChannel,
  from: string,
  to: string
) => {
  const entries = style
    .split(';')
    .map(entry => entry.trim())
    .filter(Boolean)

  let touched = false

  const next = entries.map((entry) => {
    const [prop, ...rest] = entry.split(':')

    if (!prop || !rest.length || prop.trim().toLowerCase() !== property) {
      return entry
    }

    const current = rest.join(':').trim()

    if (!sameColor(current, from)) {
      return entry
    }

    touched = true
    return `${property}:${to}`
  })

  return touched ? next.join(';') : style
}

const setStyleProperty = (style: string, property: ColorChannel, value: string) => {
  const entries = style
    .split(';')
    .map(entry => entry.trim())
    .filter(Boolean)

  let touched = false

  const next = entries.map((entry) => {
    const [prop, ...rest] = entry.split(':')

    if (!prop || !rest.length || prop.trim().toLowerCase() !== property) {
      return entry
    }

    touched = true
    return `${property}:${value}`
  })

  if (!touched) {
    next.push(`${property}:${value}`)
  }

  return next.join(';')
}

const applyColorChange = (payload: ColorChangePayload) => {
  if (!svgResult.value || !import.meta.client) {
    return
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(svgResult.value, 'image/svg+xml')

  const attributeSelector = payload.kind === 'fill' ? '[fill]' : '[stroke]'
  const styleSelector = payload.kind === 'fill' ? '[style*="fill:"]' : '[style*="stroke:"]'

  for (const element of doc.querySelectorAll(attributeSelector)) {
    const current = element.getAttribute(payload.kind)

    if (current && sameColor(current, payload.from)) {
      element.setAttribute(payload.kind, payload.to)
    }
  }

  for (const element of doc.querySelectorAll(styleSelector)) {
    const style = element.getAttribute('style')

    if (!style) {
      continue
    }

    const nextStyle = replaceColorInStyle(style, payload.kind, payload.from, payload.to)

    if (nextStyle !== style) {
      element.setAttribute('style', nextStyle)
    }
  }

  const serializer = new XMLSerializer()
  svgResult.value = serializer.serializeToString(doc.documentElement)
}

const onVectorElementSelect = (payload: VectorElementSelectPayload | null) => {
  if (!payload) {
    resetElementSelection()
    return
  }

  selectedElementId.value = payload.id
  const normalized = normalizeColor(payload.color)
  selectedElementColor.value = /^#[0-9a-f]{6}$/.test(normalized) ? normalized : '#000000'
}

const applySelectedElementColor = (color: string) => {
  if (!svgResult.value || !selectedElementId.value || !import.meta.client) {
    return
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(svgResult.value, 'image/svg+xml')
  const selected = doc.querySelector(`[data-editor-id="${selectedElementId.value}"]`)

  if (!selected) {
    return
  }

  const fill = selected.getAttribute('fill')?.trim()
  const stroke = selected.getAttribute('stroke')?.trim()
  const style = selected.getAttribute('style') || ''

  if (fill && fill !== 'none' && fill !== 'transparent') {
    selected.setAttribute('fill', color)
  } else if (stroke && stroke !== 'none' && stroke !== 'transparent') {
    selected.setAttribute('stroke', color)
  } else if (style.includes('fill:')) {
    selected.setAttribute('style', setStyleProperty(style, 'fill', color))
  } else if (style.includes('stroke:')) {
    selected.setAttribute('style', setStyleProperty(style, 'stroke', color))
  } else {
    selected.setAttribute('fill', color)
  }

  const serializer = new XMLSerializer()
  svgResult.value = serializer.serializeToString(doc.documentElement)
  selectedElementColor.value = color
}

const downloadSvg = () => {
  if (!svgResult.value || !import.meta.client) {
    return
  }

  const blob = new Blob([svgResult.value], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = `vectorized-${Date.now()}.svg`
  anchor.click()

  URL.revokeObjectURL(url)
}

const getSvgDimensions = (svg: string): { width: number, height: number } => {
  if (!import.meta.client) {
    return { width: 1024, height: 1024 }
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(svg, 'image/svg+xml')
  const root = doc.documentElement

  const widthRaw = root.getAttribute('width')
  const heightRaw = root.getAttribute('height')

  const width = widthRaw ? Number.parseFloat(widthRaw) : Number.NaN
  const height = heightRaw ? Number.parseFloat(heightRaw) : Number.NaN

  if (!Number.isNaN(width) && !Number.isNaN(height) && width > 0 && height > 0) {
    return { width, height }
  }

  const viewBoxRaw = root.getAttribute('viewBox')

  if (viewBoxRaw) {
    const parts = viewBoxRaw.split(/\s+/).map(item => Number.parseFloat(item))
    const viewBoxWidth = parts[2]
    const viewBoxHeight = parts[3]

    if (
      parts.length === 4
      && typeof viewBoxWidth === 'number'
      && typeof viewBoxHeight === 'number'
      && viewBoxWidth > 0
      && viewBoxHeight > 0
    ) {
      return { width: viewBoxWidth, height: viewBoxHeight }
    }
  }

  return { width: 1024, height: 1024 }
}

const downloadPng = async () => {
  if (!svgResult.value || !import.meta.client) {
    return
  }

  await withLoader('Exportando PNG...', async () => {
    const { width, height } = getSvgDimensions(svgResult.value)
    const svgBlob = new Blob([svgResult.value], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)

    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error('No se pudo renderizar el SVG para PNG.'))
        img.src = svgUrl
      })

      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(width))
      canvas.height = Math.max(1, Math.round(height))

      const context = canvas.getContext('2d')

      if (!context) {
        throw new Error('No se pudo crear el canvas para exportar PNG.')
      }

      context.clearRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 0, 0, canvas.width, canvas.height)

      const pngBlob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png')
      })

      if (!pngBlob) {
        throw new Error('No se pudo convertir a PNG.')
      }

      const pngUrl = URL.createObjectURL(pngBlob)
      const anchor = document.createElement('a')
      anchor.href = pngUrl
      anchor.download = `vectorized-${Date.now()}.png`
      anchor.click()
      URL.revokeObjectURL(pngUrl)
    } finally {
      URL.revokeObjectURL(svgUrl)
    }
  })
}

onMounted(async () => {
  await Promise.allSettled([
    refreshHealth(),
    refreshMetrics()
  ])
})

onBeforeUnmount(() => {
  revokePreviewUrl()
})
</script>

<template>
  <div class="min-h-screen bg-[radial-gradient(circle_at_top,_#d9f3ff_0%,_#f8fafc_38%,_#f8fafc_100%)]">
    <div class="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
      <header class="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">
              PixelTrace Studio
            </p>
            <h1 class="mt-2 text-2xl font-semibold text-slate-900 md:text-3xl">
              Vectorización profesional de logos en segundos
            </h1>
            <p class="mt-2 text-sm text-slate-600">
              Sube una imagen, ejecuta vectorización básica o avanzada, ajusta colores del SVG en tiempo real y descarga el resultado.
            </p>
          </div>

          <div class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold" :class="statusClass">
            <span class="h-2 w-2 rounded-full" :class="healthStatus === 'online' ? 'bg-emerald-600' : healthStatus === 'offline' ? 'bg-rose-600' : 'bg-amber-600'" />
            {{ healthText }}
          </div>
        </div>
      </header>

      <div v-if="errorMessage" class="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {{ errorMessage }}
      </div>

      <main class="mt-6 grid gap-6 xl:grid-cols-[360px_1fr]">
        <aside class="space-y-4">
          <ImageUploader
            :disabled="processing"
            :file-name="fileName"
            @file-selected="setFile"
            @clear="clearFile"
          />

          <ControlsPanel
            :processing="processing"
            :has-file="hasFile"
            :has-svg="hasSvg"
            :health-status="healthStatus"
            :health-text="healthText"
            :metrics="metrics"
            @vectorize-basic="runBasicVectorize"
            @vectorize-advanced="runAdvancedVectorize"
            @upscale="runUpscaleVectorize"
            @download-svg="downloadSvg"
            @download-png="downloadPng"
            @refresh-health="refreshHealth"
            @refresh-metrics="refreshMetrics"
          />
        </aside>

        <section class="space-y-4">
          <div class="grid gap-4 lg:grid-cols-2">
            <PreviewImage :src="originalPreviewUrl" />
            <VectorPreview
              :svg="svgResult"
              :interactive="hasSvg"
              :selected-element-id="selectedElementId"
              @element-select="onVectorElementSelect"
            />
          </div>

          <ColorEditor
            :svg="svgResult"
            :disabled="processing || !hasSvg"
            :selected-element-id="selectedElementId"
            :selected-element-color="selectedElementColor"
            @color-change="applyColorChange"
            @selected-color-change="applySelectedElementColor"
          />
        </section>
      </main>
    </div>

    <Loader :show="processing" :text="processingText" />
  </div>
</template>
