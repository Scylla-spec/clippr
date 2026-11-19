import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ForbiddenPage from '@/components/pages/ForbiddenPage'
import * as authModule from '@/features/auth/useAuth'

vi.mock('@/features/auth/useAuth')

describe('ForbiddenPage', () => {
  it('explains which account role is required', () => {
    vi.spyOn(authModule, 'useAuth').mockReturnValue({
      user: {
        id: 'barber-1',
        email: 'barber@example.com',
        profile: {
          id: 'barber-1',
          full_name: 'Tinashe Hove',
          role: 'barber',
          is_active: true,
          created_at: new Date().toISOString(),
        },
      },
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    })

    render(
      <MemoryRouter>
        <ForbiddenPage />
      </MemoryRouter>,
    )

    expect(screen.getByText(/barber@example.com.*as barber/i)).toBeInTheDocument()
    expect(screen.getByText(/only an active administrator/i)).toBeInTheDocument()
    expect(screen.getByText(/assign your account the active admin role/i)).toBeInTheDocument()
  })
})
