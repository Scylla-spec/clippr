import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/database.types'
import type { CreateBarberFormData } from './barber.schema'

export const BARBERS_QUERY_KEY = ['barbers'] as const

/**
 * Maps edge function error responses to friendly user messages.
 */
async function mapCreateBarberError(err: unknown): Promise<string> {
  if (err instanceof Error) {
    const msg = err.message
    if ('context' in err && err.context instanceof Response) {
      try {
        const responseBody: unknown = await err.context.clone().json()
        if (
          responseBody !== null &&
          typeof responseBody === 'object' &&
          'error' in responseBody &&
          typeof responseBody.error === 'string'
        ) {
          return mapCreateBarberMessage(responseBody.error)
        }
      } catch {
        // Fall back to the SDK error when the response is not JSON.
      }
    }
    return mapCreateBarberMessage(msg)
  }
  return 'Failed to create barber account. Please try again.'
}

function mapCreateBarberMessage(msg: string): string {
  const lower = msg.toLowerCase()

  if (lower.includes('failed to send a request') || lower.includes('failed to fetch')) {
    return 'Unable to reach the server. Please verify the create-barber Edge Function is deployed.'
  }
  if (
    lower.includes('already registered') ||
    lower.includes('already exists') ||
    lower.includes('duplicate')
  ) {
    return 'A barber account with this email address already exists.'
  }
  if (lower.includes('forbidden') || lower.includes('administrator') || lower.includes('403')) {
    return 'Permission denied: Only active administrators can add barbers.'
  }
  if (lower.includes('unauthorized') || lower.includes('token') || lower.includes('401')) {
    return 'Your session has expired. Please sign in again.'
  }
  return msg
}

/**
 * Fetch all barbers (active and inactive) for admin management.
 */
export function useBarbers() {
  return useQuery({
    queryKey: BARBERS_QUERY_KEY,
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'barber')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data ?? []
    },
  })
}

/**
 * Creates a barber's login user and profile row securely via Supabase Edge Function.
 * The Edge Function verifies that the caller is an active admin.
 */
export function useCreateBarber() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateBarberFormData) => {
      const { data, error } = await supabase.functions.invoke('create-barber', {
        body: input,
      })

      if (error) {
        throw new Error(await mapCreateBarberError(error))
      }

      if (data && typeof data === 'object' && 'error' in data) {
        const serverError = new Error(String((data as { error: unknown }).error))
        throw new Error(await mapCreateBarberError(serverError))
      }

      return data
    },
    onSuccess: () => {
      toast.success('Barber account created')
      void queryClient.invalidateQueries({ queryKey: BARBERS_QUERY_KEY })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create barber')
    },
  })
}

/**
 * Toggles a barber's is_active status.
 * Allowed for admins via RLS.
 */
export function useToggleBarberActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      toast.success(`Barber ${data.is_active ? 'activated' : 'deactivated'}`)
      void queryClient.invalidateQueries({ queryKey: BARBERS_QUERY_KEY })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to change barber status')
    },
  })
}
