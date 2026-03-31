import type { HealthStatus } from '~/types'
import { useVectorize } from '~/composables/useVectorize'

const summarizePayload = (payload: unknown): string => {
  if (typeof payload === 'string') return payload
  if (payload && typeof payload === 'object') {
    const r = payload as Record<string, unknown>
    if (typeof r.status === 'string') return `status: ${r.status}`
    if (typeof r.message === 'string') return r.message
    const compact = JSON.stringify(payload)
    return compact.length > 90 ? `${compact.slice(0, 90)}...` : compact
  }
  return 'OK'
}

export const useHealthCheck = () => {
  const { getHealth, getMetrics } = useVectorize()

  const healthStatus = ref<HealthStatus>('checking')
  const healthText = ref('Conectando con backend...')
  const metrics = ref<Record<string, unknown> | null>(null)

  const statusColor = computed(() => {
    if (healthStatus.value === 'online') return 'success'
    if (healthStatus.value === 'offline') return 'error'
    return 'warning'
  })

  const refreshHealth = async () => {
    healthStatus.value = 'checking'
    healthText.value = 'Consultando /api/health...'
    try {
      const payload = await getHealth()
      healthStatus.value = 'online'
      healthText.value = summarizePayload(payload)
    } catch (error) {
      healthStatus.value = 'offline'
      healthText.value = error instanceof Error ? error.message : 'Error desconocido'
    }
  }

  const refreshMetrics = async () => {
    try {
      const payload = await getMetrics()
      metrics.value = payload && typeof payload === 'object'
        ? payload as Record<string, unknown>
        : { value: String(payload) }
    } catch {
      metrics.value = null
    }
  }

  return { healthStatus, healthText, metrics, statusColor, refreshHealth, refreshMetrics }
}
