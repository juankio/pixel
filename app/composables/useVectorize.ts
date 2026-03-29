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

const buildRequestKey = (endpoint: string) => {
  return `${endpoint}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const normalizeError = (error: unknown) => {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: { message?: string } }).data

    if (data?.message) {
      return data.message
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'No se pudo completar la operación'
}

const extractSvgFromResponse = (raw: unknown): string => {
  if (typeof raw === 'string' && raw.includes('<svg')) {
    return raw
  }

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

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.includes('<svg')) {
      return candidate
    }
  }

  throw new Error('El backend respondió, pero no se encontró el SVG')
}

const toFormData = (file: File, fields: Record<string, string | number | boolean>) => {
  const formData = new FormData()
  formData.append('file', file)

  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, String(value))
  }

  return formData
}

export const useVectorize = () => {
  const runtimeConfig = useRuntimeConfig()
  const apiBaseRaw = runtimeConfig.public.apiBase
  const apiBase = typeof apiBaseRaw === 'string'
    ? apiBaseRaw.replace(/\/$/, '')
    : ''

  const sendVectorizeRequest = async (
    endpoint: string,
    file: File,
    fields: Record<string, string | number | boolean> = {}
  ): Promise<VectorizeResult> => {
    const formData = toFormData(file, fields)

    const { data, error } = await useFetch<unknown>(endpoint, {
      method: 'POST',
      body: formData,
      server: false,
      baseURL: apiBase || undefined,
      key: buildRequestKey(endpoint)
    })

    if (error.value) {
      throw new Error(normalizeError(error.value))
    }

    const raw = data.value
    const svg = extractSvgFromResponse(raw)

    return { svg, raw }
  }

  const vectorize = async (file: File): Promise<VectorizeResult> => {
    return sendVectorizeRequest('/api/vectorize', file)
  }

  const vectorizeAdvanced = async (
    file: File,
    options: AdvancedVectorizeOptions
  ): Promise<VectorizeResult> => {
    return sendVectorizeRequest('/api/vectorize/advanced', file, options)
  }

  const upscaleVectorize = async (
    file: File,
    options: UpscaleVectorizeOptions
  ): Promise<VectorizeResult> => {
    const endpoint = `/api/upscale-vectorize?scale=${options.scale}&mode=${options.mode}`
    return sendVectorizeRequest(endpoint, file, options)
  }

  const getHealth = async () => {
    const { data, error } = await useFetch<unknown>('/api/health', {
      method: 'GET',
      server: false,
      baseURL: apiBase || undefined,
      key: buildRequestKey('/api/health')
    })

    if (error.value) {
      throw new Error(normalizeError(error.value))
    }

    return data.value
  }

  const getMetrics = async () => {
    const { data, error } = await useFetch<unknown>('/api/metrics', {
      method: 'GET',
      server: false,
      baseURL: apiBase || undefined,
      key: buildRequestKey('/api/metrics')
    })

    if (error.value) {
      throw new Error(normalizeError(error.value))
    }

    return data.value
  }

  return {
    vectorize,
    vectorizeAdvanced,
    upscaleVectorize,
    getHealth,
    getMetrics
  }
}
