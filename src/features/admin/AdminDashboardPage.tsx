import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { addDays, addMonths, format, startOfMonth, subDays, subMonths } from 'date-fns'
import { ArrowRight, CalendarCheck, CircleCheck, DollarSign, Scissors } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Card, CardBody } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { useBarbers } from '@/features/barbers/useBarbers'
import { formatTimeInHarare, getHarareDayBoundsUtc, toHarareDateString } from '@/lib/dates'
import { supabase } from '@/lib/supabase'
import type { BookingStatus, BookingSource } from '@/lib/database.types'

type DashboardPeriod = 'week' | 'month' | 'year'
const DASHBOARD_PAGE_SIZE = 500

interface DashboardBooking {
  id: string
  start_time: string
  status: BookingStatus
  source: BookingSource
  client: { full_name: string }
  service: { name: string; price: number }
  barber: { full_name: string }
}

interface ChartPoint {
  key: string
  label: string
  value: number
}

function getLocalDate(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function getChartPoints(period: DashboardPeriod, today: string, bookings: DashboardBooking[]): ChartPoint[] {
  const todayDate = getLocalDate(today)
  const dates =
    period === 'week'
      ? Array.from({ length: 7 }, (_, index) => format(addDays(subDays(todayDate, 6), index), 'yyyy-MM-dd'))
      : period === 'month'
        ? Array.from({ length: 30 }, (_, index) => format(addDays(subDays(todayDate, 29), index), 'yyyy-MM-dd'))
        : Array.from({ length: 12 }, (_, index) =>
            format(startOfMonth(addMonths(subMonths(todayDate, 11), index)), 'yyyy-MM'),
          )

  const counts = new Map<string, number>()
  for (const booking of bookings) {
    if (booking.status === 'cancelled') continue
    const date = toHarareDateString(new Date(booking.start_time))
    const key = period === 'year' ? date.slice(0, 7) : date
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return dates.map((key) => ({
    key,
    label:
      period === 'week'
        ? format(getLocalDate(key), 'EEE')
        : period === 'month'
          ? format(getLocalDate(key), 'd')
          : format(new Date(`${key}-01T00:00:00`), 'MMM'),
    value: counts.get(key) ?? 0,
  }))
}

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>('week')
  const queryClient = useQueryClient()
  const today = toHarareDateString()
  const todayDate = getLocalDate(today)
  const rangeStart =
    period === 'year'
      ? format(startOfMonth(subMonths(todayDate, 11)), 'yyyy-MM-dd')
      : format(subDays(todayDate, period === 'week' ? 6 : 29), 'yyyy-MM-dd')

  const { data: bookings, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-dashboard-bookings', period, rangeStart, today],
    queryFn: async (): Promise<DashboardBooking[]> => {
      const { startUtc } = getHarareDayBoundsUtc(rangeStart)
      const { endUtc } = getHarareDayBoundsUtc(today)
      const bookings: DashboardBooking[] = []
      for (let offset = 0; ; offset += DASHBOARD_PAGE_SIZE) {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            id, start_time, status, source,
            client:clients (full_name),
            service:services (name, price),
            barber:profiles!bookings_barber_id_fkey (full_name)
          `)
          .gte('start_time', startUtc)
          .lte('start_time', endUtc)
          .order('start_time', { ascending: true })
          .order('id', { ascending: true })
          .range(offset, offset + DASHBOARD_PAGE_SIZE - 1)

        if (error) throw error
        const page = (data ?? []) as unknown as DashboardBooking[]
        bookings.push(...page)
        if (page.length < DASHBOARD_PAGE_SIZE) return bookings
      }
    },
    refetchInterval: 60_000,
  })

  useEffect(() => {
    const channel = supabase
      .channel('admin-dashboard-bookings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['admin-dashboard-bookings'] })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [queryClient])

  const { data: barbers, isLoading: isLoadingBarbers, error: barberError, refetch: refetchBarbers } = useBarbers()
  const points = useMemo(() => getChartPoints(period, today, bookings ?? []), [period, today, bookings])
  const todayBookings = (bookings ?? []).filter(
    (booking) => toHarareDateString(new Date(booking.start_time)) === today,
  )
  const activeToday = todayBookings.filter(
    (booking) => !['cancelled', 'no_show', 'done'].includes(booking.status),
  )
  const completedToday = todayBookings.filter((booking) => booking.status === 'done')
  const revenueToday = completedToday.reduce((sum, booking) => sum + Number(booking.service.price), 0)
  const upcoming = activeToday
    .sort((a, b) => {
      if (a.status === 'in_service') return -1
      if (b.status === 'in_service') return 1
      return a.start_time.localeCompare(b.start_time)
    })
    .slice(0, 5)
  const maxValue = Math.max(1, ...points.map((point) => point.value))

  const metrics = [
    { label: 'Today’s bookings', value: isLoading ? '—' : activeToday.length, Icon: CalendarCheck },
    { label: 'Completed today', value: isLoading ? '—' : completedToday.length, Icon: CircleCheck },
    { label: 'Revenue today', value: isLoading ? '—' : `$${revenueToday.toFixed(2)}`, Icon: DollarSign },
    {
      label: 'Active barbers',
      value: isLoadingBarbers ? '—' : (barbers ?? []).filter((barber) => barber.is_active).length,
      Icon: Scissors,
    },
  ]

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-text-muted">Your shop at a glance for {today}.</p>
        </div>
        <Link
          to="/admin/appointments"
          className="inline-flex min-h-touch items-center gap-2 self-start rounded-ui-md bg-brand-500 px-4 py-2 text-sm font-semibold text-on-brand hover:bg-brand-600 sm:self-auto"
        >
          New appointment <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </header>

      {error || barberError ? (
        <ErrorMessage
          message={
            error instanceof Error
              ? error.message
              : barberError instanceof Error
                ? barberError.message
                : 'Failed to load dashboard data'
          }
          onRetry={() => {
            if (error) void refetch()
            if (barberError) void refetchBarbers()
          }}
        />
      ) : null}

      <section aria-label="Today’s key metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, Icon }) => (
          <Card key={label}>
            <CardBody className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-text-muted">{label}</p>
                <p className="mt-2 text-2xl font-bold text-text">{value}</p>
              </div>
              <span className="rounded-ui-md bg-brand-500/10 p-3 text-brand-text">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
            </CardBody>
          </Card>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <Card>
          <CardBody>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text">Bookings</h2>
                <p className="mt-1 text-sm text-text-muted">Bookings by {period === 'year' ? 'month' : 'day'}.</p>
              </div>
              <SegmentedControl
                label="Bookings chart period"
                value={period}
                onChange={(value) => setPeriod(value as DashboardPeriod)}
                options={[
                  { value: 'week', label: 'Week' },
                  { value: 'month', label: 'Month' },
                  { value: 'year', label: 'Year' },
                ]}
              />
            </div>

            {isLoading ? (
              <div className="mt-6 h-48 animate-pulse rounded-ui-md bg-page" aria-label="Loading chart" />
            ) : error ? (
              <p className="py-12 text-center text-sm text-text-muted">Chart data is unavailable.</p>
            ) : points.every((point) => point.value === 0) ? (
              <EmptyState title="No bookings in this period" description="New bookings will appear in this chart." />
            ) : (
              <div className="mt-6">
                <p className="sr-only">
                  {points.map(({ label, value }) => `${label}: ${value} bookings`).join('; ')}
                </p>
                <div
                  aria-hidden="true"
                  className="grid h-48 items-end gap-1 border-b border-l border-border px-1 sm:gap-2"
                  style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }}
                >
                  {points.map((point) => (
                    <div key={point.key} className="flex h-full flex-col items-center justify-end gap-2">
                      <span className="text-[10px] font-medium text-text-muted">{point.value || ''}</span>
                      <div
                        className="w-full max-w-8 rounded-t-sm bg-brand-500"
                        style={{ height: `${point.value ? Math.max(6, (point.value / maxValue) * 78) : 0}%` }}
                      />
                      <span className="pb-2 text-[10px] text-text-muted">{point.label}</span>
                    </div>
                  ))}
                </div>
                <table className="sr-only">
                  <caption>Bookings by {period === 'year' ? 'month' : 'day'}</caption>
                  <thead><tr><th scope="col">Period</th><th scope="col">Bookings</th></tr></thead>
                  <tbody>
                    {points.map((point) => (
                      <tr key={point.key}><th scope="row">{point.label}</th><td>{point.value}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-text">Today’s queue</h2>
                <p className="mt-1 text-sm text-text-muted">{activeToday.length} active bookings</p>
              </div>
              <Link to="/admin/walk-ins" className="text-sm font-semibold text-brand-text hover:underline">
                Add walk-in
              </Link>
            </div>
            {isLoading ? (
              <p className="py-8 text-center text-sm text-text-muted">Loading today’s queue…</p>
            ) : upcoming.length === 0 ? (
              <EmptyState title="Queue is clear" description="Appointments and walk-ins will show here." />
            ) : (
              <ul className="mt-4 divide-y divide-border">
                {upcoming.map((booking) => (
                  <li key={booking.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text">{booking.client.full_name}</p>
                      <p className="mt-1 truncate text-xs text-text-muted">
                        {formatTimeInHarare(booking.start_time)} · {booking.service.name} · {booking.barber.full_name}
                      </p>
                    </div>
                    <StatusBadge status={booking.status} />
                  </li>
                ))}
              </ul>
            )}
            <Link
              to="/admin/appointments"
              className="mt-4 inline-flex min-h-touch w-full items-center justify-center gap-2 rounded-ui-md border border-border px-3 text-sm font-semibold text-text hover:bg-page"
            >
              Open schedule <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </CardBody>
        </Card>
      </div>

      <section
        aria-label="Infinity Barbers"
        className="relative overflow-hidden rounded-ui-lg bg-sidebar p-6 text-white sm:p-8"
      >
        <div className="absolute -right-8 -top-12 h-48 w-48 rounded-full border-[18px] border-brand-500/20" aria-hidden="true" />
        <div className="relative max-w-xl">
          <Badge variant="warning" className="bg-brand-500 text-on-brand">INFINITY BARBERS</Badge>
          <h2 className="mt-4 text-2xl font-bold">Look Good. Feel Great.</h2>
          <p className="mt-2 text-sm text-sidebar-text">
            Keep appointments, walk-ins, and your team moving together from one place.
          </p>
          <Link
            to="/admin/reports"
            className="mt-5 inline-flex min-h-touch items-center gap-2 font-semibold text-brand-300 hover:text-brand-200"
          >
            View shop reports <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  )
}
