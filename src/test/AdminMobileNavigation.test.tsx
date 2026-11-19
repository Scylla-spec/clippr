import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AdminBottomNav, AdminFab } from '@/features/admin/AdminMobileNavigation'

function CurrentPath() {
  const location = useLocation()
  return <output aria-label="Current path">{location.pathname}</output>
}

describe('AdminBottomNav', () => {
  it('shows labeled tabs and marks the active tab as the current page', () => {
    render(
      <MemoryRouter initialEntries={['/admin/walk-ins']}>
        <AdminBottomNav />
      </MemoryRouter>,
    )

    expect(screen.getByRole('navigation', { name: 'Admin navigation' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/admin/dashboard')
    expect(screen.getByRole('link', { name: 'Bookings' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Customers' })).toHaveAttribute(
      'href',
      '/admin/customers',
    )
    expect(screen.getByRole('link', { name: 'More' })).toHaveAttribute('href', '/admin/more')
  })
})

describe('AdminFab', () => {
  it('opens the action sheet and navigates to the selected booking flow', () => {
    const onSelect = vi.fn()
    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <AdminFab onSelect={onSelect} />
        <Routes>
          <Route path="*" element={<CurrentPath />} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Create booking' }))
    expect(screen.getByRole('dialog', { name: 'Create a booking' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Add walk-in/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /New appointment/ })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Add walk-in/ }))
    expect(onSelect).toHaveBeenCalledWith('/admin/walk-ins')
  })
})
