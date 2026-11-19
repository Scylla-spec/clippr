import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AdminSidebar } from '@/features/admin/AdminSidebar'

function renderSidebar(path = '/admin/dashboard', onNavigate = vi.fn()) {
  const onSignOut = vi.fn()
  render(
    <MemoryRouter initialEntries={[path]}>
      <AdminSidebar onNavigate={onNavigate} onSignOut={onSignOut} isSigningOut={false} />
    </MemoryRouter>,
  )
  return { onNavigate, onSignOut }
}

describe('AdminSidebar', () => {
  it('marks the active dashboard link as the current page', () => {
    renderSidebar()

    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('navigation', { name: 'Admin navigation' })).toBeInTheDocument()
  })

  it('links all admin sections to their pages', () => {
    renderSidebar()

    const destinations = [
      ['Appointments', '/admin/appointments'],
      ['Walk-ins', '/admin/walk-ins'],
      ['Customers', '/admin/customers'],
      ['Barbers', '/admin/barbers'],
      ['Services', '/admin/services'],
      ['Reports', '/admin/reports'],
      ['Settings', '/admin/settings'],
    ]

    for (const [label, path] of destinations) {
      expect(screen.getByRole('link', { name: label })).toHaveAttribute('href', path)
    }
  })

  it('calls sign out when the account action is activated', () => {
    const { onSignOut } = renderSidebar()
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(onSignOut).toHaveBeenCalledOnce()
  })
})
