/**
 * queue.ts — Pure queue-ordering logic and single source of truth for display order.
 *
 * This module is intentionally framework-free and has no Supabase imports.
 * It operates on the TodayQueueRow shape returned by the today_queue view.
 *
 * Although today_queue is queried with explicit .order() clauses in the data layer,
 * SQL view ordering alone is not guaranteed across all drivers and operations.
 * Therefore, queue.ts is the definitive, single place that decides the final display
 * order (nowServing, upNext, remaining, completed) so that the admin day view and the
 * barber dashboard can never disagree on queue structure or presentation.
 */

import type { TodayQueueRow, BookingStatus } from '@/lib/database.types'

/** Statuses that represent an active position in the queue. */
export const ACTIVE_STATUSES: BookingStatus[] = ['booked', 'waiting', 'in_service']

/** Statuses that represent a completed/terminal outcome. */
export const TERMINAL_STATUSES: BookingStatus[] = ['done', 'no_show', 'cancelled']

export interface QueueView {
  /** The booking currently being served (status = in_service), or null. */
  nowServing: TodayQueueRow | null
  /** The next booking to be served (earliest active, not in_service). */
  upNext: TodayQueueRow | null
  /** Remaining active bookings after upNext, in order. */
  remaining: TodayQueueRow[]
  /** Completed / cancelled / no-show bookings, in chronological order. */
  completed: TodayQueueRow[]
}

/**
 * buildQueueView
 *
 * Takes an array of TodayQueueRow (already filtered to one barber's day)
 * and returns a structured QueueView.
 *
 * The sort order mirrors the today_queue SQL view:
 *   1. in_service first
 *   2. booked/waiting by start_time ASC
 *   3. terminal by start_time ASC (collapsed "Completed" section)
 *
 * @param rows — Raw rows from the today_queue view.
 */
export function buildQueueView(rows: TodayQueueRow[]): QueueView {
  const active = rows
    .filter((r) => (ACTIVE_STATUSES as string[]).includes(r.status))
    .sort((a, b) => {
      // in_service always first
      if (a.status === 'in_service' && b.status !== 'in_service') return -1
      if (b.status === 'in_service' && a.status !== 'in_service') return 1
      // then by start_time
      return new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    })

  const completed = rows
    .filter((r) => (TERMINAL_STATUSES as string[]).includes(r.status))
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

  const nowServing = active.find((r) => r.status === 'in_service') ?? null

  const waitingAndBooked = active.filter((r) => r.status !== 'in_service')
  const upNext = waitingAndBooked[0] ?? null
  const remaining = waitingAndBooked.slice(1)

  return { nowServing, upNext, remaining, completed }
}

/**
 * getNextAvailableSlot
 *
 * Given the current active bookings for a barber and a desired start time,
 * returns the earliest slot at or after `fromTime` that does not overlap
 * any existing booking.
 *
 * Used when adding a walk-in to find a fair insertion point.
 *
 * @param activeBookings — Bookings with status not in ('cancelled', 'no_show')
 * @param durationMin    — Duration of the new service in minutes
 * @param fromTime       — Earliest acceptable start time (usually now())
 */
export function getNextAvailableSlot(
  activeBookings: Array<{ start_time: string; end_time: string }>,
  durationMin: number,
  fromTime: Date,
): Date {
  const sorted = [...activeBookings].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
  )

  let candidate = new Date(fromTime)

  for (const booking of sorted) {
    const bookingStart = new Date(booking.start_time)
    const bookingEnd = new Date(booking.end_time)
    const candidateEnd = new Date(candidate.getTime() + durationMin * 60_000)

    // If candidate slot overlaps this booking, push candidate to after this booking
    const overlaps = candidate < bookingEnd && candidateEnd > bookingStart
    if (overlaps) {
      candidate = new Date(bookingEnd)
    }
  }

  return candidate
}

/**
 * VALID_TRANSITIONS — the allowed status state machine.
 * Used in both trigger (SQL) and client-side UI to grey out invalid buttons.
 */
export const VALID_TRANSITIONS: Partial<Record<BookingStatus, BookingStatus[]>> = {
  booked:     ['waiting', 'in_service', 'cancelled', 'no_show'],
  waiting:    ['in_service', 'cancelled', 'no_show'],
  in_service: ['done', 'no_show', 'cancelled'],
  // done, no_show, cancelled → no transitions (terminal)
}

/**
 * canTransition — returns true if the status change is allowed.
 */
export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}
