import { describe, it, expect } from 'vitest'
import { createBarberSchema } from '@/features/barbers/barber.schema'

describe('createBarberSchema', () => {
  it('validates a complete barber creation payload', () => {
    const result = createBarberSchema.safeParse({
      fullName: '  Tinashe Hove  ',
      email: 'Tinashe@Clippr.local',
      password: 'password123',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.fullName).toBe('Tinashe Hove')
      expect(result.data.email).toBe('tinashe@clippr.local')
      expect(result.data.password).toBe('password123')
    }
  })

  it('rejects short passwords', () => {
    const result = createBarberSchema.safeParse({
      fullName: 'Tinashe Hove',
      email: 'tinashe@clippr.local',
      password: '12345',
    })

    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = createBarberSchema.safeParse({
      fullName: 'Tinashe Hove',
      email: 'tinashe',
      password: 'password123',
    })

    expect(result.success).toBe(false)
  })

  it('rejects empty fullName', () => {
    const result = createBarberSchema.safeParse({
      fullName: '   ',
      email: 'tinashe@clippr.local',
      password: 'password123',
    })

    expect(result.success).toBe(false)
  })
})
