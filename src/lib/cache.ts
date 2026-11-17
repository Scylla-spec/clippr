import { logger } from './logger'

/**
 * Deletes all browser CacheStorage runtime caches, preserving only Workbox precache.
 * This prevents cross-user data leakage and stale cached data upon sign-out or account switch.
 */
export async function clearRuntimeCaches(): Promise<string[]> {
  if (typeof window === 'undefined' || !('caches' in window) || !window.caches) {
    return []
  }

  try {
    const keys = await window.caches.keys()
    const deleted: string[] = []

    await Promise.all(
      keys.map(async (key) => {
        // Preserve Workbox precache, delete all runtime / API / webfont caches
        if (!key.startsWith('workbox-precache')) {
          const success = await window.caches.delete(key)
          if (success) {
            deleted.push(key)
          }
        }
      }),
    )

    return deleted
  } catch (err) {
    logger.error('Failed to clear runtime caches', err)
    return []
  }
}
