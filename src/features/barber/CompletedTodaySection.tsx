import { useState } from 'react'
import type { TodayQueueRow } from '@/lib/database.types'
import { formatTimeInHarare } from '@/lib/dates'
import { Card, CardBody } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'

interface CompletedTodaySectionProps {
  completed: TodayQueueRow[]
}

export function CompletedTodaySection({ completed }: CompletedTodaySectionProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (completed.length === 0) return null

  const doneCount = completed.filter((c) => c.status === 'done').length

  return (
    <div className="pt-2">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between py-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <span>
          Completed Today ({completed.length}) • {doneCount} served
        </span>
        <span>{isOpen ? '▲ Hide' : '▼ Show'}</span>
      </button>

      {isOpen && (
        <div className="mt-2 space-y-2">
          {completed.map((booking) => (
            <Card key={booking.id} className="opacity-70 bg-slate-50/80 dark:bg-surface-800/50">
              <CardBody className="p-3 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-surface-900 dark:text-white">
                      {booking.client_name}
                    </span>
                    <StatusBadge status={booking.status} />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">
                    {formatTimeInHarare(booking.start_time)} • {booking.service_name} • ${Number(booking.price).toFixed(2)}
                  </p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
