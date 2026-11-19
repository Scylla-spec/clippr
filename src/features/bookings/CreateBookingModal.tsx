import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { fromZonedTime } from 'date-fns-tz'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import { createBookingSchema, type CreateBookingFormData } from './booking.schema'
import { useServices } from '@/features/services/useServices'
import { useBarbers } from '@/features/barbers/useBarbers'
import { useDayBookings } from './useBookings'
import { getNextAvailableSlot } from './queue'
import { APP_TIMEZONE } from '@/lib/constants'
import { toHarareDateString, formatTimeInHarare } from '@/lib/dates'
import { normalizePhone, isValidPhone } from '@/lib/phone'
import { supabase } from '@/lib/supabase'

interface CreateBookingModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateBookingFormData) => Promise<void>
  initialBarberId?: string
  initialDate?: string
  isLoading?: boolean
}

function slotOverlaps(
  start: Date,
  durationMin: number,
  bookings: NonNullable<ReturnType<typeof useDayBookings>['data']>,
) {
  const end = start.getTime() + durationMin * 60_000
  return bookings.some((booking) => {
    if (booking.status === 'cancelled' || booking.status === 'no_show') return false
    const bookingStart = new Date(booking.start_time).getTime()
    const bookingEnd = new Date(booking.end_time).getTime()
    return start.getTime() < bookingEnd && end > bookingStart
  })
}

export function CreateBookingModal({
  isOpen,
  onClose,
  onSubmit,
  initialBarberId,
  initialDate,
  isLoading = false,
}: CreateBookingModalProps) {
  const [submissionError, setSubmissionError] = useState('')
  const { data: services } = useServices(false)
  const { data: barbers } = useBarbers()
  const activeBarbers = barbers?.filter((barber) => barber.is_active) ?? []
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateBookingFormData>({
    resolver: zodResolver(createBookingSchema),
    defaultValues: {
      clientName: '',
      clientPhone: '',
      barberId: initialBarberId ?? '',
      serviceId: '',
      bookingDate: initialDate ?? toHarareDateString(),
      bookingTime: '',
    },
  })
  const date = watch('bookingDate')
  const barberId = watch('barberId')
  const serviceId = watch('serviceId')
  const phoneField = register('clientPhone')
  const dateField = register('bookingDate')
  const { data: dayBookings = [] } = useDayBookings(date || toHarareDateString())
  const selectedService = services?.find((service) => service.id === serviceId)
  const selectedBarber = activeBarbers.find((barber) => barber.id === barberId)
  const nextFreeAt = (selectedBarberId: string) => {
    const earliest =
      date > toHarareDateString() ? fromZonedTime(`${date}T08:00:00`, APP_TIMEZONE) : new Date()
    const nextSlot = getNextAvailableSlot(
      dayBookings
        .filter(
          (booking) =>
            booking.barber_id === selectedBarberId &&
            booking.status !== 'cancelled' &&
            booking.status !== 'no_show',
        )
        .map((booking) => ({ start_time: booking.start_time, end_time: booking.end_time })),
      selectedService?.duration_min ?? 30,
      earliest,
    )
    return formatTimeInHarare(nextSlot.toISOString())
  }

  useEffect(() => {
    if (isOpen) {
      if (initialBarberId) setValue('barberId', initialBarberId)
      if (initialDate) setValue('bookingDate', initialDate)
      return
    }
    reset()
  }, [isOpen, initialBarberId, initialDate, reset, setValue])

  if (!isOpen) return null

  const slots =
    selectedService && selectedBarber && date
      ? Array.from({ length: 49 }, (_, index) => {
          const minutes = 8 * 60 + index * 15
          const time = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
          const start = fromZonedTime(`${date}T${time}:00`, APP_TIMEZONE)
          return {
            time,
            start,
            available:
              start.getTime() > Date.now() &&
              !slotOverlaps(
                start,
                selectedService.duration_min,
                dayBookings.filter((booking) => booking.barber_id === selectedBarber.id),
              ),
          }
        }).filter((slot) => slot.available)
      : []

  const handleClose = () => {
    reset()
    setSubmissionError('')
    onClose()
  }

  const lookupClientByPhone = async () => {
    const rawPhone = watch('clientPhone').trim()
    if (!rawPhone) return
    const normalizedPhone = normalizePhone(rawPhone)
    if (!isValidPhone(normalizedPhone)) return

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('full_name')
        .eq('phone', normalizedPhone)
        .maybeSingle()
      if (error) throw error
      if (data && !watch('clientName')) {
        setValue('clientName', data.full_name, { shouldValidate: true })
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not look up this client')
    }
  }

  return (
    <div
      className="fixed inset-0 z-70 flex items-end bg-black/50"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isLoading) handleClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-booking-title"
        className="flex max-h-[100dvh] w-full flex-col rounded-t-ui-xl bg-surface shadow-ui-lg motion-safe:animate-[sheet-up_180ms_ease-out]"
      >
        <div className="shrink-0 px-4 pt-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" aria-hidden="true" />
          <header className="flex items-center justify-between gap-3">
            <div>
              <h2 id="create-booking-title" className="text-xl font-semibold">
                New appointment
              </h2>
              <p className="text-sm text-text-muted">Choose a free time for your client.</p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              aria-label="Close appointment form"
              className="inline-flex h-12 w-12 items-center justify-center rounded-full text-text-muted hover:bg-page"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </header>
        </div>
        <form
          noValidate
          onSubmit={handleSubmit(async (data) => {
            setSubmissionError('')
            try {
              await onSubmit(data)
              handleClose()
            } catch (error) {
              setSubmissionError(
                error instanceof Error ? error.message : 'Could not save this appointment',
              )
            }
          })}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className="space-y-4 px-4 py-4">
            {submissionError ? (
              <p
                role="alert"
                className="rounded-ui-md bg-status-danger-bg p-3 text-sm text-status-danger-text"
              >
                {submissionError}
              </p>
            ) : null}
            <div>
              <label htmlFor="client-phone" className="mb-1 block text-sm font-medium">
                Phone number
              </label>
              <input
                id="client-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="0771234567 or +263…"
                aria-invalid={Boolean(errors.clientPhone)}
                aria-describedby={errors.clientPhone ? 'client-phone-error' : undefined}
                className="min-h-12 w-full rounded-ui-md border border-border bg-surface px-3 text-base"
                {...phoneField}
                onBlur={(event) => {
                  void phoneField.onBlur(event)
                  void lookupClientByPhone()
                }}
              />
              {errors.clientPhone ? (
                <p id="client-phone-error" className="mt-1 text-sm text-status-danger-text">
                  {errors.clientPhone.message}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="client-name" className="mb-1 block text-sm font-medium">
                Client name
              </label>
              <input
                id="client-name"
                autoComplete="name"
                placeholder="Client name"
                aria-invalid={Boolean(errors.clientName)}
                className="min-h-12 w-full rounded-ui-md border border-border bg-surface px-3 text-base"
                {...register('clientName')}
              />
              {errors.clientName ? (
                <p className="mt-1 text-sm text-status-danger-text">{errors.clientName.message}</p>
              ) : null}
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-medium">Service</legend>
              <div className="grid grid-cols-2 gap-2">
                {(services ?? []).map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    aria-pressed={serviceId === service.id}
                    onClick={() => {
                      setValue('serviceId', service.id, { shouldValidate: true })
                      setValue('bookingTime', '', { shouldValidate: true })
                    }}
                    className={`min-h-16 rounded-ui-md border p-3 text-left ${
                      serviceId === service.id
                        ? 'border-brand-500 bg-brand-100 text-brand-text'
                        : 'border-border bg-surface'
                    }`}
                  >
                    <span className="block truncate text-sm font-semibold">{service.name}</span>
                    <span className="mt-1 block text-xs text-text-muted">
                      {service.duration_min} min · ${Number(service.price).toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
              {errors.serviceId ? (
                <p className="mt-1 text-sm text-status-danger-text">{errors.serviceId.message}</p>
              ) : null}
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-sm font-medium">Barber</legend>
              <div className="flex flex-wrap gap-2">
                {activeBarbers.map((barber) => (
                  <button
                    key={barber.id}
                    type="button"
                    aria-pressed={barberId === barber.id}
                    onClick={() => {
                      setValue('barberId', barber.id, { shouldValidate: true })
                      setValue('bookingTime', '', { shouldValidate: true })
                    }}
                    className={`flex min-h-14 flex-col justify-center rounded-ui-md border px-3 text-left ${
                      barberId === barber.id
                        ? 'border-brand-500 bg-brand-100 text-brand-text'
                        : 'border-border bg-surface'
                    }`}
                  >
                    <span className="text-sm font-semibold">{barber.full_name}</span>
                    <span className="mt-0.5 text-xs text-text-muted">
                      Next free {nextFreeAt(barber.id)}
                    </span>
                  </button>
                ))}
              </div>
              {errors.barberId ? (
                <p className="mt-1 text-sm text-status-danger-text">{errors.barberId.message}</p>
              ) : null}
            </fieldset>

            <div>
              <label htmlFor="booking-date" className="mb-1 block text-sm font-medium">
                Date
              </label>
              <input
                id="booking-date"
                type="date"
                min={toHarareDateString()}
                aria-invalid={Boolean(errors.bookingDate)}
                className="min-h-12 w-full rounded-ui-md border border-border bg-surface px-3 text-base"
                {...dateField}
                onChange={(event) => {
                  void dateField.onChange(event)
                  setValue('bookingTime', '', { shouldValidate: true })
                }}
              />
              {errors.bookingDate ? (
                <p className="mt-1 text-sm text-status-danger-text">{errors.bookingDate.message}</p>
              ) : null}
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-medium">
                Free times {selectedBarber ? `with ${selectedBarber.full_name}` : ''}
              </legend>
              {!selectedService || !selectedBarber ? (
                <p className="text-sm text-text-muted">
                  Choose a service and barber to see free times.
                </p>
              ) : slots.length ? (
                <div className="grid grid-cols-4 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      aria-pressed={watch('bookingTime') === slot.time}
                      onClick={() => setValue('bookingTime', slot.time, { shouldValidate: true })}
                      className={`min-h-12 rounded-ui-md border px-2 text-sm font-medium tabular-nums ${
                        watch('bookingTime') === slot.time
                          ? 'border-brand-500 bg-brand-100 text-brand-text'
                          : 'border-border bg-surface'
                      }`}
                    >
                      {formatTimeInHarare(slot.start.toISOString())}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-muted">No free times remain on this date.</p>
              )}
              {errors.bookingTime ? (
                <p className="mt-1 text-sm text-status-danger-text">{errors.bookingTime.message}</p>
              ) : null}
            </fieldset>
          </div>
          <div className="sticky bottom-0 border-t border-border bg-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
            <button
              type="submit"
              disabled={isLoading}
              className="min-h-14 w-full rounded-ui-md bg-brand-500 px-4 text-base font-semibold text-on-brand disabled:opacity-60"
            >
              {isLoading ? 'Saving…' : 'Save appointment'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
