import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import { useState } from 'react'
import { Menu } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { MobileDrawer } from '@/components/layout/MobileDrawer'
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
}

export default function AdminLayout() {
  const { signOut } = useAuth()
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
        <header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 bg-sidebar px-4 text-white md:hidden">
          <button
            type="button"
            aria-label="Open navigation menu"
            aria-expanded={isDrawerOpen}
            aria-controls="admin-mobile-navigation"
            onClick={() => setIsDrawerOpen(true)}
            className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-ui-md text-sidebar-text hover:bg-sidebar-hover hover:text-white"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <span className="text-base font-semibold">{pageTitle}</span>
        </header>
      }
    >
      <Outlet />
    </AppShell>
  )
}
