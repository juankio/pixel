export type AdvancedOptions = {
  threshold: number
  turdSize: number
  optCurve: boolean
}

export type UpscaleOptions = {
  scale: 2 | 4
  mode: 'fast' | 'quality'
}

export type HealthStatus = 'checking' | 'online' | 'offline'
export type ColorChannel = 'fill' | 'stroke'

export type ColorChangePayload = {
  from: string
  to: string
  kind: ColorChannel
}

export type VectorSelectionChangePayload = {
  ids: string[]
  activeId: string
  color: string
}

export type SvgColorEntry = {
  key: string
  kind: ColorChannel
  raw: string
  hex: string
}
