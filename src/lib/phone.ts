/**
 * phone.ts — Phone number normalisation utilities.
 *
 * Rules (in order):
 *  1. Strip all non-digit, non-+ characters.
 *  2. If starts with '00', replace with '+'.
 *  3. If starts with '0' and no country code, assume Zimbabwe (+263).
 *  4. If no leading '+', assume Zimbabwe (+263) and prepend.
 *  5. Validate E.164 format: + followed by 7–15 digits.
 *
 * Examples:
 *  '0771234567'     → '+263771234567'
 *  '263771234567'   → '+263771234567'
 *  '00263771234567' → '+263771234567'
 *  '+263771234567'  → '+263771234567'   (already normalised)
 *  '+447911123456'  → '+447911123456'   (UK number, kept as-is)
 */

import { ZW_COUNTRY_CODE } from './constants'

const E164_REGEX = /^\+[1-9]\d{6,14}$/

export function normalizePhone(raw: string): string {
  // Step 1: strip whitespace, dashes, brackets, dots
  let phone = raw.replace(/[\s\-().]/g, '')

  // Step 2: 00 prefix → +
  if (phone.startsWith('00')) {
    phone = '+' + phone.slice(2)
  }

  // Step 3: leading 0 (local format, e.g. Zimbabwe 07xx) → +263 7xx
  // But only if there is no leading +
  if (phone.startsWith('0') && !phone.startsWith('0+')) {
    phone = ZW_COUNTRY_CODE + phone.slice(1)
  }

  // Step 4: no leading + at all → assume Zimbabwe
  if (!phone.startsWith('+')) {
    phone = ZW_COUNTRY_CODE + phone
  }

  return phone
}

export function isValidPhone(phone: string): boolean {
  return E164_REGEX.test(phone)
}

/**
 * Normalise and validate in one step.
 * Returns the normalised E.164 string, or throws if invalid.
 */
export function parsePhone(raw: string): string {
  const normalized = normalizePhone(raw)
  if (!isValidPhone(normalized)) {
    throw new Error(
      `Invalid phone number: "${raw}". Expected E.164 format (e.g. +263771234567 or 0771234567).`,
    )
  }
  return normalized
}
