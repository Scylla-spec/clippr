import { History, ListOrdered, UserRound } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

const items = [
  { label: 'Queue', to: '/barber/dashboard', Icon: ListOrdered },
  { label: 'History', to: '/barber/history', Icon: History },
  { label: 'Account', to: '/barber/account', Icon: UserRound },
]

export function BottomNav() {
  return (
    <nav
      aria-label="Barber navigation"
      className="fixed inset-x-0 bottom-0 z-30 grid h-[calc(56px+env(safe-area-inset-bottom))] grid-cols-3 border-t border-border bg-surface px-2 pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {items.map(({ label, to, Icon }) => (
        <NavLink
          key={label}
          to={to}
          end
          aria-label={label}
          className={({ isActive }) =>
            cn(
              'relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-ui-md px-2 text-xs font-medium',
              isActive ? 'text-text' : 'text-text-muted hover:bg-page',
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-7 top-0 h-1 rounded-b-full bg-brand-500"
                />
              )}
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
