import { useEffect, useRef, type KeyboardEvent, type ReactNode, type TouchEvent } from 'react'
import { X } from 'lucide-react'

interface MobileDrawerProps {
  id?: string
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function MobileDrawer({ id, isOpen, onClose, title, children }: MobileDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const touchStartXRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isOpen) return

    returnFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeButtonRef.current?.focus()

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
      returnFocusRef.current?.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }

    if (event.key !== 'Tab') return

    const focusableElements = drawerRef.current?.querySelectorAll<HTMLElement>(focusableSelector)
    if (!focusableElements?.length) {
      event.preventDefault()
      return
    }

    const first = focusableElements[0]
    const last = focusableElements[focusableElements.length - 1]

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div className="fixed inset-0 z-80 lg:hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 h-full w-full cursor-default bg-black/55"
        onClick={onClose}
      />
      <div
        id={id}
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={handleKeyDown}
        onClick={(event) => event.stopPropagation()}
        onTouchStart={(event: TouchEvent<HTMLDivElement>) => {
          touchStartXRef.current = event.changedTouches[0]?.clientX ?? null
        }}
        onTouchEnd={(event: TouchEvent<HTMLDivElement>) => {
          const startX = touchStartXRef.current
          const endX = event.changedTouches[0]?.clientX
          if (startX !== null && endX !== undefined && startX - endX > 80) onClose()
          touchStartXRef.current = null
        }}
        className="relative z-10 h-[100dvh] w-[min(18rem,88vw)] overflow-y-auto bg-sidebar shadow-ui-lg"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close navigation menu"
          className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-20 inline-flex h-12 w-12 items-center justify-center rounded-ui-md text-sidebar-text hover:bg-sidebar-hover hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        {children}
      </div>
    </div>
  )
}
