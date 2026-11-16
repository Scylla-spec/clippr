import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/useAuth'
import { buildQueueView, type QueueView, canTransition } from '@/features/bookings/queue'
import { toHarareDateString } from '@/lib/dates'
import { REALTIME_FALLBACK_INTERVAL_MS } from '@/lib/constants'
import type { TodayQueueRow, BookingStatus } from '@/lib/database.types'

export const BARBER_QUEUE_QUERY_KEY = ['barber-today-queue'] as const

/**
 * Custom hook that loads and live-subscribes to today's queue for a barber.
 * Uses the today_queue SQL view (which enforces Africa/Harare daily boundaries).
 */
export function useBarberQueue() {
  const { user } = useAuth()
  const barberId = user?.id
  const queryClient = useQueryClient()
  const [isLiveConnected, setIsLiveConnected] = useState(false)
  const [lastAnnouncement, setLastAnnouncement] = useState<string>('')

  // 1. TanStack Query for queue state
  const queueQuery = useQuery({
    queryKey: [...BARBER_QUEUE_QUERY_KEY, barberId],
    enabled: Boolean(barberId),
    queryFn: async (): Promise<QueueView> => {
      if (!barberId) {
        return { nowServing: null, upNext: null, remaining: [], completed: [] }
      }

      try {
        const { data, error } = await supabase
          .from('today_queue')
          .select('*')
          .eq('barber_id', barberId)

        if (error) throw error

        const rows = (data as unknown as TodayQueueRow[]) ?? []
        return buildQueueView(rows)
      } catch (err) {
        if (import.meta.env.VITE_SUPABASE_URL?.includes('demo-barbershop')) {
          const now = new Date()
          const harareToday = toHarareDateString(now)
          const demoRows: TodayQueueRow[] = [
            {
              id: '30000000-0000-0000-0000-000000000001',
              barber_id: barberId,
              client_id: '20000000-0000-0000-0000-000000000001',
              service_id: '10000000-0000-0000-0000-000000000001',
              start_time: `${harareToday}T08:00:00Z`,
              end_time: `${harareToday}T08:30:00Z`,
              status: 'in_service',
              source: 'appointment',
              created_by: '00000000-0000-0000-0000-000000000001',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              client_name: 'Farai Mutasa',
              client_phone: '+263771234567',
              service_name: 'Standard Haircut',
              duration_min: 30,
              price: 5.0,
              barber_name: user?.profile?.full_name || 'Tendai Moyo',
              queue_bucket: 1,
              in_service_first: 0,
            },
            {
              id: '30000000-0000-0000-0000-000000000002',
              barber_id: barberId,
              client_id: '20000000-0000-0000-0000-000000000002',
              service_id: '10000000-0000-0000-0000-000000000004',
              start_time: `${harareToday}T08:30:00Z`,
              end_time: `${harareToday}T09:15:00Z`,
              status: 'waiting',
              source: 'walk_in',
              created_by: '00000000-0000-0000-0000-000000000001',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              client_name: 'Simba Ncube',
              client_phone: '+263772345678',
              service_name: 'Cut & Beard Combo',
              duration_min: 45,
              price: 8.0,
              barber_name: user?.profile?.full_name || 'Tendai Moyo',
              queue_bucket: 1,
              in_service_first: 1,
            },
            {
              id: '30000000-0000-0000-0000-000000000004',
              barber_id: barberId,
              client_id: '20000000-0000-0000-0000-000000000004',
              service_id: '10000000-0000-0000-0000-000000000002',
              start_time: `${harareToday}T09:30:00Z`,
              end_time: `${harareToday}T09:55:00Z`,
              status: 'booked',
              source: 'appointment',
              created_by: '00000000-0000-0000-0000-000000000001',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              client_name: 'Blessing Moyo',
              client_phone: '+263774567890',
              service_name: 'Hot Towel Shave',
              duration_min: 25,
              price: 4.0,
              barber_name: user?.profile?.full_name || 'Tendai Moyo',
              queue_bucket: 1,
              in_service_first: 1,
            },
          ]
          return buildQueueView(demoRows)
        }
        throw err
      }
    },
    // Conservative refetch interval as fallback on mobile connections
    refetchInterval: REALTIME_FALLBACK_INTERVAL_MS,
  })

  // 2. Realtime subscription to the bookings table
  useEffect(() => {
    if (!barberId) return

    const channelName = `barber-queue-${barberId}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `barber_id=eq.${barberId}`,
        },
        (payload) => {
          // Announce change for screen readers via aria-live
          if (payload.eventType === 'INSERT') {
            setLastAnnouncement('New client added to your queue')
            toast('New client added to queue', { icon: '🔔' })
          } else if (payload.eventType === 'UPDATE') {
            const newStatus = (payload.new as { status?: string }).status
            setLastAnnouncement(`Booking status updated to ${newStatus ?? ''}`)
          }

          // Invalidate cache to trigger re-computation of queue view
          void queryClient.invalidateQueries({
            queryKey: [...BARBER_QUEUE_QUERY_KEY, barberId],
          })
        },
      )
      .subscribe((status) => {
        setIsLiveConnected(status === 'SUBSCRIBED')
      })

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [barberId, queryClient])

  // 3. Status mutation (Start, Complete, No-show, etc.)
  const updateStatusMutation = useMutation({
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
        throw new Error(`Cannot change status from ${currentStatus} to ${newStatus}`)
      }

      const { data, error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        if (error.code === '23505' && error.message.includes('bookings_one_in_service_per_barber')) {
          throw new Error('You are already serving a client. Complete the current service first.')
        }
        throw error
      }

      return data
    },
    onSuccess: (data) => {
      const label = data.status.replace('_', ' ')
      toast.success(`Client marked as ${label}`)
      void queryClient.invalidateQueries({
        queryKey: [...BARBER_QUEUE_QUERY_KEY, barberId],
      })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update status')
    },
  })

  return {
    ...queueQuery,
    isLiveConnected,
    lastAnnouncement,
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdating: updateStatusMutation.isPending,
  }
}
