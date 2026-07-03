import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import {
  loginUser,
  logoutUser,
  registerUser,
} from '@/shared/services/auth.service'

import type {
  AuthState,
  AuthError,
  LoginPayload,
  RegisterPayload,
  Session,
} from '@/shared/types/auth.types'

import { Permission } from '@/shared/types/auth.types'

const AUTH_STORE_KEY = 'erp_auth'

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session:   null,
      isLoading: false,
      error:     null,

      login: async (payload: LoginPayload) => {
        set({ isLoading: true, error: null })

        try {
          const session: Session = await loginUser(payload)
          set({ session, isLoading: false })
        } catch (err) {
          set({
            error:     err as AuthError,
            isLoading: false,
          })
        }
      },

      register: async (payload: RegisterPayload) => {
        set({ isLoading: true, error: null })

        try {
          const session: Session = await registerUser(payload)
          set({ session, isLoading: false })
        } catch (err) {
          set({
            error:     err as AuthError,
            isLoading: false,
          })
        }
      },

      logout: () => {
        logoutUser()
        set({
          session:   null,
          isLoading: false,
          error:     null,
        })
      },

      clearError: () => set({ error: null }),

      hasPermission: (permission: Permission): boolean => {
        const { session } = get()
        if (!session) return false
        return session.permissions.includes(permission)
      },
    }),
    {
      name: AUTH_STORE_KEY,
      storage: createJSONStorage(() => localStorage),
      // Only the session survives refreshes; loading/error are request state.
      partialize: (state) => ({
        session: state.session,
      }),
    }
  )
)

export const selectSession     = (s: AuthState): AuthState['session']   => s.session
export const selectAuthLoading = (s: AuthState): AuthState['isLoading'] => s.isLoading
export const selectAuthError   = (s: AuthState): AuthState['error']     => s.error

export const selectIsAuthenticated = (s: AuthState): boolean => s.session !== null

export const selectCompanyId = (s: AuthState): string | null =>
  s.session?.companyId ?? null
