import { useState } from 'react'
import { format, addDays, subDays } from 'date-fns'
import {
  useDayBookings,
  useCreateBooking,
  useCreateWalkIn,
  useUpdateBookingStatus,
  useCancelBooking,
  type BookingWithDetails,
} from './useBookings'
import { useBarbers } from '@/features/barbers/useBarbers'
import { toHarareDateString, formatTimeInHarare } from '@/lib/dates'
import { canTransition } from './queue'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { CreateBookingModal } from './CreateBookingModal'
import { AddWalkInModal } from './AddWalkInModal'

export function DayViewSchedule() {
  const [selectedDate, setSelectedDate] = useState<string>(toHarareDateString())
  const [selectedBarberId, setSelectedBarberId] = useState<string>('')

  // Modals state
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false)
  const [bookingToCancel, setBookingToCancel] = useState<BookingWithDetails | null>(null)

  const { data: barbers } = useBarbers()
  const { data: bookings, isLoading, error, refetch } = useDayBookings(
    selectedDate,
    selectedBarberId || undefined,
  )

  const createBooking = useCreateBooking()
  const createWalkIn = useCreateWalkIn()
  const updateStatus = useUpdateBookingStatus()
  const cancelBooking = useCancelBooking()

  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number)
    if (y && m && d) {
      const prev = subDays(new Date(y, m - 1, d), 1)
      setSelectedDate(format(prev, 'yyyy-MM-dd'))
    }
  }

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number)
    if (y && m && d) {
      const next = addDays(new Date(y, m - 1, d), 1)
      setSelectedDate(format(next, 'yyyy-MM-dd'))
    }
  }

  const handleToday = () => {
    setSelectedDate(toHarareDateString())
  }

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-surface-900 dark:text-white">Day Schedule</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Appointments and walk-in queue timeline across barbers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsWalkInModalOpen(true)}
            className="text-xs font-semibold"
          >
            ⚡ Add Walk-in
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsBookingModalOpen(true)}
            className="text-xs font-semibold"
          >
            + New Appointment
          </Button>
        </div>
      </div>

      {/* Filter / Date Toolbar */}
      <Card className="bg-slate-50/50 dark:bg-surface-800/40">
        <CardBody className="p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Date Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevDay}
              aria-label="Previous day"
              className="rounded-lg border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-100 dark:border-surface-600 dark:bg-surface-700 dark:text-slate-200"
            >
              ←
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 dark:border-surface-600 dark:bg-surface-700 dark:text-white"
            />

            <button
              type="button"
              onClick={handleNextDay}
              aria-label="Next day"
              className="rounded-lg border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-100 dark:border-surface-600 dark:bg-surface-700 dark:text-slate-200"
            >
              →
            </button>

            <button
              type="button"
              onClick={handleToday}
              className="ml-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              Today
            </button>
          </div>

          {/* Barber Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="filter-barber" className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Barber:
            </label>
            <select
              id="filter-barber"
              value={selectedBarberId}
              onChange={(e) => setSelectedBarberId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 dark:border-surface-600 dark:bg-surface-700 dark:text-white"
            >
              <option value="">All Barbers</option>
              {barbers?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.full_name} {!b.is_active ? '(Inactive)' : ''}
                </option>
              ))}
            </select>
          </div>
        </CardBody>
      </Card>

      {/* Bookings List */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : error ? (
        <ErrorMessage
          message={error instanceof Error ? error.message : 'Failed to load bookings'}
          onRetry={() => void refetch()}
        />
      ) : !bookings || bookings.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon="📅"
              title="No bookings on this day"
              description="No appointments or walk-in clients scheduled for the selected date."
              action={
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setIsWalkInModalOpen(true)}>
                    ⚡ Add Walk-in
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => setIsBookingModalOpen(true)}>
                    Book Appointment
                  </Button>
                </div>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const isTerminal = ['done', 'no_show', 'cancelled'].includes(booking.status)

            return (
              <Card
                key={booking.id}
                className={`transition-shadow hover:shadow ${
                  isTerminal ? 'opacity-60 bg-slate-50/70 dark:bg-surface-800/40' : ''
                }`}
              >
                <CardBody className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Time & Client */}
                  <div className="flex items-start gap-4">
                    {/* Time pill */}
                    <div className="flex flex-col items-center justify-center rounded-xl bg-brand-500/10 px-3 py-2 text-center min-w-[75px] dark:bg-brand-500/20">
                      <span className="text-sm font-bold text-surface-900 dark:text-white">
                        {formatTimeInHarare(booking.start_time)}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        to {formatTimeInHarare(booking.end_time)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-surface-900 dark:text-white">
                          {booking.client.full_name}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                            booking.source === 'walk_in'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                          }`}
                        >
                          {booking.source === 'walk_in' ? 'Walk-in' : 'Appt'}
                        </span>
                        <StatusBadge status={booking.status} />
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <span>📞 {booking.client.phone}</span>
                        <span>•</span>
                        <span>💈 {booking.service.name} ({booking.service.duration_min}m)</span>
                        <span>•</span>
                        <span>✂️ {booking.barber.full_name}</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          ${Number(booking.service.price).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Status actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-surface-700">
                    {!isTerminal && (
                      <>
                        {canTransition(booking.status, 'in_service') && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="text-xs py-1"
                            isLoading={updateStatus.isPending}
                            onClick={() =>
                              void updateStatus.mutateAsync({
                                id: booking.id,
                                currentStatus: booking.status,
                                newStatus: 'in_service',
                              })
                            }
                          >
                            Start Service
                          </Button>
                        )}

                        {canTransition(booking.status, 'done') && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="text-xs py-1 bg-green-600 hover:bg-green-700"
                            isLoading={updateStatus.isPending}
                            onClick={() =>
                              void updateStatus.mutateAsync({
                                id: booking.id,
                                currentStatus: booking.status,
                                newStatus: 'done',
                              })
                            }
                          >
                            Done
                          </Button>
                        )}

                        {canTransition(booking.status, 'no_show') && (
                          <button
                            type="button"
                            onClick={() =>
                              void updateStatus.mutateAsync({
                                id: booking.id,
                                currentStatus: booking.status,
                                newStatus: 'no_show',
                              })
                            }
                            className="text-xs font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400 px-2 py-1"
                          >
                            No-show
                          </button>
                        )}

                        {canTransition(booking.status, 'cancelled') && (
                          <button
                            type="button"
                            onClick={() => setBookingToCancel(booking)}
                            className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 px-2 py-1"
                          >
                            Cancel
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}

      {/* Appointment Creation Modal */}
      <CreateBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        initialBarberId={selectedBarberId || undefined}
        initialDate={selectedDate}
        onSubmit={async (data) => {
          await createBooking.mutateAsync(data)
        }}
        isLoading={createBooking.isPending}
      />

      {/* Walk-in Modal */}
      <AddWalkInModal
        isOpen={isWalkInModalOpen}
        onClose={() => setIsWalkInModalOpen(false)}
        initialBarberId={selectedBarberId || undefined}
        onSubmit={async (data) => {
          await createWalkIn.mutateAsync(data)
        }}
        isLoading={createWalkIn.isPending}
      />

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(bookingToCancel)}
        title="Cancel Booking"
        description={`Are you sure you want to cancel the booking for ${bookingToCancel?.client.full_name} (${bookingToCancel?.service.name})? This cannot be undone.`}
        confirmLabel="Cancel Booking"
        variant="danger"
        isLoading={cancelBooking.isPending}
        onConfirm={async () => {
          if (bookingToCancel) {
            await cancelBooking.mutateAsync({
              id: bookingToCancel.id,
              status: bookingToCancel.status,
            })
            setBookingToCancel(null)
          }
        }}
        onCancel={() => setBookingToCancel(null)}
      />
    </div>
  )
}
