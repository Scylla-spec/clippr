import { useMemo, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, startOfMonth, startOfYear, subDays } from 'date-fns'
import { CalendarDays, ChevronRight, Download, MessageCircle, Phone, Users, X } from 'lucide-react'
import { DayViewSchedule } from '@/features/bookings/DayViewSchedule'
import { BarbersManager } from '@/features/barbers/BarbersManager'
import { ServicesManager } from '@/features/services/ServicesManager'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import type { BookingStatus, BookingSource } from '@/lib/database.types'
import { formatDateInHarare, getHarareDayBoundsUtc, toHarareDateString } from '@/lib/dates'
import { normalizePhone } from '@/lib/phone'

const QUERY_PAGE_SIZE = 500

function PageFrame({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-text-muted">{description}</p>
      </header>
      {children}
    </div>
  )
}

export function AdminAppointmentsPage() {
  return (
    <PageFrame title="Bookings" description="Appointments and walk-ins across your barbers.">
      <DayViewSchedule />
    </PageFrame>
  )
}

export function AdminWalkInsPage() {
  return (
    <PageFrame
      title="Walk-ins"
      description="Add walk-in clients and manage their place in the queue."
    >
      <DayViewSchedule source="walk_in" />
    </PageFrame>
  )
}

export function AdminBarbersPage() {
  return (
    <PageFrame title="Barbers" description="Manage your team, barber accounts, and active status.">
      <BarbersManager />
    </PageFrame>
  )
}

export function AdminServicesPage() {
  return (
    <PageFrame title="Services" description="Manage service offerings, durations, and prices.">
      <ServicesManager />
    </PageFrame>
  )
}

interface CustomerRow {
  id: string
  full_name: string
  phone: string
  created_at: string
  bookings: { count: number }[]
}

interface CustomerBooking {
  id: string
  start_time: string
  status: BookingStatus
  service: { name: string }
  barber: { full_name: string }
}

export function AdminCustomersPage() {
  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null)
  const {
    data: customers,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: async (): Promise<CustomerRow[]> => {
      const customers: CustomerRow[] = []
      for (let offset = 0; ; offset += QUERY_PAGE_SIZE) {
        const { data, error } = await supabase
          .from('clients')
          .select('id, full_name, phone, created_at, bookings(count)')
          .order('full_name', { ascending: true })
          .order('id', { ascending: true })
          .range(offset, offset + QUERY_PAGE_SIZE - 1)

        if (error) throw error
        const page = (data ?? []) as unknown as CustomerRow[]
        customers.push(...page)
        if (page.length < QUERY_PAGE_SIZE) return customers
      }
    },
  })

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLocaleLowerCase()
    if (!term) return customers ?? []
    return (customers ?? []).filter(
      (customer) =>
        customer.full_name.toLocaleLowerCase().includes(term) || customer.phone.includes(term),
    )
  }, [customers, search])

  const recentBookingsQuery = useQuery({
    queryKey: ['admin-customer-bookings', selectedCustomer?.id],
    enabled: Boolean(selectedCustomer),
    queryFn: async (): Promise<CustomerBooking[]> => {
      if (!selectedCustomer) return []
      const { data, error } = await supabase
        .from('bookings')
        .select(
          'id, start_time, status, service:services(name), barber:profiles!bookings_barber_id_fkey(full_name)',
        )
        .eq('client_id', selectedCustomer.id)
        .order('start_time', { ascending: false })
        .limit(10)

      if (error) throw error
      return (data ?? []) as unknown as CustomerBooking[]
    },
  })

  return (
    <PageFrame title="Customers" description="Find a customer and review their recent visits.">
      <div className="bg-page/95 sticky top-14 z-20 -mx-4 space-y-3 border-b border-border px-4 pb-3 pt-1 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <Input
          label="Search customers"
          type="search"
          placeholder="Name or phone number"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <p className="text-sm text-text-muted" aria-live="polite">
          {filteredCustomers.length} {filteredCustomers.length === 1 ? 'customer' : 'customers'}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3" aria-label="Loading customers">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-20 animate-pulse rounded-ui-lg bg-surface" />
          ))}
        </div>
      ) : error ? (
        <ErrorMessage
          message={error instanceof Error ? error.message : 'Failed to load customers'}
          onRetry={() => void refetch()}
        />
      ) : filteredCustomers.length === 0 ? (
        <EmptyState
          icon={<Users className="h-10 w-10 text-text-muted" aria-hidden="true" />}
          title={search ? 'No matching customers' : 'No customers yet'}
          description={
            search
              ? 'Try another name or phone number.'
              : 'Customers appear here when an appointment or walk-in is created.'
          }
        />
      ) : (
        <ul className="space-y-3">
          {filteredCustomers.map((customer) => {
            const initials = customer.full_name
              .trim()
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase() ?? '')
              .join('')
            return (
              <li key={customer.id}>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(customer)}
                  aria-label={`View ${customer.full_name}, ${customer.bookings?.[0]?.count ?? 0} visits`}
                  className="flex min-h-20 w-full items-center gap-3 rounded-ui-lg border border-border bg-surface p-3 text-left shadow-ui-sm"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-text">
                    {initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {customer.full_name}
                    </span>
                    <span className="mt-1 block truncate text-sm text-text-muted">
                      {customer.phone}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-semibold tabular-nums">
                      {customer.bookings?.[0]?.count ?? 0}
                    </span>
                    <span className="text-xs text-text-muted">visits</span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-text-muted" aria-hidden="true" />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {selectedCustomer ? (
        <div
          className="fixed inset-0 z-70 flex items-end bg-black/50"
          onClick={(event) => {
            if (event.target === event.currentTarget) setSelectedCustomer(null)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-detail-title"
            className="max-h-[90dvh] w-full overflow-y-auto rounded-t-ui-xl bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-ui-lg motion-safe:animate-[sheet-up_180ms_ease-out]"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" aria-hidden="true" />
            <header className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 id="customer-detail-title" className="truncate text-xl font-semibold">
                  {selectedCustomer.full_name}
                </h2>
                <p className="mt-1 text-sm text-text-muted">
                  {selectedCustomer.phone} · {selectedCustomer.bookings?.[0]?.count ?? 0} visits
                </p>
              </div>
              <button
                type="button"
                aria-label="Close customer details"
                onClick={() => setSelectedCustomer(null)}
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-page"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </header>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <a
                href={`tel:${selectedCustomer.phone}`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-ui-md border border-border font-medium"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                Call
              </a>
              <a
                href={`https://wa.me/${normalizePhone(selectedCustomer.phone).replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-ui-md border border-border font-medium"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                WhatsApp
              </a>
            </div>
            <h3 className="mb-2 mt-5 text-base font-semibold">Recent bookings</h3>
            {recentBookingsQuery.isLoading ? (
              <p className="py-6 text-center text-sm text-text-muted">Loading recent bookings…</p>
            ) : recentBookingsQuery.error ? (
              <ErrorMessage
                message={
                  recentBookingsQuery.error instanceof Error
                    ? recentBookingsQuery.error.message
                    : 'Failed to load recent bookings'
                }
                onRetry={() => void recentBookingsQuery.refetch()}
              />
            ) : recentBookingsQuery.data?.length ? (
              <ul className="max-h-[40dvh] space-y-2 overflow-y-auto">
                {recentBookingsQuery.data.map((booking) => (
                  <li key={booking.id} className="rounded-ui-md bg-page p-3">
                    <p className="inline-flex items-center gap-2 text-sm font-medium">
                      <CalendarDays className="h-4 w-4 text-brand-text" aria-hidden="true" />
                      {formatDateInHarare(booking.start_time)}
                    </p>
                    <p className="mt-1 text-sm text-text-muted">
                      {booking.service.name} · {booking.barber.full_name} ·{' '}
                      {booking.status.replaceAll('_', ' ')}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-text-muted">
                No booking history is available.
              </p>
            )}
          </section>
        </div>
      ) : null}
    </PageFrame>
  )
}

interface ReportBooking {
  id: string
  start_time: string
  status: BookingStatus
  source: BookingSource
  service: { name: string; price: number }
  barber: { full_name: string }
}

function dateOffset(dateString: string, days: number) {
  const [year, month, day] = dateString.split('-').map(Number)
  return format(subDays(new Date(year, month - 1, day), days), 'yyyy-MM-dd')
}

type ReportPeriod = 'weekly' | 'monthly' | 'yearly'

interface BookingChartBucket {
  key: string
  label: string
  count: number
}

function getBookingChartBuckets(
  bookings: ReportBooking[],
  period: ReportPeriod,
  today: string,
): BookingChartBucket[] {
  const date = new Date(`${today}T12:00:00`)
  const buckets =
    period === 'yearly'
      ? Array.from({ length: 12 }, (_, index) => {
          const month = new Date(date.getFullYear(), date.getMonth() - 11 + index, 1)
          return {
            key: format(month, 'yyyy-MM'),
            label: format(month, 'MMM'),
            count: 0,
          }
        })
      : Array.from({ length: period === 'weekly' ? 7 : 30 }, (_, index) => {
          const length = period === 'weekly' ? 7 : 30
          const day = subDays(date, length - index - 1)
          return {
            key: format(day, 'yyyy-MM-dd'),
            label: period === 'weekly' ? format(day, 'EEE') : format(day, 'd'),
            count: 0,
          }
        })
  const bucketByKey = new Map(buckets.map((bucket) => [bucket.key, bucket]))

  for (const booking of bookings) {
    const dateString = toHarareDateString(new Date(booking.start_time))
    const key = period === 'yearly' ? dateString.slice(0, 7) : dateString
    const bucket = bucketByKey.get(key)
    if (bucket) bucket.count += 1
  }

  return buckets
}

function csvCell(value: string | number) {
  let text = String(value)
  if (/^[=+\-@]/.test(text)) text = `'${text}`
  return `"${text.replaceAll('"', '""')}"`
}

export function AdminReportsPage() {
  const today = toHarareDateString()
  const [period, setPeriod] = useState<ReportPeriod>('weekly')
  const [fromDate, setFromDate] = useState(() => dateOffset(today, 6))
  const [toDate, setToDate] = useState(today)
  const validRange = Boolean(fromDate && toDate && fromDate <= toDate)

  const {
    data: bookings,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-reports', fromDate, toDate],
    enabled: validRange,
    queryFn: async (): Promise<ReportBooking[]> => {
      const { startUtc } = getHarareDayBoundsUtc(fromDate)
      const { endUtc } = getHarareDayBoundsUtc(toDate)
      const bookings: ReportBooking[] = []
      for (let offset = 0; ; offset += QUERY_PAGE_SIZE) {
        const { data, error } = await supabase
          .from('bookings')
          .select(
            `
            id, start_time, status, source,
            service:services (name, price),
            barber:profiles!bookings_barber_id_fkey (full_name)
          `,
          )
          .gte('start_time', startUtc)
          .lte('start_time', endUtc)
          .order('start_time', { ascending: true })
          .order('id', { ascending: true })
          .range(offset, offset + QUERY_PAGE_SIZE - 1)

        if (error) throw error
        const page = (data ?? []) as unknown as ReportBooking[]
        bookings.push(...page)
        if (page.length < QUERY_PAGE_SIZE) return bookings
      }
    },
  })

  const completed = (bookings ?? []).filter((booking) => booking.status === 'done')
  const revenue = completed.reduce((sum, booking) => sum + Number(booking.service.price), 0)
  const barberTotals = useMemo(() => {
    const totals = new Map<string, { bookings: number; revenue: number }>()
    for (const booking of completed) {
      const current = totals.get(booking.barber.full_name) ?? { bookings: 0, revenue: 0 }
      current.bookings += 1
      current.revenue += Number(booking.service.price)
      totals.set(booking.barber.full_name, current)
    }
    return [...totals.entries()].sort((a, b) => b[1].revenue - a[1].revenue)
  }, [completed])
  const chartBuckets = useMemo(
    () => getBookingChartBuckets(bookings ?? [], period, today),
    [bookings, period, today],
  )
  const chartMax = Math.max(1, ...chartBuckets.map((bucket) => bucket.count))

  const selectPeriod = (nextPeriod: ReportPeriod) => {
    setPeriod(nextPeriod)
    const todayDate = new Date(`${today}T12:00:00`)
    const nextFromDate =
      nextPeriod === 'weekly'
        ? dateOffset(today, 6)
        : nextPeriod === 'monthly'
          ? format(startOfMonth(todayDate), 'yyyy-MM-dd')
          : format(startOfYear(todayDate), 'yyyy-MM-dd')
    setFromDate(nextFromDate)
    setToDate(today)
  }

  const downloadCsv = () => {
    const rows = [
      ['Date', 'Time', 'Type', 'Service', 'Barber', 'Status', 'Revenue'],
      ...(bookings ?? []).map((booking) => [
        toHarareDateString(new Date(booking.start_time)),
        new Intl.DateTimeFormat('en', {
          timeZone: 'Africa/Harare',
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(booking.start_time)),
        booking.source === 'walk_in' ? 'Walk-in' : 'Appointment',
        booking.service.name,
        booking.barber.full_name,
        booking.status.replaceAll('_', ' '),
        booking.status === 'done' ? Number(booking.service.price).toFixed(2) : '0.00',
      ]),
    ]
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `infinity-barbers-report-${fromDate}-to-${toDate}.csv`
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <PageFrame
      title="Reports"
      description="Review booking activity and completed-service revenue for a date range. Revenue uses current service prices because booking-time prices are not stored."
    >
      <Card>
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="From"
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(event) => setFromDate(event.target.value)}
            />
            <Input
              label="To"
              type="date"
              value={toDate}
              min={fromDate || undefined}
              max={today}
              onChange={(event) => setToDate(event.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={downloadCsv}
            disabled={isLoading || Boolean(error) || !bookings?.length}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export CSV
          </Button>
        </CardBody>
      </Card>

      {!validRange ? (
        <ErrorMessage message="Choose a valid date range. The start date must be on or before the end date." />
      ) : isLoading ? (
        <p className="py-8 text-center text-sm text-text-muted">Loading report…</p>
      ) : error ? (
        <ErrorMessage
          message={error instanceof Error ? error.message : 'Failed to load report'}
          onRetry={() => void refetch()}
        />
      ) : (
        <>
          <Card>
            <CardBody>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Bookings over time</h2>
                  <p className="text-sm text-text-muted">
                    {bookings?.length ?? 0} total in this period
                  </p>
                </div>
                <div
                  role="group"
                  aria-label="Booking chart period"
                  className="grid min-h-12 grid-cols-3 gap-1 rounded-ui-md bg-page p-1"
                >
                  {(['weekly', 'monthly', 'yearly'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={period === option}
                      onClick={() => selectPeriod(option)}
                      className={`min-h-10 rounded-ui-sm px-3 text-sm font-medium capitalize ${
                        period === option
                          ? 'bg-surface text-text shadow-ui-sm'
                          : 'text-text-muted hover:text-text'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <div
                role="img"
                aria-label={`${period} bookings chart, ${bookings?.length ?? 0} bookings total`}
                className="mt-5 grid h-48 auto-cols-fr grid-flow-col items-end gap-1 border-b border-border px-1"
              >
                {chartBuckets.map((bucket) => (
                  <div
                    key={bucket.key}
                    className="flex h-full min-w-0 flex-col items-center justify-end gap-1"
                    title={`${bucket.label}: ${bucket.count} bookings`}
                  >
                    <span className="text-[10px] tabular-nums text-text-muted">
                      {bucket.count || ''}
                    </span>
                    <div className="flex h-36 w-full items-end">
                      <span
                        className="mx-auto w-full max-w-8 rounded-t bg-brand-500 motion-safe:transition-[height] motion-safe:duration-300"
                        style={{
                          height: `${bucket.count === 0 ? 2 : Math.max(8, (bucket.count / chartMax) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="truncate text-[10px] text-text-muted">{bucket.label}</span>
                  </div>
                ))}
              </div>
              <ul className="sr-only">
                {chartBuckets.map((bucket) => (
                  <li key={bucket.key}>
                    {bucket.label}: {bucket.count} bookings
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Bookings', bookings?.length ?? 0],
              [
                'Appointments',
                bookings?.filter((item) => item.source === 'appointment').length ?? 0,
              ],
              ['Walk-ins', bookings?.filter((item) => item.source === 'walk_in').length ?? 0],
              ['Completed revenue', `$${revenue.toFixed(2)}`],
            ].map(([label, value]) => (
              <Card key={label}>
                <CardBody>
                  <p className="text-sm text-text-muted">{label}</p>
                  <p className="mt-2 text-2xl font-bold text-text">{value}</p>
                </CardBody>
              </Card>
            ))}
          </div>

          {!bookings?.length ? (
            <EmptyState
              title="No activity in this range"
              description="Try widening the report dates."
            />
          ) : (
            <Card>
              <CardBody>
                <h2 className="mb-4 text-lg font-semibold text-text">
                  Completed services by barber
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[30rem] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
                        <th scope="col" className="px-3 py-3 font-semibold">
                          Barber
                        </th>
                        <th scope="col" className="px-3 py-3 font-semibold">
                          Completed
                        </th>
                        <th scope="col" className="px-3 py-3 font-semibold">
                          Revenue
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {barberTotals.map(([name, totals]) => (
                        <tr key={name} className="border-b border-border last:border-0">
                          <th scope="row" className="px-3 py-4 font-medium text-text">
                            {name}
                          </th>
                          <td className="px-3 py-4 text-text-muted">{totals.bookings}</td>
                          <td className="px-3 py-4 font-semibold text-text">
                            ${totals.revenue.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-5 flex flex-wrap gap-2" aria-label="Booking status summary">
                  {(
                    ['booked', 'waiting', 'in_service', 'done', 'no_show', 'cancelled'] as const
                  ).map((status) => (
                    <Badge key={status} variant="default">
                      {status.replaceAll('_', ' ')}:{' '}
                      {bookings.filter((item) => item.status === status).length}
                    </Badge>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </>
      )}
    </PageFrame>
  )
}
