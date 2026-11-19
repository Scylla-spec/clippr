import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { fromZonedTime } from 'date-fns-tz'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/useAuth'
import { APP_TIMEZONE } from '@/lib/constants'
import { getHarareDayBoundsUtc, toHarareDateString } from '@/lib/dates'
import { getNextAvailableSlot, canTransition } from './queue'
import type { BookingStatus } from '@/lib/database.types'
import type { CreateBookingFormData, WalkInFormData } from './booking.schema'

export interface BookingWithDetails {
  id: string
  client_id: string
  barber_id: string
  service_id: string
  start_time: string
  end_time: string
  status: BookingStatus
  source: 'appointment' | 'walk_in'
  created_by: string
  created_at: string
  updated_at: string
  client: {
    id: string
    full_name: string
    phone: string
  }
  service: {
    id: string
    name: string
    duration_min: number
    price: number
  }
  barber: {
    id: string
    full_name: string
  }
}

export const BOOKINGS_QUERY_KEY = ['bookings'] as const

function invalidateBookingViews(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEY })
  void queryClient.invalidateQueries({ queryKey: ['admin-dashboard-bookings'] })
  void queryClient.invalidateQueries({ queryKey: ['admin-reports'] })
  void queryClient.invalidateQueries({ queryKey: ['admin-customers'] })
}

/**
 * Fetch all bookings for a given date in Africa/Harare, optionally filtered by barber.
 */
export function useDayBookings(
  dateString: string,
  barberId?: string,
  source?: 'appointment' | 'walk_in',
) {
  return useQuery({
    queryKey: [...BOOKINGS_QUERY_KEY, { dateString, barberId, source }],
    queryFn: async (): Promise<BookingWithDetails[]> => {
      const { startUtc, endUtc } = getHarareDayBoundsUtc(dateString)

      let query = supabase
        .from('bookings')
        .select(`
          *,
          client:clients (id, full_name, phone),
          service:services (id, name, duration_min, price),
          barber:profiles!bookings_barber_id_fkey (id, full_name)
        `)
        .gte('start_time', startUtc)
        .lte('start_time', endUtc)
        .order('start_time', { ascending: true })

      if (barberId) {
        query = query.eq('barber_id', barberId)
      }
      if (source) {
        query = query.eq('source', source)
      }

      const { data, error } = await query
      if (error) throw error
      return (data as unknown as BookingWithDetails[]) ?? []
    },
    refetchInterval: 30_000,
  })
}

async function ensureActiveBookingTargets(barberId: string, serviceId: string) {
  const [barberResult, serviceResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id')
      .eq('id', barberId)
      .eq('role', 'barber')
      .eq('is_active', true)
      .maybeSingle(),
    supabase
      .from('services')
      .select('id')
      .eq('id', serviceId)
      .eq('is_active', true)
      .maybeSingle(),
  ])

  if (barberResult.error) throw barberResult.error
  if (!barberResult.data) throw new Error('This barber is no longer available')
  if (serviceResult.error) throw serviceResult.error
  if (!serviceResult.data) throw new Error('This service is no longer available')
}

/**
 * Helper: Find or create client by phone
 */
async function findOrCreateClient(fullName: string, phone: string): Promise<string> {
  // Check if client already exists by normalized phone
  const { data: existingClient, error: findError } = await supabase
    .from('clients')
    .select('id, full_name')
    .eq('phone', phone)
    .maybeSingle()

  if (findError) throw findError

  if (existingClient) {
    // If name was updated, update client record
    if (existingClient.full_name !== fullName) {
      const { error } = await supabase
        .from('clients')
        .update({ full_name: fullName })
        .eq('id', existingClient.id)
      if (error) throw error
    }
    return existingClient.id
  }

  // Insert new client
  const { data: newClient, error: createError } = await supabase
    .from('clients')
    .insert({
      full_name: fullName,
      phone,
    })
    .select('id')
    .single()

  if (createError) throw createError
  return newClient.id
}

/**
 * Create a scheduled appointment booking
 */
export function useCreateBooking() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (formData: CreateBookingFormData) => {
      if (!user) throw new Error('You must be signed in to create a booking')

      // 1. Compute start_time in UTC from Harare local date + time
      const [hours, minutes] = formData.bookingTime.split(':').map(Number)
      const [year, month, day] = formData.bookingDate.split('-').map(Number)

      if (year === undefined || month === undefined || day === undefined || hours === undefined || minutes === undefined) {
        throw new Error('Invalid date or time')
      }

      const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0)
      const startUtcIso = fromZonedTime(localDate, APP_TIMEZONE).toISOString()

      // 2. Recheck availability in case a selected barber or service was deactivated.
      await ensureActiveBookingTargets(formData.barberId, formData.serviceId)

      // 3. Find or create the client only after validation succeeds.
      const clientId = await findOrCreateClient(formData.clientName, formData.clientPhone)

      // 4. Insert booking (end_time is automatically derived by the database trigger)
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          client_id: clientId,
          barber_id: formData.barberId,
          service_id: formData.serviceId,
          start_time: startUtcIso,
          source: 'appointment',
          status: 'booked',
          created_by: user.id,
        })
        .select()
        .single()

      if (error) {
        // Check for exclusion constraint violation (overlapping booking)
        if (error.code === '23P01' || error.message.includes('bookings_no_overlap')) {
          throw new Error('The selected barber already has a booking during this time slot. Please choose another time or barber.')
        }
        throw error
      }

      return data
    },
    onSuccess: () => {
      toast.success('Appointment created')
      invalidateBookingViews(queryClient)
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create booking')
    },
  })
}

/**
 * Quick-action: Add a walk-in client
 * Automatically finds the next available slot for the barber and assigns status = 'waiting'
 */
export function useCreateWalkIn() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (formData: WalkInFormData) => {
      if (!user) throw new Error('You must be signed in to add a walk-in')

      // 1. Get service duration to compute a slot remaining today
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('duration_min')
        .eq('id', formData.serviceId)
        .eq('is_active', true)
        .single()

      if (serviceError) throw serviceError
      if (!service) throw new Error('This service is no longer available')

      // 2. Recheck barber availability in case the form was left open during deactivation.
      const { data: barber, error: barberError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', formData.barberId)
        .eq('role', 'barber')
        .eq('is_active', true)
        .maybeSingle()
      if (barberError) throw barberError
      if (!barber) throw new Error('This barber is no longer available')

      // 3. Fetch active bookings today for this barber to find the next free slot
      const now = new Date()
      const { endUtc } = getHarareDayBoundsUtc(toHarareDateString(now))
      const { data: activeBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('start_time, end_time')
        .eq('barber_id', formData.barberId)
        .not('status', 'in', '("cancelled","no_show")')
        .gte('end_time', now.toISOString())
        .lte('start_time', endUtc)
        .order('start_time', { ascending: true })

      if (bookingsError) throw bookingsError

      // Calculate fair next available start time
      const nextSlot = getNextAvailableSlot(activeBookings ?? [], service.duration_min, now)
      const latestEndOfDay = new Date(endUtc).getTime() + 1
      if (nextSlot.getTime() + service.duration_min * 60_000 > latestEndOfDay) {
        throw new Error('There are no remaining walk-in slots today. Please choose another barber or try tomorrow.')
      }

      // 4. Find or create the client only after a slot is available
      const clientId = await findOrCreateClient(formData.clientName, formData.clientPhone)

      // 5. Insert walk-in booking
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          client_id: clientId,
          barber_id: formData.barberId,
          service_id: formData.serviceId,
          start_time: nextSlot.toISOString(),
          source: 'walk_in',
          status: 'waiting',
          created_by: user.id,
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23P01' || error.message.includes('bookings_no_overlap')) {
          throw new Error('Could not automatically place walk-in due to a concurrent booking. Please try again.')
        }
        throw error
      }

      return data
    },
    onSuccess: () => {
      toast.success('Walk-in added to queue')
      invalidateBookingViews(queryClient)
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to add walk-in')
    },
  })
}

/**
 * Update the status of a booking (validated against allowed state machine)
 */
export function useUpdateBookingStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      currentStatus,
      newStatus,
    }: {
      id: string
      currentStatus: BookingStatus
      newStatus: BookingStatus
    }) => {
      if (!canTransition(currentStatus, newStatus)) {
        throw new Error(`Cannot transition booking from "${currentStatus}" to "${newStatus}"`)
      }

      const { data, error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        // Check for partial unique index: at most one in_service per barber
        if (error.code === '23505' && error.message.includes('bookings_one_in_service_per_barber')) {
          throw new Error('This barber is already currently serving a client. Complete the current service before starting another.')
        }
        throw error
      }

      return data
    },
    onSuccess: (data) => {
      toast.success(`Booking marked as ${data.status.replace('_', ' ')}`)
      invalidateBookingViews(queryClient)
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update booking status')
    },
  })
}

/**
 * Cancel a booking
 */
export function useCancelBooking() {
  const updateStatus = useUpdateBookingStatus()

  return {
    mutateAsync: (booking: { id: string; status: BookingStatus }) =>
      updateStatus.mutateAsync({
        id: booking.id,
        currentStatus: booking.status,
        newStatus: 'cancelled',
      }),
    isPending: updateStatus.isPending,
  }
}
