const ATTR_MAP: Array<[string, string]> = [
  ['fillRule', 'fill-rule'],
  ['clipRule', 'clip-rule'],
  ['strokeWidth', 'stroke-width'],
  ['strokeLinecap', 'stroke-linecap'],
  ['strokeLinejoin', 'stroke-linejoin']
]

const PAINTABLE = 'path, circle, ellipse, rect, polygon, polyline, line, text'

export const parseSvg = (svg: string): Document =>
  new DOMParser().parseFromString(svg, 'image/svg+xml')

export const serializeSvg = (root: Element): string =>
  new XMLSerializer().serializeToString(root)

export const markPaintableNodes = (svg: string): string => {
  if (!svg || !import.meta.client) return svg

  const doc = parseSvg(svg)

  for (const el of doc.querySelectorAll('*')) {
    for (const [from, to] of ATTR_MAP) {
      const val = el.getAttribute(from)
      if (!val) continue
      el.setAttribute(to, val)
      el.removeAttribute(from)
    }
  }

  let index = 1
  for (const node of doc.querySelectorAll(PAINTABLE)) {
    const style = node.getAttribute('style') || ''
    const hasPaint = node.hasAttribute('fill') || node.hasAttribute('stroke')
      || /(^|;)\s*(fill|stroke)\s*:/.test(style)
    if (!hasPaint) continue
    if (!node.getAttribute('data-editor-id')) {
      node.setAttribute('data-editor-id', `shape-${index++}`)
    }
  }

  return serializeSvg(doc.documentElement)
}

export const getGeometrySignature = (el: Element): string => {
  const tag = el.tagName.toLowerCase()
  const r = (name: string) => el.getAttribute(name)?.trim() ?? ''

  if (tag === 'path') return `${tag}|${r('d')}`
  if (tag === 'circle') return `${tag}|${r('cx')}|${r('cy')}|${r('r')}`
  if (tag === 'ellipse') return `${tag}|${r('cx')}|${r('cy')}|${r('rx')}|${r('ry')}`
  if (tag === 'rect') return `${tag}|${r('x')}|${r('y')}|${r('width')}|${r('height')}|${r('rx')}|${r('ry')}`
  if (tag === 'polygon' || tag === 'polyline') return `${tag}|${r('points')}`
  if (tag === 'line') return `${tag}|${r('x1')}|${r('y1')}|${r('x2')}|${r('y2')}`
  if (tag === 'text') return `${tag}|${r('x')}|${r('y')}|${el.textContent?.trim() ?? ''}`
  return ''
}

export const getSvgDimensions = (svg: string): { width: number, height: number } => {
  if (!import.meta.client) return { width: 1024, height: 1024 }

  const root = parseSvg(svg).documentElement
  const w = Number.parseFloat(root.getAttribute('width') ?? '')
  const h = Number.parseFloat(root.getAttribute('height') ?? '')

  if (!Number.isNaN(w) && !Number.isNaN(h) && w > 0 && h > 0) return { width: w, height: h }

  const vb = root.getAttribute('viewBox')
  if (vb) {
    const parts = vb.split(/\s+/).map(Number.parseFloat)
    if (parts.length === 4 && parts[2]! > 0 && parts[3]! > 0) {
      return { width: parts[2]!, height: parts[3]! }
    }
  }

  return { width: 1024, height: 1024 }
}
