import { type ReactNode, useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { AuthUser, SignInCredentials, UserProfile } from './auth.types'
import { AuthContext } from './useAuth'

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      logger.error('Failed to fetch profile', error.message)
      return null
    }

    return data as UserProfile | null
  } catch (err) {
    logger.error('Unexpected error fetching profile', err)
    return null
  }
}

function sessionToAuthUser(session: Session, profile: UserProfile | null): AuthUser {
  return {
    id: session.user.id,
    email: session.user.email,
    profile,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const clearAuthCache = useCallback(async () => {
    try {
      await queryClient.resetQueries()
      queryClient.clear()
    } catch (e) {
      logger.error('Failed to clear query cache', e)
    }
  }, [queryClient])

  const signOut = useCallback(async () => {
    try {
      localStorage.removeItem('clippr_demo_user')
      await supabase.auth.signOut()
    } catch (err) {
      logger.error('Sign out error', err)
    } finally {
      setUser(null)
      await clearAuthCache()
    }
  }, [clearAuthCache])

  const signIn = useCallback(
    async ({ email, password }: SignInCredentials): Promise<{ error?: string }> => {
      // Demo fallback helper
      const tryDemoLogin = () => {
        if (email.endsWith('@clippr.local')) {
          const role = email.startsWith('admin') ? 'admin' : 'barber'
          const name = email.startsWith('admin')
            ? 'Shop Admin'
            : email.startsWith('tendai')
            ? 'Tendai Moyo'
            : 'Rudo Chikwanda'
          const id = email.startsWith('admin')
            ? '00000000-0000-0000-0000-000000000001'
            : email.startsWith('tendai')
            ? '00000000-0000-0000-0000-000000000002'
            : '00000000-0000-0000-0000-000000000003'

          const mockUser: AuthUser = {
            id,
            email,
            profile: {
              id,
              role,
              full_name: name,
              is_active: true,
              created_at: new Date().toISOString(),
            },
          }
          localStorage.setItem('clippr_demo_user', JSON.stringify(mockUser))
          setUser(mockUser)
          return true
        }
        return false
      }

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          if (tryDemoLogin()) return {}
          logger.warn('Sign-in failed', error.message)
          return { error: error.message }
        }

        if (!data.user) {
          if (tryDemoLogin()) return {}
          return { error: 'No user returned from authentication' }
        }

        const profile = await fetchProfile(data.user.id)

        if (profile && !profile.is_active) {
          await supabase.auth.signOut()
          return { error: 'Your account has been deactivated. Please contact an admin.' }
        }

        if (data.session) {
          setUser(sessionToAuthUser(data.session, profile))
        }

        return {}
      } catch (err) {
        if (tryDemoLogin()) return {}
        const msg = err instanceof Error ? err.message : 'An unexpected error occurred'
        return { error: msg }
      }
    },
    [],
  )

  useEffect(() => {
    let isMounted = true

    // Check demo user in localStorage first
    const demoUser = localStorage.getItem('clippr_demo_user')
    if (demoUser) {
      try {
        const parsed = JSON.parse(demoUser)
        setUser(parsed)
        setIsLoading(false)
        return
      } catch {}
    }

    // Initialize session on mount
    void supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return

      if (session) {
        const profile = await fetchProfile(session.user.id)
        if (!isMounted) return

        if (profile && !profile.is_active) {
          toast.error('Account deactivated')
          await supabase.auth.signOut()
          setUser(null)
          await clearAuthCache()
        } else {
          setUser(sessionToAuthUser(session, profile))
        }
      } else {
        setUser(null)
      }
      setIsLoading(false)
    })

    // Subscribe to auth state updates (token refresh, sign out, sign in)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.debug('auth event', event)

      if (event === 'SIGNED_OUT' || !session) {
        if (isMounted) {
          setUser(null)
          await clearAuthCache()
          setIsLoading(false)
        }
        return
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        const profile = await fetchProfile(session.user.id)
        if (!isMounted) return

        if (profile && !profile.is_active) {
          toast.error('Account deactivated')
          await supabase.auth.signOut()
          setUser(null)
          await clearAuthCache()
        } else {
          setUser(sessionToAuthUser(session, profile))
        }
        setIsLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [clearAuthCache])

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
