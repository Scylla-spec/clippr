import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MobileDrawer } from '@/components/layout/MobileDrawer'

function DrawerHarness({ onClose }: { onClose?: () => void }) {
  const [isOpen, setIsOpen] = useState(false)

  const close = () => {
    onClose?.()
    setIsOpen(false)
  }

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)}>
        Open drawer
      </button>
      <MobileDrawer isOpen={isOpen} onClose={close} title="Test navigation">
        <button type="button">First item</button>
        <button type="button">Last item</button>
      </MobileDrawer>
    </>
  )
}

describe('MobileDrawer', () => {
  it('moves focus into the drawer and restores it when Escape closes it', () => {
    const onClose = vi.fn()
    render(<DrawerHarness onClose={onClose} />)

    const opener = screen.getByRole('button', { name: 'Open drawer' })
    opener.focus()
    fireEvent.click(opener)

    const dialog = screen.getByRole('dialog', { name: 'Test navigation' })
    expect(screen.getByRole('button', { name: 'Close navigation menu' })).toHaveFocus()

    fireEvent.keyDown(dialog, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledOnce()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
  })

  it('keeps keyboard focus within the open drawer', () => {
    render(<DrawerHarness />)
    fireEvent.click(screen.getByRole('button', { name: 'Open drawer' }))

    const closeButton = screen.getByRole('button', { name: 'Close navigation menu' })
    const lastItem = screen.getByRole('button', { name: 'Last item' })
    closeButton.focus()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab', shiftKey: true })

    expect(lastItem).toHaveFocus()
  })
})
