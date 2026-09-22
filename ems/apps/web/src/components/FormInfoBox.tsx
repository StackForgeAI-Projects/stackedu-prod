import { Info } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * Shared info box under a form title. Prefer `lines` from `form-info-copy.ts`
 * so every form uses the same what / submit / system pattern.
 */
export function FormInfoBox({
  lines,
  children,
}: {
  lines?: readonly string[]
  children?: ReactNode
}) {
  return (
    <div
      role="note"
      className="flex gap-3 p-3.5 mt-3"
      style={{
        backgroundColor: 'var(--info-bg)',
        border: '1px solid var(--info)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <Info className="shrink-0 mt-0.5" style={{ width: 16, height: 16, color: 'var(--info)' }} aria-hidden />
      <div className="min-w-0 flex flex-col gap-2 text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
        {lines?.map((line) => (
          <p key={line}>{line}</p>
        ))}
        {children}
      </div>
    </div>
  )
}
