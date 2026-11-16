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
  if (!booking) {
    return (
      <Card className="border-dashed border-2 border-slate-300 bg-slate-50/50 dark:border-surface-700 dark:bg-surface-800/40">
        <CardBody className="p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-2xl dark:bg-surface-700">
            💺
          </div>
          <h3 className="mt-3 text-base font-bold text-surface-900 dark:text-white">
            Chair is Currently Empty
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            No client is currently in service. Call up the next client from the queue below.
          </p>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-green-500/80 bg-gradient-to-br from-green-50/60 to-white shadow-md dark:from-green-950/20 dark:to-surface-800">
      <CardBody className="p-5 sm:p-6 space-y-4">
        {/* Header Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-green-700 dark:text-green-400">
              Now Serving
            </span>
          </div>

          <div className="flex items-center gap-2">
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

        {/* Client & Service Info */}
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold text-surface-900 dark:text-white tracking-tight">
            {booking.client_name}
          </h2>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            📞 {booking.client_phone}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 rounded-xl bg-white/80 p-3 text-xs dark:bg-surface-800/80 border border-green-100 dark:border-surface-700">
          <div>
            <span className="text-slate-500 dark:text-slate-400 block">Service</span>
            <span className="font-semibold text-surface-900 dark:text-white text-sm">
              💈 {booking.service_name}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block">Duration</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              ⏱️ {booking.duration_min} minutes
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block">Started</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              🕒 {formatTimeInHarare(booking.start_time)}
            </span>
          </div>
          <div className="ml-auto text-right">
            <span className="text-slate-500 dark:text-slate-400 block">Price</span>
            <span className="font-bold text-brand-600 dark:text-brand-400 text-base">
              ${Number(booking.price).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Large Thumb-friendly Action Button */}
        <Button
          type="button"
          variant="primary"
          size="lg"
          className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold text-base py-3.5 shadow-md min-h-[52px]"
          isLoading={isUpdating}
          onClick={() => void onComplete(booking)}
        >
          ✓ Complete Service (Done)
        </Button>
      </CardBody>
    </Card>
  )
}
