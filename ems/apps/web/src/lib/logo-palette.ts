import { isUsableBrandColor, toHexColor, type Rgb } from '@/lib/brand-theme'

/**
 * Reads the colours an institution actually uses out of its logo.
 *
 * The file is read in the browser, before it is uploaded, so nothing has to
 * decode images on the server and the canvas is never tainted by a
 * cross-origin response.
 */

/** Small enough to scan instantly, large enough to keep thin strokes. */
const SAMPLE_SIZE = 64

/** Colours closer than this look like the same colour to a person. */
const MIN_DISTANCE = 72

interface Bucket {
  r: number
  g: number
  b: number
  count: number
}

function loadImage(source: File | string): Promise<{ image: HTMLImageElement; release: () => void }> {
  return new Promise((resolve, reject) => {
    const isFile = typeof source !== 'string'
    const url = isFile ? URL.createObjectURL(source) : source
    const release = () => {
      if (isFile) URL.revokeObjectURL(url)
    }

    const image = new Image()
    // A logo already saved is served by the API, which is a different origin.
    // Without this the canvas is tainted and its pixels cannot be read.
    if (!isFile) image.crossOrigin = 'anonymous'

    image.onload = () => resolve({ image, release })
    image.onerror = () => {
      release()
      reject(new Error('That image could not be read.'))
    }
    image.src = url
  })
}

function saturation({ r, g, b }: Rgb): number {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return max === 0 ? 0 : (max - min) / max
}

function distance(a: Rgb, b: Rgb): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2)
}

/**
 * Returns the logo's most prominent colours, strongest first.
 *
 * Vivid colours are favoured over large flat areas: a logo is mostly
 * background, and nobody wants their system themed off-white.
 */
export async function extractLogoPalette(source: File | string, limit = 5): Promise<string[]> {
  const { image, release } = await loadImage(source)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = SAMPLE_SIZE
    canvas.height = SAMPLE_SIZE
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return []

    context.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
    const { data } = context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE)

    const buckets = new Map<number, Bucket>()
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3]!
      if (alpha < 128) continue

      const pixel = { r: data[i]!, g: data[i + 1]!, b: data[i + 2]! }
      // Paper and ink carry no brand information.
      const brightest = Math.max(pixel.r, pixel.g, pixel.b)
      if (brightest > 238 && saturation(pixel) < 0.12) continue
      if (brightest < 26) continue

      const key = ((pixel.r >> 4) << 8) | ((pixel.g >> 4) << 4) | (pixel.b >> 4)
      const bucket = buckets.get(key) ?? { r: 0, g: 0, b: 0, count: 0 }
      bucket.r += pixel.r
      bucket.g += pixel.g
      bucket.b += pixel.b
      bucket.count += 1
      buckets.set(key, bucket)
    }

    const candidates = [...buckets.values()]
      .map((bucket) => ({
        rgb: { r: bucket.r / bucket.count, g: bucket.g / bucket.count, b: bucket.b / bucket.count },
        count: bucket.count,
      }))
      .map((entry) => ({ ...entry, score: entry.count * (0.4 + saturation(entry.rgb)) }))
      .sort((a, b) => b.score - a.score)

    const chosen: Rgb[] = []
    for (const candidate of candidates) {
      if (chosen.length >= limit) break
      if (chosen.some((picked) => distance(picked, candidate.rgb) < MIN_DISTANCE)) continue
      if (!isUsableBrandColor(toHexColor(candidate.rgb))) continue
      chosen.push(candidate.rgb)
    }

    return chosen.map(toHexColor)
  } finally {
    release()
  }
}
