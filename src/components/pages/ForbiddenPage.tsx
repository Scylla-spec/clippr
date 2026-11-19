/**
 * ForbiddenPage.tsx — 403 page shown when a user lacks the required role.
 */

import { useNavigate } from 'react-router-dom'
import { ShieldX } from 'lucide-react'
import { useAuth } from '@/features/auth/useAuth'
import { Button } from '@/components/ui/Button'

export default function ForbiddenPage() {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()
  const profile = user?.profile

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <ShieldX className="h-16 w-16 text-rose-500" aria-hidden="true" />
      <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Access denied</h1>
      <p className="max-w-sm text-slate-500 dark:text-slate-400">
        This account{profile ? ` (${user?.email ?? profile.full_name})` : ''} is signed in
        {profile ? ` as ${profile.role}${profile.is_active ? '' : ' (inactive)'}` : ''}. Only an
        active administrator can open this page or create barber accounts.
      </p>
      <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
        Ask the owner of the Supabase project connected to this app to assign your account the
        active admin role, then sign out and back in.
      </p>
      <Button variant="secondary" onClick={() => void handleSignOut()}>
        Sign out
      </Button>
    </main>
  )
}
