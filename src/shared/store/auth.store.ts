import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import type {
  AuthState,
  Session,
  User,
} from '@/shared/types/auth.types'

import { ROLE_PERMISSIONS, UserRole } from '@/shared/types/auth.types'

const AUTH_STORE_KEY = 'erp_auth'

export const DEFAULT_SESSION: User = {
  id:          'usr-default',
  name:        'System Admin',
  email:       'admin@erp.dev',
  role:        UserRole.SYSTEM_ADMIN,
  permissions: ROLE_PERMISSIONS[UserRole.SYSTEM_ADMIN],
  companyId:   'company-default',
  createdAt:   new Date().toISOString(),
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: DEFAULT_SESSION,

      setSession: (session: Session) => set({ session }),

      hasPermission: (permission) => {
        const { session } = get()
        if (!session) return false
        return session.permissions.includes(permission)
      },
    }),
    {
      name: AUTH_STORE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        session: state.session,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as { session?: Session } | undefined
        return {
          ...currentState,
          session: persisted?.session ?? DEFAULT_SESSION,
        }
      },
    }
  )
)

export const selectSession = (s: AuthState): AuthState['session'] => s.session

export const selectIsAuthenticated = (s: AuthState): boolean => s.session !== null

export const selectCompanyId = (s: AuthState): string | null =>
  s.session?.companyId ?? null

