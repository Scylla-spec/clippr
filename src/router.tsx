import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { PageLoader } from '@/components/ui/PageLoader'
import { RoleGuard } from '@/features/auth/RoleGuard'
import { AuthGuard } from '@/features/auth/AuthGuard'
import { RootRedirect } from '@/features/auth/RootRedirect'

// Lazy-loaded pages
const LoginPage = lazy(() => import('@/features/auth/LoginPage'))
const AdminLayout = lazy(() => import('@/features/admin/AdminLayout'))
const AdminDashboardPage = lazy(() => import('@/features/admin/AdminDashboardPage'))
const AdminAppointmentsPage = lazy(() =>
  import('@/features/admin/AdminFeaturePages').then((module) => ({
    default: module.AdminAppointmentsPage,
  })),
)
const AdminWalkInsPage = lazy(() =>
  import('@/features/admin/AdminFeaturePages').then((module) => ({
    default: module.AdminWalkInsPage,
  })),
)
const AdminCustomersPage = lazy(() =>
  import('@/features/admin/AdminFeaturePages').then((module) => ({
    default: module.AdminCustomersPage,
  })),
)
const AdminBarbersPage = lazy(() =>
  import('@/features/admin/AdminFeaturePages').then((module) => ({
    default: module.AdminBarbersPage,
  })),
)
const AdminServicesPage = lazy(() =>
  import('@/features/admin/AdminFeaturePages').then((module) => ({
    default: module.AdminServicesPage,
  })),
)
const AdminReportsPage = lazy(() =>
  import('@/features/admin/AdminFeaturePages').then((module) => ({
    default: module.AdminReportsPage,
  })),
)
const AdminSettingsPage = lazy(() =>
  import('@/features/account/AccountSettingsPage').then((module) => ({
    default: module.AccountSettingsPage,
  })),
)
const BarberLayout = lazy(() => import('@/features/barber/BarberLayout'))
const BarberDashboardPage = lazy(() => import('@/features/barber/BarberDashboardPage'))
const BarberHistoryPage = lazy(() =>
  import('@/features/barber/BarberHistoryPage').then((module) => ({
    default: module.BarberHistoryPage,
  })),
)
const BarberAccountPage = lazy(() =>
  import('@/features/account/AccountSettingsPage').then((module) => ({
    default: module.BarberAccountPage,
  })),
)
const NotFoundPage = lazy(() => import('@/components/pages/NotFoundPage'))
const ForbiddenPage = lazy(() => import('@/components/pages/ForbiddenPage'))

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

export const router = createBrowserRouter([
  // Smart root redirect
  {
    path: '/',
    element: <RootRedirect />,
  },

  // Auth
  {
    path: '/login',
    element: (
      <Lazy>
        <LoginPage />
      </Lazy>
    ),
  },

  // Admin routes
  {
    path: '/admin',
    element: (
      <Lazy>
        <AuthGuard>
          <RoleGuard allowed={['admin']}>
            <AdminLayout />
          </RoleGuard>
        </AuthGuard>
      </Lazy>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      {
        path: 'dashboard',
        element: (
          <Lazy>
            <AdminDashboardPage />
          </Lazy>
        ),
      },
      {
        path: 'appointments',
        element: (
          <Lazy>
            <AdminAppointmentsPage />
          </Lazy>
        ),
      },
      {
        path: 'walk-ins',
        element: (
          <Lazy>
            <AdminWalkInsPage />
          </Lazy>
        ),
      },
      {
        path: 'customers',
        element: (
          <Lazy>
            <AdminCustomersPage />
          </Lazy>
        ),
      },
      {
        path: 'barbers',
        element: (
          <Lazy>
            <AdminBarbersPage />
          </Lazy>
        ),
      },
      {
        path: 'services',
        element: (
          <Lazy>
            <AdminServicesPage />
          </Lazy>
        ),
      },
      {
        path: 'reports',
        element: (
          <Lazy>
            <AdminReportsPage />
          </Lazy>
        ),
      },
      {
        path: 'settings',
        element: (
          <Lazy>
            <AdminSettingsPage />
          </Lazy>
        ),
      },
    ],
  },

  // Barber routes
  {
    path: '/barber',
    element: (
      <Lazy>
        <AuthGuard>
          <RoleGuard allowed={['barber']}>
            <BarberLayout />
          </RoleGuard>
        </AuthGuard>
      </Lazy>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      {
        path: 'dashboard',
        element: (
          <Lazy>
            <BarberDashboardPage />
          </Lazy>
        ),
      },
      {
        path: 'history',
        element: (
          <Lazy>
            <BarberHistoryPage />
          </Lazy>
        ),
      },
      {
        path: 'account',
        element: (
          <Lazy>
            <BarberAccountPage />
          </Lazy>
        ),
      },
    ],
  },

  // Error pages
  {
    path: '/403',
    element: (
      <Lazy>
        <ForbiddenPage />
      </Lazy>
    ),
  },
  {
    path: '*',
    element: (
      <Lazy>
        <NotFoundPage />
      </Lazy>
    ),
  },
])
