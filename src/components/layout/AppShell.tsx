import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AppShellProps {
  sidebar?: ReactNode
  header?: ReactNode
  bottomNavigation?: ReactNode
  children: ReactNode
  hasSidebar?: boolean
  mainClassName?: string
}

export function AppShell({
  sidebar,
  header,
  bottomNavigation,
  children,
  hasSidebar = false,
  mainClassName,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-page text-text">
      <a
        href="#main-content"
        className="sr-only z-80 rounded-ui-md bg-surface px-4 py-2 text-text shadow-ui-md focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      {sidebar}
      <div className={cn('flex min-h-screen min-w-0 flex-1 flex-col', hasSidebar && 'md:pl-20 lg:pl-64')}>
        {header}
        <main
          id="main-content"
          className={cn(
            'mx-auto w-full max-w-screen-2xl flex-1 p-4 sm:p-6 lg:p-8',
            bottomNavigation && 'pb-24 md:pb-6',
            mainClassName,
          )}
        >
          {children}
        </main>
        {bottomNavigation}
      </div>
    </div>
  )
}
