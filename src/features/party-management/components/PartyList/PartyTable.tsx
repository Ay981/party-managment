// src/features/party-management/components/PartyList/PartyTable.tsx
//
// Data table for the party list.
// Renders party records with all columns from US-03.
//
// States handled:
//   - Loading skeleton (first fetch)
//   - Empty state (no results)
//   - Populated table with pagination
//
// Reference:
//   US-03 Table Columns
//   US-03 Role & Status Indicators
//   US-03 AC-07 "Empty state message shown when no records match filters"
//   US-03 AC-08 "Loading indicator displayed while data is being fetched"
//   US-03 AC-10 "All displayed fields match the API response values"
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import { format } from 'date-fns'
import { ArrowUpDown, Database, Users } from 'lucide-react'

import { cn }               from '@/lib/utils'
import { PartyStatusBadge } from '../shared/PartyStatusBadge'
import { PartyRoleBadge }   from '../shared/PartyRoleBadge'
import { PartyActionsMenu } from '../shared/PartyActionsMenu'
import { usePartyStore }    from '@/store/party.store'
import { useAuthStore, selectCompanyId } from '@/store/auth.store'

import type { CompanyParty, PaginationMeta } from '@/types/party.types'


// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-zinc-100 dark:border-zinc-800">
      {Array.from({ length: 9 }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div
            className={cn(
              'h-3.5 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800',
              i === 0 ? 'w-20' : i === 1 ? 'w-24' : i === 2 ? 'w-32' :
              i === 3 ? 'w-20' : i === 4 ? 'w-16' : i === 5 ? 'w-16' :
              i === 6 ? 'w-14' : i === 7 ? 'w-12' : 'w-8',
            )}
          />
        </td>
      ))}
    </tr>
  )
}


// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({
  hasFilters,
  onSeedDemo,
  isSeedingDemo = false,
}: {
  hasFilters: boolean
  onSeedDemo?: () => void
  isSeedingDemo?: boolean
}) {
  const { resetFilters } = usePartyStore()

  return (
    <tr>
      <td colSpan={9} className="px-4 py-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <Users className="h-5 w-5 text-zinc-400" strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No parties found</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              {hasFilters
                ? 'No parties match your current filters.'
                : 'Create your first party to get started.'}
            </p>
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className={cn(
                'mt-1 inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium',
                'bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50',
                'dark:bg-zinc-950 dark:text-zinc-300 dark:ring-zinc-700 dark:hover:bg-zinc-900',
                'transition-colors duration-150',
              )}
            >
              Clear filters
            </button>
          )}

          {!hasFilters && onSeedDemo && (
            <div className="mt-1 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={onSeedDemo}
                disabled={isSeedingDemo}
                className={cn(
                  'inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold shadow-sm',
                  'border-amber-200 bg-white text-zinc-900 hover:bg-amber-50',
                  'disabled:cursor-not-allowed disabled:opacity-60',
                  'dark:border-amber-500/30 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-amber-500/10',
                  'transition-colors duration-150',
                )}
              >
                <Database className="h-3.5 w-3.5 text-amber-600 dark:text-amber-300" strokeWidth={2} aria-hidden />
                {isSeedingDemo ? 'Seeding demo...' : 'Seed demo'}
              </button>
              <p className="max-w-xs text-xs text-amber-700 dark:text-amber-300">
                Demo only: adds sample parties to this browser for the current company.
              </p>
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}


// ─── Pagination Controls ──────────────────────────────────────────────────────

function Pagination({ meta }: { meta: PaginationMeta }) {
  const { setPage } = usePartyStore()

  const start = (meta.page - 1) * meta.perPage + 1
  const end   = Math.min(meta.page * meta.perPage, meta.total)

  const allPages     = Array.from({ length: meta.totalPages }, (_, i) => i + 1)
  const visiblePages = allPages.filter(p =>
    p === 1 || p === meta.totalPages || Math.abs(p - meta.page) <= 1
  )

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Showing{' '}
        <span className="font-medium text-zinc-700 dark:text-zinc-300">{start}–{end}</span>{' '}
        of{' '}
        <span className="font-medium text-zinc-700 dark:text-zinc-300">{meta.total.toLocaleString()}</span>{' '}
        parties
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setPage(meta.page - 1)}
          disabled={meta.page === 1}
          className={cn(
            'inline-flex h-7 items-center gap-1 rounded-md px-2.5 text-xs font-medium',
            'text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800',
            'disabled:cursor-not-allowed disabled:opacity-40',
          )}
        >
          ← Prev
        </button>

        {visiblePages.map((page, index) => {
          const prevPage      = visiblePages[index - 1]
          const showEllipsis  = prevPage && page - prevPage > 1
          return (
            <div key={page} className="flex items-center gap-1">
              {showEllipsis && <span className="px-1 text-xs text-zinc-400">…</span>}
              <button
                type="button"
                onClick={() => setPage(page)}
                aria-current={page === meta.page ? 'page' : undefined}
                className={cn(
                  'inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium transition-colors duration-150',
                  page === meta.page
                    ? 'bg-white text-zinc-900 ring-1 ring-zinc-300 shadow-sm'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800',
                )}
              >
                {page}
              </button>
            </div>
          )
        })}

        <button
          type="button"
          onClick={() => setPage(meta.page + 1)}
          disabled={meta.page === meta.totalPages}
          className={cn(
            'inline-flex h-7 items-center gap-1 rounded-md px-2.5 text-xs font-medium',
            'text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800',
            'disabled:cursor-not-allowed disabled:opacity-40',
          )}
        >
          Next →
        </button>
      </div>
    </div>
  )
}


// ─── Helpers ──────────────────────────────────────────────────────────────────

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={cn(
        'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider',
        'text-zinc-400 dark:text-zinc-500',
        className,
      )}
    >
      {children}
    </th>
  )
}

/** Reference: US-03 Table Columns "TIN: 10-digit masked display" */
function maskTin(tin: string): string {
  if (tin.length !== 10) return tin
  return `${tin.slice(0, 2)}••••••${tin.slice(-2)}`
}


// ─── Main Component ───────────────────────────────────────────────────────────

interface PartyTableProps {
  parties:    CompanyParty[]
  pagination: PaginationMeta | null
  isLoading:  boolean
  isFetching: boolean
  hasFilters: boolean
  onSeedDemo?: () => void
  isSeedingDemo?: boolean
}

export function PartyTable({
  parties,
  pagination,
  isLoading,
  isFetching,
  hasFilters,
  onSeedDemo,
  isSeedingDemo = false,
}: PartyTableProps) {
  const companyId = useAuthStore(selectCompanyId) ?? ''

  const columns = [
    { key: 'partyCode',   label: 'Party code' },
    { key: 'tin',         label: 'TIN'        },
    { key: 'partyName',   label: 'Party name' },
    { key: 'contactName', label: 'Contact'    },
    { key: 'roles',       label: 'Roles'      },
    { key: 'status',      label: 'Status'     },
    { key: 'createdAt',   label: 'Created'    },
    { key: 'updatedAt',   label: 'Updated'    },
    { key: 'actions',     label: '', sticky: true },
  ]

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800',
        'transition-opacity duration-200',
        isFetching && !isLoading && 'opacity-70',
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            <tr>
              {columns.map(col => (
                <Th key={col.key} className={col.key === 'actions' ? 'sticky right-0 z-20 w-14 bg-zinc-50 text-right dark:bg-zinc-900' : undefined}>
                  {col.label && (
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {['partyCode', 'partyName', 'createdAt'].includes(col.key) && (
                        <ArrowUpDown className="h-3 w-3 opacity-40" strokeWidth={2} aria-hidden />
                      )}
                    </span>
                  )}
                </Th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
            {isLoading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}

            {!isLoading && parties.length === 0 && (
              <EmptyState
                hasFilters={hasFilters}
                onSeedDemo={onSeedDemo}
                isSeedingDemo={isSeedingDemo}
              />
            )}

            {!isLoading && parties.map(party => (
              <tr
                key={party.id}
                className="group transition-colors duration-100 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <td className="px-4 py-3.5">
                  <span className="font-mono text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    {party.partyCode}
                  </span>
                </td>

                <td className="px-4 py-3.5">
                  <span className="font-mono text-xs text-zinc-500 dark:text-zinc-500">
                    {maskTin(party.tin)}
                  </span>
                </td>

                <td className="px-4 py-3.5">
                  <div className="space-y-0.5">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{party.partyName}</p>
                    {party.email && (
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">{party.email}</p>
                    )}
                  </div>
                </td>

                <td className="px-4 py-3.5">
                  <div className="space-y-0.5">
                    <p className="text-zinc-700 dark:text-zinc-300">
                      {party.contactName ?? <span className="text-zinc-300 dark:text-zinc-600">—</span>}
                    </p>
                    {party.phone && (
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">{party.phone}</p>
                    )}
                  </div>
                </td>

                <td className="px-4 py-3.5">
                  <PartyRoleBadge isCustomer={party.isCustomer} isVendor={party.isVendor} size="sm" />
                </td>

                <td className="px-4 py-3.5">
                  <PartyStatusBadge isActive={party.isActive} size="sm" />
                </td>

                <td className="px-4 py-3.5">
                  <span className="text-xs text-zinc-500 dark:text-zinc-500">
                    {format(new Date(party.createdAt), 'd MMM yyyy')}
                  </span>
                </td>

                <td className="px-4 py-3.5">
                  <span className="text-xs text-zinc-500 dark:text-zinc-500">
                    {format(new Date(party.updatedAt), 'd MMM yyyy HH:mm')}
                  </span>
                </td>

                <td className="sticky right-0 z-10 bg-white px-3 py-3.5 text-right shadow-[-12px_0_16px_-16px_rgba(15,23,42,0.35)] group-hover:bg-zinc-50 dark:bg-zinc-950 dark:group-hover:bg-zinc-900">
                  <div className="flex justify-end">
                    <PartyActionsMenu party={party} companyId={companyId} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!isLoading && pagination && pagination.total > 0 && (
        <div className="border-t border-zinc-100 dark:border-zinc-800">
          <Pagination meta={pagination} />
        </div>
      )}
    </div>
  )
}
