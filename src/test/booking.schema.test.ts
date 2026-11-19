import { describe, it, expect } from 'vitest'
import { createBookingSchema, walkInSchema } from '@/features/bookings/booking.schema'

describe('createBookingSchema', () => {
  it('validates and normalizes phone number on valid appointment input', () => {
    const result = createBookingSchema.safeParse({
      clientName: '  Farai Mutasa  ',
      clientPhone: '0771234567',
      barberId: '00000000-0000-0000-0000-000000000002',
      serviceId: '10000000-0000-0000-0000-000000000001',
      bookingDate: '2026-11-15',
      bookingTime: '10:30',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.clientName).toBe('Farai Mutasa')
      expect(result.data.clientPhone).toBe('+263771234567')
    }
  })

  it('rejects invalid time format', () => {
    const result = createBookingSchema.safeParse({
      clientName: 'Farai Mutasa',
      clientPhone: '0771234567',
      barberId: '00000000-0000-0000-0000-000000000002',
      serviceId: '10000000-0000-0000-0000-000000000001',
      bookingDate: '2026-11-15',
      bookingTime: '25:00', // invalid hour
    })

    expect(result.success).toBe(false)
  })

  it('rejects invalid barberId uuid', () => {
    const result = createBookingSchema.safeParse({
      clientName: 'Farai Mutasa',
      clientPhone: '0771234567',
      barberId: 'not-a-uuid',
      serviceId: '10000000-0000-0000-0000-000000000001',
      bookingDate: '2026-11-15',
      bookingTime: '10:00',
    })

    expect(result.success).toBe(false)
  })

  it('rejects impossible calendar dates', () => {
    const result = createBookingSchema.safeParse({
      clientName: 'Farai Mutasa',
      clientPhone: '0771234567',
      barberId: '00000000-0000-0000-0000-000000000002',
      serviceId: '10000000-0000-0000-0000-000000000001',
      bookingDate: '2026-02-30',
      bookingTime: '10:30',
    })

    expect(result.success).toBe(false)
  })
})

describe('walkInSchema', () => {
  it('validates valid walk-in payload', () => {
    const result = walkInSchema.safeParse({
      clientName: 'Blessing Dube',
      clientPhone: '+263772000002',
      barberId: '00000000-0000-0000-0000-000000000002',
      serviceId: '10000000-0000-0000-0000-000000000002',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.clientPhone).toBe('+263772000002')
    }
  })

  it('rejects invalid phone', () => {
    const result = walkInSchema.safeParse({
      clientName: 'Blessing Dube',
      clientPhone: 'invalid-phone',
      barberId: '00000000-0000-0000-0000-000000000002',
      serviceId: '10000000-0000-0000-0000-000000000002',
    })

    expect(result.success).toBe(false)
  })
})
