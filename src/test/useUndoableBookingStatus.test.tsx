import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { BookingWithDetails } from '@/features/bookings/useBookings'
import { useUndoableBookingStatus } from '@/features/bookings/useUndoableBookingStatus'

const { mutate } = vi.hoisted(() => ({ mutate: vi.fn() }))
vi.mock('@/features/bookings/useBookings', () => ({
  useUpdateBookingStatus: () => ({ mutate }),
}))

const booking: BookingWithDetails = {
  id: 'booking-1',
  client_id: 'client-1',
  barber_id: 'barber-1',
  service_id: 'service-1',
  start_time: '2026-11-19T08:00:00.000Z',
  end_time: '2026-11-19T08:30:00.000Z',
  status: 'waiting',
  source: 'walk_in',
  created_by: 'admin-1',
  created_at: '2026-11-19T07:00:00.000Z',
  updated_at: '2026-11-19T07:00:00.000Z',
  client: { id: 'client-1', full_name: 'Blessing Dube', phone: '+263772000001' },
  service: { id: 'service-1', name: 'Haircut', duration_min: 30, price: 5 },
  barber: { id: 'barber-1', full_name: 'Tendai Moyo' },
}

describe('useUndoableBookingStatus', () => {
  afterEach(() => {
    vi.useRealTimers()
    mutate.mockClear()
  })

  it('delays an irreversible status change for five seconds and lets the user undo it', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useUndoableBookingStatus())

    act(() => result.current.schedule(booking, 'cancelled'))
    expect(result.current.pending?.status).toBe('cancelled')

    act(() => vi.advanceTimersByTime(4_999))
    expect(mutate).not.toHaveBeenCalled()

    act(() => result.current.undo())
    act(() => vi.advanceTimersByTime(1))

    expect(result.current.pending).toBeNull()
    expect(mutate).not.toHaveBeenCalled()
  })

  it('commits the status change after the undo window expires', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useUndoableBookingStatus())

    act(() => result.current.schedule(booking, 'done'))
    act(() => vi.advanceTimersByTime(5_000))

    expect(mutate).toHaveBeenCalledWith({
      id: 'booking-1',
      currentStatus: 'waiting',
      newStatus: 'done',
    })
    expect(result.current.pending).toBeNull()
  })
})
