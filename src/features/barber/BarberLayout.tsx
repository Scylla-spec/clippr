import { Outlet, useNavigate, Link } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/features/auth/useAuth'
import { Button } from '@/components/ui/Button'
import { AnimatedInfinity } from '@/components/brand/AnimatedInfinity'
import { Logo } from '@/components/brand/Logo'
import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { BottomNav } from './BottomNav'

export default function BarberLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <AppShell
      mainClassName="mx-auto w-full max-w-4xl p-4 pb-[calc(56px+env(safe-area-inset-bottom)+1.5rem)] sm:p-6 lg:pb-6"
      header={
        <header className="sticky top-0 z-30 border-b border-white/10 bg-sidebar text-white">
          <div className="mx-auto flex min-h-14 max-w-4xl items-center justify-between gap-2 px-4 pt-[env(safe-area-inset-top)] sm:px-6 lg:hidden">
            <div className="flex min-w-0 items-center gap-3">
              <AnimatedInfinity size={40} animate={false} />
              <span className="truncate text-sm font-semibold">Infinity Barbers</span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => void handleSignOut()}
                disabled={isSigningOut}
                aria-label="Sign out"
                className="inline-flex min-h-12 items-center justify-center gap-1 rounded-ui-md px-2 text-xs font-medium text-sidebar-text hover:bg-sidebar-hover hover:text-white disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span>Sign out</span>
              </button>
              <Link
                to="/barber/account"
                aria-label={`Account settings for ${user?.profile?.full_name ?? 'barber'}`}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-on-brand"
              >
                {(user?.profile?.full_name ?? 'B')
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0].toUpperCase())
                  .join('')}
              </Link>
            </div>
          </div>
          <div className="mx-auto hidden min-h-16 max-w-4xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:flex">
            <Link
              to="/barber/dashboard"
              aria-label="Infinity Barbers queue"
              className="flex items-center gap-3"
            >
              <Logo size={24} showWordmark textClassName="text-white" />
              <span className="rounded-ui-sm bg-sidebar-hover px-2 py-1 text-xs font-semibold uppercase tracking-wider text-brand-300">
                Barber
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <span className="hidden text-sm font-medium text-white sm:inline">
                {user?.profile?.full_name ?? 'Barber'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void handleSignOut()}
                isLoading={isSigningOut}
                className="text-xs font-medium text-sidebar-text hover:text-white"
              >
                Sign out
              </Button>
            </div>
          </div>
        </header>
      }
      bottomNavigation={<BottomNav />}
    >
      <Outlet />
    </AppShell>
  )
}
