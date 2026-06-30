// src/types/auth.types.ts
//
// Type definitions for authentication and authorization.
// Source document: FR-VM-01 — Foundation Management / Party Management
//
// Roles and permissions are derived from the user story actor definitions
// and permission requirements across US-01 through US-06.
// ─────────────────────────────────────────────────────────────────────────────


// ─── Roles ────────────────────────────────────────────────────────────────────

/**
 * System roles as defined by the actors across all user stories.
 *
 * Role → User Story access:
 *   FINANCE          → US-01 (create), US-02 (update), US-03 (list), US-04 (view)
 *   PROCUREMENT      → US-01 (create), US-03 (list)
 *   SALES            → US-01 (create), US-03 (list)
 *   MASTER_DATA      → US-01 (create), US-06 (soft delete)
 *   COMPANY_ADMIN    → US-05 (activate/deactivate), US-06 (soft delete)
 *   SYSTEM_ADMIN     → US-03 (list) + full access across module
 *
 * Reference:
 *   US-01 User Story — "Finance, Procurement, Sales, or Master Data user"
 *   US-02 User Story — "Finance/Admin User"
 *   US-03 User Story — "Finance User, Procurement User, Sales User, or System Administrator"
 *   US-04 User Story — "Finance Administrator"
 *   US-05 User Story — "Company Administrator or Authorized User"
 *   US-06 User Story — "Company Administrator / Master Data Administrator"
 */
export enum UserRole {
  FINANCE       = 'FINANCE',
  PROCUREMENT   = 'PROCUREMENT',
  SALES         = 'SALES',
  MASTER_DATA   = 'MASTER_DATA',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  SYSTEM_ADMIN  = 'SYSTEM_ADMIN',
}


// ─── Permissions ──────────────────────────────────────────────────────────────

/**
 * Granular permissions checked at both UI and API layer.
 *
 * The FRD explicitly names DELETE_PARTY as a required permission for US-06.
 * The remaining permissions are inferred from the role-based access
 * described in each user story's actor definition.
 *
 * Reference:
 *   US-06 Permissions — "Required Permission: DELETE_PARTY"
 *   US-06 Permissions — "Permission checks are enforced both at the UI and API layer"
 *   US-05 AC-7        — "Activate/Deactivate actions hidden for users without permission"
 *   US-06 AC-01       — "Delete action visible only to users with DELETE_PARTY permission"
 *   US-06 AC-09       — "Delete action not displayed without DELETE_PARTY permission"
 */
export enum Permission {
  /** Create a new party — US-01 */
  CREATE_PARTY      = 'CREATE_PARTY',

  /** Update company party information — US-02 */
  UPDATE_PARTY      = 'UPDATE_PARTY',

  /** View the party list — US-03 */
  VIEW_PARTIES      = 'VIEW_PARTIES',

  /** View full party details — US-04 */
  VIEW_PARTY        = 'VIEW_PARTY',

  /** Activate or deactivate a party — US-05 */
  TOGGLE_PARTY      = 'TOGGLE_PARTY',

  /**
   * Soft delete a party — US-06
   * This is the only permission explicitly named in the FRD.
   * Hidden from UI and blocked at API layer when missing.
   */
  DELETE_PARTY      = 'DELETE_PARTY',
}

/**
 * Maps each role to the permissions it grants.
 * Used by auth.service.ts to derive permissions at login time
 * and stored on the User object for quick UI-layer checks.
 *
 * Reference: Role actor definitions across US-01 through US-06
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.FINANCE]: [
    Permission.CREATE_PARTY,
    Permission.UPDATE_PARTY,
    Permission.VIEW_PARTIES,
    Permission.VIEW_PARTY,
  ],

  [UserRole.PROCUREMENT]: [
    Permission.CREATE_PARTY,
    Permission.VIEW_PARTIES,
    Permission.VIEW_PARTY,
  ],

  [UserRole.SALES]: [
    Permission.CREATE_PARTY,
    Permission.VIEW_PARTIES,
    Permission.VIEW_PARTY,
  ],

  [UserRole.MASTER_DATA]: [
    Permission.CREATE_PARTY,
    Permission.UPDATE_PARTY,
    Permission.VIEW_PARTIES,
    Permission.VIEW_PARTY,
    Permission.DELETE_PARTY,
  ],

  [UserRole.COMPANY_ADMIN]: [
    Permission.CREATE_PARTY,
    Permission.UPDATE_PARTY,
    Permission.VIEW_PARTIES,
    Permission.VIEW_PARTY,
    Permission.TOGGLE_PARTY,
    Permission.DELETE_PARTY,
  ],

  /** System admin gets everything */
  [UserRole.SYSTEM_ADMIN]: Object.values(Permission),
}


// ─── User ─────────────────────────────────────────────────────────────────────

/**
 * A registered user account in the system.
 * Stored in localStorage under the key 'erp_users' as User[].
 *
 * NOTE: passwords are stored as plain strings since this is a
 * local mock with no real backend. Never do this in production.
 *
 * The permissions array is derived from the role at registration
 * time using ROLE_PERMISSIONS and stored directly for fast lookups.
 */
export interface User {
  /** Unique identifier — generated with crypto.randomUUID() at registration */
  id: string

  /** Full name of the user */
  name: string

  /** Email used for login — must be unique across all users */
  email: string

  /**
   * Plain text password.
   * MOCK ONLY — never store passwords in plain text in production.
   */
  password: string

  /**
   * The user's role in the system.
   * Determines which permissions are granted.
   * Reference: UserRole enum above
   */
  role: UserRole

  /**
   * Flattened list of permissions derived from the role.
   * Stored here to avoid recalculating from ROLE_PERMISSIONS on every check.
   * Used by UI components to show/hide actions (e.g. Delete button — US-06 AC-01)
   */
  permissions: Permission[]

  /**
   * The company this user belongs to.
   * Used as company_id in every API path:
   * /api/v1/foundation/companies/{company_id}/parties
   */
  companyId: string

  /** Account creation timestamp. ISO 8601 string */
  createdAt: string
}


// ─── Session ──────────────────────────────────────────────────────────────────

/**
 * The currently authenticated user session.
 * Stored in localStorage under 'erp_session' and synced
 * with Zustand auth store via the persist middleware.
 *
 * null means no user is logged in.
 */
export type Session = Omit<User, 'password'> | null


// ─── Auth Payloads ────────────────────────────────────────────────────────────

/**
 * Payload for registering a new user account.
 * Handled by auth.service.ts → registerUser()
 *
 * Validation rules enforced before writing to localStorage:
 *   - name:      required
 *   - email:     required, valid format, unique across erp_users
 *   - password:  required, minimum 8 characters
 *   - role:      required, must be a valid UserRole
 *   - companyId: required — ties the user to a specific company
 */
export interface RegisterPayload {
  name:      string
  email:     string
  password:  string
  role:      UserRole
  companyId: string
}

/**
 * Payload for logging in.
 * Handled by auth.service.ts → loginUser()
 *
 * On success: matching User (minus password) is written to erp_session
 * On failure: throws AuthError with appropriate message
 */
export interface LoginPayload {
  email:    string
  password: string
}


// ─── Auth Errors ──────────────────────────────────────────────────────────────

/**
 * Error type thrown by auth.service.ts functions.
 * Caught by the auth store and surfaced to the UI.
 */
export interface AuthError {
  message: string

  /**
   * Machine-readable error code for programmatic handling.
   *
   * INVALID_CREDENTIALS  → email not found or password mismatch
   * EMAIL_TAKEN          → email already registered (register flow)
   * MISSING_FIELDS       → required fields not provided
   */
  code: 'INVALID_CREDENTIALS' | 'EMAIL_TAKEN' | 'MISSING_FIELDS'
}


// ─── Auth State (for Zustand) ─────────────────────────────────────────────────

/**
 * Shape of the auth slice in Zustand (auth.store.ts).
 * The session field is persisted to localStorage via the persist middleware.
 */
export interface AuthState {
  /** The currently logged-in user. null if not authenticated */
  session: Session

  /** True while a login or register request is in progress */
  isLoading: boolean

  /** Last auth error — cleared on next successful action */
  error: AuthError | null

  // ── Actions ──

  /** Attempt login with email and password */
  login:    (payload: LoginPayload)    => Promise<void>

  /** Register a new user account */
  register: (payload: RegisterPayload) => Promise<void>

  /** Clear session and redirect to login */
  logout:   () => void

  /** Clear the current error state */
  clearError: () => void

  /**
   * Check if the current session has a specific permission.
   * Used by UI components to conditionally render actions.
   *
   * Example: hasPermission(Permission.DELETE_PARTY)
   * Reference: US-06 AC-01, US-06 AC-09, US-05 AC-7
   */
  hasPermission: (permission: Permission) => boolean
}
