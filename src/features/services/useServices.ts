import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import type { Service } from '@/lib/database.types'
import type { ServiceFormData } from './service.schema'

export const SERVICES_QUERY_KEY = ['services'] as const

/**
 * Fetch all services. When includeInactive is true, queries all (for admin);
 * otherwise RLS or filter limits to active services.
 */
export function useServices(includeInactive = true) {
  return useQuery({
    queryKey: [...SERVICES_QUERY_KEY, { includeInactive }],
    queryFn: async (): Promise<Service[]> => {
      let query = supabase
        .from('services')
        .select('*')
        .order('name', { ascending: true })

      if (!includeInactive) {
        query = query.eq('is_active', true)
      }

      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
  })
}

export function useCreateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ServiceFormData) => {
      const { data, error } = await supabase
        .from('services')
        .insert({
          name: input.name,
          duration_min: input.duration_min,
          price: input.price,
          is_active: input.is_active,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast.success('Service created')
      void queryClient.invalidateQueries({ queryKey: SERVICES_QUERY_KEY })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create service')
    },
  })
}

export function useUpdateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ServiceFormData> }) => {
      const { data: updated, error } = await supabase
        .from('services')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return updated
    },
    onSuccess: () => {
      toast.success('Service updated')
      void queryClient.invalidateQueries({ queryKey: SERVICES_QUERY_KEY })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update service')
    },
  })
}

export function useToggleServiceActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('services')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      toast.success(`Service ${data.is_active ? 'activated' : 'deactivated'}`)
      void queryClient.invalidateQueries({ queryKey: SERVICES_QUERY_KEY })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to change service status')
    },
  })
}
