import { embedGoogleFonts } from '~/utils/embed-fonts'
import { downloadBlob, downloadSvgBlob, rasterizeSvgToPng } from '~/utils/download'

export const useDownload = (
  svgResult: Ref<string>,
  withLoader: (label: string, task: () => Promise<void>) => Promise<void>
) => {
  const downloadSvg = () =>
    withLoader('Preparando SVG...', async () => {
      if (!svgResult.value) return
      const svg = await embedGoogleFonts(svgResult.value)
      downloadSvgBlob(svg)
    })

  const downloadPng = () =>
    withLoader('Exportando PNG...', async () => {
      const svg = await embedGoogleFonts(svgResult.value)
      const blob = await rasterizeSvgToPng(svg)
      downloadBlob(blob, `vectorized-${Date.now()}.png`)
    })

  return { downloadSvg, downloadPng }
}
