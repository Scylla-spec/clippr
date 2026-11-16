/**
 * ForbiddenPage.tsx — 403 page shown when a user lacks the required role.
 */

import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import { Button } from '@/components/ui/Button'

export default function ForbiddenPage() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <span className="text-6xl" aria-hidden="true">🚫</span>
      <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Access denied</h1>
      <p className="max-w-sm text-slate-500 dark:text-slate-400">
        You don't have permission to view this page. If you think this is an error, contact your
        administrator.
      </p>
      <Button variant="secondary" onClick={() => void handleSignOut()}>
        Sign out
      </Button>
    </main>
  )
}
