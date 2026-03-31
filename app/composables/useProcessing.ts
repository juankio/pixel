export const useProcessing = () => {
  const processing = ref(false)
  const processingText = ref('Procesando imagen...')
  const errorMessage = ref('')

  const normalizeError = (error: unknown): string => {
    if (error instanceof Error) return error.message
    return 'Ocurrió un error inesperado.'
  }

  const withLoader = async (label: string, task: () => Promise<void>) => {
    processing.value = true
    processingText.value = label
    errorMessage.value = ''

    try {
      await task()
    } catch (error) {
      errorMessage.value = normalizeError(error)
    } finally {
      processing.value = false
    }
  }

  return { processing, processingText, errorMessage, withLoader }
}
