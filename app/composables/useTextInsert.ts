import type { TextInsertOptions } from '~/types'
import { getSvgDimensions, parseSvg, serializeSvg } from '~/utils/svg-dom'

const GOOGLE_FONTS_BASE = 'https://fonts.googleapis.com/css2?family='

function ensureGoogleFontInSvg(root: Element, doc: Document, googleFont: string) {
  const importUrl = `${GOOGLE_FONTS_BASE}${googleFont}&display=swap`
  const importRule = `@import url('${importUrl}');`

  let styleEl = root.querySelector('defs > style[data-gfonts]')

  if (!styleEl) {
    let defs = root.querySelector('defs')
    if (!defs) {
      defs = doc.createElementNS('http://www.w3.org/2000/svg', 'defs')
      root.insertBefore(defs, root.firstChild)
    }
    styleEl = doc.createElementNS('http://www.w3.org/2000/svg', 'style')
    styleEl.setAttribute('data-gfonts', '1')
    defs.appendChild(styleEl)
  }

  if (!styleEl.textContent?.includes(importUrl)) {
    styleEl.textContent = (styleEl.textContent ?? '') + importRule
  }
}

function applyTextAttrs(el: Element, options: TextInsertOptions, dims: { width: number, height: number }) {
  const absX = Math.round((options.x / 100) * dims.width)
  const absY = Math.round((options.y / 100) * dims.height)
  el.setAttribute('x', String(absX))
  el.setAttribute('y', String(absY))
  el.setAttribute('font-family', options.fontFamily)
  el.setAttribute('font-size', String(options.fontSize))
  el.setAttribute('fill', options.fill)
  el.setAttribute('font-weight', options.fontWeight)
  el.setAttribute('font-style', options.italic ? 'italic' : 'normal')
  el.setAttribute('text-anchor', options.textAnchor)
  el.setAttribute('dominant-baseline', 'middle')
  el.textContent = options.content
  if (options.rotation !== 0) {
    el.setAttribute('transform', `rotate(${options.rotation}, ${absX}, ${absY})`)
  } else {
    el.removeAttribute('transform')
  }
}

export const useTextInsert = (
  svgResult: Ref<string>,
  pushHistory: () => void
) => {
  const insertText = (options: TextInsertOptions) => {
    if (!svgResult.value || !import.meta.client) return
    pushHistory()

    const doc = parseSvg(svgResult.value)
    const root = doc.documentElement
    const dims = getSvgDimensions(svgResult.value)

    if (options.googleFont) ensureGoogleFontInSvg(root, doc, options.googleFont)

    const textEl = doc.createElementNS('http://www.w3.org/2000/svg', 'text')
    textEl.setAttribute('data-editor-id', `text-${Date.now()}`)
    applyTextAttrs(textEl, options, dims)

    root.appendChild(textEl)
    svgResult.value = serializeSvg(root)
  }

  const updateText = (id: string, options: TextInsertOptions) => {
    if (!svgResult.value || !import.meta.client) return
    pushHistory()

    const doc = parseSvg(svgResult.value)
    const root = doc.documentElement
    const el = root.querySelector(`[data-editor-id="${id}"]`)
    if (!el || el.tagName.toLowerCase() !== 'text') return

    const dims = getSvgDimensions(svgResult.value)
    if (options.googleFont) ensureGoogleFontInSvg(root, doc, options.googleFont)

    applyTextAttrs(el, options, dims)
    svgResult.value = serializeSvg(root)
  }

  return { insertText, updateText }
}
