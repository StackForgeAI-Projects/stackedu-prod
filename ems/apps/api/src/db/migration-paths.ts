import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

function firstExistingDir(candidates: string[]): string {
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate
  }
  return candidates[0]!
}

/** Resolves drizzle migration folders from dev, bundled dist, and Render cwd layouts. */
export function migrationsFolder(kind: 'platform' | 'institution'): string {
  const cwd = process.cwd()
  const here = path.dirname(fileURLToPath(import.meta.url))
  return firstExistingDir([
    path.resolve(cwd, 'drizzle', kind),
    path.resolve(cwd, 'apps/api/drizzle', kind),
    path.resolve(here, '../../drizzle', kind),
  ])
}
