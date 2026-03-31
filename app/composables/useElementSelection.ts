import type { VectorSelectionChangePayload } from '~/types'
import { normalizeColor } from '~/utils/color'

export const useElementSelection = () => {
  const selectedElementIds = ref<string[]>([])
  const selectedElementColor = ref('#000000')

  const activeSelectedElementId = computed(() =>
    selectedElementIds.value.at(-1) ?? ''
  )
  const selectedElementCount = computed(() => selectedElementIds.value.length)

  const resetSelection = () => {
    selectedElementIds.value = []
    selectedElementColor.value = '#000000'
  }

  const onSelectionChange = (payload: VectorSelectionChangePayload) => {
    selectedElementIds.value = payload.ids
    const normalized = normalizeColor(payload.color)
    selectedElementColor.value = /^#[0-9a-f]{6}$/.test(normalized) ? normalized : '#000000'
  }

  return {
    selectedElementIds,
    selectedElementColor,
    activeSelectedElementId,
    selectedElementCount,
    resetSelection,
    onSelectionChange
  }
}
