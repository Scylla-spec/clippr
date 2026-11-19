import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { clearRuntimeCaches } from '@/lib/cache'
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
  const currentUserIdRef = useRef<string | null>(null)

  const clearAllCaches = useCallback(async () => {
    try {
      await queryClient.resetQueries()
      queryClient.clear()
    } catch (e) {
      logger.error('Failed to clear query cache', e)
    }
    await clearRuntimeCaches()
  }, [queryClient])

  const handleUserIdChange = useCallback(
    async (newUserId: string | null) => {
      if (currentUserIdRef.current !== null && currentUserIdRef.current !== newUserId) {
        await clearAllCaches()
      }
      currentUserIdRef.current = newUserId
    },
    [clearAllCaches],
  )

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      logger.error('Sign out error', err)
    } finally {
      setUser(null)
      currentUserIdRef.current = null
      await clearAllCaches()
    }
  }, [clearAllCaches])

  const refreshProfile = useCallback(async () => {
    const userId = currentUserIdRef.current
    if (!userId) return

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    setUser((current) => (current?.id === userId ? { ...current, profile: data } : current))
  }, [])

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
          currentUserIdRef.current = null
          await clearAllCaches()
          return { error: INACTIVE_OR_MISSING_PROFILE_MSG }
        }

        if (data.session) {
          await handleUserIdChange(data.session.user.id)
          setUser(sessionToAuthUser(data.session, profile))
        }

        return {}
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'An unexpected error occurred'
        return { error: msg }
      }
    },
    [clearAllCaches, handleUserIdChange],
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
          currentUserIdRef.current = null
          await clearAllCaches()
        } else {
          await handleUserIdChange(session.user.id)
          setUser(sessionToAuthUser(session, profile))
        }
      } else {
        setUser(null)
        await handleUserIdChange(null)
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
          currentUserIdRef.current = null
          await clearAllCaches()
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
          currentUserIdRef.current = null
          await clearAllCaches()
        } else {
          await handleUserIdChange(session.user.id)
          setUser(sessionToAuthUser(session, profile))
        }
        setIsLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [clearAllCaches, handleUserIdChange])

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}
