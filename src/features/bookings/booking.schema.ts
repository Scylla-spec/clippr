import * as z from 'zod'
import { normalizePhone, isValidPhone } from '@/lib/phone'

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
  bookingDate: z.string().min(1, 'Date is required'), // YYYY-MM-DD
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
