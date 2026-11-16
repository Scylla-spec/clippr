/**
 * PageLoader.tsx — Full-screen loading spinner.
 * Used during route transitions and initial auth check.
 */

export function PageLoader() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-white dark:bg-surface-900"
      role="status"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading…</p>
      </div>
    </div>
  )
}
