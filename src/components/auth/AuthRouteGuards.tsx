'use client'

import { useEffect, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AlertTriangle, LockKeyhole, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { Permission } from '@/types/auth.types'

function routeWithNext(pathname: string | null) {
  const next = pathname && pathname !== '/login' && pathname !== '/register'
    ? pathname
    : '/parties'

  return `/login?next=${encodeURIComponent(next)}`
}

function getSafeNextPath() {
  if (typeof window === 'undefined') return '/parties'

  const next = new URLSearchParams(window.location.search).get('next')
  if (!next || !next.startsWith('/') || next.startsWith('//')) return '/parties'
  if (next === '/login' || next === '/register') return '/parties'

  return next
}

function subscribeAuthHydration(callback: () => void) {
  if (typeof window === 'undefined') return () => {}

  const persistApi = useAuthStore.persist
  if (!persistApi) return () => {}

  return persistApi.onFinishHydration(callback)
}

function getAuthHydrationSnapshot() {
  if (typeof window === 'undefined') return false

  return useAuthStore.persist?.hasHydrated() ?? true
}

function useAuthHydrated() {
  return useSyncExternalStore(
    subscribeAuthHydration,
    getAuthHydrationSnapshot,
    () => false,
  )
}

function RouteLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
      <div className="flex items-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden />
        Loading workspace
      </div>
    </div>
  )
}

function AccessDenied({ permission }: { permission?: Permission }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
          <AlertTriangle className="h-5 w-5" strokeWidth={2} aria-hidden />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Access restricted
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          Your current role does not include {permission ?? 'the required'} permission for this page.
        </p>
        <Link
          href="/parties"
          className={cn(
            'mt-5 inline-flex h-11 items-center rounded-lg px-4 text-sm font-medium',
            'bg-zinc-900 text-white transition-colors hover:bg-zinc-700',
            'dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-300',
          )}
        >
          Back to parties
        </Link>
      </div>
    </div>
  )
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const hydrated = useAuthHydrated()
  const pathname = usePathname()
  const router = useRouter()
  const session = useAuthStore(s => s.session)

  useEffect(() => {
    if (!hydrated) return
    if (!session?.companyId) {
      router.replace(routeWithNext(pathname))
    }
  }, [hydrated, pathname, router, session])

  if (!hydrated || !session?.companyId) return <RouteLoader />

  return <>{children}</>
}

export function PermissionGate({
  children,
  permission,
}: {
  children: React.ReactNode
  permission: Permission
}) {
  const hydrated = useAuthHydrated()
  const session = useAuthStore(s => s.session)
  const hasPermission = useAuthStore(s => s.hasPermission)

  if (!hydrated || !session?.companyId) return <RouteLoader />
  if (!hasPermission(permission)) return <AccessDenied permission={permission} />

  return <>{children}</>
}

export function PublicAuthRoute({ children }: { children: React.ReactNode }) {
  const hydrated = useAuthHydrated()
  const router = useRouter()
  const session = useAuthStore(s => s.session)

  useEffect(() => {
    if (!hydrated) return
    if (session?.companyId) {
      router.replace(getSafeNextPath())
    }
  }, [hydrated, router, session])

  if (!hydrated || session?.companyId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        <LockKeyhole className="h-5 w-5" strokeWidth={2} aria-hidden />
      </div>
    )
  }

  return <>{children}</>
}

export { getSafeNextPath }
