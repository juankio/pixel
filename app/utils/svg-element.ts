import { isVisiblePaint } from '~/utils/color'
import { resolvePaintValue, setStyleProperty } from '~/utils/svg-style'

export const setElementTransparent = (el: Element): void => {
  el.setAttribute('fill', 'none')
  el.setAttribute('stroke', 'none')
  el.setAttribute('fill-opacity', '0')
  el.setAttribute('stroke-opacity', '0')

  const style = el.getAttribute('style') || ''
  let next = setStyleProperty(style, 'fill', 'none')
  next = setStyleProperty(next, 'stroke', 'none')
  next = setStyleProperty(next, 'fill-opacity', '0')
  next = setStyleProperty(next, 'stroke-opacity', '0')
  el.setAttribute('style', next)
}

export const setElementFillTransparent = (el: Element): void => {
  el.setAttribute('fill', 'none')
  el.setAttribute('fill-opacity', '0')

  const style = el.getAttribute('style') || ''
  let next = setStyleProperty(style, 'fill', 'none')
  next = setStyleProperty(next, 'fill-opacity', '0')
  el.setAttribute('style', next)
}

export const hasVisibleFill = (el: Element): boolean =>
  isVisiblePaint(resolvePaintValue(el, 'fill'))

export const hasVisibleStroke = (el: Element): boolean =>
  isVisiblePaint(resolvePaintValue(el, 'stroke'))
