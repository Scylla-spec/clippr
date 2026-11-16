/**
 * NotFoundPage.tsx — 404 page.
 */

import { Link } from 'react-router-dom'
import { SearchX } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <SearchX className="h-16 w-16 text-slate-400 dark:text-slate-500" aria-hidden="true" />
      <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Page not found</h1>
      <p className="text-slate-500 dark:text-slate-400">
        The page you're looking for doesn't exist.
      </p>
      <Link
        to="/"
        className="mt-2 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
      >
        Go home
      </Link>
    </main>
  )
}
