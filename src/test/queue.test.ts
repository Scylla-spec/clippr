/**
 * queue.test.ts — Unit tests for queue logic.
 */

import { describe, it, expect } from 'vitest'
import { buildQueueView, getNextAvailableSlot, canTransition } from '@/features/bookings/queue'
import type { TodayQueueRow } from '@/lib/database.types'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRow(overrides: Partial<TodayQueueRow> & { status: TodayQueueRow['status'] }): TodayQueueRow {
  return {
    id: crypto.randomUUID(),
    client_id: 'client-1',
    barber_id: 'barber-1',
    service_id: 'svc-1',
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 30 * 60_000).toISOString(),
    source: 'appointment',
    created_by: 'admin-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    client_name: 'Test Client',
    client_phone: '+263771000001',
    service_name: 'Haircut',
    duration_min: 30,
    price: 5,
    barber_name: 'Alex',
    queue_bucket: 0,
    in_service_first: 0,
    ...overrides,
  }
}

function makeTime(offsetMinutes: number): string {
  return new Date(Date.now() + offsetMinutes * 60_000).toISOString()
}

// ── buildQueueView ────────────────────────────────────────────────────────────

describe('buildQueueView', () => {
  it('returns empty queue when no rows', () => {
    const view = buildQueueView([])
    expect(view.nowServing).toBeNull()
    expect(view.upNext).toBeNull()
    expect(view.remaining).toHaveLength(0)
    expect(view.completed).toHaveLength(0)
  })

  it('places in_service booking as nowServing', () => {
    const rows = [
      makeRow({ status: 'booked',     start_time: makeTime(10) }),
      makeRow({ status: 'in_service', start_time: makeTime(-5) }),
      makeRow({ status: 'booked',     start_time: makeTime(40) }),
    ]
    const view = buildQueueView(rows)
    expect(view.nowServing?.status).toBe('in_service')
    expect(view.upNext?.status).toBe('booked')
    expect(view.remaining).toHaveLength(1)
  })

  it('orders booked/waiting by start_time', () => {
    const rows = [
      makeRow({ id: 'b', status: 'booked', start_time: makeTime(30) }),
      makeRow({ id: 'a', status: 'booked', start_time: makeTime(10) }),
      makeRow({ id: 'c', status: 'booked', start_time: makeTime(60) }),
    ]
    const view = buildQueueView(rows)
    expect(view.upNext?.id).toBe('a')
    expect(view.remaining[0]?.id).toBe('b')
    expect(view.remaining[1]?.id).toBe('c')
  })

  it('puts terminal statuses in completed', () => {
    const rows = [
      makeRow({ status: 'done',      start_time: makeTime(-60) }),
      makeRow({ status: 'cancelled', start_time: makeTime(-30) }),
      makeRow({ status: 'no_show',   start_time: makeTime(-45) }),
    ]
    const view = buildQueueView(rows)
    expect(view.nowServing).toBeNull()
    expect(view.upNext).toBeNull()
    expect(view.completed).toHaveLength(3)
  })

  it('in_service beats booked even with earlier start_time', () => {
    const inService = makeRow({ id: 'is', status: 'in_service', start_time: makeTime(5) })
    const booked    = makeRow({ id: 'b',  status: 'booked',     start_time: makeTime(-10) })
    const view = buildQueueView([booked, inService])
    expect(view.nowServing?.id).toBe('is')
    expect(view.upNext?.id).toBe('b')
  })

  it('handles null nowServing when no in_service booking', () => {
    const rows = [
      makeRow({ status: 'booked', start_time: makeTime(10) }),
      makeRow({ status: 'waiting', start_time: makeTime(5) }),
    ]
    const view = buildQueueView(rows)
    expect(view.nowServing).toBeNull()
    // upNext should be the waiting one (earlier start)
    expect(view.upNext?.status).toBe('waiting')
  })
})

// ── getNextAvailableSlot ──────────────────────────────────────────────────────

describe('getNextAvailableSlot', () => {
  it('returns fromTime when no bookings', () => {
    const from = new Date()
    const slot = getNextAvailableSlot([], 30, from)
    expect(slot.getTime()).toBe(from.getTime())
  })

  it('returns fromTime when no overlap', () => {
    const from = new Date(Date.now() + 120 * 60_000) // 2h from now
    const bookings = [
      { start_time: makeTime(10), end_time: makeTime(40) },
    ]
    const slot = getNextAvailableSlot(bookings, 30, from)
    expect(slot.getTime()).toBe(from.getTime())
  })

  it('pushes slot past overlapping booking', () => {
    const from = new Date() // right now
    const bookings = [
      { start_time: makeTime(-5), end_time: makeTime(25) }, // ongoing, ends in 25 min
    ]
    const slot = getNextAvailableSlot(bookings, 30, from)
    // Should start at or after the booking end
    expect(slot.getTime()).toBeGreaterThanOrEqual(new Date(bookings[0]?.end_time ?? '').getTime())
  })

  it('chains multiple overlapping bookings', () => {
    const from = new Date()
    const bookings = [
      { start_time: makeTime(-10), end_time: makeTime(20) },
      { start_time: makeTime(20),  end_time: makeTime(50) },
    ]
    const slot = getNextAvailableSlot(bookings, 30, from)
    // Must be after the second booking ends
    expect(slot.getTime()).toBeGreaterThanOrEqual(new Date(bookings[1]?.end_time ?? '').getTime())
  })
})

// ── canTransition ─────────────────────────────────────────────────────────────

describe('canTransition', () => {
  it('allows booked → in_service', () => {
    expect(canTransition('booked', 'in_service')).toBe(true)
  })

  it('allows in_service → done', () => {
    expect(canTransition('in_service', 'done')).toBe(true)
  })

  it('denies booked → done (must go via in_service)', () => {
    expect(canTransition('booked', 'done')).toBe(false)
  })

  it('denies done → booked (terminal)', () => {
    expect(canTransition('done', 'booked')).toBe(false)
  })

  it('denies cancelled → anything', () => {
    expect(canTransition('cancelled', 'booked')).toBe(false)
    expect(canTransition('cancelled', 'waiting')).toBe(false)
  })

  it('denies no_show → anything', () => {
    expect(canTransition('no_show', 'booked')).toBe(false)
  })

  it('allows waiting → no_show', () => {
    expect(canTransition('waiting', 'no_show')).toBe(true)
  })

  it('allows booked → no_show', () => {
    expect(canTransition('booked', 'no_show')).toBe(true)
  })
})
