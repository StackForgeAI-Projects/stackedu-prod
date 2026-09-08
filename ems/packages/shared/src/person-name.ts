const HONORIFICS = new Set([
  'dr',
  'dr.',
  'prof',
  'prof.',
  'professor',
  'mr',
  'mr.',
  'mrs',
  'mrs.',
  'ms',
  'ms.',
  'miss',
  'dean',
  'sir',
  'madam',
  'rev',
  'rev.',
  'hon',
  'hon.',
])

export function isHonorific(part: string): boolean {
  return HONORIFICS.has(part.trim().toLowerCase())
}

/** First personal name without an honorific, e.g. "Dr. Amina Uwase" → "Amina". */
export function givenName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  return parts.find((part) => !isHonorific(part)) ?? parts[0] ?? fullName.trim()
}

/**
 * Honorific plus first name for greetings, e.g. "Dr. Amina Uwase" → "Dr. Amina".
 * Names without a title return the first word only.
 */
export function titleAndFirstName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return fullName.trim()
  if (parts.length === 1) return parts[0]!
  if (isHonorific(parts[0]!)) {
    const given = parts.find((part, index) => index > 0 && !isHonorific(part))
    if (given) return `${parts[0]} ${given}`
    return parts[0]!
  }
  return parts[0]!
}

/** Split a display name into given name and surname, skipping honorifics. */
export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { firstName: '', lastName: '' }
  const givenIndex = parts.findIndex((part) => !isHonorific(part))
  if (givenIndex < 0) {
    const only = parts[0]!
    return { firstName: only, lastName: only }
  }
  const first = parts[givenIndex]!
  const last = parts.slice(givenIndex + 1).join(' ') || first
  return { firstName: first, lastName: last }
}

function capitalizeSegment(segment: string): string {
  if (!segment) return segment
  return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase()
}

function capitalizeWord(word: string): string {
  return word
    .split('-')
    .map((segment) => capitalizeSegment(segment))
    .join('-')
}

/** Title-case a person's display name while preserving honorifics. */
export function formatDisplayName(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => {
      if (isHonorific(part)) {
        const bare = part.replace(/\./g, '')
        return `${bare.charAt(0).toUpperCase()}${bare.slice(1).toLowerCase()}.`
      }
      return capitalizeWord(part)
    })
    .join(' ')
}

export function displayFullName(input: {
  fullName: string
  firstName?: string | null
  lastName?: string | null
}): string {
  if (input.firstName?.trim() && input.lastName?.trim()) {
    return formatDisplayName(`${input.firstName.trim()} ${input.lastName.trim()}`)
  }
  return formatDisplayName(input.fullName)
}
