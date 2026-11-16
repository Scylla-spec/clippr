import { describe, it, expect } from 'vitest'
import {
  getHarareDayBoundsUtc,
  formatTimeInHarare,
} from '@/lib/dates'

describe('dates utilities', () => {
  it('formats Harare day bounds correctly for UTC conversion', () => {
    const { startUtc, endUtc } = getHarareDayBoundsUtc('2026-11-15')

    // Since Harare is UTC+2, midnight 2026-11-15 Harare is 2026-11-14 22:00:00 UTC
    expect(startUtc).toBe('2026-11-14T22:00:00.000Z')
    // End of day is 2026-11-15 21:59:59.999 UTC
    expect(endUtc).toBe('2026-11-15T21:59:59.999Z')
  })

  it('formats UTC timestamp into Harare local time', () => {
    // 07:30 UTC = 09:30 AM in Harare (UTC+2)
    const timeStr = formatTimeInHarare('2026-11-15T07:30:00.000Z')
    expect(timeStr).toMatch(/09:30\s*(AM|am)/)
  })

  it('throws on invalid date string format', () => {
    expect(() => getHarareDayBoundsUtc('invalid-date')).toThrow(/Invalid date string/)
  })
})
