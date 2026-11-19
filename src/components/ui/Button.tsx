/**
 * Button.tsx — Base button component.
 *
 * Variants: primary, secondary, danger, ghost
 * Sizes: sm, md, lg
 * Always meets the 44×44 px minimum touch target.
 */

import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  isLoading?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-brand-500 text-on-brand hover:bg-brand-600 active:bg-brand-700 disabled:bg-brand-200',
  secondary:
    'bg-surface text-text ring-1 ring-inset ring-border hover:bg-page active:bg-surface-100',
  danger:
    'bg-status-danger-bg text-status-danger-text hover:brightness-95 active:brightness-90',
  ghost:
    'bg-transparent text-text-muted hover:bg-page active:bg-surface-100',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm min-h-touch',
  md: 'px-4 py-2 text-sm min-h-touch',
  lg: 'px-5 py-3 text-base min-h-touch',
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={isLoading || disabled}
      aria-busy={isLoading || undefined}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-medium',
        'transition-colors duration-150 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {isLoading && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  )
}
