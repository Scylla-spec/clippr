import { useMemo, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'
import { Download, Users } from 'lucide-react'
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
    <PageFrame title="Appointments" description="Create and manage scheduled client appointments.">
      <DayViewSchedule source="appointment" />
    </PageFrame>
  )
}

export function AdminWalkInsPage() {
  return (
    <PageFrame title="Walk-ins" description="Add walk-in clients and manage their place in the queue.">
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

export function AdminCustomersPage() {
  const [search, setSearch] = useState('')
  const { data: customers, isLoading, error, refetch } = useQuery({
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
        customer.full_name.toLocaleLowerCase().includes(term) ||
        customer.phone.includes(term),
    )
  }, [customers, search])

  return (
    <PageFrame title="Customers" description="Search customer records and review their booking history count.">
      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <Input
              label="Search customers"
              type="search"
              placeholder="Name or phone number"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="sm:max-w-sm"
            />
            <p className="text-sm text-text-muted" aria-live="polite">
              {filteredCustomers.length} {filteredCustomers.length === 1 ? 'customer' : 'customers'}
            </p>
          </div>

          {isLoading ? (
            <p className="py-8 text-center text-sm text-text-muted">Loading customers…</p>
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
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
                    <th scope="col" className="px-3 py-3 font-semibold">Customer</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Phone</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Bookings</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Customer since</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b border-border last:border-0">
                      <th scope="row" className="px-3 py-4 font-medium text-text">
                        {customer.full_name}
                      </th>
                      <td className="px-3 py-4">
                        <a className="font-medium text-brand-text hover:underline" href={`tel:${customer.phone}`}>
                          {customer.phone}
                        </a>
                      </td>
                      <td className="px-3 py-4 text-text-muted">
                        {customer.bookings?.[0]?.count ?? 0}
                      </td>
                      <td className="px-3 py-4 text-text-muted">
                        {formatDateInHarare(customer.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
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

function csvCell(value: string | number) {
  let text = String(value)
  if (/^[=+\-@]/.test(text)) text = `'${text}`
  return `"${text.replaceAll('"', '""')}"`
}

export function AdminReportsPage() {
  const today = toHarareDateString()
  const [fromDate, setFromDate] = useState(() => dateOffset(today, 6))
  const [toDate, setToDate] = useState(today)
  const validRange = Boolean(fromDate && toDate && fromDate <= toDate)

  const { data: bookings, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-reports', fromDate, toDate],
    enabled: validRange,
    queryFn: async (): Promise<ReportBooking[]> => {
      const { startUtc } = getHarareDayBoundsUtc(fromDate)
      const { endUtc } = getHarareDayBoundsUtc(toDate)
      const bookings: ReportBooking[] = []
      for (let offset = 0; ; offset += QUERY_PAGE_SIZE) {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            id, start_time, status, source,
            service:services (name, price),
            barber:profiles!bookings_barber_id_fkey (full_name)
          `)
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
            <Input label="From" type="date" value={fromDate} max={toDate || undefined} onChange={(event) => setFromDate(event.target.value)} />
            <Input label="To" type="date" value={toDate} min={fromDate || undefined} max={today} onChange={(event) => setToDate(event.target.value)} />
          </div>
          <Button type="button" variant="secondary" onClick={downloadCsv} disabled={isLoading || Boolean(error) || !bookings?.length}>
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
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Bookings', bookings?.length ?? 0],
              ['Appointments', bookings?.filter((item) => item.source === 'appointment').length ?? 0],
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
            <EmptyState title="No activity in this range" description="Try widening the report dates." />
          ) : (
            <Card>
              <CardBody>
                <h2 className="mb-4 text-lg font-semibold text-text">Completed services by barber</h2>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[30rem] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
                        <th scope="col" className="px-3 py-3 font-semibold">Barber</th>
                        <th scope="col" className="px-3 py-3 font-semibold">Completed</th>
                        <th scope="col" className="px-3 py-3 font-semibold">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {barberTotals.map(([name, totals]) => (
                        <tr key={name} className="border-b border-border last:border-0">
                          <th scope="row" className="px-3 py-4 font-medium text-text">{name}</th>
                          <td className="px-3 py-4 text-text-muted">{totals.bookings}</td>
                          <td className="px-3 py-4 font-semibold text-text">${totals.revenue.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-5 flex flex-wrap gap-2" aria-label="Booking status summary">
                  {(['booked', 'waiting', 'in_service', 'done', 'no_show', 'cancelled'] as const).map((status) => (
                    <Badge key={status} variant="default">
                      {status.replaceAll('_', ' ')}: {bookings.filter((item) => item.status === status).length}
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
