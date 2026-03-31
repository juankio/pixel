const IMPORT_RE = /@import url\(['"]?(https:\/\/fonts\.googleapis\.com[^'")\s]+)['"]?\);?/g

async function toBase64(url: string): Promise<{ base64: string, mime: string } | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const buf = await res.arrayBuffer()
    const bytes = new Uint8Array(buf)
    let bin = ''
    for (const b of bytes) bin += String.fromCharCode(b)
    const ext = url.split('?')[0]!.split('.').pop()?.toLowerCase() ?? 'woff2'
    const mime = ext === 'woff2' ? 'font/woff2' : ext === 'woff' ? 'font/woff' : 'font/truetype'
    return { base64: btoa(bin), mime }
  } catch {
    return null
  }
}

async function inlineFontFaces(cssText: string): Promise<string> {
  const urlRE = /url\((['"]?)(https:\/\/fonts\.gstatic\.com[^'")\s]+)\1\)/g
  const matches = [...cssText.matchAll(urlRE)]
  let result = cssText

  for (const m of matches) {
    const fontUrl = m[2]!
    const encoded = await toBase64(fontUrl)
    if (encoded) {
      result = result.replace(
        m[0],
        `url('data:${encoded.mime};base64,${encoded.base64}')`
      )
    }
  }

  return result
}

/**
 * Replaces all @import Google Fonts references in the SVG
 * with fully embedded base64 @font-face declarations.
 * Falls back gracefully — if a font can't be fetched, keeps the @import.
 */
export async function embedGoogleFonts(svg: string): Promise<string> {
  if (!import.meta.client) return svg

  const imports = [...svg.matchAll(IMPORT_RE)]
  if (!imports.length) return svg

  let result = svg

  for (const match of imports) {
    const importStatement = match[0]!
    const cssUrl = match[1]!

    try {
      const cssRes = await fetch(cssUrl)
      if (!cssRes.ok) continue
      const cssText = await cssRes.text()
      const inlined = await inlineFontFaces(cssText)
      result = result.replace(importStatement, inlined)
    } catch {
      // Keep @import if network fails
    }
  }

  return result
}
