/**
 * AuthGuard.tsx
 *
 * Redirects unauthenticated users to /login.
 * Shows a loading spinner while the initial session is being restored.
 */

import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { PageLoader } from '@/components/ui/PageLoader'
import { useAuth } from './useAuth'

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <PageLoader />

  if (!user) {
    // Preserve the intended URL so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
