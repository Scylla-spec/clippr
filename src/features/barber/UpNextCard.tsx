import { ArrowRight, Phone, Clock, Scissors } from 'lucide-react'
import type { TodayQueueRow } from '@/lib/database.types'
import { formatTimeInHarare } from '@/lib/dates'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'

interface UpNextCardProps {
  booking: TodayQueueRow | null
  hasActiveInService: boolean
  onStartService: (booking: TodayQueueRow) => Promise<void>
  onNoShow: (booking: TodayQueueRow) => void
  isUpdating?: boolean
}

export function UpNextCard({
  booking,
  hasActiveInService,
  onStartService,
  onNoShow,
  isUpdating = false,
}: UpNextCardProps) {
  if (!booking) {
    return (
      <Card className="bg-slate-50/50 dark:bg-surface-800/30">
        <CardBody className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
          No clients currently waiting in your queue.
        </CardBody>
      </Card>
    )
  }

  return (
    <Card className="border border-brand-300 bg-white shadow-sm dark:border-brand-500/30 dark:bg-surface-800">
      <CardBody className="space-y-3 p-4 lg:p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ArrowRight className="h-4 w-4 text-brand-600 dark:text-brand-400" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-400">
              Up Next
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`hidden rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wider lg:inline ${
                booking.source === 'walk_in'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
              }`}
            >
              {booking.source === 'walk_in' ? 'Walk-in' : 'Appointment'}
            </span>
            <StatusBadge status={booking.status} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3 lg:block">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-sm font-bold text-brand-text lg:hidden">
              {booking.client_name
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part.charAt(0).toUpperCase())
                .join('')}
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold text-surface-900 dark:text-white lg:text-xl">
                {booking.client_name}
              </h3>
              <p className="hidden items-center gap-1 text-xs text-slate-500 dark:text-slate-400 sm:inline-flex">
                <Phone className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                <span>{booking.client_phone}</span>
              </p>
            </div>
          </div>

          <div className="inline-flex shrink-0 flex-col items-end gap-0.5 text-right text-xs font-medium text-slate-700 dark:text-slate-200 sm:flex-row sm:items-center sm:gap-1.5 sm:text-sm">
            <Clock className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            <span>{formatTimeInHarare(booking.start_time)}</span>
            <span className="max-w-24 truncate font-normal text-xs text-slate-500 sm:max-w-none">
              {booking.service_name}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            type="button"
            variant="primary"
            size="md"
            className="flex min-h-[48px] flex-1 items-center justify-center gap-2 font-bold lg:min-h-[48px]"
            disabled={hasActiveInService}
            isLoading={isUpdating}
            onClick={() => void onStartService(booking)}
          >
            {hasActiveInService ? (
              <span>Finish current service first</span>
            ) : (
              <>
                <Scissors className="h-4 w-4" aria-hidden="true" />
                <span className="lg:hidden">Start</span>
                <span className="hidden lg:inline">Start Service</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="md"
            className="min-h-[48px] text-xs font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400"
            disabled={isUpdating}
            onClick={() => onNoShow(booking)}
          >
            No-show
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}
