import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Copy, Eye, EyeOff } from 'lucide-react'
import { createBarberSchema, type CreateBarberFormData } from './barber.schema'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface CreatedCredentials {
  email: string
  password: string
}

interface CreateBarberModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateBarberFormData) => Promise<void>
  isLoading?: boolean
}

export function CreateBarberModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: CreateBarberModalProps) {
  const [createdCredentials, setCreatedCredentials] = useState<CreatedCredentials | null>(null)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateBarberFormData>({
    resolver: zodResolver(createBarberSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
    },
  })

  if (!isOpen) return null

  const handleClose = () => {
    reset()
    setCreatedCredentials(null)
    setIsPasswordVisible(false)
    setSubmitError('')
    onClose()
  }

  const handleCopyCredentials = async () => {
    if (!createdCredentials) return
    try {
      await navigator.clipboard.writeText(
        `Email: ${createdCredentials.email}\nTemporary password: ${createdCredentials.password}`,
      )
    } catch {
      setSubmitError('Clipboard access failed. Select and copy the credentials manually.')
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-barber-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-surface-800">
        <h2 id="create-barber-title" className="text-lg font-bold text-surface-900 dark:text-white">
          Add New Barber
        </h2>
        {createdCredentials ? (
          <div className="mt-5 space-y-4">
            <div
              role="status"
              className="border-status-success-text/20 rounded-ui-md border bg-status-success-bg p-4"
            >
              <div className="flex items-center gap-2 font-semibold text-status-success-text">
                <Check className="h-5 w-5" aria-hidden="true" />
                Barber account created
              </div>
              <p className="mt-2 text-sm text-text">
                Share these sign-in credentials with the barber. They can change the password from
                Account.
              </p>
            </div>
            <Input label="Login email" value={createdCredentials.email} readOnly />
            <Input
              label="Temporary password"
              type="text"
              value={createdCredentials.password}
              readOnly
              autoComplete="off"
            />
            {submitError && (
              <p role="alert" className="text-sm text-status-danger-text">
                {submitError}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => void handleCopyCredentials()}
              >
                <Copy className="h-4 w-4" aria-hidden="true" />
                Copy credentials
              </Button>
              <Button type="button" onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              This provisions an auth login and dashboard profile. A secure Edge Function handles
              creation.
            </p>

            <form
              noValidate
              onSubmit={handleSubmit(async (data) => {
                setSubmitError('')
                try {
                  await onSubmit(data)
                  setCreatedCredentials({ email: data.email, password: data.password })
                  reset()
                } catch (error) {
                  setSubmitError(
                    error instanceof Error ? error.message : 'Failed to create barber account',
                  )
                }
              })}
              className="mt-5 space-y-4"
            >
              <Input
                label="Full Name"
                placeholder="e.g. Tinashe Hove"
                error={errors.fullName?.message}
                required
                {...register('fullName')}
              />

              <Input
                label="Login Email"
                type="email"
                placeholder="tinashe@infinitybarbers.local"
                error={errors.email?.message}
                required
                {...register('email')}
              />

              <Input
                label="Temporary Password"
                type={isPasswordVisible ? 'text' : 'password'}
                placeholder="At least 8 characters"
                hint="The barber can change this password after signing in."
                error={errors.password?.message}
                required
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setIsPasswordVisible((visible) => !visible)}
                aria-label={
                  isPasswordVisible ? 'Hide temporary password' : 'Show temporary password'
                }
                className="inline-flex min-h-touch items-center gap-2 text-sm font-medium text-brand-text hover:underline"
              >
                {isPasswordVisible ? (
                  <>
                    <EyeOff className="h-4 w-4" aria-hidden="true" /> Hide password
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" aria-hidden="true" /> Show password
                  </>
                )}
              </button>

              {submitError && (
                <p role="alert" className="text-sm text-status-danger-text">
                  {submitError}
                </p>
              )}

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isLoading}>
                  Create Barber Account
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
