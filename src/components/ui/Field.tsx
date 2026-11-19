import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FieldProps extends HTMLAttributes<HTMLDivElement> {
  id: string
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: ReactNode
}

export function Field({
  id,
  label,
  hint,
  error,
  required,
  className,
  children,
  ...props
}: FieldProps) {
  const hintId = `${id}-hint`
  const errorId = `${id}-error`

  return (
    <div className={cn('flex flex-col gap-1.5', className)} {...props}>
      <label htmlFor={id} className="text-sm font-medium text-text">
        {label}
        {required && (
          <span className="ml-1 text-brand-text" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {hint && (
        <p id={hintId} className="text-xs text-text-muted">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-status-danger-text">
          {error}
        </p>
      )}
    </div>
  )
}
