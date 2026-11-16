import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { serviceSchema, type ServiceFormData } from './service.schema'
import type { Service } from '@/lib/database.types'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface ServiceFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ServiceFormData) => Promise<void>
  serviceToEdit?: Service | null
  isLoading?: boolean
}

export function ServiceFormModal({
  isOpen,
  onClose,
  onSubmit,
  serviceToEdit,
  isLoading = false,
}: ServiceFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      duration_min: 30,
      price: 5.0,
      is_active: true,
    },
  })

  useEffect(() => {
    if (serviceToEdit) {
      reset({
        name: serviceToEdit.name,
        duration_min: serviceToEdit.duration_min,
        price: Number(serviceToEdit.price),
        is_active: serviceToEdit.is_active,
      })
    } else {
      reset({
        name: '',
        duration_min: 30,
        price: 5.0,
        is_active: true,
      })
    }
  }, [serviceToEdit, reset, isOpen])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-surface-800">
        <h2 id="service-modal-title" className="text-lg font-bold text-surface-900 dark:text-white">
          {serviceToEdit ? 'Edit Service' : 'Add New Service'}
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Services are used to automatically compute booking durations and queue schedules.
        </p>

        <form
          noValidate
          onSubmit={handleSubmit(async (data) => {
            await onSubmit(data)
            onClose()
          })}
          className="mt-5 space-y-4"
        >
          <Input
            label="Service Name"
            placeholder="e.g. Buzz Cut & Lineup"
            error={errors.name?.message}
            required
            {...register('name')}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Duration (minutes)"
              type="number"
              step="5"
              min="5"
              max="480"
              placeholder="30"
              error={errors.duration_min?.message}
              required
              {...register('duration_min')}
            />

            <Input
              label="Price (USD $)"
              type="number"
              step="0.50"
              min="0"
              placeholder="5.00"
              error={errors.price?.message}
              required
              {...register('price')}
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              id="is_active_checkbox"
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500 dark:border-surface-600 dark:bg-surface-700"
              {...register('is_active')}
            />
            <label
              htmlFor="is_active_checkbox"
              className="text-sm font-medium text-slate-700 dark:text-slate-300 select-none cursor-pointer"
            >
              Active and available for booking
            </label>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading}>
              {serviceToEdit ? 'Save Changes' : 'Create Service'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
