import * as z from 'zod'

export const serviceSchema = z.object({
  name: z
    .string()
    .min(1, 'Service name is required')
    .max(100, 'Service name must be at most 100 characters')
    .transform((val) => val.trim()),
  duration_min: z.coerce
    .number({ invalid_type_error: 'Duration must be a number' })
    .int('Duration must be a whole number')
    .positive('Duration must be at least 1 minute')
    .max(480, 'Duration cannot exceed 8 hours (480 minutes)'),
  price: z.coerce
    .number({ invalid_type_error: 'Price must be a number' })
    .min(0, 'Price cannot be negative')
    .max(10000, 'Price must be realistic'),
  is_active: z.boolean().default(true),
})

export type ServiceFormData = z.infer<typeof serviceSchema>
