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
      try {
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
      } catch (err) {
        if (import.meta.env.VITE_SUPABASE_URL?.includes('demo-barbershop')) {
          return [
            { id: '10000000-0000-0000-0000-000000000001', name: 'Standard Haircut', duration_min: 30, price: 5.0, is_active: true, created_at: new Date().toISOString() },
            { id: '10000000-0000-0000-0000-000000000002', name: 'Hot Towel Shave', duration_min: 25, price: 4.0, is_active: true, created_at: new Date().toISOString() },
            { id: '10000000-0000-0000-0000-000000000003', name: 'Beard Trim & Shape', duration_min: 20, price: 3.5, is_active: true, created_at: new Date().toISOString() },
            { id: '10000000-0000-0000-0000-000000000004', name: 'Cut & Beard Combo', duration_min: 45, price: 8.0, is_active: true, created_at: new Date().toISOString() },
          ]
        }
        throw err
      }
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
