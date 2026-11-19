import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { BottomNav } from '@/features/barber/BottomNav'

describe('BottomNav', () => {
  it('marks Queue as active and links to history and account pages', () => {
    render(
      <MemoryRouter initialEntries={['/barber/dashboard']}>
        <BottomNav />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Queue' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'History' })).toHaveAttribute('href', '/barber/history')
    expect(screen.getByRole('link', { name: 'Account' })).toHaveAttribute('href', '/barber/account')
  })
})
