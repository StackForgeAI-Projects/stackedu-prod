import type { DescribeLecturerMaterialRequest, UserRole } from '@stackedu/shared'
import { completeMaterialDescription, heuristicMaterialDescription } from '../lib/ai-complete'
import { badRequest } from '../lib/errors'
import { fetchPublicTextExcerpt } from '../lib/public-http'
import { readStoredObjectSample } from '../lib/storage'
import { extractTextSample } from '../lib/text-sample'
import { requireLecturer } from './lecturer'

export async function describeLecturerMaterial(
  institutionId: string,
  actor: { id: string; email: string; role: UserRole },
  input: DescribeLecturerMaterialRequest,
): Promise<{ description: string }> {
  await requireLecturer(institutionId, actor.id)

  const fileKey = input.fileKey?.trim()
  if (fileKey && !fileKey.startsWith(`institutions/${institutionId}/`)) {
    throw badRequest('That file does not belong to this institution.')
  }

  let excerpt = ''
  let url = input.externalUrl?.trim() || undefined

  if (url) {
    const fetched = await fetchPublicTextExcerpt(url)
    url = fetched.url
    excerpt = fetched.excerpt
  } else if (fileKey) {
    const bytes = await readStoredObjectSample(fileKey)
    excerpt = extractTextSample(bytes, input.mimeType ?? '')
  }

  const fallback = heuristicMaterialDescription({
    title: input.title,
    fileName: input.fileName,
    url,
    excerpt,
  })

  const description = await completeMaterialDescription({
    institutionId,
    userId: actor.id,
    fallback,
    prompt: [
      input.title ? `Title: ${input.title}` : null,
      input.fileName ? `File: ${input.fileName}` : null,
      url ? `Link: ${url}` : null,
      excerpt ? `Extract:\n${excerpt.slice(0, 2500)}` : null,
    ]
      .filter(Boolean)
      .join('\n'),
  })

  return { description }
}
