import { getSvgDimensions } from '~/utils/svg-dom'

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export const downloadSvgBlob = (svgContent: string): void => {
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' })
  downloadBlob(blob, `vectorized-${Date.now()}.svg`)
}

export const rasterizeSvgToPng = async (svgContent: string): Promise<Blob> => {
  const { width, height } = getSvgDimensions(svgContent)
  const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' })
  const svgUrl = URL.createObjectURL(svgBlob)

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('No se pudo renderizar el SVG para PNG.'))
      el.src = svgUrl
    })

    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(width))
    canvas.height = Math.max(1, Math.round(height))

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No se pudo crear el canvas para exportar PNG.')

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png'))
    if (!blob) throw new Error('No se pudo convertir a PNG.')

    return blob
  } finally {
    URL.revokeObjectURL(svgUrl)
  }
}
