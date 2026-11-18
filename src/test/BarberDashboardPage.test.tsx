import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BarberDashboardPage from '@/features/barber/BarberDashboardPage'
import * as authHook from '@/features/auth/useAuth'
import * as queueHook from '@/features/barber/useBarberQueue'
import type { QueueView } from '@/features/bookings/queue'

vi.mock('@/features/auth/useAuth')
vi.mock('@/features/barber/useBarberQueue')

const mockQueue: QueueView = {
  nowServing: {
    id: 'b-1',
    client_id: 'c-1',
    barber_id: 'barber-1',
    service_id: 's-1',
    start_time: '2026-11-15T08:00:00.000Z',
    end_time: '2026-11-15T08:30:00.000Z',
    status: 'in_service',
    source: 'walk_in',
    created_by: 'admin-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    client_name: 'Blessing Dube',
    client_phone: '+263772000002',
    service_name: 'Hot Towel Shave',
    duration_min: 20,
    price: 3.0,
    barber_name: 'Tendai Moyo',
    queue_bucket: 0,
    in_service_first: 0,
  },
  upNext: {
    id: 'b-2',
    client_id: 'c-2',
    barber_id: 'barber-1',
    service_id: 's-2',
    start_time: '2026-11-15T09:00:00.000Z',
    end_time: '2026-11-15T09:30:00.000Z',
    status: 'booked',
    source: 'appointment',
    created_by: 'admin-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    client_name: 'Farai Mutasa',
    client_phone: '+263771000001',
    service_name: 'Haircut',
    duration_min: 30,
    price: 5.0,
    barber_name: 'Tendai Moyo',
    queue_bucket: 0,
    in_service_first: 1,
  },
  remaining: [],
  completed: [],
}

describe('BarberDashboardPage', () => {
  const mockUpdateStatus = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      user: {
        id: 'barber-1',
        email: 'tendai@infinitybarbers.local',
        profile: {
          id: 'barber-1',
          full_name: 'Tendai Moyo',
          role: 'barber',
          is_active: true,
          created_at: new Date().toISOString(),
        },
      },
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    })

    vi.spyOn(queueHook, 'useBarberQueue').mockReturnValue({
      data: mockQueue,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isLiveConnected: true,
      lastAnnouncement: '',
      updateStatus: mockUpdateStatus,
      isUpdating: false,
    } as unknown as ReturnType<typeof queueHook.useBarberQueue>)
  })

  it('renders barber chair title and barber name', () => {
    render(<BarberDashboardPage />)

    expect(screen.getByRole('heading', { level: 1, name: /My Chair/i })).toBeInTheDocument()
    expect(screen.getByText(/Tendai Moyo/i)).toBeInTheDocument()
    expect(screen.getByText(/Live sync/i)).toBeInTheDocument()
  })

  it('renders Now Serving card with client details and complete action', async () => {
    render(<BarberDashboardPage />)

    expect(screen.getByText('Blessing Dube')).toBeInTheDocument()
    const completeBtn = screen.getByRole('button', { name: /Complete Service/i })
    await userEvent.click(completeBtn)

    expect(mockUpdateStatus).toHaveBeenCalledWith({
      id: 'b-1',
      currentStatus: 'in_service',
      newStatus: 'done',
    })
  })

  it('opens confirmation modal and updates status when marking no-show', async () => {
    render(<BarberDashboardPage />)

    const noShowBtn = screen.getByRole('button', { name: /No-show/i })
    await userEvent.click(noShowBtn)

    expect(screen.getByText(/Are you sure you want to mark Farai Mutasa as a no-show/i)).toBeInTheDocument()

    const confirmBtn = screen.getByRole('button', { name: /Confirm No-show/i })
    await userEvent.click(confirmBtn)

    expect(mockUpdateStatus).toHaveBeenCalledWith({
      id: 'b-2',
      currentStatus: 'booked',
      newStatus: 'no_show',
    })
  })
})
