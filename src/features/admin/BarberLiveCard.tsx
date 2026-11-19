import { useState } from 'react'
import { Armchair, ChevronRight, Circle, Clock3, Coffee } from 'lucide-react'
import { AnimatedInfinity } from '@/components/brand/AnimatedInfinity'
import type { Profile, TodayQueueRow } from '@/lib/database.types'
import { formatTimeInHarare } from '@/lib/dates'
import { cn } from '@/lib/utils'

interface BarberLiveCardProps {
  barber: Profile
  bookings: TodayQueueRow[]
  now: number
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

function BarberQueueSheet({
  barber,
  bookings,
  onClose,
}: {
  barber: Profile
  bookings: TodayQueueRow[]
  onClose: () => void
}) {
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
        aria-labelledby="barber-queue-title"
        className="w-full rounded-t-ui-xl bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-ui-lg motion-safe:animate-[sheet-up_180ms_ease-out]"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" aria-hidden="true" />
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 id="barber-queue-title" className="text-lg font-semibold">
              {barber.full_name}&apos;s queue
            </h2>
            <p className="text-sm text-text-muted">{bookings.length} clients today</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close barber queue"
            className="inline-flex h-12 w-12 items-center justify-center rounded-full text-text-muted hover:bg-page"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        {bookings.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-muted">
            No clients in this barber&apos;s queue.
          </p>
        ) : (
          <ol className="max-h-[55dvh] space-y-2 overflow-y-auto">
            {bookings.map((booking) => (
              <li
                key={booking.id}
                className="flex items-center justify-between gap-3 rounded-ui-md bg-page p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{booking.client_name}</p>
                  <p className="mt-1 truncate text-sm text-text-muted">
                    {formatTimeInHarare(booking.start_time)} · {booking.service_name}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-surface px-2.5 py-1 text-xs font-medium capitalize">
                  {booking.status.replace('_', ' ')}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}

export function BarberLiveCard({ barber, bookings, now }: BarberLiveCardProps) {
  const [isQueueOpen, setIsQueueOpen] = useState(false)
  const barberBookings = bookings
    .filter((booking) => booking.barber_id === barber.id)
    .sort((left, right) => left.start_time.localeCompare(right.start_time))
  const serving = barberBookings.find((booking) => booking.status === 'in_service')
  const queue = barberBookings.filter(
    (booking) => booking.status === 'booked' || booking.status === 'waiting',
  )
  const next = queue[0]
  const statusLabel = serving ? 'In chair' : 'Free'
  const statusClassName = serving
    ? 'bg-status-in-service-bg text-status-in-service-text'
    : 'bg-status-neutral-bg text-status-neutral-text'
  const elapsedMs = serving ? Math.max(0, now - new Date(serving.updated_at).getTime()) : 0
  const durationMs = (serving?.duration_min ?? 0) * 60_000
  const progress = durationMs > 0 ? Math.min(100, (elapsedMs / durationMs) * 100) : 0
  const elapsedMinutes = Math.floor(elapsedMs / 60_000)

  return (
    <>
      <button
        type="button"
        onClick={() => setIsQueueOpen(true)}
        aria-label={`Open ${barber.full_name}'s queue`}
        className="w-full rounded-ui-lg border border-border bg-surface p-3 text-left shadow-ui-sm transition-opacity motion-safe:duration-200 motion-safe:hover:opacity-90"
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sidebar text-sm font-semibold text-white">
            {initials(barber.full_name)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{barber.full_name}</span>
            <span
              className={cn(
                'mt-1 inline-flex min-h-6 items-center gap-1 rounded-full px-2 text-xs font-medium',
                statusClassName,
              )}
            >
              {serving ? (
                <Armchair className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Circle className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {statusLabel}
            </span>
          </span>
          <span className="shrink-0 text-right">
            <span className="block text-lg font-bold tabular-nums">{queue.length}</span>
            <span className="block text-[11px] text-text-muted">in queue</span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-text-muted" aria-hidden="true" />
        </div>

        {serving ? (
          <div className="mt-3 rounded-ui-md bg-page p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-sm font-medium">
                Now: {serving.client_name}
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 text-xs tabular-nums text-text-muted">
                <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                {elapsedMinutes}/{serving.duration_min} min
              </span>
            </div>
            <div
              role="progressbar"
              aria-label={`${serving.client_name} service progress`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
              className="relative mt-2 h-2 overflow-hidden rounded-full bg-border"
            >
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 rounded-full bg-brand-500 motion-safe:transition-[width] motion-safe:duration-500"
                style={{ width: `${progress}%` }}
              />
              <AnimatedInfinity
                size={20}
                animate={false}
                className="absolute -top-1 left-0 h-3 w-5"
              />
            </div>
          </div>
        ) : (
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-text-muted">
            <Coffee className="h-4 w-4" aria-hidden="true" /> Ready for next client
          </p>
        )}

        <p className="mt-2 truncate text-xs text-text-muted">
          {next
            ? `Next: ${next.client_name}, ${formatTimeInHarare(next.start_time)}`
            : 'Next: No one waiting'}
        </p>
      </button>
      {isQueueOpen && (
        <BarberQueueSheet
          barber={barber}
          bookings={barberBookings.filter(
            (booking) =>
              booking.status === 'booked' ||
              booking.status === 'waiting' ||
              booking.status === 'in_service',
          )}
          onClose={() => setIsQueueOpen(false)}
        />
      )}
    </>
  )
}
