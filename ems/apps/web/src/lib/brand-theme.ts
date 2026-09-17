/**
 * Per-institution colour.
 *
 * Every brand-coloured surface in the app resolves to `--brand` (solid) or
 * `--brand-rgb` (tints), so re-pointing those two variables re-themes the whole
 * system. Everything else here exists to derive the handful of companion
 * tokens — readable ink, focus ring, scrollbar — from that single colour.
 */

/** The palette the system ships with, used when an institution picks no colour. */
export const DEFAULT_BRAND_COLOR = '#0FBD3B'

const STORAGE_KEY = 'stackedu-brand-color'

/** Ink colours the design system uses on top of a filled surface. */
const DARK_INK = '#05131D'
const LIGHT_INK = '#F8FAFC'

export interface Rgb {
  r: number
  g: number
  b: number
}

export function parseHexColor(value: string | null | undefined): Rgb | null {
  if (!value) return null
  const match = /^#?([0-9a-f]{6})$/i.exec(value.trim())
  if (!match) return null
  const int = Number.parseInt(match[1]!, 16)
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 }
}

export function toHexColor({ r, g, b }: Rgb): string {
  const part = (value: number) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0')
  return `#${part(r)}${part(g)}${part(b)}`.toUpperCase()
}

function channelLuminance(channel: number): number {
  const ratio = channel / 255
  return ratio <= 0.03928 ? ratio / 12.92 : ((ratio + 0.055) / 1.055) ** 2.4
}

/** Perceived brightness, 0 (black) to 1 (white). */
export function relativeLuminance(rgb: Rgb): number {
  return 0.2126 * channelLuminance(rgb.r) + 0.7152 * channelLuminance(rgb.g) + 0.0722 * channelLuminance(rgb.b)
}

/** The ink colour that stays legible on top of the given fill. */
export function readableInkOn(rgb: Rgb): string {
  return relativeLuminance(rgb) > 0.45 ? DARK_INK : LIGHT_INK
}

/** A colour is only usable as a brand fill if text can sit on it either way. */
export function isUsableBrandColor(value: string): boolean {
  const rgb = parseHexColor(value)
  if (!rgb) return false
  const luminance = relativeLuminance(rgb)
  return luminance > 0.03 && luminance < 0.9
}

function setOrClear(name: string, value: string | null): void {
  const style = document.documentElement.style
  if (value === null) style.removeProperty(name)
  else style.setProperty(name, value)
}

/**
 * Themes the running app. Pass null to fall back to the tokens in styles.css.
 */
export function applyBrandColor(color: string | null): void {
  if (typeof document === 'undefined') return

  const rgb = color ? parseHexColor(color) : null

  if (!rgb) {
    for (const name of ['--brand', '--brand-rgb', '--brand-ink', '--color-brand', '--color-brand-ink', '--color-primary', '--color-primary-foreground', '--color-ring']) {
      setOrClear(name, null)
    }
    return
  }

  const hex = toHexColor(rgb)
  const ink = readableInkOn(rgb)

  setOrClear('--brand', hex)
  setOrClear('--brand-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`)
  setOrClear('--brand-ink', ink)
  setOrClear('--color-brand', hex)
  setOrClear('--color-brand-ink', ink)
  setOrClear('--color-primary', hex)
  setOrClear('--color-primary-foreground', ink)
  setOrClear('--color-ring', hex)
}

/**
 * The brand colour arrives with the institution branding request, which is one
 * round trip too late to avoid a flash of green. Remembering the last known
 * colour lets the app paint correctly from the first frame.
 */
export function rememberBrandColor(color: string | null): void {
  try {
    if (color) window.localStorage.setItem(STORAGE_KEY, color)
    else window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Private browsing modes refuse storage; the colour still applies for this
    // page view, it just cannot be pre-applied on the next one.
  }
}

export function initBrandColor(): void {
  let stored: string | null = null
  try {
    stored = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    stored = null
  }
  applyBrandColor(stored && parseHexColor(stored) ? stored : null)
}

/** The live brand colour, for canvases and charts that cannot read CSS variables. */
export function brandColorValue(): string {
  if (typeof document === 'undefined') return DEFAULT_BRAND_COLOR
  const value = getComputedStyle(document.documentElement).getPropertyValue('--brand').trim()
  return parseHexColor(value) ? value : DEFAULT_BRAND_COLOR
}
