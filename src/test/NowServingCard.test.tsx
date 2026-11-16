import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NowServingCard } from '@/features/barber/NowServingCard'
import type { TodayQueueRow } from '@/lib/database.types'

const mockBooking: TodayQueueRow = {
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
}

describe('NowServingCard', () => {
  it('renders chair empty state when booking is null', () => {
    render(<NowServingCard booking={null} onComplete={vi.fn()} />)
    expect(screen.getByText('Chair is Currently Empty')).toBeInTheDocument()
  })

  it('renders client name and complete button when booking is active', async () => {
    const handleComplete = vi.fn()
    render(<NowServingCard booking={mockBooking} onComplete={handleComplete} />)

    expect(screen.getByText('Blessing Dube')).toBeInTheDocument()
    expect(screen.getByText(/Hot Towel Shave/)).toBeInTheDocument()

    const completeBtn = screen.getByRole('button', { name: /Complete Service/i })
    expect(completeBtn).toBeInTheDocument()

    await userEvent.click(completeBtn)
    expect(handleComplete).toHaveBeenCalledWith(mockBooking)
  })
})
