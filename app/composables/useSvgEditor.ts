import { markPaintableNodes, parseSvg, serializeSvg } from '~/utils/svg-dom'

const MAX_HISTORY = 30
const GRAPHICS = 'path, circle, ellipse, rect, polygon, polyline, line, text, use'

export const useSvgEditor = () => {
  const svgResult = ref('')
  const svgHistory = ref<string[]>([])
  const autoFitEnabled = ref(true)
  const hasSvg = computed(() => Boolean(svgResult.value))

  const pushHistory = () => {
    if (!svgResult.value) return
    svgHistory.value.push(svgResult.value)
    if (svgHistory.value.length > MAX_HISTORY) svgHistory.value.shift()
  }

  const undo = () => {
    const prev = svgHistory.value.pop()
    if (prev) svgResult.value = prev
    return Boolean(prev)
  }

  const autoFit = async (recordHistory = true): Promise<boolean> => {
    if (!import.meta.client || !svgResult.value) return false

    const doc = parseSvg(svgResult.value)
    const root = doc.documentElement as unknown as SVGSVGElement
    if (!root || root.tagName.toLowerCase() !== 'svg') return false

    const host = document.createElement('div')
    Object.assign(host.style, {
      position: 'fixed', left: '-100000px', top: '-100000px',
      visibility: 'hidden', pointerEvents: 'none', width: '0', height: '0', overflow: 'hidden'
    })

    const liveSvg = root.cloneNode(true) as SVGSVGElement
    liveSvg.removeAttribute('width')
    liveSvg.removeAttribute('height')
    host.appendChild(liveSvg)
    document.body.appendChild(host)

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

    for (const node of liveSvg.querySelectorAll<SVGGraphicsElement>(GRAPHICS)) {
      try {
        const bb = node.getBBox()
        if (!Number.isFinite(bb.x) || !Number.isFinite(bb.y)) continue
        if (bb.width === 0 && bb.height === 0) continue
        minX = Math.min(minX, bb.x); minY = Math.min(minY, bb.y)
        maxX = Math.max(maxX, bb.x + bb.width); maxY = Math.max(maxY, bb.y + bb.height)
      } catch { continue }
    }

    document.body.removeChild(host)

    if (!Number.isFinite(minX) || !Number.isFinite(maxX)) return false

    const w = Math.max(1, maxX - minX)
    const h = Math.max(1, maxY - minY)
    const pad = Math.max(2, Math.max(w, h) * 0.04)
    root.setAttribute('viewBox', `${minX - pad} ${minY - pad} ${w + pad * 2} ${h + pad * 2}`)
    root.setAttribute('preserveAspectRatio', 'xMidYMid meet')
    root.removeAttribute('width')
    root.removeAttribute('height')

    if (recordHistory) pushHistory()
    svgResult.value = serializeSvg(root)
    return true
  }

  const setVectorSvg = async (svg: string) => {
    svgHistory.value = []
    svgResult.value = markPaintableNodes(svg)
    if (autoFitEnabled.value) await autoFit(false)
  }

  const clearSvg = () => {
    svgResult.value = ''
    svgHistory.value = []
  }

  return { svgResult, svgHistory, autoFitEnabled, hasSvg, pushHistory, undo, autoFit, setVectorSvg, clearSvg }
}
