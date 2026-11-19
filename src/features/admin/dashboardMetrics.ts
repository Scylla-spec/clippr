import type { TodayQueueRow } from '@/lib/database.types'

export interface DashboardMetrics {
  queue: number
  inChair: number
  done: number
  revenue: number
}

export function calculateDashboardMetrics(bookings: TodayQueueRow[]): DashboardMetrics {
  const queue = bookings.filter(
    (booking) => booking.status === 'booked' || booking.status === 'waiting',
  )
  const completed = bookings.filter((booking) => booking.status === 'done')

  return {
    queue: queue.length,
    inChair: bookings.filter((booking) => booking.status === 'in_service').length,
    done: completed.length,
    revenue: completed.reduce((total, booking) => total + Number(booking.price), 0),
  }
}
