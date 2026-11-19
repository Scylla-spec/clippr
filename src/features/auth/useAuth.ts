import { createContext, useContext } from 'react'
import type { AuthUser, SignInCredentials } from './auth.types'

export interface AuthContextValue {
  /** The currently authenticated user with attached profile, or null */
  user: AuthUser | null
  /** True while the initial auth session or profile is being resolved */
  isLoading: boolean
  /** Authenticate with email + password */
  signIn: (creds: SignInCredentials) => Promise<{ error?: string }>
  /** Sign out and clear all cached data */
  signOut: () => Promise<void>
  /** Refresh the signed-in user's profile after an account update */
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/**
 * useAuth — consume the auth context.
 * Throws if used outside <AuthProvider>.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (ctx === undefined) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return ctx
}
