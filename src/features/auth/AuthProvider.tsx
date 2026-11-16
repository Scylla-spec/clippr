import { type ReactNode, useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { AuthUser, SignInCredentials, UserProfile } from './auth.types'
import { AuthContext } from './useAuth'

const INACTIVE_OR_MISSING_PROFILE_MSG =
  'This account is inactive or not set up. Contact the shop admin.'

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
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          logger.warn('Sign-in failed', error.message)
          return { error: error.message }
        }

        if (!data.user) {
          return { error: 'No user returned from authentication' }
        }

        const profile = await fetchProfile(data.user.id)

        if (!profile || !profile.is_active) {
          await supabase.auth.signOut()
          return { error: INACTIVE_OR_MISSING_PROFILE_MSG }
        }

        if (data.session) {
          setUser(sessionToAuthUser(data.session, profile))
        }

        return {}
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'An unexpected error occurred'
        return { error: msg }
      }
    },
    [],
  )

  useEffect(() => {
    let isMounted = true

    // Initialize session on mount
    void supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return

      if (session) {
        const profile = await fetchProfile(session.user.id)
        if (!isMounted) return

        if (!profile || !profile.is_active) {
          toast.error(INACTIVE_OR_MISSING_PROFILE_MSG)
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

        if (!profile || !profile.is_active) {
          toast.error(INACTIVE_OR_MISSING_PROFILE_MSG)
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
