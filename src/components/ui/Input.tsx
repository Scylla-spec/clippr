/**
 * Input.tsx — Base text input component with accessible label and error state.
 */

import type { InputHTMLAttributes } from 'react'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, id, className, ...props },
  ref,
) {
  // Use the provided id or derive one from the label for the htmlFor association
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  const errorId = `${inputId}-error`
  const hintId = `${inputId}-hint`

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {props.required && (
          <span className="ml-1 text-red-500" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {hint && (
        <p id={hintId} className="text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      )}

      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={
          [error ? errorId : '', hint ? hintId : ''].filter(Boolean).join(' ') || undefined
        }
        className={cn(
          'block w-full rounded-lg border px-3 py-2.5 text-base shadow-sm transition-colors',
          'placeholder:text-slate-400',
          'dark:bg-surface-800 dark:text-white dark:placeholder:text-slate-500',
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500'
            : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500 dark:border-surface-600',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 dark:disabled:bg-surface-700',
          className,
        )}
        {...props}
      />

      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
})
