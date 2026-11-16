import { Outlet, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import { Button } from '@/components/ui/Button'
import { useState } from 'react'

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
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-surface-900 dark:text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-surface-700 dark:bg-surface-800/95">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/barber/dashboard" className="flex items-center gap-2 group">
              <span className="text-xl" role="img" aria-label="Scissors">
                ✂️
              </span>
              <span className="font-bold tracking-tight text-surface-900 group-hover:text-brand-500 dark:text-white transition-colors">
                Clippr
              </span>
              <span className="rounded bg-blue-500/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                Barber
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end text-right">
              <span className="text-sm font-medium leading-none text-surface-900 dark:text-white">
                {user?.profile?.full_name ?? 'Barber'}
              </span>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => void handleSignOut()}
              isLoading={isSigningOut}
              className="text-xs font-medium"
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 mx-auto w-full max-w-4xl p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  )
}
