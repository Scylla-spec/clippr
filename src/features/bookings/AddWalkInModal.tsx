import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Footprints } from 'lucide-react'
import { walkInSchema, type WalkInFormData } from './booking.schema'
import { useServices } from '@/features/services/useServices'
import { useBarbers } from '@/features/barbers/useBarbers'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface AddWalkInModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: WalkInFormData) => Promise<void>
  initialBarberId?: string
  isLoading?: boolean
}

export function AddWalkInModal({
  isOpen,
  onClose,
  onSubmit,
  initialBarberId,
  isLoading = false,
}: AddWalkInModalProps) {
  const { data: services } = useServices(false)
  const { data: barbers } = useBarbers()
  const activeBarbers = barbers?.filter((b) => b.is_active) ?? []

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<WalkInFormData>({
    resolver: zodResolver(walkInSchema),
    defaultValues: {
      clientName: '',
      clientPhone: '',
      barberId: initialBarberId ?? '',
      serviceId: '',
    },
  })

  useEffect(() => {
    if (isOpen && initialBarberId) {
      setValue('barberId', initialBarberId)
    }
  }, [isOpen, initialBarberId, setValue])

  if (!isOpen) return null

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="walk-in-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-surface-800">
        <div className="flex items-center gap-2">
          <Footprints className="h-5 w-5 text-brand-600 dark:text-brand-400" aria-hidden="true" />
          <h2 id="walk-in-title" className="text-lg font-bold text-surface-900 dark:text-white">
            Quick Add Walk-in
          </h2>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Walk-ins enter the unified queue immediately at the earliest free slot for the selected barber.
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
            label="Client Name"
            placeholder="e.g. Blessing Dube"
            error={errors.clientName?.message}
            required
            {...register('clientName')}
          />

          <Input
            label="Phone Number"
            placeholder="0771234567 or +263..."
            hint="Normalized to Zimbabwe +263"
            error={errors.clientPhone?.message}
            required
            {...register('clientPhone')}
          />

          <div className="flex flex-col gap-1">
            <label htmlFor="walkin-barber-select" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Barber <span className="text-red-500">*</span>
            </label>
            <select
              id="walkin-barber-select"
              aria-invalid={errors.barberId ? 'true' : undefined}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
              {...register('barberId')}
            >
              <option value="">Select a barber...</option>
              {activeBarbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.full_name}
                </option>
              ))}
            </select>
            {errors.barberId && (
              <p className="text-xs font-medium text-red-600 dark:text-red-400">{errors.barberId.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="walkin-service-select" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Service <span className="text-red-500">*</span>
            </label>
            <select
              id="walkin-service-select"
              aria-invalid={errors.serviceId ? 'true' : undefined}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
              {...register('serviceId')}
            >
              <option value="">Select a service...</option>
              {services?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.duration_min} min — ${Number(s.price).toFixed(2)})
                </option>
              ))}
            </select>
            {errors.serviceId && (
              <p className="text-xs font-medium text-red-600 dark:text-red-400">{errors.serviceId.message}</p>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading}>
              Insert Into Queue
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
