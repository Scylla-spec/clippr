import { useEffect, useState } from 'react'
import { addDays, format, subDays } from 'date-fns'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Armchair,
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Footprints,
  MessageCircle,
  Phone,
  Scissors,
  X,
} from 'lucide-react'
import {
  useDayBookings,
  useCreateBooking,
  useCreateWalkIn,
  useUpdateBookingStatus,
  type BookingWithDetails,
} from './useBookings'
import { useUndoableBookingStatus } from './useUndoableBookingStatus'
import { useBarbers } from '@/features/barbers/useBarbers'
import { toHarareDateString, formatTimeInHarare } from '@/lib/dates'
import { canTransition } from './queue'
import { normalizePhone } from '@/lib/phone'
import { Card, CardBody } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { CreateBookingModal } from './CreateBookingModal'
import { AddWalkInModal } from './AddWalkInModal'

type BookingSourceFilter = 'all' | 'appointment' | 'walk_in'
type BookingStatusAction = 'done' | 'no_show' | 'cancelled'

interface DayViewScheduleProps {
  source?: 'appointment' | 'walk_in'
}

function localDate(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function getDateString(date: Date) {
  return format(date, 'yyyy-MM-dd')
}

function BookingDetailSheet({
  booking,
  onClose,
  onStart,
  onDelayStatus,
  isUpdating,
}: {
  booking: BookingWithDetails
  onClose: () => void
  onStart: () => void
  onDelayStatus: (status: BookingStatusAction) => void
  isUpdating: boolean
}) {
  const isTerminal = ['done', 'no_show', 'cancelled'].includes(booking.status)
  const phoneDigits = normalizePhone(booking.client.phone).replace(/\D/g, '')
  const whatsAppHref = `https://wa.me/${phoneDigits}`

  return (
    <div
      className="fixed inset-0 z-70 flex items-end bg-black/50"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-detail-title"
        className="max-h-[90dvh] w-full overflow-y-auto rounded-t-ui-xl bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-ui-lg motion-safe:animate-[sheet-up_180ms_ease-out]"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" aria-hidden="true" />
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="booking-detail-title" className="truncate text-xl font-semibold">
              {booking.client.full_name}
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              {formatTimeInHarare(booking.start_time)}–{formatTimeInHarare(booking.end_time)}
              {' · '}
              {booking.source === 'walk_in' ? 'Walk-in' : 'Appointment'}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close booking details"
            onClick={onClose}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-page"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StatusBadge status={booking.status} />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-page px-3 py-1 text-sm">
            <Scissors className="h-4 w-4 text-brand-text" aria-hidden="true" />
            {booking.service.name} · {booking.service.duration_min} min
          </span>
        </div>
        <div className="mt-4 rounded-ui-md bg-page p-3">
          <p className="inline-flex items-center gap-2 text-sm font-medium">
            <Armchair className="h-4 w-4 text-brand-text" aria-hidden="true" />
            {booking.barber.full_name}
          </p>
          <p className="mt-2 inline-flex items-center gap-2 text-sm text-text-muted">
            <Clock3 className="h-4 w-4" aria-hidden="true" />
            {booking.client.phone}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <a
            href={`tel:${booking.client.phone}`}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-ui-md border border-border font-medium hover:bg-page"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            Call
          </a>
          <a
            href={whatsAppHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-ui-md border border-border font-medium hover:bg-page"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            WhatsApp
          </a>
        </div>

        {!isTerminal ? (
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4">
            {canTransition(booking.status, 'in_service') && (
              <button
                type="button"
                disabled={isUpdating}
                onClick={onStart}
                className="col-span-2 min-h-12 rounded-ui-md bg-brand-500 px-4 font-semibold text-on-brand hover:bg-brand-600 disabled:opacity-60"
              >
                Start
              </button>
            )}
            {canTransition(booking.status, 'done') && (
              <button
                type="button"
                onClick={() => onDelayStatus('done')}
                className="min-h-12 rounded-ui-md bg-brand-500 px-3 font-semibold text-on-brand hover:bg-brand-600"
              >
                Complete
              </button>
            )}
            {canTransition(booking.status, 'no_show') && (
              <button
                type="button"
                onClick={() => onDelayStatus('no_show')}
                className="min-h-12 rounded-ui-md border border-border px-3 font-medium hover:bg-page"
              >
                No-show
              </button>
            )}
            {canTransition(booking.status, 'cancelled') && (
              <button
                type="button"
                onClick={() => onDelayStatus('cancelled')}
                className="border-status-danger-text/30 col-span-2 min-h-12 rounded-ui-md border px-3 font-medium text-status-danger-text hover:bg-status-danger-bg"
              >
                Cancel booking
              </button>
            )}
          </div>
        ) : null}
      </section>
    </div>
  )
}

export function DayViewSchedule({ source }: DayViewScheduleProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState(toHarareDateString())
  const [selectedBarberId, setSelectedBarberId] = useState('')
  const [selectedSource, setSelectedSource] = useState<BookingSourceFilter>('all')
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false)

  const bookingSource = source ?? (selectedSource === 'all' ? undefined : selectedSource)
  const { data: barbers } = useBarbers()
  const {
    data: bookings,
    isLoading,
    error,
    refetch,
  } = useDayBookings(selectedDate, selectedBarberId || undefined, bookingSource)
  const createBooking = useCreateBooking()
  const createWalkIn = useCreateWalkIn()
  const updateStatus = useUpdateBookingStatus()
  const undoableStatus = useUndoableBookingStatus()
  const today = toHarareDateString()
  const selectedDay = localDate(selectedDate)
  const dates = Array.from({ length: 7 }, (_, index) => addDays(selectedDay, index - 3))

  const showAppointments = source !== 'walk_in' && selectedSource !== 'walk_in'
  const showWalkIns = source !== 'appointment' && selectedSource !== 'appointment'

  useEffect(() => {
    const routeState = location.state as { openBookingForm?: string } | null
    const requestedForm = routeState?.openBookingForm
    if (requestedForm === 'appointment' && showAppointments) setIsBookingModalOpen(true)
    if (requestedForm === 'walk_in' && showWalkIns) setIsWalkInModalOpen(true)
    if (requestedForm === 'appointment' || requestedForm === 'walk_in') {
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.pathname, location.state, navigate, showAppointments, showWalkIns])

  const changeBookingStatus = (
    booking: BookingWithDetails,
    status: 'in_service' | BookingStatusAction,
  ) => {
    if (status === 'in_service') {
      updateStatus.mutate({ id: booking.id, currentStatus: booking.status, newStatus: status })
    } else {
      undoableStatus.schedule(booking, status)
    }
    setSelectedBooking(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label="Previous day"
          onClick={() => setSelectedDate(getDateString(subDays(selectedDay, 1)))}
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-ui-md border border-border bg-surface hover:bg-page"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <p className="min-w-0 flex-1 text-center text-sm font-semibold">
          {format(selectedDay, 'EEEE, d MMMM yyyy')}
        </p>
        <button
          type="button"
          aria-label="Next day"
          onClick={() => setSelectedDate(getDateString(addDays(selectedDay, 1)))}
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-ui-md border border-border bg-surface hover:bg-page"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div
        role="group"
        aria-label="Select booking day"
        className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
      >
        {dates.map((date) => {
          const dateString = getDateString(date)
          const isSelected = dateString === selectedDate
          return (
            <button
              key={dateString}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelectedDate(dateString)}
              className={`flex min-h-14 min-w-14 snap-start flex-col items-center justify-center rounded-ui-md border px-2 ${
                isSelected
                  ? 'border-brand-500 bg-brand-500 text-on-brand'
                  : 'border-border bg-surface text-text hover:bg-page'
              }`}
            >
              <span className="text-[11px] font-medium">
                {dateString === today ? 'Today' : format(date, 'EEE')}
              </span>
              <span className="text-base font-semibold tabular-nums">{format(date, 'd')}</span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {source === undefined ? (
          <div role="group" aria-label="Filter bookings by type" className="flex gap-2">
            {(
              [
                ['all', 'All'],
                ['appointment', 'Appointments'],
                ['walk_in', 'Walk-ins'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={selectedSource === value}
                onClick={() => setSelectedSource(value)}
                className={`min-h-12 rounded-full border px-3 text-sm font-medium ${
                  selectedSource === value
                    ? 'border-sidebar bg-sidebar text-white'
                    : 'border-border bg-surface text-text hover:bg-page'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
        <label className="sr-only" htmlFor="filter-barber">
          Filter by barber
        </label>
        <select
          id="filter-barber"
          value={selectedBarberId}
          onChange={(event) => setSelectedBarberId(event.target.value)}
          className="min-h-12 min-w-0 flex-1 rounded-ui-md border border-border bg-surface px-3 text-base text-text sm:flex-none"
        >
          <option value="">All barbers</option>
          {(barbers ?? [])
            .filter((barber) => barber.is_active)
            .map((barber) => (
              <option key={barber.id} value={barber.id}>
                {barber.full_name}
              </option>
            ))}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3" aria-label="Loading bookings">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-28 animate-pulse rounded-ui-lg bg-surface" />
          ))}
        </div>
      ) : error ? (
        <ErrorMessage
          message={error instanceof Error ? error.message : 'Failed to load bookings'}
          onRetry={() => void refetch()}
        />
      ) : !bookings?.length ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<CalendarDays className="h-10 w-10 text-text-muted" aria-hidden="true" />}
              title="No bookings on this day"
              description="Appointments and walk-ins will appear here when added."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  {showWalkIns && (
                    <button
                      type="button"
                      onClick={() => setIsWalkInModalOpen(true)}
                      className="inline-flex min-h-12 items-center gap-2 rounded-ui-md border border-border px-3 font-medium"
                    >
                      <Footprints className="h-4 w-4" aria-hidden="true" />
                      Add walk-in
                    </button>
                  )}
                  {showAppointments && (
                    <button
                      type="button"
                      onClick={() => setIsBookingModalOpen(true)}
                      className="inline-flex min-h-12 items-center gap-2 rounded-ui-md bg-brand-500 px-3 font-semibold text-on-brand"
                    >
                      <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                      New appointment
                    </button>
                  )}
                </div>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {(bookings ?? []).map((booking) => (
            <Card key={booking.id}>
              <CardBody className="p-0">
                <button
                  type="button"
                  onClick={() => setSelectedBooking(booking)}
                  aria-label={`View ${booking.client.full_name}, ${formatTimeInHarare(booking.start_time)}, ${booking.service.name}`}
                  className="hover:bg-page/60 flex min-h-24 w-full items-center gap-3 rounded-ui-lg p-3 text-left"
                >
                  <span className="flex min-w-[4.25rem] shrink-0 flex-col items-center justify-center rounded-ui-md bg-brand-100 px-2 py-2 text-center text-brand-text">
                    <span className="text-sm font-bold tabular-nums">
                      {formatTimeInHarare(booking.start_time)}
                    </span>
                    <span className="mt-0.5 text-[11px] tabular-nums">
                      {formatTimeInHarare(booking.end_time)}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold">
                        {booking.client.full_name}
                      </span>
                      <span className="shrink-0 rounded-full bg-page px-2 py-0.5 text-[11px] text-text-muted">
                        {booking.source === 'walk_in' ? 'Walk-in' : 'Appointment'}
                      </span>
                    </span>
                    <span className="mt-1 block truncate text-sm text-text-muted">
                      {booking.service.name} · {booking.barber.full_name}
                    </span>
                    <span className="mt-2 block">
                      <StatusBadge status={booking.status} />
                    </span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-text-muted" aria-hidden="true" />
                </button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {showAppointments && (
        <CreateBookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          initialBarberId={selectedBarberId || undefined}
          initialDate={selectedDate}
          onSubmit={async (data) => {
            await createBooking.mutateAsync(data)
            setIsBookingModalOpen(false)
          }}
          isLoading={createBooking.isPending}
        />
      )}
      {showWalkIns && (
        <AddWalkInModal
          isOpen={isWalkInModalOpen}
          onClose={() => setIsWalkInModalOpen(false)}
          initialBarberId={selectedBarberId || undefined}
          onSubmit={async (data) => {
            await createWalkIn.mutateAsync(data)
            setIsWalkInModalOpen(false)
          }}
          isLoading={createWalkIn.isPending}
        />
      )}

      {selectedBooking && (
        <BookingDetailSheet
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onStart={() => changeBookingStatus(selectedBooking, 'in_service')}
          onDelayStatus={(status) => changeBookingStatus(selectedBooking, status)}
          isUpdating={updateStatus.isPending}
        />
      )}

      {undoableStatus.pending && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-[calc(56px+env(safe-area-inset-bottom)+12px)] left-3 right-3 z-50 mx-auto flex max-w-xl items-center justify-between gap-3 rounded-ui-md bg-sidebar px-4 py-3 text-white shadow-ui-lg lg:bottom-4"
        >
          <span className="min-w-0 truncate text-sm">
            {undoableStatus.pending.booking.client.full_name} marked{' '}
            {undoableStatus.pending.status.replace('_', ' ')}
          </span>
          <button
            type="button"
            onClick={undoableStatus.undo}
            className="min-h-12 shrink-0 rounded-ui-sm px-3 font-semibold text-brand-300 hover:bg-sidebar-hover"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  )
}
