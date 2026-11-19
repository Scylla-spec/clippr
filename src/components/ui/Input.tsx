/**
 * Input.tsx — Base text input component with accessible label and error state.
 */

import type { InputHTMLAttributes } from 'react'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { Field } from './Field'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, id, className, ...props },
  ref,
) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  const errorId = `${inputId}-error`
  const hintId = `${inputId}-hint`

  return (
    <Field
      id={inputId}
      label={label}
      hint={hint}
      error={error}
      required={props.required}
    >
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={
          [error ? errorId : '', hint ? hintId : ''].filter(Boolean).join(' ') || undefined
        }
        className={cn(
          'block w-full rounded-ui-md border border-border bg-surface px-3 py-2.5 text-base text-text shadow-ui-sm transition-colors',
          'placeholder:text-text-muted',
          error
            ? 'border-status-danger-text focus:border-status-danger-text focus:ring-status-danger-text'
            : 'focus:border-brand-text focus:ring-brand-text',
          'focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-offset-surface',
          'disabled:cursor-not-allowed disabled:bg-page disabled:text-text-muted',
          className,
        )}
        {...props}
      />
    </Field>
  )
})
