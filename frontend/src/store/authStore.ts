import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface DocumentImages {
  driving_license_front?: string
  driving_license_back?: string
  aadhar_front?: string
  aadhar_back?: string
}

export interface User {
  id: string
  mobile_number: string
  full_name: string
  email?: string
  driving_license_number?: string
  aadhar_number?: string
  role: 'admin' | 'user' | 'driver'
  status: string
  is_verified: boolean
  has_mpin: boolean
  documents?: DocumentImages
}

interface AuthState {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        console.log('🔐 Setting auth in store:', { user: user.full_name, role: user.role, token: token.substring(0, 20) + '...' })
        set({ user, token })
      },
      logout: () => {
        console.log('🚪 Logging out')
        set({ user: null, token: null })
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)


