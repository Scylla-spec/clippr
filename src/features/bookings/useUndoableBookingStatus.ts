import { useCallback, useEffect, useRef, useState } from 'react'
import type { BookingStatus } from '@/lib/database.types'
import type { BookingWithDetails } from './useBookings'
import { useUpdateBookingStatus } from './useBookings'

export const BOOKING_STATUS_UNDO_MS = 5_000

interface PendingStatusChange {
  booking: BookingWithDetails
  status: Extract<BookingStatus, 'done' | 'no_show' | 'cancelled'>
}

export function useUndoableBookingStatus() {
  const { mutate } = useUpdateBookingStatus()
  const [pending, setPending] = useState<PendingStatusChange | null>(null)
  const pendingRef = useRef<PendingStatusChange | null>(null)
  const timerRef = useRef<number | null>(null)

  const commitPending = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = null
    const change = pendingRef.current
    pendingRef.current = null
    setPending(null)
    if (change) {
      mutate({
        id: change.booking.id,
        currentStatus: change.booking.status,
        newStatus: change.status,
      })
    }
  }, [mutate])

  const schedule = useCallback(
    (booking: BookingWithDetails, status: PendingStatusChange['status']) => {
      if (pendingRef.current) commitPending()
      const change = { booking, status }
      pendingRef.current = change
      setPending(change)
      timerRef.current = window.setTimeout(commitPending, BOOKING_STATUS_UNDO_MS)
    },
    [commitPending],
  )

  const undo = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = null
    pendingRef.current = null
    setPending(null)
  }, [])

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
      const change = pendingRef.current
      pendingRef.current = null
      if (change) {
        mutate({
          id: change.booking.id,
          currentStatus: change.booking.status,
          newStatus: change.status,
        })
      }
    },
    [mutate],
  )

  return { pending, schedule, undo }
}
