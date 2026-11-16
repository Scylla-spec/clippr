/**
 * RoleGuard.tsx
 *
 * Renders children only if the authenticated user has one of the allowed roles.
 * Shows /403 otherwise. Must be nested inside AuthGuard.
 */

import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import type { UserRole } from './auth.types'
import { useAuth } from './useAuth'

interface RoleGuardProps {
  allowed: UserRole[]
  children: ReactNode
}

export function RoleGuard({ allowed, children }: RoleGuardProps) {
  const { user } = useAuth()
  const role = user?.profile?.role

  if (!role || !allowed.includes(role)) {
    return <Navigate to="/403" replace />
  }

  return <>{children}</>
}
