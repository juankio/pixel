import type { ColorChangePayload } from '~/types'
import { normalizeColor, sameColor } from '~/utils/color'
import { replaceColorInStyle, resolvePaintValue, setStyleProperty } from '~/utils/svg-style'
import { hasVisibleFill, hasVisibleStroke, setElementFillTransparent, setElementTransparent } from '~/utils/svg-element'
import { getGeometrySignature, parseSvg, serializeSvg } from '~/utils/svg-dom'

export const useColorChange = (
  svgResult: Ref<string>,
  pushHistory: () => void,
  resetSelection: () => void
) => {
  const applyColorChange = (payload: ColorChangePayload) => {
    if (!svgResult.value || !import.meta.client) return
    pushHistory()

    const doc = parseSvg(svgResult.value)
    const attrSel = payload.kind === 'fill' ? '[fill]' : '[stroke]'
    const styleSel = payload.kind === 'fill' ? '[style*="fill:"]' : '[style*="stroke:"]'

    for (const el of doc.querySelectorAll(attrSel)) {
      const curr = el.getAttribute(payload.kind)
      if (curr && sameColor(curr, payload.from)) el.setAttribute(payload.kind, payload.to)
    }

    for (const el of doc.querySelectorAll(styleSel)) {
      const style = el.getAttribute('style')
      if (!style) continue
      const next = replaceColorInStyle(style, payload.kind, payload.from, payload.to)
      if (next !== style) el.setAttribute('style', next)
    }

    svgResult.value = serializeSvg(doc.documentElement)
  }

  const applySelectedElementColor = (color: string, selectedIds: string[]) => {
    if (!svgResult.value || !selectedIds.length || !import.meta.client) return
    pushHistory()

    const doc = parseSvg(svgResult.value)

    for (const id of selectedIds) {
      const el = doc.querySelector(`[data-editor-id="${id}"]`)
      if (!el) continue

      const fill = el.getAttribute('fill')?.trim()
      const stroke = el.getAttribute('stroke')?.trim()
      const style = el.getAttribute('style') || ''
      const geo = getGeometrySignature(el)
      const hasStroke = hasVisibleStroke(el)

      if (color === 'none' || color === 'transparent') {
        hasStroke ? setElementFillTransparent(el) : setElementTransparent(el)

        if (geo) {
          for (const candidate of doc.querySelectorAll('[data-editor-id]')) {
            if (candidate === el || getGeometrySignature(candidate) !== geo) continue
            if (hasVisibleStroke(candidate) || !hasVisibleFill(candidate)) continue
            setElementFillTransparent(candidate)
          }
        }
        continue
      }

      if (fill && fill !== 'none' && fill !== 'transparent') {
        el.setAttribute('fill', color)
      } else if (stroke && stroke !== 'none' && stroke !== 'transparent') {
        el.setAttribute('stroke', color)
      } else if (style.includes('fill:')) {
        el.setAttribute('style', setStyleProperty(style, 'fill', color))
      } else if (style.includes('stroke:')) {
        el.setAttribute('style', setStyleProperty(style, 'stroke', color))
      } else {
        el.setAttribute('fill', color)
      }
    }

    svgResult.value = serializeSvg(doc.documentElement)
    const normalized = normalizeColor(color)
    return /^#[0-9a-f]{6}$/.test(normalized) ? normalized : '#000000'
  }

  return { applyColorChange, applySelectedElementColor }
}
