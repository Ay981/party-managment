'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  Building2,
  LogOut,
  Moon,
  Plus,
  Sun,
  UsersRound,
} from 'lucide-react'

import { cn } from '@/shared/utils'
import { useAuthStore } from '@/shared/store/auth.store'
import { Permission } from '@/shared/types/auth.types'

function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'inline-flex items-center justify-center rounded-lg text-zinc-500',
        'transition-[background-color,transform] duration-150 active:scale-[0.97]',
        'hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
        className,
      )}
    >
      {isDark
        ? <Sun  className="h-4 w-4" strokeWidth={2} aria-hidden />
        : <Moon className="h-4 w-4" strokeWidth={2} aria-hidden />}
    </button>
  )
}

const navItems = [
  { href: '/parties', label: 'Parties', icon: UsersRound },
]

function formatRole(role: string) {
  return role
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const session = useAuthStore(s => s.session)
  const logout = useAuthStore(s => s.logout)
  const canCreate = useAuthStore(s => s.hasPermission(Permission.CREATE_PARTY))

  const handleLogout = () => {
    logout()
    router.replace('/login')
  }

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="flex min-h-dvh">
        <aside className="hidden w-64 shrink-0 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 lg:flex lg:flex-col">
          <div className="flex h-16 items-center gap-3 border-b border-zinc-100 px-5 dark:border-zinc-800">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950">
              <Building2 className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Foundation ERP
              </p>
              <p className="truncate text-xs text-zinc-400 dark:text-zinc-500">
                {session?.companyId}
              </p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Main navigation">
            {navItems.map(item => {
              const Icon = item.icon
              const active = pathname === item.href || pathname?.startsWith(`${item.href}/`)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-[background-color,transform] duration-150 active:scale-[0.97]',
                    active
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950'
                      : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                  {item.label}
                </Link>
              )
            })}

            {canCreate && (
              <Link
                href="/parties/create"
                className="flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium text-zinc-500 transition-[background-color,transform] duration-150 active:scale-[0.97] hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
                New party
              </Link>
            )}
          </nav>

          <div className="border-t border-zinc-100 p-3 dark:border-zinc-800">
            <div className="mb-3 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {session?.name}
              </p>
              <p className="mt-0.5 truncate text-xs text-zinc-400 dark:text-zinc-500">
                {session ? formatRole(session.role) : ''}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleLogout}
                className="flex h-9 flex-1 items-center gap-2 rounded-lg px-3 text-sm font-medium text-red-700 transition-[background-color,transform] duration-150 active:scale-[0.97] hover:bg-red-50 hover:text-red-800 dark:text-red-300 dark:hover:bg-red-500/10 dark:hover:text-red-200"
              >
                <LogOut className="h-4 w-4" strokeWidth={2} aria-hidden />
                Sign out
              </button>
              <ThemeToggle className="size-9" />
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/90 px-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90 lg:hidden">
            <div className="flex items-center gap-1.5">
              <Link
                href="/parties"
                className="inline-flex h-9 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-900"
              >
                <UsersRound className="h-4 w-4 text-zinc-500 dark:text-zinc-400" strokeWidth={2} aria-hidden />
                Parties
              </Link>
              {canCreate && (
                <Link
                  href="/parties/create"
                  className={cn(
                    'inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium',
                    'bg-zinc-900 text-white hover:bg-zinc-800 active:bg-zinc-700',
                    'transition-colors duration-150',
                    'dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white',
                  )}
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                  New
                </Link>
              )}
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle className="size-9" />
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Sign out"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-[background-color,transform] duration-150 active:scale-[0.97] hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                <LogOut className="h-4 w-4" strokeWidth={2} aria-hidden />
              </button>
            </div>
          </header>

          <main className="mx-auto max-w-7xl">{children}</main>
        </div>
      </div>
    </div>
  )
}
