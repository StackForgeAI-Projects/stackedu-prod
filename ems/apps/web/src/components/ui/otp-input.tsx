import * as React from 'react'
import { cn } from '@/lib/utils'

interface OtpInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
  autoFocus?: boolean
}

const OtpInput = React.forwardRef<HTMLDivElement, OtpInputProps>(
  ({ length = 6, value, onChange, disabled, className, autoFocus }, ref) => {
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])

    // Pad/trim value to exact length
    const digits = Array.from({ length }, (_, i) => value[i] ?? '')

    const focusIndex = (index: number) => {
      inputRefs.current[Math.max(0, Math.min(index, length - 1))]?.focus()
    }

    const handleChange = (index: number, raw: string) => {
      // Accept only digits
      const char = raw.replace(/\D/g, '').slice(-1)
      const next = digits.map((d, i) => (i === index ? char : d))
      onChange(next.join(''))
      if (char && index < length - 1) focusIndex(index + 1)
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        e.preventDefault()
        if (digits[index]) {
          const next = digits.map((d, i) => (i === index ? '' : d))
          onChange(next.join(''))
        } else {
          focusIndex(index - 1)
          const next = digits.map((d, i) => (i === index - 1 ? '' : d))
          onChange(next.join(''))
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        focusIndex(index - 1)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        focusIndex(index + 1)
      }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
      e.preventDefault()
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
      const next = Array.from({ length }, (_, i) => pasted[i] ?? '')
      onChange(next.join(''))
      focusIndex(Math.min(pasted.length, length - 1))
    }

    return (
      <div
        ref={ref}
        className={cn('flex items-center gap-3', className)}
        role="group"
        aria-label="One-time password input"
      >
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el }}
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={2}           /* allow 2 so replacement works on filled boxes */
            value={digit}
            disabled={disabled}
            autoFocus={autoFocus && index === 0}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            className={cn(
              // Base box
              'flex h-14 w-12 items-center justify-center rounded-lg border',
              'text-center font-mono text-xl font-semibold text-foreground',
              'transition-all duration-150 ease-out',
              'focus-visible:outline-none',
              // Rest state
              'border-border bg-card',
              // Filled state — faint brand tint on border
              digit
                ? 'border-brand/50 bg-brand/5'
                : 'hover:border-muted-foreground/40',
              // Focus state — brand green ring
              'focus-visible:border-brand focus-visible:shadow-[0_0_0_3px_rgba(var(--brand-rgb),0.25)]',
              // Disabled
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
            aria-label={`Digit ${index + 1}`}
          />
        ))}
      </div>
    )
  },
)
OtpInput.displayName = 'OtpInput'

export { OtpInput }
