import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateBookingModal } from '@/features/bookings/CreateBookingModal'
import * as servicesHook from '@/features/services/useServices'
import * as barbersHook from '@/features/barbers/useBarbers'
import type { Service, Profile } from '@/lib/database.types'

vi.mock('@/features/services/useServices')
vi.mock('@/features/barbers/useBarbers')

const mockServices: Service[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    name: 'Haircut',
    duration_min: 30,
    price: 5.0,
    is_active: true,
    created_at: new Date().toISOString(),
  },
]

const mockBarbers: Profile[] = [
  {
    id: '00000000-0000-0000-0000-000000000002',
    full_name: 'Tendai Moyo',
    role: 'barber',
    is_active: true,
    created_at: new Date().toISOString(),
  },
]

describe('CreateBookingModal', () => {
  beforeEach(() => {
    vi.spyOn(servicesHook, 'useServices').mockReturnValue({
      data: mockServices,
      isLoading: false,
    } as any)

    vi.spyOn(barbersHook, 'useBarbers').mockReturnValue({
      data: mockBarbers,
      isLoading: false,
    } as any)
  })

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <CreateBookingModal isOpen={false} onClose={vi.fn()} onSubmit={vi.fn()} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders form inputs when isOpen is true', () => {
    render(<CreateBookingModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText(/Client Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Barber/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Service/i)).toBeInTheDocument()
  })

  it('validates required fields before submitting', async () => {
    const handleSubmit = vi.fn()
    render(<CreateBookingModal isOpen={true} onClose={vi.fn()} onSubmit={handleSubmit} />)

    const submitBtn = screen.getByRole('button', { name: /Book Appointment/i })
    await userEvent.click(submitBtn)

    expect(handleSubmit).not.toHaveBeenCalled()
    expect(await screen.findByText(/Client name is required/i)).toBeInTheDocument()
  })

  it('calls onSubmit with normalized data when form is valid', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined)
    const handleClose = vi.fn()

    render(
      <CreateBookingModal
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
        initialDate="2026-11-15"
      />,
    )

    await userEvent.type(screen.getByLabelText(/Client Name/i), 'Farai Mutasa')
    await userEvent.type(screen.getByLabelText(/Phone Number/i), '0771234567')

    await userEvent.selectOptions(
      screen.getByLabelText(/^Barber/i),
      '00000000-0000-0000-0000-000000000002',
    )
    await userEvent.selectOptions(
      screen.getByLabelText(/^Service/i),
      '10000000-0000-0000-0000-000000000001',
    )

    const submitBtn = screen.getByRole('button', { name: /Book Appointment/i })
    await userEvent.click(submitBtn)

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        clientName: 'Farai Mutasa',
        clientPhone: '+263771234567', // Normalized to E.164!
        barberId: '00000000-0000-0000-0000-000000000002',
        serviceId: '10000000-0000-0000-0000-000000000001',
      }),
    )
  })
})
