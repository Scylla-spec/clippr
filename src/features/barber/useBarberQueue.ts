import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/useAuth'
import { buildQueueView, type QueueView, canTransition } from '@/features/bookings/queue'
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

      const { data, error } = await supabase
        .from('today_queue')
        .select('*')
        .eq('barber_id', barberId)

      if (error) throw error

      const rows = (data as unknown as TodayQueueRow[]) ?? []
      return buildQueueView(rows)
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
            toast('New client added to queue')
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
