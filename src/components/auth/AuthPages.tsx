'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  User,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { getSafeNextPath, PublicAuthRoute } from '@/components/auth/AuthRouteGuards'
import { useAuthStore } from '@/store/auth.store'
import { UserRole } from '@/types/auth.types'

type AuthMode = 'login' | 'register'

const roleOptions = [
  { value: UserRole.FINANCE, label: 'Finance' },
  { value: UserRole.PROCUREMENT, label: 'Procurement' },
  { value: UserRole.SALES, label: 'Sales' },
  { value: UserRole.MASTER_DATA, label: 'Master Data' },
  { value: UserRole.COMPANY_ADMIN, label: 'Company Admin' },
  { value: UserRole.SYSTEM_ADMIN, label: 'System Admin' },
]

function AuthFrame({
  children,
  mode,
}: {
  children: React.ReactNode
  mode: AuthMode
}) {
  return (
    <PublicAuthRoute>
      <div className="min-h-screen bg-zinc-950 text-white">
        <div className="grid min-h-screen lg:grid-cols-[minmax(0,0.9fr)_minmax(520px,1.1fr)]">
          <section className="relative hidden overflow-hidden border-r border-white/10 bg-zinc-950 p-10 lg:flex lg:flex-col lg:justify-between">
            <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(255,255,255,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.055)_1px,transparent_1px)] [background-size:42px_42px]" />
            <div className="absolute inset-x-0 top-0 h-1 bg-emerald-300" />

            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-zinc-950">
                  <Building2 className="h-5 w-5" strokeWidth={2.2} aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-semibold">Foundation ERP</p>
                  <p className="text-xs text-zinc-400">Party Management</p>
                </div>
              </div>
            </div>

            <div className="relative max-w-md">
              <p className="font-mono text-xs uppercase text-emerald-300">
                Company-scoped master data
              </p>
              <h1 className="mt-5 text-5xl font-semibold leading-tight">
                Customers and vendors in one controlled workspace.
              </h1>
              <p className="mt-5 text-sm leading-7 text-zinc-300">
                Use a role with the permissions you need, then create, review, update,
                activate, deactivate, and soft-delete parties for a single company.
              </p>
            </div>

            <div className="relative grid grid-cols-3 gap-3">
              {['Create', 'Review', 'Control'].map(item => (
                <div key={item} className="border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm font-medium">{item}</p>
                  <div className="mt-4 h-1 rounded-full bg-emerald-300" />
                </div>
              ))}
            </div>
          </section>

          <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
            <div className="w-full max-w-md">
              <div className="mb-8 lg:hidden">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
                    <Building2 className="h-5 w-5" strokeWidth={2.2} aria-hidden />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Foundation ERP</p>
                    <p className="text-xs text-zinc-500">Party Management</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="mb-6">
                  <p className="text-xs font-medium uppercase text-zinc-400">
                    {mode === 'login' ? 'Welcome back' : 'Create workspace access'}
                  </p>
                  <h1 className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                    {mode === 'login' ? 'Sign in' : 'Register account'}
                  </h1>
                </div>

                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </PublicAuthRoute>
  )
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Mail
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</span>
      <div className="relative mt-1.5">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" strokeWidth={2} aria-hidden />
        {children}
      </div>
    </label>
  )
}

function inputClass(withIcon = true) {
  return cn(
    'h-10 w-full rounded-lg border border-zinc-200 bg-white text-sm text-zinc-950 shadow-sm',
    'placeholder:text-zinc-300 transition-colors',
    'focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15',
    'dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-600',
    withIcon ? 'pl-10 pr-3' : 'px-3',
  )
}

function PasswordInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="relative">
      <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" strokeWidth={2} aria-hidden />
      <input
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(inputClass(), 'pr-10')}
      />
      <button
        type="button"
        onClick={() => setShowPassword(value => !value)}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
      >
        {showPassword
          ? <EyeOff className="h-4 w-4" strokeWidth={2} aria-hidden />
          : <Eye className="h-4 w-4" strokeWidth={2} aria-hidden />}
      </button>
    </div>
  )
}

function ErrorMessage() {
  const error = useAuthStore(s => s.error)
  if (!error) return null

  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-500/10 dark:text-red-300">
      {error.message}
    </div>
  )
}

export function LoginPageClient() {
  const router = useRouter()
  const login = useAuthStore(s => s.login)
  const isLoading = useAuthStore(s => s.isLoading)
  const session = useAuthStore(s => s.session)
  const clearError = useAuthStore(s => s.clearError)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    clearError()
  }, [clearError])

  useEffect(() => {
    if (session?.companyId) router.replace(getSafeNextPath())
  }, [router, session])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await login({ email, password })
  }

  return (
    <AuthFrame mode="login">
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorMessage />

        <Field icon={Mail} label="Email">
          <input
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            placeholder="finance@example.com"
            className={inputClass()}
            autoComplete="email"
          />
        </Field>

        <label className="block">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Password</span>
          <div className="mt-1.5">
            <PasswordInput value={password} onChange={setPassword} placeholder="Your password" />
          </div>
        </label>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
          {!isLoading && <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Need an account?{' '}
        <Link href="/register" className="font-medium text-zinc-950 underline-offset-4 hover:underline dark:text-zinc-50">
          Register
        </Link>
      </p>
    </AuthFrame>
  )
}

export function RegisterPageClient() {
  const router = useRouter()
  const register = useAuthStore(s => s.register)
  const isLoading = useAuthStore(s => s.isLoading)
  const session = useAuthStore(s => s.session)
  const clearError = useAuthStore(s => s.clearError)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyId, setCompanyId] = useState('company-demo')
  const [role, setRole] = useState<UserRole>(UserRole.COMPANY_ADMIN)

  useEffect(() => {
    clearError()
  }, [clearError])

  useEffect(() => {
    if (session?.companyId) router.replace(getSafeNextPath())
  }, [router, session])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await register({ name, email, password, role, companyId })
  }

  return (
    <AuthFrame mode="register">
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorMessage />

        <Field icon={User} label="Name">
          <input
            type="text"
            value={name}
            onChange={event => setName(event.target.value)}
            placeholder="Aymen Abdulber"
            className={inputClass()}
            autoComplete="name"
          />
        </Field>

        <Field icon={Mail} label="Email">
          <input
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            placeholder="finance@example.com"
            className={inputClass()}
            autoComplete="email"
          />
        </Field>

        <label className="block">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Password</span>
          <div className="mt-1.5">
            <PasswordInput value={password} onChange={setPassword} placeholder="Minimum 8 characters" />
          </div>
        </label>

        <Field icon={Building2} label="Company ID">
          <input
            type="text"
            value={companyId}
            onChange={event => setCompanyId(event.target.value)}
            placeholder="company-demo"
            className={inputClass()}
          />
        </Field>

        <label className="block">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Role</span>
          <select
            value={role}
            onChange={event => setRole(event.target.value as UserRole)}
            className={cn(inputClass(false), 'mt-1.5 cursor-pointer')}
          >
            {roleOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          {isLoading ? 'Creating account...' : 'Create account'}
          {!isLoading && <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Already registered?{' '}
        <Link href="/login" className="font-medium text-zinc-950 underline-offset-4 hover:underline dark:text-zinc-50">
          Sign in
        </Link>
      </p>
    </AuthFrame>
  )
}
