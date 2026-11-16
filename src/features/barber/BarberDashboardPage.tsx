import { useState } from 'react'
import { useAuth } from '@/features/auth/useAuth'
import { useBarberQueue } from './useBarberQueue'
import type { TodayQueueRow } from '@/lib/database.types'
import { formatDateInHarare } from '@/lib/dates'
import { NowServingCard } from './NowServingCard'
import { UpNextCard } from './UpNextCard'
import { UpcomingQueueList } from './UpcomingQueueList'
import { CompletedTodaySection } from './CompletedTodaySection'
import { LiveQueueIndicator } from './LiveQueueIndicator'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorMessage } from '@/components/ui/ErrorMessage'

export default function BarberDashboardPage() {
  const { user } = useAuth()
  const {
    data: queue,
    isLoading,
    error,
    refetch,
    isLiveConnected,
    lastAnnouncement,
    updateStatus,
    isUpdating,
  } = useBarberQueue()

  const [noShowTarget, setNoShowTarget] = useState<TodayQueueRow | null>(null)

  const todayDisplay = formatDateInHarare(new Date().toISOString())

  const handleStartService = async (booking: TodayQueueRow) => {
    await updateStatus({
      id: booking.id,
      currentStatus: booking.status,
      newStatus: 'in_service',
    })
  }

  const handleCompleteService = async (booking: TodayQueueRow) => {
    await updateStatus({
      id: booking.id,
      currentStatus: booking.status,
      newStatus: 'done',
    })
  }

  const handleConfirmNoShow = async () => {
    if (noShowTarget) {
      await updateStatus({
        id: noShowTarget.id,
        currentStatus: noShowTarget.status,
        newStatus: 'no_show',
      })
      setNoShowTarget(null)
    }
  }

  const hasAnyBookings =
    Boolean(queue?.nowServing) ||
    Boolean(queue?.upNext) ||
    (queue?.remaining.length ?? 0) > 0 ||
    (queue?.completed.length ?? 0) > 0

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white sm:text-3xl">
            My Chair
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {todayDisplay} • {user?.profile?.full_name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <LiveQueueIndicator
            isConnected={isLiveConnected}
            lastAnnouncement={lastAnnouncement}
          />
          <button
            type="button"
            onClick={() => void refetch()}
            aria-label="Refresh queue"
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 dark:border-surface-700 dark:bg-surface-800 dark:text-slate-300 min-h-touch min-w-touch flex items-center justify-center"
          >
            🔄
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Loading your queue…</p>
        </div>
      ) : error ? (
        <ErrorMessage
          message={error instanceof Error ? error.message : 'Failed to load your queue'}
          onRetry={() => void refetch()}
        />
      ) : !hasAnyBookings ? (
        <EmptyState
          icon="✂️"
          title="No bookings assigned today"
          description="Your queue is clear. Walk-ins or appointments booked by the receptionist will appear here live."
          action={
            <button
              type="button"
              onClick={() => void refetch()}
              className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
            >
              Check for updates
            </button>
          }
        />
      ) : (
        <div className="space-y-5">
          {/* 1. Hero: Now Serving */}
          <section aria-label="Now Serving">
            <NowServingCard
              booking={queue?.nowServing ?? null}
              onComplete={handleCompleteService}
              isUpdating={isUpdating}
            />
          </section>

          {/* 2. Up Next */}
          <section aria-label="Up Next">
            <UpNextCard
              booking={queue?.upNext ?? null}
              hasActiveInService={Boolean(queue?.nowServing)}
              onStartService={handleStartService}
              onNoShow={(b) => setNoShowTarget(b)}
              isUpdating={isUpdating}
            />
          </section>

          {/* 3. Later Today Queue */}
          <section aria-label="Upcoming Queue">
            <UpcomingQueueList
              bookings={queue?.remaining ?? []}
              onNoShow={(b) => setNoShowTarget(b)}
            />
          </section>

          {/* 4. Completed Today */}
          <section aria-label="Completed Today">
            <CompletedTodaySection completed={queue?.completed ?? []} />
          </section>
        </div>
      )}

      {/* No-show Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(noShowTarget)}
        title="Mark as No-show"
        description={`Are you sure you want to mark ${noShowTarget?.client_name} as a no-show? They will be removed from the active queue.`}
        confirmLabel="Confirm No-show"
        variant="danger"
        isLoading={isUpdating}
        onConfirm={handleConfirmNoShow}
        onCancel={() => setNoShowTarget(null)}
      />
    </div>
  )
}
