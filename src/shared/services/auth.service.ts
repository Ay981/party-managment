import type {
  User,
  Session,
  RegisterPayload,
  LoginPayload,
  AuthError,
} from '@/shared/types/auth.types'

import { ROLE_PERMISSIONS, UserRole } from '@/shared/types/auth.types'

const USERS_KEY   = 'erp_users'
const SESSION_KEY = 'erp_session'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function throwAuthError(
  message: string,
  code: AuthError['code']
): never {
  throw { message, code } satisfies AuthError
}

function readUsers(): User[] {
  if (!isBrowser()) return []
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? (JSON.parse(raw) as User[]) : []
  } catch {
    return []
  }
}

function writeUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function readSession(): Session {
  if (!isBrowser()) return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

function writeSession(user: User): Session {
  // Keep passwords out of the persisted session object.
  const { password, ...session } = user
  void password
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isValidPassword(password: string): boolean {
  return password.trim().length >= 8
}

export async function registerUser(payload: RegisterPayload): Promise<Session> {
  await new Promise(r => setTimeout(r, 400))

  const { name, email, password, role, companyId } = payload

  if (!name?.trim() || !email?.trim() || !password?.trim() || !role || !companyId?.trim()) {
    throwAuthError('All fields are required.', 'MISSING_FIELDS')
  }

  if (!isValidEmail(email)) {
    throwAuthError('Please enter a valid email address.', 'MISSING_FIELDS')
  }

  if (!isValidPassword(password)) {
    throwAuthError('Password must be at least 8 characters.', 'MISSING_FIELDS')
  }

  const users = readUsers()
  const existing = users.find(
    u => u.email.toLowerCase() === email.toLowerCase()
  )

  if (existing) {
    throwAuthError(
      'An account with this email already exists.',
      'EMAIL_TAKEN'
    )
  }

  const newUser: User = {
    id:          crypto.randomUUID(),
    name:        name.trim(),
    email:       email.toLowerCase().trim(),
    password,
    role,
    permissions: ROLE_PERMISSIONS[role],
    companyId:   companyId.trim(),
    createdAt:   new Date().toISOString(),
  }

  writeUsers([...users, newUser])
  return writeSession(newUser)
}

export async function loginUser(payload: LoginPayload): Promise<Session> {
  await new Promise(r => setTimeout(r, 400))

  const { email, password } = payload

  if (!email?.trim() || !password?.trim()) {
    throwAuthError('Email and password are required.', 'MISSING_FIELDS')
  }

  const users = readUsers()
  const user = users.find(
    u => u.email.toLowerCase() === email.toLowerCase().trim()
  )

  // Use one error for both missing user and wrong password.
  if (!user || user.password !== password) {
    throwAuthError('Invalid email or password.', 'INVALID_CREDENTIALS')
  }

  return writeSession(user)
}

export function logoutUser(): void {
  clearSession()
}

export function getSession(): Session {
  return readSession()
}

export function seedAdminUser(companyId = 'company-default'): void {
  const users = readUsers()

  const exists = users.some(u => u.email === 'admin@erp.dev')
  if (exists) {
    console.info('[auth] Seed skipped - admin@erp.dev already exists.')
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
  console.info('[auth] Seeded admin@erp.dev - password: admin1234')
}
