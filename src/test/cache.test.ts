import { describe, it, expect, vi, beforeEach } from 'vitest'
import { clearRuntimeCaches } from '@/lib/cache'

describe('clearRuntimeCaches', () => {
  let mockCaches: Record<string, boolean>

  beforeEach(() => {
    mockCaches = {
      'infinity-api-cache': true,
      'infinity-webfonts': true,
      'workbox-precache-v2-http://localhost:5173/': true,
      'workbox-precache-assets': true,
      'other-runtime-cache': true,
    }

    const mockCacheStorage = {
      keys: vi.fn().mockImplementation(async () => Object.keys(mockCaches)),
      delete: vi.fn().mockImplementation(async (name: string) => {
        if (name in mockCaches) {
          delete mockCaches[name]
          return true
        }
        return false
      }),
    }

    vi.stubGlobal('caches', mockCacheStorage)
  })

  it('deletes all runtime caches on sign-out while preserving workbox precache', async () => {
    const deleted = await clearRuntimeCaches()

    // Should delete all caches not starting with workbox-precache
    expect(deleted).toContain('infinity-api-cache')
    expect(deleted).toContain('infinity-webfonts')
    expect(deleted).toContain('other-runtime-cache')
    expect(deleted).not.toContain('workbox-precache-v2-http://localhost:5173/')
    expect(deleted).not.toContain('workbox-precache-assets')

    // Workbox precaches must remain untouched in CacheStorage
    expect(mockCaches['workbox-precache-v2-http://localhost:5173/']).toBe(true)
    expect(mockCaches['workbox-precache-assets']).toBe(true)

    // Runtime caches must have been deleted
    expect(mockCaches['infinity-api-cache']).toBeUndefined()
    expect(mockCaches['infinity-webfonts']).toBeUndefined()
    expect(mockCaches['other-runtime-cache']).toBeUndefined()
  })

  it('handles environment without window.caches gracefully', async () => {
    vi.stubGlobal('caches', undefined)
    const result = await clearRuntimeCaches()
    expect(result).toEqual([])
  })
})
