// src/features/party-management/components/PartyList/PartyList.tsx
//
// Root component for the Party List page.
// Orchestrates filters, table, and data fetching.
//
// Reference:
//   US-03 User Story — full list screen
//   US-03 AC-01  "On page load, first page is retrieved and displayed"
//   US-03 AC-08  "Loading indicator displayed while data is being fetched"
//   US-03 AC-09  "API errors display appropriate error messages"
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, AlertCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

import { cn }             from '@/lib/utils'
import { seedParties }    from '@/lib/api'
import { useParties }     from '../../hooks/useParties'
import { usePartyStore, selectFilters } from '@/store/party.store'
import { useAuthStore, selectCompanyId } from '@/store/auth.store'
import { Permission }     from '@/types/auth.types'
import { PartyFilters }   from './PartyFilters'
import { PartyTable }     from './PartyTable'
import { DeletePartyModal }  from '../modals/DeletePartyModal'
import { StatusChangeModal } from '../modals/StatusChangeModal'


// ─── Error Banner ─────────────────────────────────────────────────────────────

function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-lg border px-4 py-3',
        'border-red-200 bg-red-50 text-red-700',
        'dark:border-red-800 dark:bg-red-900/20 dark:text-red-400',
      )}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
      <div className="flex-1 text-sm">
        <p className="font-medium">Failed to load parties</p>
        <p className="mt-0.5 text-xs opacity-80">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium',
            'bg-red-100 text-red-700 transition-colors hover:bg-red-200',
            'dark:bg-red-900/40 dark:text-red-400 dark:hover:bg-red-900/60',
          )}
        >
          <RefreshCw className="h-3 w-3" strokeWidth={2} />
          Retry
        </button>
      )}
    </div>
  )
}


// ─── Page Header ──────────────────────────────────────────────────────────────

function PageHeader({ canCreate }: { canCreate: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Company Parties
        </h1>
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
          Manage customers, vendors, and dual-role parties
        </p>
      </div>
      {canCreate && (
        <Link
          href="/parties/create"
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium',
            'border border-zinc-200 bg-white text-zinc-900 shadow-sm',
            'hover:bg-zinc-50 active:bg-zinc-100',
            'transition-colors duration-150',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2',
          )}
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          New party
        </Link>
      )}
    </div>
  )
}


// ─── Main Component ───────────────────────────────────────────────────────────

export function PartyList() {
  const companyId     = useAuthStore(selectCompanyId)
  const hasPermission = useAuthStore(s => s.hasPermission)
  const filters       = usePartyStore(selectFilters)
  const [isSeedingDemo, setIsSeedingDemo] = useState(false)

  const { data, isLoading, isFetching, isError, error, refetch } =
    useParties(companyId, filters)

  const hasFilters =
    !!filters.search          ||
    filters.isCustomer !== null ||
    filters.isVendor   !== null ||
    filters.isActive   !== null

  const canCreate = hasPermission(Permission.CREATE_PARTY)

  const handleSeedDemo = async () => {
    if (!companyId || isSeedingDemo) return

    setIsSeedingDemo(true)
    try {
      const seededCount = seedParties(companyId)

      if (seededCount > 0) {
        toast.success(`Seeded ${seededCount} demo parties.`)
      } else {
        toast('Demo seed skipped. This company already has parties.')
      }

      await refetch()
    } catch {
      toast.error('Unable to seed demo parties.')
    } finally {
      setIsSeedingDemo(false)
    }
  }

  return (
    <div className="space-y-5 p-6">
      <PageHeader canCreate={canCreate} />

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <PartyFilters
          totalResults={data?.pagination.total}
          isFetching={isFetching}
        />
      </div>

      {isError && (
        <ErrorBanner
          message={error?.message ?? 'Unable to load parties. Please verify the filter criteria.'}
          onRetry={refetch}
        />
      )}

      {!isError && (
        <PartyTable
          parties={data?.data ?? []}
          pagination={data?.pagination ?? null}
          isLoading={isLoading}
          isFetching={isFetching}
          hasFilters={hasFilters}
          onSeedDemo={!hasFilters ? handleSeedDemo : undefined}
          isSeedingDemo={isSeedingDemo}
        />
      )}

      <StatusChangeModal companyId={companyId ?? ''} />
      <DeletePartyModal  companyId={companyId ?? ''} />
    </div>
  )
}
