import type { ColorChannel } from '~/types'
import { sameColor } from '~/utils/color'

export const getStyleProperty = (style: string, property: string): string => {
  for (const entry of style.split(';').map(e => e.trim()).filter(Boolean)) {
    const [prop, ...rest] = entry.split(':')
    if (prop?.trim().toLowerCase() === property && rest.length) {
      return rest.join(':').trim()
    }
  }
  return ''
}

export const setStyleProperty = (style: string, property: string, value: string): string => {
  const entries = style.split(';').map(e => e.trim()).filter(Boolean)
  let touched = false

  const next = entries.map((entry) => {
    const [prop, ...rest] = entry.split(':')
    if (!prop || !rest.length || prop.trim().toLowerCase() !== property) return entry
    touched = true
    return `${property}:${value}`
  })

  if (!touched) next.push(`${property}:${value}`)
  return next.join(';')
}

export const replaceColorInStyle = (
  style: string,
  property: ColorChannel,
  from: string,
  to: string
): string => {
  const entries = style.split(';').map(e => e.trim()).filter(Boolean)
  let touched = false

  const next = entries.map((entry) => {
    const [prop, ...rest] = entry.split(':')
    if (!prop || !rest.length || prop.trim().toLowerCase() !== property) return entry
    const current = rest.join(':').trim()
    if (!sameColor(current, from)) return entry
    touched = true
    return `${property}:${to}`
  })

  return touched ? next.join(';') : style
}

export const resolvePaintValue = (element: Element, property: ColorChannel): string => {
  const style = element.getAttribute('style') || ''
  const styleValue = getStyleProperty(style, property)
  if (styleValue) return styleValue
  return element.getAttribute(property)?.trim() ?? ''
}
