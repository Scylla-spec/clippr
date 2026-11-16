import { useOnlineStatus } from './useOnlineStatus'

export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div
      role="alert"
      className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-amber-500 px-4 py-2.5 text-center text-xs sm:text-sm font-bold text-surface-950 shadow-md animate-in slide-in-from-top duration-200"
    >
      <span aria-hidden="true" className="text-base">
        📡
      </span>
      <span>
        You are offline. Showing last loaded queue in read-only mode. Write actions are disabled
        until connection is restored.
      </span>
    </div>
  )
}
