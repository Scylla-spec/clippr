import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { RoleGuard } from '@/features/auth/RoleGuard'
import * as useAuthModule from '@/features/auth/useAuth'

vi.mock('@/features/auth/useAuth')

describe('RoleGuard', () => {
  it('redirects to /403 if user role does not match allowed roles', () => {
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: {
        id: 'user-1',
        email: 'barber@infinitybarbers.local',
        profile: {
          id: 'user-1',
          full_name: 'Barber Tendai',
          role: 'barber',
          is_active: true,
          created_at: new Date().toISOString(),
        },
      },
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route
            path="/admin/dashboard"
            element={
              <RoleGuard allowed={['admin']}>
                <div>Admin Only Secret</div>
              </RoleGuard>
            }
          />
          <Route path="/403" element={<div>Access Denied 403</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Access Denied 403')).toBeInTheDocument()
    expect(screen.queryByText('Admin Only Secret')).not.toBeInTheDocument()
  })

  it('renders children if user role matches allowed roles', () => {
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: {
        id: 'admin-1',
        email: 'admin@infinitybarbers.local',
        profile: {
          id: 'admin-1',
          full_name: 'Shop Admin',
          role: 'admin',
          is_active: true,
          created_at: new Date().toISOString(),
        },
      },
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route
            path="/admin/dashboard"
            element={
              <RoleGuard allowed={['admin']}>
                <div>Admin Only Secret</div>
              </RoleGuard>
            }
          />
          <Route path="/403" element={<div>Access Denied 403</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Admin Only Secret')).toBeInTheDocument()
  })
})
