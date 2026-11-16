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
const BarberLayout = lazy(() => import('@/features/barber/BarberLayout'))
const BarberDashboardPage = lazy(() => import('@/features/barber/BarberDashboardPage'))
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
