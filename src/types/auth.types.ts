export enum UserRole {
  FINANCE       = 'FINANCE',
  PROCUREMENT   = 'PROCUREMENT',
  SALES         = 'SALES',
  MASTER_DATA   = 'MASTER_DATA',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  SYSTEM_ADMIN  = 'SYSTEM_ADMIN',
}

export enum Permission {
  CREATE_PARTY = 'CREATE_PARTY',
  UPDATE_PARTY = 'UPDATE_PARTY',
  VIEW_PARTIES = 'VIEW_PARTIES',
  VIEW_PARTY   = 'VIEW_PARTY',
  TOGGLE_PARTY = 'TOGGLE_PARTY',
  DELETE_PARTY = 'DELETE_PARTY',
}

// Role permissions are stored on the user at registration for quick UI checks.
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

  [UserRole.SYSTEM_ADMIN]: Object.values(Permission),
}

export interface User {
  id: string
  name: string
  email: string
  // Mock auth only. Do not store plain text passwords in a real backend.
  password: string
  role: UserRole
  permissions: Permission[]
  companyId: string
  createdAt: string
}

export type Session = Omit<User, 'password'> | null

export interface RegisterPayload {
  name:      string
  email:     string
  password:  string
  role:      UserRole
  companyId: string
}

export interface LoginPayload {
  email:    string
  password: string
}

export interface AuthError {
  message: string
  code: 'INVALID_CREDENTIALS' | 'EMAIL_TAKEN' | 'MISSING_FIELDS'
}

export interface AuthState {
  session: Session
  isLoading: boolean
  error: AuthError | null

  login:    (payload: LoginPayload)    => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout:   () => void
  clearError: () => void
  hasPermission: (permission: Permission) => boolean
}
