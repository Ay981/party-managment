// src/store/auth.store.ts
//
// Zustand store for authentication state.
// Wraps auth.service.ts functions and exposes session, loading,
// error, and actions to the rest of the app via a single hook.
//
// Persistence:
//   Uses Zustand 'persist' middleware to keep the session alive
//   across page refreshes. Reads from localStorage key 'erp_auth'.
//   Only 'session' is persisted — loading and error are always
//   reset to defaults on hydration.
//
// Usage anywhere in the app:
//   const { session, login, logout, hasPermission } = useAuthStore()
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import {
  loginUser,
  logoutUser,
  registerUser,
} from '@/lib/auth/auth.service'

import type {
  AuthState,
  AuthError,
  LoginPayload,
  RegisterPayload,
  Session,
} from '@/types/auth.types'

import { Permission } from '@/types/auth.types'


// ─── Storage Key ──────────────────────────────────────────────────────────────

/**
 * Key used by the Zustand persist middleware.
 * Separate from 'erp_session' that auth.service.ts writes directly —
 * this one is managed by Zustand and includes the full store slice.
 */
const AUTH_STORE_KEY = 'erp_auth'


// ─── Store ────────────────────────────────────────────────────────────────────

/**
 * useAuthStore — the single source of truth for auth state.
 *
 * State shape (AuthState from auth.types.ts):
 *   session      → logged in user without password, or null
 *   isLoading    → true while login/register request is in progress
 *   error        → last AuthError, cleared on next successful action
 *
 * Actions:
 *   login        → calls loginUser() from auth.service.ts
 *   register     → calls registerUser() from auth.service.ts
 *   logout       → calls logoutUser() and nulls the session
 *   clearError   → clears the error field
 *   hasPermission → checks if session.permissions includes the given permission
 *
 * Persist config:
 *   Only 'session' is persisted to localStorage.
 *   'isLoading' and 'error' always start as false/null on load.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({

      // ── Initial State ──────────────────────────────────────────────────────

      session:   null,
      isLoading: false,
      error:     null,


      // ── login ──────────────────────────────────────────────────────────────

      /**
       * Attempts to log in with email and password.
       *
       * Flow:
       *   1. Set isLoading = true, clear previous error
       *   2. Call loginUser() from auth.service.ts
       *   3. On success → set session, isLoading = false
       *   4. On failure → set error (AuthError), isLoading = false
       *
       * The caller (LoginForm) checks error after the call to show
       * the appropriate message to the user.
       *
       * Reference: LoginPayload, AuthError in auth.types.ts
       */
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


      // ── register ───────────────────────────────────────────────────────────

      /**
       * Registers a new user account and auto-logs them in on success.
       *
       * Flow:
       *   1. Set isLoading = true, clear previous error
       *   2. Call registerUser() from auth.service.ts
       *   3. On success → set session (returned by registerUser), isLoading = false
       *   4. On failure → set error, isLoading = false
       *
       * registerUser() already writes the session to localStorage and
       * returns the session object — so we just set it directly here.
       *
       * Reference: RegisterPayload, AuthError in auth.types.ts
       */
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


      // ── logout ─────────────────────────────────────────────────────────────

      /**
       * Logs out the current user.
       *
       * Flow:
       *   1. Call logoutUser() → clears 'erp_session' from localStorage
       *   2. Reset entire auth state to initial values
       *
       * After this, the Zustand persist middleware will write null
       * as the session in 'erp_auth', so the user stays logged out
       * even after a page refresh.
       *
       * Redirect to /login is handled by the layout or middleware,
       * not here — the store only manages state.
       */
      logout: () => {
        logoutUser()
        set({
          session:   null,
          isLoading: false,
          error:     null,
        })
      },


      // ── clearError ─────────────────────────────────────────────────────────

      /**
       * Clears the current error state.
       * Called when the user dismisses an error message or
       * starts typing in a form field after a failed attempt.
       */
      clearError: () => set({ error: null }),


      // ── hasPermission ──────────────────────────────────────────────────────

      /**
       * Checks if the current session has a specific permission.
       *
       * Returns false if:
       *   - No user is logged in (session is null)
       *   - The permission is not in session.permissions
       *
       * Usage examples:
       *   hasPermission(Permission.DELETE_PARTY)
       *     → controls Delete button visibility — US-06 AC-01, AC-09
       *   hasPermission(Permission.TOGGLE_PARTY)
       *     → controls Activate/Deactivate visibility — US-05 AC-7
       *
       * Reference:
       *   Permission enum        → auth.types.ts
       *   ROLE_PERMISSIONS map   → auth.types.ts
       *   US-06 Permissions section
       *   US-05 AC-7
       */
      hasPermission: (permission: Permission): boolean => {
        const { session } = get()
        if (!session) return false
        return session.permissions.includes(permission)
      },

    }),

    // ── Persist Config ─────────────────────────────────────────────────────────

    {
      name:    AUTH_STORE_KEY,

      /**
       * Use localStorage for session persistence.
       * This keeps the user logged in across page refreshes and
       * new browser tabs (same origin).
       */
      storage: createJSONStorage(() => localStorage),

      /**
       * Only persist 'session'.
       * Loading and error states are transient — they should always
       * start as false/null when the app loads, not be restored from storage.
       */
      partialize: (state) => ({
        session: state.session,
      }),
    }
  )
)


// ─── Derived Selectors ────────────────────────────────────────────────────────

/**
 * Convenience selectors to avoid re-subscribing to the full store
 * when a component only needs one piece of state.
 *
 * Usage:
 *   const session = useAuthStore(selectSession)
 *   const isLoading = useAuthStore(selectAuthLoading)
 *
 * This way the component only re-renders when that specific
 * value changes — not on every store update.
 */

export const selectSession     = (s: AuthState): AuthState['session']   => s.session
export const selectAuthLoading = (s: AuthState): AuthState['isLoading'] => s.isLoading
export const selectAuthError   = (s: AuthState): AuthState['error']     => s.error

/**
 * Returns true if there is an active session.
 * Use for protecting routes or conditionally rendering UI.
 *
 * Usage:
 *   const isAuthenticated = useAuthStore(selectIsAuthenticated)
 */
export const selectIsAuthenticated = (s: AuthState): boolean => s.session !== null

/**
 * Returns the company ID from the current session.
 * Used whenever an API call needs company_id in the path.
 *
 * Reference: API base path — /api/v1/foundation/companies/{company_id}/parties
 *
 * Usage:
 *   const companyId = useAuthStore(selectCompanyId)
 */
export const selectCompanyId = (s: AuthState): string | null =>
  s.session?.companyId ?? null
