import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/database.types'
import type { CreateBarberFormData } from './barber.schema'

export const BARBERS_QUERY_KEY = ['barbers'] as const

/**
 * Fetch all barbers (active and inactive) for admin management.
 */
export function useBarbers() {
  return useQuery({
    queryKey: BARBERS_QUERY_KEY,
    queryFn: async (): Promise<Profile[]> => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'barber')
          .order('created_at', { ascending: false })

        if (error) throw error
        return data ?? []
      } catch (err) {
        if (import.meta.env.VITE_SUPABASE_URL?.includes('demo-barbershop')) {
          return [
            { id: '00000000-0000-0000-0000-000000000002', full_name: 'Tendai Moyo', role: 'barber', is_active: true, created_at: new Date().toISOString() },
            { id: '00000000-0000-0000-0000-000000000003', full_name: 'Rudo Chikwanda', role: 'barber', is_active: true, created_at: new Date().toISOString() },
          ]
        }
        throw err
      }
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
      // 1. Try PostgreSQL RPC stored procedure first (runs directly inside database)
      const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('create_barber', {
        new_email: input.email.trim().toLowerCase(),
        new_full_name: input.fullName.trim(),
        new_password: input.password,
      })

      if (!rpcError && rpcData) {
        return rpcData
      }

      // If RPC failed because user already exists or validation error, throw immediately
      if (rpcError && rpcError.message && !rpcError.message.includes('function') && !rpcError.message.includes('does not exist')) {
        throw new Error(rpcError.message)
      }

      // 2. Fallback to Edge Function
      const { data, error } = await supabase.functions.invoke('create-barber', {
        body: input,
      })

      if (error) {
        throw new Error(rpcError?.message || error.message || 'Failed to create barber')
      }

      // Check if function returned an error payload
      if (data && typeof data === 'object' && 'error' in data) {
        throw new Error(String(data.error))
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
