'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, AlertCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

import { cn }             from '@/shared/utils'
import { seedParties }    from '@/modules/party-management/api'
import { useParties }     from '../../hooks/useParties'
import { usePartyStore, selectFilters } from '@/modules/party-management/store/party.store'
import { useAuthStore, selectCompanyId } from '@/shared/store/auth.store'
import { Permission }     from '@/shared/types/auth.types'
import { PartyFilters }   from './PartyFilters'
import { PartyTable }     from './PartyTable'
import { DeletePartyModal }  from '../modals/DeletePartyModal'
import { StatusChangeModal } from '../modals/StatusChangeModal'

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
            'inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-sm font-medium',
            'bg-zinc-900 text-white shadow-sm',
            'hover:bg-zinc-800 active:bg-zinc-700',
            'transition-colors duration-150',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-700 focus-visible:ring-offset-2',
            'dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white dark:active:bg-zinc-200',
          )}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
          New party
        </Link>
      )}
    </div>
  )
}

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
    <div className="space-y-4 p-3 sm:p-5 lg:p-6">
      <div className="hidden lg:block">
        <PageHeader canCreate={canCreate} />
      </div>

      <div className="rounded-xl bg-white p-4 shadow-elevation dark:bg-zinc-950">
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
