import type { TodayQueueRow } from '@/lib/database.types'
import { formatTimeInHarare } from '@/lib/dates'
import { Card, CardBody } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'

interface UpcomingQueueListProps {
  bookings: TodayQueueRow[]
  onNoShow: (booking: TodayQueueRow) => void
}

export function UpcomingQueueList({ bookings, onNoShow }: UpcomingQueueListProps) {
  if (bookings.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Later Today ({bookings.length})
      </h3>

      <div className="space-y-2">
        {bookings.map((booking, idx) => (
          <Card key={booking.id} className="transition-shadow hover:shadow-sm">
            <CardBody className="p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 dark:bg-surface-700 dark:text-slate-300">
                  #{idx + 2}
                </span>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-surface-900 dark:text-white">
                      {booking.client_name}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        booking.source === 'walk_in'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                      }`}
                    >
                      {booking.source === 'walk_in' ? 'Walk-in' : 'Appt'}
                    </span>
                    <StatusBadge status={booking.status} />
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    🕒 {formatTimeInHarare(booking.start_time)} • 💈 {booking.service_name} ({booking.duration_min}m) • 📞 {booking.client_phone}
                  </p>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => onNoShow(booking)}
                  className="text-xs font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400 p-2 min-h-touch"
                >
                  No-show
                </button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}
