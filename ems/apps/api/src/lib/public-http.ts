import { isIP } from 'node:net'
import { badRequest } from './errors'

const FETCH_TIMEOUT_MS = 4_000
const MAX_BODY_BYTES = 80_000

/**
 * Fetches a public http(s) page for a short text excerpt. Private and
 * loopback addresses are refused so a lecturer cannot use this as a probe.
 */
export async function fetchPublicTextExcerpt(rawUrl: string): Promise<{ url: string; excerpt: string }> {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    throw badRequest('Enter a valid link.')
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw badRequest('Only http and https links can be summarised.')
  }
  if (isBlockedHost(parsed.hostname)) {
    throw badRequest('That link cannot be fetched.')
  }

  const response = await fetch(parsed.toString(), {
    method: 'GET',
    redirect: 'follow',
    headers: { 'User-Agent': 'StackEDU material describe' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  }).catch(() => {
    throw badRequest('That link could not be reached.')
  })

  if (!response.ok) throw badRequest('That link could not be reached.')
  const finalUrl = new URL(response.url)
  if (isBlockedHost(finalUrl.hostname)) throw badRequest('That link cannot be fetched.')

  const buffer = Buffer.from(await response.arrayBuffer())
  const body = buffer.subarray(0, MAX_BODY_BYTES).toString('utf8')
  return { url: finalUrl.toString(), excerpt: excerptFromHtml(body) }
}

export function isBlockedHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/\.+$/, '')
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) {
    return true
  }
  if (host === '::1' || host === '0.0.0.0') return true
  const ip = host.startsWith('[') && host.endsWith(']') ? host.slice(1, -1) : host
  if (isIP(ip)) return isPrivateIp(ip)
  return false
}

function isPrivateIp(ip: string): boolean {
  if (ip.includes(':')) {
    const normalised = ip.toLowerCase()
    return (
      normalised === '::1'
      || normalised.startsWith('fc')
      || normalised.startsWith('fd')
      || normalised.startsWith('fe80:')
    )
  }
  const parts = ip.split('.').map((part) => Number(part))
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) return true
  const [a, b] = parts
  if (a === 10 || a === 127 || a === 0) return true
  if (a === 169 && b === 254) return true
  if (a === 172 && b !== undefined && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  return false
}

function excerptFromHtml(html: string): string {
  const title = matchContent(html, /<title[^>]*>([\s\S]*?)<\/title>/i)
  const description = matchContent(
    html,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i,
  ) || matchContent(
    html,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
  )
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return [title, description, stripped.slice(0, 1200)].filter(Boolean).join(' ')
}

function matchContent(html: string, pattern: RegExp): string {
  const match = html.match(pattern)
  return match?.[1]?.replace(/\s+/g, ' ').trim() ?? ''
}
