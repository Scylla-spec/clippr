/**
 * ErrorMessage.tsx — Inline error display (non-critical, inline in a section).
 * For page-level errors, use ErrorPage.
 */

import { cn } from '@/lib/utils'

interface ErrorMessageProps {
  message: string
  onRetry?: () => void
  className?: string
}

export function ErrorMessage({ message, onRetry, className }: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4',
        'dark:border-red-800 dark:bg-red-950/40',
        className,
      )}
    >
      <span className="mt-0.5 text-red-500 dark:text-red-400" aria-hidden="true">
        ⚠️
      </span>
      <div className="flex-1">
        <p className="text-sm font-medium text-red-700 dark:text-red-300">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-1 text-xs font-medium text-red-600 underline hover:no-underline dark:text-red-400"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  )
}
