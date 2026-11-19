import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SegmentedControl } from '@/components/ui/SegmentedControl'

const options = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
]

function ControlledSegmentedControl({ onChange }: { onChange?: (value: string) => void }) {
  const [value, setValue] = useState('week')
  return (
    <SegmentedControl
      label="Booking period"
      options={options}
      value={value}
      onChange={(nextValue) => {
        setValue(nextValue)
        onChange?.(nextValue)
      }}
    />
  )
}

describe('SegmentedControl', () => {
  it('exposes a labelled radio group with one selected option', () => {
    render(<ControlledSegmentedControl />)

    expect(screen.getByRole('radiogroup', { name: 'Booking period' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Week' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Month' })).toHaveAttribute('aria-checked', 'false')
  })

  it('moves selection and focus with arrow keys', () => {
    const onChange = vi.fn()
    render(<ControlledSegmentedControl onChange={onChange} />)

    const week = screen.getByRole('radio', { name: 'Week' })
    week.focus()
    fireEvent.keyDown(week, { key: 'ArrowRight' })

    const month = screen.getByRole('radio', { name: 'Month' })
    expect(onChange).toHaveBeenCalledWith('month')
    expect(month).toHaveFocus()
    expect(month).toHaveAttribute('aria-checked', 'true')
  })
})
