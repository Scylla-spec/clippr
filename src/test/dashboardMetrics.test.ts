import { describe, expect, it } from 'vitest'
import type { TodayQueueRow } from '@/lib/database.types'
import { calculateDashboardMetrics } from '@/features/admin/dashboardMetrics'

function booking(status: TodayQueueRow['status'], price = 5): TodayQueueRow {
  return {
    id: `${status}-${price}`,
    client_id: 'client-id',
    barber_id: 'barber-id',
    service_id: 'service-id',
    start_time: '2026-11-19T08:00:00.000Z',
    end_time: '2026-11-19T08:30:00.000Z',
    status,
    source: 'appointment',
    created_by: 'admin-id',
    created_at: '2026-11-19T07:00:00.000Z',
    updated_at: '2026-11-19T07:00:00.000Z',
    client_name: 'Client Name',
    client_phone: '+263771234567',
    service_name: 'Haircut',
    duration_min: 30,
    price,
    barber_name: 'Barber Name',
    queue_bucket: 0,
    in_service_first: 0,
  }
}

describe('calculateDashboardMetrics', () => {
  it('counts queue, in-chair, done, and revenue from the same booking statuses', () => {
    expect(
      calculateDashboardMetrics([
        booking('booked'),
        booking('waiting'),
        booking('in_service'),
        booking('done', 8),
        booking('done', 3),
        booking('no_show', 10),
        booking('cancelled', 20),
      ]),
    ).toEqual({ queue: 2, inChair: 1, done: 2, revenue: 11 })
  })

  it('does not contradict when there are no active bookings but completed work', () => {
    expect(calculateDashboardMetrics([booking('done', 2)])).toEqual({
      queue: 0,
      inChair: 0,
      done: 1,
      revenue: 2,
    })
  })

  it('returns zero metrics for an empty queue', () => {
    expect(calculateDashboardMetrics([])).toEqual({ queue: 0, inChair: 0, done: 0, revenue: 0 })
  })
})
