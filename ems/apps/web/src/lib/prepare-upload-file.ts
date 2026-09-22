import { MAX_UPLOAD_BYTES } from '@stackedu/shared'

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export function isCompressibleImage(file: File): boolean {
  if (IMAGE_TYPES.has(file.type)) return true
  return /\.(jpe?g|png|webp|gif)$/i.test(file.name)
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Could not reduce that image.'))
    }, type, quality)
  })
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read that image.'))
    }
    image.src = url
  })
}

function drawScaled(image: HTMLImageElement, maxEdge: number): HTMLCanvasElement {
  const longest = Math.max(image.width, image.height)
  const scale = longest > maxEdge ? maxEdge / longest : 1
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.width * scale))
  canvas.height = Math.max(1, Math.round(image.height * scale))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Could not reduce that image.')
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas
}

/**
 * Shrinks an image until it is at or under the 14 MB ceiling.
 * Other file types are returned unchanged — the caller then refuses them if still over.
 */
export async function reduceUploadFile(file: File): Promise<File> {
  if (file.size <= MAX_UPLOAD_BYTES) return file
  if (!isCompressibleImage(file)) return file

  const image = await loadImage(file)
  const qualities = [0.82, 0.7, 0.55, 0.4]
  const edges = [1920, 1440, 1280, 1024, 800]

  for (const edge of edges) {
    const canvas = drawScaled(image, edge)
    for (const quality of qualities) {
      const blob = await canvasToBlob(canvas, 'image/jpeg', quality)
      if (blob.size <= MAX_UPLOAD_BYTES) {
        const name = file.name.replace(/\.[^.]+$/, '') + '.jpg'
        return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() })
      }
    }
  }

  return file
}
