// src/features/party-management/components/PartyList/PartyFilters.tsx
//
// Filter bar for the party list page.
// Reads and writes filter state via usePartyStore.
//
// Controls:
//   - Search input  (name, TIN, phone) — US-03 Filters
//   - Customer Only checkbox           — US-03 Filters
//   - Vendor Only checkbox             — US-03 Filters
//   - Active Status dropdown           — US-03 Filters
//   - Per Page dropdown                — US-03 Filters
//
// Reference:
//   US-03 Filters Section
//   US-03 "Search triggers on Search button click or Enter key press"
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import { useRef } from 'react'
import { Search, X, SlidersHorizontal } from 'lucide-react'

import { cn }                                     from '@/lib/utils'
import { usePartyStore, selectStatusFilter }       from '@/store/party.store'
import { ActiveStatusFilter, type PerPageOption } from '@/types/party.types'


// ─── Sub-components ───────────────────────────────────────────────────────────

function FilterCheckbox({
  id,
  label,
  checked,
  onChange,
  accent,
}: {
  id:       string
  label:    string
  checked:  boolean
  onChange: () => void
  accent:   'sky' | 'neutral'
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'inline-flex cursor-pointer select-none items-center gap-2',
        'rounded-md border px-3 py-1.5 text-sm font-medium transition-all duration-150',
        checked && accent === 'sky'    && 'border-sky-400 bg-sky-50 text-sky-700 dark:border-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
        checked && accent === 'neutral' && 'border-zinc-900 bg-white text-zinc-900 dark:border-zinc-100 dark:bg-zinc-950 dark:text-zinc-100',
        !checked && 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600',
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
        aria-label={label}
      />
      <span
        className={cn(
          'flex h-3.5 w-3.5 items-center justify-center rounded-sm border transition-colors',
          checked && accent === 'sky'    && 'border-sky-500 bg-sky-500',
          checked && accent === 'neutral' && 'border-zinc-900 bg-white dark:border-zinc-100 dark:bg-zinc-950',
          !checked && 'border-zinc-300 dark:border-zinc-600',
        )}
      >
        {checked && (
          <svg viewBox="0 0 10 8" className={cn('h-2 w-2 fill-none stroke-2', accent === 'neutral' ? 'stroke-zinc-900 dark:stroke-zinc-100' : 'stroke-white')}>
            <path d="M1 4l2.5 2.5L9 1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {label}
    </label>
  )
}


// ─── Main Component ───────────────────────────────────────────────────────────

interface PartyFiltersProps {
  totalResults?: number
  isFetching?:   boolean
}

export function PartyFilters({ totalResults, isFetching }: PartyFiltersProps) {
  const {
    filters,
    applySearch,
    toggleCustomerFilter,
    toggleVendorFilter,
    setStatusFilter,
    setFilter,
    resetFilters,
  } = usePartyStore()

  const statusFilter = usePartyStore(selectStatusFilter)

  const inputRef = useRef<HTMLInputElement>(null)

  const handleSearch = () => applySearch(inputRef.current?.value ?? '')

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch()
  }

  const handleClearSearch = () => {
    if (inputRef.current) inputRef.current.value = ''
    applySearch('')
    inputRef.current?.focus()
  }

  const handleResetFilters = () => {
    if (inputRef.current) inputRef.current.value = ''
    resetFilters()
  }

  const hasActiveFilters =
    !!filters.search          ||
    filters.isCustomer !== null ||
    filters.isVendor   !== null ||
    filters.isActive   !== null

  const PER_PAGE_OPTIONS: PerPageOption[] = [10, 20, 50, 100]

  const STATUS_OPTIONS: { label: string; value: ActiveStatusFilter }[] = [
    { label: 'All statuses', value: ActiveStatusFilter.ALL      },
    { label: 'Active',       value: ActiveStatusFilter.ACTIVE   },
    { label: 'Inactive',     value: ActiveStatusFilter.INACTIVE },
  ]

  return (
    <div className="space-y-3">
      {/* Top row — search + per-page */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] max-w-sm flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400"
            strokeWidth={2}
            aria-hidden
          />
          <input
            ref={inputRef}
            type="text"
            key={filters.search}
            defaultValue={filters.search}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search by name, TIN, or phone…"
            aria-label="Search parties"
            className={cn(
              'h-9 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-8 text-sm',
              'text-zinc-900 placeholder:text-zinc-400',
              'transition-shadow duration-150',
              'focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500/15',
              'dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500',
            )}
          />
          {filters.search && (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleSearch}
          disabled={isFetching}
          className={cn(
            'inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-sm font-medium',
            'border border-zinc-200 bg-white text-zinc-900 shadow-sm',
            'hover:bg-zinc-50 active:bg-zinc-100',
            'transition-colors duration-150',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1',
            isFetching && 'cursor-wait opacity-70',
          )}
        >
          <Search className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Search
        </button>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <label htmlFor="per-page" className="whitespace-nowrap text-xs text-zinc-500 dark:text-zinc-400">
            Rows per page
          </label>
          <select
            id="per-page"
            value={filters.perPage}
            onChange={e => setFilter('perPage', Number(e.target.value) as PerPageOption)}
            className={cn(
              'h-9 cursor-pointer rounded-lg border border-zinc-200 bg-white px-2.5 text-sm text-zinc-700',
              'focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500/15',
              'dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
            )}
          >
            {PER_PAGE_OPTIONS.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Bottom row — role checkboxes + status dropdown + clear */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 dark:text-zinc-500">
          <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Filter by
        </div>

        <FilterCheckbox
          id="filter-customer"
          label="Customer"
          checked={filters.isCustomer === true}
          onChange={toggleCustomerFilter}
          accent="sky"
        />

        <FilterCheckbox
          id="filter-vendor"
          label="Vendor"
          checked={filters.isVendor === true}
          onChange={toggleVendorFilter}
          accent="neutral"
        />

        <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700" aria-hidden />

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as ActiveStatusFilter)}
          aria-label="Filter by status"
          className={cn(
            'h-8 cursor-pointer rounded-md border border-zinc-200 bg-white px-2.5 text-sm text-zinc-700',
            'focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500/15',
            'dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
          )}
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <div className="flex-1" />

        {totalResults !== undefined && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            {isFetching ? (
              <span className="animate-pulse">Loading…</span>
            ) : (
              <>
                <span className="font-medium text-zinc-600 dark:text-zinc-300">
                  {totalResults.toLocaleString()}
                </span>{' '}
                {totalResults === 1 ? 'result' : 'results'}
              </>
            )}
          </p>
        )}

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium',
              'text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700',
              'dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300',
            )}
          >
            <X className="h-3 w-3" strokeWidth={2.5} />
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}
