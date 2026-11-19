import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Menu } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { MobileDrawer } from '@/components/layout/MobileDrawer'
import { AnimatedInfinity } from '@/components/brand/AnimatedInfinity'
import { useAuth } from '@/features/auth/useAuth'
import { formatShortDateInHarare } from '@/lib/dates'
import { AdminBottomNav, AdminFab } from './AdminMobileNavigation'
import { AdminSidebar } from './AdminSidebar'

const ADMIN_PAGE_TITLES: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/appointments': 'Appointments',
  '/admin/walk-ins': 'Walk-ins',
  '/admin/customers': 'Customers',
  '/admin/barbers': 'Barbers',
  '/admin/services': 'Services',
  '/admin/reports': 'Reports',
  '/admin/settings': 'Settings',
  '/admin/more': 'More',
}

export default function AdminLayout() {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    await signOut()
    navigate('/login', { replace: true })
  }

  const handleSignOutClick = () => {
    void handleSignOut()
  }

  const pageTitle = ADMIN_PAGE_TITLES[location.pathname] ?? 'Infinity Barbers'
  const initials = (user?.profile?.full_name ?? user?.email ?? 'A')
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

  const closeDrawer = () => setIsDrawerOpen(false)

  return (
    <AppShell
      hasSidebar
      sidebar={
        <>
          <AdminSidebar onSignOut={handleSignOutClick} isSigningOut={isSigningOut} />
          <MobileDrawer
            id="admin-mobile-navigation"
            isOpen={isDrawerOpen}
            onClose={closeDrawer}
            title="Admin navigation"
          >
            <AdminSidebar
              presentation="drawer"
              onNavigate={closeDrawer}
              onSignOut={handleSignOutClick}
              isSigningOut={isSigningOut}
            />
          </MobileDrawer>
        </>
      }
      header={
        <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between gap-3 bg-sidebar px-4 pt-[env(safe-area-inset-top)] text-white lg:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              aria-label="Open navigation menu"
              aria-expanded={isDrawerOpen}
              aria-controls="admin-mobile-navigation"
              onClick={() => setIsDrawerOpen(true)}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-ui-md text-sidebar-text hover:bg-sidebar-hover hover:text-white"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <AnimatedInfinity size={36} animate={false} className="shrink-0" />
            <span className="truncate text-sm font-semibold text-white">Infinity Barbers</span>
            <span className="sr-only">
              {formatShortDateInHarare()} · {pageTitle}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label="Open account settings"
              onClick={() => navigate('/admin/settings')}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-on-brand"
            >
              {initials}
            </button>
          </div>
        </header>
      }
      bottomNavigation={<AdminBottomNav />}
    >
      <Outlet />
      {['/admin/dashboard', '/admin/appointments'].includes(location.pathname) && (
        <AdminFab
          onSelect={(destination) =>
            navigate(destination, {
              state: {
                openBookingForm: destination === '/admin/walk-ins' ? 'walk_in' : 'appointment',
              },
            })
          }
        />
      )}
    </AppShell>
  )
}
