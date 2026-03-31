export type AdvancedVectorizeOptions = {
  threshold: number
  turdSize: number
  optCurve: boolean
}

export type UpscaleVectorizeOptions = {
  scale: 2 | 4
  mode: 'fast' | 'quality'
}

export type VectorizeResult = {
  svg: string
  raw: unknown
}

const normalizeError = (error: unknown): string => {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: { message?: string } }).data
    if (data?.message) return data.message
  }
  if (error instanceof Error) return error.message
  return 'No se pudo completar la operación'
}

const extractSvgFromResponse = (raw: unknown): string => {
  if (typeof raw === 'string' && raw.includes('<svg')) return raw

  if (!raw || typeof raw !== 'object') {
    throw new Error('El backend no devolvió un SVG válido')
  }

  const candidates = [
    (raw as { svg?: unknown }).svg,
    (raw as { data?: { svg?: unknown } }).data?.svg,
    (raw as { result?: { svg?: unknown } }).result?.svg,
    (raw as { output?: { svg?: unknown } }).output?.svg,
    (raw as { payload?: { svg?: unknown } }).payload?.svg
  ]

  for (const c of candidates) {
    if (typeof c === 'string' && c.includes('<svg')) return c
  }

  throw new Error('El backend respondió, pero no se encontró el SVG')
}

const toFormData = (file: File, fields: Record<string, string | number | boolean>): FormData => {
  const fd = new FormData()
  fd.append('file', file)
  for (const [k, v] of Object.entries(fields)) fd.append(k, String(v))
  return fd
}

export const useVectorize = () => {
  const runtimeConfig = useRuntimeConfig()
  const apiBase = typeof runtimeConfig.public.apiBase === 'string'
    ? runtimeConfig.public.apiBase.replace(/\/$/, '')
    : ''

  const send = async (
    endpoint: string,
    file: File,
    fields: Record<string, string | number | boolean> = {}
  ): Promise<VectorizeResult> => {
    try {
      const raw = await $fetch<unknown>(endpoint, {
        method: 'POST',
        body: toFormData(file, fields),
        baseURL: apiBase || undefined
      })
      return { svg: extractSvgFromResponse(raw), raw }
    } catch (error) {
      throw new Error(normalizeError(error))
    }
  }

  const vectorize = (file: File) =>
    send('/api/vectorize', file)

  const vectorizeAdvanced = (file: File, options: AdvancedVectorizeOptions) =>
    send('/api/vectorize/advanced', file, options)

  const upscaleVectorize = (file: File, options: UpscaleVectorizeOptions) =>
    send(`/api/upscale-vectorize?scale=${options.scale}&mode=${options.mode}`, file, options)

  const getHealth = async () => {
    try {
      return await $fetch<unknown>('/api/health', { baseURL: apiBase || undefined })
    } catch (error) {
      throw new Error(normalizeError(error))
    }
  }

  const getMetrics = async () => {
    try {
      return await $fetch<unknown>('/api/metrics', { baseURL: apiBase || undefined })
    } catch (error) {
      throw new Error(normalizeError(error))
    }
  }

  return { vectorize, vectorizeAdvanced, upscaleVectorize, getHealth, getMetrics }
}
