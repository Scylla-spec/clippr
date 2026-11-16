/**
 * logger.ts
 *
 * Thin wrapper around console that:
 * - Is a no-op for debug/info in production (never logs PII).
 * - Always surfaces warn and error.
 *
 * Usage: import { logger } from '@/lib/logger'
 *        logger.debug('fetched', count)   // stripped in prod
 *        logger.error('failed', err)      // always shown
 */

const isDev = import.meta.env.DEV

export const logger = {
  debug: isDev ? console.warn.bind(console, '[debug]') : () => undefined,
  info: isDev ? console.warn.bind(console, '[info]') : () => undefined,
  warn: console.warn.bind(console, '[warn]'),
  error: console.error.bind(console, '[error]'),
} as const
