export const rgbToHex = (value: string): string => {
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

export const normalizeColor = (value: string): string => {
  const input = value.trim().toLowerCase()

  if (/^#[0-9a-f]{6}$/.test(input)) return input

  if (/^#[0-9a-f]{3}$/.test(input)) {
    return `#${input.slice(1).split('').map(c => `${c}${c}`).join('')}`
  }

  if (input.startsWith('rgb')) return rgbToHex(input)

  if (!import.meta.client) return input

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return input

  ctx.fillStyle = '#000'
  ctx.fillStyle = input
  const computed = ctx.fillStyle.toLowerCase()

  if (computed.startsWith('#')) return normalizeColor(computed)
  if (computed.startsWith('rgb')) return rgbToHex(computed)

  return computed
}

/** Versión que devuelve null en caso de fallo (usada por ColorEditor) */
export const normalizeColorOrNull = (value: string): string | null => {
  const result = normalizeColor(value)
  return /^#[0-9a-f]{6}$/.test(result) ? result : null
}

export const sameColor = (a: string, b: string): boolean =>
  normalizeColor(a) === normalizeColor(b)

export const isVisiblePaint = (value: string): boolean => {
  const v = value.trim().toLowerCase()
  if (!v) return false
  if (v === 'none' || v === 'transparent') return false
  if (v.startsWith('url(')) return false
  return true
}

export const isSkippableColor = (value: string): boolean =>
  !isVisiblePaint(value)
