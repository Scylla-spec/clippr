import { Outlet, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/brand/Logo'
import { useState } from 'react'

export default function AdminLayout() {
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
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <Link to="/admin/dashboard" className="flex items-center gap-2 group">
              <Logo size={24} showWordmark={true} />
              <span className="rounded bg-brand-500/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                Admin
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-slate-200 dark:border-surface-700 text-sm font-medium">
              <Link
                to="/admin/dashboard"
                className="px-3 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-surface-700 text-slate-700 dark:text-slate-300"
              >
                Dashboard
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-sm font-medium leading-none text-surface-900 dark:text-white">
                {user?.profile?.full_name ?? user?.email}
              </span>
              <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {user?.email}
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
      <main className="flex-1 mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}
