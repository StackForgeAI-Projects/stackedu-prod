import { useState } from 'react'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────────────────────

export interface StatTileProps {
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  label: string
  value: React.ReactNode
  valueUnit?: string
  delta?: string
  deltaColor?: string
  footer?: React.ReactNode
  animationDelay?: number
  className?: string
}

// ─────────────────────────────────────────────────────────────────────────────

export function StatTile({
  icon: Icon,
  iconColor = 'var(--brand)',
  iconBg = 'rgba(32,244,78,0.08)',
  label,
  value,
  valueUnit,
  delta,
  deltaColor = 'var(--muted-foreground)',
  footer,
  animationDelay = 0,
  className,
}: StatTileProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className={cn('animate-fade-up flex flex-col', className)}
      style={{
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        border: '1px solid var(--border)',
        padding: '24px',
        animationDelay: `${animationDelay}ms`,
        transition: 'box-shadow 150ms ease-out',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Label + icon */}
      <div className="flex items-start justify-between mb-3">
        <p className="t-label" style={{ color: 'var(--muted-foreground)' }}>
          {label}
        </p>
        <div
          className="flex items-center justify-center rounded-lg flex-shrink-0"
          style={{ width: 36, height: 36, backgroundColor: iconBg }}
        >
          <Icon style={{ width: 18, height: 18, color: iconColor }} />
        </div>
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1.5 mb-1">
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.75rem',
            fontWeight: 700,
            color: 'var(--foreground)',
            lineHeight: 1.2,
            letterSpacing: '-0.015em',
          }}
        >
          {value}
        </span>
        {valueUnit && (
          <span className="t-body" style={{ color: 'var(--muted-foreground)' }}>
            {valueUnit}
          </span>
        )}
      </div>

      {/* Delta */}
      {delta && (
        <p className="t-caption" style={{ color: deltaColor }}>
          {delta}
        </p>
      )}

      {/* Footer slot */}
      {footer}
    </div>
  )
}
