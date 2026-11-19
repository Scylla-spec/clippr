import { useState } from 'react'
import { Download, Share } from 'lucide-react'
import { usePwaInstall } from './usePwaInstall'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/brand/Logo'

export function PwaInstallBanner() {
  const { isInstallable, isInstalled, isIosSafari, installApp } = usePwaInstall()
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return sessionStorage.getItem('infinity_pwa_dismissed') === 'true'
  })

  if (isInstalled || isDismissed) return null
  if (!isInstallable && !isIosSafari) return null

  const handleDismiss = () => {
    sessionStorage.setItem('infinity_pwa_dismissed', 'true')
    setIsDismissed(true)
  }

  return (
    <div
      role="region"
      aria-label="Install app banner"
      className="bg-surface-900/95 fixed bottom-[calc(56px+env(safe-area-inset-bottom)+5rem)] left-4 right-4 z-40 mx-auto max-w-md rounded-2xl border border-brand-400/40 p-4 text-white shadow-2xl backdrop-blur lg:bottom-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/20 text-brand-400">
          <Logo size={20} showWordmark={false} />
        </div>

        <div className="flex-1 space-y-1">
          <h3 className="text-sm font-bold tracking-tight text-white">Install Infinity Barbers</h3>
          {isInstallable ? (
            <p className="text-xs text-slate-300">
              Install as a Progressive Web App for offline access, instant launch, and full-screen
              view.
            </p>
          ) : (
            <p className="text-xs text-slate-300">
              To install on iPhone/iPad: tap the <strong>Share</strong> button (
              <Share className="inline h-3.5 w-3.5 align-text-bottom" aria-hidden="true" />) in
              Safari, then tap <strong>&apos;Add to Home Screen&apos;</strong>.
            </p>
          )}

          <div className="flex items-center gap-2 pt-2">
            {isInstallable && (
              <Button
                variant="primary"
                size="sm"
                className="flex items-center gap-1.5 py-1.5 text-xs font-semibold"
                onClick={() => void installApp()}
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Install App</span>
              </Button>
            )}
            <button
              type="button"
              onClick={handleDismiss}
              className="min-h-[44px] px-2 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
