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
type VectorSelectionChangePayload = { ids: string[], activeId: string, color: string }

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
const selectedElementIds = ref<string[]>([])
const selectedElementColor = ref('#000000')
const svgHistory = ref<string[]>([])
const autoFitEnabled = ref(true)

const healthStatus = ref<HealthStatus>('checking')
const healthText = ref('Conectando con backend...')
const metrics = ref<Record<string, unknown> | null>(null)

const hasFile = computed(() => Boolean(selectedFile.value))
const hasSvg = computed(() => Boolean(svgResult.value))
const fileName = computed(() => selectedFile.value?.name ?? '')
const activeSelectedElementId = computed(() => {
  return selectedElementIds.value.length ? selectedElementIds.value[selectedElementIds.value.length - 1] : ''
})
const selectedElementCount = computed(() => selectedElementIds.value.length)

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
  selectedElementIds.value = []
  selectedElementColor.value = '#000000'
}

const pushSvgHistory = () => {
  if (!svgResult.value) {
    return
  }

  svgHistory.value.push(svgResult.value)

  if (svgHistory.value.length > 30) {
    svgHistory.value.shift()
  }
}

const undoLastSvgChange = () => {
  const previous = svgHistory.value.pop()

  if (!previous) {
    return
  }

  svgResult.value = previous
  resetElementSelection()
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

  const paintable = doc.querySelectorAll('path, circle, ellipse, rect, polygon, polyline, line, text')
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

const serializeSvg = (svgElement: SVGSVGElement) => {
  const serializer = new XMLSerializer()
  return serializer.serializeToString(svgElement)
}

const autoFitSvgToContent = async (recordHistory = true) => {
  if (!import.meta.client || !svgResult.value) {
    return false
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(svgResult.value, 'image/svg+xml')
  const root = doc.documentElement as unknown as SVGSVGElement

  if (!root || root.tagName.toLowerCase() !== 'svg') {
    return false
  }

  const host = document.createElement('div')
  host.style.position = 'fixed'
  host.style.left = '-100000px'
  host.style.top = '-100000px'
  host.style.visibility = 'hidden'
  host.style.pointerEvents = 'none'
  host.style.width = '0'
  host.style.height = '0'
  host.style.overflow = 'hidden'

  const liveSvg = root.cloneNode(true) as SVGSVGElement
  liveSvg.removeAttribute('width')
  liveSvg.removeAttribute('height')
  host.appendChild(liveSvg)
  document.body.appendChild(host)

  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  const graphics = liveSvg.querySelectorAll<SVGGraphicsElement>('path, circle, ellipse, rect, polygon, polyline, line, text, use')

  for (const node of graphics) {
    try {
      const bbox = node.getBBox()

      if (!Number.isFinite(bbox.x) || !Number.isFinite(bbox.y)) {
        continue
      }

      if (bbox.width === 0 && bbox.height === 0) {
        continue
      }

      minX = Math.min(minX, bbox.x)
      minY = Math.min(minY, bbox.y)
      maxX = Math.max(maxX, bbox.x + bbox.width)
      maxY = Math.max(maxY, bbox.y + bbox.height)
    } catch {
      continue
    }
  }

  document.body.removeChild(host)

  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    return false
  }

  const width = Math.max(1, maxX - minX)
  const height = Math.max(1, maxY - minY)
  const padding = Math.max(2, Math.max(width, height) * 0.04)
  const nextViewBox = `${minX - padding} ${minY - padding} ${width + padding * 2} ${height + padding * 2}`

  root.setAttribute('viewBox', nextViewBox)
  root.setAttribute('preserveAspectRatio', 'xMidYMid meet')
  root.removeAttribute('width')
  root.removeAttribute('height')

  if (recordHistory) {
    pushSvgHistory()
  }

  svgResult.value = serializeSvg(root)
  return true
}

const setVectorSvg = async (svg: string) => {
  svgHistory.value = []
  svgResult.value = markPaintableNodes(svg)
  resetElementSelection()

  if (autoFitEnabled.value) {
    await autoFitSvgToContent(false)
  }
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
  svgHistory.value = []
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
    await setVectorSvg(result.svg)
    await refreshMetrics()
  })
}

const runAdvancedVectorize = async (options: AdvancedOptions) => {
  await withLoader('Vectorizando (modo avanzado)...', async () => {
    const file = requireFile()
    const result = await vectorizeAdvanced(file, options)
    await setVectorSvg(result.svg)
    await refreshMetrics()
  })
}

const runUpscaleVectorize = async (options: UpscaleOptions) => {
  await withLoader('Procesando en alta calidad...', async () => {
    const file = requireFile()
    const result = await upscaleVectorize(file, options)
    await setVectorSvg(result.svg)
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

const setStyleProperty = (style: string, property: string, value: string) => {
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

const isVisiblePaint = (value: string) => {
  const normalized = value.trim().toLowerCase()

  if (!normalized) {
    return false
  }

  if (normalized === 'none' || normalized === 'transparent') {
    return false
  }

  if (normalized.startsWith('url(')) {
    return false
  }

  return true
}

const getStyleProperty = (style: string, property: string) => {
  const entries = style
    .split(';')
    .map(entry => entry.trim())
    .filter(Boolean)

  for (const entry of entries) {
    const [prop, ...rest] = entry.split(':')

    if (!prop || !rest.length) {
      continue
    }

    if (prop.trim().toLowerCase() === property) {
      return rest.join(':').trim()
    }
  }

  return ''
}

const resolvePaintValue = (element: Element, property: ColorChannel) => {
  const style = element.getAttribute('style') || ''
  const styleValue = getStyleProperty(style, property)

  if (styleValue) {
    return styleValue
  }

  return element.getAttribute(property)?.trim() ?? ''
}

const getGeometrySignature = (element: Element) => {
  const tag = element.tagName.toLowerCase()
  const read = (name: string) => element.getAttribute(name)?.trim() ?? ''

  if (tag === 'path') {
    return `${tag}|${read('d')}`
  }

  if (tag === 'circle') {
    return `${tag}|${read('cx')}|${read('cy')}|${read('r')}`
  }

  if (tag === 'ellipse') {
    return `${tag}|${read('cx')}|${read('cy')}|${read('rx')}|${read('ry')}`
  }

  if (tag === 'rect') {
    return `${tag}|${read('x')}|${read('y')}|${read('width')}|${read('height')}|${read('rx')}|${read('ry')}`
  }

  if (tag === 'polygon' || tag === 'polyline') {
    return `${tag}|${read('points')}`
  }

  if (tag === 'line') {
    return `${tag}|${read('x1')}|${read('y1')}|${read('x2')}|${read('y2')}`
  }

  if (tag === 'text') {
    return `${tag}|${read('x')}|${read('y')}|${element.textContent?.trim() ?? ''}`
  }

  return ''
}

const setElementTransparent = (element: Element) => {
  element.setAttribute('fill', 'none')
  element.setAttribute('stroke', 'none')
  element.setAttribute('fill-opacity', '0')
  element.setAttribute('stroke-opacity', '0')

  const style = element.getAttribute('style') || ''
  let nextStyle = setStyleProperty(style, 'fill', 'none')
  nextStyle = setStyleProperty(nextStyle, 'stroke', 'none')
  nextStyle = setStyleProperty(nextStyle, 'fill-opacity', '0')
  nextStyle = setStyleProperty(nextStyle, 'stroke-opacity', '0')
  element.setAttribute('style', nextStyle)
}

const setElementFillTransparent = (element: Element) => {
  element.setAttribute('fill', 'none')
  element.setAttribute('fill-opacity', '0')

  const style = element.getAttribute('style') || ''
  let nextStyle = setStyleProperty(style, 'fill', 'none')
  nextStyle = setStyleProperty(nextStyle, 'fill-opacity', '0')
  element.setAttribute('style', nextStyle)
}

const hasVisibleFill = (element: Element) => {
  return isVisiblePaint(resolvePaintValue(element, 'fill'))
}

const hasVisibleStroke = (element: Element) => {
  return isVisiblePaint(resolvePaintValue(element, 'stroke'))
}

const applyColorChange = (payload: ColorChangePayload) => {
  if (!svgResult.value || !import.meta.client) {
    return
  }

  pushSvgHistory()

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

const onVectorSelectionChange = (payload: VectorSelectionChangePayload) => {
  selectedElementIds.value = payload.ids
  const normalized = normalizeColor(payload.color)
  selectedElementColor.value = /^#[0-9a-f]{6}$/.test(normalized) ? normalized : '#000000'
}

const applySelectedElementColor = (color: string) => {
  if (!svgResult.value || !selectedElementIds.value.length || !import.meta.client) {
    return
  }

  pushSvgHistory()

  const parser = new DOMParser()
  const doc = parser.parseFromString(svgResult.value, 'image/svg+xml')

  for (const id of selectedElementIds.value) {
    const selected = doc.querySelector(`[data-editor-id="${id}"]`)

    if (!selected) {
      continue
    }

    const fill = selected.getAttribute('fill')?.trim()
    const stroke = selected.getAttribute('stroke')?.trim()
    const style = selected.getAttribute('style') || ''
    const selectedGeometry = getGeometrySignature(selected)
    const selectedHasStroke = hasVisibleStroke(selected)

    if (color === 'none' || color === 'transparent') {
      if (selectedHasStroke) {
        setElementFillTransparent(selected)
      } else {
        setElementTransparent(selected)
      }

      if (selectedGeometry) {
        for (const candidate of doc.querySelectorAll('[data-editor-id]')) {
          if (candidate === selected) {
            continue
          }

          if (getGeometrySignature(candidate) !== selectedGeometry) {
            continue
          }

          if (hasVisibleStroke(candidate)) {
            continue
          }

          if (!hasVisibleFill(candidate)) {
            continue
          }

          setElementFillTransparent(candidate)
        }
      }

      continue
    }

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
  }

  const serializer = new XMLSerializer()
  svgResult.value = serializer.serializeToString(doc.documentElement)
  const normalized = normalizeColor(color)
  selectedElementColor.value = /^#[0-9a-f]{6}$/.test(normalized) ? normalized : '#000000'
}

const removeSelectedElements = async () => {
  if (!svgResult.value || !selectedElementIds.value.length || !import.meta.client) {
    return
  }

  pushSvgHistory()

  const parser = new DOMParser()
  const doc = parser.parseFromString(svgResult.value, 'image/svg+xml')

  for (const id of selectedElementIds.value) {
    const selected = doc.querySelector(`[data-editor-id="${id}"]`)
    selected?.remove()
  }

  const serializer = new XMLSerializer()
  svgResult.value = serializer.serializeToString(doc.documentElement)
  resetElementSelection()

  if (autoFitEnabled.value) {
    await autoFitSvgToContent(false)
  }
}

const runManualAutoFit = async () => {
  await autoFitSvgToContent(true)
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
              :selected-element-ids="selectedElementIds"
              @selection-change="onVectorSelectionChange"
            />
          </div>

          <div class="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
            <UButton
              icon="i-lucide-trash-2"
              color="error"
              variant="soft"
              :label="selectedElementCount ? `Eliminar seleccionados (${selectedElementCount})` : 'Eliminar seleccionados'"
              :disabled="processing || !selectedElementCount"
              @click="removeSelectedElements"
            />
            <UButton
              icon="i-lucide-mouse-pointer-click"
              color="neutral"
              variant="ghost"
              label="Deseleccionar"
              :disabled="processing || !selectedElementCount"
              @click="resetElementSelection"
            />
            <UButton
              icon="i-lucide-undo-2"
              color="neutral"
              variant="ghost"
              label="Deshacer"
              :disabled="processing || !svgHistory.length"
              @click="undoLastSvgChange"
            />
            <UButton
              icon="i-lucide-frame"
              color="neutral"
              variant="soft"
              label="Ajustar encuadre"
              :disabled="processing || !hasSvg"
              @click="runManualAutoFit"
            />
            <label class="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600">
              <input v-model="autoFitEnabled" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-cyan-600">
              Auto-encuadre
            </label>
            <p class="text-xs text-slate-500">
              Consejo: usa Ctrl/Cmd/Shift + click para seleccionar múltiples elementos.
            </p>
          </div>

          <ColorEditor
            :svg="svgResult"
            :disabled="processing || !hasSvg"
            :selected-element-id="activeSelectedElementId"
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
