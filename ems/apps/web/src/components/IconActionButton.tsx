import { forwardRef, type ButtonHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export interface IconActionButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: string
  icon: LucideIcon
  danger?: boolean
}

export const IconActionButton = forwardRef<HTMLButtonElement, IconActionButtonProps>(
  function IconActionButton({ label, icon: Icon, onClick, danger = false, disabled = false, className, style, type, ...props }, ref) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              ref={ref}
              type={type ?? 'button'}
              onClick={onClick}
              disabled={disabled}
              aria-label={label}
              {...props}
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
  },
)
