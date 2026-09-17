import { Info, X } from 'lucide-react'
import { useState } from 'react'
import {
  dismissPageGuide,
  isPageGuideDismissed,
} from '@/lib/page-guide'

interface PageGuideProps {
  pageKey: string
  title?: string
  children: string
}

export function PageGuide({ pageKey, title = 'On this page', children }: PageGuideProps) {
  const storageKey = pageKey
  const [hidden, setHidden] = useState(() => isPageGuideDismissed(storageKey))

  if (hidden) return null

  return (
    <div
      className="mb-6 flex gap-3 p-4"
      style={{
        backgroundColor: 'rgba(var(--brand-rgb), 0.06)',
        border: '1px solid rgba(var(--brand-rgb), 0.18)',
        borderRadius: 'var(--radius-xl)',
      }}
    >
      <Info className="flex-shrink-0 mt-0.5" style={{ width: 16, height: 16, color: 'var(--brand)' }} />
      <div className="min-w-0 flex-1">
        <p className="t-label mb-1" style={{ color: 'var(--brand)' }}>{title}</p>
        <p className="text-sm" style={{ color: 'var(--foreground)', lineHeight: 1.55 }}>{children}</p>
      </div>
      <button
        type="button"
        aria-label="Dismiss guide"
        className="flex-shrink-0"
        style={{ color: 'var(--muted-foreground)' }}
        onClick={() => {
          dismissPageGuide(storageKey)
          setHidden(true)
        }}
      >
        <X style={{ width: 16, height: 16 }} />
      </button>
    </div>
  )
}
