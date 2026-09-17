import type { ReactElement } from 'react'
import { ResponsiveContainer } from 'recharts'

export const analyticsTooltipStyle = {
  contentStyle: {
    backgroundColor: 'var(--ink)',
    border: '1px solid var(--ink-border)',
    borderRadius: 12,
    color: '#fff',
    fontSize: 12,
  },
  itemStyle: { color: '#fff' },
  labelStyle: { color: 'var(--ink-muted)', fontWeight: 600 },
}

export function AnalyticsChartCard({
  title,
  children,
  height = 280,
  empty,
}: {
  title: string
  children?: ReactElement
  height?: number
  empty?: string | null
}) {
  return (
    <div
      style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: 24,
      }}
    >
      <h2 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
        {title}
      </h2>
      {empty ? (
        <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>{empty}</p>
      ) : children ? (
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
      ) : null}
    </div>
  )
}
