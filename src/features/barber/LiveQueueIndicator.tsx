interface LiveQueueIndicatorProps {
  isConnected: boolean
  lastAnnouncement?: string
}

export function LiveQueueIndicator({ isConnected, lastAnnouncement }: LiveQueueIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:bg-surface-800 dark:text-slate-300">
        <span
          className={`h-2 w-2 rounded-full ${
            isConnected ? 'bg-green-500 animate-pulse' : 'bg-amber-500'
          }`}
          aria-hidden="true"
        />
        <span>{isConnected ? 'Live sync' : 'Polling mode'}</span>
      </span>

      {/* Screen reader live updates */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {lastAnnouncement}
      </div>
    </div>
  )
}
