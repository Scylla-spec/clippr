import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createBookingSchema, type CreateBookingFormData } from './booking.schema'
import { useServices } from '@/features/services/useServices'
import { useBarbers } from '@/features/barbers/useBarbers'
import { toHarareDateString } from '@/lib/dates'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface CreateBookingModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateBookingFormData) => Promise<void>
  initialBarberId?: string
  initialDate?: string
  isLoading?: boolean
}

export function CreateBookingModal({
  isOpen,
  onClose,
  onSubmit,
  initialBarberId,
  initialDate,
  isLoading = false,
}: CreateBookingModalProps) {
  const { data: services } = useServices(false) // active only
  const { data: barbers } = useBarbers()
  const activeBarbers = barbers?.filter((b) => b.is_active) ?? []

  const defaultDate = initialDate ?? toHarareDateString()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateBookingFormData>({
    resolver: zodResolver(createBookingSchema),
    defaultValues: {
      clientName: '',
      clientPhone: '',
      barberId: initialBarberId ?? '',
      serviceId: '',
      bookingDate: defaultDate,
      bookingTime: '09:00',
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (initialBarberId) setValue('barberId', initialBarberId)
      if (initialDate) setValue('bookingDate', initialDate)
    }
  }, [isOpen, initialBarberId, initialDate, setValue])

  if (!isOpen) return null

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-booking-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-surface-800 my-8">
        <h2 id="create-booking-title" className="text-lg font-bold text-surface-900 dark:text-white">
          New Appointment Booking
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Schedule an advance appointment. End time will be auto-calculated from the service duration.
        </p>

        <form
          noValidate
          onSubmit={handleSubmit(async (data) => {
            await onSubmit(data)
            handleClose()
          })}
          className="mt-5 space-y-4"
        >
          {/* Client Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Client Name"
              placeholder="e.g. Farai Mutasa"
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
          </div>

          {/* Barber Selection */}
          <div className="flex flex-col gap-1">
            <label htmlFor="booking-barber-select" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Barber <span className="text-red-500">*</span>
            </label>
            <select
              id="booking-barber-select"
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

          {/* Service Selection */}
          <div className="flex flex-col gap-1">
            <label htmlFor="booking-service-select" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Service <span className="text-red-500">*</span>
            </label>
            <select
              id="booking-service-select"
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

          {/* Date & Time (in Harare time) */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Date"
              type="date"
              error={errors.bookingDate?.message}
              required
              {...register('bookingDate')}
            />

            <Input
              label="Start Time"
              type="time"
              error={errors.bookingTime?.message}
              required
              {...register('bookingTime')}
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading}>
              Book Appointment
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
