const EMBEDDING_DIMENSIONS = 1536
export const LIBRARY_EMBEDDING_MODEL = 'stackedu-hash-v1'

export function hashedEmbedding(text: string): number[] {
  const dims = new Array<number>(EMBEDDING_DIMENSIONS).fill(0)
  const tokens = text.toLowerCase().match(/[a-z0-9]{3,}/g) ?? []
  for (const token of tokens) {
    let hash = 2166136261
    for (let index = 0; index < token.length; index += 1) {
      hash ^= token.charCodeAt(index)
      hash = Math.imul(hash, 16777619)
    }
    const slot = (hash >>> 0) % EMBEDDING_DIMENSIONS
    dims[slot] = (dims[slot] ?? 0) + ((hash & 1) === 0 ? 1 : -1)
  }
  const magnitude = Math.sqrt(dims.reduce((sum, value) => sum + value * value, 0)) || 1
  return dims.map((value) => value / magnitude)
}

export function chunkLibraryText(text: string, size = 800, maxChunks = 8): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (!cleaned) return []
  const chunks: string[] = []
  for (let start = 0; start < cleaned.length && chunks.length < maxChunks; start += size) {
    chunks.push(cleaned.slice(start, start + size))
  }
  return chunks
}

export function heuristicLibraryDescription(input: {
  title?: string
  fileName?: string
  excerpt?: string
}): string {
  const title = input.title?.trim()
  const source = input.fileName?.trim() || 'this file'
  const head = title ? `"${title}"` : source
  const excerpt = input.excerpt?.replace(/\s+/g, ' ').trim()
  if (excerpt) return `Library resource: ${head}. ${excerpt.slice(0, 280)}`
  return `Library resource: ${head}. Open the attached file for the full document.`
}

export function heuristicSubjectTags(title: string, excerpt = ''): string[] {
  const stop = new Set([
    'the', 'and', 'for', 'with', 'from', 'this', 'that', 'into', 'your', 'their',
    'about', 'library', 'resource', 'students', 'course', 'open', 'file', 'full',
  ])
  const counts = new Map<string, number>()
  const words = `${title} ${excerpt}`.toLowerCase().match(/[a-z]{4,}/g) ?? []
  for (const word of words) {
    if (stop.has(word)) continue
    counts.set(word, (counts.get(word) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1))
}

export function vectorLiteral(values: number[]): string {
  return `[${values.map((value) => value.toFixed(8)).join(',')}]`
}
