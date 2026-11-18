/**
 * utils.test.ts — Smoke tests for the utility functions established in Step 1.
 * More comprehensive tests added in Step 8.
 */

import { describe, it, expect } from 'vitest'
import { cn, assertNever } from '@/lib/utils'

describe('cn (class merger)', () => {
  it('merges classes', () => {
    expect(cn('px-2', 'py-2')).toBe('px-2 py-2')
  })

  it('resolves Tailwind conflicts (last wins)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('filters falsy values', () => {
    expect(cn('px-2', undefined, null, '')).toBe('px-2')
  })

  it('handles conditional classes', () => {
    const isActive = true
    expect(cn('base', isActive && 'active')).toBe('base active')
  })
})

describe('assertNever', () => {
  it('throws when called', () => {
    expect(() => assertNever('unexpected' as never)).toThrow()
  })
})
