import type { AdvancedOptions, UpscaleOptions } from '~/types'
import { useVectorize } from '~/composables/useVectorize'
import { parseSvg, serializeSvg } from '~/utils/svg-dom'

export const useVectorActions = (
  selectedFile: Ref<File | null>,
  svgResult: Ref<string>,
  svgHistory: Ref<string[]>,
  autoFitEnabled: Ref<boolean>,
  withLoader: (label: string, task: () => Promise<void>) => Promise<void>,
  setVectorSvg: (svg: string) => Promise<void>,
  autoFit: (record?: boolean) => Promise<boolean>,
  pushHistory: () => void,
  resetSelection: () => void,
  refreshMetrics: () => Promise<void>
) => {
  const { vectorize, vectorizeAdvanced, upscaleVectorize } = useVectorize()

  const requireFile = () => {
    if (!selectedFile.value) throw new Error('Primero sube una imagen para vectorizar.')
    return selectedFile.value
  }

  const runBasicVectorize = () =>
    withLoader('Vectorizando (modo básico)...', async () => {
      const result = await vectorize(requireFile())
      await setVectorSvg(result.svg)
      await refreshMetrics()
    })

  const runAdvancedVectorize = (options: AdvancedOptions) =>
    withLoader('Vectorizando (modo avanzado)...', async () => {
      const result = await vectorizeAdvanced(requireFile(), options)
      await setVectorSvg(result.svg)
      await refreshMetrics()
    })

  const runUpscaleVectorize = (options: UpscaleOptions) =>
    withLoader('Procesando en alta calidad...', async () => {
      const result = await upscaleVectorize(requireFile(), options)
      await setVectorSvg(result.svg)
      await refreshMetrics()
    })

  const removeSelectedElements = async (selectedIds: string[]) => {
    if (!svgResult.value || !selectedIds.length || !import.meta.client) return
    pushHistory()

    const doc = parseSvg(svgResult.value)
    for (const id of selectedIds) {
      doc.querySelector(`[data-editor-id="${id}"]`)?.remove()
    }

    svgResult.value = serializeSvg(doc.documentElement)
    resetSelection()
    if (autoFitEnabled.value) await autoFit(false)
  }

  const runManualAutoFit = (autoFitFn: () => Promise<boolean>) => autoFitFn()

  return { runBasicVectorize, runAdvancedVectorize, runUpscaleVectorize, removeSelectedElements, runManualAutoFit }
}
