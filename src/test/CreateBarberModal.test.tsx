import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateBarberModal } from '@/features/barbers/CreateBarberModal'

describe('CreateBarberModal', () => {
  it('shows the barber credentials after successful creation', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<CreateBarberModal isOpen onClose={vi.fn()} onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText(/Full Name/), 'Tinashe Hove')
    await userEvent.type(screen.getByLabelText(/Login Email/), 'tinashe@example.com')
    await userEvent.type(screen.getByLabelText(/Temporary Password/), 'safe-password-123')
    await userEvent.click(screen.getByRole('button', { name: 'Create Barber Account' }))

    expect(await screen.findByText('Barber account created')).toBeInTheDocument()
    expect(onSubmit).toHaveBeenCalledWith({
      fullName: 'Tinashe Hove',
      email: 'tinashe@example.com',
      password: 'safe-password-123',
    })
    expect(screen.getByLabelText('Login email')).toHaveValue('tinashe@example.com')
    expect(screen.getByLabelText('Temporary password')).toHaveValue('safe-password-123')
  })

  it('keeps the form open and shows the creation error when submission fails', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Permission denied'))
    render(<CreateBarberModal isOpen onClose={vi.fn()} onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText(/Full Name/), 'Tinashe Hove')
    await userEvent.type(screen.getByLabelText(/Login Email/), 'tinashe@example.com')
    await userEvent.type(screen.getByLabelText(/Temporary Password/), 'safe-password-123')
    await userEvent.click(screen.getByRole('button', { name: 'Create Barber Account' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Permission denied')
    expect(screen.getByRole('button', { name: 'Create Barber Account' })).toBeInTheDocument()
  })
})
