export const useImageUpload = () => {
  const selectedFile = ref<File | null>(null)
  const originalPreviewUrl = ref('')

  const hasFile = computed(() => Boolean(selectedFile.value))
  const fileName = computed(() => selectedFile.value?.name ?? '')

  const revokePreviewUrl = () => {
    if (originalPreviewUrl.value) {
      URL.revokeObjectURL(originalPreviewUrl.value)
      originalPreviewUrl.value = ''
    }
  }

  const setFile = (file: File) => {
    revokePreviewUrl()
    selectedFile.value = file
    originalPreviewUrl.value = URL.createObjectURL(file)
  }

  const clearFile = () => {
    selectedFile.value = null
    revokePreviewUrl()
  }

  return { selectedFile, originalPreviewUrl, hasFile, fileName, setFile, clearFile, revokePreviewUrl }
}
