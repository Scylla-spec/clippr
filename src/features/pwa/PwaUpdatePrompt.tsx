import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'

export function PwaUpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(false)
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return

      // If already a waiting worker
      if (reg.waiting) {
        setNeedRefresh(true)
        setWaitingWorker(reg.waiting)
      }

      // Listen for new workers entering the installed (waiting) state
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        if (!newWorker) return

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setNeedRefresh(true)
            setWaitingWorker(newWorker)
          }
        })
      })
    })

    // Listen for controller changes to reload window
    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true
        window.location.reload()
      }
    })
  }, [])

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' })
    } else {
      window.location.reload()
    }
  }

  if (!needRefresh) return null

  return (
    <div
      role="alert"
      className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-sm rounded-xl border border-brand-500 bg-surface-900 p-4 text-white shadow-2xl animate-in slide-in-from-top-2"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">
            🔄
          </span>
          <span className="text-xs font-semibold">New version available</span>
        </div>

        <Button
          variant="primary"
          size="sm"
          className="text-xs font-bold py-1 px-3"
          onClick={handleUpdate}
        >
          Refresh Now
        </Button>
      </div>
    </div>
  )
}
