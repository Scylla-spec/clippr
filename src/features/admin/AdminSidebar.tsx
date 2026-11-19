import {
  BriefcaseBusiness,
  CalendarDays,
  ChartColumn,
  House,
  LogOut,
  Scissors,
  Settings,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { InfinityMark } from '@/components/brand/Logo'
import { cn } from '@/lib/utils'

interface AdminSidebarProps {
  presentation?: 'fixed' | 'drawer'
  onNavigate?: () => void
  onSignOut: () => void
  isSigningOut: boolean
}

interface AdminNavItem {
  label: string
  to: string
  Icon: LucideIcon
}

const primaryNavigation: AdminNavItem[] = [
  { label: 'Dashboard', to: '/admin/dashboard', Icon: House },
  { label: 'Appointments', to: '/admin/appointments', Icon: CalendarDays },
  { label: 'Walk-ins', to: '/admin/walk-ins', Icon: UserRound },
  { label: 'Customers', to: '/admin/customers', Icon: Users },
  { label: 'Barbers', to: '/admin/barbers', Icon: Scissors },
  { label: 'Services', to: '/admin/services', Icon: BriefcaseBusiness },
  { label: 'Reports', to: '/admin/reports', Icon: ChartColumn },
]

const secondaryNavigation: AdminNavItem[] = [
  { label: 'Settings', to: '/admin/settings', Icon: Settings },
]

function NavigationLink({
  item,
  onNavigate,
  presentation,
}: {
  item: AdminNavItem
  onNavigate?: () => void
  presentation: 'fixed' | 'drawer'
}) {
  const sharedClassName =
    'group flex min-h-12 w-full items-center gap-3 rounded-ui-md px-3 text-left text-sm font-medium transition-colors'

  return (
    <NavLink
      to={item.to}
      end
      onClick={onNavigate}
      aria-label={item.label}
      className={({ isActive }) =>
        cn(
          sharedClassName,
          presentation === 'fixed' ? 'lg:px-3' : 'px-4',
          isActive
            ? 'bg-brand-500 text-on-brand'
            : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white',
        )
      }
    >
      <item.Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span className={presentation === 'drawer' ? 'inline' : 'hidden lg:inline'}>
        {item.label}
      </span>
    </NavLink>
  )
}

export function AdminSidebar({
  presentation = 'fixed',
  onNavigate,
  onSignOut,
  isSigningOut,
}: AdminSidebarProps) {
  const isDrawer = presentation === 'drawer'
  return (
    <aside
      aria-label="Admin sidebar"
      className={cn(
        'flex h-full flex-col overflow-hidden bg-sidebar text-white',
        presentation === 'fixed' ? 'fixed inset-y-0 left-0 z-40 hidden w-64 lg:flex' : 'w-full',
      )}
    >
      <div
        className={cn(
          'flex min-h-28 items-center justify-center px-4',
          isDrawer && 'min-h-36 pt-10',
        )}
      >
        <div className={cn('flex items-center gap-3', isDrawer && 'flex-col gap-2 text-center')}>
          <InfinityMark className="h-8 w-12 shrink-0 text-brand-500" />
          <div className={cn('text-left', isDrawer && 'text-center')}>
            <p className="text-xs font-semibold tracking-wide">INFINITY BARBERS</p>
            <p className="mt-0.5 text-[11px] text-brand-300">Look Good. Feel Great.</p>
          </div>
        </div>
      </div>

      <nav aria-label="Admin navigation" className="flex flex-col gap-1 px-2 lg:px-3">
        {primaryNavigation.map((item) => (
          <NavigationLink
            key={item.label}
            item={item}
            onNavigate={onNavigate}
            presentation={presentation}
          />
        ))}
      </nav>

      <div className="mx-3 my-3 border-t border-white/10 lg:mx-4" />
      <nav aria-label="Account navigation" className="flex flex-col gap-1 px-2 lg:px-3">
        {secondaryNavigation.map((item) => (
          <NavigationLink
            key={item.label}
            item={item}
            onNavigate={onNavigate}
            presentation={presentation}
          />
        ))}
        <button
          type="button"
          onClick={() => {
            onNavigate?.()
            onSignOut()
          }}
          disabled={isSigningOut}
          aria-label="Sign out"
          className={cn(
            'group flex min-h-12 w-full items-center gap-3 rounded-ui-md px-3 text-left text-sm font-medium text-sidebar-text transition-colors hover:bg-sidebar-hover hover:text-white disabled:cursor-not-allowed disabled:opacity-60',
            isDrawer && 'px-4',
            !isDrawer && 'lg:px-3',
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>{isSigningOut ? 'Signing out…' : 'Sign out'}</span>
        </button>
      </nav>

      <div
        aria-hidden="true"
        className="relative mt-auto h-36 overflow-hidden bg-[radial-gradient(ellipse_at_55%_110%,#3b3b40_0%,#1c1c1e_66%)] [@media(max-height:699px)]:hidden"
      >
        <Scissors className="absolute bottom-8 left-1/2 h-20 w-20 -translate-x-1/2 -rotate-45 text-white/20 lg:h-28 lg:w-28" />
        <div className="absolute -bottom-3 -left-8 h-7 w-[150%] rotate-[-17deg] rounded-full border-t-4 border-brand-500 bg-black/30" />
      </div>
    </aside>
  )
}
