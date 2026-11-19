import * as z from 'zod'
import { normalizePhone, isValidPhone } from '@/lib/phone'

const harareDateSchema = z.string().refine((value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}, 'Please enter a valid calendar date')

export const createBookingSchema = z.object({
  clientName: z
    .string()
    .trim()
    .min(1, 'Client name is required')
    .max(100, 'Name must be at most 100 characters'),
  clientPhone: z
    .string()
    .min(1, 'Phone number is required')
    .refine((val) => isValidPhone(normalizePhone(val.trim())), {
      message: 'Please enter a valid phone number (e.g. 0771234567 or +263771234567)',
    })
    .transform((val) => normalizePhone(val.trim())),
  barberId: z.string().uuid('Please select a barber'),
  serviceId: z.string().uuid('Please select a service'),
  bookingDate: harareDateSchema,
  bookingTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Please select a valid time (HH:MM)'),
})

export type CreateBookingFormData = z.infer<typeof createBookingSchema>

export const walkInSchema = z.object({
  clientName: z
    .string()
    .trim()
    .min(1, 'Client name is required')
    .max(100, 'Name must be at most 100 characters'),
  clientPhone: z
    .string()
    .min(1, 'Phone number is required')
    .refine((val) => isValidPhone(normalizePhone(val.trim())), {
      message: 'Please enter a valid phone number (e.g. 0771234567 or +263771234567)',
    })
    .transform((val) => normalizePhone(val.trim())),
  barberId: z.string().uuid('Please select a barber'),
  serviceId: z.string().uuid('Please select a service'),
})

export type WalkInFormData = z.infer<typeof walkInSchema>
