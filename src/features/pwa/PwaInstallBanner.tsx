import { useState } from 'react'
import { usePwaInstall } from './usePwaInstall'
import { Button } from '@/components/ui/Button'

export function PwaInstallBanner() {
  const { isInstallable, isInstalled, isIosSafari, installApp } = usePwaInstall()
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return sessionStorage.getItem('clippr_pwa_dismissed') === 'true'
  })

  if (isInstalled || isDismissed) return null
  if (!isInstallable && !isIosSafari) return null

  const handleDismiss = () => {
    sessionStorage.setItem('clippr_pwa_dismissed', 'true')
    setIsDismissed(true)
  }

  return (
    <div
      role="region"
      aria-label="Install app banner"
      className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-md rounded-2xl border border-brand-400/40 bg-surface-900/95 p-4 text-white shadow-2xl backdrop-blur sm:bottom-6"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/20 text-xl text-brand-400">
          ✂️
        </div>

        <div className="flex-1 space-y-1">
          <h3 className="text-sm font-bold tracking-tight text-white">Install Clippr</h3>
          {isInstallable ? (
            <p className="text-xs text-slate-300">
              Install as a Progressive Web App for offline access, instant launch, and full-screen view.
            </p>
          ) : (
            <p className="text-xs text-slate-300">
              To install on iPhone/iPad: tap the <strong>Share</strong> button (
              <span className="font-mono">⎋</span>) in Safari, then tap{' '}
              <strong>'Add to Home Screen'</strong> (
              <span className="font-mono">⊕</span>).
            </p>
          )}

          <div className="flex items-center gap-2 pt-2">
            {isInstallable && (
              <Button
                variant="primary"
                size="sm"
                className="text-xs font-semibold py-1.5"
                onClick={() => void installApp()}
              >
                Install App
              </Button>
            )}
            <button
              type="button"
              onClick={handleDismiss}
              className="text-xs text-slate-400 hover:text-white px-2 py-1.5"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
