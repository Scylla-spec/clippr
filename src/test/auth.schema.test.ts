import { describe, it, expect } from 'vitest'
import { loginSchema } from '@/features/auth/auth.schema'

describe('loginSchema', () => {
  it('validates a correct email and password', () => {
    const result = loginSchema.safeParse({
      email: 'Admin@Clippr.local',
      password: 'password123',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe('admin@clippr.local') // lowercase transform
      expect(result.data.password).toBe('password123')
    }
  })

  it('rejects an invalid email format', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/valid email/i)
    }
  })

  it('rejects short passwords (< 6 characters)', () => {
    const result = loginSchema.safeParse({
      email: 'admin@clippr.local',
      password: '12345',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/at least 6 characters/i)
    }
  })

  it('rejects empty fields', () => {
    const result = loginSchema.safeParse({
      email: '',
      password: '',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThanOrEqual(2)
    }
  })
})
