import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OfflineBanner } from '@/features/pwa/OfflineBanner'
import * as onlineModule from '@/features/pwa/useOnlineStatus'

vi.mock('@/features/pwa/useOnlineStatus')

describe('OfflineBanner', () => {
  it('renders nothing when online', () => {
    vi.spyOn(onlineModule, 'useOnlineStatus').mockReturnValue(true)
    const { container } = render(<OfflineBanner />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders warning message when offline', () => {
    vi.spyOn(onlineModule, 'useOnlineStatus').mockReturnValue(false)
    render(<OfflineBanner />)

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/You are offline/i)).toBeInTheDocument()
    expect(screen.getByText(/read-only mode/i)).toBeInTheDocument()
  })
})
