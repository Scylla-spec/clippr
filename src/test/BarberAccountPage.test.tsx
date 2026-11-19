import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BarberAccountPage } from '@/features/account/AccountSettingsPage'

const { signOut } = vi.hoisted(() => ({ signOut: vi.fn() }))
vi.mock('@/features/auth/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'barber-1',
      email: 'barber@example.com',
      profile: { full_name: 'Tendai Moyo' },
    },
    refreshProfile: vi.fn(),
    signOut,
  }),
}))

function CurrentPath() {
  const { pathname } = useLocation()
  return <output aria-label="Current path">{pathname}</output>
}

describe('BarberAccountPage', () => {
  beforeEach(() => {
    signOut.mockReset()
    signOut.mockResolvedValue(undefined)
  })

  it('shows a sign-out action and redirects to login after signing out', async () => {
    render(
      <MemoryRouter initialEntries={['/barber/account']}>
        <BarberAccountPage />
        <CurrentPath />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: /Sign out/i }))

    await waitFor(() => expect(signOut).toHaveBeenCalledOnce())
    expect(await screen.findByLabelText('Current path')).toHaveTextContent('/login')
  })
})
