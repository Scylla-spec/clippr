import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import {
  BriefcaseBusiness,
  CalendarDays,
  CalendarPlus,
  ChartColumn,
  ChevronRight,
  Download,
  Footprints,
  House,
  LogOut,
  Menu,
  Plus,
  Scissors,
  Settings,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import { usePwaInstall } from '@/features/pwa/usePwaInstall'
import { cn } from '@/lib/utils'

const adminTabs = [
  { label: 'Home', to: '/admin/dashboard', Icon: House },
  { label: 'Bookings', to: '/admin/appointments', Icon: CalendarDays },
  { label: 'Customers', to: '/admin/customers', Icon: Users },
  { label: 'More', to: '/admin/more', Icon: Menu },
]

export function AdminBottomNav() {
  const { pathname } = useLocation()
  const currentTab =
    pathname === '/admin/dashboard'
      ? 'Home'
      : ['/admin/appointments', '/admin/walk-ins'].includes(pathname)
        ? 'Bookings'
        : pathname === '/admin/customers'
          ? 'Customers'
          : 'More'

  return (
    <nav
      aria-label="Admin navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="grid h-14 grid-cols-4">
        {adminTabs.map(({ label, to, Icon }) => (
          <Link
            key={label}
            to={to}
            aria-current={currentTab === label ? 'page' : undefined}
            className={cn(
              'relative flex min-h-12 flex-col items-center justify-center gap-0.5 px-1 text-xs font-medium',
              currentTab === label ? 'text-text' : 'text-text-muted hover:bg-page',
            )}
          >
            {currentTab === label && (
              <span
                aria-hidden="true"
                className="absolute inset-x-5 top-0 h-1 rounded-b-full bg-brand-500"
              />
            )}
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}

interface AdminFabProps {
  onSelect: (destination: '/admin/walk-ins' | '/admin/appointments') => void
}

export function AdminFab({ onSelect }: AdminFabProps) {
  const [isOpen, setIsOpen] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const openerRef = useRef<HTMLButtonElement>(null)
  const sheetRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    const opener = openerRef.current
    closeButtonRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      if (previousFocus) previousFocus.focus()
      else opener?.focus()
    }
  }, [isOpen])

  const chooseDestination = (destination: '/admin/walk-ins' | '/admin/appointments') => {
    setIsOpen(false)
    onSelect(destination)
  }

  const handleSheetKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Tab') return
    const focusable = sheetRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    )
    if (!focusable?.length) {
      event.preventDefault()
      return
    }

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <>
      <button
        ref={openerRef}
        type="button"
        aria-label="Create booking"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-[calc(56px+env(safe-area-inset-bottom)+16px)] right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-on-brand shadow-ui-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-text focus-visible:ring-offset-2 motion-safe:transition-transform motion-safe:hover:scale-105 lg:hidden"
      >
        <Plus className="h-7 w-7" aria-hidden="true" />
      </button>
      {isOpen && (
        <div
          className="fixed inset-0 z-70 flex items-end bg-black/50"
          onClick={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false)
          }}
        >
          <section
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-create-actions-title"
            onKeyDown={handleSheetKeyDown}
            className="w-full rounded-t-ui-xl bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-ui-lg motion-safe:animate-[sheet-up_180ms_ease-out]"
          >
            <div
              className="mx-auto mb-4 h-1 w-10 rounded-full bg-border sm:hidden"
              aria-hidden="true"
            />
            <div className="mb-4 flex items-center justify-between">
              <h2 id="admin-create-actions-title" className="text-lg font-semibold">
                Create a booking
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Close create booking options"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full text-text-muted hover:bg-page"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-3">
              <ActionOption
                Icon={Footprints}
                label="Add walk-in"
                onClick={() => chooseDestination('/admin/walk-ins')}
              />
              <ActionOption
                Icon={CalendarPlus}
                label="New appointment"
                onClick={() => chooseDestination('/admin/appointments')}
              />
            </div>
          </section>
        </div>
      )}
    </>
  )
}

function ActionOption({
  Icon,
  label,
  onClick,
}: {
  Icon: LucideIcon
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-14 w-full items-center gap-3 rounded-ui-md border border-border px-4 text-left font-semibold text-text hover:bg-page"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-text">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      {label}
      <ChevronRight className="ml-auto h-5 w-5 text-text-muted" aria-hidden="true" />
    </button>
  )
}

export function AdminMorePage() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const { isInstallable, isInstalled, isIosSafari, installApp } = usePwaInstall()
  const [installMessage, setInstallMessage] = useState('')
  const [isSigningOut, setIsSigningOut] = useState(false)

  const links: { label: string; to: string; Icon: LucideIcon }[] = [
    { label: 'Barbers', to: '/admin/barbers', Icon: Scissors },
    { label: 'Services', to: '/admin/services', Icon: BriefcaseBusiness },
    { label: 'Reports', to: '/admin/reports', Icon: ChartColumn },
    { label: 'Settings', to: '/admin/settings', Icon: Settings },
  ]

  const handleInstall = async () => {
    if (isInstallable) {
      try {
        const installed = await installApp()
        if (!installed)
          setInstallMessage('Installation was cancelled. You can try again from your browser menu.')
      } catch (error) {
        setInstallMessage(
          error instanceof Error
            ? `Could not start installation: ${error.message}`
            : 'Could not start installation.',
        )
      }
      return
    }
    setInstallMessage(
      isInstalled
        ? 'Infinity Barbers is already installed on this device.'
        : isIosSafari
          ? 'In Safari, tap Share, then Add to Home Screen.'
          : 'Open your browser menu and choose Install app or Add to Home Screen.',
    )
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">More</h1>
      <nav
        aria-label="More options"
        className="overflow-hidden rounded-ui-lg border border-border bg-surface"
      >
        {links.map(({ label, to, Icon }) => (
          <NavLink
            key={label}
            to={to}
            className="flex min-h-14 items-center gap-3 border-b border-border px-4 text-text last:border-b-0 hover:bg-page"
          >
            <Icon className="h-5 w-5 text-brand-text" aria-hidden="true" />
            <span className="font-medium">{label}</span>
            <ChevronRight className="ml-auto h-5 w-5 text-text-muted" aria-hidden="true" />
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => void handleInstall()}
          className="flex min-h-14 w-full items-center gap-3 border-t border-border px-4 text-left text-text hover:bg-page"
        >
          <Download className="h-5 w-5 text-brand-text" aria-hidden="true" />
          <span className="font-medium">Install app</span>
          <ChevronRight className="ml-auto h-5 w-5 text-text-muted" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => void handleSignOut()}
          disabled={isSigningOut}
          className="flex min-h-14 w-full items-center gap-3 border-t border-border px-4 text-left font-medium text-status-danger-text hover:bg-page disabled:opacity-60"
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
          <span>{isSigningOut ? 'Signing out…' : 'Sign out'}</span>
        </button>
      </nav>
      {installMessage && (
        <p role="status" className="rounded-ui-md bg-surface px-4 py-3 text-sm text-text-muted">
          {installMessage}
        </p>
      )}
    </div>
  )
}
