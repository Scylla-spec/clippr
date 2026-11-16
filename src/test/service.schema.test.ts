import { describe, it, expect } from 'vitest'
import { serviceSchema } from '@/features/services/service.schema'

describe('serviceSchema', () => {
  it('validates valid service payload and coerces numbers', () => {
    const result = serviceSchema.safeParse({
      name: '  Skin Fade & Beard  ',
      duration_min: '45',
      price: '12.50',
      is_active: true,
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Skin Fade & Beard')
      expect(result.data.duration_min).toBe(45)
      expect(result.data.price).toBe(12.5)
    }
  })

  it('rejects negative or 0 duration', () => {
    const result = serviceSchema.safeParse({
      name: 'Quick trim',
      duration_min: 0,
      price: 5,
    })

    expect(result.success).toBe(false)
  })

  it('rejects non-integer duration', () => {
    const result = serviceSchema.safeParse({
      name: 'Quick trim',
      duration_min: 15.5,
      price: 5,
    })

    expect(result.success).toBe(false)
  })

  it('rejects negative price', () => {
    const result = serviceSchema.safeParse({
      name: 'Haircut',
      duration_min: 30,
      price: -1,
    })

    expect(result.success).toBe(false)
  })

  it('allows zero price (e.g. complimentary service)', () => {
    const result = serviceSchema.safeParse({
      name: 'Consultation',
      duration_min: 15,
      price: 0,
    })

    expect(result.success).toBe(true)
  })
})
