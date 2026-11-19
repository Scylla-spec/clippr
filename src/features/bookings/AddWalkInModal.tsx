import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Footprints, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { walkInSchema, type WalkInFormData } from './booking.schema'
import { useServices } from '@/features/services/useServices'
import { useBarbers } from '@/features/barbers/useBarbers'
import { useDayBookings } from './useBookings'
import { getNextAvailableSlot } from './queue'
import { toHarareDateString, formatTimeInHarare } from '@/lib/dates'
import { normalizePhone, isValidPhone } from '@/lib/phone'
import { supabase } from '@/lib/supabase'

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
  } = useForm<WalkInFormData>({
    resolver: zodResolver(walkInSchema),
    defaultValues: {
      clientName: '',
      clientPhone: '',
      barberId: initialBarberId ?? '',
      serviceId: '',
    },
  })
  const phoneField = register('clientPhone')
  const selectedBarberId = watch('barberId')
  const selectedServiceId = watch('serviceId')
  const selectedService = services?.find((service) => service.id === selectedServiceId)
  const today = toHarareDateString()
  const { data: dayBookings = [] } = useDayBookings(today)

  useEffect(() => {
    if (isOpen && initialBarberId) setValue('barberId', initialBarberId)
    if (!isOpen) reset()
  }, [isOpen, initialBarberId, reset, setValue])

  if (!isOpen) return null

  const getNextFreeTime = (barberId: string) => {
    if (!selectedService) return 'Choose a service'
    const activeBookings = dayBookings
      .filter(
        (booking) =>
          booking.barber_id === barberId &&
          booking.status !== 'cancelled' &&
          booking.status !== 'no_show',
      )
      .map((booking) => ({ start_time: booking.start_time, end_time: booking.end_time }))
    const now = new Date()
    const candidate = getNextAvailableSlot(activeBookings, selectedService.duration_min, now)
    return formatTimeInHarare(candidate.toISOString())
  }

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
        aria-labelledby="walk-in-title"
        className="flex max-h-[100dvh] w-full flex-col rounded-t-ui-xl bg-surface shadow-ui-lg motion-safe:animate-[sheet-up_180ms_ease-out]"
      >
        <div className="shrink-0 px-4 pt-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" aria-hidden="true" />
          <header className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Footprints className="h-5 w-5 text-brand-text" aria-hidden="true" />
              <div>
                <h2 id="walk-in-title" className="text-xl font-semibold">
                  Add walk-in
                </h2>
                <p className="text-sm text-text-muted">Add a client to today’s live queue.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              aria-label="Close walk-in form"
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
                error instanceof Error ? error.message : 'Could not add this walk-in',
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
              <label htmlFor="walkin-client-phone" className="mb-1 block text-sm font-medium">
                Phone number
              </label>
              <input
                id="walkin-client-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="0771234567 or +263…"
                aria-invalid={Boolean(errors.clientPhone)}
                className="min-h-12 w-full rounded-ui-md border border-border bg-surface px-3 text-base"
                {...phoneField}
                onBlur={(event) => {
                  void phoneField.onBlur(event)
                  void lookupClientByPhone()
                }}
              />
              {errors.clientPhone ? (
                <p className="mt-1 text-sm text-status-danger-text">{errors.clientPhone.message}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="walkin-client-name" className="mb-1 block text-sm font-medium">
                Client name
              </label>
              <input
                id="walkin-client-name"
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
                    aria-pressed={selectedServiceId === service.id}
                    onClick={() => setValue('serviceId', service.id, { shouldValidate: true })}
                    className={`min-h-16 rounded-ui-md border p-3 text-left ${
                      selectedServiceId === service.id
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
              <legend className="mb-2 text-sm font-medium">Barber and next free time</legend>
              <div className="space-y-2">
                {activeBarbers.map((barber) => (
                  <button
                    key={barber.id}
                    type="button"
                    aria-pressed={selectedBarberId === barber.id}
                    onClick={() => setValue('barberId', barber.id, { shouldValidate: true })}
                    className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-ui-md border px-3 text-left ${
                      selectedBarberId === barber.id
                        ? 'border-brand-500 bg-brand-100 text-brand-text'
                        : 'border-border bg-surface'
                    }`}
                  >
                    <span className="truncate text-sm font-semibold">{barber.full_name}</span>
                    <span className="shrink-0 text-xs tabular-nums text-text-muted">
                      Next free {getNextFreeTime(barber.id)}
                    </span>
                  </button>
                ))}
              </div>
              {errors.barberId ? (
                <p className="mt-1 text-sm text-status-danger-text">{errors.barberId.message}</p>
              ) : null}
            </fieldset>
          </div>
          <div className="sticky bottom-0 border-t border-border bg-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
            <button
              type="submit"
              disabled={isLoading}
              className="min-h-14 w-full rounded-ui-md bg-brand-500 px-4 text-base font-semibold text-on-brand disabled:opacity-60"
            >
              {isLoading ? 'Saving…' : 'Add to queue'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
