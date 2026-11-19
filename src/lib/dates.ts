import { format, parseISO } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import { APP_TIMEZONE } from './constants'

/**
 * Converts a UTC ISO string (or Date) to a Date representing local time in Africa/Harare.
 */
export function toHarareTime(utcDateOrIso: Date | string): Date {
  const date = typeof utcDateOrIso === 'string' ? parseISO(utcDateOrIso) : utcDateOrIso
  return toZonedTime(date, APP_TIMEZONE)
}

/**
 * Converts a local date/time in Africa/Harare to a UTC ISO string for database storage.
 */
export function fromHarareToUtcIso(harareDate: Date): string {
  const utcDate = fromZonedTime(harareDate, APP_TIMEZONE)
  return utcDate.toISOString()
}

/**
 * Formats a UTC ISO timestamp into a user-friendly local time string (e.g. "09:30 AM" or "2:15 PM").
 */
export function formatTimeInHarare(utcIso: string): string {
  const localDate = toHarareTime(utcIso)
  return format(localDate, 'hh:mm a')
}

/**
 * Formats a UTC ISO timestamp into a readable date string in Africa/Harare (e.g. "Sat, 15 Nov 2026").
 */
export function formatDateInHarare(utcIso: string): string {
  const localDate = toHarareTime(utcIso)
  return format(localDate, 'EEE, dd MMM yyyy')
}

/**
 * Formats the current date for the compact mobile app bar (e.g. "Thu 19 Nov").
 */
export function formatShortDateInHarare(date: Date = new Date()): string {
  return format(toHarareTime(date), 'EEE d MMM')
}

export function getHarareGreeting(date: Date = new Date()): string {
  const hour = toHarareTime(date).getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

/**
 * Formats a UTC ISO timestamp into YYYY-MM-DD in Africa/Harare.
 */
export function toHarareDateString(date: Date = new Date()): string {
  const localDate = toHarareTime(date)
  return format(localDate, 'yyyy-MM-dd')
}

/**
 * Returns the start and end of day in UTC for a given calendar date in Africa/Harare.
 * Example: for "2026-11-15", returns:
 * start: 2026-11-14T22:00:00.000Z
 * end:   2026-11-15T21:59:59.999Z
 */
export function getHarareDayBoundsUtc(dateString: string): { startUtc: string; endUtc: string } {
  // Parse date string at midnight local time
  const [year, month, day] = dateString.split('-').map(Number)
  if (!year || !month || !day) {
    throw new Error(`Invalid date string: ${dateString}. Expected yyyy-MM-dd`)
  }

  // Construct local midnight in Harare
  const localMidnight = new Date(year, month - 1, day, 0, 0, 0, 0)
  const localEndOfDay = new Date(year, month - 1, day, 23, 59, 59, 999)

  const startUtc = fromZonedTime(localMidnight, APP_TIMEZONE).toISOString()
  const endUtc = fromZonedTime(localEndOfDay, APP_TIMEZONE).toISOString()

  return { startUtc, endUtc }
}
