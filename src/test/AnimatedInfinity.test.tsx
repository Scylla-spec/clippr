import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AnimatedInfinity } from '@/components/brand/AnimatedInfinity'

describe('AnimatedInfinity', () => {
  it('keeps the mark decorative and sized to fit the existing login layout', () => {
    const { container } = render(<AnimatedInfinity size={72} />)
    const mark = container.querySelector('svg')

    expect(mark).not.toBeNull()
    expect(mark).toHaveAttribute('width', '72')
    expect(mark).toHaveAttribute('height', '36')
    expect(mark).toHaveAttribute('aria-hidden', 'true')
    expect(mark?.querySelector('animateMotion')).not.toBeNull()
  })

  it('renders a static mark when animation is disabled', () => {
    const { container } = render(<AnimatedInfinity size={72} animate={false} />)

    expect(container.querySelector('animateMotion')).toBeNull()
    expect(container.querySelector('.inf-mark--animated')).toBeNull()
  })
})
