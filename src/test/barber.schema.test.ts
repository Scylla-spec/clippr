import { describe, it, expect } from 'vitest'
import { createBarberSchema } from '@/features/barbers/barber.schema'

describe('createBarberSchema', () => {
  it('validates a complete barber creation payload', () => {
    const result = createBarberSchema.safeParse({
      fullName: '  Tinashe Hove  ',
      email: 'Tinashe@InfinityBarbers.local',
      password: 'password123',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.fullName).toBe('Tinashe Hove')
      expect(result.data.email).toBe('tinashe@infinitybarbers.local')
      expect(result.data.password).toBe('password123')
    }
  })

  it('rejects passwords under 8 characters', () => {
    const result = createBarberSchema.safeParse({
      fullName: 'Tinashe Hove',
      email: 'tinashe@infinitybarbers.local',
      password: '1234567', // 7 chars
    })

    expect(result.success).toBe(false)
  })

  it('rejects passwords exceeding 72 characters', () => {
    const result = createBarberSchema.safeParse({
      fullName: 'Tinashe Hove',
      email: 'tinashe@infinitybarbers.local',
      password: 'a'.repeat(73),
    })

    expect(result.success).toBe(false)
  })

  it('rejects invalid email formats', () => {
    const result = createBarberSchema.safeParse({
      fullName: 'Tinashe Hove',
      email: 'tinashe',
      password: 'password123',
    })

    expect(result.success).toBe(false)
  })

  it('rejects emails exceeding 255 characters', () => {
    const result = createBarberSchema.safeParse({
      fullName: 'Tinashe Hove',
      email: `${'a'.repeat(250)}@infinitybarbers.local`,
      password: 'password123',
    })

    expect(result.success).toBe(false)
  })

  it('rejects empty fullName', () => {
    const result = createBarberSchema.safeParse({
      fullName: '   ',
      email: 'tinashe@infinitybarbers.local',
      password: 'password123',
    })

    expect(result.success).toBe(false)
  })

  it('rejects fullName exceeding 100 characters', () => {
    const result = createBarberSchema.safeParse({
      fullName: 'a'.repeat(101),
      email: 'tinashe@infinitybarbers.local',
      password: 'password123',
    })

    expect(result.success).toBe(false)
  })
})
