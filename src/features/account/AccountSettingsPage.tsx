import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardBody } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/useAuth'
import { supabase } from '@/lib/supabase'

function AccountSettings({ title, showSignOut = false }: { title: string; showSignOut?: boolean }) {
  const navigate = useNavigate()
  const { user, refreshProfile, signOut } = useAuth()
  const [fullName, setFullName] = useState(user?.profile?.full_name ?? '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to sign out')
    } finally {
      setIsSigningOut(false)
    }
  }

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) {
      toast.error('You must be signed in to update your profile')
      return
    }
    if (!fullName.trim()) {
      toast.error('Enter a name before saving')
      return
    }

    setIsSavingProfile(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', user.id)
        .select('id')
        .single()
      if (error) throw error

      try {
        await refreshProfile()
      } catch {
        toast.error('Your name was saved, but the page could not refresh your profile.')
        return
      }
      toast.success('Profile updated')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const savePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('The passwords do not match')
      return
    }

    setIsSavingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Password changed')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to change password')
    } finally {
      setIsSavingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-text-muted">
          Update your account name and sign-in password.
        </p>
      </header>

      <Card>
        <CardBody>
          <form onSubmit={saveProfile} className="max-w-xl space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-text">Profile</h2>
              <p className="mt-1 text-sm text-text-muted">This name is shown in the app.</p>
            </div>
            <Input label="Email" type="email" value={user?.email ?? ''} readOnly disabled />
            <Input
              label="Full name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              minLength={1}
              maxLength={100}
              required
            />
            <Button type="submit" isLoading={isSavingProfile} disabled={!fullName.trim()}>
              Save profile
            </Button>
          </form>
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <form onSubmit={savePassword} className="max-w-xl space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-text">Change password</h2>
              <p className="mt-1 text-sm text-text-muted">
                Choose a password with at least 8 characters.
              </p>
            </div>
            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              minLength={8}
              required
            />
            <Input
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={8}
              required
            />
            <Button
              type="submit"
              isLoading={isSavingPassword}
              disabled={!newPassword || !confirmPassword}
            >
              Change password
            </Button>
          </form>
        </CardBody>
      </Card>
      {showSignOut ? (
        <Card>
          <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-text">Sign out</h2>
              <p className="mt-1 text-sm text-text-muted">
                Sign out of your barber account on this device.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              isLoading={isSigningOut}
              onClick={() => void handleSignOut()}
              className="min-h-12 shrink-0"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </Button>
          </CardBody>
        </Card>
      ) : null}
    </div>
  )
}

export function AccountSettingsPage() {
  return <AccountSettings title="Settings" />
}

export function BarberAccountPage() {
  return <AccountSettings title="Account" showSignOut />
}
