import type { LucideIcon } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface IconActionButtonProps {
  label: string
  icon: LucideIcon
  onClick?: () => void
  danger?: boolean
  disabled?: boolean
  className?: string
  style?: React.CSSProperties
}

export function IconActionButton({
  label,
  icon: Icon,
  onClick,
  danger = false,
  disabled = false,
  className,
  style,
}: IconActionButtonProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            className={cn(
              'flex items-center justify-center h-8 w-8 rounded-lg shrink-0 transition-colors disabled:opacity-50 disabled:pointer-events-none',
              className,
            )}
            style={{
              border: '1px solid var(--border)',
              color: danger ? 'var(--error)' : 'var(--muted-foreground)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              background: 'transparent',
              ...style,
            }}
          >
            <Icon style={{ width: 14, height: 14 }} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
