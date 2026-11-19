import { useEffect, useState } from 'react'
import { Armchair, Phone, Scissors, Timer, Clock, Check } from 'lucide-react'
import type { TodayQueueRow } from '@/lib/database.types'
import { formatTimeInHarare } from '@/lib/dates'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'

interface NowServingCardProps {
  booking: TodayQueueRow | null
  onComplete: (booking: TodayQueueRow) => Promise<void>
  isUpdating?: boolean
}

export function NowServingCard({ booking, onComplete, isUpdating = false }: NowServingCardProps) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!booking) return
    const intervalId = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(intervalId)
  }, [booking])

  if (!booking) {
    return (
      <Card className="border border-brand-300 bg-gradient-to-br from-orange-50 to-white shadow-sm dark:border-brand-500/30 dark:from-orange-950/20 dark:to-surface-800 lg:border-dashed lg:border-2 lg:border-slate-300 lg:bg-slate-50/50 lg:dark:border-surface-700 lg:dark:bg-surface-800/40">
        <CardBody className="flex items-center gap-3 p-4 lg:flex-col lg:p-6 lg:text-center">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-text">
            <Armchair className="h-5 w-5 lg:h-6 lg:w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-surface-900 dark:text-white lg:mt-3 lg:text-base lg:font-bold">
              Chair is Currently Empty
            </h2>
            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
              No client is currently in service. Call up the next client from the queue below.
            </p>
          </div>
        </CardBody>
      </Card>
    )
  }

  const elapsedMinutes = Math.max(
    0,
    Math.floor((now - new Date(booking.updated_at).getTime()) / 60_000),
  )
  const progress =
    booking.duration_min > 0
      ? Math.min(100, (elapsedMinutes / booking.duration_min) * 100)
      : 0

  return (
    <Card className="border border-brand-300 bg-gradient-to-br from-orange-50 to-white shadow-sm dark:border-brand-500/30 dark:from-orange-950/20 dark:to-surface-800 lg:border-2 lg:border-green-500/80 lg:bg-gradient-to-br lg:from-green-50/60 lg:to-white lg:shadow-md lg:dark:from-green-950/20 lg:dark:to-surface-800">
      <CardBody className="space-y-3 p-4 sm:space-y-4 sm:p-6 lg:space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-40" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-brand-500" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-text lg:text-green-700 lg:dark:text-green-400">
              Now Serving
            </span>
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <span
              className={`rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${
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

        <div className="flex items-center gap-3">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-sm font-bold text-brand-text lg:hidden">
            {booking.client_name
              .trim()
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part.charAt(0).toUpperCase())
              .join('')}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold tracking-tight text-surface-900 dark:text-white lg:text-2xl lg:font-extrabold">
              {booking.client_name}
            </h2>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-1">
                <Scissors className="h-3.5 w-3.5 lg:hidden" aria-hidden="true" />
                {booking.service_name}
              </span>
              <span className="hidden items-center gap-1 lg:inline-flex">
                <Phone className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                {booking.client_phone}
              </span>
              <span className="lg:hidden" aria-hidden="true">·</span>
              <span className="tabular-nums lg:hidden">
                {elapsedMinutes} of {booking.duration_min} min
              </span>
            </p>
          </div>
        </div>

        <div
          role="progressbar"
          aria-label={`${booking.client_name} service progress`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          className="h-2 overflow-hidden rounded-full bg-brand-500/15 lg:hidden"
        >
          <span
            className="block h-full rounded-full bg-gradient-to-r from-brand-500 to-amber-300 motion-safe:transition-[width] motion-safe:duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="hidden flex-wrap items-center gap-4 rounded-xl border border-green-100 bg-white/80 p-3 text-xs dark:border-surface-700 dark:bg-surface-800/80 lg:flex">
          <div>
            <span className="text-slate-500 dark:text-slate-400 block">Duration</span>
            <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
              <Timer className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              <span>{booking.duration_min} minutes</span>
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block">Started</span>
            <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
              <Clock className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              <span>{formatTimeInHarare(booking.start_time)}</span>
            </span>
          </div>
          <div className="ml-auto text-right">
            <span className="text-slate-500 dark:text-slate-400 block">Price</span>
            <span className="font-bold text-brand-600 dark:text-brand-400 text-base">
              ${Number(booking.price).toFixed(2)}
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="primary"
          size="lg"
          className="flex min-h-14 w-full items-center justify-center gap-2 bg-brand-500 py-3.5 text-base font-bold text-on-brand shadow-md hover:bg-brand-600 lg:min-h-[52px] lg:bg-green-600 lg:py-3.5 lg:text-white lg:hover:bg-green-700"
          isLoading={isUpdating}
          onClick={() => void onComplete(booking)}
        >
          <Check className="h-5 w-5" aria-hidden="true" />
          <span className="lg:hidden">Complete</span>
          <span className="hidden lg:inline">Complete Service (Done)</span>
        </Button>
      </CardBody>
    </Card>
  )
}
