/**
 * database.types.ts
 *
 * Hand-written to match the schema defined in migrations 00001–00005.
 * After Step 2 is applied to a local Supabase instance, regenerate with:
 *
 *   pnpm supabase gen types typescript --local > src/lib/database.types.ts
 *
 * and commit the result.  This file is a faithful pre-generated version.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          role: Database['public']['Enums']['user_role']
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          role?: Database['public']['Enums']['user_role']
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: Database['public']['Enums']['user_role']
          is_active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      services: {
        Row: {
          id: string
          name: string
          duration_min: number
          price: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          duration_min: number
          price?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          duration_min?: number
          price?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          id: string
          full_name: string
          phone: string
          created_at: string
        }
        Insert: {
          id?: string
          full_name: string
          phone: string
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string
          created_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          id: string
          client_id: string
          barber_id: string
          service_id: string
          start_time: string
          end_time: string
          status: Database['public']['Enums']['booking_status']
          source: Database['public']['Enums']['booking_source']
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          barber_id: string
          service_id: string
          /** start_time is required; end_time is derived by trigger */
          start_time: string
          /** end_time is set by trigger; pass a placeholder or omit */
          end_time?: string
          status?: Database['public']['Enums']['booking_status']
          source?: Database['public']['Enums']['booking_source']
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          barber_id?: string
          service_id?: string
          start_time?: string
          end_time?: string
          status?: Database['public']['Enums']['booking_status']
          source?: Database['public']['Enums']['booking_source']
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'bookings_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bookings_barber_id_fkey'
            columns: ['barber_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bookings_service_id_fkey'
            columns: ['service_id']
            isOneToOne: false
            referencedRelation: 'services'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bookings_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      today_queue: {
        Row: {
          id: string
          client_id: string
          barber_id: string
          service_id: string
          start_time: string
          end_time: string
          status: Database['public']['Enums']['booking_status']
          source: Database['public']['Enums']['booking_source']
          created_by: string
          created_at: string
          updated_at: string
          client_name: string
          client_phone: string
          service_name: string
          duration_min: number
          price: number
          barber_name: string
          queue_bucket: number
          in_service_first: number
        }
        Relationships: []
      }
    }
    Functions: {
      auth_role: {
        Args: Record<string, never>
        Returns: Database['public']['Enums']['user_role']
      }
    }
    Enums: {
      booking_status: 'booked' | 'waiting' | 'in_service' | 'done' | 'no_show' | 'cancelled'
      booking_source: 'appointment' | 'walk_in'
      user_role: 'admin' | 'barber'
    }
    CompositeTypes: Record<string, never>
  }
}

// ── Convenience type aliases ────────────────────────────────────────────────

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type Views<T extends keyof Database['public']['Views']> =
  Database['public']['Views'][T]['Row']

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]

// ── Domain types (used throughout the app) ──────────────────────────────────

export type Profile = Tables<'profiles'>
export type Service = Tables<'services'>
export type Client = Tables<'clients'>
export type Booking = Tables<'bookings'>
export type TodayQueueRow = Views<'today_queue'>

export type BookingStatus = Enums<'booking_status'>
export type BookingSource = Enums<'booking_source'>
export type UserRole = Enums<'user_role'>
