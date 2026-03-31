import { downloadBlob, downloadSvgBlob, rasterizeSvgToPng } from '~/utils/download'

export const useDownload = (
  svgResult: Ref<string>,
  withLoader: (label: string, task: () => Promise<void>) => Promise<void>
) => {
  const downloadSvg = () => {
    if (!svgResult.value || !import.meta.client) return
    downloadSvgBlob(svgResult.value)
  }

  const downloadPng = () =>
    withLoader('Exportando PNG...', async () => {
      const blob = await rasterizeSvgToPng(svgResult.value)
      downloadBlob(blob, `vectorized-${Date.now()}.png`)
    })

  return { downloadSvg, downloadPng }
}
