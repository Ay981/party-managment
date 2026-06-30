// src/lib/auth/auth.service.ts
//
// Authentication service — all reads and writes go through localStorage.
// This is the only file that touches 'erp_users' and 'erp_session' directly.
// The Zustand auth store (auth.store.ts) calls these functions and exposes
// the results to the rest of the app.
//
// Storage keys:
//   erp_users   → User[]   — all registered accounts
//   erp_session → Session  — currently logged in user (no password)
// ─────────────────────────────────────────────────────────────────────────────

import type {
  User,
  Session,
  RegisterPayload,
  LoginPayload,
  AuthError,
} from '@/types/auth.types'

import { ROLE_PERMISSIONS, UserRole } from '@/types/auth.types'


// ─── Storage Keys ─────────────────────────────────────────────────────────────

const USERS_KEY   = 'erp_users'
const SESSION_KEY = 'erp_session'


// ─── SSR Guard ────────────────────────────────────────────────────────────────

/**
 * Returns false when running on the server (Next.js SSR).
 * All localStorage calls are wrapped with this check.
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined'
}


// ─── Error Builder ────────────────────────────────────────────────────────────

/**
 * Builds a typed AuthError and throws it.
 * All service functions throw this shape so the auth store
 * can handle errors uniformly.
 *
 * Reference: AuthError interface in auth.types.ts
 */
function throwAuthError(
  message: string,
  code: AuthError['code']
): never {
  throw { message, code } satisfies AuthError
}


// ─── User Storage Helpers ─────────────────────────────────────────────────────

/**
 * Reads all registered users from localStorage.
 * Returns empty array on server or if key doesn't exist yet.
 */
function readUsers(): User[] {
  if (!isBrowser()) return []
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? (JSON.parse(raw) as User[]) : []
  } catch {
    return []
  }
}

/**
 * Writes the full user array back to localStorage.
 * Always replaces the entire array.
 */
function writeUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}


// ─── Session Storage Helpers ──────────────────────────────────────────────────

/**
 * Reads the current session from localStorage.
 * Returns null if no user is logged in or on server.
 */
function readSession(): Session {
  if (!isBrowser()) return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

/**
 * Writes a session to localStorage.
 * Strips the password field before writing — password
 * should never leave auth.service.ts.
 *
 * NOTE: This is called internally by loginUser and registerUser.
 * The Zustand store reads the result, not the raw localStorage.
 */
function writeSession(user: User): Session {
  // Destructure to drop password — never store it in session
  const { password, ...session } = user
  void password
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

/**
 * Clears the session from localStorage.
 * Called by logoutUser().
 */
function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}


// ─── Validation Helpers ───────────────────────────────────────────────────────

/**
 * Basic email format check.
 * Mirrors BR-06 from the FRD — "Email must be in a valid email format."
 * Used here to validate the email at registration.
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * Password strength rule.
 * Minimum 8 characters — enforced at registration only.
 * Login accepts whatever was registered.
 */
function isValidPassword(password: string): boolean {
  return password.trim().length >= 8
}


// ─────────────────────────────────────────────────────────────────────────────
// registerUser
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Registers a new user account and immediately logs them in.
 *
 * Steps:
 *   1. Validate all required fields
 *   2. Check email format
 *   3. Check password length
 *   4. Check email is not already taken
 *   5. Derive permissions from role using ROLE_PERMISSIONS map
 *   6. Write new user to erp_users
 *   7. Write session to erp_session (without password)
 *   8. Return the session
 *
 * Throws AuthError on any failure — caught by auth.store.ts
 *
 * Reference: RegisterPayload, AuthError in auth.types.ts
 */
export async function registerUser(payload: RegisterPayload): Promise<Session> {
  // Simulate network delay
  await new Promise(r => setTimeout(r, 400))

  const { name, email, password, role, companyId } = payload

  // ── Required fields check ────────────────────────────────────────────────
  if (!name?.trim() || !email?.trim() || !password?.trim() || !role || !companyId?.trim()) {
    throwAuthError('All fields are required.', 'MISSING_FIELDS')
  }

  // ── Email format ─────────────────────────────────────────────────────────
  if (!isValidEmail(email)) {
    throwAuthError('Please enter a valid email address.', 'MISSING_FIELDS')
  }

  // ── Password length ──────────────────────────────────────────────────────
  if (!isValidPassword(password)) {
    throwAuthError('Password must be at least 8 characters.', 'MISSING_FIELDS')
  }

  const users = readUsers()

  // ── Duplicate email check ─────────────────────────────────────────────────
  // Emails must be unique across all users regardless of company.
  const existing = users.find(
    u => u.email.toLowerCase() === email.toLowerCase()
  )
  if (existing) {
    throwAuthError(
      'An account with this email already exists.',
      'EMAIL_TAKEN'
    )
  }

  // ── Build new user ───────────────────────────────────────────────────────
  // Permissions are derived from role at registration time and stored
  // directly so UI checks don't need to recalculate every render.
  // Reference: ROLE_PERMISSIONS in auth.types.ts
  const newUser: User = {
    id:          crypto.randomUUID(),
    name:        name.trim(),
    email:       email.toLowerCase().trim(),
    password,                          // plain text — mock only
    role,
    permissions: ROLE_PERMISSIONS[role],
    companyId:   companyId.trim(),
    createdAt:   new Date().toISOString(),
  }

  // ── Persist ──────────────────────────────────────────────────────────────
  writeUsers([...users, newUser])

  // ── Auto-login after registration ─────────────────────────────────────────
  // Writes session and returns it (without password).
  return writeSession(newUser)
}


// ─────────────────────────────────────────────────────────────────────────────
// loginUser
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Authenticates a user with email and password.
 *
 * Steps:
 *   1. Validate required fields
 *   2. Find user by email (case-insensitive)
 *   3. Compare password
 *   4. Write session to localStorage
 *   5. Return session (without password)
 *
 * Uses a generic "Invalid email or password" message for both
 * email-not-found and wrong-password cases — avoids leaking
 * which emails are registered (standard security practice).
 *
 * Throws AuthError on failure — caught by auth.store.ts
 *
 * Reference: LoginPayload, AuthError in auth.types.ts
 */
export async function loginUser(payload: LoginPayload): Promise<Session> {
  await new Promise(r => setTimeout(r, 400))

  const { email, password } = payload

  // ── Required fields ──────────────────────────────────────────────────────
  if (!email?.trim() || !password?.trim()) {
    throwAuthError('Email and password are required.', 'MISSING_FIELDS')
  }

  const users = readUsers()

  // ── Find user by email ───────────────────────────────────────────────────
  const user = users.find(
    u => u.email.toLowerCase() === email.toLowerCase().trim()
  )

  // ── Validate password ────────────────────────────────────────────────────
  // Intentionally same error for both "not found" and "wrong password"
  if (!user || user.password !== password) {
    throwAuthError('Invalid email or password.', 'INVALID_CREDENTIALS')
  }

  // ── Write session and return ─────────────────────────────────────────────
  return writeSession(user)
}


// ─────────────────────────────────────────────────────────────────────────────
// logoutUser
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Clears the current session from localStorage.
 * No async needed — purely synchronous localStorage operation.
 *
 * The Zustand auth store sets session to null after calling this,
 * which triggers a redirect to /login via middleware or layout guard.
 */
export function logoutUser(): void {
  clearSession()
}


// ─────────────────────────────────────────────────────────────────────────────
// getSession
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reads the current session from localStorage synchronously.
 * Used by the Zustand store to hydrate session on app load.
 *
 * Returns null if:
 *   - Running on the server (SSR)
 *   - No user is logged in
 *   - Session data is corrupted
 */
export function getSession(): Session {
  return readSession()
}


// ─────────────────────────────────────────────────────────────────────────────
// Dev Utility — Seed Admin Account
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Seeds a default System Admin account for development.
 * Call from the browser console or a dev-only page:
 *
 *   import { seedAdminUser } from '@/lib/auth/auth.service'
 *   seedAdminUser()
 *
 * Credentials:
 *   Email:    admin@erp.dev
 *   Password: admin1234
 *   Role:     SYSTEM_ADMIN
 *
 * Skips if an account with that email already exists.
 */
export function seedAdminUser(companyId = 'company-default'): void {
  const users = readUsers()

  const exists = users.some(u => u.email === 'admin@erp.dev')
  if (exists) {
    console.info('[auth] Seed skipped — admin@erp.dev already exists.')
    return
  }
  const admin: User = {
    id:          crypto.randomUUID(),
    name:        'System Admin',
    email:       'admin@erp.dev',
    password:    'admin1234',
    role:        UserRole.SYSTEM_ADMIN,
    permissions: ROLE_PERMISSIONS[UserRole.SYSTEM_ADMIN],
    companyId,
    createdAt:   new Date().toISOString(),
  }

  writeUsers([...users, admin])
  console.info('[auth] Seeded admin@erp.dev — password: admin1234')
}
