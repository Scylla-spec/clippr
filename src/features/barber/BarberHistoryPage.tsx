import { useQuery } from '@tanstack/react-query'
import { History } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { StatusBadge } from '@/components/ui/Badge'
import { useAuth } from '@/features/auth/useAuth'
import { supabase } from '@/lib/supabase'
import { formatDateInHarare, formatTimeInHarare } from '@/lib/dates'
import type { BookingStatus } from '@/lib/database.types'

interface HistoryBooking {
  id: string
  start_time: string
  status: BookingStatus
  source: 'appointment' | 'walk_in'
  service: { name: string } | null
}

export function BarberHistoryPage() {
  const { user } = useAuth()
  const { data: bookings, isLoading, error, refetch } = useQuery({
    queryKey: ['barber-history', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<HistoryBooking[]> => {
      if (!user) throw new Error('You must be signed in to view your history')
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id, start_time, status, source,
          service:services (name)
        `)
        .eq('barber_id', user.id)
        .in('status', ['done', 'no_show', 'cancelled'])
        .order('start_time', { ascending: false })
        .limit(100)

      if (error) throw error
      return (data ?? []) as unknown as HistoryBooking[]
    },
  })

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">My History</h1>
        <p className="mt-1 text-sm text-text-muted">Your latest completed and closed bookings.</p>
      </header>
      {isLoading ? (
        <p className="py-8 text-center text-sm text-text-muted">Loading history…</p>
      ) : error ? (
        <ErrorMessage
          message={error instanceof Error ? error.message : 'Failed to load booking history'}
          onRetry={() => void refetch()}
        />
      ) : !bookings?.length ? (
        <EmptyState
          icon={<History className="h-10 w-10" aria-hidden="true" />}
          title="No completed bookings yet"
          description="Completed, no-show, and cancelled bookings will appear here."
        />
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-text">
                    {booking.service?.name ?? 'Service no longer available'}
                  </p>
                  <p className="mt-1 text-sm text-text-muted">
                    {booking.source === 'walk_in' ? 'Walk-in' : 'Appointment'}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    {formatDateInHarare(booking.start_time)} at {formatTimeInHarare(booking.start_time)}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                  <StatusBadge status={booking.status} />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
