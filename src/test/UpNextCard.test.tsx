import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UpNextCard } from '@/features/barber/UpNextCard'
import type { TodayQueueRow } from '@/lib/database.types'

const mockBooking: TodayQueueRow = {
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
}

describe('UpNextCard', () => {
  it('renders waiting state when booking is null', () => {
    render(
      <UpNextCard
        booking={null}
        hasActiveInService={false}
        onStartService={vi.fn()}
        onNoShow={vi.fn()}
      />,
    )
    expect(screen.getByText(/No clients currently waiting/)).toBeInTheDocument()
  })

  it('disables Start Service button if barber already has an active in-service client', () => {
    render(
      <UpNextCard
        booking={mockBooking}
        hasActiveInService={true}
        onStartService={vi.fn()}
        onNoShow={vi.fn()}
      />,
    )

    const startBtn = screen.getByRole('button', { name: /Finish current service first/i })
    expect(startBtn).toBeDisabled()
  })

  it('calls onStartService when button is enabled and clicked', async () => {
    const handleStart = vi.fn()
    render(
      <UpNextCard
        booking={mockBooking}
        hasActiveInService={false}
        onStartService={handleStart}
        onNoShow={vi.fn()}
      />,
    )

    const startBtn = screen.getByRole('button', { name: /Start Service/i })
    expect(startBtn).toBeEnabled()

    await userEvent.click(startBtn)
    expect(handleStart).toHaveBeenCalledWith(mockBooking)
  })

  it('calls onNoShow when No-show button is clicked', async () => {
    const handleNoShow = vi.fn()
    render(
      <UpNextCard
        booking={mockBooking}
        hasActiveInService={false}
        onStartService={vi.fn()}
        onNoShow={handleNoShow}
      />,
    )

    const noShowBtn = screen.getByRole('button', { name: /No-show/i })
    await userEvent.click(noShowBtn)
    expect(handleNoShow).toHaveBeenCalledWith(mockBooking)
  })
})
