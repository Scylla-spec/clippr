/**
 * utils.ts — General-purpose utility functions.
 * Keep this file small; feature-specific utils live in their feature folder.
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes safely (handles conflicts like 'p-2 p-4' → 'p-4').
 * This is the standard pattern from shadcn/ui.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Assert that a value is never reached (for exhaustive switch checks).
 * Throws at runtime if somehow reached.
 */
export function assertNever(value: never, message?: string): never {
  throw new Error(message ?? `Unhandled value: ${String(value)}`)
}

/**
 * Delay (for testing / graceful retry) — not used in production paths.
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))
