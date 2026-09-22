/** StackEDU standard date display: DD-MM-YYYY */
export function formatAppDateDdMmYyyy(value: string | Date | null | undefined): string {
  if (value == null || value === '') return '—'

  let parsed: Date
  if (value instanceof Date) {
    parsed = value
  } else {
    const trimmed = value.trim()
    const iso = trimmed.includes('T') ? trimmed : `${trimmed.slice(0, 10)}T12:00:00`
    parsed = new Date(iso)
  }

  if (Number.isNaN(parsed.getTime())) {
    if (typeof value === 'string') {
      const match = value.trim().slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/)
      if (match) return `${match[3]}-${match[2]}-${match[1]}`
      return value.split(/[ T]/)[0] ?? '—'
    }
    return '—'
  }

  const dd = String(parsed.getDate()).padStart(2, '0')
  const mm = String(parsed.getMonth() + 1).padStart(2, '0')
  const yyyy = parsed.getFullYear()
  return `${dd}-${mm}-${yyyy}`
}

/** Date and time on one line: DD-MM-YYYY HH:mm */
export function formatAppDateTimeDdMmYyyy(value: string | Date | null | undefined): string {
  if (value == null || value === '') return '—'
  const parsed = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(parsed.getTime())) return formatAppDateDdMmYyyy(value)
  const hh = String(parsed.getHours()).padStart(2, '0')
  const min = String(parsed.getMinutes()).padStart(2, '0')
  return `${formatAppDateDdMmYyyy(parsed)} ${hh}:${min}`
}
