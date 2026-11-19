import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getHarareGreeting } from '@/lib/dates'
import { useAuth } from '@/features/auth/useAuth'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { BarberLiveCard } from '@/features/admin/BarberLiveCard'
import { useBarbers } from '@/features/barbers/useBarbers'
import { toHarareDateString } from '@/lib/dates'
import { supabase } from '@/lib/supabase'
import type { TodayQueueRow } from '@/lib/database.types'
import { calculateDashboardMetrics } from './dashboardMetrics'

const METRIC_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 2,
})

const metricLabels = [
  { key: 'queue', label: 'Queue' },
  { key: 'inChair', label: 'In chair' },
  { key: 'done', label: 'Done' },
  { key: 'revenue', label: 'Revenue' },
] as const

function MetricSkeleton() {
  return (
    <div
      aria-label="Loading today’s metrics"
      className="h-[72px] animate-pulse rounded-ui-md bg-surface"
    />
  )
}

function BarberSkeleton() {
  return (
    <div
      aria-label="Loading barber queue"
      className="h-36 animate-pulse rounded-ui-lg bg-surface"
    />
  )
}

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const today = toHarareDateString()
  const [now, setNow] = useState(() => Date.now())

  const {
    data: bookings = [],
    isLoading: isLoadingBookings,
    error: bookingsError,
    refetch: refetchBookings,
  } = useQuery({
    queryKey: ['admin-dashboard-today-queue', today],
    queryFn: async (): Promise<TodayQueueRow[]> => {
      const { data, error } = await supabase
        .from('today_queue')
        .select('*')
        .order('queue_bucket', { ascending: true })
        .order('in_service_first', { ascending: true })
        .order('start_time', { ascending: true })

      if (error) throw error
      return data ?? []
    },
    refetchInterval: 30_000,
  })

  const {
    data: barbers,
    isLoading: isLoadingBarbers,
    error: barberError,
    refetch: refetchBarbers,
  } = useBarbers()

  useEffect(() => {
    const channel = supabase
      .channel('admin-home-today-queue')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        void queryClient.invalidateQueries({ queryKey: ['admin-dashboard-today-queue'] })
      })
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [queryClient])

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(intervalId)
  }, [])

  const activeBarbers = (barbers ?? []).filter((barber) => barber.is_active)
  const metrics = calculateDashboardMetrics(bookings)
  const isLoading = isLoadingBookings || isLoadingBarbers
  const error = bookingsError ?? barberError
  const adminName = user?.profile?.full_name?.trim().split(/\s+/)[0] || 'Shop Admin'

  return (
    <div className="space-y-4 sm:space-y-5">
      <section
        aria-label="Welcome"
        className="relative overflow-hidden rounded-ui-xl bg-[radial-gradient(120%_140%_at_100%_0%,rgba(255,138,0,0.55),transparent_55%),linear-gradient(160deg,#2a2a2d,#161618)] px-5 py-5 text-white shadow-ui-sm sm:p-6 lg:hidden"
      >
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-brand-300">
          Infinity Barbers
        </p>
        <h1 className="mt-1 text-[24px] font-bold leading-tight tracking-tight sm:text-3xl">
          {getHarareGreeting()},<br />
          {adminName}
        </h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex min-h-8 items-center gap-2 rounded-full bg-white/10 px-3 text-xs font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
            Today&apos;s queue
          </span>
          <span className="inline-flex min-h-8 items-center rounded-full bg-white/10 px-3 text-xs font-medium">
            {activeBarbers.length} {activeBarbers.length === 1 ? 'barber' : 'barbers'} active
          </span>
        </div>
      </section>

      {error ? (
        <ErrorMessage
          message={error instanceof Error ? error.message : 'Failed to load today’s queue'}
          onRetry={() => {
            if (bookingsError) void refetchBookings()
            if (barberError) void refetchBarbers()
          }}
        />
      ) : null}

      <section
        aria-label="Today’s summary"
        className="grid grid-cols-4 gap-2"
        aria-busy={isLoading}
      >
        {isLoading
          ? metricLabels.map(({ key }) => <MetricSkeleton key={key} />)
          : metricLabels.map(({ key, label }) => (
              <Card
                key={key}
                className="flex h-[72px] min-w-0 flex-col justify-center px-2.5 py-2 shadow-none"
              >
                <span className="truncate text-[11px] leading-4 text-text-muted">{label}</span>
                <span className="mt-1 truncate text-base font-semibold tabular-nums leading-5">
                  {key === 'revenue' ? METRIC_FORMATTER.format(metrics.revenue) : metrics[key]}
                </span>
              </Card>
            ))}
      </section>

      <section
        aria-labelledby="admin-barbers-heading"
        aria-live="polite"
        aria-relevant="additions text"
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 id="admin-barbers-heading" className="text-lg font-semibold">
            Barbers
          </h2>
          <span className="text-xs text-text-muted">{activeBarbers.length} active</span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <BarberSkeleton />
            <BarberSkeleton />
          </div>
        ) : activeBarbers.length === 0 ? (
          <EmptyState
            title="No active barbers"
            description="Activate a barber account to see their live queue here."
          />
        ) : (
          <div className="space-y-3">
            {activeBarbers.map((barber) => (
              <BarberLiveCard key={barber.id} barber={barber} bookings={bookings} now={now} />
            ))}
          </div>
        )}

        {!isLoading && bookings.length === 0 && activeBarbers.length > 0 ? (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-ui-md border border-dashed border-border bg-surface px-3 py-3">
            <p className="text-sm text-text-muted">
              No one is booked yet. Start today’s queue with a walk-in.
            </p>
            <Link
              to="/admin/walk-ins"
              className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-ui-md bg-brand-500 px-3 text-sm font-semibold text-on-brand hover:bg-brand-600"
            >
              Add walk-in
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  )
}
