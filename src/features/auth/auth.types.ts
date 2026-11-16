import type { Profile, UserRole } from '@/lib/database.types'

export type { UserRole }

export type UserProfile = Profile

export interface AuthUser {
  id: string
  email: string | undefined
  profile: UserProfile | null
}

export interface SignInCredentials {
  email: string
  password: string
}
