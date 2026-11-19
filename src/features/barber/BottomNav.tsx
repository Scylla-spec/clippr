import { CircleUserRound, History, ListChecks } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

const items = [
  { label: 'Queue', to: '/barber/dashboard', Icon: ListChecks },
  { label: 'History', to: '/barber/history', Icon: History },
  { label: 'Account', to: '/barber/account', Icon: CircleUserRound },
]

export function BottomNav() {
  return (
    <nav
      aria-label="Barber navigation"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-border bg-surface px-2 pb-[env(safe-area-inset-bottom)] pt-1 md:hidden"
    >
      {items.map(({ label, to, Icon }) => (
        <NavLink
          key={label}
          to={to}
          end
          aria-label={label}
          className={({ isActive }) =>
            cn(
              'flex min-h-touch flex-col items-center justify-center gap-1 rounded-ui-md px-2 text-xs font-medium',
              isActive ? 'text-brand-text' : 'text-text-muted hover:bg-page',
            )
          }
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
