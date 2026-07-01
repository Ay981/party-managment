'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, SlidersHorizontal, ChevronDown, Check } from 'lucide-react'

import { cn }                                     from '@/lib/utils'
import { usePartyStore, selectStatusFilter }       from '@/store/party.store'
import { ActiveStatusFilter, type PerPageOption } from '@/types/party.types'


// ─── Filter Chip ──────────────────────────────────────────────────────────────

function FilterChip({
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
        'relative inline-flex cursor-pointer select-none items-center whitespace-nowrap',
        'h-8 rounded-full border px-3 text-xs font-medium transition-all duration-150',
        checked && accent === 'sky'
          ? 'border-sky-400 bg-sky-50 text-sky-700 dark:border-sky-500 dark:bg-sky-500/10 dark:text-sky-400'
          : checked && accent === 'neutral'
            ? 'border-zinc-800 bg-zinc-900 text-white dark:border-zinc-300 dark:bg-zinc-100 dark:text-zinc-900'
            : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-300',
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      {label}
    </label>
  )
}


// ─── Status Dropdown ──────────────────────────────────────────────────────────

function StatusDropdown({
  value,
  options,
  onChange,
}: {
  value:    ActiveStatusFilter
  options:  { label: string; value: ActiveStatusFilter }[]
  onChange: (v: ActiveStatusFilter) => void
}) {
  const [open, setOpen] = useState(false)
  const ref             = useRef<HTMLDivElement>(null)
  const current         = options.find(o => o.value === value) ?? options[0]
  const isActive        = value !== ActiveStatusFilter.ALL

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'inline-flex h-10 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors duration-150',
          isActive
            ? 'border-zinc-800 bg-zinc-900 text-white dark:border-zinc-300 dark:bg-zinc-100 dark:text-zinc-900'
            : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:text-zinc-200',
        )}
      >
        {current.label}
        <ChevronDown
          className={cn('h-3.5 w-3.5 transition-transform duration-150', open && 'rotate-180')}
          strokeWidth={2}
          aria-hidden
        />
      </button>

      {open && (
        <div className={cn(
          'absolute right-0 top-[calc(100%+6px)] z-50 min-w-[148px] overflow-hidden rounded-lg border shadow-lg',
          'border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900',
        )}>
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={value === opt.value}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={cn(
                'flex w-full items-center justify-between px-3 py-2 text-sm transition-colors duration-100',
                value === opt.value
                  ? 'bg-zinc-50 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                  : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200',
              )}
            >
              {opt.label}
              {value === opt.value && (
                <Check className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" strokeWidth={2.5} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
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
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [inputValue, setInputValue] = useState(filters.search)

  // Sync input when filters are reset externally (e.g. "Clear filters" in empty state)
  useEffect(() => { setInputValue(filters.search) }, [filters.search])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => applySearch(value), 350)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      applySearch(inputValue)
    }
    if (e.key === 'Escape') {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      setInputValue('')
      applySearch('')
    }
  }

  const handleClearSearch = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setInputValue('')
    applySearch('')
  }

  const handleResetFilters = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    resetFilters()
  }

  const hasActiveFilters =
    !!filters.search          ||
    filters.isCustomer !== null ||
    filters.isVendor   !== null ||
    filters.isActive   !== null

  const PER_PAGE_OPTIONS: PerPageOption[] = [10, 20, 50, 100]

  const STATUS_OPTIONS: { label: string; value: ActiveStatusFilter }[] = [
    { label: 'All',      value: ActiveStatusFilter.ALL      },
    { label: 'Active',   value: ActiveStatusFilter.ACTIVE   },
    { label: 'Inactive', value: ActiveStatusFilter.INACTIVE },
  ]

  const statusActive = statusFilter !== ActiveStatusFilter.ALL

  return (
    <div className="space-y-2.5">

      {/* ── Search + Status ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400"
            strokeWidth={2}
            aria-hidden
          />
          <input
            type="search"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Search by name, TIN, or phone…"
            aria-label="Search parties"
            autoComplete="off"
            className={cn(
              'h-10 w-full rounded-lg border border-zinc-200 bg-white',
              'pl-9 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400',
              'transition-shadow duration-150',
              'focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500/15',
              'dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500',
              '[&::-webkit-search-cancel-button]:hidden',
            )}
          />
          {inputValue && (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label="Clear search"
              className={cn(
                'absolute right-0 top-1/2 -translate-y-1/2',
                'inline-flex h-10 w-10 items-center justify-center rounded-r-lg',
                'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300',
                'transition-colors',
              )}
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          )}
        </div>

        <StatusDropdown
          value={statusFilter}
          options={STATUS_OPTIONS}
          onChange={setStatusFilter}
        />
      </div>

      {/* ── Role filters + per-page ──────────────────────────────────────── */}
      <div className="flex items-center gap-2">

        <div className="flex flex-1 items-center gap-2">
          <SlidersHorizontal
            className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500"
            strokeWidth={2}
            aria-hidden
          />
          <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">Role</span>

          <FilterChip
            id="filter-customer"
            label="Customer"
            checked={filters.isCustomer === true}
            onChange={toggleCustomerFilter}
            accent="sky"
          />

          <FilterChip
            id="filter-vendor"
            label="Vendor"
            checked={filters.isVendor === true}
            onChange={toggleVendorFilter}
            accent="neutral"
          />

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className={cn(
                'inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-xs font-medium whitespace-nowrap',
                'border border-dashed border-zinc-300 text-zinc-500',
                'transition-colors hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-700',
                'dark:border-zinc-600 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-300',
              )}
            >
              <X className="h-3 w-3" strokeWidth={2.5} />
              Clear
            </button>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700" aria-hidden />
          {totalResults !== undefined && (
            <p className="hidden whitespace-nowrap text-xs text-zinc-400 sm:block dark:text-zinc-500">
              {isFetching ? (
                <span className="animate-pulse">…</span>
              ) : (
                <>
                  <span className="font-medium text-zinc-600 dark:text-zinc-300">
                    {totalResults.toLocaleString()}
                  </span>
                  {' '}{totalResults === 1 ? 'result' : 'results'}
                </>
              )}
            </p>
          )}

          <select
            id="per-page"
            value={filters.perPage}
            onChange={e => setFilter('perPage', Number(e.target.value) as PerPageOption)}
            aria-label="Rows per page"
            title="Rows per page"
            className={cn(
              'h-8 cursor-pointer rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-600',
              'focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500/15',
              'dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
            )}
          >
            {PER_PAGE_OPTIONS.map(n => (
              <option key={n} value={n}>{n} / pg</option>
            ))}
          </select>
        </div>

      </div>

      {/* Mobile-only result count */}
      {totalResults !== undefined && (
        <p className="text-xs text-zinc-400 sm:hidden dark:text-zinc-500">
          {isFetching ? (
            <span className="animate-pulse">Loading…</span>
          ) : (
            <>
              <span className="font-medium text-zinc-600 dark:text-zinc-300">
                {totalResults.toLocaleString()}
              </span>
              {' '}{totalResults === 1 ? 'result' : 'results'}
            </>
          )}
        </p>
      )}

    </div>
  )
}
