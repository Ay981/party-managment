import type { Session, User } from '@/shared/types/auth.types'

const SESSION_KEY = 'erp_session'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function readSession(): Session {
  if (!isBrowser()) return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

export function writeSession(user: User | null): Session {
  if (!isBrowser()) return user
  if (!user) {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  return user
}

export function clearSession(): void {
  if (!isBrowser()) return
  localStorage.removeItem(SESSION_KEY)
}

export function getSession(): Session {
  return readSession()
}

