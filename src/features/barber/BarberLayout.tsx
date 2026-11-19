import { Outlet, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import { Button } from '@/components/ui/Button'
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
      mainClassName="mx-auto w-full max-w-4xl p-4 pb-24 sm:p-6 md:pb-6"
      header={
        <header className="sticky top-0 z-30 border-b border-white/10 bg-sidebar text-white">
          <div className="mx-auto flex min-h-16 max-w-4xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
            <Link to="/barber/dashboard" aria-label="Infinity Barbers queue" className="flex items-center gap-3">
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
