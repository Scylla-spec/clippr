/**
 * phone.test.ts — Unit tests for phone normalisation.
 */

import { describe, it, expect } from 'vitest'
import { normalizePhone, isValidPhone, parsePhone } from '@/lib/phone'

describe('normalizePhone', () => {
  it('passes through a valid E.164 number', () => {
    expect(normalizePhone('+263771234567')).toBe('+263771234567')
  })

  it('converts local ZW format (0771...)', () => {
    expect(normalizePhone('0771234567')).toBe('+263771234567')
  })

  it('converts 00 prefix to +', () => {
    expect(normalizePhone('00263771234567')).toBe('+263771234567')
  })

  it('prepends +263 when no country code', () => {
    expect(normalizePhone('263771234567')).toBe('+263263771234567') // ambiguous — treated as bare digits
    // Callers should use the local 0771... format for ZW numbers without country code
  })

  it('strips spaces', () => {
    expect(normalizePhone('+263 77 123 4567')).toBe('+263771234567')
  })

  it('strips dashes', () => {
    expect(normalizePhone('+263-77-123-4567')).toBe('+263771234567')
  })

  it('strips brackets and dots', () => {
    expect(normalizePhone('(+263) 77.123.4567')).toBe('+263771234567')
  })

  it('handles international numbers (UK)', () => {
    expect(normalizePhone('+447911123456')).toBe('+447911123456')
  })
})

describe('isValidPhone', () => {
  it('accepts valid E.164', () => {
    expect(isValidPhone('+263771234567')).toBe(true)
  })

  it('rejects number without +', () => {
    expect(isValidPhone('263771234567')).toBe(false)
  })

  it('rejects too short', () => {
    expect(isValidPhone('+12345')).toBe(false)
  })

  it('rejects too long (>15 digits)', () => {
    expect(isValidPhone('+12345678901234567')).toBe(false)
  })

  it('rejects non-digits after +', () => {
    expect(isValidPhone('+263abc1234')).toBe(false)
  })
})

describe('parsePhone', () => {
  it('returns normalised phone for valid input', () => {
    expect(parsePhone('0771234567')).toBe('+263771234567')
  })

  it('throws for invalid input', () => {
    expect(() => parsePhone('not-a-phone')).toThrow('Invalid phone number')
  })
})
