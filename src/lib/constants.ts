/**
 * constants.ts — App-wide constants.
 */

/** The timezone used for display throughout the app. */
export const APP_TIMEZONE = 'Africa/Harare' as const

/** Zimbabwe country code for phone normalisation. */
export const ZW_COUNTRY_CODE = '+263' as const

/** Default booking duration if service duration is unknown. */
export const DEFAULT_DURATION_MIN = 30

/** Polling interval for realtime fallback (ms). */
export const REALTIME_FALLBACK_INTERVAL_MS = 30_000
