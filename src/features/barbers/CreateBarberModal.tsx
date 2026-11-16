import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createBarberSchema, type CreateBarberFormData } from './barber.schema'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

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
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-barber-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-surface-800">
        <h2 id="create-barber-title" className="text-lg font-bold text-surface-900 dark:text-white">
          Add New Barber
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          This provisions an auth login and dashboard profile. A secure Edge Function handles creation.
        </p>

        <form
          noValidate
          onSubmit={handleSubmit(async (data) => {
            await onSubmit(data)
            handleClose()
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
            placeholder="tinashe@clippr.local"
            error={errors.email?.message}
            required
            {...register('email')}
          />

          <Input
            label="Temporary Password"
            type="password"
            placeholder="At least 6 characters"
            hint="The barber will use this password to sign in."
            error={errors.password?.message}
            required
            {...register('password')}
          />

          <div className="mt-6 flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading}>
              Create Barber Account
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
