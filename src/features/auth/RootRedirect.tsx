import { Navigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import { PageLoader } from '@/components/ui/PageLoader'

export function RootRedirect() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <PageLoader />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.profile?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />
  }

  if (user.profile?.role === 'barber') {
    return <Navigate to="/barber/dashboard" replace />
  }

  return <Navigate to="/login" replace />
}
