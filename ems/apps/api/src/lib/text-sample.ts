export function extractTextSample(bytes: Buffer, mimeType: string): string {
  if (mimeType.startsWith('text/') || mimeType.includes('json') || mimeType.includes('xml') || mimeType.includes('csv')) {
    return bytes.toString('utf8').replace(/\u0000/g, '').slice(0, 4000)
  }
  const chunks = bytes.toString('latin1').match(/[\t\n\r\x20-\x7E]{6,}/g) ?? []
  return chunks.join(' ').replace(/\s+/g, ' ').trim().slice(0, 4000)
}
