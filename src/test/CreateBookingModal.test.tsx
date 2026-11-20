import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateBookingModal } from '@/features/bookings/CreateBookingModal'
import * as servicesHook from '@/features/services/useServices'
import * as barbersHook from '@/features/barbers/useBarbers'
import type { Service, Profile } from '@/lib/database.types'
import { toHarareDateString } from '@/lib/dates'

vi.mock('@/features/services/useServices')
vi.mock('@/features/barbers/useBarbers')
vi.mock('@/features/bookings/useBookings', () => ({
  useDayBookings: () => ({ data: [] }),
}))

const { maybeSingle } = vi.hoisted(() => ({
  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
}))
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle }),
      }),
    }),
  },
}))

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
    full_name: 'Alex Smith',
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
    } as unknown as ReturnType<typeof servicesHook.useServices>)

    vi.spyOn(barbersHook, 'useBarbers').mockReturnValue({
      data: mockBarbers,
      isLoading: false,
    } as unknown as ReturnType<typeof barbersHook.useBarbers>)
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
    expect(screen.getByLabelText(/Phone number/i)).toHaveAttribute('type', 'tel')
    expect(screen.getByLabelText(/Client name/i)).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Service' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Barber' })).toBeInTheDocument()
  })

  it('validates required fields before submitting', async () => {
    const handleSubmit = vi.fn()
    render(<CreateBookingModal isOpen={true} onClose={vi.fn()} onSubmit={handleSubmit} />)

    const submitBtn = screen.getByRole('button', { name: /Save appointment/i })
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
        initialDate={toHarareDateString()}
      />,
    )

    await userEvent.type(screen.getByLabelText(/Client name/i), 'Farai Mutasa')
    await userEvent.type(screen.getByLabelText(/Phone number/i), '0771234567')

    await userEvent.click(screen.getByRole('button', { name: /Haircut.*30 min/i }))
    await userEvent.click(screen.getByRole('button', { name: /Alex Smith/i }))

    const timeChoices = await within(
      screen.getByRole('group', { name: /Free times with Alex Smith/ }),
    ).findAllByRole('button', { name: /\d{1,2}:\d{2} [AP]M/ })
    await userEvent.click(timeChoices[0])
    await userEvent.click(screen.getByRole('button', { name: /Save appointment/i }))

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        clientName: 'Farai Mutasa',
        clientPhone: '+263771234567',
        barberId: '00000000-0000-0000-0000-000000000002',
        serviceId: '10000000-0000-0000-0000-000000000001',
        bookingDate: toHarareDateString(),
      }),
    )
  })
})
